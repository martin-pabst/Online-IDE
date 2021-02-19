export enum TokenType {
    identifier,
    // constants
    integerConstant,
    floatingPointConstant,
    booleanConstant,
    stringConstant,
    charConstant,
    true,
    false,
    // keywords
    keywordPrint,
    keywordPrintln,
    keywordClass,
    keywordThis,
    keywordSuper,
    keywordNew,
    keywordInterface,
    keywordEnum,
    keywordVoid,
    keywordAbstract,
    keywordPublic,
    keywordProtected,
    keywordPrivate,
    keywordTransient,
    keywordStatic,
    keywordExtends,
    keywordImplements,
    keywordWhile,
    keywordDo,
    keywordFor,
    keywordSwitch,
    keywordCase,
    keywordDefault,
    keywordIf,
    keywordThen,
    keywordElse,
    keywordReturn,
    keywordBreak,
    keywordContinue,
    keywordNull,
    keywordFinal,
    keywordInstanceof,
    // keywordInt,
    // keywordBoolean,
    // keywordString,
    // keywordFloat,
    // keywordChar,

    // brackets
    leftBracket, // ()
    rightBracket,
    leftSquareBracket, // []
    rightSquareBracket,
    leftCurlyBracket, // {}
    rightCurlyBracket,
    leftRightSquareBracket, // []
    
    // operators
    doubleMinus, doublePlus,

    // binary operators
    dot, //.
    modulo,
    minus, plus, multiplication, division,
    singleQuote, doubleQuote, // ', "
    lower, greater, lowerOrEqual, greaterOrEqual, 
    equal, // ==
    notEqual, // !=
    assignment, // =
    plusAssignment, // +=
    minusAssignment, // -=
    multiplicationAssignment, // *=
    divisionAssignment, // /=
    moduloAssignment, // /%=
    and, or,   // &&, ||, !
    ampersand, // &
    ternaryOperator,
    colon, //:
    ellipsis, // ...

    not,
    
    // semicolon
    semicolon, // ;

    // comma
    comma, // ,

    // backslash
    backslash,

    // @
    at,

    // whitespace
    space,

    tab,

    // newline
    newline,

    // line feed
    linefeed,

    // only lexer-internal
    identifierChar,  // none of the special chars above a..zA..Z_Äö...

    // Comment
    comment,

    // used by parser
    negation, 
    referenceElement, // for arrays

    endofSourcecode, // will be generated after sourcecode end
    
    // Program statement types:
    binaryOp, // +, -, *, <=, ...
    unaryOp, // ! and - 
    localVariableDeclaration,
    heapVariableDeclaration,
    pushLocalVariableToStack, // push value of a local variable to stack
    popAndStoreIntoVariable,
    pushFromHeapToStack, // push value from heap to stack
    pushAttribute, // value of a attribute to stack
    pushArrayLength, 
    pushConstant, // literal
    pushStaticClassObject, // push class-Object to stack (which holds static attributes)
    pushStaticAttribute, // push static attribute to stack
    pushStaticAttributeIntrinsic, // push static attribute to stack
    checkCast, // check if object may get casted to class or interface
    castValue, // cast value on top of stack to other type
    selectArrayElement, // select Element from Array (e.g. a[20])
    callMethod,
    callMainMethod,
    processPostConstructorCallbacks, 
    callInputMethod, // Methods of Input class
    makeEllipsisArray,
    decreaseStackpointer, // decrease stack-pointer, nothing else
    initStackframe,
    closeStackframe,
    increaseSpaceForLocalVariables,
    return,
    newObject,
    jumpIfFalse,
    jumpIfTrue,
    jumpIfFalseAndLeaveOnStack,
    jumpIfTrueAndLeaveOnStack,
    jumpAlways,
    noOp, // acts as jump destination
    incrementDecrementBefore, // ++i, --i
    incrementDecrementAfter, // i++, i--
    programEnd,
    beginArray, // push empty array to stack
    addToArray, // pop element form stack and add it to array (on second stack position)
    pushEmptyArray, // push multidimensional empty array to stack
    forLoopOverCollection,

    // additional AST node types
    type, // e.g. int[][]
    typeParameter, // e.g. <E extends String implements Comparable<E>>
    attributeDeclaration,
    methodDeclaration,
    parameterDeclaration,
    superConstructorCall,
    newArray,
    arrayInitialization,
    print,
    println, 
    pushEnumValue,
    initializeEnumValue, 
    scopeNode,
    returnIfDestroyed,
    extendedForLoopInit,
    extendedForLoopCheckCounterAndGetElement,
}

