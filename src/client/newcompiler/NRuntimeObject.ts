import { Klass } from "../compiler/types/Class.js";
import { NClass } from "./types/NClass.js";
import { NProgram } from "./compiler/NProgram.js";


export type RuntimeObjectPrototype = {
    __class: NClass;
    __virtualMethods: {[signature: string]: NProgram}
}

export type NRuntimeObject = {
    __att: any[];
    __class: NClass;
    __virtualMethods: {[signature: string]: NProgram}
}