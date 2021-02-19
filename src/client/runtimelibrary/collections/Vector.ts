import { Module } from "../../compiler/parser/Module.js";
import { Klass, TypeVariable, Interface } from "../../compiler/types/Class.js";
import { doublePrimitiveType, booleanPrimitiveType, intPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist, Value } from "../../compiler/types/Types.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { TilingSprite } from "pixi.js";
import { ListHelper } from "./ArrayList.js";
import { ListIteratorImplClass } from "./ListIteratorImpl.js";

export class VectorClass extends Klass {

    constructor(module: Module) {

        super("Vector", module, "Liste mit Zugriff auf das n-te Element in konstanter Zeit");

        let objectType = module.typeStore.getType("Object");

        this.setBaseClass(<Klass>objectType);

        let typeA: Klass = (<Klass>objectType).clone();
        typeA.identifier = "A";
        typeA.isTypeVariable = true;

        let tvA: TypeVariable = {
            identifier: "A",
            scopeFrom: { line: 1, column: 1, length: 1 },
            scopeTo: { line: 1, column: 1, length: 1 },
            type: typeA
        };

        this.typeVariables.push(tvA);

        let listInterface = (<Interface>module.typeStore.getType("List")).clone();
        listInterface.typeVariables = [tvA];

        this.implements.push(listInterface);

        let iteratorType = (<Klass>module.typeStore.getType("Iterator")).clone();
        iteratorType.typeVariables = [tvA];

        this.addMethod(new Method("Vector", new Parameterlist([
            // { identifier: "mx", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let ah = new ListHelper(o, module.main.getInterpreter(), module);
                o.intrinsicData["ListHelper"] = ah;

            }, false, false, 'Instanziert ein neues Vector-Objekt', true));

            this.addMethod(new Method("iterator", new Parameterlist([
            ]), iteratorType,
                (parameters) => {
    
                    let o: RuntimeObject = parameters[0].value;
                    let ah: ListHelper = o.intrinsicData["ListHelper"];
    
                    return ListIteratorImplClass.getIterator(ah, ah.interpreter, module, "ascending").value;
    
                }, false, false, "Gibt einen Iterator über die Elemente dieser Collection zurück."));
    

        this.addMethod(new Method("add", new Parameterlist([
            { identifier: "element", type: typeA, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let r: Value = parameters[1];
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.add(r);

            }, false, false, "Fügt der Liste ein Element hinzu. Gibt genau dann true zurück, wenn sich der Zustand der Liste dadurch geändert hat."));

        this.addMethod(new Method("get", new Parameterlist([
            { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), typeA,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let index: number = parameters[1].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.get(index).value;

            }, false, false, "Gibt das i-te Element der Liste zurück."));

        this.addMethod(new Method("remove", new Parameterlist([
            { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let index: number = parameters[1].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                ah.remove(index).value;

                return null;

            }, false, false, "Entfernt das Element an der Stelle index. WICHTIG: Das erste Element hat den Index 0. Es ist 0 <= index < size()"));

        this.addMethod(new Method("indexOf", new Parameterlist([
            { identifier: "o", type: typeA, declaration: null, usagePositions: null, isFinal: true }
        ]), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let object: Value = parameters[1];
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.indexOf(object);

            }, false, false, "Gibt den Index des Elements o zurück. Gibt -1 zurück, wenn die Liste das Element o nicht enthält. WICHTIG: Das erste Element hat den Index 0, das letzte den Index size() - 1. "));

        this.addMethod(new Method("addAll", new Parameterlist([
            { identifier: "c", type: this, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let object: RuntimeObject = parameters[1].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.adAll(object);

            },
            false, false, "Fügt alle Elemente von c dieser Collection hinzu."));

        this.addMethod(new Method("clear", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.clear();

            },
            false, false, "Entfernt alle Element aus dieser Collection."));

        this.addMethod(new Method("contains", new Parameterlist([
            { identifier: "o", type: typeA, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let object: Value = parameters[1];
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.contains(object);

            },
            false, false, "Testet, ob die Collection das Element enthält."));

        this.addMethod(new Method("remove", new Parameterlist([
            { identifier: "o", type: typeA, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let object: Value = parameters[1];
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.removeObject(object);

            },
            false, false, "Entfernt das Element o aus der Collection. Gibt true zurück, wenn die Collection das Element enthalten hatte."));

        this.addMethod(new Method("isEmpty", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.isEmpty();

            },
            false, false, "Testet, ob die Collection das leer ist."));

        this.addMethod(new Method("size", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.size();

            },
            false, false, "Gibt die Anzahl der Elemente der Collection zurück."));




    }

}

