// import { Module } from "../../compiler/parser/Module.js";
// import { Klass } from "../../compiler/types/Class.js";
// import { doublePrimitiveType, intPrimitiveType, stringPrimitiveType, voidPrimitiveType, booleanPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
// import { Method, Parameterlist } from "../../compiler/types/Types.js";
// import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
// import { FilledShapeHelper } from "./FilledShape.js";
// import { WorldHelper } from "./World.js";
// import { Interpreter } from "../../interpreter/Interpreter.js";
// import { ShapeHelper } from "./Shape.js";
// import { ColorHelper } from "./ColorHelper.js";
// import { ColorClassIntrinsicData } from "./Color.js";

// export class BitmapClassNew extends Klass {

//     constructor(module: Module) {

//         super("BitmapNew", module, "Rechteckige Bitmap mit beliebiger Auflösung und Positionierung in der Grafikausgabe");

//         this.setBaseClass(<Klass>module.typeStore.getType("Shape"));

//         // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));

//         let colorType: Klass = <Klass>this.module.typeStore.getType("Color");

//         this.addMethod(new Method("BitmapNew", new Parameterlist([
//             { identifier: "pointsX", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "pointsY", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "left", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "top", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "width", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "height", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//         ]), null,
//             (parameters) => {

//                 let o: RuntimeObject = parameters[0].value;
//                 let pointsX: number = parameters[1].value;
//                 let pointsY: number = parameters[2].value;
//                 let left: number = parameters[3].value;
//                 let top: number = parameters[4].value;
//                 let width: number = parameters[5].value;
//                 let height: number = parameters[6].value;

//                 let rh = new BitmapHelperNew(pointsX, pointsY, left, top, width, height, module.main.getInterpreter(), o);
//                 o.intrinsicData["Actor"] = rh;

//             }, false, false, 'Instanziert eine neue Bitmap. pointsX bzw. pointsY bezeichnet Anzahl der Bildpunkte in x bzw. y-Richtung, (left, top) sind die Koordinaten der linken oberen Ecke.', true));

//         this.addMethod(new Method("getColor", new Parameterlist([
//             { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//         ]), colorType,
//             (parameters) => {

//                 let o: RuntimeObject = parameters[0].value;
//                 let x: number = parameters[1].value;
//                 let y: number = parameters[2].value;
//                 let sh: BitmapHelperNew = o.intrinsicData["Actor"];

//                 return sh.getFarbeAsObject(x, y, colorType);

//             }, false, false, 'Gibt die Farbe des Punkts (x, y) zurück.', false));

//         this.addMethod(new Method("setColor", new Parameterlist([
//             { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "color", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "alpha", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//         ]), voidPrimitiveType,
//             (parameters) => {

//                 let o: RuntimeObject = parameters[0].value;
//                 let x: number = parameters[1].value;
//                 let y: number = parameters[2].value;
//                 let color: number = parameters[3].value;
//                 let alpha: number = parameters[4].value;
//                 let sh: BitmapHelperNew = o.intrinsicData["Actor"];

//                 sh.setzeFarbe(x, y, color, alpha);

//             }, false, false, 'Setzt die Farbe des Pixels bei (x, y). Die Farbe wird als int-Wert gegeben, wobei farbe == 255*255*rot + 255*grün + blau und 0.0 <= alpha <= 1.0.', false));

//         this.addMethod(new Method("setColor", new Parameterlist([
//             { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "color", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
//         ]), voidPrimitiveType,
//             (parameters) => {

//                 let o: RuntimeObject = parameters[0].value;
//                 let x: number = parameters[1].value;
//                 let y: number = parameters[2].value;
//                 let color: number = parameters[3].value;
//                 let sh: BitmapHelperNew = o.intrinsicData["Actor"];

//                 sh.setzeFarbe(x, y, color);

