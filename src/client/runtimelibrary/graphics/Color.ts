import { Klass, Visibility } from "../../compiler/types/Class.js";
import { Module } from "../../compiler/parser/Module.js";
import { Method, Parameterlist, Attribute } from "../../compiler/types/Types.js";
import { intPrimitiveType, doublePrimitiveType, voidPrimitiveType, stringPrimitiveType, booleanPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { ShapeHelper } from "./Shape.js";
import { ColorHelper } from "./ColorHelper.js";
import { FilledShapeHelper } from "./FilledShape.js";
import { WorldHelper, WorldClass } from "./World.js";
import { param } from "jquery";

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

            let a: Attribute = new Attribute(colorName, this,
                (value) => { value.value = r }, true, Visibility.public, true,
                "Die Farbe " + colorName + " (" + ColorHelper.intColorToHexRGB(intColor) + ") oder " + ColorHelper.intColorToRGB(intColor));

            //@ts-ignore
            a.color = ColorHelper.intColorToHexRGB(intColor);

            this.addAttribute(a);
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

                if (max < min) {
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

        this.addMethod(new Method("toInt", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;
                let cid = <ColorClassIntrinsicData>(o.intrinsicData);

                return 0x10000 * cid.red + 0x100 * cid.green + cid.blue;

            }, false, false, 'Verwandelt die Farbe in einen int-Wert um, genauer: gibt 0x10000 * red + 0x100 * green + blue zurück.', false));

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

                r = Math.min(r, 255); r = Math.max(0, r);
                g = Math.min(g, 255); g = Math.max(0, g);
                b = Math.min(b, 255); b = Math.max(0, b);

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

                r = Math.min(r, 255); r = Math.max(0, r);
                g = Math.min(g, 255); g = Math.max(0, g);
                b = Math.min(b, 255); b = Math.max(0, b);

                a = Math.min(a, 1); a = Math.max(0, a);

                let color: string = (r * 0x1000000 + g * 0x10000 + b * 0x100 + Math.floor(a * 255)).toString(16);
                while (color.length < 8) color = "0" + color;

                return "#" + color;

            }, false, true, 'Berechnet aus Rot-, Grün- und Blauwert (alle zwischen 0 und 255) sowie Alpha-Wert (zwischen 0 und 1) die Farbe.', false));

        this.addMethod(new Method("fromHSLA", new Parameterlist([
            { identifier: "hue", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "saturation", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "luminance", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "alpha", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), stringPrimitiveType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;
                let h: number = parameters[1].value;
                let s: number = parameters[2].value;
                let l: number = parameters[3].value;
                let a: number = parameters[4].value;

                h = Math.min(h, 360); h = Math.max(0, h);
                s = Math.min(s, 100); s = Math.max(0, s);
                l = Math.min(l, 100); l = Math.max(0, l);
                a = Math.min(a, 1); a = Math.max(0, a);

                let rgb = this.hslToRgb(h, s, l);

                let color: string = (rgb.r * 0x1000000 + rgb.g * 0x10000 + rgb.b * 0x100 + Math.floor(a * 255)).toString(16);
                while (color.length < 8) color = "0" + color;

                return "#" + color;

            }, false, true, 'Berechnet Hue (0 - 360), Saturation (0 - 100) und Luminance (0 - 100) sowie Alpha-Wert (zwischen 0 und 1) die Farbe.', false));

        this.addMethod(new Method("fromHSL", new Parameterlist([
            { identifier: "hue", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "saturation", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "luminance", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), intPrimitiveType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;
                let h: number = parameters[1].value;
                let s: number = parameters[2].value;
                let l: number = parameters[3].value;

                h = Math.min(h, 360); h = Math.max(0, h);
                s = Math.min(s, 100); s = Math.max(0, s);
                l = Math.min(l, 100); l = Math.max(0, l);

                let rgb = this.hslToRgb(h, s, l);

                return (rgb.r * 0x10000 + rgb.g * 0x100 + rgb.b);

            }, false, true, 'Berechnet Hue (0 - 360), Saturation (0 - 100) und Luminance (0 - 100)die Farbe.', false));


    }

    hslToRgb(h: number, s: number, l: number): { r: number, g: number, b: number } {

        s /= 100;
        l /= 100;

        let c = (1 - Math.abs(2 * l - 1)) * s,
            x = c * (1 - Math.abs((h / 60) % 2 - 1)),
            m = l - c / 2,
            r = 0,
            g = 0,
            b = 0;

        if (0 <= h && h < 60) {
            r = c; g = x; b = 0;
        } else if (60 <= h && h < 120) {
            r = x; g = c; b = 0;
        } else if (120 <= h && h < 180) {
            r = 0; g = c; b = x;
        } else if (180 <= h && h < 240) {
            r = 0; g = x; b = c;
        } else if (240 <= h && h < 300) {
            r = x; g = 0; b = c;
        } else if (300 <= h && h < 360) {
            r = c; g = 0; b = x;
        }
        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);


        return {r: r, g: g, b: b}

    }

}

