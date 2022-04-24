import { TokenType } from "src/client/compiler/lexer/Token.js";
import { NExpression, NType } from "./NewType.js";



export class NPrimitiveTypes {
    void: VoidType = new VoidType();
    null: NullType = new NullType();
    int: NIntPrimitiveType = new NIntPrimitiveType();
    float: NFloatPrimitiveType = new NFloatPrimitiveType();
    double: NDoublePrimitiveType = new NDoublePrimitiveType();
    boolean: NBooleanPrimitiveType = new NBooleanPrimitiveType();
    char: NCharPrimitiveType = new NCharPrimitiveType();
    
    allPrimitiveTypes: NType[] = [this.void, this.null, this.int, this.float, this.double, this.boolean, this.char];

    tokenTypeToTypeMap: {[tokenType: number] : NType} = {
        [TokenType.keywordNull]: this.null,
        [TokenType.integerConstant] : this.int,
        [TokenType.floatingPointConstant] : this.float,
        [TokenType.stringConstant] : this.String,
        [TokenType.charConstant]: this.char,
        [TokenType.booleanConstant]: this.boolean
    }

    identifierToTypeMap: {[identifier: string] : NType} = {
        "null": this.null,
        "int" : this.int,
        "float" : this.float,
        "double" : this.double,
        "String" : this.String,
        "char": this.char,
        "boolean": this.boolean
    }

    getConstantTypeFromTokenType(tt: TokenType){
        return this.tokenTypeToTypeMap[tt];
    }

    getTypeFromIdentifier(identifier: string){
        return this.identifierToTypeMap[identifier];
    }

}

export type NCastPrimitiveInformation = {
    expression?: string; // e.g. "$1 - $1%0" for casting float to int
    castFunction?: (value: any) => any;
}


export class VoidType extends NType {

    constructor(){super("void")}

    getCastExpression(otherType: NType): NExpression {
        return {e:""};
    }
    castTo(otherType: NType, value: any) {
        return value;
    }
    getOperatorExpression(operator: TokenType, otherType?: NType): NExpression {
        return { e: "" };
    }
    getOperatorResultType(operator: TokenType, otherType: NType): NType {
        return null;
    }
    compute(operator: TokenType, otherType: NType, value1: any, value2?: any) {
        return null;
    }
    equals(otherType: NType): boolean {
        return otherType == this;
    }
    public debugOutput(value: any, maxLength?: number): string {
        return "void";
    }

}

export class VarType extends NType {
    constructor(){super("var")}
    getCastExpression(otherType: NType): NExpression {
        return {e:""};
    }
    castTo(otherType: NType, value: any) {
        return value;
    }
    getOperatorExpression(operator: TokenType, otherType?: NType): NExpression {
        return { e: "" };
    }
    getOperatorResultType(operator: TokenType, otherType: NType): NType {
        return null;
    }
    compute(operator: TokenType, otherType: NType, value1: any, value2?: any) {
        return null;
    }
    equals(otherType: NType): boolean {
        return otherType == this;
    }
    public debugOutput(value: any, maxLength?: number): string {
        return "void";
    }

}

export class NullType extends NType {
    constructor(){super("null")}

    getCastExpression(otherType: NType): NExpression {
        return {e:"$1"};
    }
    castTo(otherType: NType, value: any) {
        return value;
    }
    getOperatorExpression(operator: TokenType, otherType?: NType): NExpression {
        return { e: "$1" };
    }
    getOperatorResultType(operator: TokenType, otherType: NType): NType {
        return this;
    }
    compute(operator: TokenType, otherType: NType, value1: any, value2?: any) {
        return null;
    }
    equals(otherType: NType): boolean {
        return otherType == this;
    }
    public debugOutput(value: any, maxLength?: number): string {
        return "null";
    }

}

export abstract class NPrimitiveType extends NType {

    protected resultTypeStringTable: { [operation: number]: { [typename: string]: string } }
    protected resultTypeTable: { [operation: number]: { [typename: string]: NType } }

    protected canCastToMap: { [type: string]: NCastPrimitiveInformation };

