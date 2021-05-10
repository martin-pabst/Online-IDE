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
import { isPrefixUnaryExpression } from "typescript";
import { BufferResource } from "@pixi/core";
import { FORMATS } from "@pixi/constants";

export class BitmapClass extends Klass {

    constructor(module: Module) {

        super("Bitmap", module, "Rechteckige Bitmap mit beliebiger Auflösung und Positionierung in der Grafikausgabe");

        this.setBaseClass(<Klass>module.typeStore.getType("Shape"));

        // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));

        let colorType: Klass = <Klass>this.module.typeStore.getType("Color");

        this.addMethod(new Method("BitmapNew", new Parameterlist([
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

                let rh = new BitmapHelperNew(pointsX, pointsY, left, top, width, height, module.main.getInterpreter(), o);
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
                let sh: BitmapHelperNew = o.intrinsicData["Actor"];

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
                let sh: BitmapHelperNew = o.intrinsicData["Actor"];

                sh.setzeFarbe(x, y, color, alpha);

            }, false, false, 'Setzt die Farbe des Pixels bei (x, y). Die Farbe wird als int-Wert gegeben, wobei farbe == 255*255*rot + 255*grün + blau und 0.0 <= alpha <= 1.0.', false));

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
                let sh: BitmapHelperNew = o.intrinsicData["Actor"];

                sh.setzeFarbe(x, y, color);

            }, false, false, 'Setzt die Farbe des Pixels bei (x, y). Die Farbe wird als int-Wert gegeben, wobei farbe == 255*255*rot + 255*grün + blau.', false));

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
                let sh: BitmapHelperNew = o.intrinsicData["Actor"];

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
                let sh: BitmapHelperNew = o.intrinsicData["Actor"];

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
                let sh: BitmapHelperNew = o.intrinsicData["Actor"];

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
                let sh: BitmapHelperNew = o.intrinsicData["Actor"];

                return sh.istFarbe(x, y, color, 1);

            }, false, false, 'Gibt genau dann true zurück, wenn das Pixel bei (x, y) die angegebene Farbe besitzt. Die Farbe wird als int-Wert gegeben, wobei farbe == 255*255*rot + 255*grün + blau und 0.0 <= alpha <= 1.0', false));


        this.addMethod(new Method("fillAll", new Parameterlist([
            { identifier: "color", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "alpha", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let color: number = parameters[1].value;
                let alpha: number = parameters[2].value;
                let sh: BitmapHelperNew = o.intrinsicData["Actor"];

                sh.fillAll(color, alpha);

            }, false, false, 'Füllt die ganze Bitmap mit einer Farbe. Die Farbe wird als int-Wert gegeben, wobei farbe == 255*255*rot + 255*grün + blau und 0.0 <= alpha <= 1.0', false));

        this.addMethod(new Method("fillAll", new Parameterlist([
            { identifier: "colorAsRGBAString", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let color: number = parameters[1].value;
                let sh: BitmapHelperNew = o.intrinsicData["Actor"];

                sh.fillAll(color);

            }, false, false, 'Füllt die ganze Bitmap mit einer Farbe. Die Farbe ist entweder eine vordefinierte Farbe (Color.black, Color.red, ...) oder eine css-Farbe der Art "#ffa7b3" (ohne alpha), "#ffa7b380" (mit alpha), "rgb(172, 22, 18)" oder "rgba(123, 22,18, 0.3)"', false));

        this.addMethod(new Method("copy", new Parameterlist([
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: BitmapHelperNew = o.intrinsicData["Actor"];

                if (sh.testdestroyed("copy")) return;

                return sh.getCopy(<Klass>o.class);

            }, false, false, 'Erstellt eine Kopie des Bitmap-Objekts und git sie zurück.', false));


    }

}

export class BitmapHelperNew extends ShapeHelper {

    texture: PIXI.Texture;
    data: Uint32Array;

    isBigEndian: boolean = true;

    getCopy(klass: Klass): RuntimeObject {

        let ro: RuntimeObject = new RuntimeObject(klass);
        let bh: BitmapHelperNew = new BitmapHelperNew(this.anzahlX, this.anzahlY, this.left, this.top, this.width, this.height, this.worldHelper.interpreter, ro);

        // TODO

        ro.intrinsicData["Actor"] = bh;

        bh.copyFrom(this);
        bh.render();

        return ro;
    }


    constructor(public anzahlX, public anzahlY, public left: number, public top: number, public width: number, public height: number,
        interpreter: Interpreter, runtimeObject: RuntimeObject) {
        super(interpreter, runtimeObject);

        let uInt32 = new Uint32Array([0x11223344]);
        let uInt8 = new Uint8Array(uInt32.buffer);
     
        if(uInt8[0] === 0x44) {
            this.isBigEndian = false;
        } else if (uInt8[0] === 0x11) {
            this.isBigEndian = true;
        }

        // TODO: Little Endian...

        this.centerXInitial = left + width / 2;
        this.centerYInitial = top + height / 2;

        this.hitPolygonInitial = [
            { x: left, y: top }, { x: left, y: top + height }, { x: left + width, y: top + height }, { x: left + width, y: top }
        ];

        this.render();

        let sprite = <PIXI.Sprite>this.displayObject;

        sprite.localTransform.scale(width/anzahlY, height/anzahlY);
        sprite.localTransform.translate(left, top);
        //@ts-ignore
        sprite.transform.onChange();

        let p = new PIXI.Point(this.centerXInitial, this.centerYInitial);
        sprite.localTransform.applyInverse(p, p);
        this.centerXInitial = p.x;
        this.centerYInitial = p.y;


        this.addToDefaultGroup();
    }

    render(): void {

        if (this.displayObject == null) {
            this.initGraphics();
            this.worldHelper.stage.addChild(this.displayObject);
        }

    };

    protected initGraphics() {
        this.data = new Uint32Array(this.anzahlX * this.anzahlY);
        let u8Array = new Uint8Array(this.data.buffer);
        let bufferResource = new PIXI.BufferResource(u8Array, {width: this.anzahlX, height: this.anzahlY});
        let bt = new PIXI.BaseTexture(bufferResource, {
            scaleMode: PIXI.SCALE_MODES.NEAREST 
        });
        this.texture = new PIXI.Texture(bt);
        this.displayObject = new PIXI.Sprite(this.texture);
    }

    uploadData(){
        this.texture.baseTexture.update();
    }

    public getFarbeAsObject(x: number, y: number, colorType: Klass): RuntimeObject {

        let i = (x + y * (this.anzahlX));

        // let a = this.data[i + 3];
        let rto: RuntimeObject = new RuntimeObject(colorType);

        let c = this.data[i];

        let red = c & 0xff;
        let green = (c & 0xff00) >> 8;
        let blue = (c & 0xff0000) >> 16;

        let id: ColorClassIntrinsicData = {
            red: red,
            green: green,
            blue: blue,
            hex: ColorHelper.intColorToHexRGB(c >> 8)
        }

        rto.intrinsicData = id;

        return rto;

    }


    public istFarbe(x: number, y: number, color: string | number, alpha?: number) {

        let i = (x + y * (this.anzahlX));

        let c: number;

        if (typeof color == "string") {
            let ch = ColorHelper.parseColorToOpenGL(color);
            c = ch.color;
            alpha = ch.alpha;
        } else {
            c = color;
        }

        let c1 = this.data[i];
        let red = c1 & 0xff;
        let green = (c1 & 0xff00) >> 8;
        let blue = (c1 & 0xff0000) >> 16;


        return c == red*0x10000 + green * 0x100 + blue;

    }

    public setzeFarbe(x: number, y: number, color: string | number, alpha?: number) {

        let i = (x + y * (this.anzahlX));
        let c: number;

        if (typeof color == "string") {
            let ch = ColorHelper.parseColorToOpenGL(color);
            c = ch.color;
            if (alpha == null) alpha = ch.alpha;
        } else {
            c = color;
            if (alpha == null) alpha = 1.0;
        }

        this.data[i] = Math.round(alpha * 255) * 0x1000000 + ((c & 0xff) << 16) + (c & 0xff00) + ((c & 0xff0000) >> 16);
        
        this.uploadData();
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

        this.data.fill(Math.round(alpha * 255) * 0x1000000 + ((c & 0xff) << 16) + (c & 0xff00) + ((c & 0xff0000) >> 16));
        // this.data.fill(0xffff0000);
        
        this.uploadData();
    }
    
    public setzeFarbeRGBA(x: number, y: number, r: number, g: number, b: number, alpha: number) {
        let c = alpha * 0xff000000 + b*0x10000 + g * 0x100 + r;
        let i = (x + y * (this.anzahlX));
        this.data[i] = c;
        this.uploadData();
    }

    public getFarbe(x: number, y: number): number {
        let c = this.data[x + y * this.anzahlX] & 0xffffff;
        return (c & 0xff) << 16 + (c & 0xff00) + (c & 0xff0000) >> 16;
    }

    public getAlpha(x: number, y: number): number {
        return (this.data[x + y * this.anzahlX] & 0xff000000) >> 24 / 255;
    }


}
