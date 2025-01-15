export enum ComparisonResult {
    REMOTE_NEW,
    LOCAL_NEW,

    LOCAL_DELETED,
    REMOTE_DELETED,

    LOCAL_OLD,
    REMOTE_OLD,

    UP_TO_DATE
}

export interface Comparison {
    path: string,
    result: ComparisonResult
}