    constructor(identifier: string, public initialValue: any){
        super(identifier);
    }

    public isPrimitive(): boolean {
        return true;
    }

    public equals(type: NType): boolean {
        return type == this;
    }

    getCastExpression(otherType: NType): NExpression {
        let expr = this.canCastToMap[otherType.identifier].expression;
        return {e: expr == null ? "$1" : expr};
    }

    castTo(otherType: NType, value: any): any {
        let castInfo = this.canCastToMap[otherType.identifier];
        return castInfo.expression == null ? value : castInfo.castFunction(value);
    }

    getOperatorResultType(operator: TokenType, otherType: NType): NType {
        return this.resultTypeTable[operator][otherType.identifier];
    }


    public debugOutput(value: any, maxLength?: number): string {
        let str = (value + "");
        return str.length > length ?
            str.substring(0, length - 3) + "..." :
            str;
    }

    protected getStandardOperatorExpression(operator: TokenType, otherType?: NType): NExpression {
        let expression: string;
        let condition: string = null;
        let errormessage: string = null;
        switch (operator) {
            case TokenType.plus:
                if (otherType.identifier == "String") {
                    expression = '"" + $1 + $2';
                } else {
                    expression = "$1 + $2";
                }

            case TokenType.minus:
                if (otherType == null) expression = "-$1";
                expression = "$1 - $2";

            case TokenType.multiplication:
                expression = "$1*$2";

            case TokenType.doublePlus:
                expression = "$1++";

            case TokenType.doubleMinus:
                expression = "$1--";

            case TokenType.negation:
                expression = "-$1";

            case TokenType.tilde:
                expression = "~$1";

            case TokenType.lower:
                expression = "$1 < $2";

            case TokenType.greater:
                expression = "$1 > $2";

            case TokenType.lowerOrEqual:
                expression = "$1 <= $2";

            case TokenType.greaterOrEqual:
                expression = "$1 <= $2";

            case TokenType.equal:
                expression = "$1 == $2";

            case TokenType.notEqual:
                expression = "$1 != $2";

            case TokenType.OR:
                expression = "$1 | $2";

            case TokenType.XOR:
                expression = "$1 ^ $2";

            case TokenType.ampersand:
                expression = "$1 & $2";

            case TokenType.shiftLeft:
                expression = "$1 << $2";

            case TokenType.shiftRight:
                expression = "$1 >> $2";

            case TokenType.shiftRightUnsigned:
                expression = "$1 >>> $2";

        }

        return { e: expression, condition: condition, errormessage: errormessage };
    }

    protected standardCompute(operator: TokenType, otherType: NType, value1: any, value2?: any): any {

        switch (operator) {
            case TokenType.plus:
                if (otherType.identifier == "String") {
                    return value1 + <string>(value2);
                } else {
                    return value1 + <number>(value2);
                }

            case TokenType.minus:
                if (value2 == null) return -value1;
                return value1 - <number>(value2);

            case TokenType.multiplication:
                return value1 * <number>(value2);

            case TokenType.doublePlus:
                return value1++;

            case TokenType.doubleMinus:
                return value1--;

            case TokenType.negation:
                return -value1;

            case TokenType.tilde:
                return ~value1;

            case TokenType.lower:
                return value1 < (<number>(value2));

            case TokenType.greater:
                return value1 > <number>(value2);

            case TokenType.lowerOrEqual:
                return value1 <= <number>(value2);

            case TokenType.greaterOrEqual:
                return value1 >= <number>(value2);

            case TokenType.equal:
                return value1 == <number>(value2);

            case TokenType.notEqual:
                return value1 != <number>(value2);

            case TokenType.OR:
                return value1 | <number>(value2);

            case TokenType.XOR:
                return value1 ^ <number>(value2);

            case TokenType.ampersand:
                return value1 & <number>(value2);

            case TokenType.shiftLeft:
                return value1 << <number>(value2);

            case TokenType.shiftRight:
                return value1 >> <number>(value2);

            case TokenType.shiftRightUnsigned:
                return value1 >>> <number>(value2);

        }
    }
}

