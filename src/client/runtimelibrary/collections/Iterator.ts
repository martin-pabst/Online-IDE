import { Module } from "../../compiler/parser/Module.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { Interface, TypeVariable, Klass } from "../../compiler/types/Class.js";
import { voidPrimitiveType, booleanPrimitiveType, intPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";

export class IteratorClass extends Interface {

    constructor(module: Module) {
        
        super("Iterator", module);

        let typeA: Klass = (<Klass>module.typeStore.getType("Object")).clone();
        typeA.identifier = "E";
        typeA.isTypeVariable = true;

        let tvE: TypeVariable = {
            identifier: "E",
            scopeFrom: {line: 1, column: 1, length: 1},
            scopeTo: {line: 1, column: 1, length: 1},
            type: typeA
        };

        this.typeVariables.push(tvE);


        this.addMethod(new Method("hasNext", new Parameterlist([
        ]), booleanPrimitiveType,
            null,  // no implementation!
            true, false, "Gibt genau dann true zurück, wenn sich noch mindestens ein weiteres Element in der Collection befindet."));

        this.addMethod(new Method("next", new Parameterlist([
            // { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), typeA,
            null,  // no implementation!
            true, false, "Gibt das nächste Element der Collection zurück."));

        this.addMethod(new Method("remove", new Parameterlist([
            // { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            null,  // no implementation!
            true, false, "Löscht das letzte durch next zurückgegebene Objekt. Diese Methode beeinflusst nicht, welches Element als nächstes durch next zurückgegeben wird."));

    }

}
