import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { booleanPrimitiveType, doublePrimitiveType, intPrimitiveType, stringPrimitiveType, voidPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { FilledShapeHelper } from "./FilledShape.js";
import { InternalKeyboardListener, InternalMouseListener, MouseEvent as JOMouseEvent } from "./World.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import * as PIXI from 'pixi.js';
import { copyTextToClipboard } from "../../tools/HtmlTools.js";

export class CheckBoxClass extends Klass {

    constructor(module: Module) {

        super("CheckBox", module, "Checkbox, die innerhalb der Grafikausgabe dargestellt werden kann");

        this.setBaseClass(<Klass>module.typeStore.getType("FilledShape"));

        this.addMethod(new Method("CheckBox", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let sh = new CheckBoxHelper(0, 0, 300, 24, "Text", module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = sh;

            }, false, false, 'Instanziert ein neues CheckBox-Objekt.', true));

        this.addMethod(new Method("CheckBox", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "width", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "fontsize", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "text", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let width: number = parameters[3].value;
                let fontsize: number = parameters[4].value;
                let text: string = parameters[5].value;

                let sh = new CheckBoxHelper(x, y, width, fontsize, text, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = sh;

            }, false, false, 'Instanziert ein neues CheckBox-Objekt. (x, y) sind die Koordinaten der linken oberen Ecke, fontsize die Höhe des Textes in Pixeln.', true));

        this.addMethod(new Method("CheckBox", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "width", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "fontsize", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "text", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "font-family", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let width: number = parameters[3].value;
                let fontsize: number = parameters[4].value;
                let text: string = parameters[5].value;
                let fontFamily: string = parameters[6].value;

                let sh = new CheckBoxHelper(x, y, width, fontsize, text, module.main.getInterpreter(), o, fontFamily);
                o.intrinsicData["Actor"] = sh;

            }, false, false, 'Instanziert ein neues Textobjekt. (x, y) sind die Koordinaten der linken oberen Ecke, fontsize die Höhe des Textes in Pixeln.', true));

        this.addMethod(new Method("setFontsize", new Parameterlist([
            { identifier: "fontsize", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let fontsize: number = parameters[1].value;
                let sh: CheckBoxHelper = o.intrinsicData["Actor"];

                sh.setFontsize(fontsize);

            }, false, false, 'Setzt die Schriftgröße des Textes (Einheit: Pixel).', false));

        this.addMethod(new Method("setText", new Parameterlist([
            { identifier: "text", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let text: string = parameters[1].value;
                let sh: CheckBoxHelper = o.intrinsicData["Actor"];

                sh.setText(text);

            }, false, false, 'Setzt den Text.', false));

        this.addMethod(new Method("copy", new Parameterlist([
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: CheckBoxHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("copy")) return;

                return sh.getCopy(<Klass>o.class);

            }, false, false, 'Erstellt eine Kopie des CheckBox-Objekts und git sie zurück.', false));

        this.addMethod(new Method("getWidth", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: CheckBoxHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getWidth")) return;

                return sh.getWidth();

            }, false, false, 'Gibt die Breite des Textes zurück.', false));

        this.addMethod(new Method("getHeight", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: CheckBoxHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getHeight")) return;

                return sh.getHeight();

            }, false, false, 'Gibt die Höhe des Textes zurück.', false));

        this.addMethod(new Method("getFontSize", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: CheckBoxHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getFontSize")) return;

                return sh.fontsize;

            }, false, false, 'Gibt die Schriftgröße zurück.', false));

        this.addMethod(new Method("getText", new Parameterlist([
        ]), stringPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: CheckBoxHelper = o.intrinsicData["Actor"];

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
                let sh: CheckBoxHelper = o.intrinsicData["Actor"];

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
                let sh: CheckBoxHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setTextColor")) return;

                sh.setTextColor(color);

            }, false, false, 'Setzt die Textfarbe. Die Farbe wird als int-Wert gegeben, wobei farbe == 256*256*rot + 256*grün + blau', false));


    }



}

export class CheckBoxHelper extends FilledShapeHelper implements InternalMouseListener {

    pixiText: PIXI.Text;
    backgroundGraphics: PIXI.Graphics;
    cross: PIXI.Graphics;

    textColor: number = 0x808080;
    distanceToText: number = 4;

    isChecked: boolean = true;

    textHeight: number = 10;
    textWidth: number = 10;

