

export interface DBTransaction {
    begin(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
}

export const enum DBTypes {
    NVarChar,
    Int,
    Float,
    DateTime,
    Bit
}

export class DBQueryParameter {
    public name: string;
    public value: any;
    public type: DBTypes;

    constructor(name: string, value: any, type: DBTypes) {
        this.name = name;
        this.value = value;
        this.type = type;
    }
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
