import * as PIXI from 'pixi.js';
import { Module } from "../../../compiler/parser/Module.js";
import { Klass } from "../../../compiler/types/Class.js";
import { booleanPrimitiveType, doublePrimitiveType, intPrimitiveType, stringPrimitiveType, voidPrimitiveType } from "../../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../../compiler/types/Types.js";
import { Interpreter } from "../../../interpreter/Interpreter.js";
import { RuntimeObject } from "../../../interpreter/RuntimeObject.js";
import { MouseEvent as JOMouseEvent } from "../World.js";
import { GuiTextComponentHelper } from "./GuiTextComponent.js";

export class CheckBoxClass extends Klass {

    constructor(module: Module) {

        super("CheckBox", module, "Checkbox, die innerhalb der Grafikausgabe dargestellt werden kann");

        this.setBaseClass(<Klass>module.typeStore.getType("GuiTextComponent"));

        this.addMethod(new Method("CheckBox", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let sh = new CheckBoxHelper(0, 0, 300, 24, "Text", module.main.getInterpreter(), o, false);
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

                let sh = new CheckBoxHelper(x, y, width, fontsize, text, module.main.getInterpreter(), o, false);
                o.intrinsicData["Actor"] = sh;

            }, false, false, 'Instanziert ein neues CheckBox-Objekt. (x, y) sind die Koordinaten der linken oberen Ecke, fontsize die Höhe des Textes in Pixeln.', true));

        this.addMethod(new Method("CheckBox", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "width", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "fontsize", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "text", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "checked", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let width: number = parameters[3].value;
                let fontsize: number = parameters[4].value;
                let text: string = parameters[5].value;
                let checked: boolean = parameters[6].value;

                let sh = new CheckBoxHelper(x, y, width, fontsize, text, module.main.getInterpreter(), o, checked);
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

                let sh = new CheckBoxHelper(x, y, width, fontsize, text, module.main.getInterpreter(), o, false, fontFamily);
                o.intrinsicData["Actor"] = sh;

            }, false, false, 'Instanziert ein neues Textobjekt. (x, y) sind die Koordinaten der linken oberen Ecke, fontsize die Höhe des Textes in Pixeln.', true));

        this.addMethod(new Method("copy", new Parameterlist([
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: CheckBoxHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("copy")) return;

                return sh.getCopy(<Klass>o.class);

            }, false, false, 'Erstellt eine Kopie des CheckBox-Objekts und git sie zurück.', false));

        this.addMethod(new Method("setCrossColor", new Parameterlist([
            { identifier: "color", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let color: number = parameters[1].value;
                let sh: CheckBoxHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setCrossColor")) return;

                sh.setCrossColor(color);

            }, false, false, 'Setzt die Farbe des Kreuzchens. Die Farbe wird als int-Wert gegeben, wobei farbe == 256*256*rot + 256*grün + blau', false));

        this.addMethod(new Method("setChecked", new Parameterlist([
            { identifier: "checked", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let checked: boolean = parameters[1].value;
                let sh: CheckBoxHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setChecked")) return;

                sh.setChecked(checked);

            }, false, false, 'Setzt den Zustand der Checkbox: angekreuzt bzw. nicht angekreuzt', false));

        this.addMethod(new Method("isChecked", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: CheckBoxHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("isChecked")) return;

                return sh.isChecked;

            }, false, false, 'Gibt genau dann true zurück, falls die Checkbox angekreuzt ist.', false));

    }

}

export class CheckBoxHelper extends GuiTextComponentHelper {

    backgroundGraphics: PIXI.Graphics;
    cross: PIXI.Graphics;

    distanceToText: number = 4;

    crossColor: number = 0x000000;

    isChecked: boolean = true;

    mouseIsDown: boolean = false;

    isMouseOver: boolean = false;


    constructor(public x: number, public y: number, public checkboxWidth: number, public fontsize: number,
        public text: string,
        interpreter: Interpreter, runtimeObject: RuntimeObject, checked: boolean, public fontFamily?: string) {

        super(interpreter, runtimeObject, true, false, fontsize, text, fontFamily);

        this.isChecked = checked;

        this.centerXInitial = x;
        this.centerYInitial = y;

        if (this.fontsize == 0) this.fontsize = 10;

        this.borderColor = 0x808080;
        this.borderWidth = checkboxWidth / 10;
        this.fillColor = 0xffffff;

        this.textStyle.stroke = 0x000000;
        this.textStyle.fontSize = fontsize;

        if (fontFamily != null) {
            this.textStyle.fontFamily = fontFamily;
        }

        this.hitPolygonInitial = [];

        this.render();

        this.addToDefaultGroupAndSetDefaultVisibility();

    }

