import { Module } from "../../compiler/parser/Module.js";
import { ArrayType } from "../../compiler/types/Array.js";
import { Klass } from "../../compiler/types/Class.js";
import { booleanPrimitiveType, doublePrimitiveType, intPrimitiveType, stringPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist, Value } from "../../compiler/types/Types.js";
import { Interpreter, InterpreterState } from "../../interpreter/Interpreter.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { HttpRequestHelper } from "./HttpRequest.js";
import { HttpResponseHelper } from "./HttpResponse.js";

export class JsonElementClass extends Klass {

    constructor(module: Module) {
        super("JsonElement", module, "Repräsentiert ein einzelnes Element in einem Json-Objektbaum.");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));

        let integerClassType = <Klass>module.typeStore.getType("Integer");
        let booleanClassType = <Klass>module.typeStore.getType("Boolean");
        let doubleClassType = <Klass>module.typeStore.getType("Double");


        this.addMethod(new Method("getType", new Parameterlist([
        ]), stringPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let value = o.intrinsicData["v"];

                return Array.isArray(value) ? "array" : typeof value;

            }, false, false, 'Gibt den Typ des Json-Elements zurück. Mögliche Werte sind "string", "number", "array", "boolean" und "object".',
            false));


        this.addMethod(new Method("getArrayValues", new Parameterlist([
        ]), new ArrayType(this),
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let value = o.intrinsicData["v"];

                if (!Array.isArray(value)) {
                    module.main.getInterpreter().throwException("Das Json-Element ist kein Array, daher kann getArrayValues() kein Array zurückgeben.");
                    return;
                }

                let ret: Value[] = value.map(v => {
                    let rto = new RuntimeObject(this);
                    rto.intrinsicData["v"] = v;
                    return { value: rto, type: this }
                })

                return ret;
            }, false, false, 'Falls das Json-Element ein Array ist, gibt diese Funktion es als Array von Json-Elementen zurück.',
            false));

        this.addMethod(new Method("getAttributeValue", new Parameterlist([
            { identifier: "attributeIdentifier", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let identifier: string = parameters[1].value;
                let value = o.intrinsicData["v"];

                if (Array.isArray(value) || (typeof value) != "object") {
                    module.main.getInterpreter().throwException("Das Json-Element ist kein Objekt, daher kann getAttributeValue() keinen Attributwert zurückgeben.");
                    return;
                }

                let rto = new RuntimeObject(this);
                rto.intrinsicData["v"] = value[identifier];

                return rto;
            }, false, false, 'Falls das Json-Element ein Objekt ist, gibt diese Funktion den Wert seine Attributs mit dem übergebenen Bezeichner als JsonElement zurück.',
            false));

        this.addMethod(new Method("getAsString", new Parameterlist([
        ]), stringPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let value = o.intrinsicData["v"];

                if (typeof value != "string") {
                    module.main.getInterpreter().throwException("Das Json-Element ist kein String, daher kann getAsString() keinen Wert zurückgeben.");
                    return;
                }

                return value;

            }, false, false, 'Gibt den String-Wert des JSon-Elements zurück.',
            false));

        this.addMethod(new Method("getAsInt", new Parameterlist([
        ]), integerClassType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let value = o.intrinsicData["v"];

                if (typeof value != "number") {
                    module.main.getInterpreter().throwException("Das Json-Element ist keine Zahl, daher kann getAsInt() keinen Wert zurückgeben.");
                    return;
                }

                return Math.round(value);

            }, false, false, 'Gibt den int-Wert des JSon-Elements zurück.',
            false));

        this.addMethod(new Method("toJson", new Parameterlist([
        ]), stringPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let value = o.intrinsicData["v"];

                return JSON.stringify(value);

            }, false, false, 'Gibt den Wert des Json-Elements als Json-codierten String zurück.',
            false));

        this.addMethod(new Method("getAsDouble", new Parameterlist([
        ]), doubleClassType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let value = o.intrinsicData["v"];

                if (typeof value != "number") {
                    module.main.getInterpreter().throwException("Das Json-Element ist keine Zahl, daher kann getAsDouble() keinen Wert zurückgeben.");
                    return;
                }

                return value;

            }, false, false, 'Gibt den double-Wert des JSon-Elements zurück.',
            false));

        this.addMethod(new Method("getAsBoolean", new Parameterlist([
        ]), booleanClassType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let value = o.intrinsicData["v"];

                if (typeof value != "boolean") {
                    module.main.getInterpreter().throwException("Das Json-Element ist kein boolescher Wert, daher kann getAsBoolean() keinen Wert zurückgeben.");
                    return;
                }

                return value;

            }, false, false, 'Gibt den boolean-Wert des JSon-Elements zurück.',
            false));


        this.addMethod(new Method("getAsString", new Parameterlist([
            { identifier: "attributeIdentifier", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), stringPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let identifier: string = parameters[1].value;
                let value = o.intrinsicData["v"];

                if (Array.isArray(value) || (typeof value) != "object") {
                    module.main.getInterpreter().throwException("Das Json-Element ist kein Objekt, daher kann getAttributeValue() keinen Attributwert zurückgeben.");
                    return;
                }

                let v = value[identifier];
                if (typeof v != "string") {
                    module.main.getInterpreter().throwException("Der Wert des Attributs " + identifier + " ist kein String.");
                    return;
                }

                return v;

            }, false, false, 'Falls das Json-Element ein Objekt ist, gibt diese Funktion den Wert seine Attributs mit dem übergebenen Bezeichner als String zurück.',
            false));

        this.addMethod(new Method("getAsInt", new Parameterlist([
            { identifier: "attributeIdentifier", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), integerClassType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let identifier: string = parameters[1].value;
                let value = o.intrinsicData["v"];

                if (Array.isArray(value) || (typeof value) != "object") {
                    module.main.getInterpreter().throwException("Das Json-Element ist kein Objekt, daher kann getAttributeValue() keinen Attributwert zurückgeben.");
                    return;
                }

                let v = value[identifier];
                if (typeof v != "number") {
                    module.main.getInterpreter().throwException("Der Wert des Attributs " + identifier + " ist keine Zahl.");
                    return;
                }

                return Math.round(v);

            }, false, false, 'Falls das Json-Element ein Objekt ist, gibt diese Funktion den Wert seine Attributs mit dem übergebenen Bezeichner als int-Wert zurück.',
            false));

        this.addMethod(new Method("getAsDouble", new Parameterlist([
            { identifier: "attributeIdentifier", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), doubleClassType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let identifier: string = parameters[1].value;
                let value = o.intrinsicData["v"];

                if (Array.isArray(value) || (typeof value) != "object") {
                    module.main.getInterpreter().throwException("Das Json-Element ist kein Objekt, daher kann getAttributeValue() keinen Attributwert zurückgeben.");
                    return;
                }

                let v = value[identifier];
                if (typeof v != "number") {
                    module.main.getInterpreter().throwException("Der Wert des Attributs " + identifier + " ist keine Zahl.");
                    return;
                }

                return v;

            }, false, false, 'Falls das Json-Element ein Objekt ist, gibt diese Funktion den Wert seine Attributs mit dem übergebenen Bezeichner als double-Wert zurück.',
            false));

        this.addMethod(new Method("getAsBoolean", new Parameterlist([
            { identifier: "attributeIdentifier", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanClassType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let identifier: string = parameters[1].value;
                let value = o.intrinsicData["v"];

                if (Array.isArray(value) || (typeof value) != "object") {
                    module.main.getInterpreter().throwException("Das Json-Element ist kein Objekt, daher kann getAttributeValue() keinen Attributwert zurückgeben.");
                    return;
                }

                let v = value[identifier];
                if (typeof v != "boolean") {
                    module.main.getInterpreter().throwException("Der Wert des Attributs " + identifier + " ist kein boolescher Wert.");
                    return;
                }

                return v;

            }, false, false, 'Falls das Json-Element ein Objekt ist, gibt diese Funktion den Wert seine Attributs mit dem übergebenen Bezeichner als boolean-Wert zurück.',
            false));


        this.addMethod(new Method("getAttributeIdentifiers", new Parameterlist([
        ]), new ArrayType(stringPrimitiveType),
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let value = o.intrinsicData["v"];

                if (Array.isArray(value) || (typeof value) != "object") {
                    module.main.getInterpreter().throwException("Das Json-Element ist kein Objekt, daher kann diese Methode kein Array von Attributbzeichnern liefern.");
                    return;
                }

                let identifierList: Value[] = [];
                for (const [key, v] of Object.entries(value)){
                    identifierList.push({
                        type: stringPrimitiveType,
                        value: key
                    })
                }

                return identifierList;

            }, false, false, 'Falls das Json-Element ein Objekt ist, gibt diese Funktion ein Array mit seinen Attributbezeichnern zurück.',
            false));

    }


}


