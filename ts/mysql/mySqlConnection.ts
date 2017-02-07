import { DBServerConnection, DBQueryParameter, DBTransaction } from "../dbServerConnection";
import * as MySQL from "mysql";
import Logger from "lagash-logger";

export class MySqlConnection implements DBServerConnection {
    private pool: MySQL.IPool;
    private static placeholderMatcher = new RegExp("@([a-zA-Z0-9]+)", "g");

    constructor(config: MySQL.IPoolConfig) {
        this.pool = MySQL.createPool(config);
    }

    async connect() { } // tslint:disable-line

    createTransaction(): DBTransaction {
        return new MySQLTransaction(this.pool);
    }

    async close() { } // tslint:disable-line

    private async executeInternal<T>(transaction: DBTransaction, query: string, ...parameters: DBQueryParameter[]) {
        return new Promise<T[]>(async (resolve, reject) => {
            let conn: MySQL.IConnection = undefined;
            if (transaction == undefined) {
                conn = await getConnection(this.pool);
            } else {
                conn = (transaction as MySQLTransaction).getInternalConnection();
            }

            let parametersDictionary = {};

            for (let param of parameters) {
                parametersDictionary[param.name] = param;
            }

            let parametersArray: any[] = [];

            let error: any = undefined;

            query = query.replace(MySqlConnection.placeholderMatcher, (match: string, param: string) => {
                if (parametersDictionary[param] == undefined) {
                    error = new Error(`Parameter ${param} not found`);
                    return "";
                }
                parametersArray.push(parametersDictionary[param].value);
                return "?";
            });

            if (error) {
                reject(error);
            }

            query = MySQL.format(query, parametersArray);

            const maxRetries = 2;
            let nRetries = 0;

            let queryHandler = (err: MySQL.IError, rows: any, fields: any) => {
                if (transaction == null) {
                    conn.release();
                }
                if (err) {
                    // If deadlock detected, try again as per: http://dev.mysql.com/doc/refman/5.7/en/innodb-deadlocks-handling.html
                    if (nRetries < maxRetries && (err.errno === 1213 || err.errno === 1205)) { // ER_LOCK_DEADLOCK, ER_LOCK_WAIT_TIMEOUT      
                        (new Logger("mySql")).warn("Deadlock detected, retrying...");
                        nRetries++;
                        conn.query(query, queryHandler);
                    } else {
                        reject(err);
                    }
                    return;
                }
                resolve(rows);
            };

            conn.query(query, queryHandler);
        });
    }

    async executeInTransaction<T>(transaction: DBTransaction, query: string, ...parameters: DBQueryParameter[]) {
        return this.executeInternal<T>(transaction, query, ...parameters);
    }

    async execute<T>(query: string, ...parameters: DBQueryParameter[]) {
        return this.executeInternal<T>(undefined, query, ...parameters);
    }

    private async executeNonQueryInternal(transaction: DBTransaction, query: string, ...parameters: DBQueryParameter[]) {
        await this.executeInternal(transaction, query, ...parameters);
        return;
    }

    async executeNonQueryInTransaction(transaction: DBTransaction, query: string, ...parameters: DBQueryParameter[]) {
        return this.executeNonQueryInternal(transaction, query, ...parameters);
    }

    async executeNonQuery(query: string, ...parameters: DBQueryParameter[]) {
        return this.executeNonQueryInternal(undefined, query, ...parameters);
    }
}

async function getConnection(pool: MySQL.IPool): Promise<MySQL.IConnection> {
    return new Promise<MySQL.IConnection>((resolve, reject) => {
        pool.getConnection((err: any, conn: MySQL.IConnection) => {
            if (err) {
                reject(err);
            } else {
                resolve(conn);
            }
        });
    });
}

class MySQLTransaction implements DBTransaction {
    private connection: MySQL.IConnection;
    private pool: MySQL.IPool;

    constructor(pool: MySQL.IPool) {
        this.pool = pool;
    }

    getInternalConnection(): MySQL.IConnection {
        return this.connection;
    }

    async begin(): Promise<void> {
        await this.executeNonQuery("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
        return this.executeNonQuery("START TRANSACTION");
    }

    async commit(): Promise<void> {
        await this.executeNonQuery("COMMIT");
        this.connection.release();
    }

    async rollback(): Promise<void> {
        await this.executeNonQuery("ROLLBACK");
        this.connection.release();
    }

    async executeNonQuery(query: string) {
        if (this.connection == undefined) {
            this.connection = await getConnection(this.pool);
        }

        return new Promise<void>((resolve, reject) => {
            this.connection.query(query, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}