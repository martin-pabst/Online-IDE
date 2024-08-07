import { Module } from "../../../compiler/parser/Module.js";
import { Klass } from "../../../compiler/types/Class.js";
import { booleanPrimitiveType, doublePrimitiveType, intPrimitiveType, stringPrimitiveType, voidPrimitiveType } from "../../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist, Value } from "../../../compiler/types/Types.js";
import { RuntimeObject } from "../../../interpreter/RuntimeObject.js";
import { FilledShapeHelper } from "../FilledShape.js";
import { InternalKeyboardListener, InternalMouseListener, MouseEvent as JOMouseEvent } from "../World.js";
import { Interpreter } from "../../../interpreter/Interpreter.js";
import * as PIXI from 'pixi.js';
import { copyTextToClipboard } from "../../../../tools/HtmlTools.js";
import { ArrayType } from "../../../compiler/types/Array.js";
import { GuiTextComponentHelper } from "./GuiTextComponent.js";

export class RadioButtonClass extends Klass {

    constructor(module: Module) {

        super("RadioButton", module, "RadioButton, der innerhalb der Grafikausgabe dargestellt werden kann");

        this.setBaseClass(<Klass>module.typeStore.getType("GuiTextComponent"));

        this.addMethod(new Method("RadioButton", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "width", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "fontsize", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "text", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let width: number = parameters[3].value;
                let fontsize: number = parameters[4].value;
                let text: string = parameters[5].value;
                let index: number = parameters[6].value;

                let sh = new RadioButtonHelper(x, y, width, fontsize, text, index, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = sh;

            }, false, false, 'Instanziert ein neues RadioButton-Objekt. (x, y) sind die Koordinaten der linken oberen Ecke, fontsize die Höhe des Textes in Pixeln.', true));

        this.addMethod(new Method("RadioButton", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "width", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "fontsize", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "text", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "font-family", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let width: number = parameters[3].value;
                let fontsize: number = parameters[4].value;
                let text: string = parameters[5].value;
                let fontFamily: string = parameters[6].value;
                let index: number = parameters[7].value;

                let sh = new RadioButtonHelper(x, y, width, fontsize, text, index, module.main.getInterpreter(), o, fontFamily);
                o.intrinsicData["Actor"] = sh;

            }, false, false, 'Instanziert ein neues Textobjekt. (x, y) sind die Koordinaten der linken oberen Ecke, fontsize die Höhe des Textes in Pixeln.', true));

        this.addMethod(new Method("copy", new Parameterlist([
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: RadioButtonHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("copy")) return;

                return sh.getCopy(<Klass>o.class);

            }, false, false, 'Erstellt eine Kopie des RadioButton-Objekts und git sie zurück.', false));

