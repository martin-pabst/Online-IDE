import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { doublePrimitiveType, intPrimitiveType, booleanPrimitiveType, stringPrimitiveType, voidPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist, Value } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { FilledShapeHelper } from "./FilledShape.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import { Punkt, abstandPunktZuStrecke, polygonBerührtPolygon, polygonEnthältPunkt, steckenzugSchneidetStreckenzug, streckenzugEnthältPunkt } from "../../tools/MatheTools.js";
import { ShapeHelper } from "./Shape.js";
import * as PIXI from 'pixi.js';
import { ColorHelper } from "./ColorHelper.js";

export class TurtleClass extends Klass {

    constructor(module: Module) {

        super("Turtle", module, "Turtle-Klasse zum Zeichnen von Streckenzügen oder gefüllten Figuren. Wichtig sind vor allem die Methoden forward(double length) und turn(double angleDeg), die die Turtle nach vorne bewegen bzw. ihre Blickrichtung ändern.");

        this.setBaseClass(<Klass>module.typeStore.getType("FilledShape"));

        this.addMethod(new Method("Turtle", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let ph = new TurtleHelper(100, 200, true, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = ph;

            }, false, false, 'Instanziert ein neues Turtle-Objekt ohne Punkte. Die Turtle blickt anfangs nach rechts. Am Ende des Streckenzugs wird eine "Schildkröte" (kleines Dreieck) gezeichnet.', true));

        this.addMethod(new Method("Turtle", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;

                let ph = new TurtleHelper(x, y, true, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = ph;

            }, false, false, 'Instanziert ein neues Turtle-Objekt ohne Punkte. Die Turtle blickt anfangs nach rechts. Am Ende des Streckenzugs wird eine "Schildkröte" (kleines Dreieck) gezeichnet.', true));


        this.addMethod(new Method("Turtle", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "showTurtle", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let showTurtle: boolean = parameters[3].value;

                let ph = new TurtleHelper(x, y, showTurtle, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = ph;

            }, false, false, 'Instanziert ein neues Turtle-Objekt ohne Punkte. Die Turtle blickt anfangs nach rechts. Falls showTurtle == true, wird am Ende des Streckenzuges eine "Schildkröte" (kleines Dreieck) gezeichnet.', true));


        this.addMethod(new Method("forward", new Parameterlist([
            { identifier: "length", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let length: number = parameters[1].value;
                let sh: TurtleHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("forward")) return;

                sh.forward(length);

            }, false, false, 'Weist die Turtle an, die angegebene Länge vorwärts zu gehen. Ihr zurückgelegter Weg wird als gerade Strecke mit der aktuellen BorderColor gezeichnet. Mit setBorderColor(null) bewirkst Du, dass ein Stück ihres Weges nicht gezeichnet wird.', false));

        this.addMethod(new Method("turn", new Parameterlist([
            { identifier: "angleInDeg", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let angle: number = parameters[1].value;
                let sh: TurtleHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("turn")) return;

                sh.turn(angle);

            }, false, false, 'Bewirkt, dass sich die Turtle um den angegebenen Winkel (in Grad!) dreht, d.h. ihre Blickrichtung ändert. Ein positiver Winkel bewirkt eine Drehung gegen den Uhrzeigersinn. Diese Methode wirkt sich NICHT auf die bisher gezeichneten Strecken aus. Willst Du alles bisher Gezeichnete inklusive Turtle drehen, so nutze die Methode rotate.', false));

        this.addMethod(new Method("penUp", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TurtleHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("penUp")) return;

                sh.penIsDown = false;

            }, false, false, 'Bewirkt, dass die Turtle beim Gehen ab jetzt nicht mehr zeichnet.', false));

        this.addMethod(new Method("penDown", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TurtleHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("penDown")) return;

                sh.penIsDown = true;

            }, false, false, 'Bewirkt, dass die Turtle beim Gehen ab jetzt wieder zeichnet.', false));

        this.addMethod(new Method("closeAndFill", new Parameterlist([
            { identifier: "closeAndFill", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let closeAndFill: boolean = parameters[1].value;
                let sh: TurtleHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("closeAndFill")) return;

                sh.closeAndFill(closeAndFill);

            }, false, false, 'closeAndFill == true bewirkt, dass das von der Turtlezeichnung umschlossene Gebiet gefüllt wird.', false));

        this.addMethod(new Method("showTurtle", new Parameterlist([
            { identifier: "showTurtle", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let showTurtle: boolean = parameters[1].value;
                let sh: TurtleHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("showTurtle")) return;

                sh.setShowTurtle(showTurtle);

            }, false, false, 'showTurtle == true bewirkt, dass am Ort der Turtle ein rotes Dreieck gezeichnet wird.', false));

        this.addMethod(new Method("copy", new Parameterlist([
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TurtleHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("copy")) return;

                return sh.getCopy(<Klass>o.class);

            }, false, false, 'Erstellt eine Kopie des Turtle-Objekts und gibt es zurück.', false));

        this.addMethod(new Method("clear", new Parameterlist([
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TurtleHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("clear")) return;

                return sh.clear();

            }, false, false, 'Löscht alle bis jetzt mit der Turtle gezeichneten Strecken.', false));

        this.addMethod(new Method("collidesWithBorderColor", new Parameterlist([
            { identifier: "borderColor", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let borderColor: number = parameters[1].value;
                let sh: TurtleHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("collidesWithBorderColor")) return;

                return sh.collidesWithBorderColor(borderColor);

            }, false, false, 'Gibt genau dann true zurück, wenn sich der "Mittelpunkt" des Turtle-Dreiecks auf dem Rand eines anderen graphischen Objekts mit der angegebenen Farbe befindet.', false));

        this.addMethod(new Method("collidesWithBorderColor", new Parameterlist([
            { identifier: "color", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let borderColor: string = parameters[1].value;
                let sh: TurtleHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("collidesWithBorderColor")) return;

                let c = ColorHelper.parseColorToOpenGL(borderColor);

                return sh.collidesWithBorderColor(c.color);

            }, false, false, 'Gibt genau dann true zurück, wenn sich der "Mittelpunkt" des Turtle-Dreiecks auf dem Rand eines anderen graphischen Objekts mit der angegebenen Farbe befindet.', false));

        this.addMethod(new Method("getLastSegmentLength", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TurtleHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getLastSegmentLength")) return;

                return sh.getLastSegmentLength();

            }, false, false, 'Gibt die Länge des letzten gezeichneten Streckenzugs zurück.', false));

        this.addMethod(new Method("getX", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TurtleHelper = o.intrinsicData["Actor"];

                return sh.getPosition().x;

            }, false, false, 'Gibt die x-Koordinate der aktuellen Turtleposition zurück.', false));

        this.addMethod(new Method("getY", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TurtleHelper = o.intrinsicData["Actor"];

                return sh.getPosition().y;

            }, false, false, 'Gibt die y-Koordinate der aktuellen Turtleposition zurück.', false));

        this.addMethod(new Method("moveTo", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TurtleHelper = o.intrinsicData["Actor"];
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;

                if (sh.testdestroyed("moveTo")) return;

                sh.moveTo(x, y);

            }, false, false, "Bewirkt, dass die Turtle zum Punkt (x, y) geht.", false));



    }

}

