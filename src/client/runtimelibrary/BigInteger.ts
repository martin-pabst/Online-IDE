import { Module } from "../compiler/parser/Module.js";
import { Klass, Visibility } from "../compiler/types/Class.js";
import { doublePrimitiveType, intPrimitiveType, stringPrimitiveType } from "../compiler/types/PrimitiveTypes.js";
import { Attribute, Method, Parameterlist, Value } from "../compiler/types/Types.js";
import { RuntimeObject } from "../interpreter/RuntimeObject.js";

export class BigIntegerClass extends Klass {

    constructor(module: Module) {

        super("BigInteger", module, "Repräsentiert eine ganze Zahl mit 'beliebig' vielen Stellen.");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));

        this.setupAttributeIndicesRecursive();        

        this.addMethod(new Method("BigInteger", new Parameterlist([
            { identifier: "val", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true, isEllipsis: false }
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let val: string = parameters[1].value;

                o.intrinsicData["bi"] = BigInt(val);

            }, false, false, 'Instanziert ein neues BigInteger-Objekt', true));

        this.addMethod(new Method("add", new Parameterlist([
            { identifier: "val", type: this, declaration: null, usagePositions: null, isFinal: true, isEllipsis: false }
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let val: RuntimeObject = parameters[1].value;

                let bi = <bigint>o.intrinsicData["bi"];
                let biOther = <bigint>val.intrinsicData["bi"];

                let result = new RuntimeObject(this);
                result.intrinsicData["bi"] = bi + biOther;

                return result;

            }, false, false, 'Addiert das übergebene BigInteger-Objekt zum aktuellen BigInteger-Objekt und gibt ein neues BigInteger-Objekt zurück, dessen Wert die errechnete Summe ist. Die Methode add ändert nicht das aktuelle BigInteger-Objekt!', false));

        this.addMethod(new Method("divide", new Parameterlist([
            { identifier: "val", type: this, declaration: null, usagePositions: null, isFinal: true, isEllipsis: false }
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let val: RuntimeObject = parameters[1].value;

                let bi = <bigint>o.intrinsicData["bi"];
                let biOther = <bigint>val.intrinsicData["bi"];

                let result = new RuntimeObject(this);
                result.intrinsicData["bi"] = bi / biOther;

                return result;

            }, false, false, 'Dividiert das aktuelle Objekt durch das übergebene BigInteger-Objekt und gibt ein neues BigInteger-Objekt zurück, dessen Wert der ganzzahlige Anteil des errechneten Quotienten ist. Die Methode divide ändert nicht das aktuelle BigInteger-Objekt!', false));

        this.addMethod(new Method("multiply", new Parameterlist([
            { identifier: "val", type: this, declaration: null, usagePositions: null, isFinal: true, isEllipsis: false }
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let val: RuntimeObject = parameters[1].value;

                let bi = <bigint>o.intrinsicData["bi"];
                let biOther = <bigint>val.intrinsicData["bi"];

                let result = new RuntimeObject(this);
                result.intrinsicData["bi"] = bi * biOther;

                return result;

            }, false, false, 'Multipliziert das aktuelle Objekt mit dem übergebenen BigInteger-Objekt und gibt ein neues BigInteger-Objekt zurück, dessen Wert das Produkt der beiden Zahlen ist. Die Methode multiply ändert nicht das aktuelle BigInteger-Objekt!', false));

        this.addMethod(new Method("remainder", new Parameterlist([
            { identifier: "val", type: this, declaration: null, usagePositions: null, isFinal: true, isEllipsis: false }
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let val: RuntimeObject = parameters[1].value;

                let bi = <bigint>o.intrinsicData["bi"];
                let biOther = <bigint>val.intrinsicData["bi"];

                let result = new RuntimeObject(this);
                result.intrinsicData["bi"] = bi % biOther;

                return result;

            }, false, false, 'Dividiert das aktuelle Objekt durch das übergebenen BigInteger-Objekt und gibt ein neues BigInteger-Objekt zurück, dessen Wert der Rest der Division ist. Die Methode remainder ändert nicht das aktuelle BigInteger-Objekt!', false));

        this.addMethod(new Method("toString", new Parameterlist([
        ]), stringPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let bi = <bigint>o.intrinsicData["bi"];

                return bi.toString();

            }, false, false, 'Gibt das BigInteger-Objekt als Zeichenkette (dezimal!) zurück.', false));

        this.addMethod(new Method("intValue", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let bi = <bigint>o.intrinsicData["bi"];

                return Number(BigInt.asIntN(52, bi));

            }, false, false, 'Gibt das BigInteger-Objekt mod (2^53) als int-Wert zurück.', false));



    }

}


