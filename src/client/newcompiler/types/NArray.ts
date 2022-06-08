import { TokenType } from "src/client/compiler/lexer/Token.js";
import { NExpression, NType } from "./NewType.js";

export class NArray extends NType {

    elementType: NType;
    dimensions: number;



    getCastExpression(otherType: NType): NExpression {
        throw new Error("Method not implemented.");
    }
    castTo(otherType: NType, value: any) {
        throw new Error("Method not implemented.");
    }
    getOperatorExpression(operator: TokenType, otherType?: NType): NExpression {
        throw new Error("Method not implemented.");
    }
    getOperatorResultType(operator: TokenType, otherType: NType): NType {
        throw new Error("Method not implemented.");
    }
    compute(operator: TokenType, otherType: NType, value1: any, value2?: any) {
        throw new Error("Method not implemented.");
    }
    equals(otherType: NType): boolean {
        throw new Error("Method not implemented.");
    }
    public debugOutput(value: any, maxLength?: number): string {
        throw new Error("Method not implemented.");
    }

}