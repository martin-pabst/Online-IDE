import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { Interpreter, InterpreterState } from "../../interpreter/Interpreter.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { HttpRequestHelper } from "./HttpRequest.js";
import { HttpResponseHelper } from "./HttpResponse.js";

export class HttpClientClass extends Klass {

    constructor(module: Module) {
        super("HttpClient", module, "Ein Objekt der Klasse HttpClient kann Http-Requests senden.");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));
        let httpRequestType = <Klass>module.typeStore.getType("HttpRequest");
        let httpResponseType = <Klass>module.typeStore.getType("HttpResponse");

        this.addMethod(new Method("HttpClient", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let interpreter = this.module?.main?.getInterpreter();

                let wh = new HttpClientHelper(o, interpreter, httpResponseType);

                o.intrinsicData["Helper"] = wh;

            }, false, false, 'Instanziert ein neues HttpClient-Objekt.', true));

        this.addMethod(new Method("send", new Parameterlist([
            { identifier: "request", type: httpRequestType, declaration: null, usagePositions: null, isFinal: true }
        ]), httpResponseType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let request: RuntimeObject = parameters[1].value;

                let wh: HttpClientHelper = o.intrinsicData["Helper"];
                let rh: HttpRequestHelper = request.intrinsicData["Helper"];

                return wh.send(rh, request);

            }, false, false, 'Sendet den Request an den Server.',
            false));


    }


}

export class HttpClientHelper {


    constructor(private runtimeObject: RuntimeObject, private interpreter: Interpreter, private httpResponseType: Klass) {


    }

    send(rh: HttpRequestHelper, requestRto: RuntimeObject) {
        this.interpreter.pauseForInput(InterpreterState.waitingForDB);

        let headerObject = {};
        for(let header of rh.headers){
            headerObject[header.key] = header.value;
        }

        try {
            fetch(rh.uri, {
                method: rh.method,
                body: rh.method == "GET" ? undefined : rh.postData,
                headers: headerObject,
                redirect: "follow",
                cache: "no-cache"
            })
                .then((response) => {
                    
                    response.text().then((body: string) => {
                        let rto = new RuntimeObject(this.httpResponseType);
                        let responseHelper = new HttpResponseHelper(rto, requestRto, response, body);
                        rto.intrinsicData["Helper"] = responseHelper;
                        this.interpreter.resumeAfterInput({value: rto, type: this.httpResponseType}, true);
                    })
    
                }).catch((reason) => {
                    this.interpreter.throwException("" + reason);
                    // this.interpreter.resumeAfterInput({value: rto, type: this.httpResponseType}, true);
                })
        } catch(error){
            console.log(error);
        }
    }

}