import { Module } from "../../compiler/parser/Module.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { Interface, TypeVariable, Klass } from "../../compiler/types/Class.js";
import { voidPrimitiveType, booleanPrimitiveType, intPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { ListHelper } from "./ArrayList.js";

export class CollectionsClass extends Klass {

    constructor(module: Module) {
        
        super("Collections", module, "Utility-Klasse für Listen");

        let objectType = <Klass>module.typeStore.getType("Object");
        let listInterface = <Interface>module.typeStore.getType("List");

        this.setBaseClass(objectType);


        this.addMethod(new Method("shuffle", new Parameterlist([
            { identifier: "list", type: listInterface, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
        (parameters) => {

            let list: RuntimeObject = parameters[1].value;
            let sh: ListHelper = list.intrinsicData["ListHelper"];

            let va = sh.valueArray;
            let oa = sh.objectArray;
            let l = va.length;
            for(let i = 0; i < l * 2; i++){
                let index1 = Math.floor(Math.random()*l);
                let index2 = Math.floor(Math.random()*l);

                let z = va[index1]; va[index1] = va[index2]; va[index2] = z;
                let z1 = oa[index1]; oa[index1] = oa[index2]; oa[index2] = z1;
            }

        },  // no implementation!
            false, true, "Vertauscht die Elemente der Liste in zufälliger Weise."));

    }

}


