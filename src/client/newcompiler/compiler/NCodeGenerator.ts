import { Error, ErrorLevel, QuickFix } from "src/client/compiler/lexer/Lexer.js";
import { TextPosition, TokenType, TokenTypeReadable } from "src/client/compiler/lexer/Token.js";
import { ASTNode, BinaryOpNode, ConstantNode, TermNode, UnaryOpNode } from "src/client/compiler/parser/AST.js";
import { Module, ModuleStore } from "src/client/compiler/parser/Module.js";
import { Heap } from "src/client/compiler/types/Types.js";
import { NClass, NClassLike } from "../types/NClass.js";
import { NPrimitiveType } from "../types/NPrimitiveType.js";
import { NType } from "../types/NType.js";
import { NPrimitiveTypeManager } from "../types/NPrimitiveTypeManager.js";
import { CodeBuilder } from "./NCodeBuilder.js";
import { NBlock, NFragment, NProgram } from "./NProgram.js";
import { NSymbolTable } from "./NSymbolTable.js";
import { NTypeResolver } from "./NTypeResolver.js";

export class NCodeGenerator {
    

    moduleStore: ModuleStore;
    module: Module;

    symbolTableStack: NSymbolTable[];
    currentSymbolTable: NSymbolTable;

    currentProgram: NProgram;

    nextFreeRelativeStackPos: number;

    errorList: Error[];

    codeBuilder: CodeBuilder;

    static assignmentOperators = [TokenType.assignment, TokenType.plusAssignment, TokenType.minusAssignment,
    TokenType.multiplicationAssignment, TokenType.divisionAssignment, TokenType.ANDAssigment, TokenType.ORAssigment,
    TokenType.XORAssigment, TokenType.shiftLeftAssigment, TokenType.shiftRightAssigment, TokenType.shiftRightUnsignedAssigment];