//             }, false, false, 'Setzt die Farbe des Pixels bei (x, y). Die Farbe wird als int-Wert gegeben, wobei farbe == 255*255*rot + 255*grün + blau.', false));

//         this.addMethod(new Method("setColor", new Parameterlist([
//             { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "color", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//         ]), voidPrimitiveType,
//             (parameters) => {

//                 let o: RuntimeObject = parameters[0].value;
//                 let x: number = parameters[1].value;
//                 let y: number = parameters[2].value;
//                 let color: string = parameters[3].value;
//                 let sh: BitmapHelperNew = o.intrinsicData["Actor"];

//                 sh.setzeFarbe(x, y, color);

//             }, false, false, 'Setzt die Farbe des Pixels bei (x, y). Die Farbe ist entweder eine vordefinierte Farbe (Color.black, Color.red, ...) oder eine css-Farbe der Art "#ffa7b3" (ohne alpha), "#ffa7b380" (mit alpha), "rgb(172, 22, 18)" oder "rgba(123, 22,18, 0.3)"', false));

//         this.addMethod(new Method("setColor", new Parameterlist([
//             { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "color", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "alpha", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//         ]), voidPrimitiveType,
//             (parameters) => {

//                 let o: RuntimeObject = parameters[0].value;
//                 let x: number = parameters[1].value;
//                 let y: number = parameters[2].value;
//                 let color: string = parameters[3].value;
//                 let alpha: number = parameters[4].value;
//                 let sh: BitmapHelperNew = o.intrinsicData["Actor"];

//                 sh.setzeFarbe(x, y, color, alpha);

//             }, false, false, 'Setzt die Farbe des Pixels bei (x, y). Die Farbe ist entweder eine vordefinierte Farbe (Color.black, Color.red, ...) oder eine css-Farbe der Art "#ffa7b3" (ohne alpha), "#ffa7b380" (mit alpha), "rgb(172, 22, 18)" oder "rgba(123, 22,18, 0.3)". 0.0 <= alpha <= 1.0.', false));

//         this.addMethod(new Method("isColor", new Parameterlist([
//             { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "colorAsRGBAString", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//         ]), booleanPrimitiveType,
//             (parameters) => {

//                 let o: RuntimeObject = parameters[0].value;
//                 let x: number = parameters[1].value;
//                 let y: number = parameters[2].value;
//                 let color: string = parameters[3].value;
//                 let sh: BitmapHelperNew = o.intrinsicData["Actor"];

//                 return sh.istFarbe(x, y, color);

//             }, false, false, 'Gibt genau dann true zurück, wenn das Pixel bei (x, y) die angegebene Farbe besitzt. Die Farbe ist entweder eine vordefinierte Farbe (Color.black, Color.red, ...) oder eine css-Farbe der Art "#ffa7b3" (ohne alpha), "#ffa7b380" (mit alpha), "rgb(172, 22, 18)" oder "rgba(123, 22,18, 0.3)"', false));

//         this.addMethod(new Method("isColor", new Parameterlist([
//             { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "color", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
//         ]), booleanPrimitiveType,
//             (parameters) => {

//                 let o: RuntimeObject = parameters[0].value;
//                 let x: number = parameters[1].value;
//                 let y: number = parameters[2].value;
//                 let color: number = parameters[3].value;
//                 let sh: BitmapHelperNew = o.intrinsicData["Actor"];

//                 return sh.istFarbe(x, y, color, 1);

//             }, false, false, 'Gibt genau dann true zurück, wenn das Pixel bei (x, y) die angegebene Farbe besitzt. Die Farbe wird als int-Wert gegeben, wobei farbe == 255*255*rot + 255*grün + blau und 0.0 <= alpha <= 1.0', false));


//         this.addMethod(new Method("fillAll", new Parameterlist([
//             { identifier: "color", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "alpha", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//         ]), voidPrimitiveType,
//             (parameters) => {

