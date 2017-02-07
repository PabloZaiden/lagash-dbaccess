import { DBServerConnection, DBQueryParameter, DBTransaction } from "../dbServerConnection";

// PG untyped : Hack because typescript definitions are extremelly incomplete and poor.
let PG: any = require("pg");

class PoolsTree {
    [user: string]: {
        [password: string]: {
            [database: string]: {
                [port: number]: any
            }
        }
    }
}

interface PGPoolConfig {
    user: string;
    password: string;
    database: string;
    port: number;
    max: number;
    idleTimeoutMillis: number;
}

class PGTransaction implements DBTransaction {
    pool: any = undefined;
    client: any = undefined;

    async begin(): Promise<void> {
        if (this.pool == undefined) {
            throw new Error("Transaction pool is undefined!");
        }

        return new Promise<void>((resolve, reject) => {
            this.pool.connect().then((client: any) => {
                this.client = client;
                this.client.query("BEGIN").then((res: any) => {
                    resolve();
                }).catch((e: any) => {
                    this.client.release();
                    this.client = undefined;
                    reject(e);
                });
            }).catch((e: any) => {
                reject(e);
            });
        });
    }

    async commit(): Promise<void> {
        if (this.client == undefined) {
            throw new Error("Transaction client is undefined!");
        }

        return new Promise<void>((resolve, reject) => {
            this.client.query("COMMIT").then((res: any) => {
                this.client.release();
                this.client = undefined;
                resolve();
            }).catch((e: any) => {
                this.client.release();
                this.client = undefined;
                reject(e);
            });
        });
    }

    async rollback(): Promise<void> {
        if (this.client == undefined) {
            throw new Error("Transaction client is undefined!");
        }

        return new Promise<void>((resolve, reject) => {
            this.client.query("ROLLBACK").then((res: any) => {
                this.client.release();
                this.client = undefined;
                resolve();
            }).catch((e: any) => {
                this.client.release();
                this.client = undefined;
                reject(e);
            });
        });
    }

    constructor(pool: any) {
        this.pool = pool;
    }
}

let placeholderMatcher = new RegExp("@([A-Za-z_]\w*?)", "g");

let poolsTree: PoolsTree = {};

function getPoolFromTree(config: PGPoolConfig) {
    if (poolsTree[config.user] == undefined) {
        poolsTree[config.user] = {};
    }

    if (poolsTree[config.user][config.password] == undefined) {
        poolsTree[config.user][config.password] = {};
    }
    if (poolsTree[config.user][config.password][config.database] == undefined) {
        poolsTree[config.user][config.password][config.database] = {};
    }

    if (poolsTree[config.user][config.password][config.database][config.port] == undefined) {
        poolsTree[config.user][config.password][config.database][config.port] = new PG.Pool(config);
    }

    return poolsTree[config.user][config.password][config.database][config.port];
}

export default class PGServerConnection implements DBServerConnection {

    private pool: any = undefined;

    constructor(user: string, password: string, database: string, port: number) {
        let config = {
            user: user,
            password: password,
            database: database,

            port: port,
            max: 10,
            idleTimeoutMillis: 30000
        };

        this.pool = getPoolFromTree(config);
    }

    async connect(): Promise<void> { } // tslint:disable-line

    createTransaction(): DBTransaction {
        return new PGTransaction(this.pool);
    }

    async close(): Promise<void> { } // tslint:disable-line

    private async executeInternal<T>(queriableObject: any, query: string, ...queryParameters: DBQueryParameter[]): Promise<T[]> {

        if (queriableObject == undefined) {
            throw new Error("Cannot execute query on undefined object!");
        }

        let parametersDictionary = {};

        for (let param of queryParameters) {
            parametersDictionary[param.name] = param;
        }

        let parametersArray: any[] = [];

        query = query.replace(placeholderMatcher, (match: string, param: string) => {
            if (parametersDictionary[param] == undefined) {
                throw new Error();
            }
            parametersArray.push(parametersDictionary[param].value);
            return `{${parametersArray.length}}`;
        });

        return new Promise<T[]>((resolve, reject) => {
            queriableObject.query(query, parametersArray, (err: any, res: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res.rows);
                }
            });
        });
    }

    async execute<T>(query: string, ...queryParameters: DBQueryParameter[]): Promise<T[]> {
        return this.executeInternal<T>(this.pool, query, ...queryParameters);
    }

    async executeInTransaction<T>(transaction: DBTransaction, query: string, ...queryParameters: DBQueryParameter[]): Promise<T[]> {
        return this.executeInternal<T>((transaction as PGTransaction).client, query, ...queryParameters);
    }

    async executeNonQuery(query: string, ...queryParameters: DBQueryParameter[]): Promise<void> {
        return this.executeInternal<void>(this.pool, query, ...queryParameters) as Promise<any>;
    }

    async executeNonQueryInTransaction(transaction: DBTransaction, query: string, ...queryParameters: DBQueryParameter[]): Promise<void> {
        return this.executeInternal<void>((transaction as PGTransaction).client, query, ...queryParameters) as Promise<any>;
    }
}