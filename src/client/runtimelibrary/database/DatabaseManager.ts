import { Main } from "../../main/Main.js";
import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { stringPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { ConnectionHelper } from "./Connection.js";

export class DatabaseManagerClass extends Klass {

    constructor(module: Module) {
        super("DatabaseManager", module, "Über die statische Methode DatabaseManager.getConnection(String code) kann die Verbindung zu einer Datenbank auf www.sql-ide.de aufgebaut werden.");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));
        let connectionType = <Klass>module.typeStore.getType("Connection");
 
        this.addMethod(new Method("getConnection", new Parameterlist([
            { identifier: "code", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), connectionType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let code: string = parameters[1].value;

                let main = module.main;
                let interpreter = module.main.getInterpreter();
                if(main.isEmbedded()){
                    interpreter.throwException("Verbindung zu einer Datenbank kann nur von www.online-ide.de aus aufgebaut werden.");
                    return null;
                }

                let ch: ConnectionHelper = new ConnectionHelper(<Main>module.main);
                interpreter.pauseForInput();
                ch.connect(code, (error: string) => {
                    if(error == null){
                        let connectionRuntimeObject = new RuntimeObject(connectionType);
                        connectionRuntimeObject.intrinsicData["Helper"] = ch;
                        interpreter.resumeAfterInput({value: connectionRuntimeObject, type: connectionType});
                    } else {
                        interpreter.throwException(error);
                    }
                })

                return;

            }, false, true, 'Baut eine Verbindung mit einer Datenbank auf www.sql-ide.de auf. Gibt ein Connection-Objekt zurück, das diese Verbindung repräsentiert.',
            false));

    }

}