import { Error, QuickFix, ErrorLevel } from "../lexer/Lexer.js";
import { TextPosition, Token, TokenList, TokenType, TokenTypeReadable } from "../lexer/Token.js";
import { Visibility, Klass } from "../types/Class.js";
import { ArrayInitializationNode, ASTNode, AttributeDeclarationNode, MethodDeclarationNode, NewArrayNode, ParameterNode, TermNode, TypeNode, EnumValueNode, SwitchNode, SwitchCaseNode, ConstantNode, BracketsNode, ScopeNode, TypeParameterNode, LocalVariableDeclarationNode } from "./AST.js";
import { Module } from "./Module.js";
import { stringPrimitiveType, intPrimitiveType, charPrimitiveType, TokenTypeToDataTypeMap, voidPrimitiveType } from "../types/PrimitiveTypes.js";
import { Enum } from "../types/Enum.js";
import { PrimitiveType, Type } from "../types/Types.js";

type ASTNodes = ASTNode[];

export class Parser {

    static assignmentOperators = [TokenType.assignment, TokenType.plusAssignment, TokenType.minusAssignment,
    TokenType.multiplicationAssignment, TokenType.divisionAssignment, TokenType.moduloAssignment,
    TokenType.ANDAssigment, TokenType.XORAssigment, TokenType.ORAssigment,
    TokenType.shiftLeftAssigment, TokenType.shiftRightAssigment, TokenType.shiftRightUnsignedAssigment];

    static operatorPrecedence: TokenType[][] = [Parser.assignmentOperators,
    [TokenType.ternaryOperator], [TokenType.colon],

    [TokenType.or], [TokenType.and], [TokenType.OR], [TokenType.XOR], [TokenType.ampersand],
    [TokenType.equal, TokenType.notEqual],
    [TokenType.keywordInstanceof, TokenType.lower, TokenType.lowerOrEqual, TokenType.greater, TokenType.greaterOrEqual],
    [TokenType.shiftLeft, TokenType.shiftRight, TokenType.shiftRightUnsigned],

    // [TokenType.or], [TokenType.and],
    // [TokenType.keywordInstanceof, TokenType.lower, TokenType.lowerOrEqual, TokenType.greater, TokenType.greaterOrEqual, TokenType.equal, TokenType.notEqual],

    [TokenType.plus, TokenType.minus], [TokenType.multiplication, TokenType.division, TokenType.modulo]
    ];

    static TokenTypeToVisibilityMap = {
        [TokenType.keywordPublic]: Visibility.public,
        [TokenType.keywordPrivate]: Visibility.private,
        [TokenType.keywordProtected]: Visibility.protected
    };

    static forwardToInsideClass = [TokenType.keywordPublic, TokenType.keywordPrivate, TokenType.keywordProtected, TokenType.keywordVoid,
    TokenType.identifier, TokenType.rightCurlyBracket, TokenType.keywordStatic, TokenType.keywordAbstract,
    TokenType.keywordClass, TokenType.keywordEnum, TokenType.keywordInterface];

    module: Module;

    pos: number;
    tokenList: TokenList;

    errorList: Error[];
    typeNodes: TypeNode[];

    lookahead = 4;
    ct: Token[];
    lastToken: Token;
    cct: Token;
    tt: TokenType;
    position: TextPosition;
    lastComment: Token;

    endToken: Token = {
        position: { line: 0, column: 0, length: 1 },
        tt: TokenType.endofSourcecode,
        value: "das Ende des Programms"
    };


    constructor(private isInConsoleMode: boolean) {

    }

    parse(m: Module) {

        this.module = m;

        this.tokenList = m.tokenList;
        this.errorList = [];

        if (this.tokenList.length == 0) {
            this.module.mainProgramAst = [];
            this.module.classDefinitionsAST = [];
            this.module.typeNodes = [];
            this.module.errors[1] = this.errorList;
            return;
        }

        this.pos = 0;
        this.initializeLookahead();

        this.typeNodes = [];

        let lastToken = this.tokenList[this.tokenList.length - 1];
        this.endToken.position = { line: lastToken.position.line, column: lastToken.position.column + lastToken.position.length, length: 1 };

        let astNodes = this.parseMain();
        this.module.mainProgramAst = astNodes.mainProgramAST;
        this.module.classDefinitionsAST = astNodes.classDefinitionAST;
        this.module.mainProgramEnd = astNodes.mainProgramEnd;
        this.module.typeNodes = this.typeNodes;

        this.module.errors[1] = this.errorList;

    }

    initializeLookahead() {

        this.ct = [];

        for (let i = 0; i < this.lookahead; i++) {

            let token: Token = this.endToken;

            while (true) {

                if (this.pos >= this.tokenList.length) break;

                let token1 = this.tokenList[this.pos]
                if (token1.tt == TokenType.comment) {
                    this.lastComment = token1;
                }

                if (token1.tt != TokenType.newline && token1.tt != TokenType.space && token1.tt != TokenType.comment) {
                    token = token1;
                    if (this.lastComment != null) {
                        token.commentBefore = this.lastComment;
                        this.lastComment = null;
                    }
                    break;
                }

                this.pos++;

            }

            this.ct.push(token);

            if (i < this.lookahead - 1) {
                this.pos++;
            }

        }

        this.cct = this.ct[0];
        this.tt = this.cct.tt;
        this.position = this.cct.position;

    }

    nextToken() {

        let token: Token;
        this.lastToken = this.cct;

        while (true) {

            this.pos++;

            if (this.pos >= this.tokenList.length) {
                token = this.endToken;
                break;
            }

            token = this.tokenList[this.pos]
            if (token.tt == TokenType.comment) {
                this.lastComment = token;
            }

            if (token.tt != TokenType.newline && token.tt != TokenType.space && token.tt != TokenType.comment) {
                token.commentBefore = this.lastComment;
                this.lastComment = null;
                break;
            }

        }

        for (let i = 0; i < this.lookahead - 1; i++) {
            this.ct[i] = this.ct[i + 1];
        }

        this.ct[this.lookahead - 1] = token;

        this.cct = this.ct[0];
        this.tt = this.cct.tt;
        this.position = this.cct.position;

    }

    pushError(text: string, errorLevel: ErrorLevel = "error", position?: TextPosition, quickFix?: QuickFix) {
        if (position == null) position = Object.assign({}, this.position);
        this.errorList.push({
            text: text,
            position: position,
            quickFix: quickFix,
            level: errorLevel
        });
    }

    expect(tt: TokenType, skip: boolean = true, invokeSemicolonAngel: boolean = false): boolean {
        if (this.tt != tt) {
            if (tt == TokenType.semicolon && this.tt == TokenType.endofSourcecode) {
                return true;
            }

            let position: TextPosition = this.cct.position;
            if (tt == TokenType.semicolon && this.lastToken != null) {

                if (this.lastToken.position.line < position.line) {
                    position = {
                        line: this.lastToken.position.line,
                        column: this.lastToken.position.column + this.lastToken.position.length,
                        length: 1
                    }
                }
            }

            let quickFix: QuickFix = null;
            if (tt == TokenType.semicolon && this.lastToken.position.line < this.cct.position.line &&
                !this.isOperatorOrDot(this.lastToken.tt)
            ) {
                quickFix = {
                    title: 'Strichpunkt hier einfügen',
                    editsProvider: (uri) => {
                        return [{
                            resource: uri,
                            edit: {
                                range: {
                                    startLineNumber: position.line, startColumn: position.column, endLineNumber: position.line, endColumn: position.column,
                                    message: "",
                                    severity: monaco.MarkerSeverity.Error
                                },
                                text: ";"
                            }
                        }
                        ];
                    }
                }

                if (invokeSemicolonAngel && this.errorList.length < 3) {
                    this.module.main.getSemicolonAngel().register(position, this.module);
                }
            }


            this.pushError("Erwartet wird: " + TokenTypeReadable[tt] + " - Gefunden wurde: " + TokenTypeReadable[this.tt], "error", position, quickFix);
            return false;
        }

        if (skip) {
            this.nextToken();
        }

        return true;
    }
    isOperatorOrDot(tt: TokenType): boolean {
        if (tt == TokenType.dot) return true;
        for (let op of Parser.operatorPrecedence) {
            for (let operator of op) {
                if (tt == operator) return true;
            }
        }
    }

