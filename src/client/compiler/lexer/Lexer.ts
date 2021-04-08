import { TokenList, specialCharList, TokenType, Token, EscapeSequenceList, keywordList, TextPosition, TokenTypeReadable } from "./Token.js";
import { text } from "express";

enum LexerState {
    number, identifier, stringConstant, characterConstant, multilineComment, EndoflineComment
}

var endChar = "►"; // \u10000

export type QuickFix = {
    title: string,
    editsProvider: (uri: monaco.Uri) => monaco.languages.WorkspaceTextEdit[]
}

export type ErrorLevel = "info" | "error" | "warning";

export type Error = {
    position: TextPosition,
    text: string,
    quickFix?: QuickFix,
    level: ErrorLevel
}

export class Lexer {

    tokenList: TokenList;
    nonSpaceLastTokenType: TokenType;

    errorList: Error[];
    pos: number;
    line: number;
    column: number;

    currentChar: string;
    nextChar: string;

    input: string;

    spaceTokens: TokenType[] = [
        TokenType.space, TokenType.tab, TokenType.newline
    ];

    bracketStack: TokenType[];
    bracketError: string;
    correspondingBracket: { [key: number]: TokenType } = {};

    constructor() {
        this.correspondingBracket[TokenType.leftBracket] = TokenType.rightBracket;
        this.correspondingBracket[TokenType.leftCurlyBracket] = TokenType.rightCurlyBracket;
        this.correspondingBracket[TokenType.leftSquareBracket] = TokenType.rightSquareBracket;
        this.correspondingBracket[TokenType.rightBracket] = TokenType.leftBracket;
        this.correspondingBracket[TokenType.rightCurlyBracket] = TokenType.leftCurlyBracket;
        this.correspondingBracket[TokenType.rightSquareBracket] = TokenType.leftSquareBracket;
    }

    lex(input: string): { tokens: TokenList, errors: Error[], bracketError: string } {

        this.input = input.replace("\u00a0", " ");
        this.tokenList = [];
        this.errorList = [];
        this.bracketError = null;
        this.bracketStack = [];
        this.pos = 0;
        this.line = 1;
        this.column = 1;
        this.nonSpaceLastTokenType = null;


        if (input.length == 0) {
            return { tokens: this.tokenList, errors: this.errorList, bracketError: null };
        }

        this.currentChar = input.charAt(0);

        this.nextChar = input.length > 1 ? input.charAt(1) : endChar;


        while (this.currentChar != endChar) {
            this.mainState();
        }

        if (this.bracketStack.length > 0) {
            let bracketOpen = this.bracketStack.pop();
            let bracketClosed = this.correspondingBracket[bracketOpen];

            this.setBracketError(TokenTypeReadable[bracketOpen] + " " + TokenTypeReadable[bracketClosed]);
        }

        return {
            tokens: this.tokenList,
            errors: this.errorList,
            bracketError: this.bracketError
        };

    }

    checkClosingBracket(tt: TokenType) {
        if (this.bracketStack.length == 0) {
            let bracketOpen = this.correspondingBracket[tt];
            this.setBracketError(TokenTypeReadable[bracketOpen] + " " + TokenTypeReadable[tt]);
            return;
        }
        let openBracket = this.bracketStack.pop();
        let correspondingBracket = this.correspondingBracket[openBracket];
        if (tt != correspondingBracket) {
            this.setBracketError(TokenTypeReadable[openBracket] + " " + TokenTypeReadable[correspondingBracket]);
        }
    }

    setBracketError(error: string) {
        if (this.bracketError == null) this.bracketError = error;
    }

    next() {
        this.pos++;
        this.currentChar = this.nextChar;
        if (this.pos + 1 < this.input.length) {
            this.nextChar = this.input.charAt(this.pos + 1);
        } else {
            this.nextChar = endChar;
        }
        this.column++; // column of current char
    }



