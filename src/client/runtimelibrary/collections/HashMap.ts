import { Module } from "../../compiler/parser/Module.js";
import { Interface, Klass, TypeVariable } from "../../compiler/types/Class.js";
import { booleanPrimitiveType, intPrimitiveType, stringPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist, Value } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { MapHelper } from "./MapHelper.js";

export class HashMapClass extends Klass {

    constructor(module: Module) {

        super("HashMap", module, "Map-Klasse mit Zugriffszeit proportional zu log(Anzahl der Elemente)");

        let objectType = module.typeStore.getType("Object");

        this.setBaseClass(<Klass>objectType);

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



        let setInterface = (<Interface>module.typeStore.getType("Map")).clone();
        setInterface.typeVariables = [tvK, tvV];

        this.implements.push(setInterface);

        this.addMethod(new Method("HashMap", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let mh = new MapHelper(o, module.main.getInterpreter(), module);
                o.intrinsicData["MapHelper"] = mh;

            }, false, false, 'Instanziert eine neue HashMap', true));


        this.addMethod(new Method("put", new Parameterlist([
            { identifier: "key", type: typeK, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "value", type: typeV, declaration: null, usagePositions: null, isFinal: true }
        ]), typeV,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;
                let key: Value = parameters[1];
                let value: Value = parameters[2];
                let ah: MapHelper = o.intrinsicData["MapHelper"];

                return ah.set(key, value);

            }, false, false, "Speichert das key-value pair in der Map. Falls zum key vorher schon ein Value gespeichert war, wird dieser zurückgegeben. In der Map wird er dann durch den neuen Value überschrieben. Falls es zum key noch keinen value in der Map gab, wird null zurückgegeben."));

        this.addMethod(new Method("clear", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: MapHelper = o.intrinsicData["MapHelper"];

                return ah.clear();

            },
            false, false, "Entfernt alle Key-Value-Pairs aus dieser HashMap."));

        this.addMethod(new Method("containsKey", new Parameterlist([
            { identifier: "key", type: typeK, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let key: Value = parameters[1];
                let ah: MapHelper = o.intrinsicData["MapHelper"];

                return ah.containsKey(key);

            },  // no implementation!
            false, false, "Gibt genau dann true zurück, wenn die Map zum Schlüssel key einen Wert enthält."));

        this.addMethod(new Method("containsValue", new Parameterlist([
            { identifier: "value", type: typeV, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let value: Value = parameters[1];
                let ah: MapHelper = o.intrinsicData["MapHelper"];

                return ah.containsValue(value);

            },  // no implementation!
            false, false, "Gibt genau dann true zurück, wenn die Map den Wert enthält."));

        this.addMethod(new Method("get", new Parameterlist([
            { identifier: "key", type: typeK, declaration: null, usagePositions: null, isFinal: true }
        ]), typeV,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let key: Value = parameters[1];
                let ah: MapHelper = o.intrinsicData["MapHelper"];

                let v: Value = ah.get(key);
                return v == null ? null : v.value;

            },  // no implementation!
            false, false, "Gibt den Wert zum Schlüssel key zurück. Gibt null zurück, falls die Map zum Schlüssel key keinen Wert enthält."));


        this.addMethod(new Method("isEmpty", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: MapHelper = o.intrinsicData["MapHelper"];

                return ah.isEmpty();

            },
            false, false, "Testet, ob die HashMap leer ist."));

        this.addMethod(new Method("size", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: MapHelper = o.intrinsicData["MapHelper"];

                return ah.size();

            },
            false, false, "Gibt die Anzahl der key-value-pairs der HashMap zurück."));

        this.addMethod(new Method("toString", new Parameterlist([]), stringPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: MapHelper = o.intrinsicData["MapHelper"];

                return ah.to_String();

            }, false, false));

    }

}

