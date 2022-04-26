import { Klass } from "../compiler/types/Class.js";
import { NClass } from "./types/NClass.js";
import { NProgram } from "./compiler/NProgram.js";
import { NThread } from "./interpreter/NThreadPool.js";


export abstract class NRuntimeObject {
    __a: any[] = [];

    // all child classes have static attributes
    // static __class: any;    // class-Object
    // static __fai: number;   // first attribute index
    // these will be set by the compiler

    abstract __getSignature(): string;    // returns signature of class, e.g. "abstract class MyClass<A> extends HashMap<A, Integer> implements Comparable<A>"
    abstract __getMethods(): {[signature: string]: any };     // all methods that should be visible
                                                              // any is of type function
    abstract __getAttributes(): string[]; // attribute signatures, e.g. "private int count"

    __callMethod(methodSignature: string, parameters?: any[]): any {
        (<Function>this[methodSignature]).apply(this, parameters);
    };

    __getClass(): NClass {
        //@ts-ignore
        return this.constructor.__class;
    }
    
     /**
     * NRuntimeObject also contains all methods, either itself (library objects) or in its prototype (objects of compiled classes)
     * "signature1": program1,
     * "signature2": program2,
     * ...
     */

}

export class NStaticClassObject {
    __a: any = [];      // Attribute values
    __class: NClass;    // reference to class

    /**
     * staticClassObject also contains all static methods:
     * "signature1": program1,
     * "signature2": program2,
     * ...
     */
}

class ExampleArrayListClass extends NRuntimeObject {

    // Online-IDE will set __class and __fai
    static __class: any;    // class-Object
    static __fai: number;   // first attribute index

    listIntern: any[];                      // not visible from java

    __getSignature(): string {
        return "class ArrayList<A>";
    }
    __getMethods(): { [signature: string]: any; } {
        return {
            "public ArrayList()": this.constructor1
        }
    }
    __getAttributes(): string[] {
        return ["public int count"];
    }

    constructor1(thread: NThread, count: number){
        this.__callMethod("Object()");
        this.__a[ExampleArrayListClass.__fai + 0] = count;       // set attribute value
    }
    
}

class ExampleChildClass extends ExampleArrayListClass {
    
    __getSignature(): string {
        return "class MyList<A extends Integer> extends ArrayList<A>";
    }
    __getMethods(): { [signature: string]: any; } {
        return {
            "public MyList()": this.constructor2
        }
    }
    __getAttributes(): string[] {
        return ["public int count"];
    }

    constructor2(){
        this.__callMethod("ArrayList()", [10]);
    }
    
}