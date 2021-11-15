import { Method, Parameterlist, Value } from "./Types.js";
import { stringPrimitiveType } from "./PrimitiveTypes.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { Module } from "../parser/Module.js";
import { Interface, Klass } from "./Class.js";
// neu:
import { Enum, EnumRuntimeObject } from "./Enum.js";
import { type } from "jquery";
import { json } from "express";
import { ArrayType } from "./Array.js";


/**
 * Base class for all classes
 */

export class ObjectClass extends Klass {

    constructor(module: Module) {
        super("Object", module, "Basisklasse aller Klassen");

        // stringPrimitiveType is used here before it is initialized. This problem is solved
        // in the constructor of StringprimitiveType.
        let m = new Method("toString", new Parameterlist([]), stringPrimitiveType,
        (parameters) => {
            if(parameters[0].value instanceof RuntimeObject){
                return "(" + (<RuntimeObject><unknown>parameters[0].value).class.identifier + ")";
            } else {
                return parameters[0].value;
            }


        }, false, false);
        m.isVirtual = true;
        
        this.addMethod(m);


        // // Add default parameterless constructor
        // let m = new Method("Object", new Parameterlist([]), null,
        // (parameters) => {

        // }, false, false);
        
        // m.isConstructor = true;

        // this.addMethod(m);

    }



}
