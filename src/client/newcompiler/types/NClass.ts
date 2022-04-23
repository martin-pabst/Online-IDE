import { TokenType } from "../../compiler/lexer/Token.js";
import { NAttributeInfo, NExpression, NMethodInfo, NType } from "./NewType.js";
import { RuntimeObjectPrototype } from "../NRuntimeObject.js";

export abstract class NClassLike extends NType {

    allExtendedImplementedTypes: string[] = [];
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
    extends: NClass;
    implements: NInterface[] = [];
    
    runtimeObjectPrototype: RuntimeObjectPrototype;

    getCastExpression(otherType: NType): NExpression {
        return { e: "$1", condition: "$1.__class.allExtendedImplementedTypes.indexOf(" + otherType.identifier + ") >= 0", errormessage: "Casting nach " + otherType.identifier + " nicht möglich." }
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
    extends: NInterface[];
    

    getCastExpression(otherType: NType): NExpression {
        return { e: "$1", condition: "$1.__class.allExtendedImplementedTypes.indexOf(" + otherType.identifier + ") >= 0", errormessage: "Casting nach " + otherType.identifier + " nicht möglich." }
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

export class NGenericType extends NClassLike {

    extendsClass: NClass;
    extendsInterfaces: NInterface[];
    super: NClass;

    getCastExpression(otherType: NType): NExpression {
        return { e: "$1", condition: "$1.__class.allExtendedImplementedTypes.indexOf(" + otherType.identifier + ") >= 0", 
        errormessage: "Casting nach " + otherType.identifier + " nicht möglich." }
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

