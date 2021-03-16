import { Klass, Visibility } from "../../compiler/types/Class.js";
import { Module } from "../../compiler/parser/Module.js";
import { Method, Parameterlist, Attribute } from "../../compiler/types/Types.js";
import { intPrimitiveType, doublePrimitiveType, voidPrimitiveType, stringPrimitiveType, booleanPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { ShapeHelper } from "./Shape.js";
import { ColorHelper } from "./ColorHelper.js";
import { FilledShapeHelper } from "./FilledShape.js";
import { WorldHelper, WorldClass } from "./World.js";

export type ColorClassIntrinsicData = {
    red: number,
    green: number,
    blue: number,
    hex: string
}

export class ColorClass extends Klass {

    constructor(module: Module) {

        super("Color", module, "Farbe");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));

        for (let colorName in ColorHelper.predefinedColors) {

            let intColor = ColorHelper.predefinedColors[colorName];

            let r: RuntimeObject = new RuntimeObject(this);

            let red = (intColor & 0xff0000) >> 16;
            let green = (intColor & 0xff00) >> 8;
            let blue = (intColor & 0xff);

            let id: ColorClassIntrinsicData = {
                red: red,
                green: green,
                blue: blue,
                hex: ColorHelper.intColorToHexRGB(intColor)
            }

            r.intrinsicData = id;

            this.addAttribute(new Attribute(colorName, this,
                (value) => { value.value = r }, true, Visibility.public, true,
                "Die Farbe " + colorName + " (" + ColorHelper.intColorToHexRGB(intColor) + " oder " + ColorHelper.intColorToRGB(intColor)));
        }

        this.setupAttributeIndicesRecursive();
        this.staticClass.setupAttributeIndicesRecursive();

        this.staticClass.classObject = new RuntimeObject(this.staticClass);

        this.addMethod(new Method("Color", new Parameterlist([
            { identifier: "red", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "green", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "blue", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;
                let red: number = Math.trunc(parameters[1].value);
                let green: number = Math.trunc(parameters[2].value);
                let blue: number = Math.trunc(parameters[3].value);


                let intrinsicData: ColorClassIntrinsicData = {
                    red: red,
                    green: green,
                    blue: blue,
                    hex: "rgb(" + red + ", " + green + ", " + blue + ")"
                };

                o.intrinsicData = intrinsicData;

            }, false, false, 'Instanziert eine neue Farbe. Red, green und blue sind die Farbanteile, jeweils als integer-Zahlen im Bereich von 0 bis 255.'
            , true));

        this.addMethod(new Method("randomColor", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;

                return Math.floor(Math.random() * 0xffffff);

            }, false, true, 'Gibt eine zufällige Farbe (ohne Transparenz) zurück.'
            , false));

        this.addMethod(new Method("randomColor", new Parameterlist([
            { identifier: "minimumRGBValue", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), intPrimitiveType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;
                let min: number = parameters[1].value;
                if (min < 0) min = 0;
                if (min > 255) min = 255;

                let r: number = Math.floor(Math.random() * (256 - min)) + min;
                let g: number = Math.floor(Math.random() * (256 - min)) + min;
                let b: number = Math.floor(Math.random() * (256 - min)) + min;

                return 0x10000 * r + 0x100 * g + b;

            }, false, true, 'Gibt eine zufällige Farbe (ohne Transparenz) zurück. Min ist der Mindestwert für den Rot-, Grün- und Blauanteil, wobei jeder der Anteile und daher auch min zwischen 0 und 255 (jeweils einschließlich) liegen muss.'
            , false));

        this.addMethod(new Method("randomColor", new Parameterlist([
            { identifier: "minimumRGBValue", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "maximumRGBValue", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), intPrimitiveType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;
                let min: number = parameters[1].value;
                let max: number = parameters[1].value;
                if (min < 0) min = 0;
                if (min > 255) min = 255;
                if (max < 0) max = 0;
                if (max > 255) max = 255;

                if(max < min){
                    let z = max;
                    max = min;
                    min = z;
                }

                let r: number = Math.floor(Math.random() * (max - min + 1)) + min;
                let g: number = Math.floor(Math.random() * (max - min + 1)) + min;
                let b: number = Math.floor(Math.random() * (max - min + 1)) + min;

                return 0x10000 * r + 0x100 * g + b;

            }, false, true, 'Gibt eine zufällige Farbe (ohne Transparenz) zurück. Min ist der Mindestwert für den Rot-, Grün- und Blauanteil, max der Höchstwert, wobei jeder der Anteile und daher auch min zwischen 0 und 255 (jeweils einschließlich) liegen muss.'
            , false));

        this.addMethod(new Method("toString", new Parameterlist([
        ]), stringPrimitiveType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;

                return (<ColorClassIntrinsicData>(o.intrinsicData)).hex;

            }, false, false, 'Verwandelt die Farbe in einen String.', false));

        this.addMethod(new Method("equals", new Parameterlist([
            { identifier: "otherColor", type: this, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;
                let o1: RuntimeObject = parameters[1].value;

                let d = <ColorClassIntrinsicData>(o.intrinsicData);
                let d1 = <ColorClassIntrinsicData>(o1.intrinsicData);

                return (d.red == d1.red && d.green == d1.green && d.blue == d1.blue);

            }, false, false, 'Vergleicht zwei Farben', false));

        this.addMethod(new Method("getRed", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;

                return (<ColorClassIntrinsicData>(o.intrinsicData)).red;

            }, false, false, 'Gibt den Rotanteil der Farbe zurück (0 - 255).', false));

        this.addMethod(new Method("getGreen", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;

                return (<ColorClassIntrinsicData>(o.intrinsicData)).green;

            }, false, false, 'Gibt den Grünanteil der Farbe zurück (0 - 255).', false));

        this.addMethod(new Method("getBlue", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;

                return (<ColorClassIntrinsicData>(o.intrinsicData)).blue;

            }, false, false, 'Gibt den Blauanteil der Farbe zurück (0 - 255).', false));

        this.addMethod(new Method("fromRGB", new Parameterlist([
            { identifier: "red", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "green", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "blue", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), intPrimitiveType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;
                let r: number = parameters[1].value;
                let g: number = parameters[2].value;
                let b: number = parameters[3].value;
                return (r * 0x10000 + g * 0x100 + b);

            }, false, true, 'Berechnet aus Rot-, Grün- und Blauwert (alle zwischen 0 und 255) die Farbe.', false));

        this.addMethod(new Method("fromRGBA", new Parameterlist([
            { identifier: "red", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "green", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "blue", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "alpha", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), stringPrimitiveType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;
                let r: number = parameters[1].value;
                let g: number = parameters[2].value;
                let b: number = parameters[3].value;
                let a: number = parameters[4].value;
                let color: string = (r * 0x1000000 + g * 0x10000 + b * 0x100 + Math.floor(a * 255)).toString(16);
                while (color.length < 8) color = "0" + color;

                return "#" + color;

            }, false, true, 'Berechnet aus Rot-, Grün- und Blauwert (alle zwischen 0 und 255) sowie Alpha-Wert (zwischen 0 und 1) die Farbe.', false));

    }

}

