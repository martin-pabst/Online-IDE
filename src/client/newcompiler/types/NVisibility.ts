import { TokenType } from "src/client/compiler/lexer/Token.js";

export enum NVisibility { public, protected, private };

export class NVisibilityUtility {
    static tokenTypeToVisibility(tt: TokenType){
        switch(tt){
            case TokenType.keywordPrivate:
                return NVisibility.private;
            case TokenType.keywordPublic:
                return NVisibility.public;
            case TokenType.keywordProtected:
                return NVisibility.protected;
            
        }
    }
}