import { DBServerConnection, DBQueryParameter, DBTransaction } from "../dbServerConnection";
export declare class SqlServerConnectionOptions {
    user: string;
    password: string;
    server: string;
    database: string;
    port?: number;
    encrypt?: boolean;
}
export declare class SqlServerConnection implements DBServerConnection {
    private connection;
    private static loadParameters(request, queryParameters);
    constructor(options: SqlServerConnectionOptions);
    connect(): Promise<void>;
    createTransaction(): DBTransaction;
    close(): Promise<void>;
    private executeInternal<T>(target, query, ...queryParameters);
    execute<T>(query: string, ...queryParameters: DBQueryParameter[]): Promise<T[]>;
    executeInTransaction<T>(transaction: DBTransaction, query: string, ...queryParameters: DBQueryParameter[]): Promise<T[]>;
    executeNonQuery(query: string, ...queryParameters: DBQueryParameter[]): Promise<void>;
    executeNonQueryInTransaction(transaction: DBTransaction, query: string, ...queryParameters: DBQueryParameter[]): Promise<void>;
}
