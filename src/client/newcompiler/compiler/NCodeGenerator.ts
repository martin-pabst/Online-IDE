import { TextPosition, TokenType } from "src/client/compiler/lexer/Token.js";
import { ASTNode } from "src/client/compiler/parser/AST.js";
import { Module, ModuleStore } from "src/client/compiler/parser/Module.js";
import { CodeBuilder, NProgramBlock } from "./NCodeBuilder.js";
import { NProgram } from "./NProgram.js";
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
            this.generateStatements(this.module.mainProgramAst);

            let lastPosition = this.module.mainProgramEnd;
            if (lastPosition == null) lastPosition = { line: 100000, column: 0, length: 0 };

            this.currentSymbolTable.positionTo = lastPosition;

        }

    }

    initCurrentProgram(methodIdentier: string, symbolTable: NSymbolTable){
        this.currentProgram = {
            stepsSingle: [],
            stepsMultiple: [],

            module: this.module,
            numberOfLocalVariables: 0,
            methodIdentifierWithClass: methodIdentier,
            helper: [],
            invoke: null,
            numberOfParameters: 0,
            symbolTable: symbolTable
        }
    }

    generateStatements(nodes: ASTNode[]): NProgramBlock {

        if (nodes == null || nodes.length == 0 || nodes[0] == null) return null;

        let programBlock: NProgramBlock = this.processStatementsInsideBlock(nodes);

        let lastNode = nodes[nodes.length - 1];
        let endPosition: TextPosition;

        if (lastNode != null) {
            if (lastNode.type == TokenType.scopeNode) {
                endPosition = lastNode.positionTo;
            } else {
                endPosition = Object.assign({}, lastNode.position);
                if (endPosition != null) {
                    endPosition.column += endPosition.length;
                    endPosition.length = 1;
                }
            }
        } else {
            endPosition = { line: 100000, column: 0, length: 0 };
        }

        programBlock.endPosition = endPosition;

        return programBlock;

    }

    processStatementsInsideBlock(nodes: ASTNode[]): NProgramBlock {
        
        let programBlock = new NProgramBlock();

        let withReturnStatement = false;

        for (let node of nodes) {

            if (node == null) continue;

            let type = this.processNode(node);

            if (type != null && type.withReturnStatement != null && type.withReturnStatement) {
                withReturnStatement = true;
            }

            // If last Statement has value which is not used further then pop this value from stack.
            // e.g. statement 12 + 17 -7;
            // Parser issues a warning in this case, see Parser.checkIfStatementHasNoEffekt
            if (type != null && type.type != null && type.type != voidPrimitiveType) {

                if (this.lastStatement != null &&
                    this.lastStatement.type == TokenType.assignment && this.lastStatement.leaveValueOnStack) {
                    this.lastStatement.leaveValueOnStack = false;
                } else {
                    this.pushStatements({
                        type: TokenType.decreaseStackpointer,
                        position: null,
                        popCount: 1,
                        stepFinished: true
                    }, true)
                }

            }

        }

        return withReturnStatement;



    }



}