import Config from "lagash-config";
import { DBTransaction, DBQueryParameter, DBServerConnection } from "./dbServerConnection";
import Logger from "lagash-logger";

interface Dictionary<T> {
    [key: string]: T
}

export class RepositoryBase {

    private static defaultConnectionName = "default";

    private static connections: Dictionary<DBServerConnection> = {};
    protected logger: Logger;
    private transaction: DBTransaction = undefined;
    private transactionedRepositories: RepositoryBase[] = [];
    private connectionName: string;

    constructor(connectionName = RepositoryBase.defaultConnectionName) {
        if (RepositoryBase.connections[connectionName] == undefined) {
            throw new Error("Connection has not been initialized! (Have you called RepositoryBase.connect() before creating a new instance?)");
        }
        this.connectionName = connectionName;
        this.logger = new Logger("sql");
    }

    static async connect(connection: DBServerConnection, connectionName = RepositoryBase.defaultConnectionName): Promise<void> {
        if (RepositoryBase.connections[connectionName] == undefined) {
            
            RepositoryBase.connections[connectionName] = connection;
            return RepositoryBase.connections[connectionName].connect();
        }
    }

    private getConnection() {
        return RepositoryBase.connections[this.connectionName];
    }

    async dispose(): Promise<void> { } // tslint:disable-line

    beginTransaction(): Promise<void> {
        if (this.transaction != undefined) {
            throw new Error("Transaction already in progress.");
        }
        this.transaction = this.getConnection().createTransaction();
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

        if (repository.connectionName != this.connectionName) {
            throw new Error("Both repositories must use the same connection");
        }
        
        repository.transaction = this.transaction;
        this.transactionedRepositories.push(repository);
        repository.transactionedRepositories = this.transactionedRepositories;
    }

    protected async execute<T>(query: string, ...queryParameters: DBQueryParameter[]): Promise<T[]> {
        if (this.transaction != undefined) {
            return this.getConnection().executeInTransaction<T>(this.transaction, query, ...queryParameters);
        } else {
            return this.getConnection().execute<T>(query, ...queryParameters);
        }
    }

    protected async executeNonQuery<T>(query: string, ...queryParameters: DBQueryParameter[]): Promise<void> {
        if (this.transaction != undefined) {
            return this.getConnection().executeNonQueryInTransaction(this.transaction, query, ...queryParameters);
        } else {
            return this.getConnection().executeNonQuery(query, ...queryParameters);
        }
    }

}
