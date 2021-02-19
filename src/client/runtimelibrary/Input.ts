import { Type, Method, Parameterlist, Value, Attribute } from "../compiler/types/Types.js";
import { Klass, Visibility } from "../compiler/types/Class.js";
import { stringPrimitiveType, doublePrimitiveType, floatPrimitiveType, intPrimitiveType, charPrimitiveType, booleanPrimitiveType } from "../compiler/types/PrimitiveTypes.js";
import { Module } from "../compiler/parser/Module.js";
import { PrintManager } from "../main/gui/PrintManager.js";

export class InputClass extends Klass {

    constructor(module: Module) {
        super("Input", module, "Klasse mit statischen Methoden zur Eingabe von Text per Tastatur");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));

        this.addMethod(new Method("readChar", new Parameterlist([
            { identifier: "Meldungstext", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "Defaultwert", type: charPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
            ]), charPrimitiveType,
            (parameters) => {
                return null; // done by compiler magic in class Interpreter!
            }, 
        false, true, "Erwartet vom Benutzer die Eingabe eines Wertes vom Datentyp char"));

        this.addMethod(new Method("readInt", new Parameterlist([
            { identifier: "Meldungstext", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "Defaultwert", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
            ]), intPrimitiveType,
            (parameters) => {
                return null; // done by compiler magic in class Interpreter!
            }, 
        false, true, "Erwartet vom Benutzer die Eingabe eines Wertes vom Datentyp int"));

        this.addMethod(new Method("readString", new Parameterlist([
            { identifier: "Meldungstext", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "Defaultwert", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
            ]), stringPrimitiveType,
            (parameters) => {
                return null; // done by compiler magic in class Interpreter!
            }, 
        false, true, "Erwartet vom Benutzer die Eingabe eines Wertes vom Datentyp String"));

        this.addMethod(new Method("readFloat", new Parameterlist([
            { identifier: "Meldungstext", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "Defaultwert", type: floatPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
            ]), floatPrimitiveType,
            (parameters) => {
                return null; // done by compiler magic in class Interpreter!
            }, 
        false, true, "Erwartet vom Benutzer die Eingabe eines Wertes vom Datentyp float"));

        this.addMethod(new Method("readDouble", new Parameterlist([
            { identifier: "Meldungstext", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "Defaultwert", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
            ]), doublePrimitiveType,
            (parameters) => {
                return null; // done by compiler magic in class Interpreter!
            }, 
        false, true, "Erwartet vom Benutzer die Eingabe eines Wertes vom Datentyp double"));

        this.addMethod(new Method("readBoolean", new Parameterlist([
            { identifier: "Meldungstext", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "Defaultwert", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
            ]), booleanPrimitiveType,
            (parameters) => {
                return null; // done by compiler magic in class Interpreter!
            }, 
        false, true, "Erwartet vom Benutzer die Eingabe eines Wertes vom Datentyp boolean"));

        /**
         * Same methods without default value:
         */

        this.addMethod(new Method("readChar", new Parameterlist([
            { identifier: "Meldungstext", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            ]), charPrimitiveType,
            (parameters) => {
                return null; // done by compiler magic in class Interpreter!
            }, 
        false, true, "Erwartet vom Benutzer die Eingabe eines Wertes vom Datentyp char"));

        this.addMethod(new Method("readInt", new Parameterlist([
            { identifier: "Meldungstext", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            ]), intPrimitiveType,
            (parameters) => {
                return null; // done by compiler magic in class Interpreter!
            }, 
        false, true, "Erwartet vom Benutzer die Eingabe eines Wertes vom Datentyp int"));

        this.addMethod(new Method("readString", new Parameterlist([
            { identifier: "Meldungstext", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            ]), stringPrimitiveType,
            (parameters) => {
                return null; // done by compiler magic in class Interpreter!
            }, 
        false, true, "Erwartet vom Benutzer die Eingabe eines Wertes vom Datentyp String"));

        this.addMethod(new Method("readFloat", new Parameterlist([
            { identifier: "Meldungstext", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            ]), floatPrimitiveType,
            (parameters) => {
                return null; // done by compiler magic in class Interpreter!
            }, 
        false, true, "Erwartet vom Benutzer die Eingabe eines Wertes vom Datentyp float"));

        this.addMethod(new Method("readDouble", new Parameterlist([
            { identifier: "Meldungstext", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            ]), doublePrimitiveType,
            (parameters) => {
                return null; // done by compiler magic in class Interpreter!
            }, 
        false, true, "Erwartet vom Benutzer die Eingabe eines Wertes vom Datentyp double"));

        this.addMethod(new Method("readBoolean", new Parameterlist([
            { identifier: "Meldungstext", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            ]), booleanPrimitiveType,
            (parameters) => {
                return null; // done by compiler magic in class Interpreter!
            }, 
        false, true, "Erwartet vom Benutzer die Eingabe eines Wertes vom Datentyp boolean"));

    }


}