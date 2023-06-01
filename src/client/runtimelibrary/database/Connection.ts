import { DatabaseData, SendingStatementsMessageFromServer } from "../../communication/Data.js";
import { Main } from "../../main/Main.js";
import { DatabaseTool, QueryResult } from "../../tools/database/DatabaseTool.js";
import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { DatabaseLongPollingListener } from "../../tools/database/DatabaseLongPollingListener.js";
import { stringPrimitiveType, voidPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { PreparedStatementHelper } from "./DatabasePreparedStatement.js";
import { DatabaseSSEListener } from "../../tools/database/DatabaseSSEListener.js";

export class ConnectionClass extends Klass {

    constructor(module: Module) {
        super("Connection", module, "Ein Connection-Objekt repräsentiert die Verbindung zu einer Datenbank auf www.sql-ide.de");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));
        let preparedStatementType = <Klass>module.typeStore.getType("PreparedStatement");
        let statementType = <Klass>module.typeStore.getType("Statement");

        this.addMethod(new Method("createStatement", new Parameterlist([
        ]), statementType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ch: ConnectionHelper = o.intrinsicData["Helper"];

                let stmt: RuntimeObject = new RuntimeObject(statementType);
                stmt.intrinsicData["ConnectionHelper"] = ch;

                return stmt;

            }, false, false, 'Erstellt ein Statement-Objekt, mit dem Statements zur Datenbank geschickt werden können.',
            false));

        this.addMethod(new Method("prepareStatement", new Parameterlist([
            { identifier: "query", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), preparedStatementType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let query: string = parameters[1].value;

                let ch: ConnectionHelper = o.intrinsicData["Helper"];

                let stmt: RuntimeObject = new RuntimeObject(preparedStatementType);
                stmt.intrinsicData["Helper"] = new PreparedStatementHelper(ch, query);

                return stmt;

            }, false, false, 'Erstellt ein PreparedStatement-Objekt, mit dem Anweisungen zur Datenbank geschickt werden können.',
            false));

        this.addMethod(new Method("close", new Parameterlist([
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ch: ConnectionHelper = o.intrinsicData["Helper"];

                ch.close();

            }, false, false, 'Schließt die Verbindung zur Datenbank.',
            false));

    }

}


export class ConnectionHelper {

    database: DatabaseTool;
    databaseData: DatabaseData;
    token: string;
    databaseSSEListener: DatabaseSSEListener;

    constructor(private main: Main) {

        main.getInterpreter().registerDatabaseConnection(this);

    }

    connect(code: string, callback: (error: string) => void) {
        let that = this;
        this.main.networkManager.fetchDatabaseAndToken(code, (dbData, token, error) => {
            if (error == null) {
                that.token = token;
                that.databaseData = dbData;
                that.database = new DatabaseTool(that.main);
                that.database.initializeWorker(dbData.templateDump, dbData.statements, (error) => {

                    that.databaseSSEListener = new DatabaseSSEListener(that.main.networkManager,
                        that.token, dbData.id, (firstNewStatementIndex, newStatements, rollbackToVersion) => {
                            that.onServerSentStatements(firstNewStatementIndex, newStatements, rollbackToVersion);
                        })

                    callback(null);
                });
            } else {
                callback(error);
            }
        })
    }

    close() {
        if (this.databaseSSEListener != null) {
            this.databaseSSEListener.close();
            this.databaseSSEListener = null;
        }

        if(this.database != null){
            this.database.close();
            this.database = null;
        }

    }

    skipNextServerSentStatement: boolean = false;
    onServerSentStatements(firstNewStatementIndex: number, newStatements: string[], rollbackToVersion: number) {

        if(this.skipNextServerSentStatement){
            this.skipNextServerSentStatement = false;
            return;
        }

        if (rollbackToVersion != null) {
            // Rollback
            this.databaseData.statements.splice(rollbackToVersion);
            this.database.initializeWorker(this.databaseData.templateDump, this.databaseData.statements);
            return;
        } else {
            this.executeStatementsFromServer(firstNewStatementIndex, newStatements);
        }


    }

    executeStatementsFromServer(firstStatementIndex: number, statements: string[],
        callback?: (error: string) => void) {

        // connection already closed?
        if (this.database == null) {
            if(callback) callback("Keine Datenbankverbindung.");
            return;
        }

        let currentDBVersion = this.databaseData.statements.length;
        let delta = currentDBVersion - firstStatementIndex + 1; // these statements are already there
        if (delta >= statements.length) {
            if(callback) callback(null);
            return;
        }
        statements = statements.slice(delta);
        this.databaseData.statements = this.databaseData.statements.concat(statements);

        this.database.executeWriteQueries(statements, () => {
            if (callback != null) callback(null);
        }, (errorMessage) => {
            if (callback != null) callback(errorMessage);
        })
    }

    executeWriteStatement(query: string, callback: (error: string, lastRowId: number) => void, retrieveLastRowId: boolean = false) {

        // connection already closed?
        if (this.database == null) {
            callback("Es besteht keine Verbindung zur Datenbank.", 0);
        }

        let that = this;
        let oldStatementIndex = that.databaseData.statements.length;
        this.database.executeQuery("explain " + query, () => {

            that.skipNextServerSentStatement = true;
            that.main.networkManager.addDatabaseStatement(that.token, oldStatementIndex,
                [query], (statementsBefore, new_version, errorMessage) => {
                    if (errorMessage != null) {
                        callback(errorMessage, 0);
                        return;
                    }

                    that.executeStatementsFromServer(oldStatementIndex + 1, statementsBefore, (error: string) => {

                        that.database.executeWriteQueries([query], () => {
                            that.databaseData.statements.push(query);
                            if (!retrieveLastRowId) {
                                callback(null, 0);
                                return;
                            }
                            that.executeQuery("select last_insert_rowid()", (error, data) => {
                                callback(null, data.values[0][0]);
                            })
                        }, (errorMessage) => {
                            that.databaseData.statements.push(query);
                            if (callback != null) callback(errorMessage, 0);
                            // try rollback so that server doesn't store this statement
                            that.main.networkManager.rollbackDatabaseStatement(that.token, that.databaseData.statements.length, () => {})
                        })
                

                    });

                })

        }, (error) => {
            callback(error, 0);
        })

    }

    executeQuery(query: string, callback: (error: string, data: QueryResult) => void) {

        if (this.database == null || this.databaseSSEListener == null) {
            callback("Es besteht keine Verbindung zur Datenbank.", null);
            return;
        }

        this.database.executeQuery(query, (results: QueryResult[]) => {
            callback(null,results.length == 0 ? {columns: [], values: []} : results[0]);
        }, (error: string) => {
            callback(error, null);
        })

    }

}