    isEnd(): boolean {
        return this.cct == this.endToken;
    }

    comesToken(token: TokenType | TokenType[]): boolean {

        if (!Array.isArray(token)) {
            return this.tt == token;
        }

        return token.indexOf(this.tt) >= 0;

    }

    getCurrentPosition(): TextPosition {
        return Object.assign({}, this.position);
    }

    getEndOfCurrentToken(): TextPosition {

        let position = this.getCurrentPosition();
        position.column = position.column + this.position.length;
        position.length = 0;

        return position;
    }

    static ClassTokens: TokenType[] = [TokenType.keywordClass, TokenType.keywordEnum, TokenType.keywordInterface];
    static VisibilityTokens: TokenType[] = [TokenType.keywordPrivate, TokenType.keywordProtected, TokenType.keywordPublic];
    static BeforeClassDefinitionTokens: TokenType[] = Parser.ClassTokens.concat(Parser.VisibilityTokens)
        .concat(TokenType.keywordAbstract).concat(Parser.ClassTokens).concat([TokenType.keywordFinal]);

    parseMain(): { mainProgramAST: ASTNodes, mainProgramEnd: TextPosition, classDefinitionAST: ASTNodes } {

        let mainProgram: ASTNodes = [];
        let classDefinitions: ASTNodes = [];

        let mainProgramEnd: TextPosition = {
            column: 0,
            line: 10000,
            length: 1
        }

        while (!this.isEnd()) {

            let oldPos = this.pos;

            if (this.comesToken(Parser.BeforeClassDefinitionTokens)) {
                let cd = this.parseClassDefinition();
                if (cd != null) classDefinitions = classDefinitions.concat(cd);
            } else {
                let st = this.parseStatement();

                if (st != null) {
                    mainProgram = mainProgram.concat(st);
                }
                mainProgramEnd = this.getCurrentPosition();
            }

            // emergency-forward:
            if (this.pos == oldPos) {
                this.pos++;
                this.initializeLookahead();
            }

        }

        return {
            mainProgramAST: mainProgram,
            classDefinitionAST: classDefinitions,
            mainProgramEnd: mainProgramEnd
        }

    }


    checkIfStatementHasNoEffekt(st: ASTNode) {

        if (this.isInConsoleMode) return;

        if ((st.type == TokenType.binaryOp && Parser.assignmentOperators.indexOf(st.operator) < 0)) {
            let s = "dieses Terms";
            switch (st.operator) {
                case TokenType.plus: s = "dieser Summe"; break;
                case TokenType.minus: s = "dieser Differenz"; break;
                case TokenType.multiplication: s = "dieses Produkts"; break;
                case TokenType.division: s = "dieses Quotienten"; break;
            }
            s += " (Operator " + TokenTypeReadable[st.operator] + ")"
            this.pushError(`Der Wert ${s} wird zwar berechnet, aber danach verworfen. Möchtest Du ihn vielleicht einer Variablen zuweisen?`,
                "info", st.position);
        } else if (
            [TokenType.unaryOp, TokenType.pushConstant,
            TokenType.identifier, TokenType.selectArrayElement].indexOf(st.type) >= 0) {
            this.pushError("Der Wert dieses Terms wird zwar berechnet, aber danach verworfen. Möchtest Du ihn vielleicht einer Variablen zuweisen?",
                "info", st.position);
        }
    }

    parseStatement(expectSemicolon: boolean = true): ASTNode[] {

        let retStatements: ASTNode[] = null;

        switch (this.tt) {
            case TokenType.leftBracket:
            case TokenType.identifier:
            case TokenType.keywordThis:
            case TokenType.keywordSuper:
            case TokenType.keywordFinal:
            case TokenType.charConstant:
            case TokenType.integerConstant:
            case TokenType.stringConstant:
            case TokenType.booleanConstant:
            case TokenType.floatingPointConstant:
            case TokenType.keywordNew:
            case TokenType.not:
                let ret = this.parseVariableDeclarationOrTerm();
                if (expectSemicolon) this.expect(TokenType.semicolon, true, true);
                retStatements = ret;
                break;
            case TokenType.leftCurlyBracket:
                let statements: ASTNode[] = [];
                let positionFrom = this.getCurrentPosition();
                this.nextToken();
                //@ts-ignore
                while (this.tt != TokenType.rightCurlyBracket && this.tt != TokenType.endofSourcecode
                    && Parser.BeforeClassDefinitionTokens.indexOf(this.tt) < 0) {
                    statements = statements.concat(this.parseStatement());
                }
                let positionTo = this.getCurrentPosition();
                positionTo.column = positionTo.column + positionTo.length;
                positionTo.length = 0;
                this.expect(TokenType.rightCurlyBracket);

                retStatements = [{
                    type: TokenType.scopeNode,
                    position: positionFrom,
                    positionTo: positionTo,
                    statements: statements
                }];
                break;

            case TokenType.keywordWhile:
                retStatements = this.parseWhile();
                break;
            case TokenType.keywordFor:
                retStatements = this.parseFor();
                break;
            case TokenType.keywordDo:
                retStatements = this.parseDo();
                break;
            case TokenType.keywordIf:
                retStatements = this.parseIf();
                break;
            case TokenType.keywordReturn:
                retStatements = this.parseReturn();
                break;
            case TokenType.keywordPrint:
            case TokenType.keywordPrintln:
                retStatements = this.parsePrint();
                break;
            case TokenType.keywordSwitch:
                retStatements = this.parseSwitch();
                break;
            case TokenType.keywordBreak:
                let position = this.getCurrentPosition();
                this.nextToken();
                retStatements = [{
                    type: TokenType.keywordBreak,
                    position: position
                }];
                break;
            case TokenType.keywordContinue:
                let position1 = this.getCurrentPosition();
                this.nextToken();
                retStatements = [{
                    type: TokenType.keywordContinue,
                    position: position1
                }];
                break;
            case TokenType.semicolon:
                break;
            default:
                let s = TokenTypeReadable[this.tt];
                if (s != this.cct.value) s += "(" + this.cct.value + ")";
                s += " wird hier nicht erwartet.";
                this.pushError(s);

                let dontSkip = Parser.BeforeClassDefinitionTokens.indexOf(this.tt) >= 0;
                if (!dontSkip) {
                    this.nextToken();
                }
                break;
        }

        if (retStatements == null) {
            // skip additional semicolons if present...
            while (this.tt == TokenType.semicolon && expectSemicolon) {
                this.nextToken();
            }
        }

        if (retStatements != null && retStatements.length > 0) {
            let retStmt = retStatements[retStatements.length - 1];
            if (retStmt != null) {
                this.checkIfStatementHasNoEffekt(retStatements[retStatements.length - 1]);
            } else {
                retStatements = null;
            }
        }

        return retStatements;

    }

    parseReturn(): ASTNode[] {

        let position = this.getCurrentPosition();

        this.nextToken();

        let term: TermNode;

        if (!(this.tt == TokenType.semicolon)) {
            term = this.parseTerm();
            this.expect(TokenType.semicolon, true, true);
        }

        return [{
            type: TokenType.keywordReturn,
            position: position,
            term: term
        }];

    }

    parseWhile(): ASTNode[] {

        let position = this.getCurrentPosition();

        this.nextToken(); // consume while
        let scopeFrom = this.getCurrentPosition();

        if (this.expect(TokenType.leftBracket, true)) {
            let condition = this.parseTerm();
            let rightBracketPosition = this.getCurrentPosition();

            this.module.pushMethodCallPosition(position, [], "while", rightBracketPosition);

            this.expect(TokenType.rightBracket, true);
            if (this.tt == TokenType.semicolon) {
                this.pushError("Diese while-loop wiederholt nur den Strichpunkt (leere Anweisung).", "warning");
            }
            let statements = this.parseStatement();
            let scopeTo = this.getCurrentPosition();
            scopeTo.length = 0;

            if (statements != null && statements.length > 0 && statements[0].type == TokenType.scopeNode) {
                scopeTo = (<ScopeNode>statements[0]).positionTo;
            }

            return [
                {
                    type: TokenType.keywordWhile,
                    position: position,
                    scopeFrom: scopeFrom,
                    scopeTo: scopeTo,
                    condition: condition,
                    statements: statements
                }
            ];

        }

        return [];

    }