    constructor(private pt: NPrimitiveTypeManager, private typeResolver: NTypeResolver) {
        
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

    startAdhocCompilation(module: Module, moduleStore: ModuleStore, symbolTable: NSymbolTable, heap: Heap):Error[] {
        // TODO
        return [];
    }


    generateMain(isAdhocCompilation: boolean = false) {

        this.initCurrentProgram("Hauptprogramm", this.currentSymbolTable);

        let position: TextPosition = { line: 1, column: 1, length: 0 };

        let mainProgramAst = this.module.mainProgramAst;
        if (mainProgramAst != null && mainProgramAst.length > 0 && mainProgramAst[0] != null) {
            position = this.module.mainProgramAst[0].position;
        }

        this.module.mainProgram = this.currentProgram;

        if (this.module.mainProgramAst != null && this.module.mainProgramAst.length > 0) {

            this.processStatementsInsideBlock(this.module.mainProgramAst);

            let lastPosition = this.module.mainProgramEnd;
            if (lastPosition == null) lastPosition = { line: 100000, column: 0, length: 0 };

            this.currentSymbolTable.positionTo = lastPosition;

        }



    }

    initCurrentProgram(methodIdentierWithClass: string, symbolTable: NSymbolTable) {

        this.currentProgram = new NProgram(this.module, symbolTable, methodIdentierWithClass);

    }

    processStatementsInsideBlock(nodes: ASTNode[]): NBlock {

        let block = new NBlock();
        if (nodes == null || nodes.length == 0 || nodes[0] == null) return block;

        for (let node of nodes) {

            if (node == null) continue;
            let nextFragment: NFragment = this.processNode(node);
            if (nextFragment == null) continue;

            // If last Statement has value which is not used further then pop this value from stack.
            // e.g. statement 12 + 17 -7;
            // Parser issues a warning in this case, see Parser.checkIfStatementHasNoEffekt
            if (!nextFragment.lastPartIsJSExpression) {

                nextFragment.discardTopOfStack();

            }

            block.statements.push(nextFragment);

        }

        return block;
    }

    processNode(node: ASTNode, isLeftSideOfAssignment: boolean = false): NFragment {

        if (node == null) return null;

        switch (node.type) {
            case TokenType.binaryOp:
                return this.processBinaryNode(node);
            case TokenType.unaryOp:
                return this.processUnaryOp(node);
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

    pushError(text: string, position: TextPosition, errorLevel: ErrorLevel = "error", quickFix?: QuickFix) {
        this.errorList.push({
            text: text,
            position: position,
            quickFix: quickFix,
            level: errorLevel
        });
    }

    processUnaryOp(node: UnaryOpNode): NFragment {
        let operandFragment = this.processNode(node.operand);

        if (operandFragment == null || operandFragment.dataType == null) return;

        if (node.operator == TokenType.minus && !operandFragment.dataType.canCastTo(this.pt.float)) {
            this.pushError("Der Operator - ist für den Typ " + operandFragment.dataType.identifier + " nicht definiert.", node.position);
        }

        if (node.operator == TokenType.not && !operandFragment.dataType.canCastTo(this.pt.boolean)) {
            this.checkIfAssignmentInstedOfEqual(node.operand);
            this.pushError("Der Operator ! ist für den Typ " + operandFragment.dataType.identifier + " nicht definiert.", node.position);
        }

        operandFragment.applyUnaryOperator(node.operator);

        return operandFragment;

    }

    checkIfAssignmentInstedOfEqual(nodeFrom: ASTNode, conditionType?: NType) {
        if (nodeFrom == null) return;

        if (nodeFrom.type == TokenType.binaryOp && nodeFrom.operator == TokenType.assignment) {
            let pos = nodeFrom.position;
            this.pushError("= ist der Zuweisungsoperator. Du willst sicher zwei Werte vergleichen. Dazu benötigst Du den Vergleichsoperator ==.",
                pos, conditionType == this.pt.boolean ? "warning" : "error", {
                title: '= durch == ersetzen',
                editsProvider: (uri) => {
                    return [{
                        resource: uri,
                        edit: {
                            range: {
                                startLineNumber: pos.line, startColumn: pos.column, endLineNumber: pos.line, endColumn: pos.column + 1,
                                message: "",
                                severity: monaco.MarkerSeverity.Error
                            },
                            text: "=="
                        }
                    }
                    ];
                }

            })
        }

    }


    pushConstant(node: ConstantNode): NFragment {

        let constantLiteral = this.pt.getConstantLiteral(node);
        let type: NType = this.pt.getConstantTypeFromTokenType(node.constantType);

        let fragment = new NFragment("constant", type, node.position);

        fragment.constantValue = node.constant;
        fragment.addPart(constantLiteral);

        return fragment;

    }

    processBinaryNode(node: BinaryOpNode): NFragment {
        let isAssignment = NCodeGenerator.assignmentOperators.indexOf(node.operator) >= 0;

        if (node.operator == TokenType.ternaryOperator) {
            return this.processTernaryOperator(node);
        }

        let leftFragment = this.processNode(node.firstOperand, isAssignment);

        let rightFragment = this.processNode(node.secondOperand);

        if (leftFragment == null || rightFragment == null) return null;

        let leftType = leftFragment.dataType;
        let rightType = rightFragment.dataType;

        if (leftType == null || rightType == null) return;

        if (isAssignment) {
            if (!this.ensureAutomaticCasting(rightFragment, leftType, node.position, node.secondOperand)) {
                this.pushError("Der Wert vom Datentyp " + rightType.identifier + " auf der rechten Seite kann der Variablen auf der linken Seite (Datentyp " + leftType.identifier + ") nicht zugewiesen werden.", node.position);
                return leftFragment;
            }

            if (!leftFragment.isAssignable) {
                this.pushError("Dem Term/der Variablen auf der linken Seite des Zuweisungsoperators (=) kann kein Wert zugewiesen werden.", node.position);
            }

            leftFragment.applyBinaryOperator(rightFragment, node.operator, leftFragment.dataType);
            return leftFragment;
        }

        // check for uninitialized variable:
        if (node.firstOperand.type == TokenType.identifier && node.firstOperand.variable != null) {
            let v = node.firstOperand.variable;
            if (v.initialized != null && !v.initialized) {
                v.usedBeforeInitialization = true;
                this.pushError("Die Variable " + v.identifier + " wird hier benutzt bevor sie initialisiert wurde.", node.position, "info");
            }
        }

        // check if assignment instead of equal
        if (node.operator in [TokenType.and, TokenType.or]) {
            this.checkIfAssignmentInstedOfEqual(node.firstOperand);
            this.checkIfAssignmentInstedOfEqual(node.secondOperand);
        }

        let resultType = leftType.getOperatorResultType(node.operator, rightType);

        // TODO: Situation Object + String: insert toString()-Method


        if (resultType == null) {

            // TODO: operator possible with unboxing?

            this.binaryOperationNotFeasibleError(node, leftType, rightType);

            return leftFragment;
        }

        leftFragment.applyBinaryOperator(rightFragment, node.operator, resultType);

        return leftFragment;
    }

    processTernaryOperator(node: BinaryOpNode): NFragment {
        let leftFragment = this.processNode(node.firstOperand, false);

        if (leftFragment == null) return null;
        if (!this.ensureAutomaticCasting(leftFragment, this.pt.boolean, node.firstOperand.position, node.firstOperand)) {
            return null;
        }

        let colonOperand = <BinaryOpNode>node.secondOperand;
        if (colonOperand == null) { return null; }

        if (colonOperand.type != TokenType.binaryOp || colonOperand.operator != TokenType.colon) {
            this.pushError("Auf den Fragezeichenoperator müssen - mit Doppelpunkt getrennt - zwei Alternativterme folgen.", node.position);
        }

        let secondFragment = this.processNode(colonOperand.firstOperand);
        let thirdFragment = this.processNode(colonOperand.secondOperand);

        if(secondFragment == null || thirdFragment == null) return null;

        let type = secondFragment.dataType;
        if(thirdFragment.dataType.canCastTo(type)){
            this.ensureAutomaticCasting(thirdFragment, type, colonOperand.secondOperand.position, colonOperand.secondOperand);
        } else if(secondFragment.dataType.canCastTo(thirdFragment.dataType)){
            type = thirdFragment.dataType;
            this.ensureAutomaticCasting(secondFragment, type, colonOperand.firstOperand.position, colonOperand.firstOperand);
        } else {
            this.pushError(`Die Datentypen der beiden Terme auf der rechten Seite des Fragezeichenoperators (${secondFragment.dataType.identifier} und ${thirdFragment.dataType.identifier} sind nicht einheitlich und können auch nicht ineinander umgewandelt werden.`, colonOperand.position);
            return null;
        }

        leftFragment.applyTernaryOperator(secondFragment, thirdFragment, type);

        return leftFragment;

    }



    ensureAutomaticCasting(fragmentToCast: NFragment, typeTo: NType, position: TextPosition, nodeToCast: ASTNode): boolean {
        let typeFrom = fragmentToCast.dataType;

        if (typeFrom == null || typeTo == null) return false;

        if (typeFrom.equals(typeTo)) {
            return true;
        }

        if (!typeFrom.canCastTo(typeTo)) {

            if (typeTo == this.pt.boolean && fragmentToCast != null) {

                this.checkIfAssignmentInstedOfEqual(nodeToCast);

            }

            this.pushError("Erwartet wird ein Term vom Typ " + typeTo.identifier + ", gefunden wurde ein Term vom Typ " + typeFrom.identifier + ".", nodeToCast.position);

            return false;
        }

        // TODO: unboxing...
        // if (typeFrom["unboxableAs"] != null && typeFrom["unboxableAs"].indexOf(typeTo) >= 0) {
        //     return true;
        // }

        if (typeFrom instanceof NClassLike && typeTo == this.pt.String) {

            if (typeTo == this.pt.String) {
                fragmentToCast.addVirtualMethodCall("toString()", [], this.pt.String);
                return true;
            }

            if (typeTo instanceof NClassLike) {
                fragmentToCast.checkClassCasting(typeTo);
                return true;
            }

            this.pushError("Erwartet wird ein Term vom Typ " + typeTo.identifier + ", gefunden wurde ein Term vom Typ " + typeFrom.identifier + ".", nodeToCast.position);
            return false;

        }


        if (typeFrom instanceof NPrimitiveType && (typeTo instanceof NPrimitiveType || typeTo == this.pt.String)) {
            let castExpression = typeFrom.getCastExpression(typeTo);
            if (castExpression == null) {
                return false;
            }
            if (castExpression.e == null) {
                return true;
            }

            fragmentToCast.applyCastExpression(castExpression.e, typeTo);

            return true;
        }

        this.pushError("Erwartet wird ein Term vom Typ " + typeTo.identifier + ", gefunden wurde ein Term vom Typ " + typeFrom.identifier + ".", nodeToCast.position);

        return false;

    }


    private binaryOperationNotFeasibleError(node: BinaryOpNode, leftType: NType, rightType: NType) {
        let bitOperators = [TokenType.ampersand, TokenType.OR];
        let booleanOperators = ["&& (boolescher UND-Operator)", "|| (boolescher ODER-Operator)"];
        let betterOperators = ["& &", "||"];
        let opIndex = bitOperators.indexOf(node.operator);
        if (opIndex >= 0 && leftType == this.pt.boolean && rightType == this.pt.boolean) {
            this.pushError("Die Operation " + TokenTypeReadable[node.operator] + " ist für die Operanden der Typen " + leftType.identifier + " und " + rightType.identifier + " nicht definiert. Du meintest wahrscheinlich den Operator " + booleanOperators[opIndex] + ".", node.position, "error",
                {
                    title: "Operator " + betterOperators[opIndex] + " verwenden statt " + TokenTypeReadable[node.operator],
                    editsProvider: (uri) => {
                        return [
                            {
                                resource: uri,
                                edit: {
                                    range: { startLineNumber: node.position.line, startColumn: node.position.column, endLineNumber: node.position.line, endColumn: node.position.column },
                                    text: TokenTypeReadable[node.operator]
                                }
                            }
                        ];
                    }
                });
        } else {
            this.pushError("Die Operation " + TokenTypeReadable[node.operator] + " ist für die Operanden der Typen " + leftType.identifier + " und " + rightType.identifier + " nicht definiert.", node.position);
        }
    }



}