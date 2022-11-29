import { TextPosition, TokenType, Token } from "../lexer/Token.js";
import { Klass, StaticClass, Interface } from "../types/Class.js";
import { Method, Type, Variable, Attribute } from "../types/Types.js";
import { LabelManager } from "./LabelManager.js";
import { Module } from "./Module.js";
import { Enum } from "../types/Enum.js";
import { SymbolTable } from "./SymbolTable.js";

export type Breakpoint = {
    line: number,
    column: number,
    statement: Statement
}

export type Program = {
    module: Module,
    statements: Statement[],
    method?: Method, // used for stacktrace
    labelManager: LabelManager
}

export type Statement = PushValueStatement | PopAndStoreIntoLocalVariableStatement | AssignmentStatement | BinaryOpStatement |
    UnaryOpStatement | PushConstantStatement | DeclareLocalVariableStatement | PushAttributeStatement |
    PushArrayLengthStatement |
    PushStaticClassObjectStatement | PushStaticAttributeStatement | PushStaticAttributeIntrinsicStatement
    | CastValueStatement | CheckCastStatement | SelectArrayElementStatement | CallMethodStatement | CallMainMethodStatement | CallInputMethodStatement |
    MakeEllipsisArrayStatement | PopFromStackStatement | InitStackframeStatement |
    CloseStackframeStatement | ReturnStatement | NewObjectStatement |
    JumpIfFalseStatement | JumpIfTrueStatement | JumpAlwaysStatement | NoOpStatement | IncrementDecrementBeforeStatement |
    IncrementDecrementAfterStatement | ProgramEndStatement | BeginArrayStatement | AddToArrayStatement |
    PushEmptyArrayStatement | PrintStatement | PushEnumValueStatement | InitializeEnumValueStatement |
    JumpOnSwitchStatement | JumpIfTrueAndLeaveOnStackStatement | JumpIfFalseAndLeaveOnStackStatement |
    DeclareHeapVariableStatement | PushFromHeapToStackStatement | ProcessPostConstructorCallbacksStatement |
    ReturnIfDestroyedStatement | ExtendedForLoopCheckCounterAndGetElement | ExtendedForLoopInitStatement| 
    PauseElement;


export type PauseElement = {
    type: TokenType.pause | TokenType.setPauseDuration,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean
}

export type ExtendedForLoopCheckCounterAndGetElement = {
    type: TokenType.extendedForLoopCheckCounterAndGetElement,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    kind: "array" | "internalList" | "group",
    stackPosOfCollection: number,
    stackPosOfElement: number,
    stackPosOfCounter: number,
    destination: number // destination after for loop
}

export type ExtendedForLoopInitStatement = {
    type: TokenType.extendedForLoopInit,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    stackPosOfCollection: number,
    stackPosOfElement: number,
    typeOfElement: Type,
    stackPosOfCounter: number
}

// writes initial Value of local variable to given stackpos
export type DeclareHeapVariableStatement = {
    type: TokenType.heapVariableDeclaration,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    variable: Variable,
    pushOnTopOfStackForInitialization: boolean
}

// Push Value-object from heap to Stack
export type PushFromHeapToStackStatement = {
    type: TokenType.pushFromHeapToStack,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    identifier: string
}


// writes initial Value of local variable to given stackpos
export type DeclareLocalVariableStatement = {
    type: TokenType.localVariableDeclaration,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    variable: Variable,
    pushOnTopOfStackForInitialization: boolean
}

// Push Value-object of local variable (not: attribute) to Stack
export type PushValueStatement = {
    type: TokenType.pushLocalVariableToStack,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    stackposOfVariable: number
}

// Pop Value from stack and store into local variable
export type PopAndStoreIntoLocalVariableStatement = {
    type: TokenType.popAndStoreIntoVariable,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    stackposOfVariable: number
}

// Push Value-Object of attribute to Stack
// assumes this-object is on stackpos 0 in current stackframe
export type PushAttributeStatement = {
    type: TokenType.pushAttribute,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    attributeIdentifier: string,
    attributeIndex: number,
    useThisObject: boolean
}

export type PushArrayLengthStatement = {
    type: TokenType.pushArrayLength,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean
}

// writes value on top of stack into value-object one position below
// and takes both objects (or only one) from stack.
export type AssignmentStatement = {
    type: TokenType.assignment | TokenType.plusAssignment | TokenType.minusAssignment | 
     TokenType.multiplicationAssignment | TokenType.divisionAssignment | TokenType.divisionAssignmentInteger | TokenType.moduloAssignment |
     TokenType.ANDAssigment | TokenType.ORAssigment | TokenType.XORAssigment | TokenType.shiftLeftAssigment |
     TokenType.shiftRightAssigment | TokenType.shiftRightUnsignedAssigment,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    leaveValueOnStack: boolean,
}

export type BinaryOpStatement = {
    type: TokenType.binaryOp,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    leftType: Type,
    operator: TokenType
}

export type UnaryOpStatement = {
    type: TokenType.unaryOp,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    operator: TokenType
}

export type PushConstantStatement = {
    type: TokenType.pushConstant,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    value: any,
    dataType: Type
}