    parseFor(): ASTNode[] {

        let position = this.getCurrentPosition();

        let semicolonPositions: TextPosition[] = [];

        this.nextToken(); // consume for

        let scopeFrom = this.getCurrentPosition();

        if (this.expect(TokenType.leftBracket, true)) {

            if (this.ct[2].tt == TokenType.colon) {
                return this.parseForLoopOverCollection(position, scopeFrom);
            }

            let statementsBefore = this.parseStatement(false);
            semicolonPositions.push(this.getCurrentPosition());
            this.expect(TokenType.semicolon);
            let condition = this.parseTerm();
            semicolonPositions.push(this.getCurrentPosition());
            this.expect(TokenType.semicolon, true);
            let statementsAfter = this.parseStatement(false);

            let rightBracketPosition = this.getCurrentPosition();
            this.expect(TokenType.rightBracket, true);

            this.module.pushMethodCallPosition(position, semicolonPositions, "for", rightBracketPosition);

            if (this.tt == TokenType.semicolon) {
                this.pushError("Diese for-loop wiederholt nur den Strichpunkt (leere Anweisung).", "warning");
            }


            let statements = this.parseStatement();
            let scopeTo = this.getCurrentPosition();
            scopeTo.length = 0;

            if (statements != null && statements.length > 0 && statements[0].type == TokenType.scopeNode) {
                scopeTo = (<ScopeNode>statements[0]).positionTo;
            }

            if (condition == null) {
                condition = {
                    type: TokenType.pushConstant,
                    position: this.getCurrentPosition(),
                    constantType: TokenType.booleanConstant,
                    constant: true
                }
            }

            return [
                {
                    type: TokenType.keywordFor,
                    position: position,
                    scopeFrom: scopeFrom,
                    scopeTo: scopeTo,
                    condition: condition,
                    statementsBefore: statementsBefore,
                    statementsAfter: statementsAfter,
                    statements: statements
                }
            ];

        }

        return [];

    }

    parseForLoopOverCollection(position: TextPosition, scopeFrom: TextPosition): ASTNode[] {

        let variableType = this.parseType();

        let variableIdentifier = <string>this.cct.value;
        let variableIdentifierPosition = this.getCurrentPosition();
        this.nextToken();

        this.expect(TokenType.colon, true);

        let collection = this.parseTerm();

        this.expect(TokenType.rightBracket, true);

        if (this.tt == TokenType.semicolon) {
            this.pushError("Diese for-loop wiederholt nur den Strichpunkt (leere Anweisung).", "warning");
        }

        let statements = this.parseStatement();
        let scopeTo = this.getCurrentPosition();
        scopeTo.length = 0;

        if (statements != null && statements.length > 0 && statements[0].type == TokenType.scopeNode) {
            scopeTo = (<ScopeNode>statements[0]).positionTo;
        }

        if (collection == null || variableType == null || statements == null) return [];

        return [
            {
                type: TokenType.forLoopOverCollection,
                position: position,
                scopeFrom: scopeFrom,
                scopeTo: scopeTo,
                variableIdentifier: variableIdentifier,
                variableType: variableType,
                variablePosition: variableIdentifierPosition,
                collection: collection,
                statements: statements
            }
        ];

    }

    parsePrint(): ASTNode[] {

        let tt = this.tt;
        let position = this.getCurrentPosition();

        this.nextToken();

        if (this.expect(TokenType.leftBracket, false)) {
            let mcp = this.parseMethodCallParameters();
            let paramenters = mcp.nodes;
            if (paramenters.length > 2) {
                this.pushError("Die Methoden print und println haben maximal zwei Parameter.", "error", position);
            }

            this.expect(TokenType.semicolon, true, true);

            return [{
                //@ts-ignore
                type: tt,
                position: position,
                text: paramenters.length == 0 ? null : paramenters[0],
                color: paramenters.length <= 1 ? null : paramenters[1],
                commaPositions: mcp.commaPositions,
                rightBracketPosition: mcp.rightBracketPosition
            }];
        }

        return null;

    }

    parseSwitch(): ASTNode[] {

        let position = this.getCurrentPosition();
        this.nextToken();
        if (this.expect(TokenType.leftBracket, true)) {

            let switchTerm = this.parseTerm();

            this.module.pushMethodCallPosition(position, [], "switch", this.getCurrentPosition());

            this.expect(TokenType.rightBracket);
            let scopeFrom = this.getCurrentPosition();

            this.expect(TokenType.leftCurlyBracket, true);

            let switchNode: SwitchNode = {
                type: TokenType.keywordSwitch,
                position: position,
                scopeFrom: scopeFrom,
                scopeTo: null,
                condition: switchTerm,
                caseNodes: []
            }

            let defaultAlreadyThere = false;

            while (this.tt == TokenType.keywordCase || this.tt == TokenType.keywordDefault) {
                let casePosition = this.getCurrentPosition();

                let isDefault = this.tt == TokenType.keywordDefault;
                if (isDefault) {
                    if (defaultAlreadyThere) {
                        this.pushError("Eine switch-Anweisung darf nur maximal einen default-Zweig haben.", "error", casePosition);
                    } else {
                        defaultAlreadyThere = true;
                    }
                }

                this.nextToken();

                let caseTerm = null;
                if (!isDefault) {
                    caseTerm = this.parseUnary();
                }

                this.expect(TokenType.colon, true);

                let statements: ASTNode[] = [];
                //@ts-ignore
                while (this.tt != TokenType.rightCurlyBracket && this.tt != TokenType.endofSourcecode
                    && this.tt != TokenType.keywordCase && this.tt != TokenType.keywordDefault
                ) {
                    let oldPos = this.pos;
                    let statement = this.parseStatement();
                    if (statement != null) {
                        statements = statements.concat(statement);
                    }
                    if (oldPos == this.pos) {
                        this.pushError(this.cct.value + " wird hier nicht erwartet.");
                        this.nextToken();
                    }
                }

                let switchCaseNode: SwitchCaseNode = {
                    type: TokenType.keywordCase,
                    position: casePosition,
                    caseTerm: caseTerm,
                    statements: statements
                }

                switchNode.caseNodes.push(switchCaseNode);

            }

            switchNode.scopeTo = this.getEndOfCurrentToken();
            this.expect(TokenType.rightCurlyBracket, true);

            return [switchNode];

        }

        return null;

    }

    parseIf(): ASTNode[] {

        let position = this.getCurrentPosition();

        this.nextToken(); // consume if
        if (this.expect(TokenType.leftBracket, true)) {
            let condition = this.parseTerm();
            let rightBracketPosition = this.getCurrentPosition();
            this.module.pushMethodCallPosition(position, [], "if", rightBracketPosition);
            this.expect(TokenType.rightBracket, true);

            if (this.tt == TokenType.semicolon) {
                this.pushError("Falls die Bedingung zutrifft, wird nur der Strichpunkt ausgeführt (leere Anweisung).", "warning");
            }

            let statements = this.parseStatement();

            if (this.tt == TokenType.semicolon) {
                this.nextToken();
            }

            let elseStatements: ASTNode[] = null;

            if (this.comesToken(TokenType.keywordElse)) {
                this.nextToken();
                elseStatements = this.parseStatement();
            }

            if (condition == null && this.errorList.length == 0) {
                condition = {
                    type: TokenType.pushConstant,
                    position: this.getCurrentPosition(),
                    constantType: TokenType.booleanConstant,
                    constant: true
                }
            }

            return [
                {
                    type: TokenType.keywordIf,
                    position: position,
                    condition: condition,
                    statementsIfTrue: statements,
                    statementsIfFalse: elseStatements
                }
            ];

        }

        return [];

    }

    parseDo(): ASTNode[] {

        // let i = 10;
        // do {
        //     i = i +7;
        // } while (i < 100);

        let position = this.getCurrentPosition();

        let scopeFrom = this.getCurrentPosition();
        this.nextToken(); // consume do
        let statements = this.parseStatement();

        if (this.expect(TokenType.keywordWhile, true)) {
            if (this.expect(TokenType.leftBracket, true)) {
                let condition = this.parseTerm();
                let scopeTo = this.getEndOfCurrentToken();

                this.expect(TokenType.rightBracket, true);

                return [
                    {
                        type: TokenType.keywordDo,
                        position: position,
                        scopeFrom: scopeFrom,
                        scopeTo: scopeTo,
                        condition: condition,
                        statements: statements
                    }
                ];

            }
        }
        return [];

    }

