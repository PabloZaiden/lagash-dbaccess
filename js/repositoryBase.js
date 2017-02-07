"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const lagash_logger_1 = require("lagash-logger");
class RepositoryBase {
    constructor() {
        this.transaction = undefined;
        this.transactionedRepositories = [];
        if (RepositoryBase.connection == undefined) {
            throw new Error("Connection has not been initialized! (Have you called RepositoryBase.connect() before creating a new instance?)");
        }
        this.logger = new lagash_logger_1.default("sql");
    }
    static connect(connection) {
        return __awaiter(this, void 0, void 0, function* () {
            if (RepositoryBase.connection == undefined) {
                RepositoryBase.connection = connection;
                return RepositoryBase.connection.connect();
            }
        });
    }
    dispose() {
        return __awaiter(this, void 0, void 0, function* () { });
    } // tslint:disable-line
    beginTransaction() {
        if (this.transaction != undefined) {
            throw new Error("Transaction already in progress.");
        }
        this.transaction = RepositoryBase.connection.createTransaction();
        this.transactionedRepositories.push(this);
        return this.transaction.begin();
    }
    commitTransaction() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.transaction == undefined) {
                throw new Error("Transaction is undefined.");
            }
            let transaction = this.transaction;
            this.cleanTransaction();
            return transaction.commit();
        });
    }
    rollbackTransaction() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.transaction == undefined) {
                throw new Error("Transaction is undefined.");
            }
            let transaction = this.transaction;
            this.cleanTransaction();
            return transaction.rollback();
        });
    }
    cleanTransaction() {
        for (let repo of this.transactionedRepositories) {
            repo.transaction = undefined;
        }
    }
    joinOtherRepositoryToCurrentTransaction(repository) {
        if (this.transaction == undefined) {
            throw new Error("There is no current transaction.");
        }
        repository.transaction = this.transaction;
        this.transactionedRepositories.push(repository);
        repository.transactionedRepositories = this.transactionedRepositories;
    }
    execute(query, ...queryParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.transaction != undefined) {
                return RepositoryBase.connection.executeInTransaction(this.transaction, query, ...queryParameters);
            }
            else {
                return RepositoryBase.connection.execute(query, ...queryParameters);
            }
        });
    }
    executeNonQuery(query, ...queryParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.transaction != undefined) {
                return RepositoryBase.connection.executeNonQueryInTransaction(this.transaction, query, ...queryParameters);
            }
            else {
                return RepositoryBase.connection.executeNonQuery(query, ...queryParameters);
            }
        });
    }
}
RepositoryBase.connection = undefined;
exports.RepositoryBase = RepositoryBase;
//# sourceMappingURL=repositoryBase.js.map