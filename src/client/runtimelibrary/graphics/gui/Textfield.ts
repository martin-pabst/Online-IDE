import { Module } from "../../../compiler/parser/Module.js";
import { Klass } from "../../../compiler/types/Class.js";
import { booleanPrimitiveType, doublePrimitiveType, intPrimitiveType, stringPrimitiveType, voidPrimitiveType } from "../../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../../compiler/types/Types.js";
import { RuntimeObject } from "../../../interpreter/RuntimeObject.js";
import { FilledShapeHelper } from "../FilledShape.js";
import { InternalKeyboardListener, InternalMouseListener, MouseEvent as JOMouseEvent } from "../World.js";
import { Interpreter } from "../../../interpreter/Interpreter.js";
import * as PIXI from 'pixi.js';
import { copyTextToClipboard } from "../../../../tools/HtmlTools.js";
import { GuiTextComponentHelper } from "./GuiTextComponent.js";

export class TextFieldClass extends Klass {

    constructor(module: Module) {

        super("TextField", module, "Text, der innerhalb der Grafikausgabe dargestellt werden kann");

        this.setBaseClass(<Klass>module.typeStore.getType("GuiTextComponent"));

        this.addMethod(new Method("TextField", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let sh = new TextFieldHelper(0, 0, 300, 24, "Text", module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = sh;

            }, false, false, 'Instanziert ein neues TextField-Objekt.', true));

        this.addMethod(new Method("TextField", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "width", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "fontsize", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "caption", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let width: number = parameters[3].value;
                let fontsize: number = parameters[4].value;
                let text: string = parameters[5].value;

                let sh = new TextFieldHelper(x, y, width, fontsize, text, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = sh;

            }, false, false, 'Instanziert ein neues TextField-Objekt. (x, y) sind die Koordinaten der linken oberen Ecke, fontsize die Höhe des Textes in Pixeln.', true));

        this.addMethod(new Method("TextField", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "width", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "fontsize", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "caption", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
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

                let sh = new TextFieldHelper(x, y, width, fontsize, text, module.main.getInterpreter(), o, fontFamily);
                o.intrinsicData["Actor"] = sh;

            }, false, false, 'Instanziert ein neues Textobjekt. (x, y) sind die Koordinaten der linken oberen Ecke, fontsize die Höhe des Textes in Pixeln.', true));

        this.addMethod(new Method("copy", new Parameterlist([
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TextFieldHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("copy")) return;

                return sh.getCopy(<Klass>o.class);

            }, false, false, 'Erstellt eine Kopie des TextField-Objekts und git sie zurück.', false));

            this.addMethod(new Method("setPadding", new Parameterlist([
                { identifier: "padding", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
            ]), voidPrimitiveType,
                (parameters) => {
    
                    let o: RuntimeObject = parameters[0].value;
                    let padding: number = parameters[1].value;
                    let sh: TextFieldHelper = o.intrinsicData["Actor"];
    
                    if (sh.testdestroyed("setPadding")) return;
    
                    sh.padding = padding;
                    sh.render();
    
                }, false, false, 'Setzt den Innenabstand (padding) des Textes zum umgebenden Rechteck.', false));

    }

}

export class TextFieldHelper extends GuiTextComponentHelper {

    backgroundGraphics: PIXI.Graphics;
    mask: PIXI.Graphics;
    keyboardFocusRect: PIXI.Graphics;
    cursor: PIXI.Graphics;
    selectionRectangle: PIXI.Graphics;

    padding: number = 8;

    hasKeyboardFocus: boolean = false;

    characterStops: number[] = [];
    characterCenterList: number[] = [];

    isSelecting: boolean = false;
    selectionStart: number = 0;
    selectionEnd: number = 0;

    renderFromCharacterPosition: number = 0;

    timerId: any;

    isMouseOver: boolean = false;

    constructor(public x: number, public y: number, public width: number, public fontsize: number,
        caption: string,
        interpreter: Interpreter, runtimeObject: RuntimeObject, public fontFamily?: string) {

        super(interpreter, runtimeObject, true, true, fontsize, caption, fontFamily);

        this.centerXInitial = x;
        this.centerYInitial = y;

        this.borderColor = 0x808080;
        this.borderWidth = fontsize/10;
        this.fillColor = 0xffffff;
        this.textColor = 0x000000;

        this.hitPolygonInitial = [];

        this.generateCharacterStops();

        this.render();

        this.addToDefaultGroupAndSetDefaultVisibility();

        this.initTimer();
    }

