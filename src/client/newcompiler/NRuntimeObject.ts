import { Klass } from "../compiler/types/Class.js";
import { NClass } from "./types/NClass.js";
import { NProgram } from "./compiler/NProgram.js";
import { NThread } from "./interpreter/NThreadPool.js";


export abstract class NRuntimeObject {
    __a: any[] = [];        // Attribute values

    // these two attributes will be set by the compiler in NClass.runtimeObjectPrototype:
    __fai: number;          // first Attribute index of this class; prior indexes are attributes from base classes
    __class: NClass;        // reference to class object 

    // these three methods are only populated in system classes and will get evaluated
    // by LibraryCompiler:
    abstract __getSignature(): string;    // returns signature of class, e.g. "abstract class MyClass<A> extends HashMap<A, Integer> implements Comparable<A>"
    abstract __getMethods(): {[signature: string]: any };     // all methods that should be visible
                                                              // any is of type function or NExpression
    abstract __getAttributes(): string[]; // attribute signatures, e.g. "private int count"
    
     /**
     * NRuntimeObject also contains all methods, either itself (library objects) or in its prototype (objects of compiled classes)
     * "signature1": program1,
     * "signature2": program2,
     * ...
     */

}

export class NStaticClassObject {
    __a: any = [];              // Attribute values
    __initialValues: any[] = [];  // initial attribute values
    __class: NClass;            // reference to class

    constructor(klass: NClass, initialAttributeValues: any[]){
        this.__class = klass;
        this.__initialValues = initialAttributeValues;
        this.__a = initialAttributeValues.slice();
    }

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

    //Internal attributes are not visible from java.
    //They must be initialized inside a java-constructor-Method (see below).
    listIntern: any[];      // internal attribute
                                            

    __getSignature(): string {
        return "class ArrayList<A>";
    }
    __getMethods(): { [signature: string]: any; } {
        return {
            "public ArrayList(int count)": this.constructor1,   // compiler sets this["ArrayList(int)"] == this.constructor1
            "public int size()": this.size                      // compiler sets this["size()"] == this.size
        }
    }
    __getAttributes(): string[] {
        return ["public int count"];
    }

    constructor1(thread: NThread, count: number){
        this.__a[ExampleArrayListClass.__fai + 0] = count;       // set attribute value
        this.listIntern = new Array(count);
        return this;
    }

    size(thread: NThread){
        return this.listIntern.length;
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

    constructor2(thread: NThread){
        this.constructor1(thread, 10);
        // alternative:
        //thread.callVirtualMethodFromJs(this, "ArrayList(int)", [10]);
        
    }
    
}