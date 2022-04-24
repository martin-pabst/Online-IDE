import { TokenType } from "src/client/compiler/lexer/Token.js";
import { NMethodInfo } from "../types/NAttributeMethod.js";
import { NClassLike } from "../types/NClass.js";
import { NType, NExpression } from "../types/NewType.js";

export class NUnknownClasslike extends NClassLike {

    constructor(identifier: string){
        super(identifier);
    }

    getAllMethods(): NMethodInfo[] {
        throw new Error("Method not implemented.");
    }
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
    public debugOutput(value: any, maxLength?: number): string {
        throw new Error("Method not implemented.");
    }

}