export class NIntPrimitiveType extends NPrimitiveType {
    constructor() {
        super("int", 0);
        this.canCastToMap = {
            "double": { expression: null }, "float": { expression: null },
            "char": { expression: "String.fromCharCode($1)", castFunction: (v) => { return String.fromCharCode(v) } },
            "String": { expression: '("" + $1)', castFunction: (v) => { return "" + v } }
        };
        this.resultTypeStringTable = {
            [TokenType.plus]: { "int": "int", "Integer": "int", "float": "float", "Float": "float", "double": "double", "Double": "double", "String": "String" },
            [TokenType.minus]: { "none": "int", "int": "int", "Integer": "int", "float": "float", "Float": "float", "double": "double", "Double": "double" },
            [TokenType.multiplication]: { "int": "int", "Integer": "int", "float": "float", "Float": "float", "double": "double", "Double": "double" },
            [TokenType.modulo]: { "int": "int", "Integer": "int" },
            [TokenType.division]: { "int": "int", "Integer": "int", "float": "float", "Float": "float", "double": "double", "Double": "double" },
            [TokenType.doublePlus]: { "none": "int" },
            [TokenType.doubleMinus]: { "none": "int" },
            [TokenType.negation]: { "none": "int" },
            [TokenType.tilde]: { "none": "int" },
            [TokenType.lower]: { "int": "boolean", "float": "boolean", "double": "boolean", "Integer": "boolean", "Float": "boolean", "Double": "boolean" },
            [TokenType.greater]: { "int": "boolean", "float": "boolean", "double": "boolean", "Integer": "boolean", "Float": "boolean", "Double": "boolean" },
            [TokenType.lowerOrEqual]: { "int": "boolean", "float": "boolean", "double": "boolean", "Integer": "boolean", "Float": "boolean", "Double": "boolean" },
            [TokenType.greaterOrEqual]: { "int": "boolean", "float": "boolean", "double": "boolean", "Integer": "boolean", "Float": "boolean", "Double": "boolean" },
            [TokenType.equal]: { "int": "boolean", "float": "boolean", "double": "boolean", "Integer": "boolean", "Float": "boolean", "Double": "boolean" },
            [TokenType.notEqual]: { "int": "boolean", "float": "boolean", "double": "boolean", "Integer": "boolean", "Float": "boolean", "Double": "boolean" },

            // binary ops
            [TokenType.OR]: { "int": "int", "Integer": "int" },
            [TokenType.XOR]: { "int": "int", "Integer": "int" },
            [TokenType.ampersand]: { "int": "int", "Integer": "int" },
            [TokenType.shiftLeft]: { "int": "int", "Integer": "int" },
            [TokenType.shiftRight]: { "int": "int", "Integer": "int" },
            [TokenType.shiftRightUnsigned]: { "int": "int", "Integer": "int" }

        }
    }

    getOperatorExpression(operator: TokenType, otherType?: NType): NExpression {
        let expression: string;

        switch (operator) {
            case TokenType.division:
                if (otherType.identifier == "int") {
                    expression = "Math.trunc($1/$2)"
                } else {
                    expression = "$1/$2"
                }
                return { e: expression, condition: "$2 != 0", errormessage: "Division durch 0 ist nicht erlaubt." };
            case TokenType.modulo:
                if (otherType.identifier == "int") {
                    expression = "Math.trunc($1 % $2)"
                } else {
                    expression = "1";
                }
                return { e: expression, condition: "$2 != 0", errormessage: "Modulo 0 ist nicht erlaubt." };
            default:
                return this.getStandardOperatorExpression(operator, otherType);
        }
    }

    compute(operator: TokenType, otherType: NType, value1: any, value2?: any): any {

        switch (operator) {
            case TokenType.division:
                if (otherType.identifier == "int") {
                    return Math.trunc(value1 / <number>(value2));
                }
                return value1 / <number>(value2);

            case TokenType.modulo:
                if (otherType.identifier == "int") {
                    return Math.trunc(value1 % <number>(value2));
                }
                return 1;

            default: return this.standardCompute(operator, otherType, value1, value2);
        }

    }

}

