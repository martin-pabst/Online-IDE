import { TokenType, TextPosition, Token } from "../lexer/Token.js";
import { Method, Type, Parameterlist, Attribute, Variable } from "../types/Types.js";
import { Visibility, Klass, Interface } from "../types/Class.js";
import { Enum } from "../types/Enum.js";


export type ASTNode = 
    ClassDeclarationNode | InterfaceDeclarationNode | EnumDeclarationNode | EnumValueNode |
    AttributeDeclarationNode | MethodDeclarationNode | ParameterNode |
    WhileNode | ForNode | ForNodeOverCollecion | DoWhileNode | IfNode | SwitchNode|
    TermNode | TypeNode | LocalVariableDeclarationNode | ReturnNode | PrintNode |
    BreakNode | ContinueNode | ScopeNode 
    
    // Generics:
    | TypeParameterNode;

    export type TermNode = BinaryOpNode | UnaryOpNode | MethodcallNode | 
    ConstantNode | IdentifierNode |
    SelectArrayElementNode | IncrementDecrementNode | SuperconstructorCallNode | ConstructorCallNode |
    ThisNode | SuperNode | SelectArributeNode | NewObjectNode | 
    ArrayInitializationNode | NewArrayNode | CastManuallyNode | BracketsNode;

export type PrintNode = {
    type: TokenType.keywordPrint | TokenType.keywordPrintln,
    position: TextPosition,
    commaPositions: TextPosition[],
    text: TermNode,
    color: TermNode,
    rightBracketPosition: TextPosition
}

export type BreakNode = {
    type: TokenType.keywordBreak,
    position: TextPosition
}

export type ContinueNode = {
    type: TokenType.keywordContinue,
    position: TextPosition
}

export type ScopeNode = {
    type: TokenType.scopeNode,
    position: TextPosition,
    positionTo: TextPosition,
    statements: ASTNode[]
}

export type ReturnNode = {
    type: TokenType.keywordReturn,
    position: TextPosition,
    term: TermNode
}

export type IfNode = {
    type: TokenType.keywordIf,
    position: TextPosition,

    condition: TermNode,
    statementsIfTrue: ASTNode[]
    statementsIfFalse: ASTNode[]

}

export type SwitchCaseNode = {
    type: TokenType.keywordCase,
    position: TextPosition,

    caseTerm: TermNode, // null if default-case
    statements: ASTNode[],

}

export type SwitchNode = {
    
    type: TokenType.keywordSwitch,
    position: TextPosition,

    scopeFrom: TextPosition,
    scopeTo: TextPosition,

    condition: TermNode,
    caseNodes: SwitchCaseNode[]

}


export type ForNode = {
    type: TokenType.keywordFor,
    position: TextPosition,

    scopeFrom: TextPosition,
    scopeTo: TextPosition,

    statementsBefore: ASTNode[],
    condition: TermNode,
    statementsAfter: ASTNode[]
    statements: ASTNode[]

}

export type ForNodeOverCollecion = {
    type: TokenType.forLoopOverCollection,
    position: TextPosition,

    scopeFrom: TextPosition,
    scopeTo: TextPosition,

    variableType: TypeNode,
    variableIdentifier: string,
    variablePosition: TextPosition,
    collection: TermNode,
    statements: ASTNode[]
}

export type DoWhileNode = {
    type: TokenType.keywordDo,
    position: TextPosition,

    scopeFrom: TextPosition,
    scopeTo: TextPosition,

    condition: TermNode,
    statements: ASTNode[]

}

export type WhileNode = {
    type: TokenType.keywordWhile,
    position: TextPosition,

    scopeFrom: TextPosition,
    scopeTo: TextPosition,

    condition: TermNode,
    statements: ASTNode[]

}

export type ParameterNode = {
    type: TokenType.parameterDeclaration,
    position: TextPosition,

    identifier: string,
    parameterType: TypeNode,
    isFinal: boolean,
    isEllipsis: boolean
}

export type InterfaceDeclarationNode = {
    type: TokenType.keywordInterface,
    position: TextPosition,

    identifier: string,
    methods: MethodDeclarationNode[],

    extends: TypeNode[],

    scopeFrom: TextPosition,
    scopeTo: TextPosition,

    typeParameters: TypeParameterNode[],

    resolvedType?: Interface,
    commentBefore?: Token

}

export type TypeParameterNode = {
    type: TokenType.typeParameter,
    position: TextPosition,
    identifier: string,
    extends: TypeNode,
    implements: TypeNode[],
    resolvedType?: Klass | Interface
}

export type ClassDeclarationNode = {
    type: TokenType.keywordClass,
    position: TextPosition,

    scopeFrom: TextPosition,
    scopeTo: TextPosition,

    visibility: Visibility,
    identifier: string,
    isAbstract: boolean,
    extends: TypeNode,
    implements: TypeNode[],

    
    attributes: AttributeDeclarationNode[],
    methods: MethodDeclarationNode[],

    typeParameters: TypeParameterNode[],

    resolvedType?: Klass,
    commentBefore?: Token

}

