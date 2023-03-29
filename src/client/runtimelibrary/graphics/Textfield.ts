import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { booleanPrimitiveType, doublePrimitiveType, stringPrimitiveType, voidPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { FilledShapeHelper } from "./FilledShape.js";
import { InternalKeyboardListener, InternalMouseListener, MouseEvent as JOMouseEvent } from "./World.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import * as PIXI from 'pixi.js';

export class TextFieldClass extends Klass {

    constructor(module: Module) {

        super("TextField", module, "Text, der innerhalb der Grafikausgabe dargestellt werden kann");

        this.setBaseClass(<Klass>module.typeStore.getType("FilledShape"));

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
            { identifier: "text", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
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

                let sh = new TextFieldHelper(x, y, width, fontsize, text, module.main.getInterpreter(), o, fontFamily);
                o.intrinsicData["Actor"] = sh;

            }, false, false, 'Instanziert ein neues Textobjekt. (x, y) sind die Koordinaten der linken oberen Ecke, fontsize die Höhe des Textes in Pixeln.', true));

        this.addMethod(new Method("setFontsize", new Parameterlist([
            { identifier: "fontsize", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let fontsize: number = parameters[1].value;
                let sh: TextFieldHelper = o.intrinsicData["Actor"];

                sh.setFontsize(fontsize);

            }, false, false, 'Setzt die Schriftgröße des Textes (Einheit: Pixel).', false));

        this.addMethod(new Method("setText", new Parameterlist([
            { identifier: "text", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let text: string = parameters[1].value;
                let sh: TextFieldHelper = o.intrinsicData["Actor"];

                sh.setText(text);

            }, false, false, 'Setzt den Text.', false));

        this.addMethod(new Method("copy", new Parameterlist([
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TextFieldHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("copy")) return;

                return sh.getCopy(<Klass>o.class);

            }, false, false, 'Erstellt eine Kopie des TextField-Objekts und git sie zurück.', false));

        this.addMethod(new Method("getWidth", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TextFieldHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getWidth")) return;

                return sh.getWidth();

            }, false, false, 'Gibt die Breite des Textes zurück.', false));

        this.addMethod(new Method("getHeight", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TextFieldHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getHeight")) return;

                return sh.getHeight();

            }, false, false, 'Gibt die Höhe des Textes zurück.', false));

        this.addMethod(new Method("getFontSize", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TextFieldHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getFontSize")) return;

                return sh.fontsize;

            }, false, false, 'Gibt die Schriftgröße zurück.', false));

            this.addMethod(new Method("getText", new Parameterlist([
            ]), stringPrimitiveType,
                (parameters) => {
    
                    let o: RuntimeObject = parameters[0].value;
                    let sh: TextFieldHelper = o.intrinsicData["Actor"];
    
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
                let sh: TextFieldHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setStyle")) return;

                sh.setStyle(isBold, isItalic);

                return;

            }, false, false, 'Gibt die Eigenschaften Fettdruck (bold) und Schrägschrift (italic) zurück.', false));
    

    }

}

export class TextFieldHelper extends FilledShapeHelper implements InternalMouseListener, InternalKeyboardListener {

    pixiText: PIXI.Text;
    backgroundGraphics: PIXI.Graphics;
    mask: PIXI.Graphics;
    keyboardFocusRect: PIXI.Graphics;
    cursor: PIXI.Graphics;
    selectionRectangle: PIXI.Graphics;

    textColor: number = 0x000000;
    padding: number = 8;

    hasKeyboardFocus: boolean = false;

    characterStops: number[] = [];
    characterCenterList: number[] = [];

    isSelecting: boolean = false;
    selectionStart: number = 0;
    selectionEnd: number = 0;

    renderFromCharacterPosition: number = 0;

    timerId: any;

    height: number = 0;

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

    constructor(public x: number, public y: number, public width: number, public fontsize: number,
        public text: string,
        interpreter: Interpreter, runtimeObject: RuntimeObject, public fontFamily?: string) {
        super(interpreter, runtimeObject);
        this.centerXInitial = x;
        this.centerYInitial = y;

        if (this.fontsize == 0) this.fontsize = 10;

        this.borderColor = 0x202020;
        this.borderWidth = 4;
        this.fillColor = 0xffffff;

        this.textStyle.stroke = 0x000000;
        this.textStyle.fontSize = fontsize;

        if (fontFamily != null) {
            this.textStyle.fontFamily = fontFamily;
        }

        this.hitPolygonInitial = [];

        this.generateCharacterStops();

        this.render();
        this.addToDefaultGroupAndSetDefaultVisibility();

        this.registerAsListener();


    }

