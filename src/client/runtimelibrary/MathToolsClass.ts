import { Type, Method, Parameterlist, Value, Attribute } from "../compiler/types/Types.js";
import { Klass, Visibility } from "../compiler/types/Class.js";
import { stringPrimitiveType, doublePrimitiveType, floatPrimitiveType, intPrimitiveType, booleanPrimitiveType } from "../compiler/types/PrimitiveTypes.js";
import { Module } from "../compiler/parser/Module.js";
import { PrintManager } from "../main/gui/PrintManager.js";
import { RuntimeObject } from "../interpreter/RuntimeObject.js";
import { ArrayType } from "../compiler/types/Array.js";
import { abstandPunktZuGerade, abstandPunktZuStrecke, polygonEnthältPunkt, Punkt, schnittpunkteKreisStrecke, streckeSchneidetStrecke, vektorVonPolarkoordinaten } from "../tools/MatheTools.js";
import { param } from "jquery";

export class MathToolsClass extends Klass {

    constructor(module: Module) {
        super("MathTools", module, "Klasse mit mathematischen Hilfsfunktionen als statische Methoden");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));

        this.staticClass.setupAttributeIndicesRecursive();

        this.staticClass.classObject = new RuntimeObject(this.staticClass);

        let vector2Class = <Klass>module.typeStore.getType("Vector2");
        let vectorArrayClass = new ArrayType(vector2Class);

        let xIndex = vector2Class.attributeMap.get("x").index;
        let yIndex = vector2Class.attributeMap.get("y").index;


        this.addMethod(new Method("intersectCircleWithPolygon", new Parameterlist([
            { identifier: "mx", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "my", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "r", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "points", type: vectorArrayClass, declaration: null, usagePositions: null, isFinal: true },
        ]), vectorArrayClass,
            (parameters) => {

                let mx: number = parameters[1].value;
                let my: number = parameters[2].value;
                let r: number = parameters[3].value;
                let points: Value[] = parameters[4].value;

                let punkte: Punkt[] = [];
                for(let p of points){
                    punkte.push({x: p.value.attributes[xIndex].value, y: p.value.attributes[yIndex].value});
                }

                let schnittpunkte: Punkt[] = [];
                let m: Punkt = {x: mx, y: my};
                for(let i = 0; i < punkte.length; i++){
                    let p1 = punkte[i];
                    let p2 = punkte[(i+1)%punkte.length];
                    schnittpunkteKreisStrecke(m, r, p1, p2, schnittpunkte);
                }

                let returnArray: Value[] = []

                for(let p of schnittpunkte){
                    let pVector = new RuntimeObject(vector2Class);
                    pVector.attributes[xIndex] = {type: doublePrimitiveType, value: p.x};
                    pVector.attributes[yIndex] = {type: doublePrimitiveType, value: p.y};
                    returnArray.push({type: vector2Class, value:pVector});
                }

                return returnArray;

            }, false, true, "Zu einem gegebenen Kreis werden die Punkte berechnet, die auf den Seiten eines gegebenen Polygons liegen."));

        this.addMethod(new Method("intersectLineSegments", new Parameterlist([
            { identifier: "p0", type: vector2Class, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "p1", type: vector2Class, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "p2", type: vector2Class, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "p3", type: vector2Class, declaration: null, usagePositions: null, isFinal: true },
        ]), vector2Class,
            (parameters) => {

                let p: Punkt[] = [];
                for(let i = 0; i < 4; i++){
                    let att = parameters[i].value.attributes;
                    p.push({x: att[xIndex].value, y: att[yIndex].value})
                }

                let ps: Punkt = {x: 0, y: 0};
                if(streckeSchneidetStrecke(p[0], p[1], p[2], p[3], ps)){
                    let pVector = new RuntimeObject(vector2Class);
                    pVector.attributes[xIndex] = {type: doublePrimitiveType, value: ps.x};
                    pVector.attributes[yIndex] = {type: doublePrimitiveType, value: ps.y};
                    return pVector;
                } else {
                    return null;                    
                }

            }, false, true, "Berechnet den Schnittpunkt der Strecken [p0, p1] und [p2, p3]. Gibt null zurück, wenn sich die Strecken nicht schneiden oder wenn sie parallel sind und teilweise aufeinander liegen."));

        this.addMethod(new Method("polygonContainsPoint", new Parameterlist([
            { identifier: "polygonPoints", type: vectorArrayClass, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "p", type: vector2Class, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType,
            (parameters) => {

                let points = parameters[1].value;
                let punkte: Punkt[] = [];
                for(let p of points){
                    punkte.push({x: p.value.attributes[xIndex].value, y: p.value.attributes[yIndex].value});
                }

                let att = parameters[2].value.attributes;
                let p: Punkt = {x: att[xIndex].value, y: att[yIndex].value}

                return polygonEnthältPunkt(punkte, p);

            }, false, true, "Gibt genau dann true zurück, wenn das Polygon den Punkt enthält."));

            this.addMethod(new Method("distancePointToLine", new Parameterlist([
                { identifier: "p", type: vector2Class, declaration: null, usagePositions: null, isFinal: true },
                { identifier: "a", type: vector2Class, declaration: null, usagePositions: null, isFinal: true },
                { identifier: "b", type: vector2Class, declaration: null, usagePositions: null, isFinal: true },
            ]), doublePrimitiveType,
                (parameters) => {
    
                    let p: Punkt[] = [];
                    for(let i = 0; i < 3; i++){
                        let att = parameters[i].value.attributes;
                        p.push({x: att[xIndex].value, y: att[yIndex].value})
                    }
    
                    return abstandPunktZuGerade(p[1], p[2], p[0]);
    
                }, false, true, "Berechnet den Abstand des Punktes P zur Gerade AB."));
    
            this.addMethod(new Method("distancePointToLineSegment", new Parameterlist([
                { identifier: "p", type: vector2Class, declaration: null, usagePositions: null, isFinal: true },
                { identifier: "a", type: vector2Class, declaration: null, usagePositions: null, isFinal: true },
                { identifier: "b", type: vector2Class, declaration: null, usagePositions: null, isFinal: true },
            ]), doublePrimitiveType,
                (parameters) => {
    
                    let p: Punkt[] = [];
                    for(let i = 0; i < 3; i++){
                        let att = parameters[i].value.attributes;
                        p.push({x: att[xIndex].value, y: att[yIndex].value})
                    }
    
                    return abstandPunktZuStrecke(p[1], p[2], p[0]);
    
                }, false, true, "Berechnet den Abstand des Punktes P zur Strecke [AB]."));
    
    


    }
}