    comesGenericType(): boolean {
        if (this.ct[1].tt != TokenType.lower) return false;
        if (this.ct[2].tt != TokenType.identifier) return false;
        return [TokenType.greater, TokenType.lower, TokenType.comma].indexOf(this.ct[3].tt) >= 0;

    }

    parseVariableDeclarationOrTerm(): ASTNode[] {

        // Two identifiers in a row or identifier[]
        if (
            (this.tt == TokenType.identifier || this.tt == TokenType.keywordFinal) &&
            (this.ct[1].tt == TokenType.identifier
                || this.ct[1].tt == TokenType.leftRightSquareBracket ||
                this.comesGenericType()
            )
        ) {
            return this.parseVariableDeclaration();
        } else {
            return [this.parseTerm()];
        }

    }

    parseTerm(): TermNode {
        return this.parseTermBinary(0);
    }

    parseTermBinary(precedence: number): TermNode {

        let left: TermNode;
        if (precedence < Parser.operatorPrecedence.length - 1) {
            left = this.parseTermBinary(precedence + 1);
        } else {
            left = this.parsePlusPlusMinusMinus();
        }

        let operators = Parser.operatorPrecedence[precedence];

        if (left == null || operators.indexOf(this.tt) < 0) {
            return left;
        }

        let first = true;

        // 28.05.2021: This broke evalation of ternery operator, so i commented it out.
        // Don't know why it was there in the first place, so i expect some havoc to come...
        // 15 Minutes later:
        // This if-clause was here to make terms aber case possible, e.g. switch(a){ case 7 + 2: println("Here!")}
        // -> Bad idea. I changed this to only parse unary Terms left of the colon so i can comment out this if-clause here
        // and fix the ternary operator.
        //
        // if (this.tt == TokenType.colon) {
        //     return left;
        // }

        while (first || operators.indexOf(this.tt) >= 0) {

            let operator: TokenType = this.tt;

            first = false;
            let position = this.getCurrentPosition();

            this.nextToken();

            for (let opData of [{ op: TokenType.lower, wrong: "=<", right: "<=", correctOp: TokenType.lowerOrEqual },
            { op: TokenType.greater, wrong: "=>", right: ">=", correctOp: TokenType.greaterOrEqual }]) {
                if (operator == TokenType.assignment && this.tt == opData.op) {
                    let position2 = this.getCurrentPosition();
                    this.pushError(`Den Operator ${opData.wrong} gibt es nicht. Du meintest sicher: ${opData.right}`, "error",
                        Object.assign({}, position, { length: 2 }), {
                        title: `${opData.wrong} durch ${opData.right} ersetzen`,
                        editsProvider: (uri) => {
                            return [
                                {
                                    resource: uri,
                                    edit: {
                                        range: { startLineNumber: position.line, startColumn: position.column, endLineNumber: position.line, endColumn: position2.column + position2.length },
                                        text: opData.right
                                    }
                                }
                            ]
                        }
                    });
                    this.nextToken();
                    operator = opData.correctOp;
                }
            }

            let right: TermNode;
            if (precedence < Parser.operatorPrecedence.length - 1) {
                right = this.parseTermBinary(precedence + 1);
            } else {
                right = this.parsePlusPlusMinusMinus();
            }

            if (right != null) {

                let constantFolding = false;
                if (this.isConstant(left) && this.isConstant(right)) {
                    let pcLeft = <ConstantNode>left;
                    let pcRight = <ConstantNode>right;
                    let typeLeft = TokenTypeToDataTypeMap[pcLeft.constantType];
                    let typeRight = TokenTypeToDataTypeMap[pcRight.constantType];
                    let resultType = typeLeft.getResultType(operator, typeRight);
                    if (resultType != null) {
                        constantFolding = true;

                        if (typeLeft == charPrimitiveType && typeRight == intPrimitiveType) {
                            pcLeft.constant = (<string>pcLeft.constant).charCodeAt(0);
                        }
                        if (typeRight == charPrimitiveType && typeLeft == intPrimitiveType) {
                            pcRight.constant = (<string>pcRight.constant).charCodeAt(0);
                        }


                        let result = typeLeft.compute(operator, { type: typeLeft, value: pcLeft.constant },
                            { type: typeRight, value: pcRight.constant });

                        this.considerIntDivisionWarning(operator, typeLeft, pcLeft.constant, typeRight, pcRight.constant, position);

                        pcLeft.constantType = (<PrimitiveType>resultType).toTokenType();
                        pcLeft.constant = result;
                        pcLeft.position.length = pcRight.position.column + pcRight.position.length - pcLeft.position.column;
                    }
                }

                if (!constantFolding)
                    left = {
                        type: TokenType.binaryOp,
                        position: position,
                        operator: operator,
                        firstOperand: left,
                        secondOperand: right
                    };

            }


        }

        return left;

    }

    considerIntDivisionWarning(operator: TokenType, typeLeft: Type, leftConstant: any, typeRight: Type, rightConstant: any, position: TextPosition) {

        if (operator == TokenType.division) {
            if (this.isIntegerType(typeLeft) && this.isIntegerType(typeRight)) {
                if (rightConstant != 0 && leftConstant / rightConstant != Math.floor(leftConstant / rightConstant)) {
                    this.pushError("Da " + leftConstant + " und " + rightConstant + " ganzzahlige Werte sind, wird diese Division als Ganzzahldivision ausgeführt und ergibt den Wert " + Math.floor(leftConstant / rightConstant) + ". Falls das nicht gewünscht ist, hänge '.0' an einen der Operanden.", "info", position);
                }
            }
        }

    }

    isIntegerType(type: Type): boolean {
        return type == intPrimitiveType;
    }

    isConstant(node: TermNode) {

        return (node != null && node.type == TokenType.pushConstant);

    }

    parsePlusPlusMinusMinus(): TermNode {

        let incrementDecrementBefore: TokenType = null;
        let position = null;

        if (this.comesToken([TokenType.doublePlus, TokenType.doubleMinus])) {
            incrementDecrementBefore = this.tt;
            position = this.getCurrentPosition();
            this.nextToken();
        }

        let t: TermNode = this.parseUnary();

        if (incrementDecrementBefore != null) {
            t = {
                type: TokenType.incrementDecrementBefore,
                position: position,
                operator: incrementDecrementBefore,
                operand: t
            }
        }

        if (this.comesToken([TokenType.doublePlus, TokenType.doubleMinus])) {
            t = {
                type: TokenType.incrementDecrementAfter,
                position: this.getCurrentPosition(),
                operator: this.tt,
                operand: t
            }
            this.nextToken();
        }

        return t;

    }