//                 let o: RuntimeObject = parameters[0].value;
//                 let color: number = parameters[1].value;
//                 let alpha: number = parameters[2].value;
//                 let sh: BitmapHelperNew = o.intrinsicData["Actor"];

//                 sh.fillAll(color, alpha);

//             }, false, false, 'Füllt die ganze Bitmap mit einer Farbe. Die Farbe wird als int-Wert gegeben, wobei farbe == 255*255*rot + 255*grün + blau und 0.0 <= alpha <= 1.0', false));

//         this.addMethod(new Method("fillAll", new Parameterlist([
//             { identifier: "colorAsRGBAString", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//         ]), voidPrimitiveType,
//             (parameters) => {

//                 let o: RuntimeObject = parameters[0].value;
//                 let color: number = parameters[1].value;
//                 let sh: BitmapHelperNew = o.intrinsicData["Actor"];

//                 sh.fillAll(color);

//             }, false, false, 'Füllt die ganze Bitmap mit einer Farbe. Die Farbe ist entweder eine vordefinierte Farbe (Color.black, Color.red, ...) oder eine css-Farbe der Art "#ffa7b3" (ohne alpha), "#ffa7b380" (mit alpha), "rgb(172, 22, 18)" oder "rgba(123, 22,18, 0.3)"', false));

//         this.addMethod(new Method("copy", new Parameterlist([
//         ]), this,
//             (parameters) => {

//                 let o: RuntimeObject = parameters[0].value;
//                 let sh: BitmapHelperNew = o.intrinsicData["Actor"];

//                 if (sh.testdestroyed("copy")) return;

//                 return sh.getCopy(<Klass>o.class);

//             }, false, false, 'Erstellt eine Kopie des Bitmap-Objekts und git sie zurück.', false));


//     }

// }

// export class BitmapHelperNew extends ShapeHelper {

//     renderTexture: PIXI.RenderTexture;

//     getCopy(klass: Klass): RuntimeObject {

//         let ro: RuntimeObject = new RuntimeObject(klass);
//         let bh: BitmapHelperNew = new BitmapHelperNew(this.anzahlX, this.anzahlY, this.left, this.top, this.width, this.height, this.worldHelper.interpreter, ro);

//         // TODO

//         ro.intrinsicData["Actor"] = bh;

//         bh.copyFrom(this);
//         bh.render();

//         return ro;
//     }


//     constructor(public anzahlX, public anzahlY, public left: number, public top: number, public width: number, public height: number,
//         interpreter: Interpreter, runtimeObject: RuntimeObject) {
//         super(interpreter, runtimeObject);
//         this.centerXInitial = left + width / 2;
//         this.centerYInitial = top + height / 2;

//         this.hitPolygonInitial = [
//             { x: left, y: top }, { x: left, y: top + height }, { x: left + width, y: top + height }, { x: left + width, y: top }
//         ];

//         this.render();

//         let sprite = <PIXI.Sprite>this.displayObject;

//         sprite.localTransform.scale(width/anzahlY, height/anzahlY);
//         sprite.localTransform.translate(left, top);
//         sprite.transform.onChange();

//         let p = new PIXI.Point(this.centerXInitial, this.centerYInitial);
//         sprite.localTransform.applyInverse(p, p);
//         this.centerXInitial = p.x;
//         this.centerYInitial = p.y;


//         this.addToDefaultGroup();
//     }

//     render(): void {

//         if (this.displayObject == null) {
//             this.initGraphics();
//             this.worldHelper.stage.addChild(this.displayObject);
//         }

//     };

//     protected initGraphics() {

//         this.renderTexture = PIXI.RenderTexture.create({ width: this.anzahlX, height: this.anzahlY, scaleMode: PIXI.SCALE_MODES.NEAREST });
//         this.displayObject = new PIXI.Sprite(this.renderTexture);

//     }

//     public getFarbeAsObject(x: number, y: number, colorType: Klass): RuntimeObject {

