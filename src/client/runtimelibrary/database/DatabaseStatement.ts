import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { intPrimitiveType, stringPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { ConnectionHelper } from "./Connection.js";
import { ResultsetHelper } from "./ResultSet.js";

export class DatabaseStatementClass extends Klass {

    constructor(module: Module) {
        super("Statement", module, "Ein Statement-Objekt repräsentiert eine Anweisung an die Datenbank.");


        let resultSetType = <Klass>module.typeStore.getType("ResultSet");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));
 
        this.addMethod(new Method("executeQuery", new Parameterlist([
            { identifier: "query", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), resultSetType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let query: string = parameters[1].value;

                let connectionHelper: ConnectionHelper = o.intrinsicData["ConnectionHelper"];

                let interpreter = module.main.getInterpreter();
                interpreter.pauseForInput();

                connectionHelper.executeQuery(query, (error, result) => {
                    if(error != null){
                        interpreter.throwException(error);
                        return;
                    }
                    let rsh = new ResultsetHelper(result);
                    let rs = new RuntimeObject(resultSetType);
                    rs.intrinsicData["Helper"] = rsh;
                    interpreter.resumeAfterInput({value: rs, type: resultSetType});
                })

            }, false, false, 'Führt ein SQL-Statement aus, das eine selct-Anweisung enthält.',
            false));

        this.addMethod(new Method("executeUpdate", new Parameterlist([
            { identifier: "query", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let query: string = parameters[1].value;

                let connectionHelper: ConnectionHelper = o.intrinsicData["ConnectionHelper"];

                let interpreter = module.main.getInterpreter();
                interpreter.pauseForInput();

                connectionHelper.executeWriteStatement(query, (error) => {
                    if(error != null){
                        interpreter.throwException(error);
                        return;
                    }
                    interpreter.resumeAfterInput({value: 0, type: intPrimitiveType});
                })

            }, false, false, 'Führt ein SQL-Statement aus, das eine datenverändernde Anweisung enthält.',
            false));

    }

}


