import { RuntimeObject } from "../../../interpreter/RuntimeObject.js";
import { Klass, UnboxableKlass, Visibility } from "../Class.js";
import { booleanPrimitiveType, charPrimitiveType, intPrimitiveType, stringPrimitiveType } from "../PrimitiveTypes.js";
import { Method, Parameterlist, Type, Value, Attribute } from "../Types.js";


export class BooleanClass extends UnboxableKlass {

    constructor(baseClass: Klass) {
        super("Boolean", null, "Wrapper-Klasse, um boolean-Werte in Collections verenden zu können.");
        this.baseClass = baseClass;

        this.addAttribute(new Attribute("TRUE", this, (value) => { value.value = true }, true, Visibility.public, true, "das Boolean-Objekt, das TRUE repräsentiert"));
        this.addAttribute(new Attribute("FALSE", this, (value) => { value.value = false }, true, Visibility.public, true, "das Boolean-Objekt, das FALSE repräsentiert"));
        this.staticClass.setupAttributeIndicesRecursive();

        this.staticClass.classObject = new RuntimeObject(this.staticClass);

    }

    canCastTo(type: Type): boolean {
        return this.unboxableAs.indexOf(type) >= 0 || super.canCastTo(type);
    }

    init() {

        this.unboxableAs = [booleanPrimitiveType];

        this.addMethod(new Method("Boolean", new Parameterlist([
            { identifier: "boolean-value", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                parameters[0].value = parameters[1].value;

            }, false, false, "Instanziert ein neues Boolean-Objekt", true));

        this.addMethod(new Method("Boolean", new Parameterlist([
            { identifier: "string-value", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                parameters[0].value = parameters[1] != null && parameters[1].value.toLowerCase() == "true";

            }, false, false, "Instanziert ein neues Boolean-Objekt: Es nimmt genau dann den Wert true an, wenn die übergebene Zeichenkette ohne Berücksichtigung von Klein-/Großschreibung den Wert \"true\" hat.", true));

        this.addMethod(new Method("booleanValue", new Parameterlist([]), booleanPrimitiveType,
            (parameters) => { return parameters[0].value; }, false, false, "Wandelt das Boolean-Objekt in einen boolean-Wert um"));

        this.addMethod(new Method("compareTo", new Parameterlist([
            { identifier: "anotherBoolean", type: this, declaration: null, usagePositions: null, isFinal: true }
        ]), intPrimitiveType,
            (parameters) => {
                let v0 = parameters[0].value;
                let v1 = parameters[1].value;
                return v0 == v1 ? 0 : 1;
            }, false, false, "Gibt genau dann 0 zurück, wenn der Wert des Objekts gleich dem übergebenen Wert ist, ansonsten 1."));

        this.addMethod(new Method("equals", new Parameterlist([
            { identifier: "anotherBoolean", type: this, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {
                return parameters[0].value == parameters[1].value;
            }, false, false, "Gibt genau dann true zurück, wenn der Wert gleich dem übergebenen Wert ist."));

        this.addMethod(new Method("toString", new Parameterlist([
        ]), stringPrimitiveType,
            (parameters) => {
                return "" + parameters[0].value;
            }, false, false, "Gibt den Wert des Objekts als String-Wert zurück."));

        this.addMethod(new Method("hashCode", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {
                return (<boolean>parameters[0].value) ? 0 : 1;
            }, false, false, "Gibt den hashCode des Objekts zurück."));

        this.addMethod(new Method("booleanValue", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {
                return parameters[0].value;
            }, false, false, "Gibt den boolean-Wert des Objekts zurück."));

        this.addMethod(new Method("valueOf", new Parameterlist([
            { identifier: "boolean-value", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), this,
            (parameters) => {
                return parameters[1].value;
            }, false, true, "Wandelt den boolean-Wert in ein Boolean-Objekt um."));

        this.addMethod(new Method("valueOf", new Parameterlist([
            { identifier: "string-value", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType,
            (parameters) => {
                return parameters[1].value != null && (<string>parameters[1].value).toLowerCase() == "true";
            }, false, true, "Wandelt die Zeichenkette in einen boolean-Wert um. Er ergibt true genau dann, wenn die Zeichenkette != null ist und - ohne Berücksichtigung von Klein-/Großschreibung - den Wert \"true\" hat."));

        this.addMethod(new Method("parseBoolean", new Parameterlist([
            { identifier: "string-value", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType,
            (parameters) => {
                return parameters[1].value != null && (<string>parameters[1].value).toLowerCase() == "true";
            }, false, true, "Wandelt die Zeichenkette in einen boolean-Wert um. Er ergibt true genau dann, wenn die Zeichenkette != null ist und - ohne Berücksichtigung von Klein-/Großschreibung - den Wert \"true\" hat."));


    }

    public debugOutput(value: Value): string {
        return "" + <number>value.value;
    }


}
