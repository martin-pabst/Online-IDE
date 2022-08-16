import { TokenType } from "src/client/compiler/lexer/Token.js";
import { NAttributeInfo, NMethodInfo } from "./NAttributeMethod.js";
import { NClassLike, NInterface } from "./NClass.js";
import { NType, NExpression } from "./NType.js";

export class NEnum extends NClassLike {

    implements: NInterface[] = [];

    private methodInfoList: NMethodInfo[] = [];
    private attributeInfoList: NAttributeInfo[] = [];

    staticMethodInfoList: NMethodInfo[] = [];
    staticAttributeInfoList: NAttributeInfo[] = [];
    initialStaticValues: any[] = [];

    getSignatureIntern(): string {
        return "enum " + this.identifier;
    }

    containsUnresolvedGenericParameters(): boolean {
        return false;
    }

    buildShallowGenericCopy(mapOldToNewGenericParameters: Map<NClassLike, NClassLike>): NClassLike {
        return this;
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

    addMethod(mi: NMethodInfo) {
        if(mi.isStatic){
            this.staticMethodInfoList.push(mi);
        } else {
            this.methodInfoList.push(mi);
        }
    }

    addAttribute(ai: NAttributeInfo) {
        this.attributeInfoList.push(ai);
    }


}