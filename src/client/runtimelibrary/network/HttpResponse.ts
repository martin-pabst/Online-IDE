import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { intPrimitiveType, stringPrimitiveType, voidPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist, Value } from "../../compiler/types/Types.js";
import { Interpreter, InterpreterState } from "../../interpreter/Interpreter.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { ajax } from "../../communication/AjaxHelper.js";
import { SystemClass } from "../System.js";
import { ArrayType } from "../../compiler/types/Array.js";
import { Header, HttpRequestHelper } from "./HttpRequest.js";

export class HttpResponseClass extends Klass {

    constructor(module: Module) {
        super("HttpResponse", module, "Ein Objekt der Klasse HttpResponse umfasst den Statuscode, die Header und den Body (d.h. die Daten) eines http-Response.");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));
        let httpRequestType = <Klass>module.typeStore.getType("HttpRequest");
        let httpHeaderType = <Klass>module.typeStore.getType("HttpHeader");


        this.addMethod(new Method("uri", new Parameterlist([
        ]), stringPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let helper: HttpResponseHelper = o.intrinsicData["Helper"];

                return helper.getUri()

            }, false, false, 'Gibt die URI des Responses zurück.',
            false));

        this.addMethod(new Method("body", new Parameterlist([
        ]), stringPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let helper: HttpResponseHelper = o.intrinsicData["Helper"];

                return helper.getBody()

            }, false, false, 'Gibt den Body dieses Responses zurück.',
            false));

        this.addMethod(new Method("statusCode", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let helper: HttpResponseHelper = o.intrinsicData["Helper"];

                return helper.getStatusCode()

            }, false, false, 'Gibt den den http-Status dieses Responses zurück.',
            false));

        this.addMethod(new Method("statusText", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let helper: HttpResponseHelper = o.intrinsicData["Helper"];

                return helper.getStatusText()

            }, false, false, 'Gibt den den http-Status dieses Responses in Textform zurück.',
            false));

        this.addMethod(new Method("request", new Parameterlist([
        ]), httpRequestType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let helper: HttpResponseHelper = o.intrinsicData["Helper"];

                return helper.request

            }, false, false, 'Gibt das Request-Objekt zurück, das diesen Response zur Folge hatte.',
            false));

        this.addMethod(new Method("headers", new Parameterlist([
        ]), new ArrayType(httpHeaderType),
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let helper: HttpResponseHelper = o.intrinsicData["Helper"];

                let headers: Value[] = [];

                for(let header of helper.headers){
                    let rto: RuntimeObject = new RuntimeObject(<Klass>httpHeaderType);
                    rto.intrinsicData["key"] = header.key;
                    rto.intrinsicData["value"] = header.value;
                    headers.push({
                        type: httpHeaderType,
                        value: rto
                    })
                }


                return headers;

            }, false, false, 'Gibt die Header dieses Responses zurück.',
            false));


    }


}

export class HttpResponseHelper {

    headers: Header[] = [];

    constructor(private runtimeObject: RuntimeObject, public request: RuntimeObject, private response: Response, private body: string) {
        response.headers.forEach((value, key) => this.headers.push({ key: key, value: value }));
    }

    getUri(): string {
        return this.response.url;
    }

    getBody(): string {
        return this.body;
    }

    getStatusCode(): number {
        return this.response.status;
    }

    getStatusText(): string {
        return this.response.statusText;
    }

}