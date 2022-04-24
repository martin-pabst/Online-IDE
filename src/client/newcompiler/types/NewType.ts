import { TokenType } from "src/client/compiler/lexer/Token.js";
import { TextPositionWithModule, UsagePositions } from "src/client/compiler/types/Types.js";
import { NProgram } from "../compiler/NProgram.js";


export type NExpression = {
    condition?: string;
    errormessage?: string;
    e: string; // Expression
}

export abstract class NType {

    public usagePositions: UsagePositions = new Map();
    public declaration: TextPositionWithModule;

    public documentation: string = "";

    abstract getCastExpression(otherType: NType): NExpression;        // e.g. Math.floor($1)
    abstract castTo(otherType: NType, value: any): any;

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

