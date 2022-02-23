import { Module } from "../../compiler/parser/Module.js";
import { Interface, Klass } from "../../compiler/types/Class.js";
import { doublePrimitiveType, intPrimitiveType, voidPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";

export class MouseListenerInterface extends Interface {

    constructor(module: Module) {
        super("MouseListener", module, "Interface mit Methoden, die aufgerufen werden, wenn Maus-Ereignisse eintreten. Ein Objekt dieser Klasse muss zuvor aber mit world.addMouseListener() registriert werden, wobei world das aktuelle World-Objekt ist.");

        this.addMethod(new Method("onMouseUp", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "button", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            null,  // no implementation!
            false, false, "Wird aufgerufen, wenn eine Maustaste über dem Grafikbereich losgelassen wird."));

        this.addMethod(new Method("onMouseDown", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "button", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            null,  // no implementation!
            false, false, "Wird aufgerufen, wenn eine Maustaste über dem Grafikbereich gedrückt wird."));

        this.addMethod(new Method("onMouseMove", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            null,  // no implementation!
            false, false, "Wird aufgerufen, wenn der Mauszeiger über dem Grafikbereich bewegt wird."));

        this.addMethod(new Method("onMouseEnter", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            null,  // no implementation!
            false, false, "Wird aufgerufen, wenn der Mauszeiger in den Grafikbereich hineinbewegt wird."));

        this.addMethod(new Method("onMouseLeave", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            null,  // no implementation!
            false, false, "Wird aufgerufen, wenn der Mauszeiger aus dem Grafikbereich herausbewegt wird."));


    }

}

export class MouseAdapterClass extends Klass {

    constructor(module: Module) {
        super("MouseAdapter", module, "Klasse mit leeren Methoden, die aufgerufen werden, wenn Maus-Ereignisse eintreten. Ein Objekt einer Kindklasse dieser Klasse muss zuvor aber mit world.addMouseListener() registriert werden, wobei world das aktuelle World-Objekt ist.");

        let mouseListenerType = <MouseListenerInterface>module.typeStore.getType("MouseListener");

        this.implements.push(mouseListenerType);

        this.addMethod(new Method("onMouseUp", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "button", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            () => {}, // no implementation!
            false, false, "Wird aufgerufen, wenn eine Maustaste über dem Grafikbereich losgelassen wird."));

        this.addMethod(new Method("onMouseDown", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "button", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            () => {}, // no implementation!
            false, false, "Wird aufgerufen, wenn eine Maustaste über dem Grafikbereich gedrückt wird."));

        this.addMethod(new Method("onMouseMove", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            () => {}, // no implementation!
            false, false, "Wird aufgerufen, wenn der Mauszeiger über dem Grafikbereich bewegt wird."));

        this.addMethod(new Method("onMouseEnter", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            () => {}, // no implementation!
            false, false, "Wird aufgerufen, wenn der Mauszeiger in den Grafikbereich hineinbewegt wird."));

        this.addMethod(new Method("onMouseLeave", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            () => {}, // no implementation!
            false, false, "Wird aufgerufen, wenn der Mauszeiger aus dem Grafikbereich herausbewegt wird."));


    }

}

