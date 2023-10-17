import { Error, QuickFix, ErrorLevel } from "../lexer/Lexer.js";
import { TextPosition, TokenType, TokenTypeReadable } from "../lexer/Token.js";
import { ArrayType } from "../types/Array.js";
import { Klass, Interface, StaticClass, Visibility, getVisibilityUpTo } from "../types/Class.js";
import { booleanPrimitiveType, charPrimitiveType, floatPrimitiveType, intPrimitiveType, stringPrimitiveType, objectType, nullType, voidPrimitiveType, varType, doublePrimitiveType, longPrimitiveType, shortPrimitiveType, CharacterType } from "../types/PrimitiveTypes.js";
import { Attribute, Type, Variable, Value, PrimitiveType, UsagePositions, Method, Heap, getTypeIdentifier, Parameterlist } from "../types/Types.js";
import { ASTNode, AttributeDeclarationNode, BinaryOpNode, ClassDeclarationNode, ConstantNode, DoWhileNode, ForNode, IdentifierNode, IfNode, IncrementDecrementNode, MethodcallNode, MethodDeclarationNode, NewObjectNode, ReturnNode, SelectArrayElementNode, SelectArributeNode, SuperconstructorCallNode, SuperNode, ThisNode, UnaryOpNode, WhileNode, LocalVariableDeclarationNode, ArrayInitializationNode, NewArrayNode, PrintNode, CastManuallyNode, EnumDeclarationNode, TermNode, SwitchNode, ScopeNode, ParameterNode, ForNodeOverCollecion, ConstructorCallNode } from "./AST.js";
import { LabelManager } from "./LabelManager.js";
import { Module, ModuleStore, MethodCallPosition } from "./Module.js";
import { AssignmentStatement, InitStackframeStatement, JumpAlwaysStatement, Program, Statement, BeginArrayStatement, NewObjectStatement, JumpOnSwitchStatement, Breakpoint, ExtendedForLoopCheckCounterAndGetElement } from "./Program.js";
import { SymbolTable } from "./SymbolTable.js";
import { Enum, EnumInfo } from "../types/Enum.js";
import { InputClass } from "../../runtimelibrary/Input.js";

type StackType = {
    type: Type,
    isAssignable: boolean,
    isSuper?: boolean, // used for method calls with super.
    withReturnStatement?: boolean
};

export class CodeGenerator {

    static assignmentOperators = [TokenType.assignment, TokenType.plusAssignment, TokenType.minusAssignment,
    TokenType.multiplicationAssignment, TokenType.divisionAssignment, TokenType.moduloAssignment, TokenType.ANDAssigment, TokenType.ORAssigment,
    TokenType.XORAssigment, TokenType.shiftLeftAssigment, TokenType.shiftRightAssigment, TokenType.shiftRightUnsignedAssigment];

    moduleStore: ModuleStore;
    module: Module;

    symbolTableStack: SymbolTable[];
    currentSymbolTable: SymbolTable;

    heap: Heap;

    currentProgram: Program;

    errorList: Error[];

    nextFreeRelativeStackPos: number;

    breakNodeStack: JumpAlwaysStatement[][];
    continueNodeStack: JumpAlwaysStatement[][];

    isAdhocCompilation: boolean;

    startAdhocCompilation(module: Module, moduleStore: ModuleStore, symbolTable: SymbolTable, heap: Heap): Error[] {

        this.isAdhocCompilation = true;

        this.moduleStore = moduleStore;
        this.module = module;

        this.symbolTableStack = [];
        this.symbolTableStack.push(symbolTable);
        this.currentSymbolTable = symbolTable;

        this.heap = heap;

        let oldStackframeSize = symbolTable.stackframeSize;
        this.nextFreeRelativeStackPos = oldStackframeSize;

        this.currentProgram = null;
        this.errorList = [];

        this.breakNodeStack = [];
        this.continueNodeStack = [];

        this.generateMain(true);

        return this.errorList;

    }

    start(module: Module, moduleStore: ModuleStore) {

        this.isAdhocCompilation = false;

        this.moduleStore = moduleStore;
        this.module = module;

        this.symbolTableStack = [];
        this.currentSymbolTable = null;

        this.currentProgram = null;
        this.errorList = [];

        this.nextFreeRelativeStackPos = 0;

        if (this.module.tokenList.length > 0) {
            let lastToken = this.module.tokenList[this.module.tokenList.length - 1];
            this.module.mainSymbolTable.positionTo = { line: lastToken.position.line, column: lastToken.position.column + 1, length: 1 };
        }

        this.symbolTableStack.push(this.module.mainSymbolTable);
        this.currentSymbolTable = this.module.mainSymbolTable;

        this.breakNodeStack = [];
        this.continueNodeStack = [];

        this.generateMain();

        this.generateClasses();

        this.lookForStaticVoidMain();

        this.module.errors[3] = this.errorList;

    }

    lookForStaticVoidMain() {

        let mainProgram = this.module.mainProgram;

        if (mainProgram != null && mainProgram.statements.length > 2) return;

        let mainMethod: Method = null;
        let staticClass: StaticClass = null;
        let classNode1: ASTNode;

        for (let classNode of this.module.classDefinitionsAST) {
            if (classNode.type == TokenType.keywordClass) {

                let ct = classNode.resolvedType;

                for (let m of ct.staticClass.methods) {
                    if (m.identifier == "main" && m.parameterlist.parameters.length == 1) {
                        let pt = m.parameterlist.parameters[0];
                        if (pt.type instanceof ArrayType && pt.type.arrayOfType == stringPrimitiveType) {
                            if (mainMethod != null) {
                                this.pushError("Es existieren mehrere Klassen mit statischen main-Methoden.", classNode.position);
                            } else {
                                mainMethod = m;
                                staticClass = ct.staticClass;
                                classNode1 = classNode;
                            }
                        }
                    }
                }
            }
        }

        if (mainMethod != null) {

            let position: TextPosition = mainMethod.usagePositions[0];
            if (mainMethod.program != null && mainMethod.program.statements.length > 0) {
                position = mainMethod.program.statements[0].position;
            }

            this.initCurrentProgram();

            this.module.mainProgram = this.currentProgram;

            this.pushStatements([{
                type: TokenType.callMainMethod,
                position: position,
                stepFinished: false,
                method: mainMethod,
                staticClass: staticClass
            }, {
                type: TokenType.closeStackframe,
                position: mainMethod.usagePositions.get(this.module)[0]
            }
            ], false);

        }

    }

    generateClasses() {
        if (this.module.classDefinitionsAST == null) return;

        for (let classNode of this.module.classDefinitionsAST) {
            if (classNode.type == TokenType.keywordClass) {
                this.generateClass(classNode);
            }
            if (classNode.type == TokenType.keywordEnum) {
                this.generateEnum(classNode);
            }
            if (classNode.type == TokenType.keywordInterface) {
                let interf = classNode.resolvedType;
                if (interf != null) {
                    this.checkDoubleMethodDeclaration(interf);
                }
            }
        }


    }

    generateEnum(enumNode: EnumDeclarationNode) {

        if (enumNode.resolvedType == null) return;

        this.pushNewSymbolTable(false, enumNode.scopeFrom, enumNode.scopeTo);

        let enumClass = <Enum>enumNode.resolvedType;

        // this.pushUsagePosition(enumNode.position, enumClass);

        this.currentSymbolTable.classContext = enumClass;
        this.currentProgram = enumClass.attributeInitializationProgram;

        for (let attribute of enumNode.attributes) {
            if (attribute != null && !attribute.isStatic && attribute.initialization != null) {
                this.initializeAttribute(attribute);
            }
        }

        if (enumClass.attributeInitializationProgram.statements.length > 0) {
            this.pushStatements({
                type: TokenType.return,
                position: this.lastStatement.position,
                copyReturnValueToStackframePos0: false,
                stepFinished: false,
                leaveThisObjectOnStack: true
            });
        }


        this.currentProgram.labelManager.resolveNodes();

        for (let methodNode of enumNode.methods) {
            if (methodNode != null && !methodNode.isAbstract && !methodNode.isStatic) {
                this.compileMethod(methodNode);
            }
        }

        this.popSymbolTable(null);

        // constructor calls
        this.pushNewSymbolTable(false, enumNode.scopeFrom, enumNode.scopeTo);

        for (let enumValueNode of enumNode.values) {

            if (enumValueNode.constructorParameters != null) {

                let p: Program = {
                    module: this.module,
                    labelManager: null,
                    statements: []
                }

                this.currentProgram = p;

                this.pushStatements({
                    type: TokenType.pushEnumValue,
                    position: enumValueNode.position,
                    enumClass: enumClass,
                    valueIdentifier: enumValueNode.identifier
                });

                this.processEnumConstructorCall(enumClass, enumValueNode.constructorParameters,
                    enumValueNode.position, enumValueNode.commaPositions, enumValueNode.rightBracketPosition);

                this.pushStatements({
                    type: TokenType.programEnd,
                    position: enumValueNode.position,
                    stepFinished: true
                });

                let enumInfo: EnumInfo = enumClass.identifierToInfoMap[enumValueNode.identifier];
                enumInfo.constructorCallProgram = p;
                enumInfo.position = enumValueNode.position;

            }

        }

        this.popSymbolTable(null);


        // static attributes/methods
        this.pushNewSymbolTable(false, enumNode.scopeFrom, enumNode.scopeTo);

        this.currentSymbolTable.classContext = enumClass.staticClass;
        this.currentProgram = enumClass.staticClass.attributeInitializationProgram;

        for (let attribute of enumNode.attributes) {
            if (attribute != null && attribute.isStatic && attribute.initialization != null) {
                this.initializeAttribute(attribute);
            }
        }

        this.currentProgram.labelManager.resolveNodes();

        for (let methodNode of enumNode.methods) {
            if (methodNode != null && methodNode.isStatic) {
                this.compileMethod(methodNode);
            }
        }
        this.checkDoubleMethodDeclaration(enumClass);

        this.popSymbolTable(null);

    }

    processEnumConstructorCall(enumClass: Enum, parameterNodes: TermNode[],
        position: TextPosition, commaPositions: TextPosition[], rightBracketPosition: TextPosition) {
        let parameterTypes: Type[] = [];

        for (let p of parameterNodes) {
            let typeNode = this.processNode(p);
            if (typeNode == null) continue;
            parameterTypes.push(typeNode.type);
        }

        let methods = enumClass.getMethodsThatFitWithCasting(enumClass.identifier,
            parameterTypes, true, Visibility.private);

        this.module.pushMethodCallPosition(position, commaPositions, enumClass.getMethods(Visibility.private, enumClass.identifier), rightBracketPosition);


        if (methods.error != null) {
            this.pushError(methods.error, position);
            return { type: stringPrimitiveType, isAssignable: false }; // try to continue...
        }

        let method = methods.methodList[0];

        let destType: Type = null;
        for (let i = 0; i < parameterTypes.length; i++) {
            if (i < method.getParameterCount()) {  // possible ellipsis!
                destType = method.getParameterType(i);
                if (i == method.getParameterCount() - 1 && method.hasEllipsis()) {
                    destType = (<ArrayType>destType).arrayOfType;
                }
            }

            let srcType = parameterTypes[i];
            if (!srcType.equals(destType)) {

                if (srcType instanceof PrimitiveType && destType instanceof PrimitiveType) {
                    if (srcType.getCastInformation(destType).needsStatement) {
                        this.pushStatements({
                            type: TokenType.castValue,
                            position: null,
                            newType: destType,
                            stackPosRelative: -parameterTypes.length + 1 + i
                        });
                    }
                }

            }
        }

        let stackframeDelta = 0;
        if (method.hasEllipsis()) {
            let ellipsisParameterCount = parameterTypes.length - method.getParameterCount() + 1; // last parameter and subsequent ones
            stackframeDelta = - (ellipsisParameterCount - 1);
            this.pushStatements({
                type: TokenType.makeEllipsisArray,
                position: parameterNodes[method.getParameterCount() - 1].position,
                parameterCount: ellipsisParameterCount,
                stepFinished: false,
                arrayType: method.getParameter(method.getParameterCount() - 1).type
            })
        }

        this.pushStatements({
            type: TokenType.callMethod,
            method: method,
            position: position,
            stepFinished: true,
            isSuperCall: false,
            stackframeBegin: -(parameterTypes.length + 1 + stackframeDelta) // this-object followed by parameters
        });
    }