type LineElement = {
    x: number,
    y: number,
    color: number,
    alpha: number,
    lineWidth: number
}

export class TurtleHelper extends FilledShapeHelper {

    lineElements: LineElement[] = [];
    turtleAngleDeg: number = 0; // in Rad

    isFilled: boolean = false;

    turtle: PIXI.Graphics;
    lineGraphic: PIXI.Graphics;

    xSum: number = 0;
    ySum: number = 0;

    initialHitPolygonDirty: boolean = true;

    turtleSize: number = 40;

    penIsDown: boolean = true;

    lastLineWidth: number = 0;
    lastColor: number = 0;
    lastAlpha: number = 0;

    lastTurtleAngleDeg: number = 0; // angle in Rad

    renderJobPresent: boolean = false;

    angleHasChanged: boolean = true;
    lastLengthSign: number = -2;

    constructor(xStart: number, yStart: number, private showTurtle: boolean,
        interpreter: Interpreter, runtimeObject: RuntimeObject) {
        super(interpreter, runtimeObject);

        this.lineElements.push({
            x: xStart,
            y: yStart,
            color: 0,
            alpha: 1,
            lineWidth: 1
        });
        this.calculateCenter();

        this.borderColor = 0xffffff;

        this.hitPolygonInitial = [];

        let container = new PIXI.Container();
        this.displayObject = container;

        this.lineGraphic = new PIXI.Graphics();
        container.addChild(this.lineGraphic);
        this.lineGraphic.moveTo(xStart, yStart);

        this.turtle = new PIXI.Graphics();
        container.addChild(this.turtle);
        this.turtle.visible = this.showTurtle;
        this.initTurtle(0, 0, this.turtleAngleDeg);
        this.moveTurtleTo(xStart, yStart, this.turtleAngleDeg);


        // let g: PIXI.Graphics = <any>this.displayObject;

        this.worldHelper.stage.addChild(this.displayObject);

        this.addToDefaultGroupAndSetDefaultVisibility();

    }

