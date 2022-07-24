import { InterpreterState } from "../../interpreter/Interpreter.js";
import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { booleanPrimitiveType, doublePrimitiveType, floatPrimitiveType, intPrimitiveType, stringPrimitiveType, voidPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { ConnectionHelper } from "./Connection.js";
import { ResultsetHelper } from "./ResultSet.js";


export class DatabasePreparedStatementClass extends Klass {

    constructor(module: Module) {
        super("PreparedStatement", module, "Ein PreparedStatement-Objekt repräsentiert eine parametrisierte Anweisung an die Datenbank.");


        let resultSetType = <Klass>module.typeStore.getType("ResultSet");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));

        this.addMethod(new Method("executeQuery", new Parameterlist([
        ]), resultSetType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let psh: PreparedStatementHelper = o.intrinsicData["Helper"];

                let interpreter = module.main.getInterpreter();
                if (!psh.query.toLocaleLowerCase().startsWith("select")) {
                    module.main.getInterpreter().resumeAfterInput(null);
                    interpreter.throwException("Mit der Methode executeQuery können nur select-Anweisungen ausgeführt werden. Benutze für datenverändernde Anweisungen die Methode executeUpdate.");
                    return null;
                }

                interpreter.pauseForInput(InterpreterState.waitingForDB);

                module.main.getBottomDiv().showHideDbBusyIcon(true);

                let error = psh.checkQuery();

                if (error != null) {
                    interpreter.throwException(error);
                    return null;
                }


                psh.connectionHelper.executeQuery(psh.getQueryWithParameterValuesFilledIn(), (error, result) => {
                    module.main.getBottomDiv().showHideDbBusyIcon(false);
                    if (error != null) {
                        module.main.getInterpreter().resumeAfterInput(null);
                        interpreter.throwException(error);
                        return;
                    }
                    let rsh = new ResultsetHelper(result);
                    let rs = new RuntimeObject(resultSetType);
                    rs.intrinsicData["Helper"] = rsh;
                    interpreter.resumeAfterInput({ value: rs, type: resultSetType }, true);
                })

            }, false, false, 'Führt ein SQL-Statement aus, das eine select-Anweisung enthält.',
            false));

        this.addMethod(new Method("executeUpdate", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let psh: PreparedStatementHelper = o.intrinsicData["Helper"];

                let interpreter = module.main.getInterpreter();
                if (psh.query.toLocaleLowerCase().startsWith("select")) {
                    module.main.getInterpreter().resumeAfterInput(null);
                    interpreter.throwException("Mit der Methode execute können nur datenverändernde Anweisungen ausgeführt werden." + 
                    "Benutze für select-Anweisungen die Methode executeQuery.");
                    return null;
                }

                interpreter.pauseForInput(InterpreterState.waitingForDB);

                module.main.getBottomDiv().showHideDbBusyIcon(true);

                let error = psh.checkQuery();

                if (error != null) {
                    interpreter.resumeAfterInput(null);
                    interpreter.throwException(error);
                    return null;
                }
                
                psh.connectionHelper.executeWriteStatement(psh.getQueryWithParameterValuesFilledIn(), (error) => {
                    module.main.getBottomDiv().showHideDbBusyIcon(false);
                    if (error != null) {
                        module.main.getInterpreter().resumeAfterInput(null);
                        interpreter.resumeAfterInput(null);
                        interpreter.throwException(error);
                        return;
                    }
                    interpreter.resumeAfterInput({ value: 0, type: intPrimitiveType }, true);
                })

            }, false, false, 'Führt ein SQL-Statement aus, das eine datenverändernde Anweisung enthält.',
            false));

        let types = [booleanPrimitiveType, intPrimitiveType, floatPrimitiveType, doublePrimitiveType, stringPrimitiveType];

        for (let type of types) {

            let typeIdFirstUppercase = type.identifier.charAt(0).toUpperCase() + type.identifier.substring(1);


            this.addMethod(new Method("set"+typeIdFirstUppercase, new Parameterlist([
                { identifier: "parameterIndex", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
                { identifier: "value", type: type, declaration: null, usagePositions: null, isFinal: true }
            ]), voidPrimitiveType,
                (parameters) => {

                    let o: RuntimeObject = parameters[0].value;
                    let index: number = parameters[1].value;
                    let value: any = parameters[2].value;
                    let psh: PreparedStatementHelper = o.intrinsicData["Helper"];

                    let error = psh.setValue(value, index);
                    if (error != null) {
                        module.main.getInterpreter().resumeAfterInput(null);
                        module.main.getInterpreter().throwException(error);
                    }

                    return;

                }, false, false, 'Setzt im Parameter mit dem angegebenen Index den ' + type.identifier + '-Wert ein.'));
        }
    }

}


export class PreparedStatementHelper {

    parameterValues: string[];
    parameterPositions: number[];
    query: string;

    constructor(public connectionHelper: ConnectionHelper, query: string) {
        this.query = query.trim();
        this.prepareStatement(this.query);
    }

    prepareStatement(sql: string) {

        let insideQuotation: boolean = false;
        this.parameterPositions = [];

        for (let i = 0; i < sql.length; i++) {

            let c = sql.charAt(i);
            switch (c) {
                case "'": insideQuotation = !insideQuotation;
                    break;
                case "?": if (!insideQuotation) {
                    this.parameterPositions.push(i);
                }
                    break;
                default:
                    break;
            }
        }

        this.parameterValues = new Array(this.parameterPositions.length);

    }

    setValue(value: any, position: number): string {
        if (position < 1 || position > this.parameterPositions.length) {
            if (this.parameterPositions.length == 0) {
                return "Es gibt keine Parameter (mit ? besetzte Stellen) in dieser Anweisung.";
            }
            return "Es gibt nur die Parameterpositionen 1 bis " + this.parameterPositions.length + " in der SQL-Anweisung, keine Position " + position + ".";
        }

        if(value == null){
            this.parameterValues[position - 1] = "null";
        } else
        if (typeof value == "string") {
            value = value.replace(/'/g, "''");
            this.parameterValues[position - 1] = "'" + value + "'";
        } else {
            this.parameterValues[position - 1] = "" + value;
        }
        return;
    }

    checkQuery(): string {
        return null;
    }

    getQueryWithParameterValuesFilledIn(): string {
        let query = this.query;
        let queryParts: string[] = [];
        let pos = 0;

        for (let i = 0; i < this.parameterPositions.length; i++) {
            queryParts.push(query.substring(pos, this.parameterPositions[i]));
            pos = this.parameterPositions[i] + 1;
        }

        if (pos < query.length) {
            queryParts.push(query.substring(pos));
        }

        let queryWithParameterValues = "";
        for (let i = 0; i < this.parameterPositions.length; i++) {
            queryWithParameterValues += queryParts[i] + this.parameterValues[i];
        }

        if (queryParts.length > this.parameterPositions.length) {
            queryWithParameterValues += queryParts[queryParts.length - 1];
        }

        return queryWithParameterValues;
    }

}