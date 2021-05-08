import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { doublePrimitiveType, intPrimitiveType, booleanPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist, Value } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { FilledShapeHelper } from "./FilledShape.js";
import { ArrayType } from "../../compiler/types/Array.js";
import { Interpreter } from "../../interpreter/Interpreter.js";

export class PolygonClass extends Klass {

    constructor(module: Module) {

        super("Polygon", module, "Wahlweise geschlossenes Polygon (mit Füllung und Rand) oder offener Streckenzug");

        this.setBaseClass(<Klass>module.typeStore.getType("FilledShape"));

        // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));

        this.addMethod(new Method("Polygon", new Parameterlist([
            { identifier: "closeAndFill", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "points", type: new ArrayType(doublePrimitiveType), declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let closeAndFill: boolean = parameters[1].value;
                let points: Value[] = parameters[2].value;

                let pointsNumber: number[] = [];
                points.forEach(v => pointsNumber.push(v.value));

                let ph = new PolygonHelper(pointsNumber, closeAndFill, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = ph;

            }, false, false, 'Instanziert ein neues Polygon. Die Punkte werden als Array von double-Werten der Form {x1, y1, x2, y2, ...} übergeben.', true));

        this.addMethod(new Method("Polygon", new Parameterlist([
            { identifier: "closeAndFill", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "points", type: new ArrayType(doublePrimitiveType), declaration: null, usagePositions: null, isFinal: true, isEllipsis: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let closeAndFill: boolean = parameters[1].value;
                let points: Value[] = parameters[2].value;

                let pointsNumber: number[] = [];
                points.forEach(v => pointsNumber.push(v.value));

                let ph = new PolygonHelper(pointsNumber, closeAndFill, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = ph;

            }, false, false, 'Instanziert ein neues Polygon. Die Punkte werden als double-Werte der Form x1, y1, x2, y2, ... übergeben.', true));

        this.addMethod(new Method("Polygon", new Parameterlist([
            { identifier: "closeAndFill", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let closeAndFill: boolean = parameters[1].value;

                let pointsNumber: number[] = [];

                let ph = new PolygonHelper(pointsNumber, closeAndFill, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = ph;

            }, false, false, 'Instanziert ein neues Polygon ohne Punkte.', true));


        this.addMethod(new Method("addPoint", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let sh: PolygonHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("addPoint")) return;

                sh.addPoint(x, y);

            }, false, false, 'Fügt dem Polygon einen Punkt hinzu."', false));

        this.addMethod(new Method("addPoints", new Parameterlist([
            { identifier: "points", type: new ArrayType(doublePrimitiveType), declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let points: Value[] = parameters[1].value;
                let sh: PolygonHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("addPoints")) return;

                let p: { x: number, y: number }[];

                for (let i = 0; i < points.length - 1; i += 2) {
                    sh.addPoint(points[i].value, points[i + 1].value, i >= points.length - 2);
                }

            }, false, false, 'Fügt dem Polygon mehrere Punkte hinzu. Diese werden in einem double[] übergeben, das abwechselnd die x- und y-Koordinaten enthält."', false));

        this.addMethod(new Method("insertPoint", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let index: number = parameters[3].value;
                let sh: PolygonHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("insertPoint")) return;

                sh.insertPoint(x, y, index);

            }, false, false, 'Fügt dem Polygon einen Punkt als "index-ter" Punkt hinzu. index == 0 => ganz am Anfang; index == Anzahl der bisherigen Punkte => ganz am Ende;"', false));

        this.addMethod(new Method("movePointTo", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let index: number = parameters[3].value;
                let sh: PolygonHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("insertPoint")) return;

                sh.movePointTo(x, y, index);

            }, false, false, 'schiebt den index-ten Punkt nach (x, y). index == 0 => erster Punkt, index == 1 => zweiter Punkt usw.', false));

        this.addMethod(new Method("copy", new Parameterlist([
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: PolygonHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("copy")) return;

                return sh.getCopy(<Klass>o.class);

            }, false, false, 'Erstellt eine Kopie des Polygon-Objekts und git sie zurück.', false));


    }

}

export class PolygonHelper extends FilledShapeHelper {

    constructor(points: number[], private closeAndFill: boolean,
        interpreter: Interpreter, runtimeObject: RuntimeObject) {
        super(interpreter, runtimeObject);

        let xSum = 0; let ySum = 0;
        this.hitPolygonInitial = [];

        for (let i = 0; i < points.length;) {
            let x = points[i++];
            let y = points[i++];
            xSum += x;
            ySum += y;
            this.hitPolygonInitial.push({ x: x, y: y });
        }

        if (points.length > 1) {
            this.centerXInitial = xSum / this.hitPolygonInitial.length;
            this.centerYInitial = ySum / this.hitPolygonInitial.length;
        }

        if (!closeAndFill) {
            this.borderColor = 0x0000ff;
        }

        this.render();
        this.addToDefaultGroup();

    }

    getCopy(klass: Klass): RuntimeObject {

        let ro: RuntimeObject = new RuntimeObject(klass);
        let rh: PolygonHelper = new PolygonHelper([], this.closeAndFill, this.worldHelper.interpreter, ro);
        ro.intrinsicData["Actor"] = rh;

        rh.copyFrom(this);
        rh.render();

        return ro;
    }


    render(): void {

        let g: PIXI.Graphics = <any>this.displayObject;

        if (this.displayObject == null) {
            g = new PIXI.Graphics();
            this.displayObject = g;
            this.worldHelper.stage.addChild(g);

        } else {
            g.clear();
        }

        if (this.fillColor != null && this.closeAndFill) {
            g.beginFill(this.fillColor, this.fillAlpha);
        }
        if (this.borderColor != null) {
            g.lineStyle(this.borderWidth, this.borderColor, this.borderAlpha, 0.5)
        }

        if (this.hitPolygonInitial.length > 0) {
            g.moveTo(this.hitPolygonInitial[0].x, this.hitPolygonInitial[0].y);
            for (let i = 1; i < this.hitPolygonInitial.length; i++) {
                g.lineTo(this.hitPolygonInitial[i].x, this.hitPolygonInitial[i].y);
            }
        }

        if (this.closeAndFill) {
            g.closePath();
        }

        if (this.fillColor != null && this.closeAndFill) {
            g.endFill();
        }
    };

    addPoint(x: number, y: number, render: boolean = true) {
        let p = new PIXI.Point(x, y);
        this.displayObject.transform.worldTransform.applyInverse(p, p);
        this.hitPolygonInitial.push({ x: p.x, y: p.y });
        this.hitPolygonDirty = true;
        if (render) this.render();
    }

    insertPoint(x: number, y: number, index: number) {
        if (index < 0) index = 0;
        if (index > this.hitPolygonInitial.length) index = this.hitPolygonInitial.length;
        let p = new PIXI.Point(x, y);
        this.displayObject.transform.worldTransform.applyInverse(p, p);
        this.hitPolygonInitial.splice(index, 0, { x: p.x, y: p.y });
        this.hitPolygonDirty = true;
        this.render();
    }

    movePointTo(x: number, y: number, index: number) {
        if (index < 0) index = 0;
        if (index > this.hitPolygonInitial.length) index = this.hitPolygonInitial.length;
        if(this.hitPolygonInitial.length == 0) return;
        let p = new PIXI.Point(x, y);
        this.displayObject.transform.worldTransform.applyInverse(p, p);
        this.hitPolygonInitial[index].x = p.x;
        this.hitPolygonInitial[index].y = p.y;
        this.hitPolygonDirty = true;
        this.render();
    }

    setPoint(x: number, y: number, index: number) {
        if (index == 0 || index == 1) {
            this.hitPolygonInitial[index] = { x: x, y: y };
            this.hitPolygonDirty = true;
            this.render();
        }
    }

    setPoints(x1: number, y1: number, x2: number, y2: number) {
        this.hitPolygonInitial = [{ x: x1, y: y1 }, { x: x2, y: y2 }];
        this.hitPolygonDirty = true;
        this.render();
    }

    setAllPointsUntransformed(points: number[]) {
        this.hitPolygonInitial = [];
        for (let i = 0; i < points.length; i += 2) {
            this.hitPolygonInitial.push({ x: points[i], y: points[i + 1] })
        }
        this.hitPolygonDirty = true;
        this.render();
    }

}