    calculateCenter() {
        let length = this.lineElements.length;
        let lastLineElement = this.lineElements[length - 1];
        this.xSum += lastLineElement.x;
        this.ySum += lastLineElement.y;
        this.centerXInitial = this.xSum / length;
        this.centerYInitial = this.ySum / length;
    }

    closeAndFill(closeAndFill: boolean) {
        if (closeAndFill != this.isFilled) {
            this.isFilled = closeAndFill;
            this.render();
            this.initialHitPolygonDirty = true;
        }
    }

    setShowTurtle(show: boolean) {
        this.turtle.visible = show;
    }

    turn(angleDeg: number) {
        this.angleHasChanged = true;
        this.turtleAngleDeg -= angleDeg;
        if (Math.abs(this.turtleAngleDeg) > 360) {
            this.turtleAngleDeg -= Math.floor(this.turtleAngleDeg / 360) * 360;
        }
        let lastLineElement: LineElement = this.lineElements[this.lineElements.length - 1];
        this.moveTurtleTo(lastLineElement.x, lastLineElement.y, this.turtleAngleDeg);
    }

    rotate(angleInDegrees: number, cx?: number, cy?: number) {
        // this.turn(angleInDegrees);
        super.rotate(angleInDegrees, cx, cy);
    }

    getCopy(klass: Klass): RuntimeObject {

        let ro: RuntimeObject = new RuntimeObject(klass);
        let rh: TurtleHelper = new TurtleHelper(this.lineElements[0].x, this.lineElements[0].y,
            this.showTurtle, this.worldHelper.interpreter, ro);
        ro.intrinsicData["Actor"] = rh;

        rh.turtleAngleDeg = this.turtleAngleDeg;

        rh.copyFrom(this);
        rh.render();

        return ro;
    }

    newTurtleX: number;
    newTurtleY: number;
    newAngleDeg: number;

