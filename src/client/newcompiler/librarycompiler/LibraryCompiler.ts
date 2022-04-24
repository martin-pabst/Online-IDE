import { Lexer } from "src/client/compiler/lexer/Lexer.js";
import { Token, TokenList, TokenType, TokenTypeReadable } from "src/client/compiler/lexer/Token.js";
import { NRuntimeObject } from "../NRuntimeObject.js";
import { NAttributeInfo, NMethodInfo, NVariable } from "../types/NAttributeMethod.js";
import { NClass, NClassLike, NGenericParameter, NInterface } from "../types/NClass.js";
import { NPrimitiveTypes } from "../types/NewPrimitiveType.js";
import { NType } from "../types/NewType.js";
import { NVisibility, NVisibilityUtility } from "../types/NVisibility.js";
import { NUnknownClasslike } from "./UnknownClasslike.js";

export class LibraryCompiler {

    tokenList: TokenList;
    pos: number;

    constructor(private pt: NPrimitiveTypes) {

    }

    setTokenList(tokenList: TokenList) {
        this.tokenList = tokenList.filter(t => {
            return [TokenType.space, TokenType.newline, TokenType.endofSourcecode].indexOf(t.tt) < 0
        });

        this.pos = 0;
    }

    nextToken(): Token {
        if (this.pos < this.tokenList.length) {
            let token = this.tokenList[this.pos];
            this.pos++;
            return token;
        }
        return null;
    }

    isEndOfTokenlist(): boolean {
        return this.pos == this.tokenList.length;
    }

    comesToken(tt: TokenType | TokenType[], skip: boolean = false): boolean {
        if (!Array.isArray(tt)) tt = [tt];
        if (this.pos < this.tokenList.length) {
            if (tt.indexOf(this.tokenList[this.pos].tt) >= 0) {
                if (skip) this.pos++;
                return true;
            }
        }
        return false;
    }

    expect(tt: TokenType | TokenType[], skip: boolean = false): boolean {
        if (!Array.isArray(tt)) tt = [tt];
        if (this.pos < this.tokenList.length) {
            if (tt.indexOf(this.tokenList[this.pos].tt) >= 0) {
                if (skip) this.pos++;
                return true;
            }
        }
        console.log("Expected one of: " + tt.map(t => {return TokenTypeReadable[t]}).join(", ") + "; found: " + this.foundTokenAsString());
        return false;
    }

    peekTokenType(): TokenType {
        if (this.pos < this.tokenList.length) {
            return this.tokenList[this.pos].tt;
        }

        return TokenType.endofSourcecode;
    }

    foundTokenAsString(): string {
        if (this.pos < this.tokenList.length) {
            return <string>this.tokenList[this.pos].value;
        }

        return "end of signature";
    }


    /**
     * e.g. void, int, ArrayList<HashMap<Integer, String>>, ArrayList<N> (in contect class MyTest<N>)
     */
    compileTypeFirstPass(classContext: NClassLike): NType {

        if (this.isEndOfTokenlist()) {
            console.log("Warning: LibraryCompiler.compileTypeFirstPass -> tokenlength == 0; returning void...");
            return this.pt.void;
        }

        let firstToken = this.nextToken();

        if (firstToken.tt != TokenType.identifier) {
            console.log("Warning: LibraryCompiler.compileTypeFirstPass -> expecting identifier, got '" + firstToken.value + "'; returning void...");
            return this.pt.void;
        }

        let identifier = <string>firstToken.value;
        let primitiveType = this.pt.getTypeFromIdentifier(identifier);
        if (primitiveType != null) {
            return primitiveType;
        }

        if (classContext != null) {
            for (let genericParameter of classContext.genericParameters) {
                if (genericParameter.identifier == identifier) {
                    return genericParameter;
                }
            }
        }

        let type = new NUnknownClasslike(identifier);

        if (this.comesToken(TokenType.lower, true)) {
            while (this.comesToken(TokenType.identifier)) {

                type.genericParameters.push(this.compileBoundGenericParameter(classContext));

                this.comesToken(TokenType.comma, true);
            }
            if (!this.comesToken(TokenType.greater)) {
                console.log("LibraryCompiler.compileTypeFirstPass -> expecting >");
            }
        }

        return type;

    }