    generateClass(classNode: ClassDeclarationNode) {

        if (classNode.resolvedType == null) return;

        this.pushNewSymbolTable(false, classNode.scopeFrom, classNode.scopeTo);

        let klass = <Klass>classNode.resolvedType;

        //this.pushUsagePosition(classNode.position, klass);

        let inheritanceError = klass.checkInheritance();

        if (inheritanceError.message != "") {
            this.pushError(inheritanceError.message, classNode.position, "error", this.getInheritanceQuickFix(classNode.scopeTo, inheritanceError));
        }

        let baseClass = klass.baseClass;
        if(baseClass != null){
            if (baseClass.module != klass.module && baseClass.visibility == Visibility.private) {
                this.pushError("Die Basisklasse " + baseClass.identifier + " der Klasse " + klass.identifier + " ist hier nicht sichtbar.", classNode.position);
            }
            if(baseClass.isFinal){
                this.pushError("Die Basisklasse " + baseClass.identifier + " der Klasse " + klass.identifier + " ist final, daher kann sie keine Unterklasse haben.", classNode.position);
            }
        }

        this.currentSymbolTable.classContext = klass;
        this.currentProgram = klass.attributeInitializationProgram;

        for (let attribute of classNode.attributes) {
            if (attribute != null && !attribute.isStatic && attribute.initialization != null) {
                this.initializeAttribute(attribute);
            }
        }

        if (klass.attributeInitializationProgram.statements.length > 0) {
            this.pushStatements({
                type: TokenType.return,
                position: this.lastStatement.position,
                copyReturnValueToStackframePos0: false,
                stepFinished: false,
                leaveThisObjectOnStack: true
            });
        }


        this.currentProgram.labelManager.resolveNodes();

        for (let methodNode of classNode.methods) {
            if (methodNode != null && !methodNode.isAbstract && !methodNode.isStatic) {
                this.compileMethod(methodNode);
                let m: Method = methodNode.resolvedType;
                if (m != null && m.annotation == "@Override") {
                    if (klass.baseClass != null) {
                        if (klass.baseClass.getMethodBySignature(m.signature) == null) {
                            this.pushError("Die Methode " + m.signature + " ist mit @Override annotiert, überschreibt aber keine Methode gleicher Signatur einer Oberklasse.", methodNode.position, "warning");
                        }
                    }
                }

            }
        }

        this.checkDoubleMethodDeclaration(klass);

        this.popSymbolTable(null);

        // static attributes/methods
        this.pushNewSymbolTable(false, classNode.scopeFrom, classNode.scopeTo);

        this.currentSymbolTable.classContext = klass.staticClass;
        this.currentProgram = klass.staticClass.attributeInitializationProgram;

        for (let attribute of classNode.attributes) {
            if (attribute != null && attribute.isStatic && attribute.initialization != null) {
                this.initializeAttribute(attribute);
            }
        }

        if (klass.staticClass.attributeInitializationProgram.statements.length > 0) {
            this.pushStatements({
                type: TokenType.return,
                position: this.lastStatement.position,
                copyReturnValueToStackframePos0: false,
                stepFinished: false,
                leaveThisObjectOnStack: true
            });
        }


        this.currentProgram.labelManager.resolveNodes();

        for (let methodNode of classNode.methods) {
            if (methodNode != null && methodNode.isStatic) {
                this.compileMethod(methodNode);
            }
        }

        this.popSymbolTable(null);

    }

    checkDoubleMethodDeclaration(cie: Klass | Interface) {  // N.B.: Enum extends Klass

        let signatureMap: { [key: string]: Method } = {};

        for (let m of cie.methods) {

            let signature = m.getSignatureWithReturnParameter();
            if (signatureMap[signature] != null) {

                let cieType: String = "In der Klasse ";
                if (cie instanceof Interface) cieType = "Im Interface ";
                if (cie instanceof Enum) cieType = "Im Enum ";

                this.pushError(cieType + cie.identifier + " gibt es zwei Methoden mit derselben Signatur: " + signature, m.usagePositions.get(this.module)[0], "error");
                this.pushError(cieType + cie.identifier + " gibt es zwei Methoden mit derselben Signatur: " + signature, signatureMap[signature].usagePositions.get(this.module)[0], "error");

            } else {
                signatureMap[signature] = m;
            }

        }

    }

    getInheritanceQuickFix(position: TextPosition, inheritanceError: { message: string; missingMethods: Method[]; }): QuickFix {

        let s: string = "";
        for (let m of inheritanceError.missingMethods) {
            s += "\tpublic " + (m.returnType == null ? " void" : getTypeIdentifier(m.returnType)) + " " + m.identifier + "(";
            s += m.parameterlist.parameters.map(p => getTypeIdentifier(p.type) + " " + p.identifier).join(", ");
            s += ") {\n\t\t//TODO: Methode füllen\n\t}\n\n";
        }

        return {
            title: "Fehlende Methoden einfügen",
            editsProvider: (uri) => {
                return [
                    {
                        resource: uri,
                        edit: {
                            range: { startLineNumber: position.line, startColumn: position.column - 1, endLineNumber: position.line, endColumn: position.column - 1 },
                            text: s
                        }
                    }
                ]
            }
        }


    }

    getSuperconstructorCalls(nodes: ASTNode[], superconstructorCallsFound: ASTNode[], isFirstStatement: boolean): boolean {
        for (let node of nodes) {
            if (node == null) continue;
            if (node.type == TokenType.superConstructorCall || node.type == TokenType.constructorCall) {

                if (!isFirstStatement) {
                    if (superconstructorCallsFound.length > 0) {
                        this.pushError("Ein Konstruktor darf nur einen einzigen Aufruf des Superkonstruktors oder eines anderen Konstruktors enthalten.", node.position, "error");
                    } else {
                        this.pushError("Vor dem Aufruf des Superkonstruktors oder eines anderen Konstruktors darf keine andere Anweisung stehen.", node.position, "error");
                    }
                }

                superconstructorCallsFound.push(node);
                isFirstStatement = false;
            } else if (node.type == TokenType.scopeNode && node.statements != null) {
                isFirstStatement = isFirstStatement && this.getSuperconstructorCalls(node.statements, superconstructorCallsFound, isFirstStatement);
            } else {
                isFirstStatement = false;
            }
        }
        return isFirstStatement;
    }


    compileMethod(methodNode: MethodDeclarationNode) {
        // Assumption: methodNode != null
        let method = methodNode.resolvedType;

        let klass = this.currentSymbolTable.classContext;
        if (klass != null && method != null) {
            this.checkIfMethodIsVirtual(method, klass);
            this.checkIfMethodOverridesFinalMethod(method, klass, methodNode.position);
        }

        if (method == null) return;

        // this.pushUsagePosition(methodNode.position, method);

        this.initCurrentProgram();
        method.program = this.currentProgram;

        this.pushNewSymbolTable(false, methodNode.scopeFrom, methodNode.scopeTo);
        this.currentSymbolTable.method = method;

        let stackPos: number = 1;

        for (let v of method.getParameterList().parameters) {
            v.stackPos = stackPos++;

            this.currentSymbolTable.variableMap.set(v.identifier, v);
        }

        // " + 1" is for "this"-object
        this.nextFreeRelativeStackPos = methodNode.parameters.length + 1;

        if (method.isConstructor && this.currentSymbolTable.classContext instanceof Klass && methodNode.statements != null) {
            let c: Klass = this.currentSymbolTable.classContext;

            let superconstructorCalls: ASTNode[] = [];
            this.getSuperconstructorCalls(methodNode.statements, superconstructorCalls, true);

            let superconstructorCallEnsured: boolean = superconstructorCalls.length > 0;

            // if (methodNode.statements.length > 0 && methodNode.statements[0].type == TokenType.scopeNode) {
            //     let stm = methodNode.statements[0].statements;
            //     if (stm.length > 0 && [TokenType.superConstructorCall, TokenType.constructorCall].indexOf(stm[0].type) >= 0) {
            //         superconstructorCallEnsured = true;
            //     }
            // } else if ([TokenType.superConstructorCall, TokenType.constructorCall].indexOf(methodNode.statements[0].type) >= 0) {
            //     superconstructorCallEnsured = true;
            // }

            if (c != null && c.baseClass?.hasConstructor() && !c.baseClass?.hasParameterlessConstructor()) {
                let error: boolean = false;
                if (methodNode.statements == null || methodNode.statements.length == 0) error = true;
                if (!error) {
                    error = !superconstructorCallEnsured;
                }
                if (error) {
                    let quickFix: QuickFix = null;
                    let constructors = c.baseClass.methods.filter(m => m.isConstructor);
                    if (constructors.length == 1) {
                        let methodCall = "super(" + constructors[0].parameterlist.parameters.map(p => p.identifier).join(", ") + ");";
                        let position = methodNode.position;
                        quickFix = {
                            title: 'Aufruf des Konstruktors der Basisklasse einfügen',
                            //06.06.2020
                            editsProvider: (uri) => {
                                return [{
                                    resource: uri,
                                    edit: {
                                        range: {
                                            startLineNumber: position.line + 1, startColumn: 0, endLineNumber: position.line + 1, endColumn: 0,
                                            message: "",
                                            severity: monaco.MarkerSeverity.Error
                                        },
                                        text: "\t\t" + methodCall + "\n"
                                    }
                                }
                                ];
                            }
                        }
                    }
                    this.pushError("Die Basisklasse der Klasse " + c.identifier + " besitzt keinen parameterlosen Konstruktor, daher muss diese Konstruktordefinition mit einem Aufruf eines Konstruktors der Basisklasse (super(...)) beginnen.",
                        methodNode.position, "error", quickFix);
                }
            } else if (!superconstructorCallEnsured && c.baseClass?.hasParameterlessConstructor()) {
                // invoke parameterless constructor
                let baseClassConstructor = c.baseClass.getParameterlessConstructor();
                this.pushStatements([
                    // Push this-object to stack:
                    {
                        type: TokenType.pushLocalVariableToStack,
                        position: methodNode.position,
                        stackposOfVariable: 0
                    },
                    {
                        type: TokenType.callMethod,
                        method: baseClassConstructor,
                        isSuperCall: true,
                        position: methodNode.position,
                        stackframeBegin: -1 // this-object followed by parameters
                    }

                ])
            }
        }

        let actorClass = <Klass>this.moduleStore.getType("Actor").type;
        let methodIdentifiers = ["act", "onKeyTyped", "onKeyDown", "onKeyUp",
            "onMouseDown", "onMouseUp", "onMouseMove", "onMouseEnter", "onMouseLeave"];
        if (methodIdentifiers.indexOf(method.identifier) >= 0 && this.currentSymbolTable.classContext.hasAncestorOrIs(actorClass)) {
            this.pushStatements([

                {
                    type: TokenType.returnIfDestroyed,
                    position: methodNode.position
                },
            ]);
        }

        let withReturnStatement = this.generateStatements(methodNode.statements).withReturnStatement;

        if (!withReturnStatement) {
            this.pushStatements({
                type: TokenType.return,
                position: methodNode.scopeTo,
                copyReturnValueToStackframePos0: false,
                stepFinished: true,
                leaveThisObjectOnStack: false
            });

            let rt = method.getReturnType();
            if (!method.isConstructor && rt != null && rt != voidPrimitiveType) {
                this.pushError("Die Deklaration der Methode verlangt die Rückgabe eines Wertes vom Typ " + rt.identifier + ". Es fehlt (mindestens) eine entsprechende return-Anweisung.", methodNode.position);
            }
        }

        method.reserveStackForLocalVariables = this.nextFreeRelativeStackPos
            - methodNode.parameters.length - 1;

        this.popSymbolTable();
        this.currentProgram.labelManager.resolveNodes();
    }


    /**
     * checks if child classes have method with same signature
     */
    checkIfMethodIsVirtual(method: Method, klass: Klass | StaticClass) {
        for (let mo of this.moduleStore.getJavaModules(false)) {
            for (let c of mo.typeStore.typeList) {
                if (c instanceof Klass && c != klass && c.hasAncestorOrIs(klass)) {
                    for (let m of c.methods) {
                        if (m != null && method != null && m.signature == method.signature) {
                            method.isVirtual = true;
                            return;
                        }
                    }
                }
            }
        }
    }

    checkIfMethodOverridesFinalMethod(method: Method, klass: Klass | StaticClass, position: TextPosition){
        if(klass instanceof StaticClass) return;

        let baseClass = klass.baseClass;
        while(baseClass != null){
            for(let m of baseClass.methods){
                if(m.identifier == method.identifier && (m.isFinal || m.visibility == Visibility.private) && m.signature == method.signature){
                    this.pushError("Die Methode " + method.identifier + " überschreibt die gleichnamige private oder finale Methode der Oberklasse " + baseClass.identifier, position);
                }
            }
            baseClass = baseClass.baseClass;
        }

    }



    initializeAttribute(attribute: AttributeDeclarationNode) {

        if (attribute == null) return;

        // assumption: attribute != null
        if (attribute.identifier == null || attribute.initialization == null || attribute.resolvedType == null) return;

        if (attribute.isStatic) {
            this.pushStatements({
                type: TokenType.pushStaticAttribute,
                attributeIndex: attribute.resolvedType.index,
                attributeIdentifier: attribute.resolvedType.identifier,
                position: attribute.initialization.position,
                klass: <StaticClass>(this.currentSymbolTable.classContext)
            });
        } else {
            this.pushStatements({
                type: TokenType.pushAttribute,
                attributeIndex: attribute.resolvedType.index,
                attributeIdentifier: attribute.identifier,
                position: attribute.initialization.position,
                useThisObject: true
            });
        }


        let initializationType = this.processNode(attribute.initialization);

        if (initializationType != null && initializationType.type != null) {
            if (!this.ensureAutomaticCasting(initializationType.type, attribute.attributeType.resolvedType)) {

                if (attribute.attributeType.resolvedType == null) {
                    this.pushError("Der Datentyp von " + attribute.identifier + " konnte nicht ermittelt werden. ", attribute.position);
                } else {
                    this.pushError("Der Wert des Term vom Datentyp " + initializationType.type + " kann dem Attribut " + attribute.identifier + " vom Typ " + attribute.attributeType.resolvedType.identifier + " nicht zugewiesen werden.", attribute.initialization.position);
                }


            }

            this.pushStatements({
                type: TokenType.assignment,
                position: attribute.initialization.position,
                stepFinished: false,
                leaveValueOnStack: false
            });
        }

    }



    initCurrentProgram() {

        this.currentProgram = {
            module: this.module,
            statements: [],
            labelManager: null
        };

        this.currentProgram.labelManager = new LabelManager(this.currentProgram);

        this.lastStatement = null;

    }