export class NFloatPrimitiveType extends NPrimitiveType {
    constructor() {
        super("float", 0.0);
        this.canCastToMap = {
            "double": { expression: null }, "float": { expression: null },
            "String": { expression: '("" + $1)', castFunction: (v) => { return "" + v } }
        };
        this.resultTypeStringTable = {
            [TokenType.plus]: { "int": "float", "Integer": "float", "float": "float", "Float": "float", "double": "double", "Double": "double", "String": "String" },
            [TokenType.minus]: { "none": "int", "int": "float", "Integer": "float", "float": "float", "Float": "float", "double": "double", "Double": "double" },
            [TokenType.multiplication]: { "int": "float", "Integer": "float", "float": "float", "Float": "float", "double": "double", "Double": "double" },
            [TokenType.division]: { "int": "float", "Integer": "float", "float": "float", "Float": "float", "double": "double", "Double": "double" },
            [TokenType.doublePlus]: { "none": "float" },
            [TokenType.doubleMinus]: { "none": "float" },
            [TokenType.negation]: { "none": "float" },
            [TokenType.lower]: { "int": "boolean", "float": "boolean", "double": "boolean", "Integer": "boolean", "Float": "boolean", "Double": "boolean" },
            [TokenType.greater]: { "int": "boolean", "float": "boolean", "double": "boolean", "Integer": "boolean", "Float": "boolean", "Double": "boolean" },
            [TokenType.lowerOrEqual]: { "int": "boolean", "float": "boolean", "double": "boolean", "Integer": "boolean", "Float": "boolean", "Double": "boolean" },
            [TokenType.greaterOrEqual]: { "int": "boolean", "float": "boolean", "double": "boolean", "Integer": "boolean", "Float": "boolean", "Double": "boolean" },
            [TokenType.equal]: { "int": "boolean", "float": "boolean", "double": "boolean", "Integer": "boolean", "Float": "boolean", "Double": "boolean" },
            [TokenType.notEqual]: { "int": "boolean", "float": "boolean", "double": "boolean", "Integer": "boolean", "Float": "boolean", "Double": "boolean" },
        }
    }

    getOperatorExpression(operator: TokenType, otherType?: NType): NExpression {
        let expression: string;

        switch (operator) {
            case TokenType.division:
                expression = "$1/$2"
                return { e: expression, condition: "$2 != 0", errormessage: "Division durch 0 ist nicht erlaubt." };
            default:
                return this.getStandardOperatorExpression(operator, otherType);
        }
    }

    compute(operator: TokenType, otherType: NType, value1: any, value2?: any): any {

        switch (operator) {
            case TokenType.division:
                return value1 / <number>(value2);

            default: return this.standardCompute(operator, otherType, value1, value2);
        }

    }

}

export class NDoublePrimitiveType extends NPrimitiveType {
    constructor() {
        super("double", 0.0);
        this.canCastToMap = {
            "double": { expression: null }, "float": { expression: null },
            "String": { expression: '("" + $1)', castFunction: (v) => { return "" + v } }
        };
        this.resultTypeStringTable = {
            [TokenType.plus]: { "int": "double", "Integer": "double", "float": "double", "Float": "double", "double": "double", "Double": "double", "String": "String" },
            [TokenType.minus]: { "none": "int", "int": "double", "Integer": "double", "float": "double", "Float": "double", "double": "double", "Double": "double" },
            [TokenType.multiplication]: { "int": "double", "Integer": "double", "float": "double", "Float": "double", "double": "double", "Double": "double" },
            [TokenType.division]: { "int": "double", "Integer": "double", "float": "double", "Float": "double", "double": "double", "Double": "double" },
            [TokenType.doublePlus]: { "none": "double" },
            [TokenType.doubleMinus]: { "none": "double" },
            [TokenType.negation]: { "none": "double" },
            [TokenType.lower]: { "int": "boolean", "float": "boolean", "double": "boolean", "Integer": "boolean", "Float": "boolean", "Double": "boolean" },
            [TokenType.greater]: { "int": "boolean", "float": "boolean", "double": "boolean", "Integer": "boolean", "Float": "boolean", "Double": "boolean" },
            [TokenType.lowerOrEqual]: { "int": "boolean", "float": "boolean", "double": "boolean", "Integer": "boolean", "Float": "boolean", "Double": "boolean" },
            [TokenType.greaterOrEqual]: { "int": "boolean", "float": "boolean", "double": "boolean", "Integer": "boolean", "Float": "boolean", "Double": "boolean" },
            [TokenType.equal]: { "int": "boolean", "float": "boolean", "double": "boolean", "Integer": "boolean", "Float": "boolean", "Double": "boolean" },
            [TokenType.notEqual]: { "int": "boolean", "float": "boolean", "double": "boolean", "Integer": "boolean", "Float": "boolean", "Double": "boolean" },
        }
    }