//         //@ts-ignore
//         let pixels: Uint8ClampedArray = this.renderTexture.getPixel(x, y);

//         let rto: RuntimeObject = new RuntimeObject(colorType);

//         let id: ColorClassIntrinsicData = {
//             red: Math.round(pixels[0] * 255),
//             green: Math.round(pixels[1] * 255),
//             blue: Math.round(pixels[2] * 255),
//             hex: ColorHelper.intColorToHexRGB(Math.round(pixels[0] * 255) * 0x10000 + Math.round(pixels[1] * 255) * 0x100 + Math.round(pixels[2] * 255))
//         }

//         rto.intrinsicData = id;

//         return rto;

//     }


//     public istFarbe(x: number, y: number, color: string | number, alpha?: number) {

//         //@ts-ignore
//         let pixels: Uint8ClampedArray = this.renderTexture.getPixel(x, y);


//         let c: number;

//         if (typeof color == "string") {
//             let ch = ColorHelper.parseColorToOpenGL(color);
//             c = ch.color;
//             alpha = ch.alpha;
//         } else {
//             c = color;
//         }

//         let r = ((c & 0xff0000) >> 16) / 255;
//         let g = ((c & 0xff00) >> 8) / 255;
//         let b = ((c & 0xff)) / 255;

//         let r1 = pixels[0];
//         let g1 = pixels[1];
//         let b1 = pixels[2];

//         return Math.abs(r - r1) < 0.5 && Math.abs(g - g1) < 0.5 && Math.abs(b - b1) < 0.5;

//     }

//     public setzeFarbe(x: number, y: number, color: string | number, alpha?: number) {

//         let c: number;

//         if (typeof color == "string") {
//             let ch = ColorHelper.parseColorToOpenGL(color);
//             c = ch.color;
//             if (alpha == null) alpha = ch.alpha;
//         } else {
//             c = color;
//             if (alpha == null) alpha = 1.0;
//         }

//         let brush = new PIXI.Graphics();
//         brush.beginFill(c);
//         brush.drawRect(x, y, 1, 1);
//         brush.endFill();

//         this.worldHelper.app.renderer.render(brush, 
//             {
//                 //@ts-ignore
//                 renderTexture: this.renderTexture,
//                 clear: false,
//                 transform: null,
//                 skipUpdateTransform: false
//             });
//     }

//     public fillAll(color: string | number, alpha?: number) {
//         let c: number;

//         if (typeof color == "string") {
//             let ch = ColorHelper.parseColorToOpenGL(color);
//             c = ch.color;
//             alpha = ch.alpha;
//         } else {
//             c = color;
//         }

//         let brush = new PIXI.Graphics();
//         brush.beginFill(c, 1);
//         brush.drawRect(0, 0, this.anzahlX, this.anzahlY);
//         brush.endFill();

//         this.worldHelper.app.renderer.render(brush, 
//             {
//                 //@ts-ignore
//                 renderTexture: this.renderTexture,
//                 clear: false,
//                 transform: null,
//                 skipUpdateTransform: false
//             });
        
//     }
    
//     public setzeFarbeRGBA(x: number, y: number, r: number, g: number, b: number, alpha: number) {
//         let c = alpha + b*0x100 + g * 0x10000 + r * 0x1000000;
//         let brush = new PIXI.Graphics();
//         brush.beginFill(c);
//         brush.drawRect(x, y, 1, 1);
//         brush.endFill();
        
//         this.worldHelper.app.renderer.render(brush, 
//             {
//                 //@ts-ignore
//                 renderTexture: this.renderTexture,
//                 clear: false,
//                 transform: null,
//                 skipUpdateTransform: false
//             });
//     }

//     public getFarbe(x: number, y: number): number {
//         //@ts-ignore
//         let pixels: Uint8ClampedArray = this.renderTexture.getPixel(x, y);
//         return pixels[0] *  0x10000 + pixels[1] * 0x100 + pixels[2];

//     }


// }