    mainState() {

        let char = this.currentChar;

        let specialCharToken = specialCharList[char];

        if (specialCharToken != null) {
            switch (specialCharToken) {
                case TokenType.leftSquareBracket:
                    if (this.nextChar == "]") {
                        this.pushToken(TokenType.leftRightSquareBracket, "[]");
                        this.next();
                        this.next();
                        return;
                    } else {
                        this.pushToken(TokenType.leftSquareBracket, "[");
                        this.bracketStack.push(specialCharToken);
                        this.next();
                        return;
                    }
                case TokenType.rightSquareBracket:
                    this.checkClosingBracket(specialCharToken);
                    break;
                case TokenType.leftBracket:
                    this.bracketStack.push(specialCharToken);
                    break;
                case TokenType.rightBracket:
                    this.checkClosingBracket(specialCharToken);
                    break;
                case TokenType.leftCurlyBracket:
                    this.bracketStack.push(specialCharToken);
                    break;
                case TokenType.rightCurlyBracket:
                    this.checkClosingBracket(specialCharToken);
                    break;
                case TokenType.and:
                    if (this.nextChar == "&") {
                        this.pushToken(TokenType.and, "&&");
                        this.next();
                        this.next();
                        return;
                    } else {
                        this.pushToken(TokenType.ampersand, "&");
                        this.next();
                        return;
                    }
                case TokenType.or:
                    if (this.nextChar == "|") {
                        this.pushToken(TokenType.or, "||");
                        this.next();
                        this.next();
                        return;
                    } else {
                        this.pushError("| gefunden. Gemeint ist wohl || (Oder-Operator)?", 1);
                        this.pushToken(TokenType.or, "||");
                        this.next();
                        return;
                    }
                case TokenType.multiplication:
                    if (this.nextChar == "=") {
                        this.pushToken(TokenType.multiplicationAssignment, "*=");
                        this.next();
                        this.next();
                        return;
                    } else {
                        this.pushToken(TokenType.multiplication, "*");
                        this.next();
                        return;
                    }
                case TokenType.not:
                    if (this.nextChar == "=") {
                        this.pushToken(TokenType.notEqual, "!=");
                        this.next();
                        this.next();
                        return;
                    } else {
                        this.pushToken(TokenType.not, "!");
                        this.next();
                        return;
                    }
                case TokenType.division:
                    if (this.nextChar == "=") {
                        this.pushToken(TokenType.divisionAssignment, "/=");
                        this.next();
                        this.next();
                        return;
                    } else if (this.nextChar == '*') {
                        this.lexMultilineComment();
                        return;
                    } else if (this.nextChar == '/') {
                        this.lexEndofLineComment();
                        return;
                    }
                    this.pushToken(TokenType.division, '/');
                    this.next();
                    return;
                case TokenType.modulo:
                    if (this.nextChar == "=") {
                        this.pushToken(TokenType.moduloAssignment, "%=");
                        this.next();
                        this.next();
                        return;
                    } else {
                        this.pushToken(TokenType.modulo, "/");
                        this.next();
                        return;
                    }
                case TokenType.plus:
                    if (this.nextChar == '+') {
                        this.pushToken(TokenType.doublePlus, '++');
                        this.next();
                        this.next();
                        return;
                    } else if (this.nextChar == '=') {
                        this.pushToken(TokenType.plusAssignment, '+=');
                        this.next();
                        this.next();
                        return;
                    } else {
                        this.pushToken(TokenType.plus, '+');
                        this.next();
                        return;
                    }
                case TokenType.lower:
                    if (this.nextChar == '=') {
                        this.pushToken(TokenType.lowerOrEqual, '<=');
                        this.next();
                        this.next();
                        return;
                    } else {
                        this.pushToken(TokenType.lower, '<');
                        this.next();
                        return;
                    }
                case TokenType.greater:
                    if (this.nextChar == '=') {
                        this.pushToken(TokenType.greaterOrEqual, '>=');
                        this.next();
                        this.next();
                        return;
                    } else {
                        this.pushToken(TokenType.greater, '>');
                        this.next();
                        return;
                    }
                case TokenType.dot:
                    if (this.nextChar == '.' && this.pos + 2 < this.input.length && this.input[this.pos + 2] == ".") {
                        this.pushToken(TokenType.ellipsis, '...');
                        this.next();
                        this.next();
                        this.next();
                        return;
                    } else {
                        this.pushToken(TokenType.dot, '.');
                        this.next();
                        return;
                    }

                case TokenType.assignment:
                    if (this.nextChar == '=') {
                        this.pushToken(TokenType.equal, '==');
                        this.next();
                        this.next();
                        return;
                    } else {
                        this.pushToken(TokenType.assignment, '=');
                        this.next();
                        return;
                    }
                case TokenType.minus:
                    if (this.nextChar == '-') {
                        this.pushToken(TokenType.doubleMinus, '--');
                        this.next();
                        this.next();
                        return;
                    }
                    else if (this.isDigit(this.nextChar, 10) && !
                        ([TokenType.identifier, TokenType.integerConstant, TokenType.floatingPointConstant, TokenType.rightBracket].indexOf(this.nonSpaceLastTokenType) >= 0)
                    ) {
                        this.lexNumber();
                        return;
                    }
                    else if (this.nextChar == '=') {
                        this.pushToken(TokenType.minusAssignment, '-=');
                        this.next();
                        this.next();
                        return;
                    } else {
                        this.pushToken(TokenType.minus, '-');
                        this.next();
                        return;
                    }
                case TokenType.singleQuote:
                    this.lexCharacterConstant();
                    return;
                case TokenType.doubleQuote:
                    this.lexStringConstant();
                    return;
                case TokenType.newline:
                    this.pushToken(TokenType.newline, '\n');
                    this.line++;
                    this.column = 0;
                    this.next();
                    return;
                case TokenType.space:
                case TokenType.tab:
                    this.lexSpace();
                    return;
                case TokenType.linefeed:
                    this.next();
                    return;
                case TokenType.at:
                    this.lexAnnotation();
                    this.next();
                    return;
            }

            this.pushToken(specialCharToken, char);
            this.next();
            return;

        }

        // no special char. Number?

        if (this.isDigit(char, 10)) {
            this.lexNumber();
            return;
        }

        this.lexIdentifierOrKeyword();

    }

