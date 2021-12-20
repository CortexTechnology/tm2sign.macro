type Field = string | {[k: string] : Array<Field>}

declare module 'tm2sign.macro' {
    function module (query: string, fields: Array<Field>): any;
    export default module;
}
