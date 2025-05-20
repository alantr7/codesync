export function matchPath(path: string, query: string) {
    query = query.toLowerCase();
    
    const nameIndex = path.lastIndexOf('/');
    const fileName = path.substring(nameIndex === -1 ? 0 : (1 + nameIndex));

    return fileName.toLowerCase().includes(query);
}