    generateMain(isAdhocCompilation: boolean = false) {

        this.initCurrentProgram();

        let position: TextPosition = { line: 1, column: 1, length: 0 };

        let mainProgramAst = this.module.mainProgramAst;
        if (mainProgramAst != null && mainProgramAst.length > 0 && mainProgramAst[0] != null) {
            position = this.module.mainProgramAst[0].position;
        }

        if (!isAdhocCompilation) {
            this.pushNewSymbolTable(true, position, { line: 100000, column: 1, length: 0 }, this.currentProgram);
            this.heap = {};
        }

        this.module.mainProgram = this.currentProgram;

        let hasMainProgram: boolean = false;

        if (this.module.mainProgramAst != null && this.module.mainProgramAst.length > 0) {

            hasMainProgram = true;
            this.generateStatements(this.module.mainProgramAst);

            if (isAdhocCompilation && this.lastStatement != null && this.lastStatement.type == TokenType.decreaseStackpointer) {
                this.removeLastStatement();
            }

            this.lastPosition = this.module.mainProgramEnd;
            if (this.lastPosition == null) this.lastPosition = { line: 100000, column: 0, length: 0 };
            // if(this.lastPosition == null) this.lastPosition = {line: 100000, column: 0, length: 0};

            this.currentSymbolTable.positionTo = this.lastPosition;
            if (!isAdhocCompilation) this.popSymbolTable(this.currentProgram, true);
            this.heap = null;

            this.pushStatements({
                type: TokenType.programEnd,
                position: this.lastPosition,
                stepFinished: true,
                pauseAfterProgramEnd: true
            }, true);

        }

        this.currentProgram.labelManager.resolveNodes();

        if (!isAdhocCompilation && !hasMainProgram) {
            this.popSymbolTable(this.currentProgram);
            this.heap = null;
        }

    }

    ensureAutomaticCasting(typeFrom: Type, typeTo: Type, position?: TextPosition, nodeFrom?: ASTNode, stackPosRelative: number = 0): boolean {

        if (typeFrom == null || typeTo == null) return false;

        if (typeFrom.equals(typeTo)) {
            return true;
        }

        if (!typeFrom.canCastTo(typeTo)) {

            if (typeTo == booleanPrimitiveType && nodeFrom != null) {

                this.checkIfAssignmentInstedOfEqual(nodeFrom);

            }


            return false;
        }

        if (typeFrom["unboxableAs"] != null && typeFrom["unboxableAs"].indexOf(typeTo) >= 0) {
            return true;
        }

        if (typeFrom instanceof Klass && typeTo == stringPrimitiveType) {

            let toStringStatement = this.getToStringStatement(typeFrom, position);

            if (toStringStatement != null) {
                this.pushStatements(toStringStatement);
                return true;
            }

            return false;
        }


        if (typeFrom instanceof PrimitiveType && (typeTo instanceof PrimitiveType || typeTo == stringPrimitiveType)) {
            let castInfo = typeFrom.getCastInformation(typeTo);
            if (!castInfo.automatic) {
                return false;
            }
            if (castInfo.needsStatement) {
                this.pushStatements({
                    type: TokenType.castValue,
                    newType: typeTo,
                    position: position,
                    stackPosRelative: stackPosRelative
                });
            }
        }

        return true;

    }

    getToStringStatement(type: Klass, position: TextPosition): Statement {
        let toStringMethod = type.getMethodBySignature("toString()");
        if (toStringMethod != null && toStringMethod.getReturnType() == stringPrimitiveType) {

            return {
                type: TokenType.callMethod,
                position: position,
                method: toStringMethod,
                isSuperCall: false,
                stackframeBegin: -1,
                stepFinished: false
            };


        } else {
            return null;
        }
    }

