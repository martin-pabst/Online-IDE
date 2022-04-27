import { TokenType } from "../../compiler/lexer/Token.js";
import { NUnknownClasslike } from "../librarycompiler/UnknownClasslike.js";
import { NRuntimeObject } from "../NRuntimeObject.js";
import { NMethodInfo, NAttributeInfo } from "./NAttributeMethod.js";
import { NExpression, NType } from "./NewType.js";
import { NVisibility } from "./NVisibility.js";


export abstract class NClassLike extends NType {

    visibility: NVisibility = NVisibility.public;

    allExtendedImplementedTypes: string[] = [];

    genericParameters: NGenericParameter[] = [];


    abstract getAllMethods(): NMethodInfo[];

    compute(operator: TokenType, otherType: NType, value1: any, value2?: any) {
        return "null" + value2;
    }

    equals(otherType: NType): boolean {
        return otherType == this;
    }

}

export class NClass extends NClassLike {

    methodInfoList: NMethodInfo[] = [];
    attributeInfo: NAttributeInfo[] = [];
    extends: NClass | NUnknownClasslike;
    implements: (NInterface | NUnknownClasslike)[] = [];
    isAbstract: boolean = false;

    staticMethodInfoList: NMethodInfo[] = [];
    staticAttributeInfo: NAttributeInfo[] = [];

    runtimeObjectPrototype: NRuntimeObject;              // contains all methods and reference to class object; contains NOT __a 
    runtimeObjectPrototypeIsClass: boolean = false;     // true for system classes
    initialAttributeValues: any[];                      // used only vor non-system classes

    getCastExpression(otherType: NType): NExpression {
        return { e: `thread.cast($1,"${otherType.identifier}")` }
    }

    castTo(otherType: NType, value: any) {
        return value;
    }

    getOperatorExpression(operator: TokenType, otherType?: NType): NExpression {
        if (operator == TokenType.plus && otherType.identifier == "String") {
            // TODO: Aufruf von toString richtig compilieren
            return { e: '($1 == null ? "null" : $1.toString()) + $2' }
        }
        return null;
    }

    getOperatorResultType(operator: TokenType, otherType: NType): NType {
        if (operator == TokenType.plus && otherType.identifier == "String") {
            return otherType;
        }
        return null;
    }

    public debugOutput(value: any, maxLength?: number): string {
        // Todo: Aufruf der toString-Methode
        return "[" + this.identifier + "]";
    }

    getAllMethods(): NMethodInfo[]{
        // TODO
        return null;
    }

}

export class NInterface extends NClassLike {

    methodInfoList: NMethodInfo[] = [];
    attributeInfo: NAttributeInfo[] = [];
    extends: (NInterface|NUnknownClasslike)[];
    

    getCastExpression(otherType: NType): NExpression {
        return { e: `thread.cast($1,"${otherType.identifier}")` }
    }
    castTo(otherType: NType, value: any) {
        return value;
    }
    getOperatorExpression(operator: TokenType, otherType?: NType): NExpression {
        if (operator == TokenType.plus && otherType.identifier == "String") {
            // TODO: Aufruf von toString richtig compilieren
            return { e: '($1 == null ? "null" : $1.toString()) + $2' }
        }
        return null;
    }
    getOperatorResultType(operator: TokenType, otherType: NType): NType {
        if (operator == TokenType.plus && otherType.identifier == "String") {
            return otherType;
        }
        return null;
    }

    public debugOutput(value: any, maxLength?: number): string {
        // Todo: Aufruf der toString-Methode
        return "[" + this.identifier + "]";
    }

    getAllMethods(): NMethodInfo[]{
        // TODO
        return null;
    }

}

export class NGenericParameter extends NClassLike {

    extends: (NClassLike | NInterface)[] = [];
    super: NClass | NUnknownClasslike = null;

    constructor(identifier: string, type?: (NClassLike | NInterface), public isBound: boolean = false){
        super(identifier);
        if(type != null){
            this.extends.push(type);
        }
    }

    getCastExpression(otherType: NType): NExpression {
        return { e: `thread.cast($1,"${otherType.identifier}")` }
    }
    castTo(otherType: NType, value: any) {
        return value;
    }
    getOperatorExpression(operator: TokenType, otherType?: NType): NExpression {
        if (operator == TokenType.plus && otherType.identifier == "String") {
            // TODO: Aufruf von toString richtig compilieren
            return { e: '($1 == null ? "null" : $1.toString()) + $2' }
        }
        return null;
    }
    getOperatorResultType(operator: TokenType, otherType: NType): NType {
        if (operator == TokenType.plus && otherType.identifier == "String") {
            return otherType;
        }
        return null;
    }

    public debugOutput(value: any, maxLength?: number): string {
        // Todo: Aufruf der toString-Methode
        return "[" + this.identifier + "]";
    }

    getAllMethods(): NMethodInfo[]{
        // TODO
        return null;
    }

}

