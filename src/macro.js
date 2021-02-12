import {createMacro, MacroError} from 'babel-plugin-macros'
import crypto from 'crypto';

const macro = ({references, config}) => {
    const {default: defaultImport = []} = references;
    const {privateKey: privateKeyProperty} = config;
    if (!privateKeyProperty)
        throw new MacroError("Error: privateKey config property is not set")

    const privateKey = `-----BEGIN RSA PRIVATE KEY-----\n${privateKeyProperty}\n-----END RSA PRIVATE KEY-----`;

    console.log("privateKey", privateKey);

    defaultImport.forEach(referencePath => {
        if (referencePath.parentPath.type === "CallExpression") {
            const callExpressionPath = referencePath.parentPath;
            const [operationArg, fieldsArg] = callExpressionPath.get("arguments");
            const operation = operationArg.evaluate().value;
            const fields = fieldsArg.evaluate().value;

            const signed = sign(privateKey, operation, fields);
            referencePath.parentPath.replaceWithSourceString(JSON.stringify(signed));
        }
    })

}

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