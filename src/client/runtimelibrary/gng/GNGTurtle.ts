import { Module, ModuleStore } from "../../compiler/parser/Module.js";
import { Klass, Visibility } from "../../compiler/types/Class.js";
import { booleanPrimitiveType, charPrimitiveType, doublePrimitiveType, intPrimitiveType, stringPrimitiveType, voidPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Attribute, Method, Parameterlist, Value } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import { RectangleHelper } from "../graphics/Rectangle.js";
import { TurtleHelper } from "../graphics/Turtle.js";
import { FilledShapeHelper } from "../graphics/FilledShape.js";
import { ShapeHelper } from "../graphics/Shape.js";
import { GNGFarben } from "./GNGFarben.js";
import { GNGEreignisbehandlung, GNGEreignisbehandlungHelper } from "./GNGEreignisbehandlung.js";

export class GNGTurtleClass extends Klass {

    constructor(module: Module, moduleStore: ModuleStore) {

       super("GTurtle", module, "Turtle-Klasse der Graphics'n Games-Bibliothek (Cornelsen-Verlag)");

        let objectType = <Klass>moduleStore.getType("Object").type;

        this.baseClass = objectType;

        this.addAttribute(new Attribute("x", intPrimitiveType, (value: Value) => { 
            let sh = value.object.intrinsicData["Actor"];
            value.value = Math.round(sh.lineElements[sh.lineElements.length - 1].x); 
        }, false, Visibility.protected, false, "x-Position der Figur"));
        this.addAttribute(new Attribute("y", intPrimitiveType, (value: Value) => { 
            let sh = value.object.intrinsicData["Actor"];
            value.value = Math.round(sh.lineElements[sh.lineElements.length - 1].y); 
        }, false, Visibility.protected, false, "x-Position der Figur"));

        this.addAttribute(new Attribute("winkel", intPrimitiveType, (value: Value) => { 
            value.value = - value.object.intrinsicData["Actor"].turtleAngleDeg 
        }, false, Visibility.protected, false, "Blickrichtung der Figur in Grad"));

        this.addAttribute(new Attribute("größe", intPrimitiveType, (value: Value) => { 
            value.value = Math.round(value.object.intrinsicData["Actor"].scaleFactor*100) 
        }, false, Visibility.protected, false, "Größe der Figur (100 entspricht 'normalgroß')"));

        this.addAttribute(new Attribute("sichtbar", booleanPrimitiveType, (value: Value) => { 
            value.value = value.object.intrinsicData["Actor"].displayObject?.visible 
        }, false, Visibility.protected, false, "true, wenn die Figur sichtbar ist"));

        this.addAttribute(new Attribute("stiftUnten", booleanPrimitiveType, (value: Value) => { 
            value.value = value.object.intrinsicData["Actor"].penIsDown; 
        }, false, Visibility.protected, false, "true, wenn die Turtle beim Gehen zeichnet"));

        this.setupAttributeIndicesRecursive();

        this.addMethod(new Method("GTurtle", new Parameterlist([]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                o.intrinsicData["isGNG"] = true;

                let rh = new TurtleHelper(100, 200, true, module.main.getInterpreter(), o);
                rh.borderWidth = 1;
                rh.setShowTurtle(true);
                rh.setBorderColor(0);
                o.intrinsicData["Actor"] = rh;

                o.intrinsicData["moveAnchor"] = {x: 10, y: 10};

                let helper: GNGEreignisbehandlungHelper = GNGEreignisbehandlung.getHelper(module);
                helper.registerEvents(o);

            }, false, false, 'Instanziert ein neues Turtle-Objekt.', true));

        this.addMethod(new Method("GrößeSetzen", new Parameterlist([
            { identifier: "größe", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TurtleHelper = o.intrinsicData["Actor"];
                let größe: number = parameters[1].value;

                if (sh.testdestroyed("größeSetzen")) return;
                sh.turtleSize = größe;
                sh.borderWidth = größe/100;
                sh.moveTurtleTo(0,0, 0);
                sh.initTurtle(0, 0, sh.angle);
                sh.moveTurtleTo(sh.lineElements[sh.lineElements.length - 1].x, sh.lineElements[sh.lineElements.length - 1].y, sh.angle)
                sh.turn(0);

            }, false, false, "Setzt die Größe des Turtle-Dreiecks.", false));

        this.addMethod(new Method("FarbeSetzen", new Parameterlist([
            { identifier: "farbe", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TurtleHelper = o.intrinsicData["Actor"];
                let farbe: string = parameters[1].value;

                let color: number = GNGFarben[farbe.toLocaleLowerCase()];
                if (color == null) color = 0x000000; // default: schwarz

                if (sh.testdestroyed("FarbeSetzen")) return;

                sh.setBorderColor(color);
                sh.render();

            }, false, false, "Setzt die Zeichenfarbe der Turtle.", false));


        this.addMethod(new Method("Drehen", new Parameterlist([
            { identifier: "grad", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TurtleHelper = o.intrinsicData["Actor"];
                let grad: number = parameters[1].value;

                if (sh.testdestroyed("Drehen")) return;

                sh.turn(grad);

            }, false, false, "Dreht die Turtle um den angegebenen Winkel. Positiver Winkel bedeutet Drehung gegen den Uhrzeigersinn.", false));

        this.addMethod(new Method("Gehen", new Parameterlist([
            { identifier: "länge", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TurtleHelper = o.intrinsicData["Actor"];
                let länge: number = parameters[1].value;

                if (sh.testdestroyed("Gehen")) return;

                sh.forward(länge);

            }, false, false, "Bewirkt, dass die Turtle um die angegebene Länge nach vorwärts geht.", false));

        this.addMethod(new Method("StiftHeben", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TurtleHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("StiftHeben")) return;

                sh.penIsDown = false;

            }, false, false, "Bewirkt, dass die Turtle beim Gehen ab jetzt nicht mehr zeichnet.", false));

        this.addMethod(new Method("StiftSenken", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TurtleHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("StiftSenken")) return;

                sh.penIsDown = true;

            }, false, false, "Bewirkt, dass die Turtle beim Gehen ab jetzt wieder zeichnet.", false));

        this.addMethod(new Method("Löschen", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TurtleHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("Löschen")) return;

                sh.clear(100, 200, 0);

            }, false, false, "Löscht alles von der Turtle gezeichnete und versetzt die Turtle in den Ausgangszustand.", false));

        this.addMethod(new Method("PositionSetzen", new Parameterlist([
            { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TurtleHelper = o.intrinsicData["Actor"];
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;

                if (sh.testdestroyed("PositionSetzen")) return;

                sh.moveTo(x, y);

            }, false, false, "Verschiebt die Turtle an die Position (x, y) ohne eine neue Linie zu zeichnen.", false));

        this.addMethod(new Method("ZumStartpunktGehen", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TurtleHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("ZumStartpunktGehen")) return;

                sh.moveTo(100, 200);

            }, false, false, "Verschiebt die Turtle an die Position (100, 200) ohne eine neue Linie zu zeichnen.", false));

        this.addMethod(new Method("WinkelSetzen", new Parameterlist([
            { identifier: "winkel", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TurtleHelper = o.intrinsicData["Actor"];
                let winkel: number = parameters[1].value;

                if (sh.testdestroyed("WinkelSetzen")) return;

                sh.turn(winkel + sh.turtleAngleDeg);

            }, false, false, "Setzt den Blickwinkel der Turtle. 0° => nach rechts, 90°: => nach oben, usw..", false));

        this.addMethod(new Method("WinkelGeben", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TurtleHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("WinkelGeben")) return;

                return Math.round(-sh.turtleAngleDeg);

            }, false, false, "Gibt den Blickwinkel der Turtle zurück.", false));

        this.addMethod(new Method("XPositionGeben", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TurtleHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("XPositionGeben")) return;

                return Math.round(sh.lineElements[sh.lineElements.length - 1].x);

            }, false, false, "Gibt x-Position der Turtle zurück.", false));

        this.addMethod(new Method("YPositionGeben", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TurtleHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("YPositionGeben")) return;

                return Math.round(sh.lineElements[sh.lineElements.length - 1].y);

            }, false, false, "Gibt y-Position der Turtle zurück.", false));

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

            }, false, false, "Schaltet die Sichtbarkeit der Figur ein oder aus.", false));

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

        this.addMethod(new Method("Berührt", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TurtleHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("Berührt")) return;

                return sh.touchesAtLeastOneFigure();

            }, false, false, 'Gibt genau dann true zurück, wenn sich an der aktuellen Position der Turtle mindestens eine andere Figur befindet.', false));

        this.addMethod(new Method("Berührt", new Parameterlist([
            { identifier: "farbe", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let farbeString: string = parameters[1].value;
                let sh: TurtleHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("Berührt")) return;

                let farbe = GNGFarben[farbeString];
                if (farbe == null) farbe = 0;

                return sh.touchesColor(farbe);

            }, false, false, 'Gibt genau dann true zurück, wenn sich an der aktuellen Position der Turtle mindestens eine andere Figur mit der angegebenen Farbe befindet.', false));

        this.addMethod(new Method("Berührt", new Parameterlist([
            { identifier: "objekt", type: objectType, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let object: RuntimeObject = parameters[1].value;
                let sh: TurtleHelper = o.intrinsicData["Actor"];
                let objectShapeHelper = object.intrinsicData["Actor"];

                if (objectShapeHelper == null || !(objectShapeHelper instanceof ShapeHelper)) return false;

                if (sh.testdestroyed("Berührt")) return;

                return sh.touchesShape(objectShapeHelper);

            }, false, false, 'Gibt genau dann true zurück, wenn die übergebene Figur die aktuelle Turtleposition enthält.', false));



        this.addMethod(new Method("AktionAusführen", new Parameterlist([]), voidPrimitiveType,
            null,  // no implementation!
            false, false, "Diese Methode wird vom Taktgeber aufgerufen."));

        this.addMethod(new Method("TasteGedrückt", new Parameterlist([
            { identifier: "taste", type: charPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
            null,  // no implementation!
            false, false, "Wird aufgerufen, wenn eine Taste gedrückt wird."));

        this.addMethod(new Method("SonderTasteGedrückt", new Parameterlist([
            { identifier: "taste", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
            null,  // no implementation!
            false, false, "Wird aufgerufen, wenn eine Sondertaste gedrückt wird."));

        this.addMethod(new Method("MausGeklickt", new Parameterlist([
            { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "anzahl", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            null,  // no implementation!
            false, false, "Wird aufgerufen, wenn eine die linke Maustaste gedrückt wird."));



    }





}

