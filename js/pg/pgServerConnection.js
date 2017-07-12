"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// PG untyped : Hack because typescript definitions are extremelly incomplete and poor.
let PG = require("pg");
class PoolsTree {
}
class PGTransaction {
    constructor(pool) {
        this.pool = undefined;
        this.client = undefined;
        this.pool = pool;
    }
    begin() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.pool == undefined) {
                throw new Error("Transaction pool is undefined!");
            }
            return new Promise((resolve, reject) => {
                this.pool.connect().then((client) => {
                    this.client = client;
                    this.client.query("BEGIN").then((res) => {
                        resolve();
                    }).catch((e) => {
                        this.client.release();
                        this.client = undefined;
                        reject(e);
                    });
                }).catch((e) => {
                    reject(e);
                });
            });
        });
    }
    commit() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.client == undefined) {
                throw new Error("Transaction client is undefined!");
            }
            return new Promise((resolve, reject) => {
                this.client.query("COMMIT").then((res) => {
                    this.client.release();
                    this.client = undefined;
                    resolve();
                }).catch((e) => {
                    this.client.release();
                    this.client = undefined;
                    reject(e);
                });
            });
        });
    }
    rollback() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.client == undefined) {
                throw new Error("Transaction client is undefined!");
            }
            return new Promise((resolve, reject) => {
                this.client.query("ROLLBACK").then((res) => {
                    this.client.release();
                    this.client = undefined;
                    resolve();
                }).catch((e) => {
                    this.client.release();
                    this.client = undefined;
                    reject(e);
                });
            });
        });
    }
}
let placeholderMatcher = new RegExp("@([a-zA-Z0-9]+)", "g");
let poolsTree = {};
function getPoolFromTree(config) {
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
class PGServerConnection {
    constructor(user, password, database, port) {
        this.pool = undefined;
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
    connect() {
        return __awaiter(this, void 0, void 0, function* () { });
    } // tslint:disable-line
    createTransaction() {
        return new PGTransaction(this.pool);
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () { });
    } // tslint:disable-line
    executeInternal(queriableObject, query, ...queryParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            if (queriableObject == undefined) {
                throw new Error("Cannot execute query on undefined object!");
            }
            let parametersDictionary = {};
            for (let param of queryParameters) {
                parametersDictionary[param.name] = param;
            }
            let parametersArray = [];
            query = query.replace(placeholderMatcher, (match, param) => {
                if (parametersDictionary[param] == undefined) {
                    throw new Error();
                }
                parametersArray.push(parametersDictionary[param].value);
                return `$${parametersArray.length}`;
            });
            return new Promise((resolve, reject) => {
                queriableObject.query(query, parametersArray, (err, res) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(res.rows);
                    }
                });
            });
        });
    }
    execute(query, ...queryParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.executeInternal(this.pool, query, ...queryParameters);
        });
    }
    executeInTransaction(transaction, query, ...queryParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.executeInternal(transaction.client, query, ...queryParameters);
        });
    }
    executeNonQuery(query, ...queryParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.executeInternal(this.pool, query, ...queryParameters);
        });
    }
    executeNonQueryInTransaction(transaction, query, ...queryParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.executeInternal(transaction.client, query, ...queryParameters);
        });
    }
}
exports.PGServerConnection = PGServerConnection;
//# sourceMappingURL=pgServerConnection.js.map