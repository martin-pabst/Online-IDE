import { TokenType } from "src/client/compiler/lexer/Token.js";
import { NRuntimeObject } from "../NRuntimeObject.js";
import { NMethodInfo, NParameterlist, NVariable } from "../types/NAttributeMethod.js";
import { NClass } from "../types/NClass.js";
import { NPrimitiveType } from "../types/NewPrimitiveType.js";
import { NExpression, NType } from "../types/NewType.js";
import { NPrimitiveTypeManager } from "../types/PrimitiveTypeManager.js";

type MethodShorthand = {
    id: string,
    parameters: {name: string, type: NType}[],
    returnType: NType,
    exp: string
}


export class NObjectType extends NClass {

    constructor(pt: NPrimitiveTypeManager){
        super("Object");

        let methodShorthands: MethodShorthand[] = [
            {id: "toString", parameters: [], returnType: pt.String, exp: "$1.__class.identifier"}
        ]

        for(let ms of methodShorthands){
            let method: NMethodInfo = new NMethodInfo();
            method.identifier = ms.id;
            method.returnType = ms.returnType;
            method.expression = ms.exp;

            method.parameterlist = new NParameterlist(ms.parameters.map(p => {
                return new NVariable(p.name, p.type);
            }))

            this.addMethod(method);
        }

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

}
