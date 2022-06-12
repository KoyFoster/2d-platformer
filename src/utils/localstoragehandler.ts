export class LocalStorageHandler {
    static Load(name: string): null | string | number | boolean | object {
        const value = localStorage.getItem(name);
        if (value === undefined) return null;
        if (typeof value === 'string' && value[0] === '{') return JSON.parse(value);
        if (typeof value === 'string' && value[0] === '[') return JSON.parse(value);
        return value;
    }
}
