import { TokenType } from "../lexer/Token.js";
import { NExpression, NType } from "./NType.js";

export class NArrayType extends NType {


    constructor(public elementType: NType, public dimension: number){
        super(elementType.identifier + "[]".repeat(dimension));
    }

    getCastExpression(otherType: NType): NExpression {
        if(!(otherType instanceof NArrayType)) return null;
        if(otherType.dimension != this.dimension) return null;
        let ce = this.elementType.getCastExpression(otherType.elementType);
        if(ce != null && ce.e == "$1") return {e: "$1"};
        return null;
    }
    castTo(otherType: NType, value: any) {
        return value;
    }
    getOperatorExpression(operator: TokenType, otherType?: NType): NExpression {
        return null;
    }
    getOperatorResultType(operator: TokenType, otherType: NType): NType {
        return null;
    }
    compute(operator: TokenType, otherType: NType, value1: any, value2?: any) {
        return null;
    }
    equals(otherType: NType): boolean {
        return null;
    }

    public debugOutput(value: any, maxLength?: number): string {
        if(value == null) return "null";
        let length = 1;
        let a = <any[]> value;
        let elementStrings: string[] = [];

        for(let e of a){
            let eString = this.elementType.debugOutput(e, maxLength - length - 2);
            if(length + eString.length + 1 >= maxLength) break;
            elementStrings.push(eString);
        }
        
        if(elementStrings.length < a.length) elementStrings.push("...");

        return "[" + elementStrings.join(", ") + "]";

    }

}