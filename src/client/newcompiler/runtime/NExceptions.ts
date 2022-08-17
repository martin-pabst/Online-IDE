import { NThread } from "../interpreter/NThreadPool.js";
import { NRuntimeObject } from "../NRuntimeObject.js";

export class NThrowable extends NRuntimeObject {

    __getSignature(): string {
        return "class Throwable";
    }
    __getMethods(): { [signature: string]: any; } {
        return {

            "public Throwable(String message)": (thread: NThread, message: string) => {
                this.__a[this.__fai + 0] = message;
                this.__a[this.__fai + 1] = "";
                return this;
            },
            "public String getMessage()": (thread: NThread) => {
                return this.__a[this.__fai + 0]    
            },
            "public String getStackTrace()": (thread: NThread) => {
                return this.__a[this.__fai + 1]    
            }
        }
    }
    __getAttributes(): string[] {
        return ["private String message", "private String stacktrace"];
    }
    
}

export class NException extends NThrowable {
    
    __getSignature(): string {
        return "class Exception extends Throwable";
    }
    __getMethods(): { [signature: string]: any; } {
        return {}
    }
    __getAttributes(): string[] {
        return [];
    }
    
}

export class NArithmeticException extends NException {
    
    __getSignature(): string {
        return "class ArithmeticException extends Exception";
    }
    __getMethods(): { [signature: string]: any; } {
        return {}
    }
    __getAttributes(): string[] {
        return [];
    }
    
}

export class NClassCastException extends NException {
    
    __getSignature(): string {
        return "class ClassCastException extends Exception";
    }
    __getMethods(): { [signature: string]: any; } {
        return {}
    }
    __getAttributes(): string[] {
        return [];
    }
    
}