    initTimer() {
        let that = this;
        this.timerId = setInterval(() => {
            if (that.cursor != null && !that.cursor.destroyed && that.hasKeyboardFocus) {
                that.cursor.visible = !that.cursor.visible;
            }
        }, 500);

    }

    unregisterAsListener() {
        super.unregisterAsListener();
        clearInterval(this.timerId);
    }

    getCopy(klass: Klass): RuntimeObject {

        let ro: RuntimeObject = new RuntimeObject(klass);
        let rh: TextFieldHelper = new TextFieldHelper(this.x, this.y, this.width, this.fontsize, this.text, this.worldHelper.interpreter, ro);
        ro.intrinsicData["Actor"] = rh;

        rh.copyFrom(this);
        rh.render();

        return ro;
    }


    render(): void {

        this.scrollIfNecessary();
        this.textCompomentPrerender();

        let t = this.text;
        if(t.length == 0){
            t = this.text;
            this.textStyle.fill = 0x404040;
        } else {
            t = this.text.substring(this.renderFromCharacterPosition);
        }

        if (this.displayObject == null) {
            this.backgroundGraphics = new PIXI.Graphics();
            this.keyboardFocusRect = new PIXI.Graphics();
            this.cursor = new PIXI.Graphics();
            this.selectionRectangle = new PIXI.Graphics();

            this.mask = new PIXI.Graphics();

            this.pixiText = new PIXI.Text(t, this.textStyle);

            this.displayObject = new PIXI.Container();
            this.displayObject.localTransform.translate(this.x + this.padding, this.y + this.padding);
            //@ts-ignore
            this.displayObject.transform.onChange();
            this.worldHelper.stage.addChild(this.displayObject);
            let container = <PIXI.Container>this.displayObject;

            container.addChild(this.mask);
            container.addChild(this.backgroundGraphics);
            container.addChild(this.keyboardFocusRect);
            container.addChild(this.selectionRectangle);
            container.addChild(this.pixiText);
            container.addChild(this.cursor);

            this.pixiText.mask = this.mask;
            this.selectionRectangle.mask = this.mask;

        } else {
            this.pixiText.text = t;
            this.backgroundGraphics.clear();
            this.mask.clear();
            this.keyboardFocusRect.clear();
            this.selectionRectangle.clear();
            this.cursor.clear();

            this.pixiText.alpha = this.fillAlpha;
            this.pixiText.anchor.x = 0;
            //@ts-ignore
            this.textStyle.align = this.alignment;
            this.pixiText.style = this.textStyle;
        }

        this.centerXInitial = 0;
        this.centerYInitial = 0;

        let width = 0;

        if (this.text != null) {
            let tm = PIXI.TextMetrics.measureText(this.text, this.textStyle);

            width = this.width;
            this.height = tm.height;
            tm.fontProperties.ascent

            this.centerXInitial = width / 2;
            this.centerYInitial = this.height / 2;
        }

        let left = 0 - this.pixiText.anchor.x * width;
        let top = 0 - this.pixiText.anchor.y * this.height;

        this.hitPolygonInitial = [
            { x: left, y: top }, { x: left, y: top + this.height },
            { x: left + width, y: top + this.height }, { x: left + width, y: top }
        ];
        this.hitPolygonDirty = true;

        let rLeft = -this.padding;
        let rTop = -this.padding;

        this.mask.beginFill(0x0);
        this.mask.drawRect(0, 0, this.width - 2 * this.padding, this.height);
        this.mask.endFill();

        if (this.fillColor != null) {
            this.backgroundGraphics.beginFill(this.fillColor, this.fillAlpha);
        }
        if (this.borderColor != null) {
            this.backgroundGraphics.lineStyle(this.borderWidth, this.borderColor, this.borderAlpha, 0.5)
        }

        this.backgroundGraphics.drawRoundedRect(-this.padding, -this.padding, this.width, this.height + 2 * this.padding, this.fontsize/8);

        if (this.fillColor != null) {
            this.backgroundGraphics.endFill();
        }

        if (this.selectionEnd != this.selectionStart) {
            this.selectionRectangle.beginFill(0x8080ff, 0.5);
            let xFrom = this.characterStops[this.selectionStart] - this.characterStops[this.renderFromCharacterPosition];
            let xTo = this.characterStops[this.selectionEnd] - this.characterStops[this.renderFromCharacterPosition];
            if(xTo < xFrom){
                let z = xTo;
                xTo = xFrom;
                xFrom = z;
            }
            this.selectionRectangle.drawRoundedRect(xFrom, 0, xTo - xFrom, this.height, this.fontsize/8);
            this.selectionRectangle.endFill();
        }

        this.renderCursor();

        this.keyboardFocusRect.lineStyle(this.borderWidth, 0x800000, 1.0, 0.5);
        this.keyboardFocusRect.drawRect(-this.padding, -this.padding, this.width, this.height + 2 * this.padding);
        this.keyboardFocusRect.closePath();

        this.keyboardFocusRect.visible = this.hasKeyboardFocus;

    }

