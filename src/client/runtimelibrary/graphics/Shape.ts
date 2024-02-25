import { Klass, Visibility } from "../../compiler/types/Class.js";
import { Module } from "../../compiler/parser/Module.js";
import { Method, Parameterlist, Attribute, Value, Type } from "../../compiler/types/Types.js";
import { intPrimitiveType, doublePrimitiveType, voidPrimitiveType, booleanPrimitiveType, DoublePrimitiveType, stringPrimitiveType, nullType } from "../../compiler/types/PrimitiveTypes.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { ArrayType } from "../../compiler/types/Array.js";
import { ActorHelper } from "./Actor.js";
import { WorldHelper, MouseListenerShapeData } from "./World.js";
import { Punkt, polygonEnthältPunkt, polygonBerührtPolygon, polygonBerührtPolygonExakt } from "../../tools/MatheTools.js";
import { ColorHelper } from "./ColorHelper.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import { GroupHelper, GroupClass } from "./Group.js";
import { Enum, EnumInfo } from "../../compiler/types/Enum.js";
import { FilledShapeDefaults } from "./FilledShapeDefaults.js";
import * as PIXI from 'pixi.js';

export class ShapeClass extends Klass {

    constructor(module: Module) {

        super("Shape", module, "Basisklasse für alle graphischen Objekte die verschoben, skaliert und gedreht werden können");

        this.setBaseClass(<Klass>module.typeStore.getType("Actor"));
        this.isAbstract = true;

        // let matrixType = new ArrayType(doublePrimitiveType);
        let shapeType = module.typeStore.getType("Shape");
        let directionType = <Enum>(<any>module.typeStore.getType("Direction"));
        let shapeArrayType = new ArrayType(shapeType);

        let vector2Class = <Klass>module.typeStore.getType("Vector2");

        this.addAttribute(new Attribute("angle", doublePrimitiveType,
            (value) => {

                let rto: RuntimeObject = value.object;
                let helper: ShapeHelper = rto.intrinsicData["Actor"];

                if (helper == null || helper.isDestroyed || helper.displayObject == null) {
                    value.value = 0;
                    return;
                }

                value.value = helper.angle;

            }, false, Visibility.protected, true, "Richtung"));

        this.addAttribute(new Attribute("centerX", doublePrimitiveType,
            (value) => {

                let rto: RuntimeObject = value.object;
                let helper: ShapeHelper = rto.intrinsicData["Actor"];
                if (helper == null || helper.isDestroyed || helper.displayObject == null) {
                    value.value = 0;
                    return;
                }

                value.value = helper.getCenterX();

            }, false, Visibility.protected, true, "X-Koordinate des Diagonalenschnittpunkts der BoundingBox des Objekts"));

        this.addAttribute(new Attribute("centerY", doublePrimitiveType,
            (value) => {

                let rto: RuntimeObject = value.object;
                let helper: ShapeHelper = rto.intrinsicData["Actor"];
                if (helper == null || helper.isDestroyed || helper.displayObject == null) {
                    value.value = 0;
                    return;
                }

                value.value = helper.getCenterY();

            }, false, Visibility.protected, true, "Y-Koordinate des Diagonalenschnittpunkts der BoundingBox des Objekts"));

        this.setupAttributeIndicesRecursive();

        // this.addAttribute(new Attribute("transformation", matrixType,
        //     (value) => {

        //         let rto: RuntimeObject = value.object;
        //         let helper: ShapeHelper = rto.intrinsicData["Actor"];
        //         if (helper == null || helper.isDestroyed || helper.displayObject.transform == null) {
        //             value.value = null;
        //             return;
        //         }

        //         let matrix = helper.displayObject.localTransform.toArray(false);

        //         if (value.value == null) {
        //             value.value = [];

        //             for (let n of matrix) {
        //                 value.value.push({
        //                     type: doublePrimitiveType,
        //                     value: n
        //                 });
        //             }
        //         } else {
        //             let i: number = 0;
        //             for (let n of matrix) {
        //                 value.value[i++].value = n;
        //             }
        //         }

        //     }, false, Visibility.protected, true, "Transformationsmatrix"));

        this.addMethod(new Method("move", new Parameterlist([
            { identifier: "dx", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "dy", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let dx: number = parameters[1].value;
                let dy: number = parameters[2].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("move")) return;

                sh.move(dx, dy);

            }, false, false, "Verschiebt das Grafikobjekt um dx Pixel nach rechts und um dy Pixel nach unten.", false));

        this.addMethod(new Method("rotate", new Parameterlist([
            { identifier: "angleInDeg", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "centerX", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "centerY", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let angleInDeg: number = parameters[1].value;
                let centerX: number = parameters[2].value;
                let centerY: number = parameters[3].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("rotate")) return;

                sh.rotate(angleInDeg, centerX, centerY);

            }, false, false, "Dreht das Grafikobjekt um den angegebenen Winkel. Drehpunkt ist (centerX, centerY).", false));

        this.addMethod(new Method("rotate", new Parameterlist([
            { identifier: "angleInDeg", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let angleInDeg: number = parameters[1].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("rotate")) return;

                sh.rotate(angleInDeg);

            }, false, false, "Dreht das Grafikobjekt um den angegebenen Winkel. Drehpunkt ist der 'Mittelpunkt' des Objekts", false));

        this.addMethod(new Method("scale", new Parameterlist([
            { identifier: "factor", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "centerX", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "centerY", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let factor: number = parameters[1].value;
                let centerX: number = parameters[2].value;
                let centerY: number = parameters[3].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("scale")) return;

                sh.scale(factor, centerX, centerY);

            }, false, false, "Streckt das Grafikobjekt um den angegebenen Faktor. Das Zentrum der Streckung ist der Punkt (centerX, centerY)", false));

        this.addMethod(new Method("scale", new Parameterlist([
            { identifier: "factor", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let factor: number = parameters[1].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("scale")) return;

                sh.scale(factor);

            }, false, false, "Streckt das Grafikobjekt um den angegebenen Faktor. Das Zentrum der Streckung ist der 'Mittelpunkt' des Objekts.", false));

        this.addMethod(new Method("mirrorX", new Parameterlist([
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("mirrorX")) return;

                sh.mirrorXY(-1, 1);

            }, false, false, "Spiegelt das Objekt in X-Richtung.", false));

        this.addMethod(new Method("mirrorY", new Parameterlist([
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("mirrorX")) return;

                sh.mirrorXY(1, -1);

            }, false, false, "Spiegelt das Objekt in Y-Richtung.", false));

        this.addMethod(new Method("isOutsideView", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("isOutsideView")) return;

                return sh.isOutsideView();

            }, false, false, "Gibt genau dann true zurück, wenn sich die Bounding Box des Objekts außerhalb des sichtbaren Bereichs befindet. ", false));

        this.addMethod(new Method("getCenterX", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getCenterX")) return;

                return sh.getCenterX();

            }, false, false, "Gibt die x-Koordinate des 'Mittelpunkts' zurück. Der 'Mittelpunkt' des Grafikobjekts ist der Diagonalenschnittpunkt seiner achsenparallelen Bounding-Box.", false));

        this.addMethod(new Method("getCenterY", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getCenterY")) return;

                return sh.getCenterY();

            }, false, false, "Gibt die y-Koordinate des 'Mittelpunkts' zurück. Der 'Mittelpunkt' des Grafikobjekts ist der Diagonalenschnittpunkt seiner achsenparallelen Bounding-Box.", false));

        this.addMethod(new Method("getAngle", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getAngle")) return;

                return sh.angle;

            }, false, false, "Gibt den Winkel des Grafikobjekts in Grad zurück. Winkel == 0 bedeutet: dieselbe Richtung wie zum Zeipunkt der Instanzierung des Objekts. Positive Winkelzunahme bedeutet Rechtsdrehung.", false));

        this.addMethod(new Method("containsPoint", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("containsPoint")) return;

                return sh.containsPoint(x, y);

            }, false, false, "Gibt genau dann true zurück, wenn das Grafikobjekt den Punkt (x, y) enthält.", false));

        this.addMethod(new Method("collidesWith", new Parameterlist([
            { identifier: "object", type: this, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let shape: RuntimeObject = parameters[1].value;

                if (shape == null) {
                    module.main.getInterpreter().throwException("Der Parameter der Methode collidesWith darf nicht null sein.");
                }

                let sh: ShapeHelper = o.intrinsicData["Actor"];
                let sh1: ShapeHelper = shape.intrinsicData["Actor"];

                if (sh.testdestroyed("collidesWith")) return;

                if (sh1.isDestroyed) {
                    sh.worldHelper.interpreter.throwException("Die der Methode collidesWith als Parameter übergebene Figur ist bereits zerstört.");
                    return;
                }

                return sh.collidesWith(sh1);

            }, false, false, "Gibt genau dann true zurück, wenn das Grafikobjekt und das andere Grafikobjekt kollidieren.", false));

        this.addMethod(new Method("collidesWithAnyShape", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let sh: ShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("collidesWithAnyShape")) return;

                return sh.collidesWithAnyShape();

            }, false, false, "Gibt genau dann true zurück, wenn das Grafikobjekt mit irgendeinem anderen Grafikobjekt kollidiert.", false));

        this.addMethod(new Method("collidesWithFillColor", new Parameterlist([
            { identifier: "color", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let color: number = parameters[1].value;

                let sh: ShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("collidesWithFillColor")) return;

                return sh.collidesWithAnyShape(color);

            }, false, false, "Gibt genau dann true zurück, wenn das Grafikobjekt mit einem anderen Grafikobjekt der angegebenen Füllfarbe kollidiert.", false));

        this.addMethod(new Method("collidesWithFillColor", new Parameterlist([
            { identifier: "color", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let color: string = parameters[1].value;

                let sh: ShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("collidesWithFillColor")) return;

                let c = ColorHelper.parseColorToOpenGL(color);


                return sh.collidesWithAnyShape(c.color);

            }, false, false, "Gibt genau dann true zurück, wenn das Grafikobjekt mit einem anderen Grafikobjekt der angegebenen Füllfarbe kollidiert.", false));

            this.addMethod(new Method("getFirstCollidingSprite", new Parameterlist([
            { identifier: "imageIndex", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let spriteIndex: number = parameters[1].value;

                let sh: ShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getFirstCollidingSprite")) return;

                return sh.getFirstCollidingSprite(spriteIndex);

            }, false, false, "Falls dieses Grafikobjekt gerade mindestens ein Sprite mit dem übergebenen Bildindex (null bedeutet: mit irgendeinem BildIndex) berührt, wird das erste dieser Sprites zurückgegeben.", false));

        this.addMethod(new Method("moveBackFrom", new Parameterlist([
            { identifier: "otherShape", type: this, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "keepColliding", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let shape: RuntimeObject = parameters[1].value;
                let keepColliding: boolean = parameters[2].value;

                if (shape == null) {
                    module.main.getInterpreter().throwException("Der erste Parameter der Methode moveBackFrom darf nicht null sein.");
                }

                let sh: ShapeHelper = o.intrinsicData["Actor"];
                let sh1: ShapeHelper = shape.intrinsicData["Actor"];

                if (sh.testdestroyed("moveBackFrom")) return;

                if (sh1.isDestroyed) {
                    sh.worldHelper.interpreter.throwException("Die der Methode moveBackFrom als Parameter übergebene Figur ist bereits zerstört.");
                    return;
                }

                sh.moveBackFrom(sh1, keepColliding);

            }, false, false, "Rückt das Objekt entlang der letzten durch move vorgegebenen Richtung zurück, bis es das übergebene Objekt gerade noch (keepColliding == true) bzw. gerade nicht mehr (keepColliding == false) berührt.", false));

        this.addMethod(new Method("directionRelativeTo", new Parameterlist([
            { identifier: "otherShape", type: this, declaration: null, usagePositions: null, isFinal: true },
        ]), directionType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let shape: RuntimeObject = parameters[1].value;

                if (shape == null) {
                    module.main.getInterpreter().throwException("Der erste Parameter der Methode directionRelativeTo darf nicht null sein.");
                }

                let sh: ShapeHelper = o.intrinsicData["Actor"];
                let sh1: ShapeHelper = shape.intrinsicData["Actor"];

                if (sh.testdestroyed("directionRelativeTo")) return;

                if (sh1.isDestroyed) {
                    sh.worldHelper.interpreter.throwException("Die der Methode directionRelativeTo als Parameter übergebene Figur ist bereits zerstört.");
                    return;
                }

                return sh.directionRelativeTo(sh1, directionType);

            }, false, false, "Gibt die Richtung (top, right, bottom oder left) zurück, in der das graphische Objekt relativ zum übergebenen graphischen Objekt steht.", false));

        this.addMethod(new Method("moveTo", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;

                if (sh.testdestroyed("moveTo")) return;

                sh.move(x - sh.getCenterX(), y - sh.getCenterY());

            }, false, false, "Verschiebt das Grafikobjekt so, dass sich sein 'Mittelpunkt' an den angegebenen Koordinaten befindet.", false));

        this.addMethod(new Method("defineCenter", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;

                if (sh.testdestroyed("defineCenter")) return;

                sh.defineCenter(x, y);

            }, false, false, "Setzt fest, wo der 'Mittelpunkt' des Objekts liegen soll. Dieser Punkt wird als Drehpunkt der Methode rotate, als Zentrum der Methode Scale und als Referenzpunkt der Methode moveTo benutzt.", false));

        this.addMethod(new Method("defineCenterRelative", new Parameterlist([
            { identifier: "xRel", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "yRel", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;

                if (sh.testdestroyed("defineCenterRelative")) return;

                sh.defineCenterRelative(x, y);

            }, false, false, "Setzt fest, wo der 'Mittelpunkt' des Objekts liegen soll. Dabei bedeutet (XRel/YRel) = (0/0) die linke obere Ecke der Bounding Box des Objekts, (XRel/YRel) = (1/1) die rechte untere Ecke. Defaultwert ist (XRel/YRel) = (0.5/0.5), also der Diagonalenschnittpunkt der Bounding Box. Dieser Punkt wird als Drehpunkt der Methode rotate, als Zentrum der Methode Scale und als Referenzpunkt der Methode moveTo benutzt.\n\nVORSICHT: Diese Methode arbeitet nicht mehr korrekt, wenn das Objekt schon gedreht wurde!", false));

        this.addMethod(new Method("setAngle", new Parameterlist([
            { identifier: "angleDeg", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];
                let angleDeg: number = parameters[1].value;

                if (sh.testdestroyed("setAngle")) return;

                sh.rotate(angleDeg - sh.angle);

            }, false, false, "Dreht das Objekt zur angegebenen Richtung.", false));

        this.addMethod(new Method("setDefaultVisibility", new Parameterlist([
            { identifier: "visibility", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let visibility: boolean = parameters[1].value;

                FilledShapeDefaults.setDefaultVisibility(visibility);

            }, false, true, 'Setzt den Standardwert für das Attribut "visible". Dieser wird nachfolgend immer dann verwendet, wenn ein neues grafisches Objekt instanziert wird.', false));


        this.addMethod(new Method("setVisible", new Parameterlist([
            { identifier: "visible", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];
                let visible: boolean = parameters[1].value;

                if (sh.testdestroyed("setVisible")) return;

                sh.setVisible(visible);

            }, false, false, "Macht das Grafikobjekt sichtbar (visible == true) bzw. unsichtbar (visible == false).", false));

        this.addMethod(new Method("isVisible", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("isVisible")) return;

                return sh.displayObject.visible;

            }, false, false, "Gibt den Wert der Eigenschaft 'visible' des Grafikobjekts zurück.", false));

        this.addMethod(new Method("setStatic", new Parameterlist([
            { identifier: "isStatic", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];
                let isStatic: boolean = parameters[1].value;

                if (sh.testdestroyed("setStatic")) return;

                sh.setStatic(isStatic);

            }, false, false, "setStatic(true) hat zur Folge, dass die Ansicht des Objekts durch Transformationen des World-Objekts nicht verändert wird.", false));

        this.addMethod(new Method("onMouseEnter", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType, () => { }, // no statements!
            false, false, "Wird aufgerufen, wenn sich der Mauspfeil in das Objekt hineinbewegt.", false));

        this.addMethod(new Method("onMouseLeave", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType, () => { }, // no statements!
            false, false, "Wird aufgerufen, wenn sich der Mauspfeil in das Objekt hineinbewegt.", false));

        this.addMethod(new Method("onMouseDown", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "key", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType, () => { }, // no statements!
            false, false, "Wird aufgerufen, wenn sich der Mauspfeil über dem Objekt befindet und der Benutzer eine Maustaste nach unten drückt.", false));

        this.addMethod(new Method("onMouseUp", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "key", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType, () => { }, // no statements!
            false, false, "Wird aufgerufen, wenn sich der Mauspfeil über dem Objekt befindet und der Benutzer eine Maustaste loslässt.", false));

        this.addMethod(new Method("onMouseMove", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType, () => { }, // no statements!
            false, false, "Wird aufgerufen, wenn sich der Mauspfeil über dem Objekt befindet und bewegt.", false));

        this.addMethod(new Method("tint", new Parameterlist([
            { identifier: "colorAsRGBAString", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let color: string = parameters[1].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("tint")) return;

                sh.tint(color);

            }, false, false, 'Überzieht das Grafikobjekt mit einer halbdurchsichtigen Farbschicht.', false));

        this.addMethod(new Method("tint", new Parameterlist([
            { identifier: "colorAsInt", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let color: number = parameters[1].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("tint")) return;

                sh.tint(color);

            }, false, false, 'Überzieht das Grafikobjekt mit einer halbdurchsichtigen Farbschicht. Die Farbe wird als int-Wert angegeben, praktischerweise hexadezimal, also z.B. tint(0x303030).', false));

        this.addMethod(new Method("startTrackingEveryMouseMovement", new Parameterlist([
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];

                sh.trackMouseMove = true;

            }, false, false, 'Sorgt dafür, dass ab jetzt JEDE Bewegung des Mauszeigers (auch wenn sich dieser außerhalb des Objekts befindet) ein MouseMove-Ereignis für dieses Objekt auslöst. -> Praktisch zur Umsetzung des "Ziehens" von Objekten mit der Maus!', false));

        this.addMethod(new Method("stopTrackingEveryMouseMovement", new Parameterlist([
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];

                sh.trackMouseMove = false;

            }, false, false, 'Sorgt dafür, dass ab jetzt nur noch dann Bewegungen des Mauszeigers ein MouseMove-Ereignis für dieses Objekt auslösen, wenn sich der Mauszeiger über dem Objekt befindet. -> Praktisch zur Umsetzung des "Ziehens" von Objekten mit der Maus!', false));

        this.addMethod(new Method("reactToMouseEventsWhenInvisible", new Parameterlist([
            { identifier: "react", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let react: boolean = parameters[1].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];

                sh.reactToMouseEventsWhenInvisible = react;

            }, false, false, 'Legt fest, ob das Objekt auf Mausevents (buttondown, mouse move, ...) reagiert, wenn es unsichtbar ist.', false));

        this.addMethod(new Method("tint", new Parameterlist([
            { identifier: "colorAsRGBAString", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let color: string = parameters[1].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("tint")) return;

                sh.tint(color);

            }, false, false, 'Überzieht das Grafikobjekt mit einer halbdurchsichtigen Farbschicht.', false));

        this.addMethod(new Method("defineDirection", new Parameterlist([
            { identifier: "angleInDeg", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let direction: number = parameters[1].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("defineDirection")) return;

                sh.directionRad = direction / 180 * Math.PI;

            }, false, false, 'Setzt die Blickrichtung des graphischen Objekts. Dies ist die Richtung, in die es durch Aufruf der Methode forward bewegt wird. \nBemerkung: die Methode rotate ändert auch die Blickrichtung!', false));

        this.addMethod(new Method("forward", new Parameterlist([
            { identifier: "distance", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let distance: number = parameters[1].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("forward")) return;

                sh.forward(distance);

            }, false, false, 'Bewegt das Objekt um die angegebene Länge in Richtung seiner Blickrichtung.\nBemerkung: Die Blickrichtung kann mit defineDirection gesetzt werden.', false));

        this.addMethod(new Method("copy", new Parameterlist([
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("copy")) return;

                return sh.getCopy(<Klass>o.class);

            }, true, false, 'Erstellt eine Kopie des Grafikobjekts und git sie zurück.', false));


        this.addMethod(new Method("bringToFront", new Parameterlist([
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("bringToFront")) return;

                return sh.bringToFront();

            }, false, false, 'Setzt das Grafikobjekt vor alle anderen.', false));

        this.addMethod(new Method("sendToBack", new Parameterlist([
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("sendToBack")) return;

                return sh.sendToBack();

            }, false, false, 'Setzt das Grafikobjekt hinter alle anderen.', false));

        this.addMethod(new Method("getHitPolygon", new Parameterlist([
        ]), new ArrayType(vector2Class),
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getHitPolygon")) return;

                return sh.getHitPolygon(vector2Class);

            }, false, false, "Gibt ein Array zurück, das die vier Eckpunkte des Hit-Polygons in Form von Vector2-Ortsvektoren enthält. Bei den Klassen Rectangle, Triangle und Polygon sind dies die Eckpunkte.", false));

            this.addMethod(new Method("getScale", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getScale")) return;

                return sh.scaleFactor;

            }, false, false, "Gibt den Wert des Streckungsfaktors zurück.", false));

            this.addMethod(new Method("setScale", new Parameterlist([
                { identifier: "newFactor", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let factor = <number>parameters[1].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setScale")) return;

                sh.scale(factor/sh.scaleFactor);

            }, false, false, "Setzt den Wert des Streckungsfaktors ausgehend vom Wert 1.0 nach Instanzieren des Objekts. Im Unterschied zu dieser Methode multipliziert die Methode scale(double factor) den aktuellen Streckungsfaktor mit dem angegebenen Wert.", false));

    }

    setSpriteType(spriteClass: Klass) {
        this.methods.find(m => m.identifier == "getFirstCollidingSprite").returnType = spriteClass;
    }


}

export abstract class ShapeHelper extends ActorHelper {

    displayObject: PIXI.DisplayObject;

    belongsToGroup: GroupHelper;

    centerXInitial: number;
    centerYInitial: number;

    angle: number = 0;

    hitPolygonInitial: Punkt[] = null;
    hitPolygonTransformed: Punkt[] = null;
    hitPolygonDirty = true;

    reactToMouseEventsWhenInvisible: boolean = false;

    mouseLastSeenInsideObject: boolean = false;

    trackMouseMove: boolean = false;

    scaleFactor: number = 1.0;

    directionRad: number = 0;

    lastMoveDx: number = 0;
    lastMoveDy: number = 0;

    copyFrom(shapeHelper: ShapeHelper) {

        this.centerXInitial = shapeHelper.centerXInitial;
        this.centerYInitial = shapeHelper.centerYInitial;

        if (shapeHelper.hitPolygonInitial != null) {
            this.hitPolygonInitial = [];
            for (let p of shapeHelper.hitPolygonInitial) this.hitPolygonInitial.push(Object.assign({}, p));
        }

        this.setHitPolygonDirty(true);

        this.hitPolygonDirty = shapeHelper.hitPolygonDirty;
        this.reactToMouseEventsWhenInvisible = shapeHelper.reactToMouseEventsWhenInvisible;
        this.mouseLastSeenInsideObject = shapeHelper.mouseLastSeenInsideObject;

        this.displayObject.localTransform.copyFrom(shapeHelper.displayObject.transform.localTransform);
        this.displayObject.updateTransform();

    }

    constructor(interpreter: Interpreter, runtimeObject: RuntimeObject) {

        super(interpreter, runtimeObject);

        let listenerTypes = [
            { identifier: "MouseUp", signature: "(double, double, int)" },
            { identifier: "MouseDown", signature: "(double, double, int)" },
            { identifier: "MouseMove", signature: "(double, double)" },
            { identifier: "MouseEnter", signature: "(double, double)" },
            { identifier: "MouseLeave", signature: "(double, double)" },
        ];

        let sd: MouseListenerShapeData = null;

        for (let lt of listenerTypes) {
            let method: Method = (<Klass>runtimeObject.class).getMethodBySignature("on" + lt.identifier + lt.signature);

            if (method?.program != null || method?.invoke != null) {

                if (sd == null) {
                    sd = {
                        shapeHelper: this,
                        types: {},
                        methods: {}
                    };
                    this.worldHelper.mouseListenerShapes.push(sd);
                }

                sd.types[lt.identifier.toLowerCase()] = true;
                sd.methods[lt.identifier.toLowerCase()] = method;

            }
        }

        if (this.worldHelper.defaultGroup == null) {
            this.worldHelper.shapes.push(this);
        }


    }

    setHitPolygonDirty(dirty: boolean) {
        this.hitPolygonDirty = dirty;
    }

    bringOnePlaneFurtherToFront() {
        let container: PIXI.Container = <PIXI.Container>this.displayObject.parent;
        let highestIndex = container.children.length - 1;
        let index = container.getChildIndex(this.displayObject);
        if (index < highestIndex) {
            container.setChildIndex(this.displayObject, index + 1);
        }
    }

    bringOnePlaneFurtherToBack() {
        let container: PIXI.Container = <PIXI.Container>this.displayObject.parent;
        let index = container.getChildIndex(this.displayObject);
        if (index > 0) {
            container.setChildIndex(this.displayObject, index - 1);
        }
    }

    bringToFront() {
        let container: PIXI.Container = <PIXI.Container>this.displayObject.parent;
        let highestIndex = container.children.length - 1;

        if (this.belongsToGroup != null) {
            this.belongsToGroup.setChildIndex(this, highestIndex);
        } else {
            container.setChildIndex(this.displayObject, highestIndex);
        }
    }

    sendToBack() {
        if (this.belongsToGroup != null) {
            this.belongsToGroup.setChildIndex(this, 0);
        } else {
            let container: PIXI.Container = <PIXI.Container>this.displayObject.parent;
            container.setChildIndex(this.displayObject, 0);
        }
    }

    addToDefaultGroupAndSetDefaultVisibility() {

        this.displayObject.visible = FilledShapeDefaults.defaultVisibility;

        if (this.worldHelper.defaultGroup != null) {
            this.runtimeObject.intrinsicData["Actor"] = this;
            let groupHelper = <GroupHelper>this.worldHelper.defaultGroup;
            groupHelper.add(this.runtimeObject);
        }
    }

    tint(color: string | number) {
        let c: number;
        if (typeof color == 'string') {
            c = ColorHelper.parseColorToOpenGL(color).color;
        } else {
            c = color;
        }
        //@ts-ignore
        if (this.displayObject.tint) {
            //@ts-ignore
            this.displayObject.tint = c;
        }
        this.render();
    }

    setVisible(visible: boolean) {

        this.displayObject.visible = visible;
    }

    getFirstCollidingSpriteHelper(index: number | undefined, shapeHelpers: ShapeHelper[]): RuntimeObject {
        for (let shapeHelper of shapeHelpers) {
            if(shapeHelper == this) continue;
            
            let spriteIndex = shapeHelper["index"];
            if(!spriteIndex){
                if(shapeHelper["shapes"]){
                    let runtimeObjects = <RuntimeObject[]>shapeHelper["shapes"];
                    let firstCollidingSprite = this.getFirstCollidingSpriteHelper(index, runtimeObjects.map(ro => ro.intrinsicData["Actor"]));

                    if(firstCollidingSprite) return firstCollidingSprite;
                } 

                continue;
            }

            if(index != null && index != spriteIndex) continue;

            let bb = this.displayObject.getBounds();
            let bb1 = shapeHelper.displayObject.getBounds();

            if (bb.left > bb1.right || bb1.left > bb.right) continue;

            if (bb.top > bb1.bottom || bb1.top > bb.bottom) continue;

            // boundig boxes collide, so check further:
            if (shapeHelper.hitPolygonDirty) shapeHelper.transformHitPolygon();

            // return polygonBerührtPolygon(this.hitPolygonTransformed, shapeHelper.hitPolygonTransformed);
            if (polygonBerührtPolygonExakt(this.hitPolygonTransformed, shapeHelper.hitPolygonTransformed, true, true)) {
                return shapeHelper.runtimeObject;
            }

        }

    }


    getFirstCollidingSprite(index?: number): RuntimeObject {
        this.displayObject.updateTransform();
        if (this.hitPolygonDirty) this.transformHitPolygon();

        return this.getFirstCollidingSpriteHelper(index, this.worldHelper.shapes);

    }

    collidesWithAnyShape(color?: number): boolean {
        this.displayObject.updateTransform();
        if (this.hitPolygonDirty) this.transformHitPolygon();

        for (let shapeHelper of this.worldHelper.shapes) {
            if (this == shapeHelper) continue;

            if (color != null) {
                if (shapeHelper["fillColor"] != color) {
                    continue;
                }
            }

            if (shapeHelper["shapes"] || shapeHelper["turtle"]) {
                if (shapeHelper.collidesWith(this)) {
                    return true;
                } else {
                    continue;
                }
            }

            if (this["turtle"]) {
                if (this.collidesWith(shapeHelper)) {
                    return true;
                } else {
                    continue;
                }
            }

            let bb = this.displayObject.getBounds();
            let bb1 = shapeHelper.displayObject.getBounds();

            if (bb.left > bb1.right || bb1.left > bb.right) continue;

            if (bb.top > bb1.bottom || bb1.top > bb.bottom) continue;

            // boundig boxes collide, so check further:
            if (shapeHelper.hitPolygonDirty) shapeHelper.transformHitPolygon();

            // return polygonBerührtPolygon(this.hitPolygonTransformed, shapeHelper.hitPolygonTransformed);
            if (polygonBerührtPolygonExakt(this.hitPolygonTransformed, shapeHelper.hitPolygonTransformed, true, true)) {
                return true;
            }

        }

        return false;

    }

    collidesWith(shapeHelper: ShapeHelper) {

        // if(!(this instanceof TurtleHelper) && (shapeHelper instanceof TurtleHelper)){
        if (this["lineElements"] == null && (shapeHelper["lineElements"] != null)) {
            return shapeHelper.collidesWith(this);
        }

        if (shapeHelper["shapes"]) {
            return shapeHelper.collidesWith(this);
        }

        if (this.displayObject == null || shapeHelper.displayObject == null) return;

        this.displayObject.updateTransform();
        shapeHelper.displayObject.updateTransform();

        let bb = this.displayObject.getBounds();
        let bb1 = shapeHelper.displayObject.getBounds();

        if (bb.left > bb1.right || bb1.left > bb.right) return false;

        if (bb.top > bb1.bottom || bb1.top > bb.bottom) return false;

        if (this.hitPolygonInitial == null || shapeHelper.hitPolygonInitial == null) return true;

        // boundig boxes collide, so check further:
        if (this.hitPolygonDirty) this.transformHitPolygon();
        if (shapeHelper.hitPolygonDirty) shapeHelper.transformHitPolygon();

        // return polygonBerührtPolygon(this.hitPolygonTransformed, shapeHelper.hitPolygonTransformed);
        return polygonBerührtPolygonExakt(this.hitPolygonTransformed, shapeHelper.hitPolygonTransformed, true, true);

    }

    directionRelativeTo(shapeHelper: ShapeHelper, directionType: Enum) {
        this.displayObject.updateTransform();
        shapeHelper.displayObject.updateTransform();

        let bb = this.displayObject.getBounds();
        let bb1 = shapeHelper.displayObject.getBounds();

        let dx1 = bb1.left - bb.right;  // positive if left
        let dx2 = bb.left - bb1.right;  // positive if right

        let dy1 = bb1.top - bb.bottom;  // positive if top
        let dy2 = bb.top - bb1.bottom;  // positive if bottom

        let enuminfo = directionType.enumInfoList;
        let pairs: { distance: number, ei: EnumInfo }[] = [];

        if (this.lastMoveDx > 0) {
            pairs.push({ distance: dx1, ei: enuminfo[3] });
        } else if (this.lastMoveDx < 0) {
            pairs.push({ distance: dx2, ei: enuminfo[1] });
        }

        if (this.lastMoveDy > 0) {
            pairs.push({ distance: dy1, ei: enuminfo[0] });
        } else if (this.lastMoveDy < 0) {
            pairs.push({ distance: dy2, ei: enuminfo[2] });
        }

        if (pairs.length == 0) {
            pairs = [
                { distance: dx1, ei: enuminfo[3] },
                { distance: dx2, ei: enuminfo[1] },
                { distance: dy1, ei: enuminfo[0] },
                { distance: dy2, ei: enuminfo[2] }
            ]
        }


        let max = pairs[0].distance;
        let ei = pairs[0].ei;
        for (let i = 1; i < pairs.length; i++) {
            if (pairs[i].distance > max) {
                max = pairs[i].distance;
                ei = pairs[i].ei;
            }
        }

        return ei.object;
    }


    moveBackFrom(sh1: ShapeHelper, keepColliding: boolean) {

        // subsequent calls to move destroy values in this.lastMoveDx and this.lastMoveDy, so:
        let lmdx = this.lastMoveDx;
        let lmdy = this.lastMoveDy;

        let length = Math.sqrt(lmdx * lmdx + lmdy * lmdy);
        if (length < 0.001) return;

        if (!this.collidesWith(sh1)) return;

        let parameterMax = 0;       // collision with this parameter
        this.move(-lmdx, -lmdy);

        let currentParameter = -1;  // move to parameterMin

        while (this.collidesWith(sh1)) {
            parameterMax = currentParameter;    // collision at this parameter
            let newParameter = currentParameter * 2;
            this.move(lmdx * (newParameter - currentParameter), lmdy * (newParameter - currentParameter));
            currentParameter = newParameter;
            if ((currentParameter + 1) * length < -100) {
                this.move(lmdx * (-1 - currentParameter), lmdy * (-1 - currentParameter));
                return;
            }
        }
        let parameterMin = currentParameter;

        let isColliding: boolean = false;
        // Situation now: no collision at parameterMin == currentParameter, collision at parameterMax
        while ((parameterMax - parameterMin) * length > 1) {
            let np = (parameterMax + parameterMin) / 2;
            this.move(lmdx * (np - currentParameter), lmdy * (np - currentParameter));
            if (isColliding = this.collidesWith(sh1)) {
                parameterMax = np;
            } else {
                parameterMin = np;
            }
            currentParameter = np;
        }

        if (keepColliding && !isColliding) {
            this.move(lmdx * (parameterMax - currentParameter), lmdy * (parameterMax - currentParameter));
        } else if (isColliding && !keepColliding) {
            this.move(lmdx * (parameterMin - currentParameter), lmdy * (parameterMin - currentParameter));
        }

        this.lastMoveDx = lmdx;
        this.lastMoveDy = lmdy;
    }



    containsPoint(x: number, y: number) {
        if (!this.displayObject.getBounds().contains(x, y)) return false;

        if (this.hitPolygonInitial == null) return true;

        if (this.hitPolygonDirty) this.transformHitPolygon();
        return polygonEnthältPunkt(this.hitPolygonTransformed, { x: x, y: y });
    }

    transformHitPolygon() {
        this.displayObject.updateTransform();
        // let p = new PIXI.Point(this.centerXInitial, this.centerYInitial);
        // this.displayObject.transform.worldTransform.apply(p, p);

        this.hitPolygonTransformed = [];
        let m = this.displayObject.transform.worldTransform;
        for (let p of this.hitPolygonInitial) {
            this.hitPolygonTransformed.push({
                x: (m.a * p.x) + (m.c * p.y) + m.tx,
                y: (m.b * p.x) + (m.d * p.y) + m.ty
            });
        }
        this.setHitPolygonDirty(false);

    }

    isOutsideView() {
        let bounds = this.displayObject.getBounds(true);
        let wh = this.worldHelper;
        return bounds.right < wh.currentLeft || bounds.left > wh.currentLeft + wh.currentWidth
            || bounds.bottom < wh.currentTop || bounds.top > wh.currentTop + wh.currentHeight;
    }

    defineCenter(x: number, y: number) {
        let p = new PIXI.Point(x, y);
        this.displayObject.transform.worldTransform.applyInverse(p, p);
        this.centerXInitial = p.x;
        this.centerYInitial = p.y;
    }

    defineCenterRelative(x: number, y: number) {
        let bounds = this.displayObject.getBounds(false);
        this.defineCenter(bounds.left + bounds.width * x, bounds.top + bounds.height * y);
    }

    move(dx: number, dy: number) {

        if (dx != 0 || dy != 0) {
            this.lastMoveDx = dx;
            this.lastMoveDy = dy;
        }

        this.displayObject.localTransform.translate(dx, dy);
        //@ts-ignore
        this.displayObject.transform.onChange();
        this.displayObject.updateTransform();
        this.setHitPolygonDirty(true);
    }

    forward(distance: number) {
        let dx = distance * Math.cos(this.directionRad);
        let dy = -distance * Math.sin(this.directionRad);
        this.move(dx, dy);
    }

    rotate(angleInDeg: number, cX?: number, cY?: number) {

        if (cX == null) {
            let p = new PIXI.Point(this.centerXInitial, this.centerYInitial);
            this.displayObject.localTransform.apply(p, p);
            cX = p.x;
            cY = p.y;
        } else {
            let p = new PIXI.Point(cX, cY);
            this.displayObject.updateTransform();       // necessary if world coordinate system is scaled
            this.displayObject.transform.worldTransform.applyInverse(p, p);
            this.displayObject.localTransform.apply(p, p);
            cX = p.x;
            cY = p.y;
        }

        this.displayObject.localTransform.translate(-cX, -cY);
        this.displayObject.localTransform.rotate(-angleInDeg / 180 * Math.PI);
        this.displayObject.localTransform.translate(cX, cY);
        //@ts-ignore
        this.displayObject.transform.onChange();
        this.displayObject.updateTransform();
        this.setHitPolygonDirty(true);

        this.angle += angleInDeg;
        this.directionRad += angleInDeg / 180 * Math.PI;
    }

    mirrorXY(scaleX: number, scaleY: number) {
        let cX: number, cY: number;

        let p = new PIXI.Point(this.centerXInitial, this.centerYInitial);
        this.displayObject.localTransform.apply(p, p);
        cX = p.x;
        cY = p.y;

        this.displayObject.localTransform.translate(-cX, -cY);
        this.displayObject.localTransform.scale(scaleX, scaleY);
        this.displayObject.localTransform.translate(cX, cY);
        //@ts-ignore
        this.displayObject.transform.onChange();
        this.displayObject.updateTransform();

        this.setHitPolygonDirty(true);

    }


    scale(factor: number, cX?: number, cY?: number) {

        if (cX == null) {
            let p = new PIXI.Point(this.centerXInitial, this.centerYInitial);
            this.displayObject.localTransform.apply(p, p);
            cX = p.x;
            cY = p.y;
        } else {
            let p = new PIXI.Point(cX, cY);
            this.displayObject.transform.worldTransform.applyInverse(p, p);
            this.displayObject.localTransform.apply(p, p);
            cX = p.x;
            cY = p.y;
        }

        this.displayObject.localTransform.translate(-cX, -cY);
        this.displayObject.localTransform.scale(factor, factor);
        this.displayObject.localTransform.translate(cX, cY);
        //@ts-ignore
        this.displayObject.transform.onChange();
        this.displayObject.updateTransform();

        this.setHitPolygonDirty(true);

        this.scaleFactor *= factor;

    }

    public getCenterX(): number {
        let p = new PIXI.Point(this.centerXInitial, this.centerYInitial);
        this.displayObject.updateTransform();
        // this.displayObject.localTransform.apply(p, p);
        this.displayObject.transform.worldTransform.apply(p, p);
        return p.x;
    }

    public getCenterY(): number {
        let p = new PIXI.Point(this.centerXInitial, this.centerYInitial);
        this.displayObject.updateTransform();
        this.displayObject.transform.worldTransform.apply(p, p);
        return p.y;
    }

    public abstract render(): void;

    public destroy(): void {
        super.destroy();
        if (this.belongsToGroup != null) {
            this.belongsToGroup.remove(this.runtimeObject);
        } else {
            let index = this.worldHelper.shapes.indexOf(this);
            if (index >= 0) this.worldHelper.shapes.splice(index, 1);
        }

        let index1 = this.worldHelper.shapesNotAffectedByWorldTransforms.indexOf(this);
        if (index1 >= 0) {
            this.worldHelper.shapesNotAffectedByWorldTransforms.splice(index1, 1);
        }

    }

    getCollidingShapes(groupHelper: GroupHelper, shapeType: Type): any {
        let collidingShapes: Value[] = [];
        for (let shape of groupHelper.shapes) {
            let shapeHelper: ShapeHelper = <ShapeHelper>shape.intrinsicData["Actor"];
            if (shapeHelper.collidesWith(this)) {
                collidingShapes.push({
                    type: shapeType,
                    value: shape
                });
            }
        }

        return collidingShapes;
    }

    abstract getCopy(klass: Klass): RuntimeObject;

    getHitPolygon(vector2Class: Klass): Value[] {

        if (this.hitPolygonDirty) {
            this.transformHitPolygon();
        }

        let ret: Value[] = [];
        for (let p of this.hitPolygonTransformed) {
            let ro = new RuntimeObject(vector2Class);
            ro.attributes = [{ type: doublePrimitiveType, value: p.x }, { type: doublePrimitiveType, value: p.y }];
            ret.push({ type: vector2Class, value: ro });
        }

        return ret;
    }

    setStatic(isStatic: boolean) {
        let list = this.worldHelper.shapesNotAffectedByWorldTransforms;
        if (isStatic) {
            list.push(this);
        } else {
            let index = list.indexOf(this);
            if (index >= 0) {
                list.splice(index, 1);
            }
        }
    }

    getParentGroup(): RuntimeObject {
        return this.belongsToGroup?.runtimeObject || null
    }

    public borderContainsPoint(x: number, y: number, color: number = -1): boolean {
        return false;
    }

}