    checkIfAssignmentInstedOfEqual(nodeFrom: ASTNode, conditionType?: Type) {
        if (nodeFrom == null) return;

        if (nodeFrom.type == TokenType.binaryOp && nodeFrom.operator == TokenType.assignment) {
            let pos = nodeFrom.position;
            this.pushError("= ist der Zuweisungsoperator. Du willst sicher zwei Werte vergleichen. Dazu benötigst Du den Vergleichsoperator ==.",
                pos, conditionType == booleanPrimitiveType ? "warning" : "error", {
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

    generateStatements(nodes: ASTNode[]): { withReturnStatement: boolean, endPosition?: TextPosition } {


        if (nodes == null || nodes.length == 0 || nodes[0] == null) return { withReturnStatement: false };

        let withReturnStatement: boolean = this.processStatementsInsideBlock(nodes);

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
            this.lastPosition = endPosition;
        } else {
            endPosition = this.lastPosition;
        }

        return { withReturnStatement: withReturnStatement, endPosition: endPosition };

    }

    processStatementsInsideBlock(nodes: ASTNode[]) {
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


    lastPosition: TextPosition;
    lastStatement: Statement;

    insertStatements(pos: number, statements: Statement | Statement[]) {
        if (statements == null) return;
        if (!Array.isArray(statements)) statements = [statements];
        for (let st of statements) {
            this.currentProgram.statements.splice(pos++, 0, st);
        }
    }

    pushStatements(statement: Statement | Statement[], deleteStepFinishedFlagOnStepBefore: boolean = false) {

        if (statement == null) return;

        if (deleteStepFinishedFlagOnStepBefore && this.currentProgram.statements.length > 0) {
            let stepBefore: Statement = this.currentProgram.statements[this.currentProgram.statements.length - 1];
            stepBefore.stepFinished = false;
        }

        if (Array.isArray(statement)) {
            for (let st of statement) {
                this.currentProgram.statements.push(st);
                if (st.type == TokenType.return || st.type == TokenType.jumpAlways) {
                    if (this.lastStatement != null) this.lastStatement.stepFinished = false;
                }
                if (st.position != null) {
                    this.lastPosition = st.position;
                } else {
                    st.position = this.lastPosition;
                }
                this.lastStatement = st;
            }
        } else {
            this.currentProgram.statements.push(statement);
            if (statement.type == TokenType.return || statement.type == TokenType.jumpAlways) {
                if (this.lastStatement != null && this.lastStatement.type != TokenType.noOp) this.lastStatement.stepFinished = false;
            }
            if (statement.position != null) {
                this.lastPosition = statement.position;
            } else {
                statement.position = this.lastPosition;
            }

            this.lastStatement = statement;
        }
    }

    removeLastStatement() {
        let lst = this.currentProgram.statements.pop();
        if (this.currentProgram.labelManager != null) {
            this.currentProgram.labelManager.removeNode(lst);
        }
    }

    initStackFrameNodes: InitStackframeStatement[] = [];


    pushNewSymbolTable(beginNewStackframe: boolean, positionFrom: TextPosition, positionTo: TextPosition,
        program?: Program): SymbolTable {

        let st = new SymbolTable(this.currentSymbolTable, positionFrom, positionTo);

        this.symbolTableStack.push(this.currentSymbolTable);

        if (beginNewStackframe) {
            st.beginsNewStackframe = true;
            this.currentSymbolTable.stackframeSize = this.nextFreeRelativeStackPos;
            this.nextFreeRelativeStackPos = 0;

            if (program != null) {
                let initStackFrameNode: InitStackframeStatement = {
                    type: TokenType.initStackframe,
                    position: positionFrom,
                    reserveForLocalVariables: 0
                }

                program.statements.push(initStackFrameNode);
                this.initStackFrameNodes.push(initStackFrameNode);
            }

        }

        this.currentSymbolTable = st;

        return st;

    }

    popSymbolTable(program?: Program, deleteStepFinishedFlagOnStepBefore: boolean = false): void {

        let st = this.currentSymbolTable;
        this.currentSymbolTable = this.symbolTableStack.pop();

        // if v.declarationError != null then variable has been used before initialization.
        st.variableMap.forEach(v => {
            if (v.declarationError != null && v.usedBeforeInitialization) {
                this.errorList.push(v.declarationError);
                v.declarationError = null;
            }
        });

        // if (!st.beginsNewStackframe && st.variableMap.size == 0 && removeI) {
        //     // empty symbol table => remove it!
        //     if (st.parent != null) {
        //         st.parent.childSymbolTables.pop();
        //     }
        // } else 
        {
            // TODO: add length of token

            if (st.beginsNewStackframe) {

                st.stackframeSize = this.nextFreeRelativeStackPos;
                this.nextFreeRelativeStackPos = this.currentSymbolTable.stackframeSize;

                if (program != null) {
                    let initStackframeNode = this.initStackFrameNodes.pop();
                    if (initStackframeNode != null) initStackframeNode.reserveForLocalVariables = st.stackframeSize;

                    if (program.statements.length > 0 && deleteStepFinishedFlagOnStepBefore) {
                        let statement = program.statements[program.statements.length - 1];

                        // don't set stepFinished = false in jump-statements
                        // as this could lead to infinity-loop is user sets "while(true);" just before program end
                        if ([TokenType.jumpAlways, TokenType.jumpIfTrue, TokenType.jumpIfFalse, TokenType.jumpIfFalseAndLeaveOnStack, TokenType.jumpIfTrueAndLeaveOnStack].indexOf(statement.type) == -1) {
                            program.statements[program.statements.length - 1].stepFinished = false;
                        }
                    }

                    program.statements.push({
                        type: TokenType.closeStackframe,
                        position: st.positionTo
                    });
                }

            }

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

    openBreakScope() {
        this.breakNodeStack.push([]);
    }

    openContinueScope() {
        this.continueNodeStack.push([]);
    }

    pushBreakNode(breakNode: JumpAlwaysStatement) {
        if (this.breakNodeStack.length == 0) {
            this.pushError("Eine break-Anweisung ist nur innerhalb einer umgebenden Schleife oder switch-Anweisung sinnvoll.", breakNode.position);
        } else {
            this.breakNodeStack[this.breakNodeStack.length - 1].push(breakNode);
            this.pushStatements(breakNode);
        }
    }

    pushContinueNode(continueNode: JumpAlwaysStatement) {
        if (this.continueNodeStack.length == 0) {
            this.pushError("Eine continue-Anweisung ist nur innerhalb einer umgebenden Schleife oder switch-Anweisung sinnvoll.", continueNode.position);
        } else {
            this.continueNodeStack[this.continueNodeStack.length - 1].push(continueNode);
            this.pushStatements(continueNode);
        }
    }

    closeBreakScope(breakTargetLabel: number, lm: LabelManager) {
        let breakNodes = this.breakNodeStack.pop();
        for (let bn of breakNodes) {
            lm.registerJumpNode(bn, breakTargetLabel);
        }
    }

    closeContinueScope(continueTargetLabel: number, lm: LabelManager) {
        let continueNodes = this.continueNodeStack.pop();
        for (let bn of continueNodes) {
            lm.registerJumpNode(bn, continueTargetLabel);
        }
    }

    breakOccured(): boolean {
        return this.breakNodeStack.length > 0 && this.breakNodeStack[this.breakNodeStack.length - 1].length > 0;
    }

    processNode(node: ASTNode, isLeftSideOfAssignment: boolean = false): StackType {

        if (node == null) return;

        switch (node.type) {
            case TokenType.binaryOp:
                return this.processBinaryOp(node);
            case TokenType.unaryOp:
                return this.processUnaryOp(node);
            case TokenType.pushConstant:
                return this.pushConstant(node);
            case TokenType.callMethod:
                return this.callMethod(node);
            case TokenType.identifier:
                {
                    let stackType = this.resolveIdentifier(node);
                    let v = node.variable;
                    if (v != null) {
                        if (isLeftSideOfAssignment) {
                            v.initialized = true;
                            if (!v.usedBeforeInitialization) {
                                v.declarationError = null;
                            }
                        } else {
                            if (v.initialized != null && !v.initialized) {
                                v.usedBeforeInitialization = true;
                                this.pushError("Die Variable " + v.identifier + " wird hier benutzt bevor sie initialisiert wurde.", node.position, "info");
                            }
                        }
                    }
                    return stackType;
                }
            case TokenType.selectArrayElement:
                return this.selectArrayElement(node);
            case TokenType.incrementDecrementBefore:
            case TokenType.incrementDecrementAfter:
                return this.incrementDecrementBeforeOrAfter(node);
            case TokenType.superConstructorCall:
                return this.superconstructorCall(node);
            case TokenType.constructorCall:
                return this.superconstructorCall(node);
            case TokenType.keywordThis:
                return this.pushThisOrSuper(node, false);
            case TokenType.keywordSuper:
                return this.pushThisOrSuper(node, true);
            case TokenType.pushAttribute:
                return this.pushAttribute(node);
            case TokenType.newObject:
                return this.newObject(node);
            case TokenType.keywordWhile:
                return this.processWhile(node);
            case TokenType.keywordDo:
                return this.processDo(node);
            case TokenType.keywordFor:
                return this.processFor(node);
            case TokenType.forLoopOverCollection:
                return this.processForLoopOverCollection(node);
            case TokenType.keywordIf:
                return this.processIf(node);
            case TokenType.keywordSwitch:
                return this.processSwitch(node);
            case TokenType.keywordReturn:
                return this.processReturn(node);
            case TokenType.localVariableDeclaration:
                return this.localVariableDeclaration(node);
            case TokenType.arrayInitialization:
                return this.processArrayLiteral(node);
            case TokenType.newArray:
                return this.processNewArray(node);
            case TokenType.keywordPrint:
            case TokenType.keywordPrintln:
                return this.processPrint(node);
            case TokenType.castValue:
                return this.processManualCast(node);
            case TokenType.keywordBreak:
                this.pushBreakNode({
                    type: TokenType.jumpAlways,
                    position: node.position
                });
                return null;
            case TokenType.keywordContinue:
                this.pushContinueNode({
                    type: TokenType.jumpAlways,
                    position: node.position
                });
                return null;
            case TokenType.rightBracket:
                let type = this.processNode(node.termInsideBrackets);
                if (type != null && type.type instanceof Klass) this.pushTypePosition(node.position, type.type);
                return type;
            case TokenType.scopeNode:
                this.pushNewSymbolTable(false, node.position, node.positionTo);

                let withReturnStatement = this.processStatementsInsideBlock(node.statements);

                this.popSymbolTable();

                return { type: null, isAssignable: false, withReturnStatement: withReturnStatement };

        }

    }

    processManualCast(node: CastManuallyNode): StackType {

        let typeFrom1 = this.processNode(node.whatToCast);

        if (typeFrom1 == null || typeFrom1.type == null) return;
        let typeFrom: Type = typeFrom1.type;

        if (typeFrom != null && node.castToType != null && node.castToType.resolvedType != null) {

            let typeTo = node.castToType.resolvedType;

            if (typeFrom.canCastTo(typeTo)) {

                if (typeFrom instanceof PrimitiveType && typeTo instanceof PrimitiveType) {
                    let castInfo = typeFrom.getCastInformation(typeTo);
                    if (castInfo.needsStatement) {
                        this.pushStatements({
                            type: TokenType.castValue,
                            position: node.position,
                            newType: typeTo
                        });
                    }
                } else if (typeFrom instanceof Klass && typeTo == stringPrimitiveType) {
                    let toStringMethod = typeFrom.getMethodBySignature("toString()");
                    if (toStringMethod != null && toStringMethod.getReturnType() == stringPrimitiveType) {

                        this.pushStatements({
                            type: TokenType.callMethod,
                            position: node.position,
                            method: toStringMethod,
                            isSuperCall: false,
                            stackframeBegin: -1,
                            stepFinished: false
                        });

                    } else {
                        this.pushError("Der Datentyp " + typeFrom.identifier + " kann (zumindest durch casting) nicht in den Datentyp " + typeTo.identifier + " umgewandelt werden.", node.position);
                        this.pushStatements({
                            type: TokenType.castValue,
                            position: node.position,
                            newType: typeTo
                        });
                    }

                }

                return {
                    isAssignable: typeFrom1.isAssignable,
                    type: typeTo
                };

            }

            if ((typeFrom instanceof Klass || typeFrom instanceof Interface) && (typeTo instanceof Klass || typeTo instanceof Interface))

            // if (typeFrom instanceof Klass &&
            //     (typeTo instanceof Klass && !typeFrom.hasAncestorOrIs(typeTo) && typeTo.hasAncestorOrIs(typeFrom)) ||
            //     (typeTo instanceof Interface && !(<Klass>typeFrom).implementsInterface(typeTo))) 
            {

                this.pushStatements({
                    type: TokenType.checkCast,
                    position: node.position,
                    newType: typeTo,
                    stepFinished: false
                });

                return {
                    isAssignable: typeFrom1.isAssignable,
                    type: typeTo
                };
            }
            else {
                this.pushError("Der Datentyp " + typeFrom.identifier + " kann (zumindest durch casting) nicht in den Datentyp " + typeTo.identifier + " umgewandelt werden.", node.position);
            }

        }

    }

    processPrint(node: PrintNode): StackType {

        let type = node.type == TokenType.keywordPrint ? TokenType.print : TokenType.println;

        this.module.pushMethodCallPosition(node.position, node.commaPositions, TokenTypeReadable[node.type], node.rightBracketPosition);

        if (node.text != null) {

            let type = this.processNode(node.text);

            if (type != null) {
                if (!this.ensureAutomaticCasting(type.type, stringPrimitiveType)) {
                    this.pushError("Die Methoden print und println erwarten einen Parameter vom Typ String. Gefunden wurde ein Wert vom Typ " + type.type?.identifier + ".", node.position);
                }
            }

        }

        let withColor: boolean = false;

        if (node.color != null) {

            let type = this.processNode(node.color);

            if (type != null) {
                if (type.type != stringPrimitiveType && type.type != intPrimitiveType) {
                    if (!this.ensureAutomaticCasting(type.type, stringPrimitiveType)) {
                        this.pushError("Die Methoden print und println erwarten als Farbe einen Parameter vom Typ String oder int. Gefunden wurde ein Wert vom Typ " + type.type.identifier + ".", node.position);
                    }
                }
            }

            withColor = true;
        }


        this.pushStatements({
            type: type,
            position: node.position,
            empty: (node.text == null),
            stepFinished: true,
            withColor: withColor
        });


        return null;
    }

    processNewArray(node: NewArrayNode): StackType {

        if (node.initialization != null) {
            return this.processArrayLiteral(node.initialization);
        }

        // int[7][2][] are 7 arrays each with arrays of length 2 which are empty

        let dimension = 0;
        for (let ec of node.elementCount) {
            if (ec != null) {
                this.processNode(ec); // push number of elements for this dimension on stack
                dimension++;
            } else {
                break;
            }
        }

        // for the array above: arrayType is array of array of int; dimension is 2; stack: 7 2
        this.pushStatements({
            type: TokenType.pushEmptyArray,
            position: node.position,
            arrayType: node.arrayType.resolvedType,
            dimension: dimension
        });

        return {
            isAssignable: false,
            type: node.arrayType.resolvedType
        }

    }


    processArrayLiteral(node: ArrayInitializationNode): StackType {

        let bes: BeginArrayStatement = {
            type: TokenType.beginArray,
            position: node.position,
            arrayType: node.arrayType.resolvedType
        };

        this.pushStatements(bes);

        for (let ain of node.nodes) {

            // Did an error occur when parsing a constant?
            if (ain == null) {
                continue;
            }

            if (ain.type == TokenType.arrayInitialization) {
                this.processArrayLiteral(ain);
            } else {
                let sType = this.processNode(ain);
                if (sType == null) {
                    return;
                }
                let targetType = (<ArrayType>node.arrayType.resolvedType).arrayOfType;
                if (!this.ensureAutomaticCasting(sType.type, targetType, ain.position)) {
                    this.pushError("Der Datentyp des Terms (" + sType.type?.identifier + ") kann nicht in den Datentyp " + targetType?.identifier + " konvertiert werden.", ain.position);
                }
            }

        }

        this.pushStatements({
            type: TokenType.addToArray,
            position: node.position,
            numberOfElementsToAdd: node.nodes.length
        });

        return {
            isAssignable: false,
            type: node.arrayType.resolvedType
        }

    }

    localVariableDeclaration(node: LocalVariableDeclarationNode, dontWarnWhenNoInitialization: boolean = false): StackType {

        if (node.variableType.resolvedType == null) {
            node.variableType.resolvedType = nullType; // Make the best out of it...
        }

        let declareVariableOnHeap = (this.heap != null && this.symbolTableStack.length <= 2);

        let variable: Variable = {
            identifier: node.identifier,
            stackPos: declareVariableOnHeap ? null : this.nextFreeRelativeStackPos++,
            type: node.variableType.resolvedType,
            usagePositions: new Map(),
            declaration: { module: this.module, position: node.position },
            isFinal: node.isFinal
        };

        this.pushUsagePosition(node.position, variable);

        if (declareVariableOnHeap) {

            this.pushStatements({
                type: TokenType.heapVariableDeclaration,
                position: node.position,
                pushOnTopOfStackForInitialization: node.initialization != null,
                variable: variable,
                stepFinished: node.initialization == null
            });

            if (this.heap[variable.identifier]) {
                this.pushError("Die Variable " + node.identifier + " darf im selben Sichtbarkeitsbereich (Scope) nicht mehrmals definiert werden.", node.position);
            }
            
            //Not needed in commandline-mode?
            if(!this.isAdhocCompilation){
                this.heap[variable.identifier] = variable;
            }
            // only for code completion:
            this.currentSymbolTable.variableMap.set(node.identifier, variable);

        } else {

            if (this.currentSymbolTable.variableMap.get(node.identifier)) {
                this.pushError("Die Variable " + node.identifier + " darf im selben Sichtbarkeitsbereich (Scope) nicht mehrmals definiert werden.", node.position);
            }

            this.currentSymbolTable.variableMap.set(node.identifier, variable);

            this.pushStatements({
                type: TokenType.localVariableDeclaration,
                position: node.position,
                pushOnTopOfStackForInitialization: node.initialization != null,
                variable: variable,
                stepFinished: node.initialization == null
            })

        }

        if (node.initialization != null) {
            let initType = this.processNode(node.initialization);

            if (initType != null) {

                if (variable.type == varType) {
                    variable.type = initType.type;
                } else if (initType.type == null) {
                    this.pushError("Der Typ des Terms auf der rechten Seite des Zuweisungsoperators (=) konnte nicht bestimmt werden.", node.initialization.position);
                } else
                    if (!this.ensureAutomaticCasting(initType.type, variable.type)) {
                        this.pushError("Der Term vom Typ " + initType.type.identifier + " kann der Variable vom Typ " + variable.type.identifier + " nicht zugeordnet werden.", node.initialization.position);
                    };
                this.pushStatements({
                    type: TokenType.assignment,
                    position: node.initialization.position,
                    stepFinished: true,
                    leaveValueOnStack: false
                });
            }

        } else {
            if (variable.type == varType) {
                this.pushError("Die Verwendung von var ist nur dann zulässig, wenn eine lokale Variable in einer Anweisung deklariert und initialisiert wird, also z.B. var i = 12;", node.variableType.position);
            } else {
                let initializer: string = " = null";
                if (variable.type == intPrimitiveType) initializer = " = 0";
                if (variable.type == doublePrimitiveType) initializer = " = 0.0";
                if (variable.type == booleanPrimitiveType) initializer = " = false";
                if (variable.type == charPrimitiveType) initializer = " = ' '";
                if (variable.type == stringPrimitiveType) initializer = ' = ""';

                variable.declarationError = {
                    text: "Jede lokale Variable sollte vor ihrer ersten Verwendung initialisiert werden.",
                    position: node.position,
                    quickFix:
                    {
                        title: initializer + " ergänzen",
                        editsProvider: (uri) => {
                            let pos = node.position;
                            return [
                                {
                                    resource: uri,
                                    edit: {
                                        range: { startLineNumber: pos.line, startColumn: pos.column + pos.length, endLineNumber: pos.line, endColumn: pos.column + pos.length },
                                        text: initializer
                                    }
                                }
                            ]
                        }
                    },
                    level: "info"
                }

                variable.usedBeforeInitialization = false;
                variable.initialized = dontWarnWhenNoInitialization;

            }
        }

        return null;

    }

    processReturn(node: ReturnNode): StackType {

        let method = this.currentSymbolTable.method;

        if (method == null) {
            this.pushError("Eine return-Anweisung ist nur im Kontext einer Methode erlaubt.", node.position);
            return null;
        }

        if (node.term != null) {

            if (method.getReturnType() == null) {
                this.pushError("Die Methode " + method.identifier + " erwartet keinen Rückgabewert.", node.position);
                return null;
            }

            let type = this.processNode(node.term);

            if (type != null) {
                if (!this.ensureAutomaticCasting(type.type, method.getReturnType(), null, node)) {
                    this.pushError("Die Methode " + method.identifier + " erwartet einen Rückgabewert vom Typ " + method.getReturnType().identifier + ". Gefunden wurde ein Wert vom Typ " + type.type.identifier + ".", node.position);
                }

            }

        } else {
            if (method.getReturnType() != null && method.getReturnType() != voidPrimitiveType) {
                this.pushError("Die Methode " + method.identifier + " erwartet einen Rückgabewert vom Typ " + method.getReturnType().identifier + ", daher ist die leere Return-Anweisung (return;) nicht ausreichend.", node.position);
            }
        }

        this.pushStatements({
            type: TokenType.return,
            position: node.position,
            copyReturnValueToStackframePos0: node.term != null,
            stepFinished: true,
            leaveThisObjectOnStack: false
        });

        return { type: null, isAssignable: false, withReturnStatement: true };

    }

    processSwitch(node: SwitchNode): StackType {

        let lm = this.currentProgram.labelManager;

        this.pushNewSymbolTable(false, node.scopeFrom, node.scopeTo);

        let ct = this.processNode(node.condition);
        if (ct == null || ct.type == null) return;

        let conditionType = ct.type;

        let isString = conditionType == stringPrimitiveType || conditionType == charPrimitiveType;
        let isInteger = conditionType == intPrimitiveType;
        let isEnum = conditionType instanceof Enum;

        if (!(isString || isInteger || isEnum)) {
            this.pushError("Der Unterscheidungsterms einer switch-Anweisung muss den Datentyp String, char, int oder enum besitzen. Dieser hier ist vom Typ " + conditionType.identifier, node.condition.position);
        }

        if (isEnum) {
            this.pushStatements({
                type: TokenType.castValue,
                position: node.condition.position,
                newType: intPrimitiveType
            });
        }

        let switchStatement: JumpOnSwitchStatement = {
            type: TokenType.keywordSwitch,
            position: node.position,
            defaultDestination: null,
            switchType: isString ? "string" : "number",
            destinationLabels: [],
            destinationMap: {}
        }

        this.pushStatements(switchStatement);

        // if value not included in case-statement and no default-statement present:
        let endLabel = lm.insertJumpNode(TokenType.jumpAlways, node.position, this);

        switchStatement.stepFinished = true;

        lm.registerSwitchStatement(switchStatement);

        this.openBreakScope();

        let withReturnStatement = node.caseNodes.length > 0;

        for (let caseNode of node.caseNodes) {

            let isDefault = caseNode.caseTerm == null;

            if (!isDefault) {

                let constant: string | number = null;

                if (isEnum && caseNode.caseTerm.type == TokenType.identifier) {
                    let en: Enum = <Enum>conditionType;
                    let info = en.identifierToInfoMap[caseNode.caseTerm.identifier];
                    if (info == null) {
                        this.pushError("Die Enum-Klasse " + conditionType.identifier + " hat kein Element mit dem Bezeichner " + caseNode.caseTerm.identifier, caseNode.position, "error");
                    } else {
                        constant = info.ordinal;
                    }
                } else {
                    let caseTerm = this.processNode(caseNode.caseTerm);

                    let ls = this.lastStatement;

                    if (ls.type == TokenType.pushConstant) {
                        constant = ls.value;
                    }

                    if (ls.type == TokenType.pushEnumValue) {
                        constant = ls.enumClass.getOrdinal(ls.valueIdentifier);
                    }

                    this.removeLastStatement();
                }

                if (constant == null) {
                    this.pushError("Der Term bei case muss konstant sein.", caseNode.caseTerm.position);
                }

                let label = lm.markJumpDestination(1);
                let statements = this.generateStatements(caseNode.statements);

                if (statements?.withReturnStatement == null || !statements.withReturnStatement) {
                    withReturnStatement = false;
                }

                switchStatement.destinationLabels.push({
                    constant: constant,
                    label: label
                });
            } else {
                // default case
                let label = lm.markJumpDestination(1);
                let statements = this.generateStatements(caseNode.statements);
                if (statements?.withReturnStatement == null || !statements.withReturnStatement) {
                    withReturnStatement = false;
                }
                switchStatement.defaultDestination = label;
            }

        }

        if (switchStatement.defaultDestination == null) {
            withReturnStatement = false;
        }

        lm.markJumpDestination(1, endLabel);

        this.closeBreakScope(endLabel, lm);

        this.popSymbolTable(null);

        return { type: null, isAssignable: false, withReturnStatement: withReturnStatement };
    }

    processIf(node: IfNode): StackType {

        let lm = this.currentProgram.labelManager;

        let conditionType = this.processNode(node.condition);

        this.checkIfAssignmentInstedOfEqual(node.condition, conditionType?.type);
        if (conditionType != null && conditionType.type != booleanPrimitiveType && conditionType.type.identifier != "Boolean") {
            this.pushError("Der Wert des Terms in Klammern hinter 'if' muss den Datentyp boolean besitzen.", node.condition.position);
        }

        let beginElse = lm.insertJumpNode(TokenType.jumpIfFalse, null, this);

        let withReturnStatementIf = this.generateStatements(node.statementsIfTrue).withReturnStatement;

        let endOfIf: number;
        if (node.statementsIfFalse != null) {
            endOfIf = lm.insertJumpNode(TokenType.jumpAlways, null, this);
        }

        lm.markJumpDestination(1, beginElse);

        let withReturnStatementElse: boolean;
        if (node.statementsIfFalse == null || node.statementsIfFalse.length == 0) {
            withReturnStatementElse = false;
        } else {
            withReturnStatementElse = this.generateStatements(node.statementsIfFalse).withReturnStatement;
        }

        if (endOfIf != null) {
            lm.markJumpDestination(1, endOfIf);
        }

        return { type: null, isAssignable: false, withReturnStatement: withReturnStatementIf && withReturnStatementElse };

    }


    processFor(node: ForNode): StackType {

        let lm = this.currentProgram.labelManager;

        this.pushNewSymbolTable(false, node.scopeFrom, node.scopeTo);

        this.generateStatements(node.statementsBefore);

        let labelBeforeCondition = lm.markJumpDestination(1);

        let conditionType = this.processNode(node.condition);

        if (conditionType != null && conditionType.type != booleanPrimitiveType) {
            this.checkIfAssignmentInstedOfEqual(node.condition);
            this.pushError("Der Wert der Bedingung muss den Datentyp boolean besitzen.", node.condition.position);
        }

        let labelAfterForLoop = lm.insertJumpNode(TokenType.jumpIfFalse, null, this);

        this.openBreakScope();
        this.openContinueScope();

        let statements = this.generateStatements(node.statements);
        let withReturnStatement = statements.withReturnStatement;

        let continueLabelIndex = lm.markJumpDestination(1);
        this.closeContinueScope(continueLabelIndex, lm);
        this.generateStatements(node.statementsAfter);

        lm.insertJumpNode(TokenType.jumpAlways, statements.endPosition, this, labelBeforeCondition);

        lm.markJumpDestination(1, labelAfterForLoop);

        this.closeBreakScope(labelAfterForLoop, lm);

        this.popSymbolTable();

        return { type: null, isAssignable: false, withReturnStatement: withReturnStatement };

    }

    processForLoopOverCollection(node: ForNodeOverCollecion): StackType {

        let lm = this.currentProgram.labelManager;

        this.pushNewSymbolTable(false, node.scopeFrom, node.scopeTo);

        // reserve position on stack for collection
        let stackPosForCollection = this.nextFreeRelativeStackPos++;

        // assign value of collection term to collection
        let ct = this.processNode(node.collection);
        if (ct == null) return;
        let collectionType = ct.type;

        this.pushStatements({
            type: TokenType.popAndStoreIntoVariable,
            position: node.collection.position,
            stackposOfVariable: stackPosForCollection,
            stepFinished: false
        })

        let collectionElementType: Type;

        let kind: "array" | "internalList" | "group" | "userDefinedIterable" = null;

        if (collectionType instanceof ArrayType) {
            collectionElementType = collectionType.arrayOfType;
            kind = "array";
        } else if (collectionType instanceof Klass && collectionType.getImplementedInterface("Iterable") != null) {

            let ct1: Klass = collectionType;

            // This is a bad hack to enable simplified for-loops with classes extending system collection classes
            if(collectionType.baseClass != null && collectionType.baseClass.getImplementedInterface("Iterable") != null && collectionType.baseClass.module.isSystemModule){
                ct1 = collectionType.baseClass;
            }

            if (ct1.module.isSystemModule) {
                kind = "internalList";
            } else {
                kind = "userDefinedIterable";
            }
            let iterableInterface = ct1.getImplementedInterface("Iterable");
            if (ct1.typeVariables.length == 0) {
                collectionElementType = objectType;
            } else {
                collectionElementType = ct1.typeVariables[0].type;
            }
        } else if (collectionType instanceof Klass && collectionType.identifier == "Group") {
            kind = "group";
            collectionElementType = this.moduleStore.getType("Shape").type;
        }
        else {
            this.pushError("Mit der vereinfachten for-Schleife (for identifier : collectionOrArray) kann man nur über Arrays oder Klassen, die das Interface Iterable implementieren, iterieren.", node.collection.position);
            return null;
        }

        let variableType = node.variableType.resolvedType;
        if (variableType == null) return null;

        let noCastingNeeded = variableType == varType;
        if (noCastingNeeded) {
            variableType = collectionElementType;
            node.variableType.resolvedType = collectionElementType
        } else {
            if (!collectionElementType.canCastTo(variableType)) {
                this.pushError("Der ElementTyp " + collectionElementType.identifier + " der Collection kann nicht in den Typ " + variableType.identifier + " der Iterationsvariable " + node.variableIdentifier + " konvertiert werden.", node.position);
                return null;
            }
        }

        this.localVariableDeclaration({
            type: TokenType.localVariableDeclaration,
            identifier: node.variableIdentifier,
            initialization: null,
            isFinal: false,
            position: node.variablePosition,
            variableType: node.variableType
        }, true)

        let variableStackPos = this.nextFreeRelativeStackPos - 1;
        let stackPosOfCounterVariableOrIterator = this.nextFreeRelativeStackPos++;

        if (kind == "array" || kind == "internalList" || kind == "group") {
            this.pushStatements([{
                type: TokenType.extendedForLoopInit,
                position: node.position,
                stepFinished: false,
                stackPosOfCollection: stackPosForCollection,
                stackPosOfElement: variableStackPos,
                typeOfElement: variableType,
                stackPosOfCounter: stackPosOfCounterVariableOrIterator
            }], true);
        } else {
            // get Iterator from collection
            this.pushStatements([
                {
                    type: TokenType.pushLocalVariableToStack,
                    position: node.position,
                    stackposOfVariable: stackPosOfCounterVariableOrIterator,
                    stepFinished: false
                },
                {
                    type: TokenType.pushLocalVariableToStack,
                    position: node.position,
                    stackposOfVariable: stackPosForCollection,
                    stepFinished: false
                },
                {
                    type: TokenType.callMethod,
                    position: node.position,
                    stepFinished: false,
                    isSuperCall: false,
                    method: collectionType.getMethod("iterator", new Parameterlist([])),
                    stackframeBegin: -1
                },
                {
                    type: TokenType.assignment,
                    position: node.position,
                    stepFinished: true,
                    leaveValueOnStack: false
                }], true);
        }

        let labelBeforeCondition = lm.markJumpDestination(1);
        let labelAfterForLoop: number;
        let lastStatementBeforeCasting: Statement;

        if (kind == "array" || kind == "internalList" || kind == "group") {
            let jumpNode: ExtendedForLoopCheckCounterAndGetElement = {
                type: TokenType.extendedForLoopCheckCounterAndGetElement,
                kind: kind,
                position: node.variablePosition,
                stepFinished: true,
                stackPosOfCollection: stackPosForCollection,
                stackPosOfElement: variableStackPos,
                stackPosOfCounter: stackPosOfCounterVariableOrIterator,
                destination: 0 // gets filled in later,
            };
            lastStatementBeforeCasting = jumpNode;
            labelAfterForLoop = lm.registerJumpNode(jumpNode);

            this.pushStatements(
                jumpNode
            );

        } else {
            // call collection.hasNext()
            this.pushStatements([
                {
                    type: TokenType.pushLocalVariableToStack,
                    position: node.variablePosition,
                    stackposOfVariable: stackPosForCollection,
                    stepFinished: false
                },
                {
                    type: TokenType.callMethod,
                    position: node.position,
                    stepFinished: false,
                    isSuperCall: false,
                    method: collectionType.getMethod("hasNext", new Parameterlist([])),
                    stackframeBegin: -1
                },
            ]);
            labelAfterForLoop = lm.insertJumpNode(TokenType.jumpIfFalse, null, this);
            // call collection.next() and assign to loop variable
            this.pushStatements([
                {
                    type: TokenType.pushLocalVariableToStack,
                    position: node.position,
                    stackposOfVariable: variableStackPos,
                    stepFinished: false
                },
                {
                    type: TokenType.pushLocalVariableToStack,
                    position: node.position,
                    stackposOfVariable: stackPosForCollection,
                    stepFinished: false
                },
                {
                    type: TokenType.callMethod,
                    position: node.position,
                    stepFinished: false,
                    isSuperCall: false,
                    method: collectionType.getMethod("next", new Parameterlist([])),
                    stackframeBegin: -1
                },
                {
                    type: TokenType.assignment,
                    position: node.position,
                    stepFinished: true,
                    leaveValueOnStack: false
                }]);
        }

        if (!noCastingNeeded) {
            let oldStatementCount = this.currentProgram.statements.length;
            this.pushStatements({
                type: TokenType.pushLocalVariableToStack,
                position: node.position,
                stackposOfVariable: variableStackPos,
                stepFinished: false
            });
            this.ensureAutomaticCasting(collectionElementType, variableType);
            if (this.currentProgram.statements.length < oldStatementCount + 2) {
                // casting needed no statement, so delete pushLocalVariabletoStack-Statement
                this.currentProgram.statements.pop();
            } else {
                this.pushStatements({
                    type: TokenType.popAndStoreIntoVariable,
                    stackposOfVariable: variableStackPos,
                    position: node.position,
                    stepFinished: true
                });
                lastStatementBeforeCasting.stepFinished = false;
            }
        }

        this.openBreakScope();
        this.openContinueScope();

        let statements = this.generateStatements(node.statements);
        let withReturnStatement = statements.withReturnStatement;

        let continueLabelIndex = lm.markJumpDestination(1);
        this.closeContinueScope(continueLabelIndex, lm);

        lm.insertJumpNode(TokenType.jumpAlways, statements.endPosition, this, labelBeforeCondition);

        lm.markJumpDestination(1, labelAfterForLoop);

        this.closeBreakScope(labelAfterForLoop, lm);

        this.popSymbolTable();

        return { type: null, isAssignable: false, withReturnStatement: withReturnStatement };

    }

    processWhile(node: WhileNode): StackType {

        let lm = this.currentProgram.labelManager;

        this.pushNewSymbolTable(false, node.scopeFrom, node.scopeTo);

        let conditionBeginLabel = lm.markJumpDestination(1);

        let conditionType = this.processNode(node.condition);

        if (conditionType != null && conditionType.type != booleanPrimitiveType) {
            this.checkIfAssignmentInstedOfEqual(node.condition);
            this.pushError("Der Wert des Terms in Klammern hinter 'while' muss den Datentyp boolean besitzen.", node.condition.position);
        }

        let position = node.position;

        if (node.condition != null) {
            position = node.condition.position;
        }

        let afterWhileStatementLabel = lm.insertJumpNode(TokenType.jumpIfFalse, position, this);

        this.openBreakScope();
        this.openContinueScope();

        let pc = this.currentProgram.statements.length;
        let statements = this.generateStatements(node.statements);
        let withReturnStatement = statements.withReturnStatement;

        if (this.currentProgram.statements.length == pc) {
            this.insertNoOp(node.scopeTo, false);
        }

        this.closeContinueScope(conditionBeginLabel, lm);
        lm.insertJumpNode(TokenType.jumpAlways, statements.endPosition, this, conditionBeginLabel);

        lm.markJumpDestination(1, afterWhileStatementLabel);

        this.closeBreakScope(afterWhileStatementLabel, lm);

        this.popSymbolTable();

        return { type: null, isAssignable: false, withReturnStatement: withReturnStatement };

    }

    insertNoOp(position: TextPosition, stepFinished: boolean) {
        this.pushStatements({
            type: TokenType.noOp,
            position: position,
            stepFinished: stepFinished
        })
    }

    processDo(node: DoWhileNode): StackType {

        let lm = this.currentProgram.labelManager;

        this.pushNewSymbolTable(false, node.scopeFrom, node.scopeTo);

        let statementsBeginLabel = lm.markJumpDestination(1);

        this.openBreakScope();
        this.openContinueScope();

        let pc = this.currentProgram.statements.length;
        let statements = this.generateStatements(node.statements);
        let withReturnStatement = statements.withReturnStatement;

        if (this.currentProgram.statements.length == pc) {
            this.insertNoOp(node.scopeTo, false);
        }

        let continueLabelIndex = lm.markJumpDestination(1);
        this.closeContinueScope(continueLabelIndex, lm);

        let conditionType = this.processNode(node.condition);

        if (conditionType != null && conditionType.type != booleanPrimitiveType) {
            this.checkIfAssignmentInstedOfEqual(node.condition);
            this.pushError("Der Wert des Terms in Klammern hinter 'while' muss den Datentyp boolean besitzen.", node.condition.position);
        }

        lm.insertJumpNode(TokenType.jumpIfTrue, statements.endPosition, this, statementsBeginLabel);

        let endLabel = lm.markJumpDestination(1);

        this.closeBreakScope(endLabel, lm);

        this.popSymbolTable();

        return { type: null, isAssignable: false, withReturnStatement: withReturnStatement };

    }

    newObject(node: NewObjectNode): StackType {

        if (node.classType == null || node.classType.resolvedType == null) return null;

        let resolvedType: Klass = <Klass>node.classType.resolvedType;
        if (!(resolvedType instanceof Klass)) {
            this.pushError(node.classType.identifier + " ist keine Klasse, daher kann davon mit 'new' kein Objekt erzeugt werden.", node.position);
            return null;
        }

        if (resolvedType.isAbstract) {
            this.pushError(`${node.classType.identifier} ist eine abstrakte Klasse, daher kann von ihr mit 'new' kein Objekt instanziert werden. Falls ${node.classType.identifier} nicht-abstrakte Kindklassen besitzt, könntest Du von DENEN mit new Objekte instanzieren...`, node.position);
            return null;
        }

        //this.pushTypePosition(node.rightBracketPosition, classType);

        if (resolvedType.module != this.module && resolvedType.visibility != Visibility.public) {
            this.pushError("Die Klasse " + resolvedType.identifier + " ist hier nicht sichtbar.", node.position);
        }

        let newStatement: NewObjectStatement = {
            type: TokenType.newObject,
            position: node.position,
            class: resolvedType,
            subsequentConstructorCall: false,
            stepFinished: true
        };

        this.pushStatements(newStatement);
        this.pushTypePosition(node.rightBracketPosition, resolvedType); // to enable code completion when typing a point after the closing bracket

        let parameterTypes: Type[] = [];
        // let parameterStatements: Statement[][] = [];
        let positionsAfterParameterStatements: number[] = []
        let allStatements = this.currentProgram.statements;

        if (node.constructorOperands?.length > 0) {
            // for (let p of node.constructorOperands) {
            for (let j = 0; j < node.constructorOperands.length; j++) {
                let p = node.constructorOperands[j];
                // let programPointer = allStatements.length;
                let typeNode = this.processNode(p);
                // parameterStatements.push(allStatements.splice(programPointer, allStatements.length - programPointer));
                positionsAfterParameterStatements.push(allStatements.length);
                if (typeNode == null) {
                    parameterTypes.push(voidPrimitiveType);
                } else {
                    parameterTypes.push(typeNode.type);
                }
            }
        }

        let upToVisibility = getVisibilityUpTo(resolvedType, this.currentSymbolTable.classContext);

        // let methods = resolvedType.getMethodsThatFitWithCasting(resolvedType.identifier,
        //     parameterTypes, true, upToVisibility);

        let methods = resolvedType.getConstructor(parameterTypes, Visibility.private);

        let m = methods.methodList.slice();
        methods.methodList = m.filter(m => m.visibility <= upToVisibility);

        if(methods.methodList.length == 0 && m.length > 0){
            let m1 = m[0];
            let visibility = Visibility[m1.visibility];
            methods.error = `Es gibt zwar einen Konstruktor mit passender Signatur, dieser ist aber ${visibility} und daher hier nicht sichtbar.`;
        }

        this.module.pushMethodCallPosition(node.position, node.commaPositions, resolvedType.getMethods(Visibility.public, resolvedType.identifier), node.rightBracketPosition);

        // if there's no parameterless constructor then return without error:
        if (parameterTypes.length > 0 || resolvedType.hasConstructor()) {

            if (methods.error != null) {
                this.pushError(methods.error, node.position);
                return { type: resolvedType, isAssignable: false }; // try to continue...
            }

            let method = methods.methodList[0];
            this.pushUsagePosition(node.position, method);

            let staticClassContext = null;
            let classContext = this.currentSymbolTable.classContext;
            if (classContext != null && classContext instanceof Klass) {
                staticClassContext = classContext.staticClass;
            }

            if (method.visibility == Visibility.private && resolvedType != classContext && resolvedType != staticClassContext) {
                let ok = (resolvedType == classContext || resolvedType != staticClassContext || (classContext instanceof StaticClass && resolvedType == classContext.Klass));
                if (!ok) {
                    this.pushError("Die Konstruktormethode ist private und daher hier nicht sichtbar.", node.position);
                }
            }

            let destType: Type = null;
            for (let i = 0; i < parameterTypes.length; i++) {
                if (i < method.getParameterCount()) {  // possible ellipsis!
                    destType = method.getParameterType(i);
                    if (i == method.getParameterCount() - 1 && method.hasEllipsis()) {
                        destType = (<ArrayType>destType).arrayOfType;
                    }
                }

                let srcType = parameterTypes[i];
                // for (let st of parameterStatements[i]) {
                //     this.currentProgram.statements.push(st);
                // }
                let programPosition = allStatements.length;
                if (!this.ensureAutomaticCasting(srcType, destType, node.constructorOperands[i].position, node.constructorOperands[i])) {
                    this.pushError("Der Wert vom Datentyp " + srcType.identifier + " kann nicht als Parameter (Datentyp " + destType.identifier + ") verwendet werden.", node.constructorOperands[i].position);
                }

                if (allStatements.length > programPosition) {
                    let castingStatements = allStatements.splice(programPosition, allStatements.length - programPosition);
                    allStatements.splice(positionsAfterParameterStatements[i], 0, ...castingStatements);
                    this.currentProgram.labelManager.correctPositionsAfterInsert(positionsAfterParameterStatements[i], castingStatements.length);
                }

            }

            let stackframeDelta = 0;
            if (method.hasEllipsis()) {
                let ellipsisParameterCount = parameterTypes.length - method.getParameterCount() + 1; // last parameter and subsequent ones
                stackframeDelta = - (ellipsisParameterCount - 1);
                this.pushStatements({
                    type: TokenType.makeEllipsisArray,
                    position: node.constructorOperands[method.getParameterCount() - 1].position,
                    parameterCount: ellipsisParameterCount,
                    stepFinished: false,
                    arrayType: method.getParameter(method.getParameterCount() - 1).type
                })
            }


            this.pushStatements({
                type: TokenType.callMethod,
                method: method,
                position: node.position,
                isSuperCall: false,
                stepFinished: resolvedType.getPostConstructorCallbacks() == null,
                stackframeBegin: -(parameterTypes.length + 1 + stackframeDelta) // this-object followed by parameters
            }, true);

            newStatement.subsequentConstructorCall = true;
            newStatement.stepFinished = false;

        }

        if (resolvedType.getPostConstructorCallbacks() != null) {
            this.pushStatements({
                type: TokenType.processPostConstructorCallbacks,
                position: node.position,
                stepFinished: true
            }, true);
        }

        return { type: resolvedType, isAssignable: false };

    }

    pushAttribute(node: SelectArributeNode): StackType {

        if (node.object == null || node.identifier == null) return null;

        let ot = this.processNode(node.object);
        if (ot == null) {
            this.pushError('Links vom Punkt steht kein Objekt.', node.position);
            return null;
        }

        if (!(ot.type instanceof Klass || ot.type instanceof StaticClass || ot.type instanceof ArrayType)) {
            if (ot.type == null) {
                this.pushError('Der Ausdruck links vom Punkt hat kein Attribut ' + node.identifier + ".", node.position);
            } else {
                this.pushError('Links vom Punkt steht ein Ausdruck vom Datentyp ' + ot.type.identifier + ". Dieser hat kein Attribut " + node.identifier + ".", node.position);
            }
            return null;
        }

        let objectType: Klass | StaticClass | ArrayType = ot.type;

        if (objectType instanceof Klass) {

            let visibilityUpTo = getVisibilityUpTo(objectType, this.currentSymbolTable.classContext);

            let attributeWithError = objectType.getAttribute(node.identifier, visibilityUpTo);

            let staticAttributeWithError: { attribute: Attribute, error: string, foundButInvisible: boolean, staticClass: StaticClass }
                = null;
            if (attributeWithError.attribute == null) {
                staticAttributeWithError = objectType.staticClass.getAttribute(node.identifier, visibilityUpTo);
            }

            if (attributeWithError.attribute == null && staticAttributeWithError.attribute == null) {
                if (attributeWithError.foundButInvisible || !staticAttributeWithError.foundButInvisible) {
                    this.pushError(attributeWithError.error, node.position);
                } else {
                    this.pushError(staticAttributeWithError.error, node.position);
                }
                return {
                    type: objectType,
                    isAssignable: false
                }
            } else {
                let attribute: Attribute;
                if (attributeWithError.attribute != null) {
                    this.pushStatements({
                        type: TokenType.pushAttribute,
                        position: node.position,
                        attributeIndex: attributeWithError.attribute.index,
                        attributeIdentifier: attributeWithError.attribute.identifier,
                        useThisObject: false
                    });
                    attribute = attributeWithError.attribute;
                } else {
                    this.pushStatements([{
                        type: TokenType.decreaseStackpointer,
                        position: node.position,
                        popCount: 1
                    }, {
                        type: TokenType.pushStaticAttribute,
                        position: node.position,
                        // klass: (<Klass>objectType).staticClass,
                        klass: staticAttributeWithError.staticClass,
                        attributeIndex: staticAttributeWithError.attribute.index,
                        attributeIdentifier: staticAttributeWithError.attribute.identifier
                    }]);
                    attribute = staticAttributeWithError.attribute;
                }

                this.pushUsagePosition(node.position, attribute);

                return {
                    type: attribute.type,
                    isAssignable: !attribute.isFinal
                }
            }

        } else if (objectType instanceof StaticClass) {
            // Static class
            if (objectType.Klass instanceof Enum) {
                this.removeLastStatement(); // remove push static enum class to stack

                let enumInfo = objectType.Klass.enumInfoList.find(ei => ei.identifier == node.identifier);

                if (enumInfo == null) {
                    this.pushError("Die enum-Klasse " + objectType.identifier + " hat keinen enum-Wert mit dem Bezeichner " + node.identifier, node.position);
                }

                this.pushStatements({
                    type: TokenType.pushEnumValue,
                    position: node.position,
                    enumClass: objectType.Klass,
                    valueIdentifier: node.identifier
                });

                return {
                    type: objectType.Klass,
                    isAssignable: false
                }

            } else {
                let upToVisibility = getVisibilityUpTo(objectType, this.currentSymbolTable.classContext);
                let staticAttributeWithError = objectType.getAttribute(node.identifier, upToVisibility);
                if (staticAttributeWithError.attribute != null) {
                    // if (staticAttributeWithError.attribute.updateValue != undefined) {
                    //     this.removeLastStatement();
                    //     this.pushStatements({
                    //         type: TokenType.pushStaticAttributeIntrinsic,
                    //         position: node.position,
                    //         attribute: staticAttributeWithError.attribute
                    //     });
                    // } else 
                    {
                        this.removeLastStatement();
                        this.pushStatements({
                            type: TokenType.pushStaticAttribute,
                            position: node.position,
                            attributeIndex: staticAttributeWithError.attribute.index,
                            attributeIdentifier: staticAttributeWithError.attribute.identifier,
                            klass: staticAttributeWithError.staticClass
                        });
                        this.pushUsagePosition(node.position, staticAttributeWithError.attribute);

                    }
                    return {
                        type: staticAttributeWithError.attribute.type,
                        isAssignable: !staticAttributeWithError.attribute.isFinal
                    }
                } else {
                    this.pushError(staticAttributeWithError.error, node.position);
                    return {
                        type: objectType,
                        isAssignable: false
                    }
                }
            }

        } else {

            if (node.identifier != "length") {
                this.pushError('Der Wert vom Datentyp ' + ot.type.identifier + " hat kein Attribut " + node.identifier, node.position);
                return null;
            }

            this.pushStatements({
                type: TokenType.pushArrayLength,
                position: node.position
            });

            let element: Attribute = new Attribute("length", intPrimitiveType, null, true, Visibility.public, true, "Länge des Arrays");

            this.module.addIdentifierPosition(node.position, element);

            return {
                type: intPrimitiveType,
                isAssignable: false
            }


        }

    }

    pushThisOrSuper(node: ThisNode | SuperNode, isSuper: boolean): StackType {

        let classContext = this.currentSymbolTable.classContext;

        if (isSuper && classContext != null) {
            classContext = classContext.baseClass;
        }

        let methodContext = this.currentSymbolTable.method;

        if (classContext == null || methodContext == null) {
            this.pushError("Das Objekt " + (isSuper ? "super" : "this") + " existiert nur innerhalb einer Methodendeklaration.", node.position);
            return null;
        } else {
            this.pushStatements({
                type: TokenType.pushLocalVariableToStack,
                position: node.position,
                stackposOfVariable: 0
            })

            this.pushTypePosition(node.position, classContext);
            return { type: classContext, isAssignable: false, isSuper: isSuper };
        }

    }

    superconstructorCall(node: SuperconstructorCallNode | ConstructorCallNode): StackType {

        let classContext = this.currentSymbolTable.classContext;

        let isSuperConstructorCall: boolean = node.type == TokenType.superConstructorCall;

        if (isSuperConstructorCall) {
            if (classContext?.baseClass == null || classContext.baseClass.identifier == "Object") {
                this.pushError("Die Klasse ist nur Kindklasse der Klasse Object, daher ist der Aufruf des Superkonstruktors nicht möglich.", node.position);
            }
        }

        let methodContext = this.currentSymbolTable.method;

        if (classContext == null || methodContext == null || !methodContext.isConstructor) {
            this.pushError("Ein Aufruf des Konstruktors oder des Superkonstructors ist nur innerhalb des Konstruktors einer Klasse möglich.", node.position);
            return null;
        }


        let superclassType: Klass | StaticClass;

        if (isSuperConstructorCall) {
            superclassType = <Klass>classContext.baseClass;
            if (superclassType instanceof StaticClass) {
                this.pushError("Statische Methoden haben keine super-Methodenaufrufe.", node.position);
                return { type: null, isAssignable: false };
            }
            if (superclassType == null) superclassType = <Klass>this.moduleStore.getType("Object").type;
        } else {
            superclassType = <Klass>classContext;
            if (superclassType instanceof StaticClass) {
                this.pushError("Statische Methoden haben keine this-Methodenaufrufe.", node.position);
                return { type: null, isAssignable: false };
            }
        }

        // Push this-object to stack:
        this.pushStatements({
            type: TokenType.pushLocalVariableToStack,
            position: node.position,
            stackposOfVariable: 0
        });

        let parameterTypes: Type[] = [];

        if (node.operands != null) {
            let errorInOperands: boolean = false;
            for (let p of node.operands) {
                let pt = this.processNode(p);
                if (pt != null) {
                    parameterTypes.push(pt.type);
                } else {
                    errorInOperands = true;
                }
            }
            if (errorInOperands) {
                return { type: stringPrimitiveType, isAssignable: false }; // try to continue...
            }
        }

        let methods = superclassType.getConstructor(parameterTypes, Visibility.protected);

        this.module.pushMethodCallPosition(node.position, node.commaPositions, superclassType.getMethods(Visibility.protected, superclassType.identifier),
            node.rightBracketPosition);

        if (methods.error != null) {
            this.pushError(methods.error, node.position);
            return { type: stringPrimitiveType, isAssignable: false }; // try to continue...
        }

        let method = methods.methodList[0];

        this.pushUsagePosition(node.position, method);

        let stackframeDelta = 0;
        if (method.hasEllipsis()) {
            let ellipsisParameterCount = parameterTypes.length - method.getParameterCount() + 1; // last parameter and subsequent ones
            stackframeDelta = - (ellipsisParameterCount - 1);
            this.pushStatements({
                type: TokenType.makeEllipsisArray,
                position: node.operands[method.getParameterCount() - 1].position,
                parameterCount: ellipsisParameterCount,
                stepFinished: false,
                arrayType: method.getParameter(method.getParameterCount() - 1).type
            })
        }

        this.pushStatements({
            type: TokenType.callMethod,
            method: method,
            isSuperCall: isSuperConstructorCall,
            position: node.position,
            stackframeBegin: -(parameterTypes.length + 1 + stackframeDelta) // this-object followed by parameters
        });
        // Pabst, 21.10.2020:
        // super method is constructor => returns nothing even if method.getReturnType() is class object
        // return { type: method.getReturnType(), isAssignable: false };
        return { type: null, isAssignable: false };

    }

    incrementDecrementBeforeOrAfter(node: IncrementDecrementNode): StackType {
        let type = this.processNode(node.operand);

        if (type == null) return;

        if (!type.isAssignable) {
            this.pushError("Die Operatoren ++ und -- können nur auf Variablen angewendet werden, nicht auf konstante Werte oder Rückgabewerte von Methoden.", node.position);
            return type;
        }

        if (!type.type.canCastTo(floatPrimitiveType)) {
            this.pushError("Die Operatoren ++ und -- können nur auf Zahlen angewendet werden, nicht auf Werte des Datentyps " + type.type.identifier, node.position);
            return type;
        }

        if(type.type == charPrimitiveType){
            this.pushStatements({
                type: node.type == TokenType.incrementDecrementBefore ? TokenType.incrementDecrementCharBefore : TokenType.incrementDecrementCharAfter,
                position: node.position,
                incrementDecrementBy: node.operator == TokenType.doubleMinus ? - 1 : 1
    
            });
        } else {
            this.pushStatements({
                type: node.type,
                position: node.position,
                incrementDecrementBy: node.operator == TokenType.doubleMinus ? - 1 : 1
    
            });
        }


        return type;

    }

    selectArrayElement(node: SelectArrayElementNode): StackType {

        let arrayType = this.processNode(node.object); // push array-object 
        let indexType = this.processNode(node.index); // push index

        if (arrayType == null || indexType == null) return;

        if (!(arrayType.type instanceof ArrayType)) {
            this.pushError("Der Typ der Variablen ist kein Array, daher ist [] nicht zulässig. ", node.object.position);
            return null;
        }

        this.module.addIdentifierPosition({
            line: node.position.line,
            column: node.position.column + node.position.length,
            length: 0  // Module.getTypeAtPosition needs length == 0 here to know that this type-position is not in static context for code completion
        }, arrayType.type.arrayOfType);

        if (!this.ensureAutomaticCasting(indexType.type, intPrimitiveType)) {
            this.pushError("Als Index eines Arrays wird ein ganzzahliger Wert erwartet. Gefunden wurde ein Wert vom Typ " + indexType.type.identifier + ".", node.index.position);
            return { type: (<ArrayType>arrayType.type).arrayOfType, isAssignable: arrayType.isAssignable };
        }


        this.pushStatements({
            type: TokenType.selectArrayElement,
            position: node.position
        })

        return { type: (<ArrayType>arrayType.type).arrayOfType, isAssignable: arrayType.isAssignable };

    }

    pushTypePosition(position: TextPosition, type: Type) {
        if (position == null) return;
        if (position.length > 0) {
            position = {
                line: position.line,
                column: position.column + position.length,
                length: 0
            }
        }
        this.module.addIdentifierPosition(position, type);
    }



    pushUsagePosition(position: TextPosition, element: Klass | Interface | Method | Attribute | Variable) {

        this.module.addIdentifierPosition(position, element);

        if (element instanceof PrimitiveType) {
            return;
        }

        let positionList: TextPosition[] = element.usagePositions.get(this.module);
        if (positionList == null) {
            positionList = [];
            element.usagePositions.set(this.module, positionList);
        }

        positionList.push(position);

    }

    resolveIdentifier(node: IdentifierNode): StackType {

        if (node.identifier == null) return null;

        let variable = this.findLocalVariable(node.identifier);
        if (variable != null) {
            this.pushStatements({
                type: TokenType.pushLocalVariableToStack,
                position: node.position,
                stackposOfVariable: variable.stackPos
            })

            this.pushUsagePosition(node.position, variable);
            node.variable = variable;

            return { type: variable.type, isAssignable: !variable.isFinal };
        }

        if (this.heap != null) {
            let variable = this.heap[node.identifier];
            if (variable != null) {
                this.pushStatements({
                    type: TokenType.pushFromHeapToStack,
                    position: node.position,
                    identifier: node.identifier
                })

                this.pushUsagePosition(node.position, variable);
                node.variable = variable;


                return { type: variable.type, isAssignable: !variable.isFinal };
            }

        }

        let attribute = this.findAttribute(node.identifier, node.position);
        if (attribute != null) {

            if (attribute.isStatic) {
                let cc = this.currentSymbolTable.classContext;
                let scc = (cc instanceof StaticClass) ? cc : cc.staticClass;

                while (scc != null && scc.attributes.indexOf(attribute) == -1) {
                    scc = scc.baseClass;
                }

                this.pushStatements({
                    type: TokenType.pushStaticAttribute,
                    position: node.position,
                    klass: scc,
                    attributeIndex: attribute.index,
                    attributeIdentifier: attribute.identifier
                });
            } else {
                this.pushStatements({
                    type: TokenType.pushAttribute,
                    position: node.position,
                    attributeIndex: attribute.index,
                    attributeIdentifier: attribute.identifier,
                    useThisObject: true
                });
                node.attribute = attribute;
            }


            this.pushUsagePosition(node.position, attribute);

            return { type: attribute.type, isAssignable: !attribute.isFinal || this.currentSymbolTable.method.isConstructor };
        }

        let klassModule = this.moduleStore.getType(node.identifier);
        if (klassModule != null) {
            let klass = klassModule.type;
            if (!(klass instanceof Klass || klass instanceof Interface)) {
                this.pushError("Der Typ " + klass.identifier + " hat keine statischen Attribute/Methoden.", node.position);
            } else {
                this.pushStatements({
                    type: TokenType.pushStaticClassObject,
                    position: node.position,
                    klass: klass
                });

                this.pushUsagePosition(node.position, klass);

                return {
                    type: klass instanceof Klass ? klass.staticClass : klass,
                    isAssignable: false
                }
            }

            return {
                type: klass,
                isAssignable: false
            }
        }

        this.pushError("Der Bezeichner " + node.identifier + " ist hier nicht bekannt.", node.position);

    }

    findLocalVariable(identifier: string): Variable {
        let st = this.currentSymbolTable;

        while (st != null) {

            let variable = st.variableMap.get(identifier);

            if (variable != null && variable.stackPos != null) {
                return variable;
            }

            st = st.parent;
        }

        return null;

    }

    findAttribute(identifier: string, position: TextPosition): Attribute {
        let classContext = this.currentSymbolTable.classContext;
        if (classContext == null) {
            return null;
        }

        let attribute = classContext.getAttribute(identifier, Visibility.private);
        if (attribute.attribute != null) return attribute.attribute;

        if (classContext instanceof Klass) {
            let staticAttribute = classContext.staticClass.getAttribute(identifier, Visibility.private);
            if (staticAttribute.attribute != null) return staticAttribute.attribute;
        }

        // this.pushError(attribute.error, position);

        return null;
    }

    callMethod(node: MethodcallNode): StackType {

        let objectNode: StackType = null;

        if (node.object == null) {

            // call method of this-class?

            let thisClass = this.currentSymbolTable.classContext;
            if (thisClass != null) {

                this.pushStatements({
                    type: TokenType.pushLocalVariableToStack,
                    position: node.position,
                    stackposOfVariable: 0
                });

                objectNode = {
                    type: thisClass,
                    isAssignable: false
                }

            } else {
                this.pushError("Ein Methodenaufruf (hier: " + node.identifier +
                    ") ohne Punktschreibweise ist nur innerhalb anderer Methoden möglich.", node.position);
                return null;
            }

        } else {
            objectNode = this.processNode(node.object);
        }

        if (objectNode == null) return null;

        if (!(
            (objectNode.type instanceof Klass) || (objectNode.type instanceof StaticClass) ||
            (objectNode.type instanceof Interface &&
                (node.object["object"] != null || node.object["variable"] != null || node.object["attribute"] != null || node.object["termInsideBrackets"] != null)) || (objectNode.type instanceof Enum))) {

            if (objectNode.type == null) {
                this.pushError("Werte dieses Datentyps besitzen keine Methoden.", node.position);
            } else {
                if (objectNode.type instanceof Interface) {
                    this.pushError('Methodendefinitionen eines Interfaces können nicht statisch aufgerufen werden.', node.position);
                } else {
                    this.pushError('Werte des Datentyps ' + objectNode.type.identifier + " besitzen keine Methoden.", node.position);
                }
            }

            return null;
        }

        let objectType: Klass | StaticClass | Interface = <any>objectNode.type;

        let posBeforeParameterEvaluation = this.currentProgram.statements.length;

        let parameterTypes: Type[] = [];
        // let parameterStatements: Statement[][] = [];
        let positionsAfterParameterStatements: number[] = []

        let allStatements = this.currentProgram.statements;
        if (node.operands != null) {
            // for (let p of node.operands) {
            for (let j = 0; j < node.operands.length; j++) {
                let p = node.operands[j];
                // let programPointer = allStatements.length;
                let typeNode = this.processNode(p);
                // parameterStatements.push(allStatements.splice(programPointer, allStatements.length - programPointer));
                positionsAfterParameterStatements.push(allStatements.length);
                if (typeNode == null) {
                    parameterTypes.push(voidPrimitiveType);
                } else {
                    parameterTypes.push(typeNode.type);
                }
            }
        }


        let methods: { error: string, methodList: Method[] };
        if (objectType instanceof Interface) {
            methods = objectType.getMethodsThatFitWithCasting(node.identifier,
                parameterTypes, false);
        } else {
            let upToVisibility = getVisibilityUpTo(objectType, this.currentSymbolTable.classContext);

            methods = objectType.getMethodsThatFitWithCasting(node.identifier,
                parameterTypes, false, upToVisibility);

        }

        this.module.pushMethodCallPosition(node.position, node.commaPositions, objectType.getMethods(Visibility.private, node.identifier), node.rightBracketPosition);

        if (methods.error != null) {
            this.pushError(methods.error, node.position);
            return { type: stringPrimitiveType, isAssignable: false }; // try to continue...
        }

        let method = methods.methodList[0];

        this.pushUsagePosition(node.position, method);

        // You CAN call a static method on a object..., so:
        if (method.isStatic && objectType instanceof Klass && objectType.identifier != "PrintStream") {
            this.pushError("Es ist kein guter Programmierstil, statische Methoden einer Klasse mithilfe eines Objekts aufzurufen. Besser wäre hier " + objectType.identifier + "." + method.identifier + "(...).", node.position, "info");
            this.insertStatements(posBeforeParameterEvaluation, [{
                type: TokenType.decreaseStackpointer,
                position: node.position,
                popCount: 1
            },
            {
                type: TokenType.pushStaticClassObject,
                position: node.position,
                klass: objectType
            }
            ]);
        }

        let destType: Type = null;
        for (let i = 0; i < parameterTypes.length; i++) {
            if (i < method.getParameterCount()) {  // possible ellipsis!
                destType = method.getParameterType(i);
                if (i == method.getParameterCount() - 1 && method.hasEllipsis()) {
                    destType = (<ArrayType>destType).arrayOfType;
                }
            }

            // Marker 1
            let srcType = parameterTypes[i];
            // for (let st of parameterStatements[i]) {
            //     this.currentProgram.statements.push(st);
            // }
            let programPosition = allStatements.length;

            if (!this.ensureAutomaticCasting(srcType, destType, node.operands[i].position, node.operands[i])) {
                this.pushError("Der Wert vom Datentyp " + srcType.identifier + " kann nicht als Parameter (Datentyp " + destType.identifier + ") verwendet werden.", node.operands[i].position);
            }

            if (allStatements.length > programPosition) {
                let castingStatements = allStatements.splice(programPosition, allStatements.length - programPosition);
                allStatements.splice(positionsAfterParameterStatements[i], 0, ...castingStatements);
                this.currentProgram.labelManager.correctPositionsAfterInsert(positionsAfterParameterStatements[i], castingStatements.length);
            }


            // if (srcType instanceof PrimitiveType && destType instanceof PrimitiveType) {
            //     if (srcType.getCastInformation(destType).needsStatement) {
            //         this.pushStatements({
            //             type: TokenType.castValue,
            //             position: null,
            //             newType: destType,
            //             stackPosRelative: -parameterTypes.length + 1 + i
            //         });
            //     }
            // }

        }

        let stackframeDelta = 0;
        if (method.hasEllipsis()) {
            let ellipsisParameterCount = parameterTypes.length - method.getParameterCount() + 1; // last parameter and subsequent ones
            stackframeDelta = - (ellipsisParameterCount - 1);
            this.pushStatements({
                type: TokenType.makeEllipsisArray,
                position: node.operands[method.getParameterCount() - 1].position,
                parameterCount: ellipsisParameterCount,
                stepFinished: false,
                arrayType: method.getParameter(method.getParameterCount() - 1).type
            })
        }

        if (method.visibility != Visibility.public) {

            let visible = true;
            let classContext = this.currentSymbolTable.classContext;
            if (classContext == null) {
                visible = false;
            } else {
                if (classContext != objectType &&
                    !(classContext instanceof Klass && classContext.implements.indexOf(<Interface>objectType) > 0)) {
                    if (method.visibility == Visibility.private) {
                        visible = false;
                    } else {
                        visible = classContext.hasAncestorOrIs(<Klass | StaticClass>objectType);
                    }
                }
            }
            if (!visible) {
                this.pushError("Die Methode " + method.identifier + " ist an dieser Stelle des Programms nicht sichtbar.", node.position);
            }
        }

        let isSystemMethod: boolean = false;
        if (method.isStatic && objectNode.type != null &&
            (objectNode.type instanceof StaticClass)) {
            let classIdentifier = objectNode.type.Klass.identifier;

            switch (classIdentifier) {
                case "Input":
                    this.pushStatements({
                        type: TokenType.callInputMethod,
                        method: method,
                        position: node.position,
                        stepFinished: true,
                        stackframeBegin: -(parameterTypes.length + 1 + stackframeDelta) // this-object followed by parameters
                    });
                    isSystemMethod = true;
                    break;
                case "SystemTools":
                case "Robot":
                    if (["pause", "warten"].indexOf(method.identifier) >= 0) {
                        this.pushStatements([{
                            type: TokenType.setPauseDuration,
                            position: node.position,
                            stepFinished: true
                        }, {
                            type: TokenType.pause,
                            position: node.position,
                            stepFinished: true
                        }
                        ]);
                        isSystemMethod = true;
                    }
                    break;
            }

        }

        if (!isSystemMethod) {
            this.pushStatements({
                type: TokenType.callMethod,
                method: method,
                position: node.position,
                isSuperCall: objectNode.isSuper == null ? false : objectNode.isSuper,
                stepFinished: true,
                stackframeBegin: -(parameterTypes.length + 1 + stackframeDelta) // this-object followed by parameters
            });
        }



        this.pushTypePosition(node.rightBracketPosition, method.getReturnType());

        return { type: method.getReturnType(), isAssignable: false };

    }

    pushConstant(node: ConstantNode): StackType {

        let type: Type;

        switch (node.constantType) {
            case TokenType.integerConstant:
                type = intPrimitiveType;
                break;
            
            case TokenType.longConstant:
                type = longPrimitiveType;
                break;
            case TokenType.shortConstant:
                type = shortPrimitiveType;
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

    processBinaryOp(node: BinaryOpNode): StackType {

        let isAssignment = CodeGenerator.assignmentOperators.indexOf(node.operator) >= 0;

        if (node.operator == TokenType.ternaryOperator) {
            return this.processTernaryOperator(node);
        }

        let leftType = this.processNode(node.firstOperand, isAssignment);

        let programPosAfterLeftOpoerand = this.currentProgram.statements.length;

        let lazyEvaluationDest = null;
        if (node.operator == TokenType.and) {
            lazyEvaluationDest = this.currentProgram.labelManager.insertJumpNode(TokenType.jumpIfFalseAndLeaveOnStack, node.firstOperand.position, this);
        } else if (node.operator == TokenType.or) {
            lazyEvaluationDest = this.currentProgram.labelManager.insertJumpNode(TokenType.jumpIfTrueAndLeaveOnStack, node.firstOperand.position, this);
        }

        let rightType = this.processNode(node.secondOperand);

        if (leftType == null || leftType.type == null || rightType == null || rightType.type == null) return null;

        if (isAssignment) {
            if (!this.ensureAutomaticCasting(rightType.type, leftType.type, node.position, node.firstOperand)) {
                this.pushError("Der Wert vom Datentyp " + rightType.type.identifier + " auf der rechten Seite kann der Variablen auf der linken Seite (Datentyp " + leftType.type.identifier + ") nicht zugewiesen werden.", node.position);
                return leftType;
            }

            if (!leftType.isAssignable) {
                this.pushError("Dem Term/der Variablen auf der linken Seite des Zuweisungsoperators (=) kann kein Wert zugewiesen werden.", node.position);
            }

            if(node.operator == TokenType.divisionAssignment && leftType.type == intPrimitiveType){
                node.operator = TokenType.divisionAssignmentInteger;
            }

            let statement: AssignmentStatement = {
                //@ts-ignore
                type: node.operator,
                position: node.position,
                stepFinished: true,
                leaveValueOnStack: true
            };

            this.pushStatements(statement);


            return leftType;

        } else {

            if (node.firstOperand.type == TokenType.identifier && node.firstOperand.variable != null) {
                let v = node.firstOperand.variable;
                if (v.initialized != null && !v.initialized) {
                    v.usedBeforeInitialization = true;
                    this.pushError("Die Variable " + v.identifier + " wird hier benutzt bevor sie initialisiert wurde.", node.position, "info");
                }
            }

            let resultType = leftType.type.getResultType(node.operator, rightType.type);
            if(leftType.type == charPrimitiveType && rightType.type == intPrimitiveType){
                this.ensureAutomaticCasting(leftType.type, rightType.type, node.position, node, -1);
            }
            if(leftType.type == intPrimitiveType && rightType.type == charPrimitiveType){
                this.ensureAutomaticCasting(rightType.type, leftType.type, node.position, node, 0);
            }

            let unboxableLeft = leftType.type["unboxableAs"];
            let unboxableRight = rightType.type["unboxableAs"];

            if (resultType == null && (unboxableLeft != null || unboxableRight != null)) {
                let leftTypes: Type[] = unboxableLeft == null ? [leftType.type] : unboxableLeft;
                let rightTypes: Type[] = unboxableRight == null ? [rightType.type] : unboxableRight;

                for (let lt of leftTypes) {
                    for (let rt of rightTypes) {
                        resultType = lt.getResultType(node.operator, rt);
                        if (resultType != null) {
                            leftType.type = lt;
                            rightType.type = rt;
                            break;
                        }
                    }
                    if (resultType != null) break;
                }
            }

            // Situation Object + String: insert toString()-Method
            if (resultType == null && node.operator == TokenType.plus) {
                if (leftType.type instanceof Klass && rightType.type == stringPrimitiveType) {
                    this.insertStatements(programPosAfterLeftOpoerand, this.getToStringStatement(leftType.type, node.firstOperand.position));
                    resultType = stringPrimitiveType;
                    leftType.type = stringPrimitiveType;
                } else if (rightType.type instanceof Klass && leftType.type == stringPrimitiveType) {
                    this.pushStatements(this.getToStringStatement(rightType.type, node.firstOperand.position));
                    resultType = stringPrimitiveType;
                }
            }


            if (node.operator in [TokenType.and, TokenType.or]) {
                this.checkIfAssignmentInstedOfEqual(node.firstOperand);
                this.checkIfAssignmentInstedOfEqual(node.secondOperand);
            }

            if (resultType == null) {
                let bitOperators = [TokenType.ampersand, TokenType.OR];
                let booleanOperators = ["&& (boolescher UND-Operator)", "|| (boolescher ODER-Operator)"];
                let betterOperators = ["& &", "||"];
                let opIndex = bitOperators.indexOf(node.operator);
                if (opIndex >= 0 && leftType.type == booleanPrimitiveType && rightType.type == booleanPrimitiveType) {
                    this.pushError("Die Operation " + TokenTypeReadable[node.operator] + " ist für die Operanden der Typen " + leftType.type.identifier + " und " + rightType.type.identifier + " nicht definiert. Du meintest wahrscheinlich den Operator " + booleanOperators[opIndex] + ".", node.position, "error",
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
                                ]
                            }

                        });
                } else {
                    this.pushError("Die Operation " + TokenTypeReadable[node.operator] + " ist für die Operanden der Typen " + leftType.type.identifier + " und " + rightType.type.identifier + " nicht definiert.", node.position);
                }
                return leftType;
            }


            this.pushStatements({
                type: TokenType.binaryOp,
                leftType: leftType.type,
                operator: node.operator,
                position: node.position
            });

            if (lazyEvaluationDest != null) {
                this.currentProgram.labelManager.markJumpDestination(1, lazyEvaluationDest);
            }

            return { type: resultType, isAssignable: false };
        }


    }

    processTernaryOperator(node: BinaryOpNode): StackType {

        let leftType = this.processNode(node.firstOperand);

        if (leftType == null) return;

        if (this.ensureAutomaticCasting(leftType.type, booleanPrimitiveType, null, node.firstOperand)) {

            let secondOperand = node.secondOperand;
            if (secondOperand != null) {
                if (secondOperand.type != TokenType.binaryOp || secondOperand.operator != TokenType.colon) {
                    this.pushError("Auf den Fragezeichenoperator müssen - mit Doppelpunkt getrennt - zwei Alternativterme folgen.", node.position);
                } else {
                    let lm = this.currentProgram.labelManager;
                    let variantFalseLabel = lm.insertJumpNode(TokenType.jumpIfFalse, node.position, this);
                    let firstType = this.processNode(secondOperand.firstOperand);

                    let endLabel = lm.insertJumpNode(TokenType.jumpAlways, secondOperand.firstOperand.position, this);
                    lm.markJumpDestination(1, variantFalseLabel);
                    let secondType = this.processNode(secondOperand.secondOperand);
                    lm.markJumpDestination(1, endLabel);

                    let type = firstType.type;
                    if (secondType != null && type != secondType.type && type.canCastTo(secondType.type)) {
                        type = secondType.type;
                    }

                    return {
                        type: type,
                        isAssignable: false
                    }
                }

            }

        }

    }

    processUnaryOp(node: UnaryOpNode): StackType {
        let leftType = this.processNode(node.operand);

        if (leftType == null || leftType.type == null) return;

        if (node.operator == TokenType.minus) {
            if (!leftType.type.canCastTo(floatPrimitiveType)) {
                this.pushError("Der Operator - ist für den Typ " + leftType.type.identifier + " nicht definiert.", node.position);
                return leftType;
            }

        }

        if (node.operator == TokenType.not) {
            if (!(leftType.type == booleanPrimitiveType)) {
                this.checkIfAssignmentInstedOfEqual(node.operand);
                this.pushError("Der Operator ! ist für den Typ " + leftType.type.identifier + " nicht definiert.", node.position);
                return leftType;
            }

        }

        this.pushStatements({
            type: TokenType.unaryOp,
            operator: node.operator,
            position: node.position
        });

        return leftType;
    }

}