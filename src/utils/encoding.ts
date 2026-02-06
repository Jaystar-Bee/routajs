export function encodeParam(text: string | number): string {
    return encodeURIComponent('' + text);
}

export function decode(text: string | number): string {
    try {
        return decodeURIComponent('' + text);
    } catch (err) {
        console.warn(`[routajs] Could not decode "${text}".`);
        return '' + text;
    }
}