    // -, not, this, super, a.b.c[][].d, a.b(), b() (== this.b()), super.b(), super()
    parseUnary(): TermNode {

        let term: TermNode;
        let position: TextPosition = this.getCurrentPosition();

        switch (this.tt) {
            case TokenType.leftBracket:
                return this.parseDotOrArrayChains(this.bracketOrCasting());
            case TokenType.minus:
            case TokenType.not:
            case TokenType.tilde:
                position = position;
                let tt1 = this.tt;
                this.nextToken();
                term = this.parseUnary();

                if (this.isConstant(term)) {
                    let pcTerm = <ConstantNode>term;
                    let typeTerm = TokenTypeToDataTypeMap[pcTerm.constantType];
                    let resultType = typeTerm.getResultType(tt1);
                    if (resultType != null) {
                        let result = typeTerm.compute(tt1, { type: typeTerm, value: pcTerm.constant });
                        pcTerm.constantType = (<PrimitiveType>resultType).toTokenType();
                        pcTerm.constant = result;
                        position.length = pcTerm.position.column - position.column + 1;
                        return pcTerm;
                    }
                }

                return {
                    type: TokenType.unaryOp,
                    position: position,
                    operand: term,
                    operator: tt1
                };
            case TokenType.keywordSuper:
                if (this.ct[1].tt == TokenType.leftBracket) {
                    this.nextToken(); // skip "super"
                    let parameters = this.parseMethodCallParameters();
                    term = {
                        type: TokenType.superConstructorCall,
                        position: position,
                        operands: parameters.nodes,
                        commaPositions: parameters.commaPositions,
                        rightBracketPosition: parameters.rightBracketPosition
                    };
                    return term;
                } else {
                    term = {
                        type: TokenType.keywordSuper,
                        position: position
                    };
                }
                this.nextToken();
                return this.parseDotOrArrayChains(term);
            case TokenType.keywordThis:
                if (this.ct[1].tt == TokenType.leftBracket) {
                    this.nextToken(); // skip "super"
                    let parameters = this.parseMethodCallParameters();
                    term = {
                        type: TokenType.constructorCall,
                        position: position,
                        operands: parameters.nodes,
                        commaPositions: parameters.commaPositions,
                        rightBracketPosition: parameters.rightBracketPosition
                    };
                    return term;
                } else {
                    term = {
                        type: TokenType.keywordThis,
                        position: position
                    };
                }
                this.nextToken();
                return this.parseDotOrArrayChains(term);
            case TokenType.keywordNew:
                return this.parseDotOrArrayChains(this.parseNew());
            case TokenType.integerConstant:
            case TokenType.charConstant:
            case TokenType.floatingPointConstant:
            case TokenType.stringConstant:
            case TokenType.booleanConstant:
            case TokenType.longConstant:
                term = {
                    type: TokenType.pushConstant,
                    position: this.getCurrentPosition(),
                    constantType: this.tt,
                    constant: this.cct.value
                };
                let isStringConstant = this.tt == TokenType.stringConstant;
                this.nextToken();

                if (isStringConstant) return this.parseDotOrArrayChains(term);

                return term;
            case TokenType.keywordNull:
                term = {
                    type: TokenType.pushConstant,
                    position: this.getCurrentPosition(),
                    constantType: TokenType.keywordNull,
                    constant: null
                };
                this.nextToken();
                return term;
            case TokenType.identifier: // attribute of current class or local variable

                let identifier1 = <string>this.cct.value;
                let position1 = this.getCurrentPosition();

                this.nextToken();
                //@ts-ignore
                if (this.tt == TokenType.leftBracket) {
                    let parameters = this.parseMethodCallParameters();
                    let rightBracketPosition = parameters.rightBracketPosition;

                    term = {
                        type: TokenType.callMethod,
                        position: position1,
                        rightBracketPosition: rightBracketPosition,
                        operands: parameters.nodes,
                        object: term,
                        identifier: identifier1,
                        commaPositions: parameters.commaPositions
                    }
                } else {
                    term = {
                        type: TokenType.identifier,
                        identifier: identifier1,
                        position: position
                    }
                }

                return this.parseDotOrArrayChains(term);
            default:
                this.pushError("Erwartet wird eine Variable, ein Methodenaufruf oder this oder super. Gefunden wurde: " + this.cct.value);
                return null;
        }

    }

    tokensNotAfterCasting: TokenType[] = [TokenType.multiplication, TokenType.division, TokenType.plus,
    TokenType.minus, TokenType.dot, TokenType.modulo, TokenType.semicolon, TokenType.rightBracket];

    bracketOrCasting(): TermNode {

        let position = this.getCurrentPosition();

        this.nextToken(); // consume (

        if (this.tt == TokenType.identifier && this.ct[1].tt == TokenType.rightBracket &&
            this.tokensNotAfterCasting.indexOf(this.ct[2].tt) < 0) {

            let castToType = this.parseType();
            let position1 = this.getCurrentPosition(); // Position of )
            position.length = position1.column - position.column + 1;

            this.expect(TokenType.rightBracket, true);

            let whatToCast = this.parsePlusPlusMinusMinus();

            return {
                type: TokenType.castValue,
                position: position,
                castToType: castToType,
                whatToCast: whatToCast
            }


        } else {

            let term = this.parseTerm();
            let rightBracketPosition = this.getCurrentPosition();
            this.expect(TokenType.rightBracket, true);

            if (this.isConstant(term)) {
                return term;
            }

            let bracketsNode: BracketsNode = {
                position: rightBracketPosition,
                type: TokenType.rightBracket,
                termInsideBrackets: term
            }


            return bracketsNode;

        }

    }

    parseNew(): TermNode {

        this.nextToken();
        let position = this.getCurrentPosition();

        if (this.expect(TokenType.identifier, false)) {
            let identifier = <string>this.cct.value;
            let identifierPosition = this.getCurrentPosition();
            this.nextToken();


            let genericParameterTypes: TypeNode[] = null;

            if (this.tt == TokenType.lower) {

                genericParameterTypes = [];
                let first: boolean = true;
                this.nextToken();

                //@ts-ignore
                while ((first && this.tt == TokenType.identifier) || (!first && this.tt == TokenType.comma)) {

                    if (!first) this.nextToken(); // consume comma

                    first = false;

                    genericParameterTypes.push(this.parseType());

                }

                //@ts-ignore
                if (this.tt == TokenType.greater) {
                    this.nextToken();
                    //@ts-ignore
                } else if (this.tt == TokenType.shiftRight) {
                    this.tt = TokenType.greater;   // one shiftRight is two >
                    //@ts-ignore
                } else if (this.tt == TokenType.shiftRightUnsigned) {
                    this.tt = TokenType.shiftRight;   // one shiftRightUnsigned is three >
                } else {
                    this.pushError("Erwartet wird >, gefunden wurde " + this.cct.value + ".");
                    this.nextToken();
                }

                if (genericParameterTypes.length == 0) genericParameterTypes = null;
            }

            if (this.tt == TokenType.leftSquareBracket || this.tt == TokenType.leftRightSquareBracket) {

                let typenode: TypeNode = {
                    type: TokenType.type,
                    position: position,
                    arrayDimension: 0,
                    identifier: identifier,
                    genericParameterTypes: genericParameterTypes
                }
                this.typeNodes.push(typenode);

                let elementCount: TermNode[] = [];

                while (this.tt == TokenType.leftSquareBracket || this.tt == TokenType.leftRightSquareBracket) {
                    typenode.arrayDimension++;

                    //@ts-ignore
                    if (this.tt == TokenType.leftRightSquareBracket) {
                        elementCount.push(null);
                        this.nextToken();
                    } else {
                        this.nextToken();
                        elementCount.push(this.parseTerm());
                        this.expect(TokenType.rightSquareBracket, true);
                    }

                }

                let initialization = null;

                if (this.tt == TokenType.leftCurlyBracket) {
                    initialization = this.parseArrayLiteral(typenode);
                }

                let newArrayNode: NewArrayNode = {
                    type: TokenType.newArray,
                    position: position,
                    arrayType: typenode,
                    elementCount: elementCount,
                    initialization: initialization
                }

                return newArrayNode;


            } else if (this.tt == TokenType.leftBracket) {
                let parameters = this.parseMethodCallParameters();

                let classType: TypeNode = {
                    type: TokenType.type,
                    position: identifierPosition,
                    arrayDimension: 0,
                    identifier: identifier,
                    genericParameterTypes: genericParameterTypes
                }

                this.typeNodes.push(classType);

                return {
                    type: TokenType.newObject,
                    position: position,
                    classType: classType,
                    constructorOperands: parameters.nodes,
                    rightBracketPosition: parameters.rightBracketPosition,
                    commaPositions: parameters.commaPositions
                }
            } else {
                this.pushError("Konstruktoraufruf (also runde Klammer auf) oder Array-Intanzierung (eckige Klammer auf) erwartet.", "error", this.getCurrentPosition());
            }
        }

        return null;
    }

    parseArrayLiteral(arrayType: TypeNode): ArrayInitializationNode {
        // expects { as next token

        let nodes: (ArrayInitializationNode | TermNode)[] = [];
        let position = this.getCurrentPosition();
        let dimension = null;

        this.expect(TokenType.leftCurlyBracket, true);
        if (this.tt != TokenType.rightCurlyBracket) {

            let first = true;
            while (first || this.tt == TokenType.comma) {
                let position1 = this.getCurrentPosition();

                if (!first) {
                    this.nextToken(); // consume comma
                }
                first = false;

                let newDimension: number;
                if (this.tt == TokenType.leftCurlyBracket) {
                    let newType: TypeNode = {
                        type: TokenType.type,
                        position: this.getCurrentPosition(),
                        arrayDimension: arrayType.arrayDimension - 1,
                        identifier: arrayType.identifier
                    }
                    this.typeNodes.push(newType);
                    let al = this.parseArrayLiteral(newType);
                    newDimension = al.dimension + 1;
                    nodes.push(al);
                } else {
                    nodes.push(this.parseTerm());
                    newDimension = 1;
                }

                if (dimension != null) {
                    if (dimension != newDimension) {
                        this.pushError("Die Dimension dieses Array-Literals (" + (newDimension - 1) + " ist ungleich derjenigen der vorangegangenen Array-Literale (" + (dimension - 1) + ").", "error", position1);
                    }
                }
                dimension = newDimension;

            }

        }

        this.expect(TokenType.rightCurlyBracket, true);

        let ain: ArrayInitializationNode = {
            type: TokenType.arrayInitialization,
            position: position,
            arrayType: arrayType,
            dimension: dimension,
            nodes: nodes
        }

        return ain;

    }

