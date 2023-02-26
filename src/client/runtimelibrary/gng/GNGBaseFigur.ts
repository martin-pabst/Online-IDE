import { Module, ModuleStore } from "../../compiler/parser/Module.js";
import { Klass, Visibility } from "../../compiler/types/Class.js";
import { booleanPrimitiveType, doublePrimitiveType, intPrimitiveType, stringPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Attribute, Method, Parameterlist, Value } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import { RectangleHelper } from "../graphics/Rectangle.js";
import { FilledShapeHelper } from "../graphics/FilledShape.js";
import { GNGFarben } from "./GNGFarben.js";
import * as PIXI from 'pixi.js';
import { GNGHelper } from "./GNGConstants.js";

export class GNGBaseFigurClass extends Klass {

    constructor(module: Module, moduleStore: ModuleStore) {

        super("GNGBaseFigur", module, "Oberklasse der graphischen Elemente in der Graphics'n Games-Bibliothek (Cornelsen-Verlag)");

        let objectType = <Klass>moduleStore.getType("Object").type;
        this.setBaseClass(objectType);

        this.addAttribute(new Attribute("farbe", stringPrimitiveType, (value: Value) => { 
            let farbe = value.object.gngAttributes.colorString;
            value.value = farbe == null ? "schwarz" : farbe;
        }, false, Visibility.protected, false, "Farbe des Grafikobjekts"));

        this.addAttribute(new Attribute("x", intPrimitiveType, (value: Value) => { 
            value.value = Math.round(value.object.gngAttributes.moveAnchor.x); 
        }, false, Visibility.protected, false, "x-Position des Grafikobjekts"));
        this.addAttribute(new Attribute("y", intPrimitiveType, (value: Value) => { 
            value.value = Math.round(value.object.gngAttributes.moveAnchor.y); 
        }, false, Visibility.protected, false, "y-Position des Grafikobjekts"));

        this.addAttribute(new Attribute("winkel", intPrimitiveType, (value: Value) => { 
            value.value = value.object.intrinsicData["Actor"].angle 
        }, false, Visibility.protected, false, "Blickrichtung des Grafikobjekts in Grad"));

        this.addAttribute(new Attribute("größe", intPrimitiveType, (value: Value) => { 
            value.value = Math.round(value.object.gngAttributes.width); 
        }, false, Visibility.protected, false, "Größe des Grafikobjekts (100 entspricht 'normalgroß')"));

        this.addAttribute(new Attribute("sichtbar", booleanPrimitiveType, (value: Value) => { 
            value.value = value.object.intrinsicData["Actor"].displayObject?.visible 
        }, false, Visibility.protected, false, "true, wenn das Grafikobjekt sichtbar ist"));

        this.setupAttributeIndicesRecursive();

        this.addMethod(new Method("PositionSetzen", new Parameterlist([
            { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: FilledShapeHelper = o.intrinsicData["Actor"];
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;

                if (sh.testdestroyed("PositionSetzen")) return;

                o.gngAttributes.moveAnchor.x = x;
                o.gngAttributes.moveAnchor.y = y;
                (<GNGHelper><any>sh).renderGNG(o);

            }, false, false, "Verschiebt das Rechteck so, dass seine linke obere Ecke bei (x,y) zu liegen kommt.", false));


        this.addMethod(new Method("Verschieben", new Parameterlist([
            { identifier: "deltaX", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "deltaY", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: FilledShapeHelper = o.intrinsicData["Actor"];
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;

                if (sh.testdestroyed("Verschieben")) return;

                o.gngAttributes.moveAnchor.x += x;
                o.gngAttributes.moveAnchor.y += y;
                (<GNGHelper><any>sh).renderGNG(o);

            }, false, false, "Verschiebt die Figur um (x, y)", false));

        this.addMethod(new Method("Drehen", new Parameterlist([
            { identifier: "grad", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: FilledShapeHelper = o.intrinsicData["Actor"];
                let grad: number = parameters[1].value;

                if (sh.testdestroyed("Drehen")) return;
                sh.angle += grad;
                sh.directionRad += grad / 180 * Math.PI;
                (<GNGHelper><any>sh).renderGNG(o);

            }, false, false, "Dreht die Figur um den angegebenen Winkel. Drehpunkt ist der Diagonalenschnittpunkt der kleinsten achsenparallelen Bounding Box um die Figur.", false));


        this.addMethod(new Method("FarbeSetzen", new Parameterlist([
            { identifier: "farbe", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: FilledShapeHelper = o.intrinsicData["Actor"];
                let farbe: string = parameters[1].value;

                o.gngAttributes.colorString = farbe;

                let color: number = GNGFarben[farbe.toLocaleLowerCase()];
                if (color == null) color = 0x000000; // default: schwarz

                if (sh.testdestroyed("FarbeSetzen")) return;

                sh.setFillColor(color);
                sh.render();

            }, false, false, "Setzt die Farbe der Figur.", false));

        this.addMethod(new Method("WinkelSetzen", new Parameterlist([
            { identifier: "winkel", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: FilledShapeHelper = o.intrinsicData["Actor"];
                let grad: number = parameters[1].value;

                if (sh.testdestroyed("WinkelSetzen")) return;

                sh.angle = grad;
                sh.directionRad = grad / 180 * Math.PI;
                (<GNGHelper><any>sh).renderGNG(o);


            }, false, false, "Setzt den Drehwinkel der Figur. Der Winkel wird in Grad angegebenen, positive Werte bedeuten eine Drehung gegen den Uhrzeigersinn.", false));

        this.addMethod(new Method("SichtbarkeitSetzen", new Parameterlist([
            { identifier: "sichtbarkeit", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: FilledShapeHelper = o.intrinsicData["Actor"];
                let sichtbarkeit: boolean = parameters[1].value;

                if (sh.testdestroyed("SichtbarkeitSetzen")) return;

                sh.setVisible(sichtbarkeit);

            }, false, false, "Schaltet die Sichtbarkeit der Figur ein oder aus.", false));

        this.addMethod(new Method("Entfernen", new Parameterlist([]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: FilledShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("Entfernen")) return;

                sh.destroy();

            }, false, false, "Zerstört das Objekt.", false));

        this.addMethod(new Method("GanzNachVornBringen", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: FilledShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("GanzNachVornBringen")) return;

                return sh.bringToFront();

            }, false, false, 'Setzt das Grafikobjekt vor alle anderen.', false));

        this.addMethod(new Method("GanzNachHintenBringen", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: FilledShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("GanzNachHintenBringen")) return;

                return sh.sendToBack();

            }, false, false, 'Setzt das Grafikobjekt hinter alle anderen.', false));

        this.addMethod(new Method("NachVornBringen", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: FilledShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("NachVornBringen")) return;

                return sh.bringOnePlaneFurtherToFront();

            }, false, false, 'Setzt das Grafikobjekt eine Ebene nach vorne.', false));

        this.addMethod(new Method("NachHintenBringen", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: FilledShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("NachHintenBringen")) return;

                return sh.bringOnePlaneFurtherToBack();

            }, false, false, 'Setzt das Grafikobjekt eine Ebene nach hinten.', false));



    }

}
