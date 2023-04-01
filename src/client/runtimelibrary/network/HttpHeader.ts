import { Module } from "../../compiler/parser/Module.js";
import { Klass, Visibility } from "../../compiler/types/Class.js";
import { stringPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Attribute } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";

export class HttpHeaderType extends Klass {

    constructor(module: Module) {

        super("HttpHeader", module, "Speichert key und value eines Http-Headers.");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));

        this.addAttribute(new Attribute("key", stringPrimitiveType,
            (value) => {

                let rto: RuntimeObject = value.object;
                value.value = rto.intrinsicData["key"];

            }, false, Visibility.public, true, "Schlüssel (key) des Http-Headers"));

        this.addAttribute(new Attribute("value", stringPrimitiveType,
            (value) => {

                let rto: RuntimeObject = value.object;
                value.value = rto.intrinsicData["value"];

            }, false, Visibility.public, true, "Wert (value) des Http-Headers"));

        this.setupAttributeIndicesRecursive();

    }
}