    parseMethodCallParameters(): { rightBracketPosition: TextPosition, nodes: TermNode[], commaPositions: TextPosition[] } {
        // Assumption: current token is (        
        this.nextToken();
        if (this.tt == TokenType.rightBracket) {
            let rightBracketPosition = this.getCurrentPosition();
            this.nextToken();
            return { rightBracketPosition: rightBracketPosition, nodes: [], commaPositions: [] };
        }

        let parameters: TermNode[] = [];
        let commaPositions: TextPosition[] = [];

        while (true) {
            let pos = this.pos;

            let parameter = this.parseTerm();
            if (parameter != null) {
                parameters.push(parameter);
            }

            if (this.tt != TokenType.comma) {
                break;
            } else {
                commaPositions.push(this.getCurrentPosition());
                this.nextToken(); // consume comma
            }

            // emergency-step:
            if (this.pos == pos) {
                this.nextToken();
            }

        }

        let position = this.getCurrentPosition();
        let rightBracketFound = this.expect(TokenType.rightBracket, true);

        return { rightBracketPosition: rightBracketFound ? position : null, nodes: parameters, commaPositions: commaPositions };

    }

    parseDotOrArrayChains(term: TermNode): TermNode {

        if (term == null) return null;

        while (this.comesToken([TokenType.dot, TokenType.leftSquareBracket])) {
            if (this.tt == TokenType.dot) {

                this.nextToken();
                //@ts-ignore
                if (this.tt != TokenType.identifier) {
                    this.pushError("Erwartet wird der Bezeichner eines Attributs oder einer Methode, gefunden wurde: " + this.cct.value);
                    return term;
                }

                let identifier = <string>this.cct.value;
                let position = this.getCurrentPosition();
                this.nextToken();
                //@ts-ignore
                if (this.tt == TokenType.leftBracket) {
                    let parameters = this.parseMethodCallParameters();
                    term = {
                        type: TokenType.callMethod,
                        position: position,
                        rightBracketPosition: parameters.rightBracketPosition,
                        operands: parameters.nodes,
                        object: term,
                        identifier: identifier,
                        commaPositions: parameters.commaPositions
                    }
                } else {
                    term = {
                        type: TokenType.pushAttribute,
                        position: position,
                        identifier: identifier,
                        object: term
                    }
                }

            } else {
                // let position = this.getCurrentPosition();
                let position = term.position;
                this.nextToken();
                let index = this.parseTerm();
                let positionEnd = this.getCurrentPosition();
                let position1: TextPosition = Object.assign({}, position);
                this.expect(TokenType.rightSquareBracket, true);
                if (positionEnd.line == position.line) {
                    position1.length = positionEnd.column + positionEnd.length - position1.column;
                } else {
                    position1 = positionEnd;
                }
                term = {
                    type: TokenType.selectArrayElement,
                    position: position1,
                    index: index,
                    object: term
                }

            }
        }

        return term;
    }

    parseVariableDeclaration(): LocalVariableDeclarationNode[] {

        let ret: LocalVariableDeclarationNode[] = [];

        let isFinal = false;
        if (this.tt == TokenType.keywordFinal) {
            isFinal = true;
            this.nextToken();
        }

        let type: TypeNode = this.parseType();
        do {
            let typeCopy: TypeNode = { ...type };
            this.typeNodes.push(typeCopy);

            if (this.tt != TokenType.identifier) {
                this.pushError("Hier wird ein Bezeichner (Name) einer Variable erwartet.", "error", this.getCurrentPosition());
                return [];
            }

            let identifier = <string>this.cct.value;
            let position = this.getCurrentPosition();
            this.nextToken();

            this.parseArrayBracketsAfterVariableIdentifier(typeCopy);
            let initialization: TermNode = null;

            //@ts-ignore
            if (this.tt == TokenType.assignment) {
                this.nextToken();
                //@ts-ignore
                if (typeCopy.arrayDimension > 0 && this.tt == TokenType.leftCurlyBracket) {
                    initialization = this.parseArrayLiteral(typeCopy);
                } else {
                    initialization = this.parseTerm();
                }
            }

            //@ts-ignore
            if (this.tt == TokenType.endofSourcecode && typeCopy == null && identifier == null) return [];
            ret.push({
                type: TokenType.localVariableDeclaration,
                position: position,
                identifier: identifier,
                variableType: typeCopy,
                initialization: initialization,
                isFinal: isFinal
            })

        } while (this.expectAndSkipComma());

        return ret;

    }

    parseArrayBracketsAfterVariableIdentifier(type: TypeNode) {
        //@ts-ignore
        if (this.tt == TokenType.leftRightSquareBracket && type != null) {
            if (type.arrayDimension > 0) {
                this.pushError("Sowohl vor als auch hinter dem Bezeichner der Variablendeklaration steht []. Eines davon ist zuviel.");
            }
            while (this.tt == TokenType.leftRightSquareBracket) {
                type.arrayDimension++;
                this.nextToken();
            }
        }

    }


    parseType(): TypeNode {

        /**
         * e.g. int, int[][], Integer, ArrayList<Integer> ,HashMap<Integer, ArrayList<String>>[][]
         */


        if (this.tt != TokenType.identifier && this.tt != TokenType.keywordVoid) {
            this.pushError("Erwartet wird ein Datentyp. Dieser muss mit einem Bezeichner beginnen. Gefunden wurde: " + this.cct.value, "error", this.getCurrentPosition());
            this.nextToken();
            return {
                type: TokenType.type,
                position: this.getCurrentPosition(),
                arrayDimension: 0,
                identifier: "int",
                genericParameterTypes: []
            };
        }

        let identifier = <string>this.cct.value;
        let position = this.getCurrentPosition();
        this.nextToken();

        let genericParameterTypes: TypeNode[] = null;

        //@ts-ignore
        if (this.tt == TokenType.lower) {

            genericParameterTypes = [];
            let first: boolean = true;
            this.nextToken();

            //@ts-ignore
            while ((first && this.tt == TokenType.identifier) || (!first && this.tt == TokenType.comma)) {

                if (!first) this.nextToken(); // consume comma

                first = false;

                genericParameterTypes.push(this.parseType());

            }

            //@ts-ignore
            if (this.tt == TokenType.greater) {
                this.nextToken();
                //@ts-ignore
            } else if (this.tt == TokenType.shiftRight) {
                this.tt = TokenType.greater;   // one shiftRight is two >
                //@ts-ignore
            } else if (this.tt == TokenType.shiftRightUnsigned) {
                this.tt = TokenType.shiftRight;   // one shiftRightUnsigned is three >
            } else {
                this.pushError("Erwartet wird >, gefunden wurde " + this.cct.value + ".");
                this.nextToken();
            }

        }

        let arrayDimension = 0;
        //@ts-ignore
        while (this.tt == TokenType.leftRightSquareBracket) {
            arrayDimension++;
            position.length += 2;
            this.nextToken();
        }

        let typenode: TypeNode = {
            type: TokenType.type,
            position: position,
            arrayDimension: arrayDimension,
            identifier: identifier,
            genericParameterTypes: genericParameterTypes
        }

        this.typeNodes.push(typenode);

        return typenode;

    }


