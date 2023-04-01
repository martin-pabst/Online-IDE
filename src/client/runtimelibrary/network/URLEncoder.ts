import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { stringPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { Interpreter, InterpreterState } from "../../interpreter/Interpreter.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { HttpRequestHelper } from "./HttpRequest.js";
import { HttpResponseHelper } from "./HttpResponse.js";

export class URLEncoderClass extends Klass {

    constructor(module: Module) {
        super("URLEncoder", module, "Klasse mit einer statischen Methode zum Encodieren von URLs.");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));


        this.addMethod(new Method("encode", new Parameterlist([
            { identifier: "value", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), stringPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let value: string = parameters[1].value;

                return encodeURI(value);

            }, false, true, 'Encodiert eine URL gemäß RFC3986.',
            false));


    }


}
