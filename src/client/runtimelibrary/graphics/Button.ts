import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { booleanPrimitiveType, doublePrimitiveType, intPrimitiveType, stringPrimitiveType, voidPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist, Value } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { FilledShapeHelper } from "./FilledShape.js";
import { InternalKeyboardListener, InternalMouseListener, MouseEvent as JOMouseEvent } from "./World.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import * as PIXI from 'pixi.js';
import { copyTextToClipboard, lightenDarkenIntColor } from "../../tools/HtmlTools.js";
import { ArrayType } from "../../compiler/types/Array.js";

export class ButtonClass extends Klass {

    constructor(module: Module) {

        super("Button", module, "Button, der innerhalb der Grafikausgabe dargestellt werden kann");

        this.setBaseClass(<Klass>module.typeStore.getType("FilledShape"));

        this.addMethod(new Method("Button", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "fontsize", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "text", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
        (parameters) => {
            
            let o: RuntimeObject = parameters[0].value;
            let x: number = parameters[1].value;
            let y: number = parameters[2].value;
            let fontsize: number = parameters[3].value;
            let text: string = parameters[4].value;
            
            let sh = new ButtonHelper(x, y, fontsize, text, module.main.getInterpreter(), o);
            o.intrinsicData["Actor"] = sh;
            
        }, false, false, 'Instanziert ein neues Button-Objekt. (x, y) sind die Koordinaten der linken oberen Ecke, fontsize die Höhe des Textes in Pixeln.', true));
        
        this.addMethod(new Method("Button", new Parameterlist([
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
            
            let sh = new ButtonHelper(x, y, fontsize, text, module.main.getInterpreter(), o, fontFamily);
            o.intrinsicData["Actor"] = sh;
            
            }, false, false, 'Instanziert ein neues Button-Objekt. (x, y) sind die Koordinaten der linken oberen Ecke, fontsize die Höhe des Textes in Pixeln.', true));

            this.addMethod(new Method("setFontsize", new Parameterlist([
                { identifier: "fontsize", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let fontsize: number = parameters[1].value;
                let sh: ButtonHelper = o.intrinsicData["Actor"];

                sh.setFontsize(fontsize);

            }, false, false, 'Setzt die Schriftgröße des Textes (Einheit: Pixel).', false));

        this.addMethod(new Method("setText", new Parameterlist([
            { identifier: "text", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let text: string = parameters[1].value;
                let sh: ButtonHelper = o.intrinsicData["Actor"];

                sh.setText(text);

            }, false, false, 'Setzt den Text.', false));

        this.addMethod(new Method("copy", new Parameterlist([
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ButtonHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("copy")) return;

                return sh.getCopy(<Klass>o.class);

            }, false, false, 'Erstellt eine Kopie des Button-Objekts und git sie zurück.', false));

        this.addMethod(new Method("getWidth", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ButtonHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getWidth")) return;

                return sh.getWidth();

            }, false, false, 'Gibt die Breite des Buttons zurück.', false));

        this.addMethod(new Method("getHeight", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ButtonHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getHeight")) return;

                return sh.getHeight();

            }, false, false, 'Gibt die Höhe des Buttons zurück.', false));

        this.addMethod(new Method("getFontSize", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ButtonHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getFontSize")) return;

                return sh.fontsize;

            }, false, false, 'Gibt die Schriftgröße zurück.', false));

        this.addMethod(new Method("getText", new Parameterlist([
        ]), stringPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ButtonHelper = o.intrinsicData["Actor"];

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
                let sh: ButtonHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setStyle")) return;

                sh.setStyle(isBold, isItalic);

                return;

            }, false, false, 'Setzt die Eigenschaften Fettdruck (bold) und Schrägschrift (italic).', false));


        this.addMethod(new Method("setTextColor", new Parameterlist([
            { identifier: "color", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let color: number = parameters[1].value;
                let sh: ButtonHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setTextColor")) return;

                sh.setTextColor(color);

            }, false, false, 'Setzt die Textfarbe. Die Farbe wird als int-Wert gegeben, wobei farbe == 256*256*rot + 256*grün + blau', false));

    }

}

export class ButtonHelper extends FilledShapeHelper implements InternalMouseListener {

    pixiText: PIXI.Text;
    backgroundGraphics: PIXI.Graphics;
    higlightGraphics: PIXI.Graphics;

    textColor: number = 0xffffff;

    textHeight: number = 10;
    textWidth: number = 10;

    mouseIsDown: boolean = false;

    isMouseOver: boolean = false;

    height: number = 0;
    width: number = 0;

    textStyle: PIXI.TextStyle =
        new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 10,
            fontStyle: 'normal',
            fontWeight: 'normal',
            fill: 0xffffff, // gradient possible...
            stroke: 0x000000,
            strokeThickness: 0,
            dropShadow: false,
            wordWrap: false,
            align: "center",
            lineJoin: 'round'
        });

    constructor(public x: number, public y: number, public fontsize: number,
        public text: string, 
        interpreter: Interpreter, runtimeObject: RuntimeObject, public fontFamily?: string) {
        super(interpreter, runtimeObject);
        this.centerXInitial = x;
        this.centerYInitial = y;

        if (this.fontsize == 0) this.fontsize = 10;


        this.borderColor = 0x808080;
        this.borderWidth = fontsize/8;
        this.fillColor = 0x0000ff;

        this.textStyle.stroke = 0x000000;
        this.textStyle.fontSize = fontsize;

        if (fontFamily != null) {
            this.textStyle.fontFamily = fontFamily;
        }

        this.hitPolygonInitial = [];

        this.render();

        this.addToDefaultGroupAndSetDefaultVisibility();

        this.registerAsListener();

    }


    registerAsListener() {
        if (this.worldHelper.internalMouseListeners.indexOf(this) >= 0) return;
        this.worldHelper.internalMouseListeners.push(this);
        // this.worldHelper.internalKeyboardListeners.push(this);

    }

    unregisterAsListener() {
        let index = this.worldHelper.internalMouseListeners.indexOf(this);
        this.worldHelper.internalMouseListeners.splice(index, 1);
        // let index1 = this.worldHelper.internalKeyboardListeners.indexOf(this);
        // this.worldHelper.internalKeyboardListeners.splice(index1, 1);
    }

    setStyle(isBold: boolean, isItalic: boolean) {
        this.textStyle.fontWeight = isBold ? "bold" : "normal";
        this.textStyle.fontStyle = isItalic ? "italic" : "normal";
        this.render();
    }

    getCopy(klass: Klass): RuntimeObject {

        let ro: RuntimeObject = new RuntimeObject(klass);
        let rh: ButtonHelper = new ButtonHelper(this.x, this.y, this.fontsize, this.text, this.worldHelper.interpreter, ro);
        ro.intrinsicData["Actor"] = rh;
        rh.textColor = this.textColor;
        rh.text = this.text;

        rh.copyFrom(this);
        rh.render();

        return ro;
    }


    render(): void {

        this.textStyle.fill = this.textColor == null ? 0x000000 : this.textColor;
        this.textStyle.stroke = 0x000000;
        this.textStyle.strokeThickness = 0;
        this.textStyle.fontSize = this.fontsize;

        let padding = this.fontsize/5;

        if (this.displayObject == null) {
            this.backgroundGraphics = new PIXI.Graphics();
            this.higlightGraphics = new PIXI.Graphics();

            this.pixiText = new PIXI.Text(this.text, this.textStyle);

            this.displayObject = new PIXI.Container();
            this.displayObject.localTransform.translate(this.x, this.y);
            //@ts-ignore
            this.displayObject.transform.onChange();
            this.worldHelper.stage.addChild(this.displayObject);
            let container = <PIXI.Container>this.displayObject;

            container.addChild(this.higlightGraphics);
            container.addChild(this.backgroundGraphics);
            container.addChild(this.pixiText);

        } else {
            this.pixiText.text = this.text;
            this.backgroundGraphics.clear();
            this.higlightGraphics.clear();

            this.pixiText.alpha = this.fillAlpha;
            this.pixiText.anchor.x = 0;
            this.pixiText.style = this.textStyle;
        }

        this.centerXInitial = 0;
        this.centerYInitial = 0;


        if (this.text != null) {
            let tm = PIXI.TextMetrics.measureText(this.text, this.textStyle);

            this.textWidth = tm.width;
            this.textHeight = tm.height;

            this.pixiText.localTransform.identity();
            this.pixiText.localTransform.translate(padding, padding);
            // @ts-ignore
            this.pixiText.transform.onChange();

            this.centerXInitial = this.textWidth/2 + padding;
            this.centerYInitial = this.textHeight/2 + padding;
        }

        let left = 0;
        let top = 0;
        this.width = this.textWidth + 2*padding;
        this.height = this.textHeight + 2*padding;

        this.hitPolygonInitial = [
            { x: left, y: top }, { x: left + this.width, y: top}, { x: left + this.width, y: top + this.height }, 
            { x: left , y: top+this.height }
        ];
        this.hitPolygonDirty = true;

        if (this.fillColor != null) {
            this.backgroundGraphics.beginFill(this.fillColor, this.fillAlpha);
        }
        if (this.borderColor != null) {
            this.backgroundGraphics.lineStyle(this.borderWidth, this.borderColor, this.borderAlpha, 1.0)
        }

        this.backgroundGraphics.drawRoundedRect(0, 0, this.width, this.height, this.height/8);

        if (this.fillColor != null) {
            this.backgroundGraphics.endFill();
        }
        
        let highlightWidth = this.height/10 + this.borderWidth;
        this.higlightGraphics.beginFill(lightenDarkenIntColor(this.fillColor, 0.4), 1.0);
        this.higlightGraphics.drawRoundedRect(-highlightWidth, -highlightWidth, this.width + 2*highlightWidth, this.height + 2*highlightWidth, this.height/4);
        if (this.fillColor != null) {
            this.higlightGraphics.endFill();
        }

        this.higlightGraphics.visible = this.mouseIsDown;
    }


    moveTo(newX: number, newY: number) {
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

    getWidth(): number {
        return this.width;
    }

    getHeight(): number {
        return this.height;
    }


    onMouseEvent(kind: JOMouseEvent, x: number, y: number): void {
        let containsPointer = this.containsPoint(x, y);

        switch (kind) {
            case "mousedown":
                if (containsPointer) {
                    this.mouseIsDown = true;
                    this.higlightGraphics.visible = true;
                }
                break;
            case "mouseup": {
                if (containsPointer && this.mouseIsDown) {
                    this.higlightGraphics.visible = false;
                }
                this.mouseIsDown = false;
            }
                break;
                case "mouseleave": {
                    this.isMouseOver = false;
                    this.worldHelper.setCursor('default');
                }
                    break;
                case "mousemove": {
    
                    if(this.isMouseOver != containsPointer){
                        this.isMouseOver = containsPointer;
                        this.worldHelper.setCursor(containsPointer ? "pointer" : "default");
                    }
                    
                }
            }

    }


    destroy(): void {
        this.unregisterAsListener();
        super.destroy();
    }

    setVisible(visible: boolean) {
        super.setVisible(visible);
        if (visible) {
            this.registerAsListener();
        } else {
            this.unregisterAsListener();
        }
    }

    setTextColor(color: number) {
        this.textColor = color;
        this.render();
    }

}
