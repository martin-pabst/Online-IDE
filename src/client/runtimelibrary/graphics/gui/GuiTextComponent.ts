import * as PIXI from 'pixi.js';
import { Module } from "../../../compiler/parser/Module.js";
import { Klass } from "../../../compiler/types/Class.js";
import { booleanPrimitiveType, doublePrimitiveType, intPrimitiveType, stringPrimitiveType, voidPrimitiveType } from "../../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../../compiler/types/Types.js";
import { Interpreter } from "../../../interpreter/Interpreter.js";
import { RuntimeObject } from "../../../interpreter/RuntimeObject.js";
import { lightenDarkenIntColor } from "../../../../tools/HtmlTools.js";
import { FilledShapeHelper } from "../FilledShape.js";
import { InternalMouseListener, MouseEvent as JOMouseEvent } from "../World.js";
import { GuiComponentHelper } from './GuiComponent.js';

export class GuiTextComponentClass extends Klass {

    constructor(module: Module) {

        super("GuiTextComponent", module, "Abstrakte Oberklasse für alle Gui-Komponenten mit Textanteil");

        this.setBaseClass(<Klass>module.typeStore.getType("GuiComponent"));

        this.addMethod(new Method("setFontsize", new Parameterlist([
            { identifier: "fontsize", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let fontsize: number = parameters[1].value;
                let sh: GuiTextComponentHelper = o.intrinsicData["Actor"];

                sh.setFontsize(fontsize);

            }, false, false, 'Setzt die Schriftgröße des Textes (Einheit: Pixel).', false));

        this.addMethod(new Method("setText", new Parameterlist([
            { identifier: "text", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let text: string = parameters[1].value;
                let sh: GuiTextComponentHelper = o.intrinsicData["Actor"];

                sh.setText(text);

            }, false, false, 'Setzt den Text.', false));

        this.addMethod(new Method("getFontSize", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: GuiTextComponentHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getFontSize")) return;

                return sh.fontsize;

            }, false, false, 'Gibt die Schriftgröße zurück.', false));

        this.addMethod(new Method("getText", new Parameterlist([
        ]), stringPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: GuiTextComponentHelper = o.intrinsicData["Actor"];

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
                let sh: GuiTextComponentHelper = o.intrinsicData["Actor"];

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
                let sh: GuiTextComponentHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setTextColor")) return;

                sh.setTextColor(color);

            }, false, false, 'Setzt die Textfarbe. Die Farbe wird als int-Wert gegeben, wobei farbe == 256*256*rot + 256*grün + blau', false));

    }

}

export abstract class GuiTextComponentHelper extends GuiComponentHelper {

    pixiText: PIXI.Text;

    textColor: number = 0xffffff;

    textHeight: number = 10;
    textWidth: number = 10;

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

    constructor(interpreter: Interpreter, runtimeObject: RuntimeObject,
        registerAsMouseListener: boolean, registerAsKeyboardListener: boolean,
        public fontsize: number, public text: string, public fontFamily?: string) {

        super(interpreter, runtimeObject, registerAsMouseListener, registerAsKeyboardListener);

        if (this.fontsize == 0) this.fontsize = 10;

        this.textStyle.stroke = 0x000000;
        this.textStyle.fontSize = fontsize;

        if (fontFamily != null) {
            this.textStyle.fontFamily = fontFamily;
        }

    }

    setStyle(isBold: boolean, isItalic: boolean) {
        this.textStyle.fontWeight = isBold ? "bold" : "normal";
        this.textStyle.fontStyle = isItalic ? "italic" : "normal";
        this.render();
    }

    textCompomentPrerender(): void {
        this.textStyle.fill = this.textColor == null ? 0x000000 : this.textColor;
        this.textStyle.stroke = 0x000000;
        this.textStyle.strokeThickness = 0;
        this.textStyle.fontSize = this.fontsize;

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

    setTextColor(color: number) {
        this.textColor = color;
        this.render();
    }

}
