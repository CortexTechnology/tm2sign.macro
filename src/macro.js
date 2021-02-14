import {createMacro, MacroError} from 'babel-plugin-macros'
import crypto from 'crypto';
import fs from "fs";
import * as path from "path";
import {parse} from "@babel/core";
import traverse from '@babel/traverse';

const macro = ({references, state, config}) => {
    const {default: defaultImport = []} = references;
    const {privateKey: privateKeyProperty} = config;
    if (!privateKeyProperty)
        throw new MacroError("Error: privateKey config property is not set")

    const privateKey = `-----BEGIN RSA PRIVATE KEY-----\n${privateKeyProperty}\n-----END RSA PRIVATE KEY-----`;

    const currentDirectory = path.dirname(state.file.opts.filename);

    defaultImport.forEach(referencePath => {
        if (referencePath.parentPath.type === "CallExpression") {
            const callExpressionPath = referencePath.parentPath;
            const [operationArg, fieldsArg] = callExpressionPath.get("arguments");

            const {value: operation, success: getOperationSuccess} = getArgumentValue(operationArg, currentDirectory);
            const {value: fields, success: getFieldsSuccess} = getArgumentValue(fieldsArg, currentDirectory);

            if (!getOperationSuccess || !getFieldsSuccess)
                throw new MacroError("Error: Unable to get macro arguments values")

            const signed = sign(privateKey, operation, fields);
            referencePath.parentPath.replaceWithSourceString(JSON.stringify(signed));
        }
    })

}

const getArgumentValue = (argument, currentDirectory) => {
    if (argument.evaluateTruthy()) {
        return {success: true, value: argument.evaluate().value};
    }

    if (argument.isArrayExpression()) {
        return getArrayValue(argument, currentDirectory);
    } else if (argument.isSpreadElement()) {
        return getSpreadValue(argument, currentDirectory);
    } else if (argument.isObjectExpression()) {
        return getObjectValue(argument, currentDirectory);
    } else if (argument.isStringLiteral() || argument.isNumericLiteral() || argument.isBooleanLiteral()) {
        return {success: true, value: argument.node.value};
    } else if (argument.isReferencedIdentifier()) {
        const resolved = argument.resolve();
        if (resolved === argument) {
            const binding = argument.scope.getBinding(argument.node.name)
            if (binding && binding.kind === 'module' && binding.path.parentPath.isImportDeclaration()) {
                return processImportBinding(binding, currentDirectory);
            }
        }
        return getArgumentValue(resolved, currentDirectory);
    }

    console.log(":(", argument.type, currentDirectory);
    return {success: false};
};

const processImportBinding = (binding, currentDirectory) => {
    const bindingPath = binding.path.parentPath
    const sourcePath = currentDirectory + "/" + bindingPath.node.source.value
    const p = fs.existsSync(sourcePath + '.js') ? sourcePath + '.js' : sourcePath + '.tsx'
    const code = fs.readFileSync(p, 'utf8')

    const variableName = binding.identifier.name;
    const variablePath = getPath(code, variableName);
    if (variablePath) {
        return getArgumentValue(variablePath, path.dirname(p));
    }

    console.log(`${variableName} not found in ${sourcePath}`)
    return {success: false}
}

function getPath(code, name) {
    const ast = parse(code);
    let path;
    traverse(ast, {
        VariableDeclaration: function (_path) {
            const init = _path.get("declarations").find(d => d.node.id.name === name);
            if (init) {
                path = init.get("init");
                _path.stop();
            }
        },
    });
    return path;
}

const getArrayValue = (arrayExpression, state) => {
    const result = [];

    for (const arrayElement of arrayExpression.get("elements")) {
        const elementValue = getArgumentValue(arrayElement, state);
        if (elementValue.success) {
            if (elementValue.isSpread) {
                result.push(...elementValue.value);
            } else {
                result.push(elementValue.value);
            }
        } else {
            return {success: false};
        }
    }
    return {success: true, value: result};
};

const getSpreadValue = (spreadElement, state) => {
    const argument = spreadElement.get("argument");
    const spreadValue = getArgumentValue(argument, state);
    return {isSpread: true, ...spreadValue};
};

const getObjectValue = (objectElement, state) => {
    let result = {};
    for (const objectProperty of objectElement.get("properties")) {
        const key = objectProperty.get("key");
        if (objectProperty.node.computed) {
            console.log("Computed keys are not supported");
            return {success: false};
        }

        const valuePath = objectProperty.get("value");
        if (valuePath.parentPath.isSpreadElement()) {
            const value = getArgumentValue(valuePath.parentPath, state);
            if (!value.success) return {success: false};

            result = {...result, ...value.value};
        } else {
            if (!key.isIdentifier()) {
                console.log("Unable to get object key");
                return {success: false};
            }

            const value = getArgumentValue(valuePath, state);
            if (!value.success) return {success: false};

            result = {...result, [key.node.name]: value.value};
        }
    }

    return {success: true, value: result};
};


const sign = (privateKey, operation, fields) => {
    const dataToSign = JSON.stringify({[operation]: fields});

    const signerObject = crypto.createSign("RSA-SHA512");
    signerObject.update(dataToSign);
    const signature = signerObject.sign(privateKey, 'base64');
    return {
        signature,
        fields
    }
}

export default createMacro(macro, {configName: 'tm2SignConfig'})