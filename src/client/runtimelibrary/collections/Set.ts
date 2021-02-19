import { Module } from "../../compiler/parser/Module.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { Interface, TypeVariable, Klass } from "../../compiler/types/Class.js";
import { voidPrimitiveType, booleanPrimitiveType, intPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";

export class SetClass extends Interface {

    constructor(module: Module) {

        super("Set", module, "Interface mit Methoden eines Set, d.h. einer Menge, die jedes Element maximal einmal enthält");

        let objectType = module.typeStore.getType("Object");

        let typeE: Klass = (<Klass>module.typeStore.getType("Object")).clone();
        typeE.identifier = "E";
        typeE.isTypeVariable = true;

        let tvE: TypeVariable = {
            identifier: "E",
            scopeFrom: { line: 1, column: 1, length: 1 },
            scopeTo: { line: 1, column: 1, length: 1 },
            type: typeE
        };

        this.typeVariables.push(tvE);

        let collectionInterface = (<Interface>module.typeStore.getType("Collection")).clone();
        collectionInterface.typeVariables = [tvE];

        this.extends.push(collectionInterface);

        this.addMethod(new Method("contains", new Parameterlist([
            { identifier: "o", type: objectType, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            null,  // no implementation!
            true, false, "Gibt genau dann true zurück, wenn das Set das Objekt o enthält."));

        this.addMethod(new Method("containsAll", new Parameterlist([
            { identifier: "c", type: collectionInterface, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            null,  // no implementation!
            true, false, "Gibt genau dann true zurück, wenn das Set alle Elemente der übergebenen Collection enthält."));

    }

}