export type EnumValueNode = {
    type: TokenType.pushEnumValue,
    position: TextPosition,

    identifier: string,
    constructorParameters?: TermNode[],
    commaPositions?: TextPosition[],
    rightBracketPosition?: TextPosition
}

    export type EnumDeclarationNode = {
    type: TokenType.keywordEnum,
    position: TextPosition,

    scopeFrom: TextPosition,
    scopeTo: TextPosition,

    visibility: Visibility,
    identifier: string,

    attributes: AttributeDeclarationNode[],
    methods: MethodDeclarationNode[],

    values: EnumValueNode[],

    resolvedType?: Enum,
    commentBefore: Token

}

export type MethodDeclarationNode = {
    type: TokenType.methodDeclaration,
    position: TextPosition,

    scopeFrom: TextPosition,
    scopeTo: TextPosition,

    identifier: string,
    returnType: TypeNode,
    parameters: ParameterNode[],

    statements: ASTNode[],

    isStatic: boolean,
    isAbstract: boolean,
    visibility: Visibility,
    isConstructor: boolean,
    isTransient: boolean,

    resolvedType?: Method,
    annotation?: string,
    commentBefore: Token
}

export type AttributeDeclarationNode = {
    type: TokenType.attributeDeclaration,
    position: TextPosition,

    attributeType: TypeNode,
    identifier: string,
    initialization: TermNode,
    isStatic: boolean,
    isFinal: boolean,
    visibility: Visibility,
    isTransient: boolean,
    commentBefore: Token,

    resolvedType?: Attribute
    annotation?: string
}

/** Term nodes */

    export type NewObjectNode = {
        type: TokenType.newObject,
        position: TextPosition,
        rightBracketPosition: TextPosition,

        classType: TypeNode,
        constructorOperands: TermNode[],
        commaPositions: TextPosition[]
    }

    export type SelectArributeNode = {
        type: TokenType.pushAttribute,
        position: TextPosition,

        identifier: string,
        object: TermNode
    }

    export type SuperconstructorCallNode = {
        type: TokenType.superConstructorCall,
        position: TextPosition,
        rightBracketPosition: TextPosition,
    
        operands: TermNode[],
        commaPositions: TextPosition[]
    }
    
    export type ConstructorCallNode = {
        type: TokenType.constructorCall,
        position: TextPosition,
        rightBracketPosition: TextPosition,
    
        operands: TermNode[],
        commaPositions: TextPosition[]
    }
    
    export type ThisNode = {
        type: TokenType.keywordThis,
        position: TextPosition,
    }
    
    export type SuperNode = {
        type: TokenType.keywordSuper,
        position: TextPosition,
    }    

export type SelectArrayElementNode = {
    type: TokenType.selectArrayElement,
    position: TextPosition,

    index: TermNode,
    object: TermNode
}

export type IdentifierNode = {
    type: TokenType.identifier,
    position: TextPosition,

    identifier: string,
    variable?: Variable  // CodeGenerator stores found local variables in node to identify variable use before initialization
}

export type ConstantNode = {
    type: TokenType.pushConstant,
    position: TextPosition,

    constantType: TokenType,
    constant: any
}

export type MethodcallNode = {
    type: TokenType.callMethod,
    position: TextPosition,
    rightBracketPosition: TextPosition,

    identifier: string,
    object: TermNode,
    operands: TermNode[],
    commaPositions: TextPosition[]
}

export type IncrementDecrementNode = {
    type: TokenType.incrementDecrementBefore | TokenType.incrementDecrementAfter,
    position: TextPosition,
    operator: TokenType, // ++ or --
    operand: TermNode
}

export type UnaryOpNode = {
    type: TokenType.unaryOp,
    position: TextPosition,

    operator: TokenType,
    operand: TermNode
}

export type BinaryOpNode = {
    type: TokenType.binaryOp,
    position: TextPosition,

    operator: TokenType,
    firstOperand: TermNode,
    secondOperand: TermNode
}

// e.g. int[][]
export type TypeNode = {
    type: TokenType.type,
    position: TextPosition,

    identifier: string,

    arrayDimension: number, 
    genericParameterTypes?: TypeNode[], // null if not present
    genericParameterTypesResolved?: boolean, // undefined == false


    resolvedType?: Type
}

export type LocalVariableDeclarationNode = {
    type: TokenType.localVariableDeclaration,
    position: TextPosition,

    variableType: TypeNode,
    identifier: string,
    initialization: TermNode,
    isFinal: boolean
}

export type NewArrayNode = {
    type: TokenType.newArray,
    position: TextPosition,

    arrayType: TypeNode,
    elementCount: TermNode[], 
    initialization: ArrayInitializationNode
}

export type CastManuallyNode = {
    type: TokenType.castValue,
    position: TextPosition,

    castToType: TypeNode,
    whatToCast: TermNode
}

export type BracketsNode = {
    type: TokenType.rightBracket,
    position: TextPosition, // position after right Bracket
    termInsideBrackets: TermNode

}

export type ArrayInitializationNode = {
    type: TokenType.arrayInitialization,
    position: TextPosition,
    arrayType: TypeNode,

    dimension: number,
    nodes: TermNode[], 
}

