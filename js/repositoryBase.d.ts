import { DBQueryParameter, DBServerConnection } from "./dbServerConnection";
import Logger from "lagash-logger";
export declare class RepositoryBase {
    private static defaultConnectionName;
    private static connections;
    protected logger: Logger;
    private transaction;
    private transactionedRepositories;
    private connectionName;
    constructor(connectionName?: string);
    static connect(connection: DBServerConnection, connectionName?: string): Promise<void>;
    private getConnection();
    dispose(): Promise<void>;
    beginTransaction(): Promise<void>;
    commitTransaction(): Promise<void>;
    rollbackTransaction(): Promise<void>;
    private cleanTransaction();
    joinOtherRepositoryToCurrentTransaction(repository: RepositoryBase): void;
    protected execute<T>(query: string, ...queryParameters: DBQueryParameter[]): Promise<T[]>;
    protected executeNonQuery<T>(query: string, ...queryParameters: DBQueryParameter[]): Promise<void>;
}
