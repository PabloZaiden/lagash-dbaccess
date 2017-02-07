"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const MySQL = require("mysql");
const lagash_logger_1 = require("lagash-logger");
class MySqlConnection {
    constructor(config) {
        this.pool = MySQL.createPool(config);
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () { });
    } // tslint:disable-line
    createTransaction() {
        return new MySQLTransaction(this.pool);
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () { });
    } // tslint:disable-line
    executeInternal(transaction, query, ...parameters) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let conn = undefined;
                if (transaction == undefined) {
                    conn = yield getConnection(this.pool);
                }
                else {
                    conn = transaction.getInternalConnection();
                }
                let parametersDictionary = {};
                for (let param of parameters) {
                    parametersDictionary[param.name] = param;
                }
                let parametersArray = [];
                let error = undefined;
                query = query.replace(MySqlConnection.placeholderMatcher, (match, param) => {
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
                let queryHandler = (err, rows, fields) => {
                    if (transaction == null) {
                        conn.release();
                    }
                    if (err) {
                        // If deadlock detected, try again as per: http://dev.mysql.com/doc/refman/5.7/en/innodb-deadlocks-handling.html
                        if (nRetries < maxRetries && (err.errno === 1213 || err.errno === 1205)) {
                            (new lagash_logger_1.default("mySql")).warn("Deadlock detected, retrying...");
                            nRetries++;
                            conn.query(query, queryHandler);
                        }
                        else {
                            reject(err);
                        }
                        return;
                    }
                    resolve(rows);
                };
                conn.query(query, queryHandler);
            }));
        });
    }
    executeInTransaction(transaction, query, ...parameters) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.executeInternal(transaction, query, ...parameters);
        });
    }
    execute(query, ...parameters) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.executeInternal(undefined, query, ...parameters);
        });
    }
    executeNonQueryInternal(transaction, query, ...parameters) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.executeInternal(transaction, query, ...parameters);
            return;
        });
    }
    executeNonQueryInTransaction(transaction, query, ...parameters) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.executeNonQueryInternal(transaction, query, ...parameters);
        });
    }
    executeNonQuery(query, ...parameters) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.executeNonQueryInternal(undefined, query, ...parameters);
        });
    }
}
MySqlConnection.placeholderMatcher = new RegExp("@([a-zA-Z0-9]+)", "g");
exports.MySqlConnection = MySqlConnection;
function getConnection(pool) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            pool.getConnection((err, conn) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(conn);
                }
            });
        });
    });
}
class MySQLTransaction {
    constructor(pool) {
        this.pool = pool;
    }
    getInternalConnection() {
        return this.connection;
    }
    begin() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.executeNonQuery("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
            return this.executeNonQuery("START TRANSACTION");
        });
    }
    commit() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.executeNonQuery("COMMIT");
            this.connection.release();
        });
    }
    rollback() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.executeNonQuery("ROLLBACK");
            this.connection.release();
        });
    }
    executeNonQuery(query) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.connection == undefined) {
                this.connection = yield getConnection(this.pool);
            }
            return new Promise((resolve, reject) => {
                this.connection.query(query, (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            });
        });
    }
}
//# sourceMappingURL=mySqlConnection.js.map