export type PushStaticClassObjectStatement = {
    type: TokenType.pushStaticClassObject,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    klass: Klass | Interface
}

export type PushStaticAttributeStatement = {
    type: TokenType.pushStaticAttribute,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    klass: StaticClass,
    attributeIndex: number,
    attributeIdentifier: string
}

export type PushStaticAttributeIntrinsicStatement = {
    type: TokenType.pushStaticAttributeIntrinsic,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    attribute: Attribute
}

export type CastValueStatement = {
    type: TokenType.castValue,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    newType: Type,
    stackPosRelative?: number
}

export type CheckCastStatement = {
    type: TokenType.checkCast,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    newType: Type,
}

export type SelectArrayElementStatement = {
    type: TokenType.selectArrayElement,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean
}

export type CallMethodStatement = {
    type: TokenType.callMethod,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    isSuperCall: boolean,
    method: Method,
    stackframeBegin: number
}

export type CallMainMethodStatement = {
    type: TokenType.callMainMethod,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    method: Method,
    staticClass: StaticClass    
}

export type CallInputMethodStatement = {
    type: TokenType.callInputMethod,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    method: Method,
    stackframeBegin: number
}

export type MakeEllipsisArrayStatement = {
    type: TokenType.makeEllipsisArray,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    parameterCount: number,
    arrayType: Type
}

export type PopFromStackStatement = {
    type: TokenType.decreaseStackpointer,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    popCount: number
}

export type InitStackframeStatement = {
    type: TokenType.initStackframe,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    reserveForLocalVariables: number
}

export type CloseStackframeStatement = {
    type: TokenType.closeStackframe,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean
}

export type ReturnStatement = {
    type: TokenType.return,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    copyReturnValueToStackframePos0: boolean,
    leaveThisObjectOnStack: boolean,
    methodWasInjected?: boolean
}

// instanciates new object and pushes it 2x (!!) to stack. 
// one for constructor and one as value of (new ...)
export type NewObjectStatement = {
    type: TokenType.newObject,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    class: Klass,
    subsequentConstructorCall: boolean // push new object 2 times to stack if true
}

export type ProcessPostConstructorCallbacksStatement = {
    type: TokenType.processPostConstructorCallbacks,
    position: TextPosition,
    breakpoint?: Breakpoint,
    stepFinished?: boolean
}

export type IncrementDecrementBeforeStatement = {
    type: TokenType.incrementDecrementBefore,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    incrementDecrementBy: number
}

export type IncrementDecrementAfterStatement = {
    type: TokenType.incrementDecrementAfter,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    incrementDecrementBy: number
}

export type JumpNode = JumpIfFalseStatement | JumpAlwaysStatement | JumpIfTrueStatement |
    JumpIfTrueAndLeaveOnStackStatement | JumpIfFalseAndLeaveOnStackStatement | ExtendedForLoopCheckCounterAndGetElement;

export type SwitchDestinationLabel = {

    constant: string | number,
    label: number

}

export type JumpOnSwitchStatement = {
    type: TokenType.keywordSwitch,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    switchType: "string" | "number",
    destinationLabels: SwitchDestinationLabel[], // used at compile time
    destinationMap: { [value: string]: number } | { [value: number]: number }, // used at runtime

    defaultDestination: number
}

export type JumpIfFalseStatement = {
    type: TokenType.jumpIfFalse,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    destination?: number
}

export type JumpIfTrueStatement = {
    type: TokenType.jumpIfTrue,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    destination?: number
}

export type JumpIfTrueAndLeaveOnStackStatement = {
    type: TokenType.jumpIfTrueAndLeaveOnStack,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    destination?: number
}

export type JumpIfFalseAndLeaveOnStackStatement = {
    type: TokenType.jumpIfFalseAndLeaveOnStack,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    destination?: number
}


export type JumpAlwaysStatement = {
    type: TokenType.jumpAlways,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    destination?: number
}

export type NoOpStatement = {
    type: TokenType.noOp,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean
}

export type ProgramEndStatement = {
    type: TokenType.programEnd,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: true,
    pauseAfterProgramEnd?: boolean
}

export type BeginArrayStatement = {
    type: TokenType.beginArray,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    arrayType: Type
}

export type AddToArrayStatement = {
    type: TokenType.addToArray,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    numberOfElementsToAdd: number
}

export type PushEmptyArrayStatement = {
    type: TokenType.pushEmptyArray,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    dimension: number, // numbers of elements are already on top of stack
    arrayType: Type
}

export type PrintStatement = {
    type: TokenType.print | TokenType.println,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    empty: boolean, // no parameter
    withColor: boolean
}

// pushes enum value to stack
export type PushEnumValueStatement = {
    type: TokenType.pushEnumValue,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    enumClass: Enum
    valueIdentifier: string
}

export type InitializeEnumValueStatement = {
    type: TokenType.initializeEnumValue,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean,
    enumClass: Enum
    valueIdentifier: string
}

export type ReturnIfDestroyedStatement = {
    type: TokenType.returnIfDestroyed,
    position: TextPosition,
    breakpoint?: Breakpoint
    stepFinished?: boolean
}