import { DBServerConnection, DBQueryParameter, DBTransaction } from "../dbServerConnection";
export declare class PGServerConnection implements DBServerConnection {
    private pool;
    constructor(user: string, password: string, database: string, port: number);
    connect(): Promise<void>;
    createTransaction(): DBTransaction;
    close(): Promise<void>;
    private executeInternal<T>(queriableObject, query, ...queryParameters);
    execute<T>(query: string, ...queryParameters: DBQueryParameter[]): Promise<T[]>;
    executeInTransaction<T>(transaction: DBTransaction, query: string, ...queryParameters: DBQueryParameter[]): Promise<T[]>;
    executeNonQuery(query: string, ...queryParameters: DBQueryParameter[]): Promise<void>;
    executeNonQueryInTransaction(transaction: DBTransaction, query: string, ...queryParameters: DBQueryParameter[]): Promise<void>;
}
