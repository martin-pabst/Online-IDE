import { TextPosition, TokenType } from "src/client/compiler/lexer/Token.js";
import { ASTNode, ConstantNode } from "src/client/compiler/parser/AST.js";
import { Module, ModuleStore } from "src/client/compiler/parser/Module.js";
import { NPrimitiveTypes } from "../types/NewPrimitiveType.js";
import { NType } from "../types/NewType.js";
import { CodeBuilder } from "./NCodeBuilder.js";
import { NFragment, NProgram } from "./NProgram.js";
import { NSymbolTable } from "./NSymbolTable.js";

export class NCodeGenerator {

    moduleStore: ModuleStore;
    module: Module;

    symbolTableStack: NSymbolTable[];
    currentSymbolTable: NSymbolTable;

    currentProgram: NProgram;

    nextFreeRelativeStackPos: number;

    errorList: Error[];

    codeBuilder: CodeBuilder;


    constructor(private pt: NPrimitiveTypes){

    }

    start(module: Module, moduleStore: ModuleStore) {
        this.moduleStore = moduleStore;
        this.module = module;

        this.symbolTableStack = [];
        this.currentSymbolTable = this.module.mainSymbolTable;

        this.currentProgram = null;
        this.errorList = [];

        this.nextFreeRelativeStackPos = 0;

        if (this.module.tokenList.length > 0) {
            let lastToken = this.module.tokenList[this.module.tokenList.length - 1];
            this.module.mainSymbolTable.positionTo = { line: lastToken.position.line, column: lastToken.position.column + 1, length: 1 };
        }

        this.codeBuilder = new CodeBuilder();

        this.generateMain();



    }

    generateMain(isAdhocCompilation: boolean = false) {

        this.initCurrentProgram("Hauptprogramm", this.currentSymbolTable);

        let position: TextPosition = { line: 1, column: 1, length: 0 };

        let mainProgramAst = this.module.mainProgramAst;
        if (mainProgramAst != null && mainProgramAst.length > 0 && mainProgramAst[0] != null) {
            position = this.module.mainProgramAst[0].position;
        }

        this.module.mainProgram = this.currentProgram;

        let hasMainProgram: boolean = false;

        if (this.module.mainProgramAst != null && this.module.mainProgramAst.length > 0) {

            hasMainProgram = true;
            this.processStatementsInsideBlock(this.module.mainProgramAst);

            let lastPosition = this.module.mainProgramEnd;
            if (lastPosition == null) lastPosition = { line: 100000, column: 0, length: 0 };

            this.currentSymbolTable.positionTo = lastPosition;

        }

    }

    initCurrentProgram(methodIdentierWithClass: string, symbolTable: NSymbolTable){
        
        this.currentProgram = new NProgram(this.module, symbolTable, methodIdentierWithClass);

    }

    processStatementsInsideBlock(nodes: ASTNode[]): NFragment {
        
        if (nodes == null || nodes.length == 0 || nodes[0] == null) return null;

        let fragment: NFragment = new NFragment("block", this.pt.void, nodes[0].position);

        for(let node of nodes){

            if (node == null) continue;
            let nextFragment: NFragment = this.processNode(node);
            if(nextFragment == null) continue;

            // If last Statement has value which is not used further then pop this value from stack.
            // e.g. statement 12 + 17 -7;
            // Parser issues a warning in this case, see Parser.checkIfStatementHasNoEffekt
            if (nextFragment.valuePushedToStack) {

                nextFragment.addPop();

            }

            fragment.addFragmentToBlock(nextFragment);

        }

        return fragment;
    }