    getOperatorExpression(operator: TokenType, otherType?: NType): NExpression {
        let expression: string;

        switch (operator) {
            case TokenType.division:
                expression = "$1/$2"
                return { e: expression, condition: "$2 != 0", errormessage: "Division durch 0 ist nicht erlaubt." };
            default:
                return this.getStandardOperatorExpression(operator, otherType);
        }
    }

    compute(operator: TokenType, otherType: NType, value1: any, value2?: any): any {

        switch (operator) {
            case TokenType.division:
                return value1 / <number>(value2);

            default: return this.standardCompute(operator, otherType, value1, value2);
        }

    }

}

export class NBooleanPrimitiveType extends NPrimitiveType {
    constructor() {
        super("boolean", false);
        this.identifier = "boolean";
        this.initialValue = false;

        this.canCastToMap = {
            "String": { expression: '$1 ? "true" : "false"', castFunction: (v) => { return v ? "true" : "false" } }
        };

        this.resultTypeStringTable = {
            [TokenType.plus]: { "String": "String" },
            [TokenType.and]: { "boolean": "boolean" },
            [TokenType.or]: { "boolean": "boolean" },
            [TokenType.not]: { "none": "boolean" },
            [TokenType.equal]: { "boolean": "boolean" },
            [TokenType.notEqual]: { "boolean": "boolean" },
        }
    }

    getOperatorExpression(operator: TokenType, otherType?: NType): NExpression {

        switch (operator) {
            case TokenType.plus:
                return { e: '(($1 ? "true" : "false") + $2)'}
            case TokenType.and:
                return {e: '$1 && $2'}
            case TokenType.or:
                return {e: '$1 || $2'}
            case TokenType.not:
                return {e: '!$1'}
            case TokenType.equal:
                return {e: '$1 == $2'}
            case TokenType.notEqual:
                return {e: '$1 != $2'}
            default:
                break;
        }


    }

    compute(operator: TokenType, otherType: NType, value1: any, value2?: any): any {

        switch (operator) {
            case TokenType.plus:
                return (value1 ? "true" : "false") + value2;
            case TokenType.and: return value1 && value2;
            case TokenType.or: return value1 || value2;
            case TokenType.not: return !value1;
            case TokenType.equal: return value1 == value2;
            case TokenType.notEqual: return value1 != value2;
            default:
                break;
        }

    }

}

export class NCharPrimitiveType extends NPrimitiveType {
    constructor() {
        super("char", "\u0000");

        this.canCastToMap = {
            "String": { expression: '$1', castFunction: (v) => { return v } }
        };
        this.resultTypeStringTable = {
            [TokenType.plus]: { "char": "String", "String": "String" },
            [TokenType.lower]: { "char": "boolean" },
            [TokenType.greater]: { "char": "boolean" },
            [TokenType.lowerOrEqual]: { "char": "boolean" },
            [TokenType.greaterOrEqual]: { "char": "boolean" },
            [TokenType.equal]: { "char": "boolean" },
            [TokenType.notEqual]: { "char": "boolean" },
        }
    }

    getOperatorExpression(operator: TokenType, otherType?: NType): NExpression {

        return this.getStandardOperatorExpression(operator, otherType);
    }

    compute(operator: TokenType, otherType: NType, value1: any, value2?: any): any {

        return this.standardCompute(operator, otherType, value1, value2);

    }

}