import { Module } from "../../compiler/parser/Module.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { Interface, TypeVariable, Klass } from "../../compiler/types/Class.js";
import { voidPrimitiveType, booleanPrimitiveType, intPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";

export class QueueClass extends Interface {

    constructor(module: Module) {

        super("Queue", module);

        let objectType = <Klass>module.typeStore.getType("Object");

        let typeE: Klass = objectType.clone();
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


        this.addMethod(new Method("remove", new Parameterlist([
        ]), typeE,
            null,  // no implementation!
            true, false, "Entfernt das Element am Kopf der Liste und gibt es zurück. Führt zum Fehler, wenn die Liste leer ist."));

        this.addMethod(new Method("poll", new Parameterlist([
            { identifier: "element", type: typeE, declaration: null, usagePositions: null, isFinal: true }
        ]), typeE,
            null,  // no implementation!
            true, false, "Entfernt das Element am Kopf der Liste und gibt es zurück. Gibt null zurück, wenn die Liste leer ist."));

        this.addMethod(new Method("peek", new Parameterlist([
        ]), typeE,
            null,  // no implementation!
            true, false, "Gibt das Element am Kopf der Liste zurück, entfernt es aber nicht. Gib null zurück, wenn die Liste leer ist."));

    }


}
