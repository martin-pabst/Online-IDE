import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { doublePrimitiveType, intPrimitiveType, booleanPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist, Value } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { FilledShapeHelper } from "./FilledShape.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import { polygonBerührtPolygon } from "../../tools/MatheTools.js";

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

            }, false, false, 'closeAndFill == true bewirkt, dass das von der Turtlezeichnung umschlossene Gebiet gefüllt wird.', false));

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
    angle: number = 0;

    isFilled: boolean = false;

    turtle: PIXI.Graphics;
    lineGraphic: PIXI.Graphics;

    xSum: number = 0;
    ySum: number = 0;

    initialHitPolygonDirty: boolean = true;

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
        this.calculateCenter;

        this.borderColor = 0xffffff;

        this.hitPolygonInitial = [];

        let container = new PIXI.Container();
        this.displayObject = container;

        this.lineGraphic = new PIXI.Graphics();
        container.addChild(this.lineGraphic);

        this.turtle = new PIXI.Graphics();
        container.addChild(this.turtle);
        this.turtle.visible = this.showTurtle;
        this.drawTurtle(xStart, yStart, this.angle);


        // let g: PIXI.Graphics = <any>this.displayObject;

        this.worldHelper.stage.addChild(this.displayObject);

        this.addToDefaultGroup();

    }

    calculateCenter(){
        let length = this.lineElements.length;
        let lastLineElement = this.lineElements[length - 1];
        this.xSum += lastLineElement.x;
        this.ySum += lastLineElement.y;
        this.centerXInitial = this.xSum/length;
        this.centerYInitial = this.ySum/length;
    }

    closeAndFill(closeAndFill: boolean) {
        if (closeAndFill != this.isFilled) {
            this.isFilled = closeAndFill;
            this.render();
            this.initialHitPolygonDirty = true;
        }
    }

    setShowTurtle(show: boolean){
        this.turtle.visible = show;
    }

    turn(angle: number) {
        this.angle -= angle / 180 * Math.PI;
    }

    rotate(angleInDegrees: number, cx?: number, cy?: number) {
        this.turn(this.angle);
        let lastLineElement = this.lineElements[this.lineElements.length - 1];
        this.drawTurtle(lastLineElement.x, lastLineElement.y, this.angle);
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
            color: this.borderColor,
            alpha: this.borderAlpha,
            lineWidth: this.borderWidth
        }

        this.lineElements.push(newLineElement);

        if (this.isFilled) {
            this.render();
        } else {
            if (this.borderColor != null) {
                this.lineGraphic.moveTo(lastLineElement.x, lastLineElement.y);
                this.lineGraphic.lineStyle(this.borderWidth, this.borderColor, this.borderAlpha, 0.5)
                this.lineGraphic.lineTo(newLineElement.x, newLineElement.y);
            }
        }

        this.hitPolygonDirty = true;
        this.initialHitPolygonDirty = true;
        this.calculateCenter();
        this.drawTurtle(newLineElement.x, newLineElement.y, this.angle);

    }

    drawTurtle(x: number, y: number, angle: number): void {
        this.turtle.clear();
        this.turtle.lineStyle(3, 0xff0000, 1, 0.5);
        this.turtle.moveTo(x, y);

        let vx = Math.cos(angle);
        let vy = Math.sin(angle);

        let vxp = -Math.sin(angle);
        let vyp = Math.cos(angle);

        let lengthForward = 20;
        let lengthBackward = 10;
        let lengthBackwardP = 10;

        this.turtle.moveTo(x + vx * lengthForward, y + vy * lengthForward);
        this.turtle.lineTo(x - vx * lengthBackward + vxp * lengthBackwardP, y - vy * lengthBackward + vyp * lengthBackwardP);
        this.turtle.lineTo(x - vx * lengthBackward - vxp * lengthBackwardP, y - vy * lengthBackward - vyp * lengthBackwardP);
        this.turtle.lineTo(x + vx * lengthForward, y + vy * lengthForward);
    }

    render(): void {

        let g: PIXI.Graphics = this.lineGraphic;

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
                    g.lineStyle(le.lineWidth, le.color, le.alpha, 0.5)
                }
                g.lineTo(le.x, le.y);
            } else {
                g.moveTo(le.x, le.y);
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

        if(shapeHelper instanceof TurtleHelper && shapeHelper.initialHitPolygonDirty){
            shapeHelper.setupInitialHitPolygon();
        }

        if(this.initialHitPolygonDirty){
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

    setupInitialHitPolygon(){
        this.hitPolygonInitial = this.lineElements.map((le) => {return {x: le.x, y: le.y}});
    }

}
