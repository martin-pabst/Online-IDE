import { Module } from "../../compiler/parser/Module.js";
import { Interface, Klass } from "../../compiler/types/Class.js";
import { charPrimitiveType, doublePrimitiveType, intPrimitiveType, voidPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";

export class GNGAktionsempfaengerInterface extends Interface {

    constructor(module: Module) {
        super("Aktionsempfaenger", module, "GNG: Interface für die Aktionsausführung");

        this.addMethod(new Method("Ausführen", new Parameterlist([]), voidPrimitiveType,
            null,  // no implementation!
            false, false, "Diese Methode wird vom Taktgeber aufgerufen."));

        this.addMethod(new Method("Taste", new Parameterlist([
            { identifier: "taste", type: charPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
            null,  // no implementation!
            false, false, "Wird aufgerufen, wenn eine Taste gedrückt wird."));

        this.addMethod(new Method("SonderTaste", new Parameterlist([
            { identifier: "taste", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
            null,  // no implementation!
            false, false, "Wird aufgerufen, wenn eine Sondertaste gedrückt wird."));

        this.addMethod(new Method("Geklickt", new Parameterlist([
            { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "anzahl", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            null,  // no implementation!
            false, false, "Wird aufgerufen, wenn eine die linke Maustaste gedrückt wird."));


    }

}

