import { Module } from "../compiler/parser/Module.js";
import { Klass, Visibility } from "../compiler/types/Class.js";
import { doublePrimitiveType, stringPrimitiveType } from "../compiler/types/PrimitiveTypes.js";
import { Attribute, Method, Parameterlist, Value } from "../compiler/types/Types.js";
import { RuntimeObject } from "../interpreter/RuntimeObject.js";
import { DecimalFormat } from "../tools/DecimalFormat.js";

export class DecimalFormatClass extends Klass {

    constructor(module: Module) {

        super("DecimalFormat", module, "Ermöglicht das Formatieren und Parsen von Dezimalzahlen");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));

        // this.addAttribute(new Attribute("y", doublePrimitiveType,
        //     null, false, Visibility.public, false, "y-Komponente des Vektors"));

        // this.setupAttributeIndicesRecursive();


        this.addMethod(new Method("DecimalFormat", new Parameterlist([
            { identifier: "format", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true, isEllipsis: false }
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let format: string = parameters[1].value;

                o.intrinsicData["h"] = new DecimalFormat(format);

            }, false, false, 'Instanziert ein neues DecimalFormat-Objekt mit dem angegebenen Zahlenformat', true));


        this.addMethod(new Method("format", new Parameterlist([
            { identifier: "number", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true, isEllipsis: false }
        ]), stringPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let r: number = parameters[1].value;

                let formatter: DecimalFormat = o.intrinsicData["h"];

                return formatter.format(r);

            }, false, false, 'Wandelt die übergebene Zahl anhand des gespeicherten Formats in eine Zeichenkette um.', false));

    }

}