    pushToken(tt: TokenType, text: string | number | boolean, line: number = this.line, column: number = this.column, length: number = ("" + text).length) {
        let t: Token = {
            tt: tt,
            value: text,
            position: {
                column: column,
                line: line,
                length: length
            }
        }

        if (!(this.spaceTokens.indexOf(tt) >= 0)) {
            this.nonSpaceLastTokenType = tt;
        }

        this.tokenList.push(t);
    }

    pushError(text: string, length: number, errorLevel: ErrorLevel = "error", line: number = this.line, column: number = this.column) {
        this.errorList.push({
            text: text,
            position: {
                line: line,
                column: column,
                length: length
            },
            level: errorLevel
        });
    }



    isDigit(a: string, base: number) {
        var charCode = a.charCodeAt(0);

        if(base == 10) return (charCode >= 48 && charCode <= 57); // 0 - 9
        if(base == 2) return (charCode >= 48 && charCode <= 49); // 0, 1
        if(base == 8) return (charCode >= 48 && charCode <= 55); // 0 - 7
        if(base == 16) return (charCode >= 48 && charCode <= 57 ) || (charCode >= 97 && charCode <= 102) ||
         (charCode >= 65 && charCode <= 70); // 0 - 9 || a - f || A - F
    }

    lexSpace() {
        let column = this.column;
        let line = this.line;

        let posStart = this.pos;
        while (this.currentChar == " " || this.currentChar == "\t") {
            this.next();
        }

        let posEnd = this.pos;
        this.pushToken(TokenType.space, this.input.substring(posStart, posEnd), line, column);
        return;

    }

