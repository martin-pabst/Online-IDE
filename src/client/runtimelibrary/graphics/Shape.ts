import { Klass, Visibility } from "../../compiler/types/Class.js";
import { Module } from "../../compiler/parser/Module.js";
import { Method, Parameterlist, Attribute, Value, Type } from "../../compiler/types/Types.js";
import { intPrimitiveType, doublePrimitiveType, voidPrimitiveType, booleanPrimitiveType, DoublePrimitiveType, stringPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { ArrayType } from "../../compiler/types/Array.js";
import { ActorHelper } from "./Actor.js";
import { WorldHelper, MouseListenerShapeData } from "./World.js";
import { Punkt, polygonEnthältPunkt, polygonBerührtPolygon, polygonBerührtPolygonExakt } from "../../tools/MatheTools.js";
import { ColorHelper } from "./ColorHelper.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import { GroupHelper, GroupClass } from "./Group.js";
import { CircleHelper } from "./Circle.js";
import { TurtleHelper } from "./Turtle.js";

export class ShapeClass extends Klass {

    constructor(module: Module) {

        super("Shape", module, "Basisklasse für alle graphischen Objekte die verschoben, skaliert und gedreht werden können");

        this.setBaseClass(<Klass>module.typeStore.getType("Actor"));
        this.isAbstract = true;

        // let matrixType = new ArrayType(doublePrimitiveType);
        let shapeType = module.typeStore.getType("Shape");
        let shapeArrayType = new ArrayType(shapeType);

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
                let angleInDeg: number = parameters[1].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("scale")) return;

                sh.scale(angleInDeg);

            }, false, false, "Streckt das Grafikobjekt um den angegebenen Faktor. Das Zentrum der Streckung ist der 'Mittelpunkt' des Objekts.", false));

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
                    module.main.getInterpreter().throwException("Der zweite Parameter der Methode collidesWith darf nicht null sein.");
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

        this.addMethod(new Method("setCenter", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ShapeHelper = o.intrinsicData["Actor"];
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;

                if (sh.testdestroyed("setCenter")) return;

                sh.move(x - sh.getCenterX(), y - sh.getCenterY());

            }, false, false, "Verschiebt das Grafikobjekt so, dass sich sein 'Mittelpunkt' an den angegebenen Koordinaten befindet.", false));

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

        this.addMethod(new Method("onMouseEnter", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            null, // no statements!
            false, false, "Wird aufgerufen, wenn sich der Mauspfeil in das Objekt hineinbewegt.", false));

        this.addMethod(new Method("onMouseLeave", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            null, // no statements!
            false, false, "Wird aufgerufen, wenn sich der Mauspfeil in das Objekt hineinbewegt.", false));

        this.addMethod(new Method("onMouseDown", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "key", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            null, // no statements!
            false, false, "Wird aufgerufen, wenn sich der Mauspfeil über dem Objekt befindet und der Benutzer eine Maustaste nach unten drückt.", false));

        this.addMethod(new Method("onMouseUp", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "key", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            null, // no statements!
            false, false, "Wird aufgerufen, wenn sich der Mauspfeil über dem Objekt befindet und der Benutzer eine Maustaste loslässt.", false));

        this.addMethod(new Method("onMouseMove", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            null, // no statements!
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

        // if !(this instanceof GroupHelper)
        if (!this["shapes"]) {
            this.worldHelper.shapes.push(this);
        }


    }

    setHitPolygonDirty(dirty: boolean) {
        this.hitPolygonDirty = dirty;
    }

    bringOnePlaneFurtherToFront() {
        let container: PIXI.Container = this.displayObject.parent;
        let highestIndex = container.children.length - 1;
        let index = container.getChildIndex(this.displayObject);
        if (index < highestIndex) {
            container.setChildIndex(this.displayObject, index + 1);
        }
    }

    bringOnePlaneFurtherToBack() {
        let container: PIXI.Container = this.displayObject.parent;
        let index = container.getChildIndex(this.displayObject);
        if (index > 0) {
            container.setChildIndex(this.displayObject, index - 1);
        }
    }

    bringToFront() {
        let container: PIXI.Container = this.displayObject.parent;
        let highestIndex = container.children.length - 1;
        container.setChildIndex(this.displayObject, highestIndex);
    }

    sendToBack() {
        let container: PIXI.Container = this.displayObject.parent;
        container.setChildIndex(this.displayObject, 0);
    }

    addToDefaultGroup() {
        if (this.worldHelper.defaultGroup != null) {
            this.runtimeObject.intrinsicData["Actor"] = this;
            let groupHelper = <GroupHelper>this.worldHelper.defaultGroup;
            groupHelper.add(this.runtimeObject);
        }
    }

    testdestroyed(method: string) {
        if (this.isDestroyed) {
            this.worldHelper.interpreter.throwException("Es wurde die Methode " + method + " eines bereits mit destroy() zerstörten Grafikobjekts aufgerufen.");
            return true;
        }
        return false;
    }

    tint(color: string) {
        let c = ColorHelper.parseColorToOpenGL(color);
        //@ts-ignore
        if (this.displayObject.tint) {
            //@ts-ignore
            this.displayObject.tint = c.color;
        }
        this.render();
    }

    setVisible(visible: boolean) {

        this.displayObject.visible = visible;
    }

    collidesWith(shapeHelper: ShapeHelper) {

        // if(!(this instanceof TurtleHelper) && (shapeHelper instanceof TurtleHelper)){
        if (!(this["lineElements"] != null) && (shapeHelper["lineElements"] != null)) {
            return shapeHelper.collidesWith(this);
        }

        this.displayObject.updateTransform();
        shapeHelper.displayObject.updateTransform();

        let bb = this.displayObject.getBounds();
        let bb1 = shapeHelper.displayObject.getBounds();

        if (bb.left > bb1.right || bb1.left > bb.right) return false;

        if (bb.top > bb1.bottom || bb1.top > bb.bottom) return false;

        if (shapeHelper["shapes"]) {
            return shapeHelper.collidesWith(this);
        }

        if (this.hitPolygonInitial == null || shapeHelper.hitPolygonInitial == null) return true;

        // boundig boxes collide, so check further:
        if (this.hitPolygonDirty) this.transformHitPolygon();
        if (shapeHelper.hitPolygonDirty) shapeHelper.transformHitPolygon();

        // return polygonBerührtPolygon(this.hitPolygonTransformed, shapeHelper.hitPolygonTransformed);
        return polygonBerührtPolygonExakt(this.hitPolygonTransformed, shapeHelper.hitPolygonTransformed, true, true);

    }

    containsPoint(x: number, y: number) {
        if (!this.displayObject.getBounds().contains(x, y)) return false;

        if (this.hitPolygonInitial == null) return true;

        if (this.hitPolygonDirty) this.transformHitPolygon();
        return polygonEnthältPunkt(this.hitPolygonTransformed, { x: x, y: y });
    }

    transformHitPolygon() {
        let p = new PIXI.Point(this.centerXInitial, this.centerYInitial);
        this.displayObject.updateTransform();
        this.displayObject.transform.worldTransform.apply(p, p);

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
        let screen = this.worldHelper.app.screen;
        return bounds.right < screen.left || bounds.left > screen.right
            || bounds.bottom < screen.top || bounds.top > screen.bottom;
    }

    move(dx: number, dy: number) {
        this.displayObject.localTransform.translate(dx, dy);
        this.displayObject.transform.onChange();
        this.displayObject.updateTransform();
        this.setHitPolygonDirty(true);
    }

    rotate(angleInDeg: number, cX?: number, cY?: number) {

        this.displayObject.updateTransform();
        if (cX == null) {
            let p = new PIXI.Point(this.centerXInitial, this.centerYInitial);
            this.displayObject.localTransform.apply(p, p);
            cX = p.x;
            cY = p.y;
        } else {
            let p = new PIXI.Point(cX, cY);
            this.worldHelper.stage.localTransform.apply(p, p);
            this.displayObject.transform.worldTransform.applyInverse(p, p);
            this.displayObject.localTransform.apply(p, p);
            cX = p.x;
            cY = p.y;
        }

        this.displayObject.localTransform.translate(-cX, -cY);
        this.displayObject.localTransform.rotate(-angleInDeg / 180 * Math.PI);
        this.displayObject.localTransform.translate(cX, cY);
        this.displayObject.transform.onChange();
        this.setHitPolygonDirty(true);

        this.angle += angleInDeg;
    }

    scale(factor: number, cX?: number, cY?: number) {

        this.displayObject.updateTransform();
        if (cX == null) {
            let p = new PIXI.Point(this.centerXInitial, this.centerYInitial);
            this.displayObject.localTransform.apply(p, p);
            cX = p.x;
            cY = p.y;
        } else {
            let p = new PIXI.Point(cX, cY);
            this.worldHelper.stage.localTransform.apply(p, p);
            this.displayObject.transform.worldTransform.applyInverse(p, p);
            this.displayObject.localTransform.apply(p, p);
            cX = p.x;
            cY = p.y;
        }

        this.displayObject.localTransform.translate(-cX, -cY);
        this.displayObject.localTransform.scale(factor, factor);
        this.displayObject.localTransform.translate(cX, cY);
        this.displayObject.transform.onChange();

        this.setHitPolygonDirty(true);

        this.scaleFactor *= factor;

    }

    public getCenterX(): number {
        let p = new PIXI.Point(this.centerXInitial, this.centerYInitial);
        this.displayObject.updateTransform();
        // this.displayObject.localTransform.apply(p, p);
        this.displayObject.transform.worldTransform.apply(p, p);
        this.worldHelper.stage.localTransform.applyInverse(p, p);
        return p.x;
    }

    public getCenterY(): number {
        let p = new PIXI.Point(this.centerXInitial, this.centerYInitial);
        this.displayObject.updateTransform();
        this.displayObject.transform.worldTransform.apply(p, p);
        this.worldHelper.stage.localTransform.applyInverse(p, p);
        return p.y;
    }

    public abstract render(): void;

    public destroy(): void {
        super.destroy();
        if (this.belongsToGroup != null) {
            this.belongsToGroup.remove(this.runtimeObject);
        }
        // if !(this instanceof GroupHelper)
        if (!this["shapes"]) {
            let index = this.worldHelper.shapes.indexOf(this);
            this.worldHelper.shapes.splice(index, 1);
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

}
