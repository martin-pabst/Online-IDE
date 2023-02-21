import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { doublePrimitiveType, intPrimitiveType, stringPrimitiveType, voidPrimitiveType, booleanPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { FilledShapeHelper } from "./FilledShape.js";
import { WorldHelper } from "./World.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import { ShapeHelper } from "./Shape.js";
import { ColorHelper } from "./ColorHelper.js";
import { ColorClassIntrinsicData } from "./Color.js";
import * as PIXI from 'pixi.js';

export class BitmapClassOld extends Klass {

    constructor(module: Module) {

        super("BitmapOld", module, "Rechteckige Bitmap mit beliebiger Auflösung und Positionierung in der Grafikausgabe");

        this.setBaseClass(<Klass>module.typeStore.getType("Shape"));

        // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));

        let colorType: Klass = <Klass>this.module.typeStore.getType("Color");

        this.addMethod(new Method("Bitmap", new Parameterlist([
            { identifier: "pointsX", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "pointsY", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "left", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "top", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "width", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "height", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let pointsX: number = parameters[1].value;
                let pointsY: number = parameters[2].value;
                let left: number = parameters[3].value;
                let top: number = parameters[4].value;
                let width: number = parameters[5].value;
                let height: number = parameters[6].value;

                let rh = new BitmapHelper(pointsX, pointsY, left, top, width, height, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = rh;

            }, false, false, 'Instanziert eine neue Bitmap. pointsX bzw. pointsY bezeichnet Anzahl der Bildpunkte in x bzw. y-Richtung, (left, top) sind die Koordinaten der linken oberen Ecke.', true));

        this.addMethod(new Method("getColor", new Parameterlist([
            { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), colorType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let sh: BitmapHelper = o.intrinsicData["Actor"];

                return sh.getFarbeAsObject(x, y, colorType);

            }, false, false, 'Gibt die Farbe des Punkts (x, y) zurück.', false));

        this.addMethod(new Method("setColor", new Parameterlist([
            { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "color", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "alpha", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let color: number = parameters[3].value;
                let alpha: number = parameters[4].value;
                let sh: BitmapHelper = o.intrinsicData["Actor"];

                sh.setzeFarbe(x, y, color, alpha);

            }, false, false, 'Setzt die Farbe des Pixels bei (x, y). Die Farbe wird als int-Wert gegeben, wobei farbe == 256*256*rot + 256*grün + blau und 0.0 <= alpha <= 1.0.', false));

        this.addMethod(new Method("setColor", new Parameterlist([
            { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "color", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let color: number = parameters[3].value;
                let sh: BitmapHelper = o.intrinsicData["Actor"];

                sh.setzeFarbe(x, y, color);

            }, false, false, 'Setzt die Farbe des Pixels bei (x, y). Die Farbe wird als int-Wert gegeben, wobei farbe == 256*256*rot + 256*grün + blau.', false));

        this.addMethod(new Method("setColor", new Parameterlist([
            { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "color", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let color: string = parameters[3].value;
                let sh: BitmapHelper = o.intrinsicData["Actor"];

                sh.setzeFarbe(x, y, color);

            }, false, false, 'Setzt die Farbe des Pixels bei (x, y). Die Farbe ist entweder eine vordefinierte Farbe (Color.black, Color.red, ...) oder eine css-Farbe der Art "#ffa7b3" (ohne alpha), "#ffa7b380" (mit alpha), "rgb(172, 22, 18)" oder "rgba(123, 22,18, 0.3)"', false));

        this.addMethod(new Method("setColor", new Parameterlist([
            { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "color", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "alpha", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let color: string = parameters[3].value;
                let alpha: number = parameters[4].value;
                let sh: BitmapHelper = o.intrinsicData["Actor"];

                sh.setzeFarbe(x, y, color, alpha);

            }, false, false, 'Setzt die Farbe des Pixels bei (x, y). Die Farbe ist entweder eine vordefinierte Farbe (Color.black, Color.red, ...) oder eine css-Farbe der Art "#ffa7b3" (ohne alpha), "#ffa7b380" (mit alpha), "rgb(172, 22, 18)" oder "rgba(123, 22,18, 0.3)". 0.0 <= alpha <= 1.0.', false));

        this.addMethod(new Method("isColor", new Parameterlist([
            { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "colorAsRGBAString", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let color: string = parameters[3].value;
                let sh: BitmapHelper = o.intrinsicData["Actor"];

                return sh.istFarbe(x, y, color);

            }, false, false, 'Gibt genau dann true zurück, wenn das Pixel bei (x, y) die angegebene Farbe besitzt. Die Farbe ist entweder eine vordefinierte Farbe (Color.black, Color.red, ...) oder eine css-Farbe der Art "#ffa7b3" (ohne alpha), "#ffa7b380" (mit alpha), "rgb(172, 22, 18)" oder "rgba(123, 22,18, 0.3)"', false));

        this.addMethod(new Method("isColor", new Parameterlist([
            { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "color", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let color: number = parameters[3].value;
                let sh: BitmapHelper = o.intrinsicData["Actor"];

                return sh.istFarbe(x, y, color, 1);

            }, false, false, 'Gibt genau dann true zurück, wenn das Pixel bei (x, y) die angegebene Farbe besitzt. Die Farbe wird als int-Wert gegeben, wobei farbe == 256*256*rot + 256*grün + blau und 0.0 <= alpha <= 1.0', false));


        this.addMethod(new Method("fillAll", new Parameterlist([
            { identifier: "color", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "alpha", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let color: number = parameters[1].value;
                let alpha: number = parameters[2].value;
                let sh: BitmapHelper = o.intrinsicData["Actor"];

                sh.fillAll(color, alpha);

            }, false, false, 'Füllt die ganze Bitmap mit einer Farbe. Die Farbe wird als int-Wert gegeben, wobei farbe == 256*256*rot + 256*grün + blau und 0.0 <= alpha <= 1.0', false));

        this.addMethod(new Method("fillAll", new Parameterlist([
            { identifier: "colorAsRGBAString", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let color: number = parameters[1].value;
                let sh: BitmapHelper = o.intrinsicData["Actor"];

                sh.fillAll(color);

            }, false, false, 'Füllt die ganze Bitmap mit einer Farbe. Die Farbe ist entweder eine vordefinierte Farbe (Color.black, Color.red, ...) oder eine css-Farbe der Art "#ffa7b3" (ohne alpha), "#ffa7b380" (mit alpha), "rgb(172, 22, 18)" oder "rgba(123, 22,18, 0.3)"', false));

        this.addMethod(new Method("copy", new Parameterlist([
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: BitmapHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("copy")) return;

                return sh.getCopy(<Klass>o.class);

            }, false, false, 'Erstellt eine Kopie des Bitmap-Objekts und git sie zurück.', false));


    }

}

export class BitmapHelper extends ShapeHelper {

    private colorArray: Float32Array;
    private colorBuffer: PIXI.Buffer;


    getCopy(klass: Klass): RuntimeObject {

        let ro: RuntimeObject = new RuntimeObject(klass);
        let bh: BitmapHelper = new BitmapHelper(this.anzahlX, this.anzahlY, this.left, this.top, this.width, this.height, this.worldHelper.interpreter, ro);

        for (let i = 0; i < this.colorArray.length; i++) bh.colorArray[i] = this.colorArray[i];
        bh.colorBuffer.update();

        ro.intrinsicData["Actor"] = bh;

        bh.copyFrom(this);
        bh.render();

        return ro;
    }


    constructor(public anzahlX, public anzahlY, public left: number, public top: number, public width: number, public height: number,
        interpreter: Interpreter, runtimeObject: RuntimeObject) {
        super(interpreter, runtimeObject);
        this.centerXInitial = left + width / 2;
        this.centerYInitial = top + height / 2;

        this.hitPolygonInitial = [
            { x: left, y: top }, { x: left, y: top + height }, { x: left + width, y: top + height }, { x: left + width, y: top }
        ];

        this.render();
        this.addToDefaultGroupAndSetDefaultVisibility();
    }

    render(): void {

        if (this.displayObject == null) {
            this.initGraphics();
            this.worldHelper.stage.addChild(this.displayObject);
        }

    };

    protected initGraphics() {

        let vertexArray = new Float32Array(this.anzahlX * this.anzahlY * 4 * 2);
        this.colorArray = new Float32Array(this.anzahlX * this.anzahlY * 4 * 4);
        let vertexIndexArray = new Int32Array(this.anzahlX * this.anzahlY * 6); // Anzahl der Dreieckseckpunkte

        let xStep = this.width / this.anzahlX;
        let yStep = this.height / this.anzahlY;

        for (let y = 0; y < this.anzahlY; y++) {
            for (let x = 0; x < this.anzahlX; x++) {
                let left = x * xStep + this.left;
                let top = y * yStep + this.top;
                let index = (x + y * (this.anzahlX)) * 8;
                vertexArray[index] = left;
                vertexArray[index + 1] = top;
                vertexArray[index + 2] = left + xStep;
                vertexArray[index + 3] = top;
                vertexArray[index + 4] = left;
                vertexArray[index + 5] = top + yStep;
                vertexArray[index + 6] = left + xStep;
                vertexArray[index + 7] = top + yStep;

                let color = (x + y) % 2;
                index = (x + y * (this.anzahlX)) * 16;
                for (let i = 0; i < 16; i++) {
                    this.colorArray[index + i] = color;
                }

            }
        }

        let i: number = 0; // index des Dreieckspunktes

        for (let y = 0; y < this.anzahlY; y++) {
            for (let x = 0; x < this.anzahlX; x++) {

                let index = (x + y * this.anzahlX) * 4;
                i = (x + y * this.anzahlX) * 6;
                vertexIndexArray[i] = index;
                vertexIndexArray[i + 1] = index + 1;
                vertexIndexArray[i + 2] = index + 2;
                vertexIndexArray[i + 3] = index + 1;
                vertexIndexArray[i + 4] = index + 3;
                vertexIndexArray[i + 5] = index + 2;

            }
        }


        let vertexBuffer = new PIXI.Buffer(vertexArray, true);
        this.colorBuffer = new PIXI.Buffer(this.colorArray, false);
        let VertexIndexBuffer = new PIXI.Buffer(vertexIndexArray, true, true);



        const geometry = new PIXI.Geometry()
            .addAttribute('aVertexPosition', // the attribute name
                vertexBuffer, // x, y
                2).addIndex(VertexIndexBuffer) // the size of the attribute

            .addAttribute('aColor', // the attribute name
                this.colorBuffer,
                4); // the size of the attribute

        const shader = PIXI.Shader.from(`
    
        precision mediump float;
        attribute vec2 aVertexPosition;
        attribute vec4 aColor;
    
        uniform mat3 translationMatrix;
        uniform mat3 projectionMatrix;
    
        varying vec4 vColor;
    
        void main() {
    
            vColor = aColor;
            gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    
        }`,

            `precision mediump float;
    
        varying vec4 vColor;
    
        void main() {
            gl_FragColor = vColor;
        }
    
    `);

        this.displayObject = new PIXI.Mesh(geometry, shader, null, PIXI.DRAW_MODES.TRIANGLES);

        this.displayObject.position.set(this.left, this.top);

    }

    public getFarbeAsObject(x: number, y: number, colorType: Klass): RuntimeObject {
        let i = (x + y * (this.anzahlX)) * 16;
        let c: number;

        let r = this.colorArray[i];
        let g = this.colorArray[i + 1];
        let b = this.colorArray[i + 2];
        let a = this.colorArray[i + 3];

        let rto: RuntimeObject = new RuntimeObject(colorType);

        let id: ColorClassIntrinsicData = {
            red: Math.round(r * 255),
            green: Math.round(g * 255),
            blue: Math.round(b * 255),
            hex: ColorHelper.intColorToHexRGB(Math.round(r * 255) * 0x10000 + Math.round(g * 255) * 0x100 + Math.round(b * 255))
        }

        rto.intrinsicData = id;

        return rto;

    }


    public istFarbe(x: number, y: number, color: string | number, alpha?: number) {
        let i = (x + y * (this.anzahlX)) * 16;
        let c: number;

        if (typeof color == "string") {
            let ch = ColorHelper.parseColorToOpenGL(color);
            c = ch.color;
            alpha = ch.alpha;
        } else {
            c = color;
        }

        let r = ((c & 0xff0000) >> 16) / 255;
        let g = ((c & 0xff00) >> 8) / 255;
        let b = ((c & 0xff)) / 255;

        let r1 = this.colorArray[i];
        let g1 = this.colorArray[i + 1];
        let b1 = this.colorArray[i + 2];

        return Math.abs(r - r1) < 0.5 && Math.abs(g - g1) < 0.5 && Math.abs(b - b1) < 0.5;

    }

    public setzeFarbe(x: number, y: number, color: string | number, alpha?: number) {
        let i = (x + y * (this.anzahlX)) * 16;
        let c: number;

        if (typeof color == "string") {
            let ch = ColorHelper.parseColorToOpenGL(color);
            c = ch.color;
            if (alpha == null) alpha = ch.alpha;
        } else {
            c = color;
            if (alpha == null) alpha = 1.0;
        }

        let r = ((c & 0xff0000) >> 16) / 255;
        let g = ((c & 0xff00) >> 8) / 255;
        let b = ((c & 0xff)) / 255;

        this.colorArray[i] = r;
        this.colorArray[i + 1] = g;
        this.colorArray[i + 2] = b;
        this.colorArray[i + 3] = alpha;
        this.colorArray[i + 4] = r;
        this.colorArray[i + 5] = g;
        this.colorArray[i + 6] = b;
        this.colorArray[i + 7] = alpha;
        this.colorArray[i + 8] = r;
        this.colorArray[i + 9] = g;
        this.colorArray[i + 10] = b;
        this.colorArray[i + 11] = alpha;
        this.colorArray[i + 12] = r;
        this.colorArray[i + 13] = g;
        this.colorArray[i + 14] = b;
        this.colorArray[i + 15] = alpha;
        this.colorBuffer.update();
    }

    public fillAll(color: string | number, alpha?: number) {
        let c: number;

        if (typeof color == "string") {
            let ch = ColorHelper.parseColorToOpenGL(color);
            c = ch.color;
            alpha = ch.alpha;
        } else {
            c = color;
        }

        for (let y = 0; y < this.anzahlY; y++) {
            for (let x = 0; x < this.anzahlX; x++) {
                let i = (x + y * (this.anzahlX)) * 16;

                let r = ((c & 0xff0000) >> 16) / 255;
                let g = ((c & 0xff00) >> 8) / 255;
                let b = ((c & 0xff)) / 255;

                this.colorArray[i] = r;
                this.colorArray[i + 1] = g;
                this.colorArray[i + 2] = b;
                this.colorArray[i + 3] = alpha;
                this.colorArray[i + 4] = r;
                this.colorArray[i + 5] = g;
                this.colorArray[i + 6] = b;
                this.colorArray[i + 7] = alpha;
                this.colorArray[i + 8] = r;
                this.colorArray[i + 9] = g;
                this.colorArray[i + 10] = b;
                this.colorArray[i + 11] = alpha;
                this.colorArray[i + 12] = r;
                this.colorArray[i + 13] = g;
                this.colorArray[i + 14] = b;
                this.colorArray[i + 15] = alpha;
            }
        }
        this.colorBuffer.update();
    }

    public setzeFarbeRGBA(x: number, y: number, r: number, g: number, b: number, alpha: number) {
        let i = (x + y * (this.anzahlX)) * 16;
        r /= 255;
        g /= 255;
        b /= 255;
        this.colorArray[i] = r;
        this.colorArray[i + 1] = g;
        this.colorArray[i + 2] = b;
        this.colorArray[i + 3] = alpha;
        this.colorArray[i + 4] = r;
        this.colorArray[i + 5] = g;
        this.colorArray[i + 6] = b;
        this.colorArray[i + 7] = alpha;
        this.colorArray[i + 8] = r;
        this.colorArray[i + 9] = g;
        this.colorArray[i + 10] = b;
        this.colorArray[i + 11] = alpha;
        this.colorArray[i + 12] = r;
        this.colorArray[i + 13] = g;
        this.colorArray[i + 14] = b;
        this.colorArray[i + 15] = alpha;
        this.colorBuffer.update();
    }

    public getFarbe(x: number, y: number): number {
        let i = (x + y * this.anzahlX) * 16;
        return Math.trunc(this.colorArray[i] * 255) * 0x10000 +
            Math.trunc(this.colorArray[i + 1] * 255) * 0x100 +
            Math.trunc(this.colorArray[i + 2] * 255);
    }


}
