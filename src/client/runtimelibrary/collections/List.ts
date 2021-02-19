import { Module } from "../../compiler/parser/Module.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { Interface, TypeVariable, Klass } from "../../compiler/types/Class.js";
import { voidPrimitiveType, booleanPrimitiveType, intPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";

export class ListClass extends Interface {

    constructor(module: Module) {
        
        super("List", module, "Interface mit Methoden einer Liste (d.h. Anfügen von Elementen nur am Ende)");

        let objectType = module.typeStore.getType("Object");

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

        let collectionInterface = (<Interface>module.typeStore.getType("Collection")).clone();
        collectionInterface.typeVariables = [tvE];

        this.extends.push(collectionInterface);

        this.addMethod(new Method("get", new Parameterlist([
            { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), typeE,
            null,  // no implementation!
            true, false, "Gibt das Element der Liste an der Stelle index zurück. WICHTIG: Das erste Element hat den Index 0. Es ist 0 <= index < size()"));

        this.addMethod(new Method("remove", new Parameterlist([
            { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            null,  // no implementation!
            true, false, "Entfernt das Element an der Stelle index. WICHTIG: Das erste Element hat den Index 0. Es ist 0 <= index < size()"));

            this.addMethod(new Method("indexOf", new Parameterlist([
            { identifier: "o", type: objectType, declaration: null, usagePositions: null, isFinal: true }
        ]), intPrimitiveType,
            null,  // no implementation!
            true, false, "Gibt den Index des Elements o zurück. Gibt -1 zurück, wenn die Liste das Element o nicht enthält. WICHTIG: Das erste Element hat den Index 0, das letzte den Index size() - 1. "));
    }

}
