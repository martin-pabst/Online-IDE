import { Module, ModuleStore, TypeStore } from "../../compiler/parser/Module.js";
import { Klass, Visibility } from "../../compiler/types/Class.js";
import { booleanPrimitiveType, charPrimitiveType, doublePrimitiveType, intPrimitiveType, stringPrimitiveType, voidPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Attribute, Method, Parameterlist, Value } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import { RectangleHelper } from "../graphics/Rectangle.js";
import { FilledShapeHelper } from "../graphics/FilledShape.js";
import { ShapeHelper } from "../graphics/Shape.js";
import { GroupHelper } from "../graphics/Group.js";
import { GNGFarben } from "./GNGFarben.js";
import { PolygonHelper } from "../graphics/Polygon.js";
import { CircleHelper } from "../graphics/Circle.js";
import { EllipseHelper } from "../graphics/Ellipse.js";
import { GNGEreignisbehandlung, GNGEreignisbehandlungHelper } from "./GNGEreignisbehandlung.js";

type GNGPoint = {
    x: number,
    y: number
}

export class GNGFigurClass extends Klass {

    constructor(module: Module, moduleStore: ModuleStore) {

        let objectType = <Klass>moduleStore.getType("Object").type;

        super("Figur", module, "Figur-Klasse der Graphics'n Games-Bibliothek (Cornelsen-Verlag)");

        this.setBaseClass(objectType);

        let polygonClass: Klass = <Klass>moduleStore.getType("Polygon").type;
        let circleClass: Klass = <Klass>moduleStore.getType("Circle").type;
        let ellipseClass: Klass = <Klass>moduleStore.getType("Ellipse").type;
        let rectangleClass: Klass = <Klass>moduleStore.getType("Rectangle").type;

        this.addAttribute(new Attribute("x", intPrimitiveType, (value: Value) => { value.value = Math.round(value.object.intrinsicData["Center"].x) }, false, Visibility.private, false, "x-Position der Figur"));
        this.addAttribute(new Attribute("y", intPrimitiveType, (value: Value) => { value.value = Math.round(value.object.intrinsicData["Center"].y) }, false, Visibility.private, false, "y-Position der Figur"));
        this.addAttribute(new Attribute("winkel", intPrimitiveType, (value: Value) => { 
            value.value = value.object.intrinsicData["Actor"].angle 
        }, false, Visibility.private, false, "Blickrichtung der Figur in Grad"));

        this.addAttribute(new Attribute("größe", intPrimitiveType, (value: Value) => { 
            value.value = Math.round(value.object.intrinsicData["Actor"].scaleFactor*100) 
        }, false, Visibility.private, false, "Größe der Figur (100 entspricht 'normalgroß')"));

        this.addAttribute(new Attribute("sichtbar", booleanPrimitiveType, (value: Value) => { 
            value.value = value.object.intrinsicData["Actor"].displayObject?.visible 
        }, false, Visibility.private, false, "true, wenn die Figur sichtbar ist"));

        this.setupAttributeIndicesRecursive();

        this.addMethod(new Method("Figur", new Parameterlist([]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                o.intrinsicData["isGNG"] = true;

                let interpreter = module.main.getInterpreter();
                let helper: GNGEreignisbehandlungHelper = GNGEreignisbehandlung.getHelper(module);
                let rh = new FigurHelper(interpreter, o, helper);
                o.intrinsicData["Actor"] = rh;

                let center: GNGPoint = {
                    x: 100,
                    y: 200
                };

                o.intrinsicData["Center"] = center;

                this.drawInitialTriangle(rh, polygonClass, circleClass, interpreter, center);
                o.intrinsicData["isInitialTriangle"] = true;

                rh.scale(0.4, center.x, center.y);
                rh.displayObject.updateTransform(); 

                helper.registerEvents(o);


            }, false, false, 'Instanziert ein neues Figur-Objekt.', true));

        this.addMethod(new Method("GrößeSetzen", new Parameterlist([
            { identifier: "größe", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: GroupHelper = o.intrinsicData["Actor"];
                let groesse: number = parameters[1].value;

                if (sh.testdestroyed("GrößeSetzen")) return;

                let center: GNGPoint = o.intrinsicData["Center"];
                let newFactor = groesse / 100;
                sh.scale(newFactor / sh.scaleFactor, center.x, center.y);
                sh.displayObject.updateTransform();

            }, false, false, "Setzt die Größe der Figur.", false));


        this.addMethod(new Method("Drehen", new Parameterlist([
            { identifier: "grad", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: GroupHelper = o.intrinsicData["Actor"];
                let grad: number = parameters[1].value;

                if (sh.testdestroyed("Drehen")) return;
                let center: GNGPoint = o.intrinsicData["Center"];

                sh.rotate(grad, center.x, center.y);
                sh.displayObject.updateTransform();

            }, false, false, "Dreht die Figur um den angegebenen Winkel. Positiver Winkel bedeutet Drehung gegen den Uhrzeigersinn.", false));

        this.addMethod(new Method("Gehen", new Parameterlist([
            { identifier: "länge", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: GroupHelper = o.intrinsicData["Actor"];
                let länge: number = parameters[1].value;

                if (sh.testdestroyed("Gehen")) return;
                let center: GNGPoint = o.intrinsicData["Center"];

                let angleRad = sh.angle / 180 * Math.PI;
                let dx = länge * Math.cos(angleRad);
                let dy = länge * Math.sin(-angleRad);
                center.x += dx;
                center.y += dy;                

                sh.move(dx, dy);
                sh.displayObject.updateTransform();

            }, false, false, "Bewirkt, dass die Figur um die angegebene Länge 'nach vorne' geht.", false));

        this.addMethod(new Method("PositionSetzen", new Parameterlist([
            { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: GroupHelper = o.intrinsicData["Actor"];
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;

                if (sh.testdestroyed("PositionSetzen")) return;
                let center: GNGPoint = o.intrinsicData["Center"];

                sh.move(x - center.x, y - center.y);
                sh.displayObject.updateTransform();
                center.x = x;
                center.y = y;

            }, false, false, "Verschiebt die Figur an die Position (x, y).", false));

        this.addMethod(new Method("ZumStartpunktGehen", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: GroupHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("ZumStartpunktGehen")) return;

                let center: GNGPoint = o.intrinsicData["Center"];

                sh.move(100 - center.x, 200 - center.y);
                sh.displayObject.updateTransform();
                center.x = 100;
                center.y = 200;

            }, false, false, "Verschiebt die Figur an die Position (100, 200).", false));

        this.addMethod(new Method("WinkelSetzen", new Parameterlist([
            { identifier: "winkel", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: GroupHelper = o.intrinsicData["Actor"];
                let winkel: number = parameters[1].value;

                if (sh.testdestroyed("WinkelSetzen")) return;

                sh.rotate(winkel - sh.angle);
                sh.displayObject.updateTransform();

            }, false, false, "Dreht die Figur so, dass der Blickwinkel der Figur in die angegebene Richtung zeigt. 0° => nach rechts (initial), 90°: => nach oben, usw..", false));

        this.addMethod(new Method("WinkelGeben", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: GroupHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("WinkelGeben")) return;

                if(sh.angle < 0) sh.angle += 360*Math.ceil(sh.angle/(-360));
                if(sh.angle >= 360) sh.angle -= 360*Math.floor(sh.angle/360);
                return Math.round(sh.angle);

            }, false, false, "Gibt den Blickwinkel der Figur zurück.", false));

        this.addMethod(new Method("XPositionGeben", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: GroupHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("XPositionGeben")) return;

                let center: GNGPoint = o.intrinsicData["Center"];
                return center.x;

            }, false, false, "Gibt x-Position der Figur zurück.", false));

        this.addMethod(new Method("YPositionGeben", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: GroupHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("YPositionGeben")) return;

                let center: GNGPoint = o.intrinsicData["Center"];
                return center.y;

            }, false, false, "Gibt y-Position der Figur zurück.", false));

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
                let sh: FigurHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("Entfernen")) return;

                sh.destroy();

            }, false, false, "Entfernt die Figur aus dem Zeichenfenster", false));

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

        this.addMethod(new Method("EigeneFigurLöschen", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: GroupHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("EigeneFigurLöschen")) return;

                sh.destroyChildren();
                let center: GNGPoint = o.intrinsicData["Center"];

                this.drawInitialTriangle(sh, polygonClass, circleClass, this.module.main.getInterpreter(), center);
                o.intrinsicData["isInitialTriangle"] = true;


            }, false, false, 'Löscht die hinzugefügten Figuren', false));

        this.addMethod(new Method("Berührt", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: GroupHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("Berührt")) return;

                for (let shape of sh.worldHelper.shapes) {
                    if (shape != sh &&  sh.collidesWith(shape)) return true;
                }

                return false;

            }, false, false, 'Gibt genau dann true zurück, wenn die Figur mit einem graphischen Objekt kollidiert.', false));
    

        this.addMethod(new Method("Berührt", new Parameterlist([
            { identifier: "farbe", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let farbeString: string = parameters[1].value;
                let sh: GroupHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("Berührt")) return;

                let farbe = GNGFarben[farbeString];
                if (farbe == null) farbe = 0;

                for (let shape of sh.worldHelper.shapes) {
                    if (shape != sh) {
                        if(shape instanceof FigurHelper){
                            for(let part of shape.shapes){
                                let partHelper = part.intrinsicData["Actor"];
                                if (partHelper instanceof FilledShapeHelper && farbe == partHelper.fillColor){
                                    if(sh.collidesWith(partHelper)){
                                        return true;
                                    }
                                }
                            }
                        } else {

                            if(shape instanceof FilledShapeHelper && farbe == shape.fillColor){
                                if (sh.collidesWith(shape)) return true;
                            }
                        }

                    }
                }

                return false;

            }, false, false, 'Gibt genau dann true zurück, wenn die Figur mit einem graphischen Objekt der angegebenen Farbe kollidiert.', false));

        this.addMethod(new Method("Berührt", new Parameterlist([
            { identifier: "objekt", type: objectType, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let object: RuntimeObject = parameters[1].value;
                let sh: GroupHelper = o.intrinsicData["Actor"];
                let objectShapeHelper = object.intrinsicData["Actor"];

                if (objectShapeHelper == null || !(objectShapeHelper instanceof ShapeHelper)) return false;

                if (sh.testdestroyed("Berührt")) return;

                return sh.collidesWith(objectShapeHelper);

            }, false, false, 'Gibt genau dann true zurück, wenn die Figur mit dem übergebenen graphischen Objekt kollidiert.', false));

        this.addMethod(new Method("FigurteilFestlegenDreieck", new Parameterlist([
            { identifier: "x1", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y1", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "x2", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y2", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "x3", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y3", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "farbe", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x1: number = parameters[1].value;
                let y1: number = parameters[2].value;
                let x2: number = parameters[3].value;
                let y2: number = parameters[4].value;
                let x3: number = parameters[5].value;
                let y3: number = parameters[6].value;
                let farbeString: string = parameters[7].value;
                let sh: GroupHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("FigurteilFestlegenDreieck")) return;

                if (o.intrinsicData["isInitialTriangle"]) {
                    o.intrinsicData["isInitialTriangle"] = false;
                    sh.destroyChildren();
                }

                let farbe = GNGFarben[farbeString];
                if (farbe == null) farbe = 0;

                let rto = new RuntimeObject(polygonClass);
                let triangle = new PolygonHelper([x1, y1, x2, y2, x3, y3], true, this.module.main.getInterpreter(), rto);
                rto.intrinsicData["Actor"] = triangle;

                let center: GNGPoint = o.intrinsicData["Center"];

                triangle.rotate(sh.angle, 0, 0);
                triangle.scale(sh.scaleFactor, 0, 0);
                triangle.move(center.x, center.y);
                triangle.setFillColor(farbe);
                triangle.setBorderColor("black");
                triangle.setBorderWidth(2);
                sh.add(rto);

            }, false, false, 'Erzeugt ein neues, dreieckiges Element und fügt es der Figur hinzu.', false));

        this.addMethod(new Method("FigurteilFestlegenRechteck", new Parameterlist([
            { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "breite", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "höhe", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "farbe", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let breite: number = parameters[3].value;
                let höhe: number = parameters[4].value;
                let farbeString: string = parameters[5].value;
                let sh: GroupHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("FigurteilFestlegenRechteck")) return;

                if (o.intrinsicData["isInitialTriangle"]) {
                    o.intrinsicData["isInitialTriangle"] = false;
                    sh.destroyChildren();
                }

                let farbe = GNGFarben[farbeString];
                if (farbe == null) farbe = 0;

                let rto = new RuntimeObject(rectangleClass);
                let rectangleHelper = new RectangleHelper(x + 0.05, y + 0.05, breite - 0.1, höhe - 0.1, this.module.main.getInterpreter(), rto);
                rto.intrinsicData["Actor"] = rectangleHelper;

                let center: GNGPoint = o.intrinsicData["Center"];

                rectangleHelper.rotate(sh.angle, 0, 0);
                rectangleHelper.scale(sh.scaleFactor, 0, 0);
                rectangleHelper.move(center.x, center.y);
                rectangleHelper.setFillColor(farbe);
                rectangleHelper.setBorderColor("black");
                rectangleHelper.setBorderWidth(2);
                sh.add(rto);

            }, false, false, 'Erzeugt ein neues, rechteckiges Element einer eigenen Darstellung der Figur.', false));

        this.addMethod(new Method("FigurteilFestlegenEllipse", new Parameterlist([
            { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "breite", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "höhe", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "farbe", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let breite: number = parameters[3].value;
                let höhe: number = parameters[4].value;
                let farbeString: string = parameters[5].value;
                let sh: GroupHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("FigurteilFestlegenEllipse")) return;
                
                if (o.intrinsicData["isInitialTriangle"]) {
                    o.intrinsicData["isInitialTriangle"] = false;
                    sh.destroyChildren();
                }

                let farbe = GNGFarben[farbeString];
                if (farbe == null) farbe = 0;

                höhe = höhe - 0.1;      // hack to ensure collision-handling identical to gng (also 0.05 two lines below)
                breite = breite - 0.1;

                let rto = new RuntimeObject(ellipseClass);
                let ellipseHelper = new EllipseHelper(x + breite / 2 + 0.05, y + höhe / 2 + 0.05, breite / 2, höhe / 2, this.module.main.getInterpreter(), rto);
                rto.intrinsicData["Actor"] = ellipseHelper;

                let center: GNGPoint = o.intrinsicData["Center"];

                ellipseHelper.rotate(sh.angle, 0, 0);
                ellipseHelper.scale(sh.scaleFactor, 0, 0);
                ellipseHelper.move(center.x, center.y);
                ellipseHelper.setFillColor(farbe);
                ellipseHelper.setBorderColor("black");
                ellipseHelper.setBorderWidth(2);
                sh.add(rto);

            }, false, false, 'Erzeugt ein neues, elliptisches Element einer eigenen Darstellung der Figur.', false));


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


    drawInitialTriangle(gh: GroupHelper, triangleClass: Klass, circleClass: Klass, interpreter: Interpreter, center: GNGPoint) {
        let t: RuntimeObject = new RuntimeObject(triangleClass);
        let th: PolygonHelper = new PolygonHelper([-50, -50, 50, 0, -50, 50], true, interpreter, t);
        t.intrinsicData["Actor"] = th;
        th.move(center.x, center.y);
        th.setFillColor("yellow");
        th.setBorderColor("black");
        th.setBorderWidth(2);
        gh.add(t);

        let c: RuntimeObject = new RuntimeObject(circleClass);
        let ch: CircleHelper = new CircleHelper(0, 0, 10, interpreter, c);
        c.intrinsicData["Actor"] = ch;
        ch.move(center.x, center.y);
        ch.setFillColor("blue");
        ch.setBorderColor("black");
        ch.setBorderWidth(2);
        gh.add(c);

    }
}


class FigurHelper extends GroupHelper {
    constructor(interpreter: Interpreter, runtimeObject: RuntimeObject, private gngEreignisbehandlungsHelper: GNGEreignisbehandlungHelper) {
        super(interpreter, runtimeObject);
    }

    destroy(){
        this.gngEreignisbehandlungsHelper.unregisterEvents(this.runtimeObject);
        super.destroy();
    }
}

