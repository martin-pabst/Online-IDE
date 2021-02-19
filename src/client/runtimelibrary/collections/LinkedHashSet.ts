import { Module } from "../../compiler/parser/Module.js";
import { Interface, Klass, TypeVariable } from "../../compiler/types/Class.js";
import { booleanPrimitiveType, intPrimitiveType, stringPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist, Value } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { SetIteratorImplClass } from "./SetIteratorImpl.js";
import { SetHelper } from "./SetHelper.js";

export class LinkedHashSetClass extends Klass {

    constructor(module: Module) {

        super("LinkedHashSet", module, "Ein LinkedHashSet speichert jedes Element nur genau ein Mal.");

        let objectType = module.typeStore.getType("Object");

        this.setBaseClass(<Klass>objectType);

        let typeE: Klass = (<Klass>objectType).clone();
        typeE.identifier = "E";
        typeE.isTypeVariable = true;

        let tvE: TypeVariable = {
            identifier: "E",
            scopeFrom: { line: 1, column: 1, length: 1 },
            scopeTo: { line: 1, column: 1, length: 1 },
            type: typeE
        };

        this.typeVariables.push(tvE);

        let setInterface = (<Interface>module.typeStore.getType("Set")).clone();
        setInterface.typeVariables = [tvE];

        this.implements.push(setInterface);

        let iteratorType = (<Klass>module.typeStore.getType("Iterator")).clone();
        iteratorType.typeVariables = [tvE];

        this.addMethod(new Method("LinkedHashSet", new Parameterlist([
            // { identifier: "mx", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let mh = new SetHelper(o, module.main.getInterpreter(), module);
                o.intrinsicData["MapHelper"] = mh;

            }, false, false, 'Instanziert ein neues LinkedHashSet', true));

        this.addMethod(new Method("iterator", new Parameterlist([
        ]), iteratorType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: SetHelper = o.intrinsicData["ListHelper"];

                return SetIteratorImplClass.getIterator(ah, ah.interpreter, module, "ascending").value;

            }, false, false, "Gibt einen Iterator über die Elemente dieser Collection zurück."));

        this.addMethod(new Method("add", new Parameterlist([
            { identifier: "element", type: typeE, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let r: Value = parameters[1];
                let ah: SetHelper = o.intrinsicData["ListHelper"];

                return ah.addToSet(r);

            }, false, false, "Fügt der Liste ein Element hinzu. Gibt genau dann true zurück, wenn sich der Zustand der Liste dadurch geändert hat."));

        this.addMethod(new Method("addAll", new Parameterlist([
            { identifier: "c", type: this, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let object: RuntimeObject = parameters[1].value;
                let ah: SetHelper = o.intrinsicData["ListHelper"];

                return ah.adAll(object);

            },
            false, false, "Fügt alle Elemente von c dieser Collection hinzu."));

        this.addMethod(new Method("clear", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: SetHelper = o.intrinsicData["ListHelper"];

                return ah.clear();

            },
            false, false, "Entfernt alle Element aus dieser Collection."));

        this.addMethod(new Method("contains", new Parameterlist([
            { identifier: "o", type: typeE, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let object: Value = parameters[1];
                let ah: SetHelper = o.intrinsicData["ListHelper"];

                return ah.contains(object);

            },
            false, false, "Testet, ob die Collection das Element enthält."));

        this.addMethod(new Method("remove", new Parameterlist([
            { identifier: "o", type: typeE, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let object: Value = parameters[1];
                let ah: SetHelper = o.intrinsicData["ListHelper"];

                return ah.removeObject(object);

            },
            false, false, "Entfernt das Element o aus der Collection. Gibt true zurück, wenn die Collection das Element enthalten hatte."));

        this.addMethod(new Method("isEmpty", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: SetHelper = o.intrinsicData["ListHelper"];

                return ah.isEmpty();

            },
            false, false, "Testet, ob die Collection das leer ist."));

        this.addMethod(new Method("size", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: SetHelper = o.intrinsicData["ListHelper"];

                return ah.size();

            },
            false, false, "Gibt die Anzahl der Elemente der Collection zurück."));

        this.addMethod(new Method("toString", new Parameterlist([]), stringPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: SetHelper = o.intrinsicData["ListHelper"];

                return ah.to_String();

            }, false, false));

    }

}

