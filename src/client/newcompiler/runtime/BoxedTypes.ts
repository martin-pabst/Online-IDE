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

export class NLongType extends NClass {

    constructor(pt: NPrimitiveTypeManager){
        super("Long");
        
        this.extends = pt.Object;
        this.unboxableAs = pt.long;
        let that = this;

        this.addAttribute(new NAttributeInfo("value", pt.long, false, NVisibility.private, false));
        this.addStaticAttribute(new NAttributeInfo("MAX_VALUE", pt.long, true, NVisibility.public, true, "Maximaler Wert, den eine long-Variable annehmen kann"), 0x7fffffff);
        this.addStaticAttribute(new NAttributeInfo("MIN_VALUE", pt.long, true, NVisibility.public, true, "Minimaler Wert, den eine long-Variable annehmen kann"), -0x80000000);

        this.addJavascriptMethod("longValue", [], pt.long, false, (thread: any, This: any) => { return This._att[0]; })
        this.addJavascriptMethod("valueOf", [new NVariable("i", pt.long)], this, true, 
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
        this.unboxableAs = pt.float;
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

export class NDoubleType extends NClass {

    constructor(pt: NPrimitiveTypeManager){
        super("Double");
        
        this.extends = pt.Object;
        this.unboxableAs = pt.double;
        let that = this;

        this.addAttribute(new NAttributeInfo("value", pt.double, false, NVisibility.private, false));

        this.addJavascriptMethod("doubleValue", [], pt.double, false, (thread: any, This: any) => { return This._att[0]; })
        this.addJavascriptMethod("valueOf", [new NVariable("d", pt.double)], this, true, 
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

export class NBooleanType extends NClass {

    constructor(pt: NPrimitiveTypeManager){
        super("Boolean");
        
        this.extends = pt.Object;
        this.unboxableAs = pt.boolean;
        let that = this;

        this.addAttribute(new NAttributeInfo("value", pt.boolean, false, NVisibility.private, false));

        this.addJavascriptMethod("booleanValue", [], pt.boolean, false, (thread: any, This: any) => { return This._att[0]; })
        this.addJavascriptMethod("valueOf", [new NVariable("b", pt.boolean)], this, true, 
            (thread: any, This: any, i: boolean) => { 
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

export class NCharacterType extends NClass {

    constructor(pt: NPrimitiveTypeManager){
        super("Boolean");
        
        this.extends = pt.Object;
        this.unboxableAs = pt.char;
        let that = this;

        this.addAttribute(new NAttributeInfo("value", pt.char, false, NVisibility.private, false));

        this.addJavascriptMethod("charValue", [], pt.char, false, (thread: any, This: any) => { return This._att[0]; })
        this.addJavascriptMethod("valueOf", [new NVariable("c", pt.char)], this, true, 
            (thread: any, This: any, i: string) => { 
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