    parseClassDefinition(): ASTNode {

        let commentBefore = this.cct.commentBefore;
        let modifiers = this.collectModifiers();

        if (!this.comesToken(Parser.ClassTokens)) {
            this.pushError("Erwartet wird class, interface oder enum. Gefunden wurde: " + this.cct.value);
            return null;
        }

        let classType = this.tt;
        this.nextToken();

        if (this.expect(TokenType.identifier, false)) {

            let identifier = <string>this.cct.value;
            let position = this.getCurrentPosition();
            this.nextToken();

            let typeParameters: TypeParameterNode[] = [];
            // For Generics: parse expression like <E, F extends Test implements Comparable<Test>>
            if (this.tt == TokenType.lower) {
                typeParameters = this.parseTypeParameterDefinition();
            }

            let extendsImplements = this.parseExtendsImplements(classType == TokenType.keywordInterface);

            if (classType == TokenType.keywordEnum) {
                return this.parseEnum(identifier, extendsImplements, position, modifiers.visibility, commentBefore);
            }

            let scopeFrom = this.getCurrentPosition();
            if (this.expect(TokenType.leftCurlyBracket, true)) {

                let methodsAndAttributes = this.parseClassBody(classType, identifier);
                let scopeTo = this.getEndOfCurrentToken();
                this.expect(TokenType.rightCurlyBracket, true);
                switch (classType) {

                    case TokenType.keywordClass: return {
                        type: TokenType.keywordClass,
                        position: position,
                        scopeFrom: scopeFrom,
                        scopeTo: scopeTo,
                        identifier: identifier,
                        attributes: methodsAndAttributes.attributes,
                        methods: methodsAndAttributes.methods,
                        isAbstract: modifiers.isAbstract,
                        isFinal: modifiers.isFinal,
                        visibility: modifiers.visibility,
                        extends: extendsImplements.extends,
                        implements: extendsImplements.implements,
                        typeParameters: typeParameters,
                        commentBefore: commentBefore
                    }

                    case TokenType.keywordInterface: return {
                        type: TokenType.keywordInterface,
                        position: position,
                        identifier: identifier,
                        scopeFrom: scopeFrom,
                        scopeTo: scopeTo,
                        methods: methodsAndAttributes.methods,
                        typeParameters: typeParameters,
                        extends: extendsImplements.implements,
                        commentBefore: commentBefore
                    }

                }

            }

        }

    }

    parseTypeParameterDefinition(): TypeParameterNode[] {

        let typeParameters: TypeParameterNode[] = [];

        let identifierMap = {};

        this.expect(TokenType.lower, true);
        let first: boolean = true;

        while ((first && this.tt == TokenType.identifier) || (!first && this.tt == TokenType.comma)) {

            if (!first) this.expect(TokenType.comma, true);

            let tp: TypeParameterNode = {
                type: TokenType.typeParameter,
                position: this.getCurrentPosition(),
                identifier: <string>this.cct.value,
                extends: null,
                implements: null
            };

            if (identifierMap[tp.identifier] != null) {
                this.pushError("Zwei Typparameter dürfe nicht denselben Bezeichner tragen.");
            }

            identifierMap[tp.identifier] = true;

            this.nextToken();

            let extendsImplements = this.parseTypeParameterBounds();

            tp.extends = extendsImplements.extends;

            if (tp.extends != null && tp.extends.arrayDimension > 0) {
                this.pushError("Der Datentyp des Typparameters " + tp.identifier + " darf kein Array sein.");
            }

            tp.implements = extendsImplements.implements;

            tp.implements.forEach((im) => {
                if (im.arrayDimension > 0) {
                    this.pushError("Der Datentyp des Typparameters " + tp.identifier + " darf kein Array sein.");
                }
            });

            first = false;

            typeParameters.push(tp);

        }

        this.expect(TokenType.greater, true);

        return typeParameters;
    }

    parseEnum(identifier: string, extendsImplements: {
        extends: TypeNode;
        implements: TypeNode[];
    }, position: TextPosition, visibility: Visibility, commentBefore: Token): ASTNode {

        if (extendsImplements.extends != null) {
            this.pushError("Ein enum kann nicht mit extends erweitert werden.");
        }
        if (extendsImplements.implements.length > 0) {
            this.pushError("Ein enum kann kein Interface implementieren.");
        }

        let scopeFrom = this.getCurrentPosition();
        if (this.expect(TokenType.leftCurlyBracket, true)) {

            let values: EnumValueNode[] = this.parseEnumValues();

            let methodsAndAttributes = this.parseClassBody(TokenType.keywordEnum, identifier);

            let scopeTo = this.getEndOfCurrentToken();

            this.expect(TokenType.rightCurlyBracket, true);


            return {
                type: TokenType.keywordEnum,
                position: position,
                scopeFrom: scopeFrom,
                scopeTo: scopeTo,
                attributes: methodsAndAttributes.attributes,
                methods: methodsAndAttributes.methods,
                identifier: identifier,
                values: values,
                visibility: visibility,
                commentBefore: commentBefore
            }

        }

        return null;

    }

    parseEnumValues(): EnumValueNode[] {

        let values: EnumValueNode[] = [];

        let pos: number = 0;
        let first: boolean = true;

        while ((first && this.tt == TokenType.identifier) || this.tt == TokenType.comma) {
            pos = this.pos;
            if (!first) this.nextToken(); // skip comma
            first = false;

            if (this.expect(TokenType.identifier, false)) {

                let identifier = <string>this.cct.value;
                let position = this.getCurrentPosition();
                this.nextToken();
                let constructorParameters: TermNode[] = null;

                let commaPositions: TextPosition[] = [];
                let rightBracketPosition: TextPosition = null;
                //@ts-ignore
                if (this.tt == TokenType.leftBracket) {
                    let mcp = this.parseMethodCallParameters();
                    constructorParameters = mcp.nodes;
                    commaPositions = mcp.commaPositions;
                    rightBracketPosition = mcp.rightBracketPosition;
                }

                values.push({
                    type: TokenType.pushEnumValue,
                    constructorParameters: constructorParameters,
                    identifier: identifier,
                    position: position,
                    commaPositions: commaPositions,
                    rightBracketPosition: rightBracketPosition
                });

            };

            if (this.pos == pos) {
                this.nextToken(); // in case of parsing-emergency
            }
        }

        if (this.tt == TokenType.semicolon) {
            this.nextToken();
        }

        return values;

    }