    renderCursor() {
        this.cursor.clear();
        let cursorWidth = Math.min(2, this.fontsize / 10);
        this.cursor.lineStyle(cursorWidth, 0x0, 1.0, 0.5);
        let cx = this.characterStops[this.selectionEnd] - this.characterStops[this.renderFromCharacterPosition];

        let start = new PIXI.Point(cx, 0);
        let end = new PIXI.Point(cx, this.height);

        this.cursor.moveTo(start.x, start.y).lineTo(end.x, end.y);
        this.cursor.visible = this.hasKeyboardFocus;
    }

    getLocalCoordinates(x: number, y: number) {
        let p = new PIXI.Point(x * this.worldHelper.globalScale, y * this.worldHelper.globalScale);
        this.displayObject.worldTransform.applyInverse(p, p);
        return p;
    }

    onMouseEvent(kind: JOMouseEvent, x: number, y: number): void {
        let containsPointer = this.containsPoint(x, y);

        switch (kind) {
            case "mousedown": {
                if (containsPointer) {
                    this.gainKeyboardFocus();
                    this.startSelecting(x, y);
                } else {
                    this.looseKeyboardFocus();
                }
            }
                break;
            case "mouseup": {
                this.stopSelecting();
            }
                break;
            case "mouseleave": {
                this.stopSelecting();
                this.isMouseOver = false;
                this.worldHelper.setCursor('default');
            }
                break;
            case "mousemove": {
                if (this.isSelecting) {
                    let pos = this.getLocalCoordinates(x, y);
                    this.selectionEnd = this.getCharacterPosition(pos.x);
                    this.render();
                }

                if(this.isMouseOver != containsPointer){
                    this.isMouseOver = containsPointer;
                    this.worldHelper.setCursor(containsPointer ? "pointer" : "default");
                }
                
            }
                break;
        }


    }

    generateCharacterStops() {
        this.characterStops = [0];
        for (let i = 1; i <= this.text.length; i++) {
            let subtext = this.text.substring(0, i);
            let tm = PIXI.TextMetrics.measureText(subtext, this.textStyle);
            this.characterStops.push(tm.width);
        }

        this.characterCenterList = [];
        for (let i = 0; i < this.characterStops.length - 1; i++) {
            this.characterCenterList.push((this.characterStops[i] + this.characterStops[i + 1]) / 2);
        }
    }

    startSelecting(x: number, y: number) {
        this.isSelecting = true;
        let pos = this.getLocalCoordinates(x, y);
        this.selectionStart = this.getCharacterPosition(pos.x);
        this.selectionEnd = this.selectionStart;
        this.render();
    }

    stopSelecting() {
        this.isSelecting = false;
    }

    deleteSelected() {
        if (this.selectionEnd != this.selectionStart) {
            this.adjustSelectStartLowerSelectEnd();
            this.text = this.text.substring(0, this.selectionStart) + this.text.substring(this.selectionEnd);
            this.selectionEnd = this.selectionStart;
            this.isSelecting = false;
        }
    }
    adjustSelectStartLowerSelectEnd() {
        if (this.selectionEnd < this.selectionStart) {
            let z = this.selectionEnd;
            this.selectionEnd = this.selectionStart;
            this.selectionStart = z;
        }
    }

