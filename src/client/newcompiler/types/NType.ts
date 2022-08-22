import { TextPositionWithModule, UsagePositions } from "../compiler/Commontypes.js";
import { TokenType } from "../lexer/Token.js";


export type NExpression = {
    e: string; // Expression
}

export abstract class NType {

    public usagePositions: UsagePositions = new Map();
    public declaration: TextPositionWithModule;

    public documentation: string = "";

    abstract getCastExpression(otherType: NType): NExpression;        // e.g. Math.floor($1); null if cast is not possible
    abstract castTo(otherType: NType, value: any): any;

    unboxableAs?: NType;

    constructor(public identifier: string){

    }

    canCastTo(otherType: NType): boolean {
        return this.getCastExpression(otherType) != null;
    }

    abstract getOperatorExpression(operator: TokenType, otherType?: NType): NExpression;       // e.g. $1 + $2
    abstract getOperatorResultType(operator: TokenType, otherType: NType): NType;
    abstract compute(operator: TokenType, otherType: NType, value1: any, value2?: any): any;

    abstract equals(otherType: NType): boolean;

    public abstract debugOutput(value: any, maxLength?: number): string;

    public isPrimitive(): boolean {
        return false;
    }

}