    compileBoundGenericParameter(classContext: NClassLike): NGenericParameter {
        let type1 = this.compileTypeFirstPass(classContext);
        if ((type1 instanceof NClassLike) || (type1 instanceof NInterface)) {
            let genericParameter = new NGenericParameter("", type1, true);
            return genericParameter;
        } else {
            console.log("LibraryCompiler.compileTypeFirstPass -> expecting identifier, got '" + type1.identifier + "'.");
            return new NGenericParameter("", null, true);
        }
    }

    compileSystemClass(runtimeObject: NRuntimeObject):NClassLike {

        let classOrInterface = <NClass|NInterface>this.compileClassSignature(runtimeObject);

        for(const [signature, program] of Object.entries(runtimeObject.__getMethods())){
            classOrInterface.methodInfoList.push(this.compileMethod(signature, program, classOrInterface));
        }

        for(let attributeSignature of runtimeObject.__getAttributes()){
            classOrInterface.attributeInfo.push(this.compileAttribute(attributeSignature, classOrInterface));           
        }

        return classOrInterface;

    }

    // TODO 24.04.2022: Static class...
    compileAttribute(attributeSignature: string, classOrInterface: NInterface | NClass): NAttributeInfo {
        this.setTokenList(Lexer.quicklex(attributeSignature));
        let modifiers = this.compileAbstractAndVisibilityModifiers();
        let type = this.compileTypeFirstPass(classOrInterface);
        let identifier: string = "";
        if(!this.comesToken(TokenType.identifier)){
            console.log("LibraryCompiler.compileMethod: Identifier expected in signature '" + attributeSignature + "', found: " + this.foundTokenAsString() + ".");
        } else {
            identifier = <string>this.nextToken().value;
        }
        let attribute = new NAttributeInfo(identifier, type, modifiers.static, modifiers.visibility, modifiers.isFinal);
        
        // TODO: distinguish between static and non-static!
        classOrInterface.attributeInfo.push(attribute);

    }

    compileMethod(signature: string, program: any, classOrInterface: NInterface | NClass): NMethodInfo {
        this.setTokenList(Lexer.quicklex(signature));
        let abstractAndVisibilityModifiers = this.compileAbstractAndVisibilityModifiers();
        let type = this.compileTypeFirstPass(classOrInterface);
        let identifier: string = "";
        if(!this.comesToken(TokenType.identifier)){
            console.log("LibraryCompiler.compileMethod: Identifier expected in signature '" + signature + "', found: " + this.foundTokenAsString() + ".");
        } else {
            identifier = <string>this.nextToken().value;
        }

        let method: NMethodInfo = new NMethodInfo();
        method.identifier = identifier;
        method.returnType = type;
        method.isAbstract = abstractAndVisibilityModifiers.abstract;
        method.visibility = abstractAndVisibilityModifiers.visibility;
        method.isStatic = abstractAndVisibilityModifiers.static;

        this.expect(TokenType.leftBracket, true);

        let numberOfParameters: number = 0;
        while(this.comesToken(TokenType.identifier)){

            let type = this.compileTypeFirstPass(classOrInterface);
            let parameterIdentifier = "";
            if(this.expect(TokenType.identifier)){
                parameterIdentifier = <string>this.nextToken().value;
            }
            let parameter = new NVariable(identifier, type);
            numberOfParameters++;
            parameter.stackPos = numberOfParameters; // stackpos 0 is for this-object!
            method.parameterlist.parameters.push(parameter);
            this.comesToken(TokenType.comma, true)
        }

        this.expect(TokenType.rightBracket, true);
    }