    onKeyDown(key: string, isShift: boolean, isCtrl: boolean, isAlt: boolean): void {
        if (!this.hasKeyboardFocus) return;
        this.isSelecting = false;

        let that = this;
        if (isCtrl && key == "c") {
            this.adjustSelectStartLowerSelectEnd();
            copyTextToClipboard(this.text.substring(this.selectionStart, this.selectionEnd));
        } else if (isCtrl && key == "v") {
            navigator.clipboard.readText().then(
                clipText => {
                    that.deleteSelected();
                    that.text = that.text.substring(0, that.selectionEnd) + clipText + that.text.substring(that.selectionEnd);
                    that.selectionEnd += clipText.length;
                    that.selectionStart = that.selectionEnd;
                    that.generateCharacterStops();
                    that.render();
                    this.onChange(this.text);
                });
        } else if (key.length == 1) {
            this.deleteSelected();
            this.text = this.text.substring(0, this.selectionEnd) + key + this.text.substring(this.selectionEnd);
            this.selectionEnd++;
            this.selectionStart = this.selectionEnd;
            this.generateCharacterStops();
            this.render();
            this.onChange(this.text);
        } else {
            switch (key) {
                case "ArrowRight":
                    this.selectionEnd = Math.min(this.selectionEnd + 1, this.text.length);
                    if (!isShift) this.selectionStart = this.selectionEnd;
                    this.render();
                    break;
                case "ArrowLeft":
                    this.selectionEnd = Math.max(this.selectionEnd - 1, 0);
                    if (!isShift) this.selectionStart = this.selectionEnd;
                    this.render();
                    break;
                case "Delete":
                    if (this.selectionStart != this.selectionEnd) {
                        this.deleteSelected();
                    } else {
                        if (this.selectionEnd < this.text.length) {
                            this.text = this.text.substring(0, this.selectionEnd) + this.text.substring(this.selectionEnd + 1);
                        }
                    }
                    this.generateCharacterStops();
                    this.render();
                    this.onChange(this.text);
                    break;
                case "Backspace":
                    if (this.selectionStart != this.selectionEnd) {
                        this.deleteSelected();
                    } else {
                        if (this.selectionEnd > 0) {
                            this.text = this.text.substring(0, this.selectionEnd - 1) + this.text.substring(this.selectionEnd);
                            this.selectionEnd--;
                            this.selectionStart = this.selectionEnd;
                        }
                    }
                    this.generateCharacterStops();
                    this.render();
                    this.onChange(this.text);
                    break;
                case "Insert":
                    break;
                case "Home":
                    this.selectionStart = 0;
                    this.selectionEnd = 0;
                    this.render();
                    break;
                case "End":
                    this.selectionStart = this.text.length;
                    this.selectionEnd = this.text.length;
                    this.render();
                    break;
                default:
                    console.log(key);
                    break;
            }
        }


    }

    scrollIfNecessary(): boolean {
        let x = this.getCursorXFromCharacterPos(this.selectionEnd);
        let hasScrolled: boolean = false;
        while (x < 0 && this.renderFromCharacterPosition > 0) {
            this.renderFromCharacterPosition--;
            x = this.getCursorXFromCharacterPos(this.selectionEnd);
            hasScrolled = true;
        }

        while (x > this.width - 2 * this.padding && this.renderFromCharacterPosition < this.text.length) {
            this.renderFromCharacterPosition++;
            x = this.getCursorXFromCharacterPos(this.selectionEnd);
            hasScrolled = true;
        }
        return hasScrolled;
    }

    getCursorXFromCharacterPos(pos: number) {
        return this.characterStops[pos] - this.characterStops[this.renderFromCharacterPosition]
    }


    gainKeyboardFocus(): void {
        for (let ikl of this.worldHelper.internalKeyboardListeners) {
            if (ikl != this) ikl.looseKeyboardFocus();
        }
        this.hasKeyboardFocus = true;
        this.keyboardFocusRect.visible = true;
        this.cursor.visible = true;
    }

    looseKeyboardFocus(): void {
        this.hasKeyboardFocus = false;
        this.keyboardFocusRect.visible = false;
        this.cursor.visible = false;
    }

    getCharacterPosition(x: number): number {
        if (this.characterCenterList.length == 0) return 0;
        for (let i = 0; i < this.characterCenterList.length; i++) {
            if (x <= this.characterCenterList[i] - this.characterStops[this.renderFromCharacterPosition]) return i;
        }

        return this.characterCenterList.length;
    }

}
