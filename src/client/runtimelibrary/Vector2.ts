import { Module } from "../compiler/parser/Module.js";
import { Klass, Visibility } from "../compiler/types/Class.js";
import { doublePrimitiveType, stringPrimitiveType } from "../compiler/types/PrimitiveTypes.js";
import { Attribute, Method, Parameterlist, Value } from "../compiler/types/Types.js";
import { RuntimeObject } from "../interpreter/RuntimeObject.js";

export class Vector2Class extends Klass {

    constructor(module: Module) {

        super("Vector2", module, "Repräsentiert einen zweidimensionalen Vektor");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));

        this.addAttribute(new Attribute("x", doublePrimitiveType,
            null, false, Visibility.public, false, "x-Komponente des Vektors"));

        this.addAttribute(new Attribute("y", doublePrimitiveType,
            null, false, Visibility.public, false, "y-Komponente des Vektors"));

        this.setupAttributeIndicesRecursive();

        let xIndex = this.attributeMap.get("x").index;
        let yIndex = this.attributeMap.get("x").index;
        

        this.addMethod(new Method("Vector2", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true, isEllipsis: false },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true, isEllipsis: false },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;

                o.attributes[xIndex] = { type: doublePrimitiveType, value: x };
                o.attributes[yIndex] = { type: doublePrimitiveType, value: y };

            }, false, false, 'Instanziert einen neuen zweidimensionalen Vektor mit den Komponenten x und y.', true));

        this.addMethod(new Method("fromPolarCoordinates", new Parameterlist([
            { identifier: "r", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true, isEllipsis: false },
            { identifier: "alphaDeg", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true, isEllipsis: false },
        ]), this,
            (parameters) => {

                let o: RuntimeObject = new RuntimeObject(this);
                let r: number = parameters[1].value;
                let alphaDeg: number = parameters[2].value;

                alphaDeg *= Math.PI / 180.0;

                o.attributes[xIndex] = { type: doublePrimitiveType, value: Math.cos(alphaDeg) * r };
                o.attributes[yIndex] = { type: doublePrimitiveType, value: Math.sin(alphaDeg) * r };

                return o;

            }, false, true, 'Gibt einen neuen zweidimensionalen Vektor zurück, der mit den Polarkoordinaten (r/alphaDeg) gebildet wird. Datei ist r (Abstand zum Ursprung des Koordinatensystems) und alphaDeg (Winkel zur positiven x-Achse in Grad).', false));

        this.addMethod(new Method("toString", new Parameterlist([
        ]), stringPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let x: number = o.attributes[xIndex].value;
                let y: number = o.attributes[yIndex].value;

                return `(${x}/${y})`;

            }, false, false, 'Gibt den Vektor als Zeichenkette in der Form "(x/y)" zurück.', false));

        this.addMethod(new Method("getAngleDeg", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let x: number = o.attributes[xIndex].value;
                let y: number = o.attributes[yIndex].value;

                let angle = Math.atan2(y, x) / Math.PI * 180;

                return angle >= 0 ? angle : 360 + angle;

            }, false, false, 'Gibt den zur positiven x-Achse in Grad zurück.', false));

        this.addMethod(new Method("getAngleRad", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let x: number = o.attributes[xIndex].value;
                let y: number = o.attributes[yIndex].value;

                let angle = Math.atan2(y, x);

                return angle >= 0 ? angle : Math.PI * 2 + angle;

            }, false, false, 'Gibt den zur positiven x-Achse im Bogenmaß zurück.', false));

        this.addMethod(new Method("getLength", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let x: number = o.attributes[xIndex].value;
                let y: number = o.attributes[yIndex].value;

                return Math.sqrt(x * x + y * y);

            }, false, false, 'Gibt die Länge des Vectors zurück.', false));

        this.addMethod(new Method("toUnitVector", new Parameterlist([
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let x: number = o.attributes[xIndex].value;
                let y: number = o.attributes[yIndex].value;

                let o1: RuntimeObject = new RuntimeObject(this);
                let length: number = Math.sqrt(x * x + y * y);

                if (Math.abs(length) > 0.00000000001) {
                    x /= length;
                    y /= length;
                } else {
                    x = 0;
                    y = 0;
                }

                o1.attributes[xIndex] = { type: doublePrimitiveType, value: x };
                o1.attributes[yIndex] = { type: doublePrimitiveType, value: y };

                return o1;

            }, false, false, 'Gibt den zum Vektor zugehörigen Einheitsvektor (d.h. den Vektor mit derselben Richtung, aber der Länge 1) zurück.', false));

        this.addMethod(new Method("setLength", new Parameterlist([
            { identifier: "length", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true, isEllipsis: false },
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let x: number = o.attributes[xIndex].value;
                let y: number = o.attributes[yIndex].value;

                let length: number = parameters[1].value;

                let l = Math.sqrt(x * x + y * y);
                if (l > 0) {

                    o.attributes[xIndex].value = x / l * length;
                    o.attributes[yIndex].value = y / l * length;

                }

            }, false, false, 'Ändert den Vektor so, dass er seine Richtung beibehält, aber auf die angegebene Länge gestreckt/gestaucht wird.', false));

        this.addMethod(new Method("plus", new Parameterlist([
            { identifier: "vector", type: this, declaration: null, usagePositions: null, isFinal: true, isEllipsis: false },
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let o1: RuntimeObject = parameters[1].value;

                let x: number = o.attributes[xIndex].value;
                let y: number = o.attributes[yIndex].value;

                let x1: number = o1.attributes[xIndex].value;
                let y1: number = o1.attributes[yIndex].value;

                let oRet: RuntimeObject = new RuntimeObject(this);

                oRet.attributes[xIndex] = { type: doublePrimitiveType, value: x + x1 };
                oRet.attributes[yIndex] = { type: doublePrimitiveType, value: y + y1 };

                return oRet;

            }, false, false, 'Gibt die Summe zurück, die sich aus Addition dieses Vektor mit dem übergebenen Vektor ergibt. WICHTIG: Diese Methode ändert das Objekt nicht, für das sie aufgerufen wurde!', false));

        this.addMethod(new Method("minus", new Parameterlist([
            { identifier: "vector", type: this, declaration: null, usagePositions: null, isFinal: true, isEllipsis: false },
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let o1: RuntimeObject = parameters[1].value;

                let x: number = o.attributes[xIndex].value;
                let y: number = o.attributes[yIndex].value;

                let x1: number = o1.attributes[xIndex].value;
                let y1: number = o1.attributes[yIndex].value;

                let oRet: RuntimeObject = new RuntimeObject(this);

                oRet.attributes[xIndex] = { type: doublePrimitiveType, value: x - x1 };
                oRet.attributes[yIndex] = { type: doublePrimitiveType, value: y - y1 };

                return oRet;

            }, false, false, 'Gibt die Differenz zurück, die sich aus Subtraktion des übergebenen Vektors von diesem Vektor ergibt. WICHTIG: Diese Methode ändert das Objekt nicht, für das sie aufgerufen wurde!', false));

        this.addMethod(new Method("scalarProduct", new Parameterlist([
            { identifier: "vector1", type: this, declaration: null, usagePositions: null, isFinal: true, isEllipsis: false },
            { identifier: "vector2", type: this, declaration: null, usagePositions: null, isFinal: true, isEllipsis: false },
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let o1: RuntimeObject = parameters[1].value;

                let x: number = o.attributes[xIndex].value;
                let y: number = o.attributes[yIndex].value;

                let x1: number = o1.attributes[xIndex].value;
                let y1: number = o1.attributes[yIndex].value;

                return x * x1 + y * y1;

            }, false, true, 'Gibt das Skalarprodukt der beiden Vektoren zurück.', false));


        this.addMethod(new Method("scaledBy", new Parameterlist([
            { identifier: "scalar", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true, isEllipsis: false },
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let x: number = o.attributes[xIndex].value;
                let y: number = o.attributes[yIndex].value;

                let s: number = parameters[1].value;

                let oRet: RuntimeObject = new RuntimeObject(this);
                oRet.attributes[xIndex] = { type: doublePrimitiveType, value: x * s };
                oRet.attributes[yIndex] = { type: doublePrimitiveType, value: y * s };

                return oRet;

            }, false, false, 'Gibt das Produkt zurück, das sich aus Multiplikation dieses Vektor mit dem übergebenen Skalar ergibt. WICHTIG: Diese Methode ändert das Objekt nicht, für das sie aufgerufen wurde!', false));

        this.addMethod(new Method("rotatedBy", new Parameterlist([
            { identifier: "angleDeg", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true, isEllipsis: false },
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let x: number = o.attributes[xIndex].value;
                let y: number = o.attributes[yIndex].value;

                let angle: number = -parameters[1].value * Math.PI / 180;
                let sin: number = Math.sin(angle);
                let cos: number = Math.cos(angle);

                let oRet: RuntimeObject = new RuntimeObject(this);
                oRet.attributes[xIndex] = { type: doublePrimitiveType, value: x * cos - y * sin };
                oRet.attributes[yIndex] = { type: doublePrimitiveType, value: x * sin + y * cos };

                return oRet;

            }, false, false, 'Gibt den um den übergebenen Winkel (in Grad) rotierten Vektor zurück. Positiver Winkel => Rotation GEGEN DEN Uhrzeigersinn. WICHTIG: Diese Methode ändert das Objekt nicht, für das sie aufgerufen wurde!', false));


        this.addMethod(new Method("distance", new Parameterlist([
            { identifier: "x1", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y1", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "x2", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y2", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), doublePrimitiveType,
            (parameters) => {
                let x1: number = <number>parameters[1].value;
                let y1: number = <number>parameters[2].value;
                let x2: number = <number>parameters[3].value;
                let y2: number = <number>parameters[4].value;
                let dx = x2 - x1;
                let dy = y2 - y1;
                return Math.sqrt(dx * dx + dy * dy);
            }, false, true, "Berechnet den Abstand der Punkte (x1/y1) und (x2/y2)."));


    }

}