    forward(length: number) {

        if(Math.sign(length) != this.lastLengthSign){
            this.angleHasChanged = true;
        }

        this.lastLengthSign = Math.sign(length);

        let lastLineElement: LineElement = this.lineElements[this.lineElements.length - 1];

        let newBorderColor = this.penIsDown ? this.borderColor : null;
        let turtleAngleRad = this.turtleAngleDeg / 180.0 * Math.PI;

        let newLineElement: LineElement;

        if (!this.angleHasChanged && lastLineElement.color == newBorderColor &&
            lastLineElement.alpha == this.borderAlpha && lastLineElement.lineWidth == this.borderWidth) {
            lastLineElement.x += length * Math.cos(turtleAngleRad);
            lastLineElement.y += length * Math.sin(turtleAngleRad);
            newLineElement = lastLineElement;
        } else {
            newLineElement = {
                x: lastLineElement.x + length * Math.cos(turtleAngleRad),
                y: lastLineElement.y + length * Math.sin(turtleAngleRad),
                color: newBorderColor,
                alpha: this.borderAlpha,
                lineWidth: this.borderWidth
            }

            this.lineElements.push(newLineElement);
        }

        this.angleHasChanged = false;

        // if (this.isFilled) {
        //     this.render();
        // } else {
        //     if (this.borderColor != null) {
        //         // this.lineGraphic.moveTo(lastLineElement.x, lastLineElement.y);
        //         this.lineGraphic.lineStyle(this.borderWidth, this.borderColor, this.borderAlpha, 0.5);
        //         this.lineGraphic.lineTo(newLineElement.x, newLineElement.y);
        //         console.log("LineTo: " + newLineElement.x + ", " + newLineElement.y);
        //     } else {
        //         this.lineGraphic.moveTo(newLineElement.x, newLineElement.y);
        //         console.log("MoveTo: " + newLineElement.x + ", " + newLineElement.y);
        //     }
        // }

        this.hitPolygonDirty = true;
        this.initialHitPolygonDirty = true;
        this.calculateCenter();

        this.newTurtleX = newLineElement.x;
        this.newTurtleY = newLineElement.y;
        this.newAngleDeg = this.turtleAngleDeg;

        // don't render more frequent than every 1/100 s
        if (!this.renderJobPresent) {
            this.renderJobPresent = true;
            setTimeout(() => {
                this.renderJobPresent = false;
                this.render();
                this.moveTurtleTo(this.newTurtleX, this.newTurtleY, this.turtleAngleDeg);
            }, 100);
        }

    }

    moveTo(x: number, y: number) {
        let newLineElement: LineElement = {
            x: x,
            y: y,
            color: null,
            alpha: this.borderAlpha,
            lineWidth: this.borderWidth
        }

        this.lineElements.push(newLineElement);

        this.hitPolygonDirty = true;
        this.initialHitPolygonDirty = true;
        this.calculateCenter();
        this.moveTurtleTo(newLineElement.x, newLineElement.y, this.turtleAngleDeg);
    }


    initTurtle(x: number, y: number, angleDeg: number): void {
        this.turtle.clear();
        this.turtle.lineStyle(3, 0xff0000, 1, 0.5);
        this.turtle.moveTo(x, y);

        let angleRad = angleDeg / 180.0 * Math.PI;

        let vx = Math.cos(angleRad);
        let vy = Math.sin(angleRad);

        let vxp = -Math.sin(angleRad);
        let vyp = Math.cos(angleRad);

        let lengthForward = this.turtleSize / 2;
        let lengthBackward = this.turtleSize / 4;
        let lengthBackwardP = this.turtleSize / 4;

        this.turtle.moveTo(x + vx * lengthForward, y + vy * lengthForward);
        this.turtle.lineTo(x - vx * lengthBackward + vxp * lengthBackwardP, y - vy * lengthBackward + vyp * lengthBackwardP);
        this.turtle.lineTo(x - vx * lengthBackward - vxp * lengthBackwardP, y - vy * lengthBackward - vyp * lengthBackwardP);
        this.turtle.lineTo(x + vx * lengthForward, y + vy * lengthForward);
    }

    moveTurtleTo(x: number, y: number, angleDeg: number) {
        this.turtle.localTransform.identity();
        this.turtle.localTransform.rotate(angleDeg / 180.0 * Math.PI);
        this.turtle.localTransform.translate(x, y);

        // this.turtle.localTransform.translate(-this.turtleX, -this.turtleY);
        // this.turtle.localTransform.rotate((angleDeg - this.lastTurtleAngleDeg)/180.0*Math.PI);
        // this.turtle.localTransform.translate(x, y);
        //@ts-ignore
        this.turtle.transform.onChange();
        this.turtle.updateTransform();

        this.lastTurtleAngleDeg = this.turtleAngleDeg;
    }