        this.addMethod(new Method("getIndex", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: RadioButtonHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getIndex")) return;

                return sh.index;

            }, false, false, 'Gibt den Index des Radiobuttons zurück.', false));

        this.addMethod(new Method("getIndexOfSelectedRadiobutton", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: RadioButtonHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getIndexOfSelectedRadiobutton")) return;

                return sh.getIndexOfSelectedRadiobutton();

            }, false, false, 'Sind mehrere Radiobuttons mittels connectTo mit dieserm logisch verbunden, so ist genau einer davon selektiert. Diese Methode gibt den Index dieses selektierten Radiobuttons zurück.', false));

        this.addMethod(new Method("getTextOfSelectedRadiobutton", new Parameterlist([
        ]), stringPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: RadioButtonHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getTextOfSelectedRadiobutton")) return;

                return sh.getTextOfSelectedRadiobutton();

            }, false, false, 'Sind mehrere Radiobuttons mittels connectTo mit dieserm logisch verbunden, so ist genau einer davon selektiert. Diese Methode gibt den Text dieses selektierten Radiobuttons zurück.', false));

        this.addMethod(new Method("setIndex", new Parameterlist([
            { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let index: number = parameters[1].value;
                let sh: RadioButtonHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setIndex")) return;

                sh.index = index;

            }, false, false, 'Setzt den Index des Radiobuttons.', false));

        this.addMethod(new Method("setDotColor", new Parameterlist([
            { identifier: "color", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let color: number = parameters[1].value;
                let sh: RadioButtonHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setDotColor")) return;

                sh.setDotColor(color);

            }, false, false, 'Setzt die Farbe des Kreuzchens. Die Farbe wird als int-Wert gegeben, wobei farbe == 256*256*rot + 256*grün + blau', false));

        this.addMethod(new Method("connectTo", new Parameterlist([
            { identifier: "other_radiobuttons", type: new ArrayType(this), declaration: null, usagePositions: null, isFinal: true, isEllipsis: true }
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let otherButtons: Value[] = parameters[1].value;
                let sh: RadioButtonHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("connectTo")) return;

                let otherHelpers: RadioButtonHelper[] = otherButtons.map(v => (<RuntimeObject>v.value).intrinsicData["Actor"]);
                otherHelpers.push(sh);

                otherHelpers = otherHelpers.concat(sh.otherButtons);

                for (let oh of otherHelpers) {
                    oh.connectTo(otherHelpers);
                }

                sh.setSelected();
                sh.render();
                for (let rb of sh.otherButtons) rb.render();

            }, false, false, 'Verbindet diesen Radiobutton logisch mit den anderen Radiobuttons. Wird anschließend auf einen davon geklickt, so wird dieser selektiert, die anderen deselektiert.', false));

        this.addMethod(new Method("isSelected", new Parameterlist([
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: RadioButtonHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("isSelected")) return;

                return sh.isSelected;

            }, false, false, 'Gibt genau dann true zurück, falls die RadioButton selektiert ist.', false));

        this.addMethod(new Method("select", new Parameterlist([
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: RadioButtonHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("select")) return;

                return sh.setSelected();

            }, false, false, 'Selektiert diesen Radiobutton und deselektiert alle via connectTo mit ihm verbundenen Radiobuttons.', false));

    }



}

export class RadioButtonHelper extends GuiTextComponentHelper {

    backgroundGraphics: PIXI.Graphics;
    dot: PIXI.Graphics;

    distanceToText: number = 4;

    dotColor: number = 0x000000;

    isSelected: boolean = true;

    mouseIsDown: boolean = false;

    isMouseOver: boolean = false;

    otherButtons: RadioButtonHelper[] = [];

    constructor(public x: number, public y: number, public radiobuttonWidth: number, public fontsize: number,
        public text: string, public index: number,
        interpreter: Interpreter, runtimeObject: RuntimeObject, public fontFamily?: string) {

        super(interpreter, runtimeObject, true, false, fontsize, text, fontFamily);

        this.centerXInitial = x;
        this.centerYInitial = y;

        if (this.fontsize == 0) this.fontsize = 10;

        this.borderColor = 0x808080;
        this.borderWidth = fontsize / 8;
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


    getIndexOfSelectedRadiobutton(): number {
        if (this.isSelected) {
            return this.index;
        }
        for (let rb of this.otherButtons) {
            if (rb.isSelected) return rb.index;
        }

        return -1;
    }

    getTextOfSelectedRadiobutton(): string {
        if (this.isSelected) {
            return this.text;
        }
        for (let rb of this.otherButtons) {
            if (rb.isSelected) return rb.text;
        }

        return "";
    }

    setSelected() {
        this.isSelected = true;
        this.render();
        for (let ob of this.otherButtons) {
            ob.isSelected = false;
            ob.render();
        }
    }

    connectTo(otherButtons: RadioButtonHelper[]) {
        for (let rb of otherButtons) {
            if (this.otherButtons.indexOf(rb) <= 0 && rb != this) {
                this.otherButtons.push(rb);
            }
        }
    }

    setDotColor(color: number) {
        this.dotColor = color;
        this.render();
    }

    getCopy(klass: Klass): RuntimeObject {

        let ro: RuntimeObject = new RuntimeObject(klass);
        let rh: RadioButtonHelper = new RadioButtonHelper(this.x, this.y, this.radiobuttonWidth, this.fontsize, this.text, this.index, this.worldHelper.interpreter, ro);
        ro.intrinsicData["Actor"] = rh;
        rh.dotColor = this.dotColor;
        rh.textColor = this.textColor;
        rh.distanceToText = this.distanceToText;
        rh.isSelected = this.isSelected;
        rh.text = this.text;
        rh.index = this.index++;

        rh.copyFrom(this);
        rh.render();

        return ro;
    }


    render(): void {
        this.textCompomentPrerender();

        if (this.displayObject == null) {
            this.backgroundGraphics = new PIXI.Graphics();
            this.dot = new PIXI.Graphics();

            this.pixiText = new PIXI.Text(this.text, this.textStyle);
            this.pixiText.x = this.radiobuttonWidth + this.distanceToText;
            this.pixiText.y = 0;

            this.displayObject = new PIXI.Container();
            this.displayObject.localTransform.translate(this.x, this.y);
            //@ts-ignore
            this.displayObject.transform.onChange();
            this.worldHelper.stage.addChild(this.displayObject);
            let container = <PIXI.Container>this.displayObject;

            container.addChild(this.backgroundGraphics);
            container.addChild(this.pixiText);
            container.addChild(this.dot);

        } else {
            this.pixiText.text = this.text;
            this.backgroundGraphics.clear();
            this.dot.clear();

            this.pixiText.alpha = this.fillAlpha;
            this.pixiText.anchor.x = 0;
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

            textTop = (this.radiobuttonWidth - this.textHeight) / 2;
            this.distanceToText = tm.fontProperties.descent * 3;

            this.pixiText.localTransform.identity();
            this.pixiText.localTransform.translate(this.radiobuttonWidth + this.distanceToText, textTop);
            // @ts-ignore
            this.pixiText.transform.onChange();

            this.centerXInitial = (this.radiobuttonWidth + this.textWidth + this.distanceToText) / 2;
            this.centerYInitial = this.radiobuttonWidth / 2;
        }

        let left = 0;
        let top = 0;
        let textBottom = top + this.radiobuttonWidth - textTop;
        let overallWidth = this.textWidth + this.radiobuttonWidth + this.distanceToText;
        this.width = overallWidth;
        this.height = Math.max(this.textHeight, this.radiobuttonWidth);

        this.hitPolygonInitial = [
            { x: left, y: top }, { x: left + this.radiobuttonWidth, y: top }, { x: left + this.radiobuttonWidth + this.distanceToText, y: textTop },
            { x: left + overallWidth, y: textTop },
            { x: left + overallWidth, y: textBottom },
            { x: left + this.radiobuttonWidth + this.distanceToText, y: textBottom },
            { x: left + this.radiobuttonWidth, y: top + this.radiobuttonWidth },
            { x: left, y: top + this.radiobuttonWidth }
        ];
        this.hitPolygonDirty = true;

        if (this.fillColor != null) {
            this.backgroundGraphics.beginFill(this.fillColor, this.fillAlpha);
        }
        if (this.borderColor != null) {
            this.backgroundGraphics.lineStyle(this.borderWidth, this.borderColor, this.borderAlpha, 1.0)
        }

        this.backgroundGraphics.drawCircle(this.radiobuttonWidth / 2, this.radiobuttonWidth / 2, this.radiobuttonWidth / 2);

        if (this.fillColor != null) {
            this.backgroundGraphics.endFill();
        }

        this.dot.beginFill(this.dotColor, this.fillAlpha);
        this.dot.drawCircle(this.radiobuttonWidth / 2, this.radiobuttonWidth / 2, this.radiobuttonWidth / 6);

        this.dot.visible = this.isSelected;
    }

    getLocalCoordinates(x: number, y: number) {
        let p = new PIXI.Point(x * this.worldHelper.globalScale, y * this.worldHelper.globalScale);
        this.displayObject.worldTransform.applyInverse(p, p);
        return p;
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
                    this.setSelected();
                    this.onChange("" + this.index)
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