    processNode(node: ASTNode, isLeftSideOfAssignment: boolean = false): NFragment {

        if (node == null) return null;

        switch (node.type) {
            // case TokenType.binaryOp:
            //     return this.processBinaryOp(node);
            // case TokenType.unaryOp:
            //     return this.processUnaryOp(node);
            case TokenType.pushConstant:
                return this.pushConstant(node);
            // case TokenType.callMethod:
            //     return this.callMethod(node);
            // case TokenType.identifier:
            //     {
            //         let stackType = this.resolveIdentifier(node);
            //         let v = node.variable;
            //         if (v != null) {
            //             if (isLeftSideOfAssignment) {
            //                 v.initialized = true;
            //                 if (!v.usedBeforeInitialization) {
            //                     v.declarationError = null;
            //                 }
            //             } else {
            //                 if (v.initialized != null && !v.initialized) {
            //                     v.usedBeforeInitialization = true;
            //                     this.pushError("Die Variable " + v.identifier + " wird hier benutzt bevor sie initialisiert wurde.", node.position, "info");
            //                 }
            //             }
            //         }
            //         return stackType;
            //     }
            // case TokenType.selectArrayElement:
            //     return this.selectArrayElement(node);
            // case TokenType.incrementDecrementBefore:
            // case TokenType.incrementDecrementAfter:
            //     return this.incrementDecrementBeforeOrAfter(node);
            // case TokenType.superConstructorCall:
            //     return this.superconstructorCall(node);
            // case TokenType.constructorCall:
            //     return this.superconstructorCall(node);
            // case TokenType.keywordThis:
            //     return this.pushThisOrSuper(node, false);
            // case TokenType.keywordSuper:
            //     return this.pushThisOrSuper(node, true);
            // case TokenType.pushAttribute:
            //     return this.pushAttribute(node);
            // case TokenType.newObject:
            //     return this.newObject(node);
            // case TokenType.keywordWhile:
            //     return this.processWhile(node);
            // case TokenType.keywordDo:
            //     return this.processDo(node);
            // case TokenType.keywordFor:
            //     return this.processFor(node);
            // case TokenType.forLoopOverCollection:
            //     return this.processForLoopOverCollection(node);
            // case TokenType.keywordIf:
            //     return this.processIf(node);
            // case TokenType.keywordSwitch:
            //     return this.processSwitch(node);
            // case TokenType.keywordReturn:
            //     return this.processReturn(node);
            // case TokenType.localVariableDeclaration:
            //     return this.localVariableDeclaration(node);
            // case TokenType.arrayInitialization:
            //     return this.processArrayLiteral(node);
            // case TokenType.newArray:
            //     return this.processNewArray(node);
            // case TokenType.keywordPrint:
            // case TokenType.keywordPrintln:
            //     return this.processPrint(node);
            // case TokenType.castValue:
            //     return this.processManualCast(node);
            // case TokenType.keywordBreak:
            //     this.pushBreakNode({
            //         type: TokenType.jumpAlways,
            //         position: node.position
            //     });
            //     return null;
            // case TokenType.keywordContinue:
            //     this.pushContinueNode({
            //         type: TokenType.jumpAlways,
            //         position: node.position
            //     });
            //     return null;
            // case TokenType.rightBracket:
            //     let type = this.processNode(node.termInsideBrackets);
            //     if (type != null && type.type instanceof Klass) this.pushTypePosition(node.position, type.type);
            //     return type;
            // case TokenType.scopeNode:
            //     this.pushNewSymbolTable(false, node.position, node.positionTo);

            //     let withReturnStatement = this.processStatementsInsideBlock(node.statements);

            //     this.popSymbolTable();

            //     return { type: null, isAssignable: false, withReturnStatement: withReturnStatement };

        }

    }
    
    pushConstant(node: ConstantNode): NFragment {

        let type: NType;

        switch (node.constantType) {
            case TokenType.integerConstant:
                type = intPrimitiveType;
                break;
            case TokenType.booleanConstant:
                type = booleanPrimitiveType;
                break;
            case TokenType.floatingPointConstant:
                type = floatPrimitiveType;
                break;
            case TokenType.stringConstant:
                type = stringPrimitiveType;
                this.pushTypePosition(node.position, type);
                break;
            case TokenType.charConstant:
                type = charPrimitiveType;
                break;
            case TokenType.keywordNull:
                type = nullType
                break;
        }

        this.pushStatements({
            type: TokenType.pushConstant,
            dataType: type,
            position: node.position,
            value: node.constant
        })

        return { type: type, isAssignable: false };

    }


}