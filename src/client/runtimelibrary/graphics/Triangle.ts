import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { booleanPrimitiveType, doublePrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { PolygonHelper } from "./Polygon.js";

export class TriangleClass extends Klass {

    constructor(module: Module) {

        super("Triangle", module, "Dreieck");

        this.setBaseClass(<Klass>module.typeStore.getType("Polygon"));

        this.addMethod(new Method("Triangle", new Parameterlist([
            { identifier: "x1", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y1", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "x2", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y2", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "x3", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y3", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let pointsNumber: number[] = [];
                for(let i = 1; i <= 6; i++){
                    pointsNumber.push(parameters[i].value);
                }

                let ph = new PolygonHelper(pointsNumber, true, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = ph;

            }, false, false, 'Instanziert ein neues Dreieck.', true));

        this.addMethod(new Method("copy", new Parameterlist([
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: PolygonHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("copy")) return;

                return sh.getCopy(<Klass>o.class);

            }, false, false, 'Erstellt eine Kopie des Triangle-Objekts und git sie zurück.', false));

        }

}
