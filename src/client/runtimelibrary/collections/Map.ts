import { Module } from "../../compiler/parser/Module.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { Interface, TypeVariable, Klass } from "../../compiler/types/Class.js";
import { voidPrimitiveType, booleanPrimitiveType, intPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";

export class MapClass extends Interface {

    constructor(module: Module) {

        super("Map", module, "Interface mit Methoden einer Map (Schlüssel-Wert-Speicher)");

        let objectType = module.typeStore.getType("Object");

        let typeK: Klass = (<Klass>objectType).clone();
        typeK.identifier = "K";
        typeK.isTypeVariable = true;

        let tvK: TypeVariable = {
            identifier: "K",
            scopeFrom: { line: 1, column: 1, length: 1 },
            scopeTo: { line: 1, column: 1, length: 1 },
            type: typeK
        };
        this.typeVariables.push(tvK);

        let typeV: Klass = (<Klass>objectType).clone();
        typeV.identifier = "V";
        typeV.isTypeVariable = true;

        let tvV: TypeVariable = {
            identifier: "V",
            scopeFrom: { line: 1, column: 1, length: 1 },
            scopeTo: { line: 1, column: 1, length: 1 },
            type: typeV
        };
        this.typeVariables.push(tvV);

        this.addMethod(new Method("size", new Parameterlist([
        ]), intPrimitiveType,
            null,  // no implementation!
            true, false, "Gibt die Anzahl der Elemente der Map zurück."));

        this.addMethod(new Method("isEmpty", new Parameterlist([
        ]), booleanPrimitiveType,
            null,  // no implementation!
            true, false, "Testet, ob die Map leer ist."));

        this.addMethod(new Method("containsKey", new Parameterlist([
            { identifier: "key", type: typeK, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            null,  // no implementation!
            true, false, "Gibt genau dann true zurück, wenn die Map zum Schlüssel key einen Wert enthält."));

        this.addMethod(new Method("containsValue", new Parameterlist([
            { identifier: "value", type: typeV, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            null,  // no implementation!
            true, false, "Gibt genau dann true zurück, wenn die Map den Wert enthält."));

        this.addMethod(new Method("get", new Parameterlist([
            { identifier: "key", type: typeK, declaration: null, usagePositions: null, isFinal: true }
        ]), typeV,
            null,  // no implementation!
            true, false, "Gibt den Wert zum Schlüssel key zurück. Gibt null zurück, falls die Map zum Schlüssel key keinen Wert enthält."));

        this.addMethod(new Method("put", new Parameterlist([
            { identifier: "key", type: typeK, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "value", type: typeV, declaration: null, usagePositions: null, isFinal: true }
        ]), typeV,
            null,  // no implementation!
            true, false, "Speichert das key-value pair in der Map. Falls zum key vorher schon ein Value gespeichert war, wird dieser zurückgegeben. In der Map wird er dann durch den neuen Value überschrieben. Falls es zum key noch keinen value in der Map gab, wird null zurückgegeben."));

        this.addMethod(new Method("clear", new Parameterlist([
        ]), null,
            null,  // no implementation!
            true, false, "Entfernt alle Element aus dieser Map."));

    }

}
