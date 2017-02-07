import * as MSSQL from "mssql";
import { DBServerConnection, DBQueryParameter, DBTransaction, DBTypes } from "../dbServerConnection";

class SqlServerTransaction implements DBTransaction {
    private transaction: MSSQL.Transaction;

    getInternalTransaction(): MSSQL.Transaction {
        return this.transaction;
    }

    async begin(): Promise<void> {
        return this.transaction.begin();
    }

    async commit(): Promise<void> {
        return this.transaction.commit();
    }

    async rollback(): Promise<void> {
        return this.transaction.rollback();
    }

    constructor(connection: MSSQL.Connection) {
        this.transaction = new MSSQL.Transaction(connection);
    }
}

export default class SqlServerConnection implements DBServerConnection {

    private connection: MSSQL.Connection;

    private static loadParameters(request: MSSQL.Request, queryParameters: DBQueryParameter[]): void {
        if (queryParameters != undefined) {
            for (let queryParameter of queryParameters) {
                let mssqlType: any;

                switch (queryParameter.type) {
                    case DBTypes.NVarChar:
                        mssqlType = MSSQL.NVarChar;
                        break;
                    case DBTypes.DateTime:
                        mssqlType = MSSQL.DateTime;
                        break;
                    case DBTypes.Float:
                        mssqlType = MSSQL.Float;
                        break;
                    case DBTypes.Int:
                        mssqlType = MSSQL.Int;
                        break;
                    case DBTypes.Bit:
                        mssqlType = MSSQL.Bit;
                        break;
                    default:
                        throw new Error("Unhandled MSSQL type.");
                }

                request.input(queryParameter.name, mssqlType, queryParameter.value);
            }
        }
    }

    constructor(user: string, password: string, server: string, database: string) {
        let config = {
            user: user,
            password: password,
            server: server,
            database: database,
            pool: {
                max: 30,
                min: 0,
                idleTimeoutMillis: 30000
            },
            options: {
                encrypt: true
            }
        };

        this.connection = new MSSQL.Connection(config);
    }
    async connect(): Promise<void> {
        await this.connection.connect();
    }

    createTransaction(): DBTransaction {
        return new SqlServerTransaction(this.connection);
    }

    async close(): Promise<void> {
        return this.connection.close();
    }

    private async executeInternal<T>(target: MSSQL.Connection | DBTransaction, query: string, ...queryParameters: DBQueryParameter[]): Promise<T[]> {
        if (target == undefined) {
            throw new Error("Target is undefined!");
        }

        if (!(target instanceof MSSQL.Connection)) {
            target = (target as SqlServerTransaction).getInternalTransaction();
        }

        let request = new MSSQL.Request(target as any); // HACK: typescript doesn't realize this is a valid parameter

        request.verbose = process.env.NODE_ENV === "development";

        SqlServerConnection.loadParameters(request, queryParameters);

        return request.query<T>(query);
    }

    async execute<T>(query: string, ...queryParameters: DBQueryParameter[]): Promise<T[]> {
        return this.executeInternal<T>(this.connection, query, ...queryParameters);
    }

    async executeInTransaction<T>(transaction: DBTransaction, query: string, ...queryParameters: DBQueryParameter[]): Promise<T[]> {
        return this.executeInternal<T>(transaction, query, ...queryParameters);
    }

    async executeNonQuery(query: string, ...queryParameters: DBQueryParameter[]): Promise<void> {
        return this.executeInternal<void>(this.connection, query, ...queryParameters) as Promise<any>;
    }

    async executeNonQueryInTransaction(transaction: DBTransaction, query: string, ...queryParameters: DBQueryParameter[]): Promise<void> {
        return this.executeInternal<void>(transaction, query, ...queryParameters) as Promise<any>;
    }
}