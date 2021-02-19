import { Module } from "../../compiler/parser/Module.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { Interface, TypeVariable, Klass } from "../../compiler/types/Class.js";
import { voidPrimitiveType, booleanPrimitiveType, intPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";

export class IterableClass extends Interface {

    constructor(module: Module) {
        
        super("Iterable", module, "Interface mit Funktionalität zum iterieren (d.h. Durchlaufen aller Elemente)");

        let typeE: Klass = (<Klass>module.typeStore.getType("Object")).clone();
        typeE.identifier = "E";
        typeE.isTypeVariable = true;

        let tvE: TypeVariable = {
            identifier: "E",
            scopeFrom: {line: 1, column: 1, length: 1},
            scopeTo: {line: 1, column: 1, length: 1},
            type: typeE
        };
        this.typeVariables.push(tvE);

        let iteratorType = (<Klass>module.typeStore.getType("Iterator")).clone();
        iteratorType.typeVariables = [tvE];


        this.addMethod(new Method("iterator", new Parameterlist([
        ]), iteratorType,
            null,  // no implementation!
            true, false, "Gibt einen Iterator über die Elemente dieser Collection zurück."));

    }

}
