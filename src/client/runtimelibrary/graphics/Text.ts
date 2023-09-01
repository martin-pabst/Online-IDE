import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { booleanPrimitiveType, doublePrimitiveType, stringPrimitiveType, voidPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { FilledShapeHelper } from "./FilledShape.js";
import { WorldHelper } from "./World.js";
import { EnumRuntimeObject } from "../../compiler/types/Enum.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import * as PIXI from 'pixi.js';

export class TextClass extends Klass {

    constructor(module: Module) {

        super("Text", module, "Text, der innerhalb der Grafikausgabe dargestellt werden kann");

        this.setBaseClass(<Klass>module.typeStore.getType("FilledShape"));

        // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));

        this.addMethod(new Method("Text", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let sh = new TextHelper(0, 0, 24, "Text", module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = sh;

            }, false, false, 'Instanziert ein neues Textobjekt. Der Textanker (default: links oben) liegt bei (0, 0).', true));

        this.addMethod(new Method("Text", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "fontsize", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "text", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let fontsize: number = parameters[3].value;
                let text: string = parameters[4].value;

                let sh = new TextHelper(x, y, fontsize, text, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = sh;

            }, false, false, 'Instanziert ein neues Textobjekt. (x, y) sind die Koordinaten des Textankers (default: links oben), fontsize die Höhe des Textes in Pixeln.', true));

        this.addMethod(new Method("Text", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "fontsize", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "text", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "font-family", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let fontsize: number = parameters[3].value;
                let text: string = parameters[4].value;
                let fontFamily: string = parameters[5].value;

                let sh = new TextHelper(x, y, fontsize, text, module.main.getInterpreter(), o, fontFamily);
                o.intrinsicData["Actor"] = sh;

            }, false, false, 'Instanziert ein neues Textobjekt. (x, y) sind die Koordinaten des Textankers (default: links oben), fontsize die Höhe des Textes in Pixeln.', true));

        this.addMethod(new Method("setFontsize", new Parameterlist([
            { identifier: "fontsize", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let fontsize: number = parameters[1].value;
                let sh: TextHelper = o.intrinsicData["Actor"];

                sh.setFontsize(fontsize);

            }, false, false, 'Setzt die Schriftgröße des Textes (Einheit: Pixel).', false));

        this.addMethod(new Method("setAlignment", new Parameterlist([
            { identifier: "alignment", type: module.typeStore.getType("Alignment"), declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let alignment: EnumRuntimeObject = parameters[1].value;
                let sh: TextHelper = o.intrinsicData["Actor"];

                sh.setAlignment(alignment.enumValue.identifier);

            }, false, false, 'Setzt die Ausrichtung in X-Richtung. Zulässige Werte sind "Alignment.left", "Alignment.right" und "Alignment.center".', false));

        this.addMethod(new Method("setText", new Parameterlist([
            { identifier: "text", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let text: string = parameters[1].value;
                let sh: TextHelper = o.intrinsicData["Actor"];

                sh.setText(text);

            }, false, false, 'Setzt den Text.', false));

        this.addMethod(new Method("copy", new Parameterlist([
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TextHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("copy")) return;

                return sh.getCopy(<Klass>o.class);

            }, false, false, 'Erstellt eine Kopie des Text-Objekts und git sie zurück.', false));

        this.addMethod(new Method("getWidth", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TextHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getWidth")) return;

                return sh.getWidth();

            }, false, false, 'Gibt die Breite des Textes zurück.', false));

        this.addMethod(new Method("getHeight", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TextHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getHeight")) return;

                return sh.getHeight();

            }, false, false, 'Gibt die Höhe des Textes zurück.', false));

        this.addMethod(new Method("getFontSize", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TextHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getFontSize")) return;

                return sh.fontsize;

            }, false, false, 'Gibt die Schriftgröße zurück.', false));

            this.addMethod(new Method("getText", new Parameterlist([
            ]), stringPrimitiveType,
                (parameters) => {
    
                    let o: RuntimeObject = parameters[0].value;
                    let sh: TextHelper = o.intrinsicData["Actor"];
    
                    if (sh.testdestroyed("getText")) return;
    
                    return sh.text;
    
                }, false, false, 'Gibt den Textinhalt zurück.', false));

                this.addMethod(new Method("setStyle", new Parameterlist([
            { identifier: "isBold", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "isItalic", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let isBold: boolean = parameters[1].value;
                let isItalic: boolean = parameters[2].value;
                let sh: TextHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setStyle")) return;

                sh.setStyle(isBold, isItalic);

                return;

            }, false, false, 'Gibt die Eigenschaften Fettdruck (bold) und Schrägschrift (italic) zurück.', false));

            this.addMethod(new Method("moveTo", new Parameterlist([
                { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
                { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            ]), voidPrimitiveType,
                (parameters) => {
    
                    let o: RuntimeObject = parameters[0].value;
                    let sh: TextHelper = o.intrinsicData["Actor"];
                    let x: number = parameters[1].value;
                    let y: number = parameters[2].value;
    
                    if (sh.testdestroyed("moveTo")) return;
    
                    sh.moveTo(x, y);
    
                }, false, false, "Verschiebt das Grafikobjekt so, dass sich sein 'Mittelpunkt' an den angegebenen Koordinaten befindet.", false));
    

    }

}

export class TextHelper extends FilledShapeHelper {

    alignment: string = "left";

    textStyle: PIXI.TextStyle =
        new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 10,
            fontStyle: 'normal',
            fontWeight: 'normal',
            fill: this.fillColor == null ? 0x000000 : this.fillColor, // gradient possible...
            stroke: this.borderColor == null ? 0x000000 : this.borderColor,
            strokeThickness: this.borderColor == null ? 0 : this.borderWidth,
            dropShadow: false,
            wordWrap: false,
            align: "left",
            lineJoin: 'round'
        });

    constructor(public x: number, public y: number, public fontsize: number,
        public text: string,
        interpreter: Interpreter, runtimeObject: RuntimeObject, public fontFamily?: string) {
        super(interpreter, runtimeObject);
        this.centerXInitial = x;
        this.centerYInitial = y;

        if (this.fontsize == 0) this.fontsize = 10;

        this.borderColor = null;
        this.textStyle.stroke = 0x000000;
        if (fontFamily != null) {
            this.textStyle.fontFamily = fontFamily;
        }

        this.hitPolygonInitial = [];

        this.render();
        this.addToDefaultGroupAndSetDefaultVisibility();
    }

    setStyle(isBold: boolean, isItalic: boolean) {
        this.textStyle.fontWeight = isBold ? "bold" : "normal";
        this.textStyle.fontStyle = isItalic ? "italic" : "normal";
        this.render();
    }

    getCopy(klass: Klass): RuntimeObject {

        let ro: RuntimeObject = new RuntimeObject(klass);
        let rh: TextHelper = new TextHelper(this.x, this.y, this.fontsize, this.text, this.worldHelper.interpreter, ro);
        ro.intrinsicData["Actor"] = rh;

        rh.alignment = this.alignment;

        rh.copyFrom(this);
        rh.render();

        return ro;
    }


    render(): void {

        let g: PIXI.Text = <any>this.displayObject;
        this.textStyle.fill = this.fillColor == null ? 0x000000 : this.fillColor;
        this.textStyle.stroke = this.borderColor == null ? 0x000000 : this.borderColor;
        this.textStyle.strokeThickness = this.borderColor == null ? 0 : this.borderWidth;
        this.textStyle.fontSize = this.fontsize;

        if (this.displayObject == null) {
            g = new PIXI.Text(this.text, this.textStyle);
            this.displayObject = g;
            this.displayObject.localTransform.translate(this.x, this.y);
            //@ts-ignore
            this.displayObject.transform.onChange();
            this.worldHelper.stage.addChild(g);
        } else {
            g.text = this.text;
            g.alpha = this.fillAlpha;
            switch (this.alignment) {
                case "left": g.anchor.x = 0; break;
                case "center": g.anchor.x = 0.5; break;
                case "right": g.anchor.x = 1.0; break;
            }
            //@ts-ignore
            this.textStyle.align = this.alignment;
            g.style = this.textStyle;
        }

        this.centerXInitial = 0;
        this.centerYInitial = 0;

        let width = 0;
        let height = 0;

        if (this.text != null) {
            let tm = PIXI.TextMetrics.measureText( "" + this.text, this.textStyle);

            width = tm.width;
            height = tm.height;
            tm.fontProperties.ascent

            this.centerXInitial = width / 2;
            this.centerYInitial = height / 2;
        }

        let left = 0 - g.anchor.x * width;
        let top = 0 - g.anchor.y * height;

        this.hitPolygonInitial = [
            { x: left , y: top }, { x: left, y: top + height },
            { x: left + width, y: top + height }, { x: left + width, y: top }
        ];

        this.hitPolygonDirty = true;

    };

    moveTo(newX: number, newY: number){
        let p = new PIXI.Point(0, 0);
        this.displayObject.updateTransform();
        this.displayObject.localTransform.apply(p, p);
        this.move(newX - p.x, newY - p.y);
    }

    setFontsize(fontsize: number) {
        this.fontsize = fontsize;
        if (this.fontsize == 0) this.fontsize = 10;
        this.render();
    }

    setText(text: string) {
        this.text = text;
        this.render();
    }

    setAlignment(alignment: string) {
        this.alignment = alignment;
        this.render();
    }

    getWidth(): number {
        let g: PIXI.Text = <any>this.displayObject;
        return g.width;
    }

    getHeight(): number {
        let g: PIXI.Text = <any>this.displayObject;
        return g.height;
    }

}