    onKeyDown(key: string, isShift: boolean, isCtrl: boolean, isAlt: boolean): void { }

    looseKeyboardFocus(): void { }


    setCrossColor(color: number) {
        this.crossColor = color;
        this.render();
    }

    getCopy(klass: Klass): RuntimeObject {

        let ro: RuntimeObject = new RuntimeObject(klass);
        let rh: CheckBoxHelper = new CheckBoxHelper(this.x, this.y, this.checkboxWidth, this.fontsize, this.text, this.worldHelper.interpreter, ro, this.isChecked);
        ro.intrinsicData["Actor"] = rh;

        rh.copyFrom(this);
        rh.render();

        return ro;
    }

 
    render(): void {

        this.textCompomentPrerender();

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

            textTop = (this.checkboxWidth - this.textHeight) / 2;
            this.distanceToText = tm.fontProperties.descent * 3;

            this.pixiText.localTransform.identity();
            this.pixiText.localTransform.translate(this.checkboxWidth + this.distanceToText, textTop);
            // @ts-ignore
            this.pixiText.transform.onChange();

            this.centerXInitial = (this.checkboxWidth + this.textWidth + this.distanceToText) / 2;
            this.centerYInitial = this.checkboxWidth / 2;
        }

        let left = 0;
        let top = 0;
        let textBottom = top + this.checkboxWidth - textTop;
        let overallWidth = this.textWidth + this.checkboxWidth + this.distanceToText;
        this.width = overallWidth;
        this.height = Math.max(this.checkboxWidth, this.textHeight);

        this.hitPolygonInitial = [
            { x: left, y: top }, { x: left + this.checkboxWidth, y: top }, { x: left + this.checkboxWidth + this.distanceToText, y: textTop },
            { x: left + overallWidth, y: textTop },
            { x: left + overallWidth, y: textBottom },
            { x: left + this.checkboxWidth + this.distanceToText, y: textBottom },
            { x: left + this.checkboxWidth, y: top + this.checkboxWidth },
            { x: left, y: top + this.checkboxWidth }
        ];
        this.hitPolygonDirty = true;

        if (this.fillColor != null) {
            this.backgroundGraphics.beginFill(this.fillColor, this.fillAlpha);
        }
        if (this.borderColor != null) {
            this.backgroundGraphics.lineStyle(this.borderWidth, this.borderColor, this.borderAlpha, 1.0)
        }

        this.backgroundGraphics.drawRoundedRect(0, 0, this.checkboxWidth, this.checkboxWidth, this.checkboxWidth / 8);

        // this.makeRectangle(this.backgroundGraphics, 0, 0, this.checkboxWidth, this.checkboxWidth);
        // this.backgroundGraphics.closePath();

        if (this.fillColor != null) {
            this.backgroundGraphics.endFill();
        }

        let df = 3.0;
        let bwdf = this.borderWidth * df;

        // this.cross.lineStyle(this.borderWidth * 2, this.crossColor, this.fillAlpha, 0.5);
        this.cross.lineStyle({
            width: this.borderWidth * 2,
            color: this.crossColor,
            alpha: this.fillAlpha,
            alignment: 0.5,
            cap: PIXI.LINE_CAP.ROUND
        });
        this.cross.moveTo(bwdf, bwdf);
        this.cross.lineTo(this.checkboxWidth - bwdf, this.checkboxWidth - bwdf);
        this.cross.moveTo(this.checkboxWidth - bwdf, bwdf);
        this.cross.lineTo(bwdf, this.checkboxWidth - bwdf);

        this.cross.visible = this.isChecked;
    }

    getLocalCoordinates(x: number, y: number) {
        let p = new PIXI.Point(x * this.worldHelper.globalScale, y * this.worldHelper.globalScale);
        this.displayObject.worldTransform.applyInverse(p, p);
        return p;
    }

    setChecked(checked: boolean){
        this.isChecked = checked;
        this.render();
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
            case "mouseleave": {
                this.isMouseOver = false;
                this.worldHelper.setCursor('default');
            }
                break;
            case "mousemove": {

                if (this.isMouseOver != containsPointer) {
                    this.isMouseOver = containsPointer;
                    this.worldHelper.setCursor(containsPointer ? "pointer" : "default");
                }

            }
        }

    }

}
