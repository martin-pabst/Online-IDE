import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { doublePrimitiveType, intPrimitiveType, booleanPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist, Value } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { FilledShapeHelper } from "./FilledShape.js";
import { ArrayType } from "../../compiler/types/Array.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import { ShapeHelper } from "./Shape.js";
import { convexhull } from "../../tools/ConvexHull.js";
import { GroupHelper } from "./Group.js";
import { polygonEnthältPunkt, streckenzugEnthältPunkt } from "../../tools/MatheTools.js";
import * as PIXI from 'pixi.js';


export class PolygonClass extends Klass {

    constructor(module: Module) {

        super("Polygon", module, "Wahlweise geschlossenes Polygon (mit Füllung und Rand) oder offener Streckenzug");

        this.setBaseClass(<Klass>module.typeStore.getType("FilledShape"));
        let shapeClass = <Klass>module.typeStore.getType("Shape");

        // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));

        this.addMethod(new Method("Polygon", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let pointsNumber: number[] = [];
                for(let i: number = 0; i < 6; i++){
                    let angle: number = Math.PI/3 * i;
                    let x: number = 100 + 50*Math.cos(angle);
                    let y: number = 100 - 50*Math.sin(angle);
                    pointsNumber.push(x, y);
                }

                let ph = new PolygonHelper(pointsNumber, true, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = ph;

            }, false, false, 'Instanziert ein neues Polygon. Der Standardkonstruktor ohne Parameter instanziert ein regelmäßiges Sechseck. \nTipp: Es gibt auch Konstruktoren, denen man ein Array von Koordinaten bzw. einzelne Koordinaten übergeben kann!', true));

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

        this.addMethod(new Method("Polygon", new Parameterlist([
            { identifier: "shape", type: shapeClass, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let shape: RuntimeObject = parameters[1].value;

                if(shape == null){
                    module.main.getInterpreter().throwException("Die übergebene Figur ist null.");
                    return;
                }

                let shapeHelper: ShapeHelper = shape.intrinsicData["Actor"];
                shapeHelper.displayObject.getBounds();  // seems to work magic in updating transforms of children...
                
                let points: convexhull.Point[] = [];
                points = this.extractPoints(shapeHelper, points);
                points = convexhull.makeHull(points);


                let pointsNumber: number[] = [];
                for(let p of points){
                    pointsNumber.push(p.x);
                    pointsNumber.push(p.y);
                }

                if(pointsNumber.length > 0){
                    pointsNumber = pointsNumber.concat(pointsNumber.slice(0, 2))
                }

                let ph = new PolygonHelper(pointsNumber, false, module.main.getInterpreter(), o, true);
                o.intrinsicData["Actor"] = ph;

            }, false, false, 'Instanziert ein neues Polygon. Seine Punkte sind die Punkte des Hitpolygons der übergebenen Figur.', true));
            
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

            this.addMethod(new Method("setPoints", new Parameterlist([
                { identifier: "points", type: new ArrayType(doublePrimitiveType), declaration: null, usagePositions: null, isFinal: true },
            ]), null,
                (parameters) => {
    
                    let o: RuntimeObject = parameters[0].value;
                    let points: Value[] = parameters[1].value;
                    let sh: PolygonHelper = o.intrinsicData["Actor"];
    
                    if (sh.testdestroyed("addPoints")) return;
    
                    let p: { x: number, y: number }[];
    
                    sh.setPoints(points.map(value => value.value));
    
                }, false, false, 'Löscht alle Punkte des Polygons und setzt komplett neue. Diese werden in einem double[] übergeben, das abwechselnd die x- und y-Koordinaten enthält."', false));
                
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

        this.addMethod(new Method("close", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: PolygonHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("close")) return;

                sh.isClosed = true;
                sh.render();

            }, false, false, 'Schließt das Polygon. Diese Methode hat bei gefüllten Polygonen keinen Effekt.', false));

        this.addMethod(new Method("open", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: PolygonHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("open")) return;

                sh.isClosed = false;
                sh.render();

            }, false, false, 'Öffnet das Polygon. Diese Methode hat bei gefüllten Polygonen keinen Effekt.', false));

        this.addMethod(new Method("copy", new Parameterlist([
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: PolygonHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("copy")) return;

                return sh.getCopy(<Klass>o.class);

            }, false, false, 'Erstellt eine Kopie des Polygon-Objekts und git sie zurück.', false));


    }


    extractPoints(shapeHelper: ShapeHelper, points: convexhull.Point[]): convexhull.Point[]{
        if(shapeHelper instanceof GroupHelper){
            let points1: convexhull.Point[] = [];
            for(let sh of shapeHelper.shapes){
                points1 = this.extractPoints(sh.intrinsicData["Actor"], points1);
            }
            return points.concat(points1);
        } else {
            if(shapeHelper.hitPolygonDirty) shapeHelper.transformHitPolygon();
            return points.concat(shapeHelper.hitPolygonTransformed.map(function(punkt){return {x: punkt.x, y: punkt.y}}));
        }
    }



}

export class PolygonHelper extends FilledShapeHelper {

    isClosed: boolean = false;

    constructor(points: number[], private closeAndFill: boolean,
        interpreter: Interpreter, runtimeObject: RuntimeObject, isClosed: boolean = false) {
        super(interpreter, runtimeObject);

        this.isClosed = isClosed;
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
        this.addToDefaultGroupAndSetDefaultVisibility();

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

        if (this.closeAndFill || this.isClosed) {
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

    setPoints(coordinates: number[]) {

        this.hitPolygonInitial = [];
        for(let i = 0; i < coordinates.length - 1; i += 2){
            this.hitPolygonInitial.push({x: coordinates[i], y: coordinates[i+1]});
        }

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

    containsPoint(x: number, y: number) {

        if (!this.displayObject.getBounds().contains(x, y)) return false;

        if (this.hitPolygonInitial == null) return true;

        if (this.hitPolygonDirty) this.transformHitPolygon();

        if(this.closeAndFill){
            return polygonEnthältPunkt(this.hitPolygonTransformed, { x: x, y: y });
        } else {
            return streckenzugEnthältPunkt(this.hitPolygonTransformed, { x: x, y: y });
        }
    }


}