export var TokenTypeReadable: {[tt: number]: string} = {
    [TokenType.identifier]: "ein Bezeichner",
    // constants
    [TokenType.integerConstant]: "eine Integer-Konstante",
    [TokenType.floatingPointConstant]: "eine Fließkomma-Konstante",
    [TokenType.booleanConstant]: "eine boolesche Konstante",
    [TokenType.stringConstant]: "eine Zeichenketten-Konstante",
    [TokenType.charConstant]: "eine char-Konstante",
    [TokenType.true]: "true",
    [TokenType.false]: "false",
    // keywords
    [TokenType.keywordClass]: "class",
    [TokenType.keywordThis]: "this",
    [TokenType.keywordSuper]: "super",
    [TokenType.keywordNew]: "new",
    [TokenType.keywordInterface]: "interface",
    [TokenType.keywordEnum]: "enum",
    [TokenType.keywordVoid]: "void",
    [TokenType.keywordAbstract]: "abstract",
    [TokenType.keywordPublic]: "public",
    [TokenType.keywordProtected]: "protected",
    [TokenType.keywordPrivate]: "private",
    [TokenType.keywordTransient]: "transient",
    [TokenType.keywordStatic]: "static",
    [TokenType.keywordExtends]: "extends",
    [TokenType.keywordImplements]: "implements",
    [TokenType.keywordWhile]: "while",
    [TokenType.keywordDo]: "do",
    [TokenType.keywordFor]: "for",
    [TokenType.keywordSwitch]: "switch",
    [TokenType.keywordCase]: "case",
    [TokenType.keywordDefault]: "default",
    [TokenType.keywordIf]: "if",
    [TokenType.keywordThen]: "then",
    [TokenType.keywordElse]: "else",
    [TokenType.keywordReturn]: "return",
    [TokenType.keywordBreak]: "break",
    [TokenType.keywordContinue]: "continue",
    [TokenType.keywordNull]: "null",
    [TokenType.keywordFinal]: "final",
    [TokenType.keywordInstanceof]: "instanceof",
    [TokenType.keywordPrint]: "print",
    [TokenType.keywordPrintln]: "println",
    // keywordInt,
    // keywordBoolean,
    // keywordString,
    // keywordFloat,
    // keywordChar,

    // brackets
    [TokenType.leftBracket]: "(", // ()
    [TokenType.rightBracket]: ")",
    [TokenType.leftSquareBracket]: "[", // []
    [TokenType.rightSquareBracket]: "]",
    [TokenType.leftCurlyBracket]: "{", // {}
    [TokenType.rightCurlyBracket]: "}",
    [TokenType.leftRightSquareBracket]: "[]", 
    
    // operators
    [TokenType.dot]: ".", //.
    [TokenType.minus]: "-", 
    [TokenType.modulo]: "%", 
    [TokenType.plus]: "+", 
    [TokenType.multiplication]: "*", 
    [TokenType.division]: "/",
    [TokenType.singleQuote]: "'", 
    [TokenType.doubleQuote]: "\"", // ']: "", "
    [TokenType.doubleMinus]: "--", 
    [TokenType.doublePlus]: "++",
    [TokenType.lower]: "<", 
    [TokenType.greater]: ">", 
    [TokenType.lowerOrEqual]: "<=", 
    [TokenType.greaterOrEqual]: ">=", 
    [TokenType.equal]: "==", // ==
    [TokenType.notEqual]: "!=", // !=
    [TokenType.assignment]: "=", // =
    [TokenType.plusAssignment]: "+=", // +=
    [TokenType.minusAssignment]: "-=", // -=
    [TokenType.multiplicationAssignment]: "*=", // *=
    [TokenType.divisionAssignment]: "/=", // /=
    [TokenType.moduloAssignment]: "%=",
    [TokenType.ampersand]: "&", 
    [TokenType.and]: "&&", 
    [TokenType.or]: "||", 
    [TokenType.not]: "!", 
    [TokenType.ternaryOperator]: "?", 
    
    // semicolon
    [TokenType.semicolon]: ";", // ;

    [TokenType.colon]: ":", // ;
    [TokenType.ellipsis]: "...", // ;

    // comma
    [TokenType.comma]: ",", 

    // backslash
    [TokenType.backslash]: "\\",

    // at
    [TokenType.at]: "@",

    // whitespace
    [TokenType.space]: "ein Leerzeichen",
    [TokenType.tab]: "ein Tabulatorzeichen",

    // newline
    [TokenType.newline]: "ein Zeilenumbruch",

    // only lexer-internal
    [TokenType.identifierChar]: "eines der Zeichen a..z, A..Z, _",  // none of the special chars above a..zA..Z_Äö...

    // Comment
    [TokenType.comment]: "ein Kommentar",

    [TokenType.endofSourcecode]: "das Ende des Programmes"

}

