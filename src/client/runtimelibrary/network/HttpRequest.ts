import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { intPrimitiveType, stringPrimitiveType, voidPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist, Value } from "../../compiler/types/Types.js";
import { Interpreter, InterpreterState } from "../../interpreter/Interpreter.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { ajax } from "../../communication/AjaxHelper.js";
import { SystemClass } from "../System.js";
import { ArrayType } from "../../compiler/types/Array.js";

export type Header = {
    key: string,
    value: string
}

export class HttpRequestClass extends Klass {

    constructor(module: Module) {
        super("HttpRequest", module, "Ein Objekt der Klasse HttpRequest umfasst die URI, den Header und die Daten eines Http-Requests.");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));

        this.addMethod(new Method("HttpRequest", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let interpreter = this.module?.main?.getInterpreter();

                let wh = new HttpRequestHelper(o, interpreter);

                o.intrinsicData["Helper"] = wh;

            }, false, false, 'Instanziert ein neues HttpRequest-Objekt.', true));

        this.addMethod(new Method("uri", new Parameterlist([
            { identifier: "uri", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let uri: string = parameters[1].value;
                
                let helper: HttpRequestHelper = o.intrinsicData["Helper"];
                helper.setUri(uri);

                return o;

            }, false, false, 'Legt die URI des Requests fest.',
            false));

        this.addMethod(new Method("header", new Parameterlist([
            { identifier: "key", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "value", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let key: string = parameters[1].value;
                let value: string = parameters[2].value;
                
                let helper: HttpRequestHelper = o.intrinsicData["Helper"];
                helper.header(key, value);

                return o;

            }, false, false, 'Fügt dem Request einen Header hinzu.',
            false));

        this.addMethod(new Method("POST", new Parameterlist([
            { identifier: "data", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let data: string = parameters[1].value;
                
                let helper: HttpRequestHelper = o.intrinsicData["Helper"];
                helper.post(data);

                return o;

            }, false, false, 'Setzt die Request-Methode auf POST und fügt dem Request die übergebenen Daten hinzu.',
            false));

        this.addMethod(new Method("GET", new Parameterlist([
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let data: string = parameters[1].value;
                
                let helper: HttpRequestHelper = o.intrinsicData["Helper"];
                helper.get();

                return o;

            }, false, false, 'Setzt die Request-Methode auf GET.',
            false));


    }


}

export class HttpRequestHelper {

    headers: Header[] = [];
    uri: string;
    postData: string;
    method: "GET" | "POST" = "GET";

    constructor(private runtimeObject: RuntimeObject, private interpreter: Interpreter) {

    }

    get(){
        this.method = "GET";
    }


    post(data: string){
        this.method = "POST";
        this.postData = data;
    }

    header(key: string, value: string){
        this.headers.push({key: key, value: value});
    }

    setUri(uri: string){
        this.uri = uri;
    }

}