import { Module } from "../../compiler/parser/Module.js";
import { Klass, Visibility } from "../../compiler/types/Class.js";
import { intPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Attribute, Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";

export class PositionClass extends Klass {

    constructor(module: Module) {

        super("Position", module, "Repräsentiert einen Position auf einem Gitternetz (nur ganzzahlige Koordinaten)");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));

        this.addAttribute(new Attribute("x", intPrimitiveType,
            null, false, Visibility.public, false, "x-Komponente der Position"));

        this.addAttribute(new Attribute("y", intPrimitiveType,
            null, false, Visibility.public, false, "y-Komponente der Position"));

        this.setupAttributeIndicesRecursive();

        let xIndex = this.attributeMap.get("x").index;
        let yIndex = this.attributeMap.get("y").index;


        this.addMethod(new Method("IntPosition", new Parameterlist([
            { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true, isEllipsis: false },
            { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true, isEllipsis: false },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;

                o.attributes[xIndex] = { type: intPrimitiveType, value: x };
                o.attributes[yIndex] = { type: intPrimitiveType, value: y };

            }, false, false, 'Instanziert eine neue Position den Komponenten x und y.', true));
    }
}
