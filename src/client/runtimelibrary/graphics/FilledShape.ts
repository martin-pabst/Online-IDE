import { Module } from "../../compiler/parser/Module.js";
import { Klass, Visibility } from "../../compiler/types/Class.js";
import { doublePrimitiveType, stringPrimitiveType, voidPrimitiveType, intPrimitiveType, booleanPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Attribute, Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { ColorHelper } from "./ColorHelper.js";
import { ShapeHelper } from "./Shape.js";
import { WorldHelper } from "./World.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import { ColorClassIntrinsicData } from "./Color.js";
import { FilledShapeDefaults } from "./FilledShapeDefaults.js";
import { polygonEnthältPunkt, polygonzugEnthältPunkt } from "../../tools/MatheTools.js";

export class FilledShapeClass extends Klass {

    constructor(module: Module) {

        super("FilledShape", module, "Basisklasse für grafische Objekte mit Füllfarbe und Randfarbe, beide wahlweise auch transparent");

        this.setBaseClass(<Klass>module.typeStore.getType("Shape"));
        this.isAbstract = true;

        let that = this;

        let colorType: Klass = <Klass>this.module.typeStore.getType("Color");

        this.addMethod(new Method("getFillColor", new Parameterlist([
        ]), colorType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: FilledShapeHelper = o.intrinsicData["Actor"];

                return sh.getFarbeAsObject(sh.fillColor, sh.fillColor, colorType);

            }, false, false, 'Gibt die Füllfarbe des Objekts zurück.', false));

        this.addMethod(new Method("getBorderColor", new Parameterlist([
        ]), colorType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: FilledShapeHelper = o.intrinsicData["Actor"];

                return sh.getFarbeAsObject(sh.borderColor, sh.borderColor, colorType);

            }, false, false, 'Gibt die Randfarbe des Objekts zurück.', false));

        this.addAttribute(new Attribute("borderWidth", doublePrimitiveType,
            (value) => {

                let rto: RuntimeObject = value.object;
                let helper: FilledShapeHelper = rto.intrinsicData["Actor"];
                if (helper == null) {
                    value.value = Number.NaN;
                    return;
                }

                value.value = helper.borderWidth;

            }, false, Visibility.protected, true, "Randbreite in Pixeln"));

        this.addMethod(new Method("setAlpha", new Parameterlist([
            { identifier: "alphaValue", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let alpha: number = parameters[1].value;
                let sh: FilledShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setAlpha")) return;

                sh.setAlpha(alpha);

            }, false, false, 'Setzt die Durchsichtigkeit von Füllung und Rand. 0.0 bedeutet vollkommen durchsichtig, 1.0 bedeutet vollkommen undurchsichtig."', false));

        this.addMethod(new Method("getAlpha", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: FilledShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getAlpha")) return;

                return sh.fillAlpha;

            }, false, false, 'Setzt die Durchsichtigkeit von Füllung und Rand. 0.0 bedeutet vollkommen durchsichtig, 1.0 bedeutet vollkommen undurchsichtig."', false));

        this.addMethod(new Method("setFillColor", new Parameterlist([
            { identifier: "color", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let color: number = parameters[1].value;
                let sh: FilledShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setFillColor")) return;

                sh.setFillColor(color);

            }, false, false, 'Setzt die Füllfarbe. Die Farbe wird als int-Wert gegeben, wobei farbe == 256*256*rot + 256*grün + blau', false));

        this.addMethod(new Method("setDefaultBorder", new Parameterlist([
            { identifier: "width", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "color", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
            (parameters) => {

                let width: number = parameters[1].value;
                let color: string = parameters[2].value;

                FilledShapeDefaults.setDefaultBorder(width, color);

            }, false, true, 'Setzt Default-Eigenschaften des Randes. Sie werden nachfolgend immer dann verwendet, wenn ein neues grafisches Objekt erstellt wird. Die Farbe wird als int-Wert gegeben, wobei farbe == 256*256*rot + 256*grün + blau und 0.0 <= alpha <= 1.0', false));

        this.addMethod(new Method("setDefaultBorder", new Parameterlist([
            { identifier: "width", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "color", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "alpha", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let width: number = parameters[1].value;
                let color: number = parameters[2].value;
                let alpha: number = parameters[3].value;

                FilledShapeDefaults.setDefaultBorder(width, color, alpha);

            }, false, true, 'Setzt Default-Eigenschaften des Randes. Sie werden nachfolgend immer dann verwendet, wenn ein neues grafisches Objekt erstellt wird. Die Farbe wird als int-Wert gegeben, wobei farbe == 256*256*rot + 256*grün + blau und 0.0 <= alpha <= 1.0', false));

        this.addMethod(new Method("setDefaultFillColor", new Parameterlist([
            { identifier: "color", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "alpha", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let color: number = parameters[1].value;
                let alpha: number = parameters[2].value;

                FilledShapeDefaults.setDefaultFillColor(color, alpha);

            }, false, true, 'Setzt die Default-Füllfarbe. Sie wird nachfolgend immer dann verwendet, wenn ein neues grafisches Objekt erstellt wird. Die Farbe wird als int-Wert gegeben, wobei farbe == 256*256*rot + 256*grün + blau und 0.0 <= alpha <= 1.0', false));

        this.addMethod(new Method("setDefaultFillColor", new Parameterlist([
            { identifier: "color", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let color: string = parameters[1].value;

                FilledShapeDefaults.setDefaultFillColor(color);

            }, false, true, 'Setzt die Default-Füllfarbe. Sie wird nachfolgend immer dann verwendet, wenn ein neues grafisches Objekt erstellt wird. Die Farbe wird als int-Wert gegeben, wobei farbe == 256*256*rot + 256*grün + blau und 0.0 <= alpha <= 1.0', false));

        this.addMethod(new Method("setFillColor", new Parameterlist([
            { identifier: "color", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "alpha", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let color: number = parameters[1].value;
                let alpha: number = parameters[2].value;
                let sh: FilledShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setFillColor")) return;

                sh.setFillColor(color, alpha);

            }, false, false, 'Setzt die Füllfarbe. Die Farbe wird als int-Wert gegeben, wobei farbe == 256*256*rot + 256*grün + blau und 0.0 <= alpha <= 1.0', false));

        this.addMethod(new Method("setFillColor", new Parameterlist([
            { identifier: "color", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let color: string = parameters[1].value;
                let sh: FilledShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setFillColor")) return;

                sh.setFillColor(color);

            }, false, false, 'Setzt die Füllfarbe. Die Farbe ist entweder eine vordefinierte Farbe (Color.black, Color.red, ...) oder eine css-Farbe der Art "#ffa7b3" (ohne alpha), "#ffa7b380" (mit alpha), "rgb(172, 22, 18)" oder "rgba(123, 22,18, 0.3)"', false));

        this.addMethod(new Method("setFillColor", new Parameterlist([
            { identifier: "color", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "alpha", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let color: string = parameters[1].value;
                let alpha: number = parameters[2].value;
                let sh: FilledShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setFillColor")) return;

                sh.setFillColor(color, alpha);

            }, false, false, 'Setzt die Füllfarbe. Die Farbe ist entweder eine vordefinierte Farbe (Color.black, Color.red, ...) oder eine css-Farbe der Art "#ffa7b3" oder "rgb(172, 22, 18)" und 0.0 <= alpha <= 1.0"', false));

        this.addMethod(new Method("setBorderColor", new Parameterlist([
            { identifier: "color", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let color: number = parameters[1].value;
                let sh: FilledShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setBorderColor")) return;

                sh.setBorderColor(color);

            }, false, false, 'Setzt die Randfarbe. Die Farbe wird als int-Wert gegeben, wobei farbe == 256*256*rot + 256*grün + blau"', false));

        this.addMethod(new Method("setBorderColor", new Parameterlist([
            { identifier: "color", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "alpha", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let color: number = parameters[1].value;
                let alpha: number = parameters[2].value;
                let sh: FilledShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setBorderColor")) return;

                sh.setBorderColor(color, alpha);

            }, false, false, 'Setzt die Randfarbe. Die Farbe wird als int-Wert gegeben, wobei farbe == 256*256*rot + 256*grün + blau und 0.0 <= alpha <= 1.0"', false));

        this.addMethod(new Method("setBorderColor", new Parameterlist([
            { identifier: "color", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "alpha", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let color: string = parameters[1].value;
                let alpha: number = parameters[2].value;
                let sh: FilledShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setBorderColor")) return;

                sh.setBorderColor(color, alpha);

            }, false, false, 'Setzt die Randfarbe. Die Farbe ist entweder eine vordefinierte Farbe (Color.black, Color.red, ...) oder eine css-Farbe der Art "#ffa7b3" oder "rgb(172, 22, 18)" und 0.0 <= alpha <= 1.0"', false));

        this.addMethod(new Method("setBorderColor", new Parameterlist([
            { identifier: "colorAsRGBAString", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let color: string = parameters[1].value;
                let sh: FilledShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setBorderColor")) return;

                sh.setBorderColor(color);

            }, false, false, 'Setzt die Randfarbe. Die Farbe ist entweder eine vordefinierte Farbe (Color.black, Color.red, ...) oder eine css-Farbe der Art "#ffa7b3" (ohne alpha), "#ffa7b380" (mit alpha), "rgb(172, 22, 18)" oder "rgba(123, 22,18, 0.3)"', false));

        this.addMethod(new Method("setBorderWidth", new Parameterlist([
            { identifier: "widthInPixel", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let width: number = parameters[1].value;
                let sh: FilledShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setBorderWidth")) return;

                sh.setBorderWidth(width);

            }, false, false, 'Setzt die Linienbreite des Randes (Einheit: Pixel)"', false));


        this.setupAttributeIndicesRecursive();

    }

    rgbaToHex(rgb: number, alpha: number): string {
        let s = rgb == null ? "---" : rgb.toString(16);
        while (s.length < 6) s = "0" + s;

        let a = Math.round(alpha * 255).toString(16);
        if (a.length < 2) a = "0" + a;

        return "#" + s + a;

    }

}

export abstract class FilledShapeHelper extends ShapeHelper {

    fillColor: number;
    fillAlpha: number;

    borderColor: number;
    borderAlpha: number;
    borderWidth: number;


    constructor(interpreter: Interpreter, runtimeObject: RuntimeObject) {
        super(interpreter, runtimeObject);
        this.borderColor = FilledShapeDefaults.defaultBorderColor;
        this.borderAlpha = FilledShapeDefaults.defaultBorderAlpha;
        this.borderWidth = FilledShapeDefaults.defaultBorderWidth;

        this.fillColor = FilledShapeDefaults.defaultFillColor;
        this.fillAlpha = FilledShapeDefaults.defaultFillAlpha;
    }

    copyFrom(fsh: FilledShapeHelper) {
        super.copyFrom(fsh);
        this.fillColor = fsh.fillColor;
        this.fillAlpha = fsh.fillAlpha;

        this.borderColor = fsh.borderColor;
        this.borderAlpha = fsh.borderAlpha;
        this.borderWidth = fsh.borderWidth;
    }

    setAlpha(alpha: number) {

        this.fillAlpha = alpha;
        this.borderAlpha = alpha;
        this.render();
    }

    setBorderColor(color: string | number, alpha?: number) {

        if (typeof color == "string") {
            let c = ColorHelper.parseColorToOpenGL(color);
            this.borderColor = c.color;
            this.borderAlpha = alpha == null ? c.alpha : alpha;
        } else {
            this.borderColor = color % 0x1000000;
            this.borderAlpha = alpha;
        }

        this.render();

    }

    setFillColor(color: string | number, alpha?: number) {

        if (typeof color == "string") {
            let c = ColorHelper.parseColorToOpenGL(color);
            this.fillColor = c.color;
            this.fillAlpha = alpha == null ? c.alpha : alpha;
        } else {
            this.fillColor = color % 0x1000000;
            if (alpha != null) this.fillAlpha = alpha;
        }


        this.render();

    }

    setBorderWidth(width: number) {
        this.borderWidth = width;
        this.render();
    }

    public getFarbeAsObject(color: number, alpha: number, colorType: Klass): RuntimeObject {

        if (color == null) return null;

        let r = (color & 0xff0000) >> 16;
        let g = (color & 0xff00) >> 8;
        let b = color & 0xff;

        let rto: RuntimeObject = new RuntimeObject(colorType);

        let id: ColorClassIntrinsicData = {
            red: r,
            green: g,
            blue: b,
            hex: ColorHelper.intColorToHexRGB(color)
        }

        rto.intrinsicData = id;

        return rto;

    }

    public borderContainsPoint(x: number, y: number, color: number = -1): boolean {

        if(color != -1 && this.borderColor != color) return false;

        if (this.hitPolygonInitial == null) return false;

        if(this.borderColor == null) return false;

        if (this.hitPolygonDirty) this.transformHitPolygon();

        return polygonzugEnthältPunkt(this.hitPolygonTransformed, { x: x, y: y }, this.borderWidth/2);

    }


}
