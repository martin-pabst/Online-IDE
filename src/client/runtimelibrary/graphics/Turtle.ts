import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { doublePrimitiveType, intPrimitiveType, booleanPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist, Value } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { FilledShapeHelper } from "./FilledShape.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import { polygonBerührtPolygon } from "../../tools/MatheTools.js";
import { ShapeHelper } from "./Shape.js";

export class TurtleClass extends Klass {

    constructor(module: Module) {

        super("Turtle", module, "Turtle-Klasse zum Zeichnen von Streckenzügen oder gefüllten Figuren. Wichtig sind vor allem die Methoden forward(double length) und turn(double angleDeg), die die Turtle nach vorne bewegen bzw. ihre Blickrichtung ändern.");

        this.setBaseClass(<Klass>module.typeStore.getType("FilledShape"));

        this.addMethod(new Method("Turtle", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;

                let ph = new TurtleHelper(x, y, false, module.main.getInterpreter(), o);
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
    angle: number = 0; // in Rad

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

    turtleX: number = -1;
    turtleY: number = -1;
    lastTurtleAngle: number = 0; // angle in Rad

    renderJobPresent: boolean = false;

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
        console.log("MoveTo: " + xStart + ", " + yStart);
        this.turtleX = xStart;
        this.turtleY = yStart;

        this.turtle = new PIXI.Graphics();
        container.addChild(this.turtle);
        this.turtle.visible = this.showTurtle;
        this.initTurtle(xStart, yStart, this.angle);


        // let g: PIXI.Graphics = <any>this.displayObject;

        this.worldHelper.stage.addChild(this.displayObject);

        this.addToDefaultGroup();

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

    turn(angle: number) {
        this.angle -= angle / 180 * Math.PI;
        let lastLineElement: LineElement = this.lineElements[this.lineElements.length - 1];
        this.moveTurtleTo(lastLineElement.x, lastLineElement.y, this.angle);
    }

    rotate(angleInDegrees: number, cx?: number, cy?: number) {
        this.turn(this.angle);
        let lastLineElement = this.lineElements[this.lineElements.length - 1];
        this.moveTurtleTo(lastLineElement.x, lastLineElement.y, this.angle);
        super.rotate(angleInDegrees, cx, cy);
    }

    getCopy(klass: Klass): RuntimeObject {

        let ro: RuntimeObject = new RuntimeObject(klass);
        let rh: TurtleHelper = new TurtleHelper(this.lineElements[0].x, this.lineElements[0].y,
            this.showTurtle, this.worldHelper.interpreter, ro);
        ro.intrinsicData["Actor"] = rh;

        rh.copyFrom(this);
        rh.render();

        return ro;
    }

    forward(length: number) {

        let lastLineElement: LineElement = this.lineElements[this.lineElements.length - 1];
        let newLineElement: LineElement = {
            x: lastLineElement.x + length * Math.cos(this.angle),
            y: lastLineElement.y + length * Math.sin(this.angle),
            color: this.penIsDown ? this.borderColor : null,
            alpha: this.borderAlpha,
            lineWidth: this.borderWidth
        }

        this.lineElements.push(newLineElement);

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

        // don't render more frequent than every 1/100 s
        if (!this.renderJobPresent) {
            this.renderJobPresent = true;
            setTimeout(() => {
                this.renderJobPresent = false;
                this.render();
                this.moveTurtleTo(newLineElement.x, newLineElement.y, this.angle);
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
        this.moveTurtleTo(newLineElement.x, newLineElement.y, this.angle);
    }


    initTurtle(x: number, y: number, angle: number): void {
        this.turtle.clear();
        this.turtle.lineStyle(3, 0xff0000, 1, 0.5);
        this.turtle.moveTo(x, y);

        let vx = Math.cos(angle);
        let vy = Math.sin(angle);

        let vxp = -Math.sin(angle);
        let vyp = Math.cos(angle);

        let lengthForward = this.turtleSize / 2;
        let lengthBackward = this.turtleSize / 4;
        let lengthBackwardP = this.turtleSize / 4;

        this.turtle.moveTo(x + vx * lengthForward, y + vy * lengthForward);
        this.turtle.lineTo(x - vx * lengthBackward + vxp * lengthBackwardP, y - vy * lengthBackward + vyp * lengthBackwardP);
        this.turtle.lineTo(x - vx * lengthBackward - vxp * lengthBackwardP, y - vy * lengthBackward - vyp * lengthBackwardP);
        this.turtle.lineTo(x + vx * lengthForward, y + vy * lengthForward);
    }

    moveTurtleTo(x: number, y: number, angle: number){
        this.turtle.localTransform.translate(-this.turtleX, -this.turtleY);
        this.turtle.localTransform.rotate(angle - this.lastTurtleAngle);
        this.turtle.localTransform.translate(x, y);
        //@ts-ignore
        this.turtle.transform.onChange();
        this.turtle.updateTransform();

        this.lastTurtleAngle = this.angle;
        this.turtleX = x;
        this.turtleY = y;
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
        // console.log("MoveTo: " + firstPoint.x + ", " + firstPoint.y);

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

        return polygonBerührtPolygon(this.hitPolygonTransformed, shapeHelper.hitPolygonTransformed);

    }

    setupInitialHitPolygon() {
        this.hitPolygonInitial = this.lineElements.map((le) => { return { x: le.x, y: le.y } });
    }

    clear() {
        this.lineElements = [];
        this.lineElements.push({
            x: 100,
            y: 200,
            color: 0,
            alpha: 1,
            lineWidth: 1
        });
        this.calculateCenter();

        this.hitPolygonInitial = [];

        this.angle = 0;
        this.borderColor = 0;
        this.turtleSize = 40;
        this.render();
        this.moveTurtleTo(100, 200, 0);
    }


    touchesAtLeastOneFigure(): boolean {
        let lastLineElement: LineElement = this.lineElements[this.lineElements.length - 1];
        let x = lastLineElement.x;
        let y = lastLineElement.y;

        for (let sh of this.worldHelper.shapes) {
            if (sh.containsPoint(x, y) && sh != this) {
                return true;
            }
        }
    }

    touchesColor(farbe: number): boolean {
        let lastLineElement: LineElement = this.lineElements[this.lineElements.length - 1];
        let x = lastLineElement.x;
        let y = lastLineElement.y;

        for (let sh of this.worldHelper.shapes) {
            if (sh.containsPoint(x, y) && sh != this) {
                if (sh instanceof FilledShapeHelper && sh.fillColor == farbe) return true;
                // if(sh instanceof TurtleHelper) TODO
            }
        }
    }

    touchesShape(shape: ShapeHelper) {
        let lastLineElement: LineElement = this.lineElements[this.lineElements.length - 1];
        let x = lastLineElement.x;
        let y = lastLineElement.y;
        return shape.containsPoint(x, y);
    }



}
