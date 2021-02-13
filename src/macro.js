import {createMacro, MacroError} from 'babel-plugin-macros'
import crypto from 'crypto';

const macro = ({references, config}) => {
    const {default: defaultImport = []} = references;
    const {privateKey: privateKeyProperty} = config;
    if (!privateKeyProperty)
        throw new MacroError("Error: privateKey config property is not set")

    const privateKey = `-----BEGIN RSA PRIVATE KEY-----\n${privateKeyProperty}\n-----END RSA PRIVATE KEY-----`;


    defaultImport.forEach(referencePath => {
        if (referencePath.parentPath.type === "CallExpression") {
            const callExpressionPath = referencePath.parentPath;
            const [operationArg, fieldsArg] = callExpressionPath.get("arguments");

            const {value: operation, success: getOperationSuccess} = getArgumentValue(operationArg);
            const {value: fields, success: getFieldsSuccess} = getArgumentValue(fieldsArg);
            if (!getOperationSuccess || !getFieldsSuccess)
                throw new MacroError("Error: Unable to get macro arguments values")

            const signed = sign(privateKey, operation, fields);
            referencePath.parentPath.replaceWithSourceString(JSON.stringify(signed));
        }
    })

}

const getArgumentValue = (argument) => {
    if (argument.evaluateTruthy()) {
        return {success: true, value: argument.evaluate().value};
    }

    if (argument.isArrayExpression()) {
        return getArrayValue(argument);
    } else if (argument.isSpreadElement()) {
        return getSpreadValue(argument);
    } else if (argument.isObjectExpression()) {
        return getObjectValue(argument);
    } else if (argument.isStringLiteral() || argument.isNumericLiteral() || argument.isBooleanLiteral()) {
        return {success: true, value: argument.node.value};
    } else if (argument.isReferencedIdentifier()) {
        const resolved = argument.resolve();
        if (resolved === argument) {
            return {success: false};
        }
        return getArgumentValue(resolved);
    }

    console.log(":(", argument.type);
    return {success: false};
};

const getArrayValue = (arrayExpression) => {
    const result = [];

    for (const arrayElement of arrayExpression.get("elements")) {
        const elementValue = getArgumentValue(arrayElement);
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

const getSpreadValue = (spreadElement) => {
    const argument = spreadElement.get("argument");
    const spreadValue = getArgumentValue(argument);
    return {isSpread: true, ...spreadValue};
};

const getObjectValue = (objectElement) => {
    let result = {};
    for (const objectProperty of objectElement.get("properties")) {
        const key = objectProperty.get("key");
        if (objectProperty.node.computed) {
            console.log("Computed keys are not supported");
            return {success: false};
        }

        const valuePath = objectProperty.get("value");
        if (valuePath.parentPath.isSpreadElement()) {
            const value = getArgumentValue(valuePath.parentPath);
            if (!value.success) return {success: false};

            result = {...result, ...value.value};
        } else {
            if (!key.isIdentifier()) {
                console.log("Unable to get object key");
                return {success: false};
            }

            const value = getArgumentValue(valuePath);
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