    lexCharacterConstant() {
        let column = this.column;
        let line = this.line;
        this.next();
        let char = this.currentChar;
        if (char == "\\") {
            let escapeChar = EscapeSequenceList[this.nextChar];
            if (escapeChar == null) {
                this.pushError('Die Escape-Sequenz \\' + this.nextChar + ' gibt es nicht.', 2);
                if (this.nextChar != "'") {
                    char = this.nextChar;
                    this.next();
                }
            } else {
                char = escapeChar;
                this.next();
            }
        }
        this.next();
        if (this.currentChar != "'") {
            this.pushError("Das Ende der char-Konstante wird erwartet (').", 1);
        } else {
            this.next();
        }

        this.pushToken(TokenType.charConstant, char, line, column);

    }

    lexStringConstant() {
        let line = this.line;
        let column = this.column;
        let text = "";

        this.next();

        while (true) {
            let char = this.currentChar;
            if (char == "\\") {
                if (this.nextChar == "u") {
                    this.next();

                } else {
                    let escapeChar = EscapeSequenceList[this.nextChar];
                    if (escapeChar == null) {
                        this.pushError('Die Escape-Sequenz \\' + this.nextChar + ' gibt es nicht.', 2);
                    } else {
                        char = escapeChar;
                        this.next();
                    }
                }
            } else if (char == '"') {
                this.next();
                break;
            } else if (char == "\n" || char == endChar) {
                this.pushError('Innerhalb einer String-Konstante wurde das Zeilenende erreicht.', text.length + 1, "error", line, column);
                break;
            }
            text += char;
            this.next();
        }

        this.pushToken(TokenType.stringConstant, text, line, column, text.length + 2);

    }

    lexMultilineComment() {
        let line = this.line;
        let column = this.column;
        let lastCharWasNewline: boolean = false;

        let text = "/*";
        this.next();
        this.next();

        while (true) {
            let char = this.currentChar;
            if (char == "*" && this.nextChar == "/") {
                this.next();
                this.next();
                text += "*/";
                break;
            }
            if (char == endChar) {
                this.pushError("Innerhalb eines Mehrzeilenkommentars (/*... */) wurde das Dateiende erreicht.", 1);
                break;
            }
            if (char == "\n") {
                this.line++;
                this.column = 0;
                lastCharWasNewline = true;
                text += char;
            } else if(!(lastCharWasNewline && char == " ")){
                text += char;
                lastCharWasNewline = false;
            } 

            this.next();
        }

        this.pushToken(TokenType.comment, text, line, column);

    }

    lexEndofLineComment() {
        let line = this.line;
        let column = this.column;

        let text = "//";
        this.next();
        this.next();

        while (true) {
            let char = this.currentChar;
            if (char == "\n") {
                break;
            }
            if (char == endChar) {
                // this.pushError("Innerhalb eines Einzeilenkommentars (//... ) wurde das Dateiende erreicht.", 1);
                break;
            }
            text += char;
            this.next();
        }

        this.pushToken(TokenType.comment, text, line, column);

    }