export var specialCharList: {[keyword: string]:TokenType} = {
    '(': TokenType.leftBracket, // ()
    ')': TokenType.rightBracket,
    '[': TokenType.leftSquareBracket, // []
    ']': TokenType.rightSquareBracket,
    '{': TokenType.leftCurlyBracket, // {}
    '}': TokenType.rightCurlyBracket,
    
    // operators
    '.': TokenType.dot, //.
    ',': TokenType.comma, //.
    '-': TokenType.minus,
    '%': TokenType.modulo,
    '+': TokenType.plus, 
    '*': TokenType.multiplication, 
    '/': TokenType.division,
    '\\': TokenType.backslash,
    '@': TokenType.at,
    '\'': TokenType.singleQuote, 
    '"': TokenType.doubleQuote, // ', "
    "<": TokenType.lower,
    ">": TokenType.greater,
    "=": TokenType.assignment,
    "&": TokenType.and,
    "|": TokenType.or,
    "!": TokenType.not,
    "?": TokenType.ternaryOperator,
    
    ';': TokenType.semicolon, // ;
    ':': TokenType.colon, // ;

    '...': TokenType.ellipsis,

    // whitespace
    ' ': TokenType.space,
    '\t': TokenType.tab,

    // newline
    '\n': TokenType.newline,
    '\r': TokenType.linefeed
}

export var keywordList: {[keyword: string]:TokenType} = {
    "class": TokenType.keywordClass,
    "this": TokenType.keywordThis,
    "super": TokenType.keywordSuper,
    "new": TokenType.keywordNew,
    "interface": TokenType.keywordInterface,
    "enum": TokenType.keywordEnum,
    "void": TokenType.keywordVoid,
    "abstract": TokenType.keywordAbstract,
    "public": TokenType.keywordPublic,
    "protected": TokenType.keywordProtected,
    "private": TokenType.keywordPrivate,
    "transient": TokenType.keywordTransient,
    "static": TokenType.keywordStatic,
    "extends": TokenType.keywordExtends,
    "implements": TokenType.keywordImplements,
    "while": TokenType.keywordWhile,
    "do": TokenType.keywordDo,
    "for": TokenType.keywordFor,
    "switch": TokenType.keywordSwitch,
    "case": TokenType.keywordCase,
    "default": TokenType.keywordDefault,
    "if": TokenType.keywordIf,
    "then": TokenType.keywordThen,
    "else": TokenType.keywordElse,
    "return": TokenType.keywordReturn,
    "break": TokenType.keywordBreak,
    "continue": TokenType.keywordContinue,
    "null": TokenType.keywordNull,
    "final": TokenType.keywordFinal,
    "instanceof": TokenType.keywordInstanceof,
    "true": TokenType.true,
    "false": TokenType.false,
    "print": TokenType.keywordPrint,
    "println": TokenType.keywordPrintln,
    // "int": TokenType.keywordInt,
    // "boolean": TokenType.keywordBoolean,
    // "String": TokenType.keywordString,
    // "float": TokenType.keywordFloat,
    // "char": TokenType.keywordChar
};

export var EscapeSequenceList: {[keyword: string]:string} = {
    "n": "\n",
    "r": "\r",
    "t": "\t",
    "\"": "\"",
    "'": "'",
    "\\": "\\"
}

export type TextPosition = {
    line: number,
    column: number, 
    length: number
}

export type TextPositionWithoutLength = {
    line: number,
    column: number
}

export type Token = {
    tt: TokenType,
    value: string|number|boolean,
    position: TextPosition,
    commentBefore?: Token
}

export type TokenList = Token[];

function tokenToString(t: Token){
    return "<div><span style='font-weight: bold'>" + TokenType[t.tt] + "</span>" +
            "<span style='color: blue'> &nbsp;'" + t.value + "'</span> (l&nbsp;" + t.position.line + ", c&nbsp;" + t.position.column + ")</div>";
}
 
export function tokenListToString(tl: TokenList):string{
    let s = "";
    for(let t of tl){
        s += tokenToString(t) + "\n";
    }
    return s;
}