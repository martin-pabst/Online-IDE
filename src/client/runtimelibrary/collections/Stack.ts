import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { booleanPrimitiveType, intPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist, Value } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { ListHelper } from "./ArrayList.js";

export class StackClass extends Klass {

    constructor(module: Module) {

        super("Stack", module, "Stack (Stapelspeicher)");

        let objectType = module.typeStore.getType("Object");
        let vectorType = <Klass>module.typeStore.getType("Vector");

        this.setBaseClass(vectorType);
        this.typeVariables = vectorType.typeVariables;
        let typeE = this.typeVariables[0].type;

        this.addMethod(new Method("push", new Parameterlist([
            { identifier: "element", type: typeE, declaration: null, usagePositions: null, isFinal: true }
        ]), typeE,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let r: Value = parameters[1];
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                ah.add(r);

                return r.value;

            }, false, false, "Pushed ein Element oben auf den Stack. Gibt das gerade gepushte Element zurück."));

        this.addMethod(new Method("pop", new Parameterlist([
        ]), typeE,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.pop();

            }, false, false, "Nimmt das oberste Element vom Stack und gibt es zurück."));

            this.addMethod(new Method("peek", new Parameterlist([
        ]), typeE,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.peek();

            }, false, false, "Gibt das oberste Element des Stacks zurück, nimmt es aber nicht vom Stack herunter."));

        this.addMethod(new Method("empty", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.isEmpty();

            },
            true, false, "Testet, ob die Collection das leer ist."));

        this.addMethod(new Method("search", new Parameterlist([
            { identifier: "element", type: typeE, declaration: null, usagePositions: null, isFinal: true }
        ]), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let r: Value = parameters[1];
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                let index = ah.indexOf(r);
                return index == -1 ? index : ah.objectArray.length - index;

            },
            true, false, "Gibt die Position des Objekts auf dem Stack zurück. Dabei hat das oberste Element den Index 1, das nächstunterste den Index 2 usw. . Falls sich das Objekt nicht auf dem Stack befindet, wird -1 zurückgegeben."));




    }

}

