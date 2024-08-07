import * as PIXI from 'pixi.js';
import { Module } from "../../../compiler/parser/Module.js";
import { Klass } from "../../../compiler/types/Class.js";
import { doublePrimitiveType, stringPrimitiveType } from "../../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../../compiler/types/Types.js";
import { Interpreter } from "../../../interpreter/Interpreter.js";
import { RuntimeObject } from "../../../interpreter/RuntimeObject.js";
import { lightenDarkenIntColor } from "../../../../tools/HtmlTools.js";
import { MouseEvent as JOMouseEvent } from "../World.js";
import { GuiTextComponentHelper } from './GuiTextComponent.js';

export class ButtonClass extends Klass {

    constructor(module: Module) {

        super("Button", module, "Button, der innerhalb der Grafikausgabe dargestellt werden kann");

        this.setBaseClass(<Klass>module.typeStore.getType("GuiTextComponent"));

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

        this.addMethod(new Method("copy", new Parameterlist([
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ButtonHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("copy")) return;

                return sh.getCopy(<Klass>o.class);

            }, false, false, 'Erstellt eine Kopie des Button-Objekts und git sie zurück.', false));
    }

}

export class ButtonHelper extends GuiTextComponentHelper {

    
    backgroundGraphics: PIXI.Graphics;
    higlightGraphics: PIXI.Graphics;

    mouseIsDown: boolean = false;

    isMouseOver: boolean = false;

    constructor(public x: number, public y: number, public fontsize: number,
        public text: string,
        interpreter: Interpreter, runtimeObject: RuntimeObject, public fontFamily?: string) {
            
        super(interpreter, runtimeObject, true, false, fontsize, text, fontFamily);
        
        this.centerXInitial = x;
        this.centerYInitial = y;

        
        this.borderColor = 0x808080;
        this.borderWidth = fontsize / 8;
        this.fillColor = 0x0000ff;
        
        this.hitPolygonInitial = [];
        
        this.render();
        
        this.addToDefaultGroupAndSetDefaultVisibility();
        
    }
    
    onKeyDown(key: string, isShift: boolean, isCtrl: boolean, isAlt: boolean): void {}

    looseKeyboardFocus(): void {}

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

        this.textCompomentPrerender();

        let padding = this.fontsize / 5;

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

            this.centerXInitial = this.textWidth / 2 + padding;
            this.centerYInitial = this.textHeight / 2 + padding;
        }

        let left = 0;
        let top = 0;
        this.width = this.textWidth + 2 * padding;
        this.height = this.textHeight + 2 * padding;

        this.hitPolygonInitial = [
            { x: left, y: top }, { x: left + this.width, y: top }, { x: left + this.width, y: top + this.height },
            { x: left, y: top + this.height }
        ];
        this.hitPolygonDirty = true;

        if (this.fillColor != null) {
            this.backgroundGraphics.beginFill(this.fillColor, this.fillAlpha);
        }
        if (this.borderColor != null) {
            this.backgroundGraphics.lineStyle(this.borderWidth, this.borderColor, this.borderAlpha, 1.0)
        }

        this.backgroundGraphics.drawRoundedRect(0, 0, this.width, this.height, this.height / 8);

        if (this.fillColor != null) {
            this.backgroundGraphics.endFill();
        }

        let highlightWidth = this.height / 10 + this.borderWidth;
        this.higlightGraphics.beginFill(lightenDarkenIntColor(this.fillColor, 0.4), 1.0);
        this.higlightGraphics.drawRoundedRect(-highlightWidth, -highlightWidth, this.width + 2 * highlightWidth, this.height + 2 * highlightWidth, this.height / 4);
        if (this.fillColor != null) {
            this.higlightGraphics.endFill();
        }

        this.higlightGraphics.visible = this.mouseIsDown;
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
                    this.onChange("clicked");
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
