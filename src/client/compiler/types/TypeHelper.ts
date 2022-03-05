import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { booleanPrimitiveType, doublePrimitiveType, floatPrimitiveType, intPrimitiveType, stringPrimitiveType } from "./PrimitiveTypes.js";

export function getTypeFromValue(value: any){
    if(typeof value == "string"){
        return stringPrimitiveType;
    } else if(typeof value == "number"){
        if(Number.isInteger(value)) return intPrimitiveType;
        return floatPrimitiveType;
    } else if(typeof value == "boolean"){
        return booleanPrimitiveType;
    } else if(value instanceof RuntimeObject){
        return value.class;
    }
}