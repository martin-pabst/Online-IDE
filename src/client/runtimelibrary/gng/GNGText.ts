import { Module, ModuleStore } from "../../compiler/parser/Module.js";
import { Klass, Visibility } from "../../compiler/types/Class.js";
import { intPrimitiveType, stringPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Attribute, Method, Parameterlist, Value } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { CircleHelper } from "../graphics/Circle.js";
import { ShapeHelper } from "../graphics/Shape.js";
import { TextHelper } from "../graphics/Text.js";
import { GNGHelper } from "./GNGConstants.js";

export class GNGTextClass extends Klass {

    constructor(module: Module, moduleStore: ModuleStore) {

        super("GText", module, "Text-Klasse der Graphics'n Games-Bibliothek (Cornelsen-Verlag)");

        this.setBaseClass(<Klass>module.typeStore.getType("GNGBaseFigur"));

        this.addAttribute(new Attribute("text", stringPrimitiveType, (value: Value) => {
            value.value = (<GNGTextHelper>value.object.intrinsicData["Actor"]).text;
        }, false, Visibility.private, false, "Angezeigter Text"));

        this.addAttribute(new Attribute("textgröße", intPrimitiveType, (value: Value) => {
            value.value = (<GNGTextHelper>value.object.intrinsicData["Actor"]).fontsize;
        }, false, Visibility.private, false, "Textgröße"));

        this.setupAttributeIndicesRecursive();

        this.addMethod(new Method("Text", new Parameterlist([]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                o.intrinsicData["isGNG"] = true;

                let rh = new GNGTextHelper(10, -3, 12, "Text", module.main.getInterpreter(), o);

                o.gngAttributes = {
                    moveAnchor: { x: 10, y: 10 },
                    width: 100,
                    height: 100,
                    colorString: "schwarz"
                }

                rh.centerXInitial = 60;
                rh.centerYInitial = 60;

                rh.setFillColor(0);
                o.intrinsicData["Actor"] = rh;

            }, false, false, 'Instanziert ein neues Text-Objekt.', true));

        this.addMethod(new Method("TextSetzen", new Parameterlist([
            { identifier: "text", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: GNGTextHelper = o.intrinsicData["Actor"];
                let text: string = parameters[1].value;

                if (sh.testdestroyed("TextSetzen")) return;

                sh.text = text;
                sh.renderGNG(o);

            }, false, false, "Ändert den Text des Text-Objekts.", false));

        this.addMethod(new Method("getText", new Parameterlist([
        ]), stringPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: GNGTextHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getText")) return;

                return sh.text;

            }, false, false, 'Gibt den Textinhalt zurück.', false));



        this.addMethod(new Method("TextGrößeSetzen", new Parameterlist([
            { identifier: "textGröße", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: GNGTextHelper = o.intrinsicData["Actor"];
                let größe: number = parameters[1].value;

                sh.fontsize = größe;
                sh.renderGNG(o);

            }, false, false, "Setzt die Schriftgröße des Text-Objekts.", false));

        this.addMethod(new Method("TextVergrößern", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: GNGTextHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("TextVergrößern")) return;

                let size = sh.fontsize;
                if (size <= 10) {
                    size += 1;
                }
                else if (size <= 40) {
                    size += 2;
                }
                else {
                    size += 4;
                }

                sh.fontsize = size;
                sh.renderGNG(o);

            }, false, false, "Vergrößert die Schriftgröße des Text-Objekts.", false));

        this.addMethod(new Method("TextVerkleinern", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: GNGTextHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("TextVerkleinern")) return;

                let size = sh.fontsize;
                if (size <= 10) {
                    size -= 1;
                }
                else if (size <= 40) {
                    size -= 2;
                }
                else {
                    size -= 4;
                }
                if (size < 1) {
                    size = 1;
                }

                sh.fontsize = size;
                sh.renderGNG(o);

            }, false, false, "Verkleinert die Schriftgröße des Text-Objekts.", false));



    }

}

class GNGTextHelper extends TextHelper implements GNGHelper {
    renderGNG(ro: RuntimeObject): void {
        let att = ro.gngAttributes;

        this.x = att.moveAnchor.x;
        this.y = att.moveAnchor.y - this.fontsize;

        this.render();

        // after this.render() is executed this.centerXInitial is textHeight/2 and this.centerYInitial is textWidth/2

        let rotationCenterX = this.x + this.centerXInitial;
        let rotationCenterY = this.y + this.centerYInitial;

        this.displayObject.localTransform.identity();
        // top-left edge of text now is at (0/0)
        this.displayObject.localTransform.translate(-this.centerXInitial, -this.centerYInitial);
        this.displayObject.localTransform.rotate(-this.angle / 180 * Math.PI);
        this.displayObject.localTransform.translate(rotationCenterX, rotationCenterY);
        //@ts-ignore
        this.displayObject.transform.onChange();
        this.displayObject.updateTransform();
        this.setHitPolygonDirty(true);
    }

}