    registerAsListener(){
        if(this.worldHelper.internalMouseListeners.indexOf(this) >= 0) return;
        this.worldHelper.internalMouseListeners.push(this);
        this.worldHelper.internalKeyboardListeners.push(this);

        let that = this;
        this.timerId = setInterval(() => {
            if(that.cursor != null && !that.cursor.destroyed && that.hasKeyboardFocus){
                that.cursor.visible = !that.cursor.visible;
            }
        }, 500);

    }

    unregisterAsListener(){
        let index = this.worldHelper.internalMouseListeners.indexOf(this);
        this.worldHelper.internalMouseListeners.splice(index, 1);
        let index1 = this.worldHelper.internalKeyboardListeners.indexOf(this);
        this.worldHelper.internalKeyboardListeners.splice(index1, 1);
        clearInterval(this.timerId);
    }

    setStyle(isBold: boolean, isItalic: boolean) {
        this.textStyle.fontWeight = isBold ? "bold" : "normal";
        this.textStyle.fontStyle = isItalic ? "italic" : "normal";
        this.render();
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

        this.textStyle.fill = this.textColor == null ? 0x000000 : this.textColor;
        this.textStyle.stroke = 0x000000;
        this.textStyle.strokeThickness = 0;
        this.textStyle.fontSize = this.fontsize;

        if (this.displayObject == null) {
            this.backgroundGraphics = new PIXI.Graphics();
            this.keyboardFocusRect = new PIXI.Graphics();
            this.cursor = new PIXI.Graphics();
            this.selectionRectangle = new PIXI.Graphics();

            this.mask = new PIXI.Graphics();

            this.pixiText = new PIXI.Text(this.text.substring(this.renderFromCharacterPosition), this.textStyle);

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
        } else {
            this.pixiText.text = this.text.substring(this.renderFromCharacterPosition);
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
            { x: left , y: top }, { x: left, y: top + this.height },
            { x: left + width, y: top + this.height }, { x: left + width, y: top }
        ];
        this.hitPolygonDirty = true;

        let rLeft = -this.padding;
        let rTop = -this.padding;

        this.mask.beginFill(0x0);
        this.makeRectangle(this.mask, 0, 0, this.width - 2*this.padding, this.height);
        this.mask.endFill();

        if (this.fillColor != null) {
            this.backgroundGraphics.beginFill(this.fillColor, this.fillAlpha);
        }
        if (this.borderColor != null) {
            this.backgroundGraphics.lineStyle(this.borderWidth, this.borderColor, this.borderAlpha, 0.5)
        }

        this.makeRectangle(this.backgroundGraphics, -this.padding, -this.padding, this.width, this.height + 2*this.padding);
        this.backgroundGraphics.closePath();

        if (this.fillColor != null) {
            this.backgroundGraphics.endFill();
        }

        if(this.isSelecting){
            this.selectionRectangle.beginFill(0x8080ff, 0.5);
            let xFrom = this.characterStops[this.selectionStart] - this.characterStops[this.renderFromCharacterPosition];
            let xTo = this.characterStops[this.selectionEnd] - this.characterStops[this.renderFromCharacterPosition];
            this.makeRectangle(this.selectionRectangle, xFrom, 0, xTo-xFrom, this.height);
            this.selectionRectangle.endFill();
        }

        this.renderCursor();

        this.keyboardFocusRect.lineStyle(this.borderWidth, 0xff0000, 1.0, 0.5);
        this.makeRectangle(this.keyboardFocusRect, -this.padding, -this.padding, this.width, this.height + 2*this.padding);
        this.keyboardFocusRect.closePath();

        this.keyboardFocusRect.visible = this.hasKeyboardFocus;

    }

    renderCursor(){
        this.cursor.clear();
        let cursorWidth = Math.min(2, this.fontsize/10);
        this.cursor.lineStyle(cursorWidth, 0x0, 1.0, 0.5);
        let cx = this.characterStops[this.selectionEnd] - this.characterStops[this.renderFromCharacterPosition];

        let start = new PIXI.Point(cx, 0);
        let end = new PIXI.Point(cx, this.height);

        this.cursor.moveTo(start.x, start.y).lineTo(end.x, end.y);
        this.cursor.visible = this.hasKeyboardFocus;        
    }
    