    render(): void {

        let g: PIXI.Graphics = this.lineGraphic;

        this.lastLineWidth = 0;
        this.lastColor = 0;
        this.lastAlpha = 0;

        if (this.displayObject == null) {
            g = new PIXI.Graphics();
            this.displayObject = g;
            this.worldHelper.stage.addChild(g);

        } else {
            g.clear();
        }

        if (this.fillColor != null && this.isFilled) {
            g.beginFill(this.fillColor, this.fillAlpha);
        }

        let firstPoint = this.lineElements[0];
        g.moveTo(firstPoint.x, firstPoint.y);

        if (this.isFilled) {
            g.lineStyle(this.borderWidth, this.borderColor, this.borderAlpha, 0.5);
        }
        for (let i = 1; i < this.lineElements.length; i++) {
            let le: LineElement = this.lineElements[i];
            if (le.color != null) {
                if (!this.isFilled) {
                    if (le.lineWidth != this.lastLineWidth || le.color != this.lastColor || le.alpha != this.lastAlpha) {
                        g.lineStyle(le.lineWidth, le.color, le.alpha, 0.5)
                        this.lastLineWidth = le.lineWidth;
                        this.lastColor = le.color;
                        this.lastAlpha = le.alpha;
                    }
                }
                g.lineTo(le.x, le.y);
                // console.log("LineTo: " + le.x + ", " + le.y);
            } else {
                g.moveTo(le.x, le.y);
                // console.log("MoveTo: " + le.x + ", " + le.y);
            }
        }

        if (this.isFilled) {
            g.closePath();
        }

        if (this.fillColor != null && this.isFilled) {
            g.endFill();
        }
    };

    collidesWith(shapeHelper: any) {

        if (shapeHelper instanceof TurtleHelper && shapeHelper.initialHitPolygonDirty) {
            shapeHelper.setupInitialHitPolygon();
        }

        if (this.initialHitPolygonDirty) {
            this.setupInitialHitPolygon();
            this.transformHitPolygon();
            this.render();
        }

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

        if (shapeHelper.hitPolygonTransformed.length == 2 && !this.isFilled) {
            return steckenzugSchneidetStreckenzug(this.hitPolygonTransformed, shapeHelper.hitPolygonTransformed);
        }

        return polygonBerührtPolygon(this.hitPolygonTransformed, shapeHelper.hitPolygonTransformed);

    }

    setupInitialHitPolygon() {
        this.hitPolygonInitial = this.lineElements.map((le) => { return { x: le.x, y: le.y } });
    }

    clear(x: number = null, y: number = null, angle: number = null) {
        let lastLineElement = this.lineElements.pop();
        if (x == null) x = lastLineElement.x;
        if (y == null) y = lastLineElement.y;

        this.lineElements = [];

        this.lineElements.push({
            x: x,
            y: y,
            color: 0,
            alpha: 1,
            lineWidth: 1
        });
        this.calculateCenter();

        this.hitPolygonInitial = [];
        if (angle != null) {
            this.turtleAngleDeg = angle;
            this.angleHasChanged = true;
            this.lastTurtleAngleDeg = 0;
            this.borderColor = 0;
            this.turtleSize = 40;
        }
        this.render();
        if (angle != null) {
            this.moveTurtleTo(x, y, angle);
        }
    }


    touchesAtLeastOneFigure(): boolean {
        let lastLineElement: LineElement = this.lineElements[this.lineElements.length - 1];
        let x = lastLineElement.x;
        let y = lastLineElement.y;

        for (let sh of this.worldHelper.shapes) {
            if (sh != this && sh.containsPoint(x, y)) {
                return true;
            }
        }
        return false;
    }

