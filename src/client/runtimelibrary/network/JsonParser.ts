import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { stringPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { Interpreter, InterpreterState } from "../../interpreter/Interpreter.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { HttpRequestHelper } from "./HttpRequest.js";
import { HttpResponseHelper } from "./HttpResponse.js";

export class JsonParserClass extends Klass {

    constructor(module: Module) {
        super("JsonParser", module, "Parst Json-Code und gibt ihn als Objektbaum zurück.");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));
        let jsonElementType = <Klass>module.typeStore.getType("JsonElement");


        this.addMethod(new Method("parse", new Parameterlist([
            { identifier: "jsonString", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), jsonElementType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let value: string = parameters[1].value;

                try {
                    let jsonTree = JSON.parse(value);
                    let rto = new RuntimeObject(jsonElementType);
                    rto.intrinsicData["v"] = jsonTree;

                    return rto;

                } catch (error){
                    module.main.getInterpreter().throwException("Fehler beim Parsen des Json-Strings: " + error);
                    return;
                }

            }, false, true, 'Wandelt einen Json-String in einen Objektbaum um.',
            false));


    }


}
