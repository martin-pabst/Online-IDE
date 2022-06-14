import { TokenType } from "src/client/compiler/lexer/Token.js";
import { NRuntimeObject } from "../NRuntimeObject.js";
import { NMethodInfo, NParameterlist, NVariable } from "../types/NAttributeMethod.js";
import { NClass } from "../types/NClass.js";
import { NPrimitiveType } from "../types/NewPrimitiveType.js";
import { NExpression, NType } from "../types/NewType.js";
import { NPrimitiveTypeManager } from "../types/NPrimitiveTypeManager.js";



export class NObjectType extends NClass {

    constructor(pt: NPrimitiveTypeManager){
        super("Object");

            let method: NMethodInfo = new NMethodInfo();
            method.identifier = "toString()";
            method.returnType = pt.String;
            method.invoke = (thread: any) => {
                    //@ts-ignore
                    return this.__class.identifier;
                }

            method.parameterlist = new NParameterlist([]);

            this.addMethod(method);
            this.setupRuntimeObjectPrototype();
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
