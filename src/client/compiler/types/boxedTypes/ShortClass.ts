import { Klass, Visibility } from "../Class.js";
import { Method, Parameterlist, Attribute, Value, Type, PrimitiveType } from "../Types.js";
import { shortPrimitiveType, stringPrimitiveType, doublePrimitiveType, floatPrimitiveType, intPrimitiveType, booleanPrimitiveType } from "../PrimitiveTypes.js";
import { RuntimeObject } from "../../../interpreter/RuntimeObject.js";


export class ShortClass extends Klass {

    unboxableAs = [];

    constructor(baseClass: Klass) {
        super("Short", null, "Wrapper-Klasse, um int-Werte in Collections verenden zu können.");
        this.baseClass = baseClass;

        this.addAttribute(new Attribute("MAX_VALUE", shortPrimitiveType, (value) => { value.value = 0b1000000000000000-1 }, true, Visibility.public, true, "Der größte Wert, den eine Variable vom Typ long annehmen kann"));
        this.addAttribute(new Attribute("MIN_VALUE", shortPrimitiveType, (value) => { value.value = -0b1000000000000000 }, true, Visibility.public, true, "Der kleinste Wert, den eine Variable vom Typ long annehmen kann"));

        this.staticClass.setupAttributeIndicesRecursive();

        this.staticClass.classObject = new RuntimeObject(this.staticClass);

    }

    canCastTo(type: Type): boolean{
        return this.unboxableAs.indexOf(type) >= 0 || super.canCastTo(type);
    }