    touchesColor(farbe: number): boolean {
        let lastLineElement: LineElement = this.lineElements[this.lineElements.length - 1];
        let x = lastLineElement.x;
        let y = lastLineElement.y;

        for (let sh of this.worldHelper.shapes) {
            if (sh != this && sh.containsPoint(x, y)) {
                if (sh instanceof FilledShapeHelper && sh.fillColor == farbe) return true;
                // if(sh instanceof TurtleHelper) TODO
            }
        } 
        return false;
    }

    touchesShape(shape: ShapeHelper) {
        let lastLineElement: LineElement = this.lineElements[this.lineElements.length - 1];
        let x = lastLineElement.x;
        let y = lastLineElement.y;
        return shape.containsPoint(x, y);
    }

    containsPoint(x: number, y: number) {

        if (this.initialHitPolygonDirty) {
            this.setupInitialHitPolygon();
            this.transformHitPolygon();
            this.render();
        }

        if (!this.displayObject.getBounds().contains(x, y)) return false;

        if (this.hitPolygonInitial == null) return true;

        if (this.hitPolygonDirty) this.transformHitPolygon();

        if (this.isFilled) {
            return polygonEnthältPunkt(this.hitPolygonTransformed, { x: x, y: y });
        } else {
            return streckenzugEnthältPunkt(this.hitPolygonTransformed, { x: x, y: y });
        }
    }

    public borderContainsPointExcludingLastLineElement(x: number, y: number, color: number = -1): boolean {

        let lastLineElement = this.lineElements.pop();
        let ret = this.borderContainsPoint(x, y, color);
        this.lineElements.push(lastLineElement);
        return ret;
    }


    public borderContainsPoint(x: number, y: number, color: number = -1): boolean {


        this.displayObject.updateTransform();

        let m = this.displayObject.transform.worldTransform;

        let transformIsIdentity = m.a == 1 && m.b == 0 && m.c == 0 && m.d == 1 && m.tx == 0 && m.ty == 0;

        let p: Punkt = { x: x, y: y };

        if (this.lineElements.length < 2) return false;

        let rightLe: LineElement = this.lineElements[0];

        let left: Punkt;
        let right: Punkt = rightLe;

        if (!transformIsIdentity) {
            right = {
                x: (m.a * right.x) + (m.c * right.y) + m.tx,
                y: (m.b * right.x) + (m.d * right.y) + m.ty
            }
        }

        for (let i = 0; i < this.lineElements.length - 1; i++) {

            left = right;
            rightLe = this.lineElements[i + 1];
            right = rightLe;

            if (!transformIsIdentity) {
                right = {
                    x: (m.a * right.x) + (m.c * right.y) + m.tx,
                    y: (m.b * right.x) + (m.d * right.y) + m.ty
                }
            }

            if (color != -1 && rightLe.color != color) continue;

            if (abstandPunktZuStrecke(left, right, p) <= rightLe.lineWidth / 2) return true;

        }

        return false;
    }


    collidesWithBorderColor(borderColor: number): boolean {
        let lastLineElement = this.lineElements[this.lineElements.length - 1];
        let x = lastLineElement.x;
        let y = lastLineElement.y;

        for (let sh of this.worldHelper.shapes) {
            if (sh == this) {
                if ((<TurtleHelper>sh).borderContainsPointExcludingLastLineElement(x, y, borderColor)) return true;
            } else {
                if (sh.borderContainsPoint(x, y, borderColor)) return true;
            }
        }

        return false;
    }

    getLastSegmentLength(): any {
        if (this.lineElements.length < 2) return 0;
        let l1 = this.lineElements[this.lineElements.length - 2];
        let l2 = this.lineElements[this.lineElements.length - 1];
        let dx = l2.x - l1.x;
        let dy = l2.y - l1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getPosition(): LineElement {
        return this.lineElements[this.lineElements.length - 1];
    }


}
