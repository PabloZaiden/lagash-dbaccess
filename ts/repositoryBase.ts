import Config from "lagash-config";
import { DBTransaction, DBQueryParameter, DBServerConnection } from "./dbServerConnection";
import Logger from "lagash-logger";

import SqlServerConnection from "./mssql/sqlServerConnection";
import MySqlConnection from "./mysql/mySqlConnection";

export default class RepositoryBase {

    private static connection: DBServerConnection = undefined;
    protected logger: Logger;
    private transaction: DBTransaction = undefined;
    private transactionedRepositories: RepositoryBase[] = [];

    constructor() {
        if (RepositoryBase.connection == undefined) {
            throw new Error("Connection has not been initialized! (Have you called RepositoryBase.connect() before creating a new instance?)");
        }
        this.logger = new Logger("sql");
    }

    static async connect(): Promise<void> {
        if (RepositoryBase.connection == undefined) {
            
            RepositoryBase.connection = new MySqlConnection({
                host: Config.get("mysqlHost"),
                user: Config.get("mysqlUser"),
                password: Config.get("mysqlPassword"),
                database: Config.get("mysqlDb"),
                timezone: "utc"
            });
            
            return RepositoryBase.connection.connect();
        }
    }

    async dispose(): Promise<void> { } // tslint:disable-line

    beginTransaction(): Promise<void> {
        if (this.transaction != undefined) {
            throw new Error("Transaction already in progress.");
        }
        this.transaction = RepositoryBase.connection.createTransaction();
        this.transactionedRepositories.push(this);
        return this.transaction.begin();
    }

    async commitTransaction(): Promise<void> {
        if (this.transaction == undefined) {
            throw new Error("Transaction is undefined.");
        }
        let transaction = this.transaction;
        this.cleanTransaction();
        return transaction.commit();
    }

    async rollbackTransaction(): Promise<void> {
        if (this.transaction == undefined) {
            throw new Error("Transaction is undefined.");
        }
        let transaction = this.transaction;
        this.cleanTransaction();
        return transaction.rollback();
    }

    private cleanTransaction(): void {
        for (let repo of this.transactionedRepositories) {
            repo.transaction = undefined;
        }
    }

    joinOtherRepositoryToCurrentTransaction(repository: RepositoryBase): void {
        if (this.transaction == undefined) {
            throw new Error("There is no current transaction.");
        }
        repository.transaction = this.transaction;
        this.transactionedRepositories.push(repository);
        repository.transactionedRepositories = this.transactionedRepositories;
    }

    protected async execute<T>(query: string, ...queryParameters: DBQueryParameter[]): Promise<T[]> {
        if (this.transaction != undefined) {
            return RepositoryBase.connection.executeInTransaction<T>(this.transaction, query, ...queryParameters);
        } else {
            return RepositoryBase.connection.execute<T>(query, ...queryParameters);
        }
    }

    protected async executeNonQuery<T>(query: string, ...queryParameters: DBQueryParameter[]): Promise<void> {
        if (this.transaction != undefined) {
            return RepositoryBase.connection.executeNonQueryInTransaction(this.transaction, query, ...queryParameters);
        } else {
            return RepositoryBase.connection.executeNonQuery(query, ...queryParameters);
        }
    }

}