    mouseIsDown: boolean = false;


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
            align: "left",
            lineJoin: 'round'
        });

    constructor(public x: number, public y: number, public checkboxWidth: number, public fontsize: number,
        public text: string,
        interpreter: Interpreter, runtimeObject: RuntimeObject, public fontFamily?: string) {
        super(interpreter, runtimeObject);
        this.centerXInitial = x;
        this.centerYInitial = y;

        if (this.fontsize == 0) this.fontsize = 10;

        this.borderColor = 0x808080;
        this.borderWidth = 4;
        this.fillColor = 0xffffff;

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
        let rh: CheckBoxHelper = new CheckBoxHelper(this.x, this.y, this.checkboxWidth, this.fontsize, this.text, this.worldHelper.interpreter, ro);
        ro.intrinsicData["Actor"] = rh;

        rh.copyFrom(this);
        rh.render();

        return ro;
    }


    render(): void {

        this.textStyle.fill = this.textColor == null ? 0x000000 : this.textColor;
        this.textStyle.stroke = 0x000000;
        this.textStyle.strokeThickness = 0;
        this.textStyle.fontSize = this.fontsize;

        if (this.displayObject == null) {
            this.backgroundGraphics = new PIXI.Graphics();
            this.cross = new PIXI.Graphics();

            this.pixiText = new PIXI.Text(this.text, this.textStyle);
            this.pixiText.x = this.checkboxWidth + this.distanceToText;
            this.pixiText.y = 0;

            this.displayObject = new PIXI.Container();
            this.displayObject.localTransform.translate(this.x, this.y);
            //@ts-ignore
            this.displayObject.transform.onChange();
            this.worldHelper.stage.addChild(this.displayObject);
            let container = <PIXI.Container>this.displayObject;

            container.addChild(this.backgroundGraphics);
            container.addChild(this.pixiText);
            container.addChild(this.cross);

        } else {
            this.pixiText.text = this.text;
            this.backgroundGraphics.clear();
            this.cross.clear();

            this.pixiText.alpha = this.fillAlpha;
            this.pixiText.anchor.x = 0;
            //@ts-ignore
            this.textStyle.align = this.alignment;
            this.pixiText.style = this.textStyle;
        }

        this.centerXInitial = 0;
        this.centerYInitial = 0;

        let textTop = 0;

        if (this.text != null) {
            let tm = PIXI.TextMetrics.measureText(this.text, this.textStyle);

            this.textWidth = tm.width;
            this.textHeight = tm.height;
            let ascent = tm.fontProperties.ascent

            textTop = (this.checkboxWidth - this.textHeight)/2;
            this.distanceToText = tm.fontProperties.descent;

            this.pixiText.localTransform.identity();
            this.pixiText.localTransform.translate(this.checkboxWidth + this.distanceToText, textTop);
            // @ts-ignore
            this.pixiText.transform.onChange();

            this.centerXInitial = (this.checkboxWidth + this.textWidth + this.distanceToText) / 2;
            this.centerYInitial = this.checkboxWidth / 2;
        }

        let left = 0;
        let top = textTop;
        let overallWidth = this.textWidth + this.checkboxWidth + this.distanceToText;

        this.hitPolygonInitial = [
            { x: left, y: top }, { x: left, y: top + this.textHeight },
            { x: left + overallWidth, y: top + this.textHeight }, { x: left + overallWidth, y: top }
        ];
        this.hitPolygonDirty = true;

        if (this.fillColor != null) {
            this.backgroundGraphics.beginFill(this.fillColor, this.fillAlpha);
        }
        if (this.borderColor != null) {
            this.backgroundGraphics.lineStyle(this.borderWidth, this.borderColor, this.borderAlpha, 1.0)
        }

        this.makeRectangle(this.backgroundGraphics, 0, 0, this.checkboxWidth, this.checkboxWidth);
        this.backgroundGraphics.closePath();

        if (this.fillColor != null) {
            this.backgroundGraphics.endFill();
        }

        let df = 2.0;
        let bwdf = this.borderWidth * df;

        this.cross.lineStyle(this.borderWidth * 2, 0x0, 1.0, 0.5);
        this.cross.moveTo(bwdf, bwdf);
        this.cross.lineTo(this.checkboxWidth - bwdf, this.checkboxWidth - bwdf);
        this.cross.moveTo(this.checkboxWidth - bwdf, bwdf);
        this.cross.lineTo(bwdf, this.checkboxWidth - bwdf);

        this.cross.visible = this.isChecked;
    }

    makeRectangle(g: PIXI.Graphics, left: number, top: number, width: number, height: number) {
        g.moveTo(left, top);
        g.lineTo(left + width, top);
        g.lineTo(left + width, top + height);
        g.lineTo(left, top + height);
        g.closePath();
    }

    getLocalCoordinates(x: number, y: number) {
        let p = new PIXI.Point(x * this.worldHelper.globalScale, y * this.worldHelper.globalScale);
        this.displayObject.worldTransform.applyInverse(p, p);
        return p;
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
        let g: PIXI.Text = <any>this.displayObject;
        return g.width;
    }

    getHeight(): number {
        let g: PIXI.Text = <any>this.displayObject;
        return g.height;
    }


    onMouseEvent(kind: JOMouseEvent, x: number, y: number): void {
        let containsPointer = this.containsPoint(x, y);

        switch (kind) {
            case "mousedown":
                if (containsPointer) {
                    this.mouseIsDown = true;
                }
                break;
            case "mouseup": {
                if (containsPointer && this.mouseIsDown) {
                    this.isChecked = !this.isChecked;
                    this.render();
                }
                this.mouseIsDown = false;
            }
                break;
            case "mouseleave": 
                break;
            case "mousemove": 
                break;
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
