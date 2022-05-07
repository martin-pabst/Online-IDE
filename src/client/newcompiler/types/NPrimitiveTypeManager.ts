import { TokenType } from "src/client/compiler/lexer/Token.js";
import { ConstantNode } from "src/client/compiler/parser/AST.js";
import { VoidType, NullType, NIntPrimitiveType, NLongPrimitiveType, NFloatPrimitiveType, NDoublePrimitiveType, NBooleanPrimitiveType, NCharPrimitiveType } from "./NewPrimitiveType.js";
import { NType } from "./NewType.js";
import { NObjectType } from "../runtime/NObjectType.js";
import { NStringType } from "../runtime/StringType.js";
import { NIntegerType } from "../runtime/BoxedTypes.js";

export class NPrimitiveTypeManager {
    void: VoidType = new VoidType();
    null: NullType = new NullType();
    int: NIntPrimitiveType = new NIntPrimitiveType();
    long: NLongPrimitiveType = new NLongPrimitiveType();
    float: NFloatPrimitiveType = new NFloatPrimitiveType();
    double: NDoublePrimitiveType = new NDoublePrimitiveType();
    boolean: NBooleanPrimitiveType = new NBooleanPrimitiveType();
    char: NCharPrimitiveType = new NCharPrimitiveType();
    
    Object: NObjectType = new NObjectType(this);
    String: NStringType = new NStringType(this);

    Integer: NIntegerType = new NIntegerType(this);
    

    allPrimitiveTypes: NType[] = [this.void, this.null, this.int, this.float, this.double, this.boolean, this.char, 
        this.String, this.Object,
        this.Integer];

    stringEscapeCharacters: {[char: string]: string} = {
        "\n" : "\\n",
        "\\" : "\\\\",
        "\t" : "\\t",
        "\"" : "\\\""
    }

    tokenTypeToTypeMap: {[tokenType: number] : NType} = {
        [TokenType.keywordNull]: this.null,
        [TokenType.integerConstant] : this.int,
        [TokenType.floatingPointConstant] : this.float,
        [TokenType.stringConstant] : this.String,
        [TokenType.charConstant]: this.char,
        [TokenType.booleanConstant]: this.boolean
    }

    identifierToTypeMap: {[identifier: string] : NType} = {
        "null": this.null,
        "int" : this.int,
        "float" : this.float,
        "double" : this.double,
        "String" : this.String,
        "char": this.char,
        "boolean": this.boolean
    }

    getConstantTypeFromTokenType(tt: TokenType){
        return this.tokenTypeToTypeMap[tt];
    }

    getTypeFromIdentifier(identifier: string){
        return this.identifierToTypeMap[identifier];
    }

    getConstantLiteral(node: ConstantNode){

        switch(node.constantType){
            case TokenType.stringConstant: 
            case TokenType.charConstant:
                return "\"" + this.escapeString(node.constant) + "\"";
            case TokenType.booleanConstant:
                return node.constant ? "true" : "false";
            case TokenType.keywordNull:
                return "null";
            default:
                return "" + node.constant;

        }
        
    }

    escapeString(s: string){
        let dest: string = "";
        for(let i = 0; i < s.length - 1; i++){
            let c = s.charAt(i);
            let newC = this.identifierToTypeMap[c];
            if(newC != null) {
                dest += newC;
            } else {
                dest += c;
            }
        } 
        return dest;
    }

}
