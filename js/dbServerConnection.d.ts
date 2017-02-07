export interface DBTransaction {
    begin(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
}
export declare const enum DBTypes {
    NVarChar = 0,
    Int = 1,
    Float = 2,
    DateTime = 3,
    Bit = 4,
}
export declare class DBQueryParameter {
    name: string;
    value: any;
    type: DBTypes;
    constructor(name: string, value: any, type: DBTypes);
}
export interface DBServerConnection {
    connect(): Promise<void>;
    createTransaction(): DBTransaction;
    close(): Promise<void>;
    execute<T>(query: string, ...queryParameters: DBQueryParameter[]): Promise<T[]>;
    executeInTransaction<T>(transaction: DBTransaction, query: string, ...queryParameters: DBQueryParameter[]): Promise<T[]>;
    executeNonQuery(query: string, ...queryParameters: DBQueryParameter[]): Promise<void>;
    executeNonQueryInTransaction(transaction: DBTransaction, query: string, ...queryParameters: DBQueryParameter[]): Promise<void>;
}
