import { TokenType } from "src/client/compiler/lexer/Token.js";
import { NProgram } from "../compiler/NProgram.js";
import { NRuntimeObject } from "../NRuntimeObject.js";
import { NAttributeInfo, NMethodInfo, NParameterlist, NVariable } from "../types/NAttributeMethod.js";
import { NClass } from "../types/NClass.js";
import { NPrimitiveType } from "../types/NewPrimitiveType.js";
import { NExpression, NType } from "../types/NewType.js";
import { NPrimitiveTypeManager } from "../types/NPrimitiveTypeManager.js";
import { NVisibility } from "../types/NVisibility.js";

export class NBoxedType extends NClass {
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


export class NIntegerType extends NClass {

    constructor(pt: NPrimitiveTypeManager){
        super("Integer");
        
        this.extends = pt.Object;
        this.unboxableAs = pt.int;
        let that = this;

        this.addAttribute(new NAttributeInfo("value", pt.int, false, NVisibility.private, false));
        this.addStaticAttribute(new NAttributeInfo("MAX_VALUE", pt.int, true, NVisibility.public, true, "Maximaler Wert, den eine int-Variable annehmen kann"), 0x7fffffff);
        this.addStaticAttribute(new NAttributeInfo("MIN_VALUE", pt.int, true, NVisibility.public, true, "Minimaler Wert, den eine int-Variable annehmen kann"), -0x80000000);

        this.addJavascriptMethod("intValue", [], pt.int, false, (thread: any, This: any) => { return This._att[0]; })
        this.addJavascriptMethod("valueOf", [new NVariable("i", pt.int)], this, true, 
            (thread: any, This: any, i: number) => { 
                let obj = Object.create(that.runtimeObjectPrototype);
                obj.__att = [i];
                return obj;    
             });

        //@ts-ignore
        this.runtimeObjectPrototype = {};
        this.runtimeObjectPrototypeIsClass = false;
        this.setupVirtualMethodTable();
    }

}

export class NFloatType extends NClass {

    constructor(pt: NPrimitiveTypeManager){
        super("Float");
        
        this.extends = pt.Object;
        this.unboxableAs = pt.int;
        let that = this;

        this.addAttribute(new NAttributeInfo("value", pt.float, false, NVisibility.private, false));

        this.addJavascriptMethod("floatValue", [], pt.int, false, (thread: any, This: any) => { return This._att[0]; })
        this.addJavascriptMethod("valueOf", [new NVariable("f", pt.float)], this, true, 
            (thread: any, This: any, i: number) => { 
                let obj = Object.create(that.runtimeObjectPrototype);
                obj.__att = [i];
                return obj;    
             });

        //@ts-ignore
        this.runtimeObjectPrototype = {};
        this.runtimeObjectPrototypeIsClass = false;
        this.setupVirtualMethodTable();
    }

}