    makeRectangle(g: PIXI.Graphics, left: number, top: number, width: number, height: number){
        g.moveTo(left, top);
        g.lineTo(left + width, top);
        g.lineTo(left + width, top + height);
        g.lineTo(left, top + height);
        g.closePath();
    }

    getLocalCoordinates(x: number, y: number){
        let p = new PIXI.Point(x * this.worldHelper.globalScale, y * this.worldHelper.globalScale);
        this.displayObject.worldTransform.applyInverse(p, p);
        return p;
    }

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
        
        switch(kind){
            case "mousedown": {
                if(containsPointer){
                    this.gainKeyboardFocus();
                    this.startSelecting(x, y);
                } else {
                    this.looseKeyboardFocus();
                }
            }
            case "mouseup": {
                this.stopSelecting();
            }
            case "mouseleave": {
                this.stopSelecting();
            }
            case "mousemove": {

            }
        }


    }

    generateCharacterStops(){
        this.characterStops = [0];
        for(let i = 1; i <= this.text.length; i++){
            let subtext = this.text.substring(0, i);
            let tm = PIXI.TextMetrics.measureText(subtext, this.textStyle);
            this.characterStops.push(tm.width);
        }

        this.characterCenterList = [];
        for(let i = 0; i < this.characterStops.length - 1; i++){
            this.characterCenterList.push((this.characterStops[i] + this.characterStops[i+1])/2);
        }
    }

    startSelecting(x: number, y: number){
        this.isSelecting = true;
        let pos = this.getLocalCoordinates(x, y);
        this.selectionStart = this.getCharacterPosition(pos.x);
        this.selectionEnd = this.selectionStart;
        this.renderCursor();
    }

    stopSelecting(){
        this.isSelecting = false;
    }

    onKeyDown(key: string, isShift: boolean, isCtrl: boolean, isAlt: boolean): void {
        
        if(key.length == 1){
            if(this.isSelecting){
                this.text = this.text.substring(0, this.selectionStart) + this.text.substring(this.selectionEnd);
                this.selectionEnd = this.selectionStart;
                this.isSelecting = false;
            }
            this.text = this.text.substring(0, this.selectionEnd) + key + this.text.substring(this.selectionEnd);
            this.selectionEnd++;
            this.generateCharacterStops();
            this.scrollIfNecessary();
            this.render();
        } else {
            switch(key){
                case "ArrowRight":{
                    this.selectionEnd = Math.min(this.selectionEnd + 1, this.text.length);
                    this.isSelecting = isShift;
                    if(!this.isSelecting) this.selectionStart = this.selectionEnd;
                    this.scrollIfNecessary();
                    this.render();
                }
                break;
                case "ArrowLeft":{
                    this.selectionEnd = Math.max(this.selectionEnd - 1, 0);
                    this.isSelecting = isShift;
                    if(!this.isSelecting) this.selectionStart = this.selectionEnd;
                    this.scrollIfNecessary();
                    this.render();
                }
                break;
            }
        }
        
        
    }

    scrollIfNecessary(): boolean {
        let x = this.getCursorXFromCharacterPos(this.selectionEnd);
        let hasScrolled: boolean = false;
        while(x < 0 && this.renderFromCharacterPosition > 0){
            this.renderFromCharacterPosition--;
            x = this.getCursorXFromCharacterPos(this.selectionEnd);
            hasScrolled = true;
        }
        
        while(x > this.width - 2*this.padding && this.renderFromCharacterPosition < this.text.length){
            this.renderFromCharacterPosition++;
            x = this.getCursorXFromCharacterPos(this.selectionEnd);
            hasScrolled = true;
        }        
        return hasScrolled;
    }

    getCursorXFromCharacterPos(pos: number){
        return this.characterStops[pos] - this.characterStops[this.renderFromCharacterPosition]
    }


    gainKeyboardFocus(): void {
        for(let ikl of this.worldHelper.internalKeyboardListeners){
            if(ikl != this) ikl.looseKeyboardFocus();
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

    destroy(): void {
        this.unregisterAsListener();
        super.destroy();    
    }

    setVisible(visible: boolean) {
        super.setVisible(visible);
        if(visible){
            this.registerAsListener();
        } else {
            this.unregisterAsListener();
        }
    }

    getCharacterPosition(x: number): number {
        if(this.characterCenterList.length == 0) return 0;
        for(let i = 0; i < this.characterCenterList.length; i++){
            if(x <= this.characterCenterList[i] - this.characterStops[this.renderFromCharacterPosition] ) return i;
        }

        return this.characterCenterList.length;
    }


}