    private compileClassSignature(runtimeObject: NRuntimeObject) {
        this.setTokenList(Lexer.quicklex(runtimeObject.__getSignature()));

        let abstractAndVisibilityModifiers = this.compileAbstractAndVisibilityModifiers();

        let tt = this.nextToken().tt;
        let identifier: string = <string>this.nextToken().value;
        let classLike: NClassLike;
        switch (tt) {
            case TokenType.keywordClass:
                classLike = new NClass(identifier);
                (<NClass>classLike).isAbstract = abstractAndVisibilityModifiers.abstract;
                break;
            case TokenType.keywordInterface:
                classLike = new NInterface(identifier);
                break;
            // TODO
            // case TokenType.keywordEnum:
            //     classLike = new NEnum(identifier);
            // break;           
        }

        classLike.visibility = abstractAndVisibilityModifiers.visibility;

        if (this.comesToken(TokenType.lower)) {
            this.nextToken();
            while (this.comesToken(TokenType.identifier)) {
                classLike.genericParameters.push(this.compileUnboundGenericParameter(classLike));
                this.comesToken(TokenType.comma, true);
            }
            this.comesToken(TokenType.greater, true);
        }

        while (this.comesToken([TokenType.keywordExtends, TokenType.keywordImplements])) {
            if (this.nextToken().tt == TokenType.keywordExtends) {
                let type = this.compileTypeFirstPass(classLike);
                if (type instanceof NClassLike) {
                    if (classLike instanceof NClass) {
                        classLike.extends = type;
                    }
                    if (classLike instanceof NInterface) {
                        classLike.extends.push(type);
                    }
                } else {
                    console.log("LibraryCompiler.compileSystemClass: expecting class or interface, got: " + type.identifier + ".");
                }
            } else {
                if (classLike instanceof NInterface) {
                    console.log("LibraryCompiler.compileSystemClass: use keyword 'extends' to extend interface, not 'implements'.");
                } else {
                    while (this.comesToken(TokenType.identifier)) {
                        let type1 = this.compileTypeFirstPass(classLike);
                        if (type1 instanceof NClassLike) {
                            if (classLike instanceof NClass) {
                                classLike.implements.push(type1);
                            }
                        } else {
                            console.log("LibraryCompiler.compileSystemClass: expecting interface, got: " + type1.identifier + ".");
                        }
                        this.comesToken(TokenType.comma, true);
                    }
                }
            }
        }
        return classLike;
    }

    private compileAbstractAndVisibilityModifiers():{abstract: boolean, visibility: NVisibility, static: boolean, isFinal: boolean} {
        let visibility: NVisibility = NVisibility.public;
        let isAbstract = false;
        let isStatic = false;
        let isFinal = false;

        let notDone: boolean = true;
        while (notDone) {
            let tt = this.peekTokenType();
            switch (tt) {
                case TokenType.keywordPublic:
                case TokenType.keywordPrivate:
                case TokenType.keywordProtected:
                    visibility = NVisibilityUtility.tokenTypeToVisibility(tt);
                    this.nextToken();
                    break;
                case TokenType.keywordAbstract:
                    isAbstract = true;
                    this.nextToken();
                    break;
                case TokenType.keywordStatic:
                    isStatic = true;
                    this.nextToken();
                    break;
                case TokenType.keywordFinal:
                    isFinal = true;
                    this.nextToken();
                    break;
                default:
                    notDone = false;
                    break;
            }
        }

        return {abstract: isAbstract, visibility: visibility, static: isStatic}
    }

    compileUnboundGenericParameter(classContext: NClassLike): NGenericParameter {

        let identifier = <string>this.nextToken().value;

        let genericParameter = new NGenericParameter(identifier);

        while (this.comesToken([TokenType.keywordExtends, TokenType.keywordSuper], false)) {

            switch (this.nextToken().tt) {
                case TokenType.keywordExtends:
                    while (this.comesToken(TokenType.identifier)) {
                        let type = this.compileTypeFirstPass(classContext);
                        if (type instanceof NClassLike) {
                            genericParameter.extends.push(type);
                        } else {
                            console.log("LibraryCompiler.compileUnboundGenericParameter: expecting class or interface, got " + type.identifier + ".");
                        }
                        this.comesToken(TokenType.ampersand, true);
                    }
                    break;
                case TokenType.keywordSuper:
                    let type = this.compileTypeFirstPass(classContext);
                    if (type instanceof NClassLike) {
                        genericParameter.super = type;
                    } else {
                        console.log("LibraryCompiler.compileUnboundGenericParameter: expecting class or interface, got " + type.identifier + ".");
                    }

            }

        }

        this.comesToken(TokenType.greater, true);

        return genericParameter;
    }



}