    init() {

        this.unboxableAs = [intPrimitiveType, shortPrimitiveType, floatPrimitiveType, doublePrimitiveType];

        this.addMethod(new Method("Short", new Parameterlist([
            { identifier: "short-wert", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                parameters[0].value = parameters[1].value;

            }, false, false, "Instanziert ein neues Short-Objekt", true));

        this.addMethod(new Method("Short", new Parameterlist([
            { identifier: "text", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                parameters[0].value = Number.parseInt(parameters[1].value);

            }, false, false, "Instanziert ein neues Short-Objekt, indem die übergebene Zeichenkette in einen int-Wert umgewandelt wird.", true));


        this.addMethod(new Method("doubleValue", new Parameterlist([]), doublePrimitiveType,
            (parameters) => { return parameters[0].value; }, false, false, "Wandelt das Short-Objekt in einen double-Wert um"));
        this.addMethod(new Method("floatValue", new Parameterlist([]), floatPrimitiveType,
            (parameters) => { return parameters[0].value; }, false, false, "Wandelt das Short-Objekt in einen float-Wert um"));
        this.addMethod(new Method("intValue", new Parameterlist([]), intPrimitiveType,
            (parameters) => { return parameters[0].value; }, false, false, "Wandelt das Short-Objekt in einen int-Wert um"));
        this.addMethod(new Method("longValue", new Parameterlist([]), shortPrimitiveType,
            (parameters) => { return parameters[0].value; }, false, false, "Wandelt das Short-Objekt in einen short-Wert um"));
        this.addMethod(new Method("shortValue", new Parameterlist([]), shortPrimitiveType,
            (parameters) => { return parameters[0].value; }, false, false, "Wandelt das Short-Objekt in einen short-Wert um"));

        this.addMethod(new Method("compareTo", new Parameterlist([
            { identifier: "anotherShort", type: this, declaration: null, usagePositions: null, isFinal: true }
        ]), intPrimitiveType,
            (parameters) => {
                let v0 = parameters[0].value;
                let v1 = parameters[1].value;
                if (v0 > v1) return 1;
                if (v0 < v1) return -1;
                return 0;
            }, false, false, "Ist der Wert größer als der übergebene Wert, so wird +1 zurückgegeben. Ist er kleiner, so wird -1 zurückgegeben. Sind die Werte gleich, so wird 0 zurückgegeben."));

        this.addMethod(new Method("equals", new Parameterlist([
            { identifier: "anotherShort", type: this, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {
                return parameters[0].value == parameters[1].value;
            }, false, false, "Gibt genau dann true zurück, wenn der Wert gleich dem übergebenen Wert ist."));

        this.addMethod(new Method("toString", new Parameterlist([
        ]), stringPrimitiveType,
            (parameters) => {
                return "" + parameters[0].value;
            }, false, false, "Gibt den Wert des Objekts als String-Wert zur Basis 10 zurück."));

        this.addMethod(new Method("hashCode", new Parameterlist([
        ]), shortPrimitiveType,
            (parameters) => {
                return parameters[0].value;
            }, false, false, "Gibt den hashCode des Objekts zurück."));

        this.addMethod(new Method("parseShort", new Parameterlist([
            { identifier: "s", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), shortPrimitiveType,
            (parameters) => {
                return Number.parseInt(parameters[1].value);
            }, false, true, "Wandelt die Zeichenkette in einen short-Wert um"));

        this.addMethod(new Method("parseLong", new Parameterlist([
            { identifier: "s", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "radix", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), shortPrimitiveType,
            (parameters) => {
                return Number.parseInt(parameters[1].value, parameters[2].value);
            }, false, true, "Wandelt die Zeichenkette s in einen short-Wert um. Dabei wird s als Zahl im Zahlensystem mit der Basis radix interpretiert."));

        this.addMethod(new Method("signum", new Parameterlist([
            { identifier: "i", type: shortPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), shortPrimitiveType,
            (parameters) => {
                return Math.sign(parameters[1].value);
            }, false, true, "Gibt das Signum der übergebenen Zahl zurück, also -1 falls negativ, 0 falls 0 und +1 falls positiv."));

        this.addMethod(new Method("toBinary", new Parameterlist([
            { identifier: "i", type: shortPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), stringPrimitiveType,
            (parameters) => {
                return (parameters[1].value >>> 0).toString(2);
            }, false, true, "Gibt die übergebene Zahl als Binärrepräsentation zurück."));

        this.addMethod(new Method("toHex", new Parameterlist([
            { identifier: "i", type: shortPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), stringPrimitiveType,
            (parameters) => {
                return (parameters[1].value >>> 0).toString(16);
            }, false, true, "Gibt die übergebene Zahl als Hexadezimalrepräsentation zurück."));

        this.addMethod(new Method("toOctal", new Parameterlist([
            { identifier: "i", type: shortPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), stringPrimitiveType,
            (parameters) => {
                return (parameters[1].value >>> 0).toString(8);
            }, false, true, "Gibt die übergebene Zahl als Oktalrepräsentation zurück."));

        this.addMethod(new Method("toString", new Parameterlist([
            { identifier: "i", type: shortPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), stringPrimitiveType,
            (parameters) => {
                return (parameters[1].value).toString();
            }, false, true, "Gibt die übergebene Zahl als String-Wert zur Basis 10 zurück."));

        this.addMethod(new Method("toString", new Parameterlist([
            { identifier: "i", type: shortPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "radix", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), stringPrimitiveType,
            (parameters) => {
                return (parameters[1].value >>> 0).toString(parameters[2].value);
            }, false, true, "Gibt die übergebene Zahl als String-Wert zur Basis radix zurück."));

        this.addMethod(new Method("valueOf", new Parameterlist([
            { identifier: "i", type: shortPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), this,
            (parameters) => {
                return parameters[1].value;
            }, false, true, "Gibt die übergebene Zahl als Short-Objekt zurück."));

        this.addMethod(new Method("valueOf", new Parameterlist([
            { identifier: "s", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), this,
            (parameters) => {
                return Number.parseInt(parameters[1].value);
            }, false, true, "Interpretiert die übergebene Zeichenkette als Dezimalzahl und gib sie als Short-Objekt zurück."));

        this.addMethod(new Method("valueOf", new Parameterlist([
            { identifier: "s", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "radix", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), this,
            (parameters) => {
                return Number.parseInt(parameters[1].value, parameters[2].value);
            }, false, true, "Interpretiert die übergebene Zeichenkette als Zahl zur Basis radix und gib sie als Short-Objekt zurück."));

        // this.addMethod(new Method("charAt", new Parameterlist([{ identifier: "Position", type: shortPrimitiveType, declaration: null, usagePositions: null, isFinal: false }]), charPrimitiveType,
        //     (parameters) => { return (<string>parameters[0].value).charAt(<number>(parameters[1].value)); }, false, false, "Zeichen an der gegebenen Position.\n**Bem.: ** Position == 0 bedeutet das erste Zeichen in der Zeichenkette, Position == 1 das zweite usw. ."));

    }

    public debugOutput(value: Value): string {
        return "" + <number>value.value;
    }


}
