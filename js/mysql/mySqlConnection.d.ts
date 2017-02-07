import { DBServerConnection, DBQueryParameter, DBTransaction } from "../dbServerConnection";
import * as MySQL from "mysql";
export declare class MySqlConnection implements DBServerConnection {
    private pool;
    private static placeholderMatcher;
    constructor(config: MySQL.IPoolConfig);
    connect(): Promise<void>;
    createTransaction(): DBTransaction;
    close(): Promise<void>;
    private executeInternal<T>(transaction, query, ...parameters);
    executeInTransaction<T>(transaction: DBTransaction, query: string, ...parameters: DBQueryParameter[]): Promise<T[]>;
    execute<T>(query: string, ...parameters: DBQueryParameter[]): Promise<T[]>;
    private executeNonQueryInternal(transaction, query, ...parameters);
    executeNonQueryInTransaction(transaction: DBTransaction, query: string, ...parameters: DBQueryParameter[]): Promise<void>;
    executeNonQuery(query: string, ...parameters: DBQueryParameter[]): Promise<void>;
}
