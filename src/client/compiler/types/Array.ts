import { Method, Attribute, Value, Type, Parameterlist, PrimitiveType } from "./Types.js";
import { TokenType } from "../lexer/Token.js";
import { intPrimitiveType } from "./PrimitiveTypes.js";
import { Visibility } from "./Class.js";

export class ArrayType extends Type {

    public arrayOfType: Type;
    private lengthAttribute: Attribute;

    constructor(arrayOfType: Type){
        super();
        this.arrayOfType = arrayOfType;
        this.identifier = "Array";

        if(arrayOfType != null){
            this.identifier = arrayOfType.identifier + "[]";
        }

        this.lengthAttribute = new Attribute("length", intPrimitiveType, (object: Value) => {
            return (<any[]>object.value).length;
        }, false, Visibility.public, true);
    }   

    public equals(type:Type): boolean{
        return (type instanceof ArrayType) && type.arrayOfType.equals(this.arrayOfType);
    }

    public get id():string{
        return this.arrayOfType.identifier + "[]";
    }

    public getResultType(operation: TokenType, secondOperandType?: Type): Type {
        if(operation == TokenType.referenceElement){
            return this.arrayOfType;
        }

        return null;

    }

    public compute(operation: TokenType, firstOperand: Value, secondOperand?: Value): any {

        if(operation == TokenType.referenceElement){
            return <any[]>firstOperand.value[<number>secondOperand.value];
        }

    }

    public getMethod(identifier: string, signature: Parameterlist): Method{
        return null;
    }

    public getAttribute(identifier: string): Attribute{
        if(identifier == "length"){
            return this.lengthAttribute;
        }
        return null;
    }

    public canCastTo(type: Type): boolean{

        if(!(type instanceof ArrayType)){
            return false;
        }

        return this.arrayOfType.canCastTo(type.arrayOfType);
    }

    public castTo(value: Value, type: Type): Value {

        let array = (<Value[]>value.value).slice();
        let destType = (<ArrayType><unknown>type).arrayOfType;

        for(let a of array){
            this.arrayOfType.castTo(a, destType);
        }

        return {
            type: type,
            value: array
        }

    }

    public debugOutput(value: Value, maxLength: number = 40):string {

        let length: number = 0;

        if(value.value != null){

            let s: string = "[";

                let a: Value[] = <Value[]>value.value;

                for(let i = 0; i < a.length; i++){

                    let v = a[i];

                    let s1 = v.type.debugOutput(v, maxLength/2);

                    s += s1;
                    if(i < a.length - 1) s += ",&nbsp;";
                    length += s1.length;

                    if(length > maxLength) break;

                }

            return s + "]"

        } else return "null";


    }


}
