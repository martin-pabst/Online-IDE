import { NClass } from "./NClass.js";
import { NProgram } from "./NProgram.js";


export type RuntimeObjectPrototype = {
    __class: NClass;
    __virtualMethods: {[signature: string]: NProgram}
}

export type NRuntimeObject = {
    __att: any[];
    __class: NClass;
    __virtualMethods: {[signature: string]: NProgram}
}