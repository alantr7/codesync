export function arrayToDict<T>(array: T[], selector: (object: T) => string): Record<string, T> {
    const record: Record<string, T> = {};
    array.forEach(item => record[selector(item)] = item);

    return record;
}