"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const MSSQL = require("mssql");
class SqlServerTransaction {
    getInternalTransaction() {
        return this.transaction;
    }
    begin() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.transaction.begin();
        });
    }
    commit() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.transaction.commit();
        });
    }
    rollback() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.transaction.rollback();
        });
    }
    constructor(connection) {
        this.transaction = new MSSQL.Transaction(connection);
    }
}
class SqlServerConnection {
    static loadParameters(request, queryParameters) {
        if (queryParameters != undefined) {
            for (let queryParameter of queryParameters) {
                let mssqlType;
                switch (queryParameter.type) {
                    case 0 /* NVarChar */:
                        mssqlType = MSSQL.NVarChar;
                        break;
                    case 3 /* DateTime */:
                        mssqlType = MSSQL.DateTime;
                        break;
                    case 2 /* Float */:
                        mssqlType = MSSQL.Float;
                        break;
                    case 1 /* Int */:
                        mssqlType = MSSQL.Int;
                        break;
                    case 4 /* Bit */:
                        mssqlType = MSSQL.Bit;
                        break;
                    default:
                        throw new Error("Unhandled MSSQL type.");
                }
                request.input(queryParameter.name, mssqlType, queryParameter.value);
            }
        }
    }
    constructor(user, password, server, database) {
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
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.connection.connect();
        });
    }
    createTransaction() {
        return new SqlServerTransaction(this.connection);
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.connection.close();
        });
    }
    executeInternal(target, query, ...queryParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            if (target == undefined) {
                throw new Error("Target is undefined!");
            }
            if (!(target instanceof MSSQL.Connection)) {
                target = target.getInternalTransaction();
            }
            let request = new MSSQL.Request(target); // HACK: typescript doesn't realize this is a valid parameter
            request.verbose = process.env.NODE_ENV === "development";
            SqlServerConnection.loadParameters(request, queryParameters);
            return request.query(query);
        });
    }
    execute(query, ...queryParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.executeInternal(this.connection, query, ...queryParameters);
        });
    }
    executeInTransaction(transaction, query, ...queryParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.executeInternal(transaction, query, ...queryParameters);
        });
    }
    executeNonQuery(query, ...queryParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.executeInternal(this.connection, query, ...queryParameters);
        });
    }
    executeNonQueryInTransaction(transaction, query, ...queryParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.executeInternal(transaction, query, ...queryParameters);
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SqlServerConnection;
//# sourceMappingURL=sqlServerConnection.js.map