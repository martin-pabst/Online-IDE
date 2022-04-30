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


export class NStringType extends NClass {

    constructor(pt: NPrimitiveTypeManager){
        super("String");
        
        this.extends = pt.Object;

        let methodShorthands: MethodShorthand[] = [
            {id: "length", parameters: [], returnType: pt.int, exp: "$1.length"},
            {id: "isEmpty", parameters: [], returnType: pt.boolean, exp: "($1.length == 0)"}
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
        
        if(operator == TokenType.plus){
            if(otherType instanceof NPrimitiveType || otherType.identifier == "String"){
                return {e: "$1 + $2"}
            }
        }
        
        return { e: "" };
    }

    getOperatorResultType(operator: TokenType, otherType: NType): NType {
        if(operator == TokenType.plus){
            if(otherType instanceof NPrimitiveType || otherType.identifier == "String"){
                return this;
            }
        }
    }

    compute(operator: TokenType, otherType: NType, value1: any, value2?: any) {
        if(operator == TokenType.plus){
            if(otherType instanceof NPrimitiveType || otherType.identifier == "String"){
                return value1 + value2;
            }
        }
    }

}
