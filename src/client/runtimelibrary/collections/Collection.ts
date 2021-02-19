import { Module } from "../../compiler/parser/Module.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { Interface, TypeVariable, Klass } from "../../compiler/types/Class.js";
import { voidPrimitiveType, booleanPrimitiveType, intPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";

export class CollectionClass extends Interface {

    constructor(module: Module) {
        
        super("Collection", module, "Interface für Listen, Maps, Sets usw. mit Methoden zum Einfügen von Objekten, Zugriff auf Objekte und zur Ermittlung der Anzahl der Objekte");

        let objectType = module.typeStore.getType("Object");

        let typeE: Klass = (<Klass>objectType).clone();
        typeE.identifier = "E";
        typeE.isTypeVariable = true;

        let tvE: TypeVariable = {
            identifier: "E",
            scopeFrom: {line: 1, column: 1, length: 1},
            scopeTo: {line: 1, column: 1, length: 1},
            type: typeE
        };
        this.typeVariables.push(tvE);

        let iterableInterface = (<Interface>module.typeStore.getType("Iterable")).clone();
        iterableInterface.typeVariables = [tvE];

        this.extends.push(iterableInterface);


        this.addMethod(new Method("add", new Parameterlist([
            { identifier: "element", type: typeE, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            null,  // no implementation!
            true, false, "Fügt der Collection ein Element hinzu. Gibt genau dann true zurück, wenn sich der Zustand der Collection dadurch geändert hat."));

        this.addMethod(new Method("addAll", new Parameterlist([
            { identifier: "c", type: this, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            null,  // no implementation!
            true, false, "Fügt alle Elemente von c dieser Collection hinzu."));

        // TODO: Implement
        // this.addMethod(new Method("removeAll", new Parameterlist([
        //     { identifier: "c", type: this, declaration: null, usagePositions: null, isFinal: true }
        // ]), booleanPrimitiveType,
        //     null,  // no implementation!
        //     true, false, "Löscht alle Elemente aus dieser Collection, die in c enthalten sind."));

        this.addMethod(new Method("clear", new Parameterlist([
        ]), null,
            null,  // no implementation!
            true, false, "Entfernt alle Element aus dieser Collection."));

        this.addMethod(new Method("contains", new Parameterlist([
            { identifier: "o", type: objectType, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            null,  // no implementation!
            true, false, "Testet, ob die Collection das Element enthält."));

        this.addMethod(new Method("remove", new Parameterlist([
            { identifier: "o", type: objectType, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            null,  // no implementation!
            true, false, "Entfernt das Element o aus der Collection. Gibt true zurück, wenn die Collection das Element enthalten hatte."));

        this.addMethod(new Method("isEmpty", new Parameterlist([
        ]), booleanPrimitiveType,
            null,  // no implementation!
            true, false, "Testet, ob die Collection das leer ist."));

        this.addMethod(new Method("size", new Parameterlist([
        ]), intPrimitiveType,
            null,  // no implementation!
            true, false, "Gibt die Anzahl der Elemente der Collection zurück."));


    
    }

}
