import { NThread } from "../interpreter/NThreadPool.js";
import { NRuntimeObject } from "../NRuntimeObject.js";

class NThrowable extends NRuntimeObject {

    // Online-IDE will set __class and __fai
    static __class: any;    // class-Object
    static __fai: number;   // first attribute index

    listIntern: any[];                      // not visible from java

    __getSignature(): string {
        return "class Throwable";
    }
    __getMethods(): { [signature: string]: any; } {
        return {

            "public Throwable(String message)": (thread: NThread, message: string) => {
                this.__a[NThrowable.__fai + 0] = message;
                return this;
            },
            "public getMessage()": (thread: NThread) => {
                return this.__a[NThrowable.__fai + 0]    
            }
        }
    }
    __getAttributes(): string[] {
        return ["private String message"];
    }
    
}

class Exception extends ExampleArrayListClass {
    
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