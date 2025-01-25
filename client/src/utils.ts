export function arrayToDict<T>(array: T[], selector: (object: T) => string): Record<string, T> {
    const record: Record<string, T> = {};
    array.forEach(item => record[selector(item)] = item);

    return record;
}

export function arrayToGroups<T>(array: T[], selector: (object: T) => string): Record<string, T[]> {
    const record: Record<string, T[]> = {};
    array.forEach(item => {
        const id = selector(item);
        const group = record[id] || [];

        group.push(item);
        record[id] = group;
        return group;
    });

    return record;
}