    parseClassBody(classType: TokenType, className: string): { methods: MethodDeclarationNode[], attributes: AttributeDeclarationNode[] } {

        // Assumption: { is already consumed

        let methods: MethodDeclarationNode[] = [];
        let attributes: AttributeDeclarationNode[] = [];

        while (true) {

            if (this.tt == TokenType.rightCurlyBracket || this.tt == TokenType.endofSourcecode) {
                break;
            }

            let commentBefore: Token = this.cct.commentBefore;

            let annotation = null;
            if (this.tt == TokenType.at) {
                annotation = this.cct.value;
                this.nextToken();
            }
            let modifiers = this.collectModifiers();

            let isConstructor = false;
            let position = this.getCurrentPosition();

            if (this.tt == TokenType.identifier && <string>this.cct.value == className && this.ct[1].tt == TokenType.leftBracket) {
                isConstructor = true;
            }

            let type = this.parseType();

            if (isConstructor) {
                type = {
                    identifier: "void",
                    arrayDimension: 0,
                    position: type.position,
                    type: TokenType.type
                }
            }

            if (isConstructor || this.expect(TokenType.identifier, false)) {

                let identifier = className;

                if (!isConstructor) {
                    position = this.getCurrentPosition();

                    identifier = <string>this.cct.value;
                    this.nextToken();
                }

                if (this.tt == TokenType.leftBracket) {

                    if (isConstructor && classType == TokenType.keywordEnum && modifiers.visibility != Visibility.private) {
                        this.pushError("Konstruktoren in enums müssen private sein.", "error", position);
                    }

                    let parameters: ParameterNode[] = this.parseMethodDeclarationParameters();

                    let statements: ASTNode[];
                    let scopeFrom: TextPosition = this.getCurrentPosition();
                    let scopeTo: TextPosition = scopeFrom;

                    if (modifiers.isAbstract) {
                        this.expect(TokenType.semicolon, true);
                        if (isConstructor) {
                            this.pushError("Ein Konstruktor kann nicht abstrakt sein.", "error", position);
                        }
                        statements = [];
                    } else {
                        scopeFrom = this.getCurrentPosition();
                        statements = this.parseStatement();

                        if(this.comesToken(TokenType.leftCurlyBracket)){
                            this.pushError("Der Strichpunkt direkt hinter der Methodendeklaration ist für sich genommen die einzige (leere!) Anweisung der Methode. Das ist nicht sinnvoll.", "error", scopeFrom);
                            statements = this.parseStatement();
                        }

                        scopeTo = this.getEndOfCurrentToken();

                        if (statements != null && statements.length > 0 && statements[0].type == TokenType.scopeNode) {
                            let scopeNode = <ScopeNode>statements[0];
                            scopeFrom = scopeNode.position;
                            scopeTo = scopeNode.positionTo;
                        }

                    }

                    methods.push({
                        type: TokenType.methodDeclaration,
                        identifier: identifier,
                        position: position,
                        scopeFrom: scopeFrom,
                        scopeTo: scopeTo,
                        parameters: parameters,
                        statements: statements,
                        visibility: modifiers.visibility,
                        isAbstract: modifiers.isAbstract || classType == TokenType.keywordInterface,
                        isStatic: modifiers.isStatic,
                        isFinal: modifiers.isFinal,
                        isConstructor: isConstructor,
                        returnType: type,
                        annotation: annotation,
                        isTransient: modifiers.isTransient,
                        commentBefore: commentBefore
                    });

                } else {
                    let firstIdentifier: boolean = true;
                    do {
                        let typeNodeCopy: TypeNode = { ...type };
                        this.typeNodes.push(typeNodeCopy);

                        if (!firstIdentifier) {
                            if (!this.comesToken(TokenType.identifier)) {
                                this.pushError("Hier wird ein weiterer Attributbezeichner erwartet.");
                                this.nextToken();
                            } else {
                                position = this.getCurrentPosition();
                                identifier = <string>this.cct.value;
                                this.nextToken();
                            }
                        }

                        firstIdentifier = false;

                        if (identifier == className) {
                            this.pushError("Das Attribut " + className + " darf nicht denselben Bezeichner haben wie die Klasse.", "error", position);
                        }

                        this.parseArrayBracketsAfterVariableIdentifier(typeNodeCopy);

                        let initialization: TermNode = null;

                        if (this.tt == TokenType.assignment) {
                            this.nextToken();
                            //@ts-ignore
                            if (typeNodeCopy.arrayDimension > 0 && this.tt == TokenType.leftCurlyBracket) {
                                initialization = this.parseArrayLiteral(typeNodeCopy);
                            } else {
                                initialization = this.parseTerm();
                            }
                        }


                        attributes.push({
                            type: TokenType.attributeDeclaration,
                            identifier: identifier,
                            position: position,
                            attributeType: typeNodeCopy,
                            isStatic: modifiers.isStatic,
                            isFinal: modifiers.isFinal,
                            visibility: modifiers.visibility,
                            initialization: initialization,
                            annotation: annotation,
                            isTransient: modifiers.isTransient,
                            commentBefore: commentBefore
                        });

                        if (classType == TokenType.keywordInterface) {
                            this.pushError("Interfaces dürfen keine Attribute enthalten.", "error", position);
                        }

                    } while (this.expectAndSkipComma());

                    this.expect(TokenType.semicolon);
                }

            }



        }

        return { methods: methods, attributes: attributes }

    }

    expectAndSkipComma(): boolean {
        if (this.comesToken(TokenType.comma)) {
            this.nextToken();
            return true;
        }
        return false;
    }

    parseMethodDeclarationParameters(): ParameterNode[] {

        // Assumption: next token is (
        let parameters: ParameterNode[] = [];
        this.nextToken();

        if (this.tt == TokenType.rightBracket) {
            this.nextToken();
            return [];
        }

        let ellipsis = false;

        while (true) {
            if (ellipsis) {
                this.pushError("Nur der letzte Parameter darf als Ellipsis (...) definiert werden.");
            }
            let isFinal = this.tt == TokenType.keywordFinal;

            if (isFinal) this.nextToken();

            let type: TypeNode = this.parseType();

            ellipsis = this.tt == TokenType.ellipsis;
            if (ellipsis) {
                this.nextToken();
                type.arrayDimension++;
            }

            if (this.expect(TokenType.identifier, false)) {
                let identifier = <string>this.cct.value;
                parameters.push({
                    type: TokenType.parameterDeclaration,
                    position: this.getCurrentPosition(),
                    identifier: identifier,
                    parameterType: type,
                    isFinal: isFinal,
                    isEllipsis: ellipsis
                });

                this.nextToken();

                this.parseArrayBracketsAfterVariableIdentifier(type);

            }
            if (this.tt != TokenType.comma) {
                break;
            }
            this.nextToken(); // consume comma
        }

        this.expect(TokenType.rightBracket, true);

        return parameters;

    }

    parseExtendsImplements(isInterface: boolean): { extends: TypeNode, implements: TypeNode[] } {

        let sextends: TypeNode = null;
        let simplements: TypeNode[] = [];

        while (this.comesToken([TokenType.keywordExtends, TokenType.keywordImplements])) {
            if (this.comesToken(TokenType.keywordExtends) && !isInterface) {
                if (sextends != null) {
                    this.pushError("Eine Klasse kann nicht Unterklasse von zwei anderen Klassen sein, es darf also hier nur ein Mal 'extends...' stehen.", "error", sextends.position);
                }
                this.nextToken(); // skip extends
                sextends = this.parseType();
                if (sextends != null && sextends.arrayDimension > 0) {
                    this.pushError("Der Datentyp der Basisklasse darf kein Array sein.", "error", sextends.position);
                }
            }

            if ((!isInterface && this.comesToken(TokenType.keywordImplements)) || (isInterface && this.comesToken(TokenType.keywordExtends))) {
                if (simplements.length > 0) {
                    this.pushError("Es darf hier nur ein Mal 'implements' stehen, hinter 'implements' ist aber eine kommaseparierte Liste von Interfaces erlaubt.", "warning");
                }
                this.nextToken(); // Skip implements/extends
                let first = true;
                while ((first && this.tt == TokenType.identifier) || (!first && this.tt == TokenType.comma)) {
                    if (!first) this.nextToken(); // skip comma
                    first = false;
                    simplements.push(this.parseType());
                }
            }
        }

        simplements.forEach((im) => {
            if (im.arrayDimension > 0) {
                this.pushError(im.identifier + "[] ist kein Interface, sondern ein Array. Array-Datentypen sind hier nicht erlaubt.");
            }
        });

        return {
            extends: sextends, implements: simplements
        }
    }

    parseTypeParameterBounds(): { extends: TypeNode, implements: TypeNode[] } {

        let sextends: TypeNode = null;
        let simplements: TypeNode[] = [];

        if (this.comesToken(TokenType.keywordExtends)) {
            this.nextToken(); // skip extends
            sextends = this.parseType();
        }

        while (this.comesToken(TokenType.ampersand)) {
            this.nextToken(); // Skip ampersand
            simplements.push(this.parseType());
        }

        return {
            extends: sextends, implements: simplements
        }

    }

    collectModifiers(): { isAbstract: boolean, isStatic: boolean, visibility: Visibility, isFinal: boolean, isTransient: boolean } {

        let visibility = Visibility.public;
        let isAbstract = false;
        let isStatic = false;
        let isFinal = false;
        let isTransient = false;

        let done = false;
        let asError: boolean = false;

        while (!done) {

            switch (this.tt) {
                case TokenType.keywordPublic:
                    visibility = Visibility.public;
                    this.nextToken();
                    break;
                case TokenType.keywordPrivate:
                    visibility = Visibility.private;
                    this.nextToken();
                    break;
                case TokenType.keywordProtected:
                    visibility = Visibility.protected;
                    this.nextToken();
                    break;
                case TokenType.keywordStatic:
                    isStatic = true;
                    if (isAbstract && !asError) {
                        this.pushError("Die Modifier 'abstract' und 'static' können nicht kombiniert werden.");
                        asError = true;
                    }
                    this.nextToken();
                    break;
                case TokenType.keywordAbstract:
                    isAbstract = true;
                    if (isStatic && !asError) {
                        this.pushError("Die Modifier 'abstract' und 'static' können nicht kombiniert werden.");
                        asError = true;
                    }
                    this.nextToken();
                    break;
                case TokenType.keywordFinal:
                    isFinal = true;
                    this.nextToken();
                    break;
                case TokenType.keywordTransient:
                    isTransient = true;
                    this.nextToken();
                    break;
                default: done = true;
            }

        }


        return { isAbstract: isAbstract, isStatic: isStatic, visibility: visibility, isFinal: isFinal, isTransient: isTransient };

    }


}