    lexNumber() {
        let line = this.line;
        let column = this.column;

        let sign: number = 1;
        if(this.currentChar == '-'){
            sign = -1;
            this.next();
        }

        let posStart = this.pos;

        let firstChar = this.currentChar;

        this.next();

        let radix: number = 10;

        if (firstChar == '0' && (['b', 'x', '0', '1', '2', '3', '4', '5', '6', '7'].indexOf(this.currentChar) >= 0)) {
            if (this.currentChar == 'x') {
                radix = 16;
                this.next();
            } else if (this.currentChar == 'b') {
                radix = 2;
                this.next();
            } else radix = 8;
            posStart = this.pos;
        }

        while (this.isDigit(this.currentChar, radix)) {
            this.next();
        }

        let tt = TokenType.integerConstant;

        if (this.currentChar == ".") {
            tt = TokenType.floatingPointConstant;

            this.next();
            while (this.isDigit(this.currentChar, 10)) {
                this.next();
            }

            if (radix != 10) {
                this.pushError("Eine float/double-Konstante darf nicht mit 0, 0b oder 0x beginnen.", this.pos - posStart, "error", this.line, this.column - (this.pos - posStart));
            }

        }

        let base = this.input.substring(posStart, this.pos);

        posStart = this.pos;
        let exponent: number = 0;

        let hasExponential: boolean = false;
        //@ts-ignore
        if (this.currentChar == "e") {
            hasExponential = true;
            this.next();
            let posExponentStart: number = this.pos;

            //@ts-ignore
            if(this.currentChar == '-'){
                this.next();
            }

            while (this.isDigit(this.currentChar, 10)) {
                this.next();
            }
            if (radix != 10) {
                this.pushError("Eine float/double-Konstante darf nicht mit 0, 0b oder 0x beginnen.", this.pos - posStart, "error", this.line, this.column - (this.pos - posStart));
            }
            let exponentString = this.input.substring(posExponentStart, this.pos);
            exponent = Number.parseInt(exponentString);
        }

        if(this.currentChar == 'd' || this.currentChar == 'f'){
            tt == TokenType.floatingPointConstant;
            this.next();
            if(radix != 10){
                this.pushError("Eine float/double-Konstante darf nicht mit 0, 0b oder 0x beginnen.", this.pos - posStart, "error", this.line, this.column - (this.pos - posStart));
            }
        }

        let value: number = (tt == TokenType.integerConstant) ? Number.parseInt(base, radix) : Number.parseFloat(base);
        value *= sign;
        if(exponent != 0) value *= Math.pow(10, exponent);       
        
        this.pushToken(tt, value, line, column);

    }

    lexAnnotation(){
        let line = this.line;
        let column = this.column - 1;
        let posStart = this.pos;
        let char = this.currentChar;

        while (specialCharList[char] == null && !this.isSpace(char) && !(char == endChar)) {
            this.next();
            char = this.currentChar;
        }

        let posEnd = this.pos;

        let text = this.input.substring(posStart, posEnd);
        this.pushToken(TokenType.at,text, line, column, text.length + 1);        
    }

    lexIdentifierOrKeyword() {
        let line = this.line;
        let column = this.column;

        let posStart = this.pos;
        let char = this.currentChar;

        while (specialCharList[char] == null && !this.isSpace(char) && !(char == endChar)) {
            this.next();
            char = this.currentChar;
        }

        let posEnd = this.pos;

        let text = this.input.substring(posStart, posEnd);

        let tt = keywordList[text];
        if (tt != null && typeof tt == "number") {

            switch (tt) {
                case TokenType.true:
                    this.pushToken(TokenType.booleanConstant, true, line, column);
                    break;
                case TokenType.false:
                    this.pushToken(TokenType.booleanConstant, false, line, column);
                    break;
                case TokenType.keywordPrint:
                case TokenType.keywordPrintln:
                    if (this.nonSpaceLastTokenType == TokenType.dot) {
                        this.pushToken(TokenType.identifier, text, line, column);
                    } else {
                        this.pushToken(tt, text, line, column);
                    }
                    break;
                default:
                    this.pushToken(tt, text, line, column);
                    break;
            }

            return;
        }

        this.pushToken(TokenType.identifier, text, line, column);

    }

    isSpace(char: string): boolean {
        return char == " " || char == "\n";
    }


}

export function errorListToString(errorList: Error[]): string {
    let s = "";

    for (let error of errorList) {

        s += "Z " + error.position.line + ", S " + error.position.column + ": ";
        s += error.text + "<br>";

    }

    return s;
}