import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { doublePrimitiveType, intPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { PolygonHelper } from "./Polygon.js";

export class LineClass extends Klass {

    constructor(module: Module) {

        super("Line", module, "Strecke (gerade Linie zwischen zwei Punkten)");

        this.setBaseClass(<Klass>module.typeStore.getType("FilledShape"));

        this.addMethod(new Method("Line", new Parameterlist([
            { identifier: "x1", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y1", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "x2", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y2", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x1: number = parameters[1].value;
                let y1: number = parameters[2].value;
                let x2: number = parameters[3].value;
                let y2: number = parameters[4].value;

                let pointsNumber: number[] = [x1, y1, x2, y2];

                let ph = new PolygonHelper(pointsNumber, false, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = ph;

            }, false, false, 'Instanziert eine Strecke mit Anfangspunkt (x1/y1) und Endpunkt (x2/y2).', true));

            this.addMethod(new Method("copy", new Parameterlist([
            ]), this,
                (parameters) => {
    
                    let o: RuntimeObject = parameters[0].value;
                    let sh: PolygonHelper = o.intrinsicData["Actor"];
    
                    if (sh.testdestroyed("copy")) return;
    
                    return sh.getCopy(<Klass>o.class);
    
                }, false, false, 'Erstellt eine Kopie der Strecke und git sie zurück.', false));

                this.addMethod(new Method("setPoint", new Parameterlist([
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
        
                        if (sh.testdestroyed("setPoint")) return;
        
                        sh.setPoint(x, y, index - 1);
        
                    }, false, false, 'Ändert einen Punkt des Polygons. index == 1 bedeutet: Anfangspunkt; index == 2 bedeutet: Endpunkt', false));
        
                this.addMethod(new Method("setPoints", new Parameterlist([
                    { identifier: "x1", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
                    { identifier: "y1", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
                    { identifier: "x2", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
                    { identifier: "y2", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
                ]), null,
                    (parameters) => {
        
                        let o: RuntimeObject = parameters[0].value;
                        let x1: number = parameters[1].value;
                        let y1: number = parameters[2].value;
                        let x2: number = parameters[3].value;
                        let y2: number = parameters[4].value;
                                let sh: PolygonHelper = o.intrinsicData["Actor"];
        
                        if (sh.testdestroyed("setPoints")) return;
        
                        sh.setPoints([x1, y1, x2, y2]);
        
                    }, false, false, 'Ändert die Punkte der Strecke. (x1/y1) ist der neue Anfangspunkt, (x2/y2) ist der neue Endpunkt.', false));
        
     
    }

}

