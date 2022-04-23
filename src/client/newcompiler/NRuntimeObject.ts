import { Klass } from "../compiler/types/Class.js";
import { NClass } from "./types/NClass.js";
import { NProgram } from "./compiler/NProgram.js";


export class BaseRuntimeObject {
    __c: NClass;    // class
    __fai: number;  // first attribute index
    // for every method: 
    // "double add(double,double)": (d1, d2) => { ... }
}

export class NRuntimeObject extends BaseRuntimeObject {
    __a: any[] = [];
}

export abstract class BaseLibraryClass extends NRuntimeObject {

    abstract getSignature(): string;    // returns signature of class, e.g. "abstract class MyClass<A> extends HashMap<A, Integer> implements Comparable<A>"
    abstract getMethods(): {[signature: string]: any };     // all methods that should be visible
    abstract getAttributes(): string[]; // attribute signatures, e.g. "private int count"

    callMethod(methodSignature: string, parameters?: any[]): any {};
    callStaticMethod(classIdentifier: string,  methodSignature: string, parameters?: any[]): any {};
}


class ExampleClass extends BaseLibraryClass {
    
    getSignature(): string {
        return "class Example<A extends Integer> extends ArrayList<A>";
    }
    getMethods(): { [signature: string]: any; } {
        return {
            "public Example(int count)": this.constructor1
        }
    }
    getAttributes(): string[] {
        throw new Error("Method not implemented.");
    }

    constructor1(count: number){
        this.callMethod("ArrayList(int)", [count]);
    }

    
    
}