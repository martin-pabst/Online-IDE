import { TokenType, TokenTypeReadable } from "../lexer/Token.js";
import { ArrayType } from "./Array.js";
import { Interface, Klass, setBooleanPrimitiveTypeCopy } from "./Class.js";
import { ObjectClass } from "./ObjectClass.js";
import { Method, Parameterlist, PrimitiveType, Type, Value } from "./Types.js";
import { IntegerClass } from "./boxedTypes/IntegerClass.js";
import { LongClass } from "./boxedTypes/LongClass.js";
import { FloatClass } from "./boxedTypes/FloatClass.js";
import { CharacterClass } from "./boxedTypes/CharacterClass.js";
import { BooleanClass } from "./boxedTypes/BooleanClass.js";
import { DoubleClass } from "./boxedTypes/DoubleClass.js";
import { floatToString, nullToString } from "../../tools/StringTools.js";

export class NullType extends Type {

    constructor() {
        super();
        this.identifier = "null";
    }

    getResultType(operation: TokenType, secondOperandType: Type) {
        if (operation == TokenType.equal || operation == TokenType.notEqual) return secondOperandType.getResultType(operation,this);
    }
    compute(operation: TokenType, firstOperand: Value, secondOperand: Value) {
        if (operation == TokenType.equal || operation == TokenType.notEqual) {
            return (firstOperand.value == secondOperand.value) == (operation == TokenType.equal);
        }
        return null;
    }
    canCastTo(type: Type) {
        return (type instanceof Klass || type instanceof Interface || type instanceof ArrayType);
    }
    castTo(value: Value, type: Type) {
        return {
            value: value.value,
            type: type
        };
    }
    equals(type: Type) {
        return (type instanceof Klass || type instanceof Interface);
    }

    public debugOutput(value: Value): string {
        return "null";
    }
}

export class VarType extends Type {

    constructor() {
        super();
        this.identifier = "var";
    }

    getResultType(operation: TokenType, secondOperandType: Type) {
        return null;
    }
    compute(operation: TokenType, firstOperand: Value, secondOperand: Value) {
        return null;
    }
    canCastTo(type: Type) {
        return (type instanceof Klass || type instanceof Interface);
    }
    castTo(value: Value, type: Type) {
        return value;
    }
    equals(type: Type) {
        return (type instanceof Klass || type instanceof Interface);
    }

    public debugOutput(value: Value): string {
        return "var";
    }
}

export class IntPrimitiveType extends PrimitiveType {

    init() {
        this.initialValue = 0;

        this.identifier = "int";

        this.description = "ganze Zahl"

        this.operationTable = {
            [TokenType.plus]: { "long": longPrimitiveType, "Long": longPrimitiveType, "int": intPrimitiveType, "Integer": intPrimitiveType, "float": floatPrimitiveType, "Float": floatPrimitiveType, "double": doublePrimitiveType, "Double": doublePrimitiveType },
            [TokenType.minus]: { "none": intPrimitiveType, "long": longPrimitiveType, "Long": longPrimitiveType, "int": intPrimitiveType, "Integer": intPrimitiveType, "float": floatPrimitiveType, "Float": floatPrimitiveType, "double": doublePrimitiveType, "Double": doublePrimitiveType },
            [TokenType.multiplication]: { "long": longPrimitiveType, "Long": longPrimitiveType, "int": intPrimitiveType, "Integer": intPrimitiveType, "float": floatPrimitiveType, "Float": floatPrimitiveType, "double": doublePrimitiveType, "Double": doublePrimitiveType },
            [TokenType.modulo]: { "long": longPrimitiveType, "Long": longPrimitiveType, "int": intPrimitiveType, "Integer": intPrimitiveType },
            [TokenType.division]: { "long": longPrimitiveType, "Long": longPrimitiveType, "int": intPrimitiveType, "Integer": intPrimitiveType, "float": floatPrimitiveType, "Float": floatPrimitiveType, "double": doublePrimitiveType, "Double": doublePrimitiveType },
            [TokenType.doublePlus]: { "none": intPrimitiveType },
            [TokenType.doubleMinus]: { "none": intPrimitiveType },
            [TokenType.negation]: { "none": intPrimitiveType },
            [TokenType.tilde]: { "none": intPrimitiveType },
            [TokenType.lower]: { "long": booleanPrimitiveType, "int": booleanPrimitiveType, "float": booleanPrimitiveType, "double": booleanPrimitiveType, "Integer": booleanPrimitiveType, "Float": booleanPrimitiveType, "Double": booleanPrimitiveType },
            [TokenType.greater]: { "long": booleanPrimitiveType, "int": booleanPrimitiveType, "float": booleanPrimitiveType, "double": booleanPrimitiveType, "Integer": booleanPrimitiveType, "Float": booleanPrimitiveType, "Double": booleanPrimitiveType },
            [TokenType.lowerOrEqual]: { "long": booleanPrimitiveType, "int": booleanPrimitiveType, "float": booleanPrimitiveType, "double": booleanPrimitiveType, "Integer": booleanPrimitiveType, "Float": booleanPrimitiveType, "Double": booleanPrimitiveType },
            [TokenType.greaterOrEqual]: { "long": booleanPrimitiveType, "int": booleanPrimitiveType, "float": booleanPrimitiveType, "double": booleanPrimitiveType, "Integer": booleanPrimitiveType, "Float": booleanPrimitiveType, "Double": booleanPrimitiveType },
            [TokenType.equal]: { "long": booleanPrimitiveType, "int": booleanPrimitiveType, "float": booleanPrimitiveType, "double": booleanPrimitiveType, "Integer": booleanPrimitiveType, "Float": booleanPrimitiveType, "Double": booleanPrimitiveType },
            [TokenType.notEqual]: { "long": booleanPrimitiveType, "int": booleanPrimitiveType, "float": booleanPrimitiveType, "double": booleanPrimitiveType, "Integer": booleanPrimitiveType, "Float": booleanPrimitiveType, "Double": booleanPrimitiveType },

            // binary ops
            [TokenType.OR]: { "long": longPrimitiveType, "Long": longPrimitiveType, "int": intPrimitiveType, "Integer": intPrimitiveType },
            [TokenType.XOR]: { "long": longPrimitiveType, "Long": longPrimitiveType, "int": intPrimitiveType, "Integer": intPrimitiveType },
            [TokenType.ampersand]: { "long": longPrimitiveType, "Long": longPrimitiveType, "int": intPrimitiveType, "Integer": intPrimitiveType },
            [TokenType.shiftLeft]: { "long": longPrimitiveType, "Long": longPrimitiveType, "int": intPrimitiveType, "Integer": intPrimitiveType },
            [TokenType.shiftRight]: { "long": longPrimitiveType, "Long": longPrimitiveType, "int": intPrimitiveType, "Integer": intPrimitiveType },
            [TokenType.shiftRightUnsigned]: { "long": longPrimitiveType, "Long": longPrimitiveType, "int": intPrimitiveType, "Integer": intPrimitiveType }

        };

        // this.canCastTolist = [floatPrimitiveType, doublePrimitiveType, stringPrimitiveType, charPrimitiveType];

        this.canCastToMap = {
            "float": { automatic: true, needsStatement: false },
            "double": { automatic: true, needsStatement: false },
            "char": { automatic: true, needsStatement: true },
            "int": { automatic: true, needsStatement: false },
            "long": { automatic: true, needsStatement: false },
            "Integer": { automatic: true, needsStatement: true },
            "Long": { automatic: true, needsStatement: true },
        }


    }

    toTokenType(): TokenType {
        return TokenType.integerConstant;
    }

    public castTo(value: Value, type: Type): Value {

        if (type == charPrimitiveType) {
            return {
                type: type,
                value: String.fromCharCode(<number>value.value)
            }
        }

    }


    public compute(operation: TokenType, firstOperand: Value, secondOperand?: Value): any {

        let value = <number>(firstOperand.value);

        switch (operation) {
            case TokenType.plus:
                if (secondOperand.type == stringPrimitiveType) {
                    return value + <string>(secondOperand.value);
                } else {
                    return value + <number>(secondOperand.value);
                }

            case TokenType.minus:
                if (secondOperand == null) return -value;
                return value - <number>(secondOperand.value);

            case TokenType.multiplication:
                return value * <number>(secondOperand.value);

            case TokenType.division:
                if (secondOperand.type == intPrimitiveType) {
                    return Math.trunc(value / <number>(secondOperand.value));
                }
                return value / <number>(secondOperand.value);

            case TokenType.modulo:
                if (secondOperand.type == intPrimitiveType) {
                    return Math.trunc(value % <number>(secondOperand.value));
                }
                return 1;

            case TokenType.doublePlus:
                return value++;

            case TokenType.doubleMinus:
                return value--;

            case TokenType.negation:
                return -value;

            case TokenType.tilde:
                return ~value;

            case TokenType.lower:
                return value < (<number>(secondOperand.value));

            case TokenType.greater:
                return value > <number>(secondOperand.value);

            case TokenType.lowerOrEqual:
                return value <= <number>(secondOperand.value);

            case TokenType.greaterOrEqual:
                return value >= <number>(secondOperand.value);

            case TokenType.equal:
                return value == <number>(secondOperand.value);

            case TokenType.notEqual:
                return value != <number>(secondOperand.value);

            case TokenType.OR:
                return value | <number>(secondOperand.value);

            case TokenType.XOR:
                return value ^ <number>(secondOperand.value);

            case TokenType.ampersand:
                return value & <number>(secondOperand.value);

            case TokenType.shiftLeft:
                return value << <number>(secondOperand.value);

            case TokenType.shiftRight:
                return value >> <number>(secondOperand.value);

            case TokenType.shiftRightUnsigned:
                return value >>> <number>(secondOperand.value);

        }


    }

    public debugOutput(value: Value): string {
        return "" + <number>value.value;
    }


}

export class LongPrimitiveType extends IntPrimitiveType {
    init() {

        this.initialValue = 0;

        this.identifier = "long";

        this.description = "ganze Zahl"

        this.operationTable = {
            [TokenType.plus]: { "long": longPrimitiveType, "int": longPrimitiveType, "Long": longPrimitiveType, "Integer": longPrimitiveType, "float": floatPrimitiveType, "Float": floatPrimitiveType, "double": doublePrimitiveType, "Double": doublePrimitiveType },
            [TokenType.minus]: { "none": intPrimitiveType, "long": longPrimitiveType, "int": longPrimitiveType, "Long": longPrimitiveType, "Integer": longPrimitiveType, "float": floatPrimitiveType, "Float": floatPrimitiveType, "double": doublePrimitiveType, "Double": doublePrimitiveType },
            [TokenType.multiplication]: { "long": longPrimitiveType, "int": longPrimitiveType, "Long": longPrimitiveType, "Integer": longPrimitiveType, "float": floatPrimitiveType, "Float": floatPrimitiveType, "double": doublePrimitiveType, "Double": doublePrimitiveType },
            [TokenType.modulo]: { "long": longPrimitiveType, "int": longPrimitiveType, "Long": longPrimitiveType, "Integer": longPrimitiveType },
            [TokenType.division]: { "long": longPrimitiveType, "int": longPrimitiveType, "Long": longPrimitiveType, "Integer": longPrimitiveType, "float": floatPrimitiveType, "Float": floatPrimitiveType, "double": doublePrimitiveType, "Double": doublePrimitiveType },
            [TokenType.doublePlus]: { "none": intPrimitiveType },
            [TokenType.doubleMinus]: { "none": intPrimitiveType },
            [TokenType.negation]: { "none": intPrimitiveType },
            [TokenType.tilde]: { "none": intPrimitiveType },
            [TokenType.lower]: { "long": booleanPrimitiveType, "int": booleanPrimitiveType, "float": booleanPrimitiveType, "double": booleanPrimitiveType, "Integer": booleanPrimitiveType, "Float": booleanPrimitiveType, "Double": booleanPrimitiveType },
            [TokenType.greater]: { "long": booleanPrimitiveType, "int": booleanPrimitiveType, "float": booleanPrimitiveType, "double": booleanPrimitiveType, "Integer": booleanPrimitiveType, "Float": booleanPrimitiveType, "Double": booleanPrimitiveType },
            [TokenType.lowerOrEqual]: { "long": booleanPrimitiveType, "int": booleanPrimitiveType, "float": booleanPrimitiveType, "double": booleanPrimitiveType, "Integer": booleanPrimitiveType, "Float": booleanPrimitiveType, "Double": booleanPrimitiveType },
            [TokenType.greaterOrEqual]: { "long": booleanPrimitiveType, "int": booleanPrimitiveType, "float": booleanPrimitiveType, "double": booleanPrimitiveType, "Integer": booleanPrimitiveType, "Float": booleanPrimitiveType, "Double": booleanPrimitiveType },
            [TokenType.equal]: { "long": booleanPrimitiveType, "int": booleanPrimitiveType, "float": booleanPrimitiveType, "double": booleanPrimitiveType, "Integer": booleanPrimitiveType, "Float": booleanPrimitiveType, "Double": booleanPrimitiveType },
            [TokenType.notEqual]: { "long": booleanPrimitiveType, "int": booleanPrimitiveType, "float": booleanPrimitiveType, "double": booleanPrimitiveType, "Integer": booleanPrimitiveType, "Float": booleanPrimitiveType, "Double": booleanPrimitiveType },

            // binary ops
            [TokenType.OR]: { "long": longPrimitiveType, "int": longPrimitiveType, "Long": longPrimitiveType, "Integer": longPrimitiveType },
            [TokenType.XOR]: { "long": longPrimitiveType, "int": longPrimitiveType, "Long": longPrimitiveType, "Integer": longPrimitiveType },
            [TokenType.ampersand]: { "long": longPrimitiveType, "int": longPrimitiveType, "Long": longPrimitiveType, "Integer": longPrimitiveType },
            [TokenType.shiftLeft]: { "long": longPrimitiveType, "int": longPrimitiveType, "Long": longPrimitiveType, "Integer": longPrimitiveType },
            [TokenType.shiftRight]: { "long": longPrimitiveType, "int": longPrimitiveType, "Long": longPrimitiveType, "Integer": longPrimitiveType },
            [TokenType.shiftRightUnsigned]: { "long": longPrimitiveType, "int": longPrimitiveType, "Long": longPrimitiveType, "Integer": longPrimitiveType }

        };

        // this.canCastTolist = [floatPrimitiveType, doublePrimitiveType, stringPrimitiveType, charPrimitiveType];

        this.canCastToMap = {
            "float": { automatic: true, needsStatement: false },
            "double": { automatic: true, needsStatement: false },
            "char": { automatic: true, needsStatement: true },
            "int": { automatic: false, needsStatement: false },
            "long": { automatic: true, needsStatement: false },
            "Integer": { automatic: true, needsStatement: false },
            "Long": { automatic: true, needsStatement: false },
        }


    }

    toTokenType(): TokenType {
        return TokenType.longConstant;
    }
}


export class FloatPrimitiveType extends PrimitiveType {

    init() {

        this.initialValue = 0;

        this.identifier = "float";

        this.description = "Fließkommazahl mit einfacher Genauigkeit"

        this.operationTable = {
            [TokenType.plus]: { "Integer": floatPrimitiveType, "int": floatPrimitiveType, "float": floatPrimitiveType, "Float": floatPrimitiveType, "double": doublePrimitiveType, "Double": doublePrimitiveType },
            [TokenType.minus]: { "none": floatPrimitiveType, "Integer": floatPrimitiveType, "int": floatPrimitiveType, "float": floatPrimitiveType, "Float": floatPrimitiveType, "double": doublePrimitiveType, "Double": doublePrimitiveType },
            [TokenType.multiplication]: { "Integer": floatPrimitiveType, "int": floatPrimitiveType, "float": floatPrimitiveType, "Float": floatPrimitiveType, "double": doublePrimitiveType, "Double": doublePrimitiveType },
            [TokenType.division]: { "Integer": floatPrimitiveType, "int": floatPrimitiveType, "float": floatPrimitiveType, "Float": floatPrimitiveType, "double": doublePrimitiveType, "Double": doublePrimitiveType },
            [TokenType.doublePlus]: { "none": floatPrimitiveType },
            [TokenType.doubleMinus]: { "none": floatPrimitiveType },
            [TokenType.negation]: { "none": floatPrimitiveType },
            [TokenType.lower]: { "int": booleanPrimitiveType, "float": booleanPrimitiveType, "double": booleanPrimitiveType, "Integer": booleanPrimitiveType, "Float": booleanPrimitiveType, "Double": booleanPrimitiveType },
            [TokenType.greater]: { "int": booleanPrimitiveType, "float": booleanPrimitiveType, "double": booleanPrimitiveType, "Integer": booleanPrimitiveType, "Float": booleanPrimitiveType, "Double": booleanPrimitiveType },
            [TokenType.lowerOrEqual]: { "int": booleanPrimitiveType, "float": booleanPrimitiveType, "double": booleanPrimitiveType, "Integer": booleanPrimitiveType, "Float": booleanPrimitiveType, "Double": booleanPrimitiveType },
            [TokenType.greaterOrEqual]: { "int": booleanPrimitiveType, "float": booleanPrimitiveType, "double": booleanPrimitiveType, "Integer": booleanPrimitiveType, "Float": booleanPrimitiveType, "Double": booleanPrimitiveType },
            [TokenType.equal]: { "int": booleanPrimitiveType, "float": booleanPrimitiveType, "double": booleanPrimitiveType, "Integer": booleanPrimitiveType, "Float": booleanPrimitiveType, "Double": booleanPrimitiveType },
            [TokenType.notEqual]: { "int": booleanPrimitiveType, "float": booleanPrimitiveType, "double": booleanPrimitiveType, "Integer": booleanPrimitiveType, "Float": booleanPrimitiveType, "Double": booleanPrimitiveType },
        };

        // this.canCastTolist = [intPrimitiveType, stringPrimitiveType, doublePrimitiveType];

        this.canCastToMap = {
            "int": { automatic: false, needsStatement: true },
            "double": { automatic: true, needsStatement: false },
            "float": { automatic: true, needsStatement: false },
            "Float": { automatic: true, needsStatement: true },
            "Double": { automatic: true, needsStatement: true },
        }

    }

    toTokenType(): TokenType {
        return TokenType.floatingPointConstant;
    }

    public castTo(value: Value, type: Type): Value {

        if (type == intPrimitiveType) {
            return {
                type: type,
                value: Math.trunc(<number>value.value)
            }
        }

        // if (type == doublePrimitiveType || type == DoubleType || type == FloatType) {
        //     return {
        //         type: type,
        //         value: value.value
        //     }
        // }

    }

    public valueToString(value: Value): string {
        return floatToString(value.value);
    }


    public compute(operation: TokenType, firstOperand: Value, secondOperand?: Value): any {

        let value = <number>(firstOperand.value);

        switch (operation) {
            case TokenType.plus:
                if (secondOperand.type == stringPrimitiveType) {
                    return value + <string>(secondOperand.value);
                } else {
                    return value + <number>(secondOperand.value);
                }

            case TokenType.minus:
                if (secondOperand == null) return -value;
                return value - <number>(secondOperand.value);

            case TokenType.multiplication:
                return value * <number>(secondOperand.value);

            case TokenType.division:
                return value / <number>(secondOperand.value);

            case TokenType.doublePlus:
                return value++;

            case TokenType.doubleMinus:
                return value--;

            case TokenType.negation:
                return -value;

            case TokenType.lower:
                return value < (<number>(secondOperand.value));

            case TokenType.greater:
                return value > <number>(secondOperand.value);

            case TokenType.lowerOrEqual:
                return value <= <number>(secondOperand.value);

            case TokenType.greaterOrEqual:
                return value >= <number>(secondOperand.value);

            case TokenType.equal:
                return value == <number>(secondOperand.value);

            case TokenType.notEqual:
                return value != <number>(secondOperand.value);

        }


    }

    public debugOutput(value: Value): string {
        return "" + <number>value.value;
    }


}

export class DoublePrimitiveType extends PrimitiveType {

    init() {

        this.initialValue = 0;

        this.identifier = "double";

        this.description = "Fließkommazahl mit doppelter Genauigkeit"

        this.operationTable = {
            [TokenType.plus]: { "int": doublePrimitiveType, "Integer": doublePrimitiveType, "float": doublePrimitiveType, "Float": doublePrimitiveType, "double": doublePrimitiveType, "Double": doublePrimitiveType },
            [TokenType.minus]: { "none": doublePrimitiveType, "int": doublePrimitiveType, "Integer": doublePrimitiveType, "float": doublePrimitiveType, "Float": doublePrimitiveType, "double": doublePrimitiveType, "Double": doublePrimitiveType },
            [TokenType.multiplication]: { "int": doublePrimitiveType, "Integer": doublePrimitiveType, "float": doublePrimitiveType, "Float": doublePrimitiveType, "double": doublePrimitiveType, "Double": doublePrimitiveType },
            [TokenType.division]: { "int": doublePrimitiveType, "Integer": doublePrimitiveType, "float": doublePrimitiveType, "Float": doublePrimitiveType, "double": doublePrimitiveType, "Double": doublePrimitiveType },
            [TokenType.doublePlus]: { "none": doublePrimitiveType },
            [TokenType.doubleMinus]: { "none": doublePrimitiveType },
            [TokenType.negation]: { "none": doublePrimitiveType },
            [TokenType.lower]: { "int": booleanPrimitiveType, "float": booleanPrimitiveType, "double": booleanPrimitiveType, "Integer": booleanPrimitiveType, "Float": booleanPrimitiveType, "Double": booleanPrimitiveType },
            [TokenType.greater]: { "int": booleanPrimitiveType, "float": booleanPrimitiveType, "double": booleanPrimitiveType, "Integer": booleanPrimitiveType, "Float": booleanPrimitiveType, "Double": booleanPrimitiveType },
            [TokenType.lowerOrEqual]: { "int": booleanPrimitiveType, "float": booleanPrimitiveType, "double": booleanPrimitiveType, "Integer": booleanPrimitiveType, "Float": booleanPrimitiveType, "Double": booleanPrimitiveType },
            [TokenType.greaterOrEqual]: { "int": booleanPrimitiveType, "float": booleanPrimitiveType, "double": booleanPrimitiveType, "Integer": booleanPrimitiveType, "Float": booleanPrimitiveType, "Double": booleanPrimitiveType },
            [TokenType.equal]: { "int": booleanPrimitiveType, "float": booleanPrimitiveType, "double": booleanPrimitiveType, "Integer": booleanPrimitiveType, "Float": booleanPrimitiveType, "Double": booleanPrimitiveType },
            [TokenType.notEqual]: { "int": booleanPrimitiveType, "float": booleanPrimitiveType, "double": booleanPrimitiveType, "Integer": booleanPrimitiveType, "Float": booleanPrimitiveType, "Double": booleanPrimitiveType },
        };

        // this.canCastTolist = [intPrimitiveType, stringPrimitiveType, floatPrimitiveType];
        this.canCastToMap = {
            "int": { automatic: false, needsStatement: true },
            "float": { automatic: true, needsStatement: false },
            "double": { automatic: true, needsStatement: false },
            "Float": { automatic: true, needsStatement: true },
            "Double": { automatic: true, needsStatement: true },
        }


    }

    toTokenType(): TokenType {
        return TokenType.floatingPointConstant;
    }

    public castTo(value: Value, type: Type): Value {

        if (type == intPrimitiveType) {
            return {
                type: type,
                value: Math.trunc(<number>value.value)
            }
        }

    }

    public valueToString(value: Value): string {
        return floatToString(value.value);
    }



    public compute(operation: TokenType, firstOperand: Value, secondOperand?: Value): any {

        let value = <number>(firstOperand.value);

        switch (operation) {
            case TokenType.plus:
                if (secondOperand.type == stringPrimitiveType) {
                    return value + <string>(secondOperand.value);
                } else {
                    return value + <number>(secondOperand.value);
                }

            case TokenType.minus:
                if (secondOperand == null) return -value;
                return value - <number>(secondOperand.value);

            case TokenType.multiplication:
                return value * <number>(secondOperand.value);

            case TokenType.division:
                return value / <number>(secondOperand.value);

            case TokenType.doublePlus:
                return value++;

            case TokenType.doubleMinus:
                return value--;

            case TokenType.negation:
                return -value;

            case TokenType.lower:
                return value < (<number>(secondOperand.value));

            case TokenType.greater:
                return value > <number>(secondOperand.value);

            case TokenType.lowerOrEqual:
                return value <= <number>(secondOperand.value);

            case TokenType.greaterOrEqual:
                return value >= <number>(secondOperand.value);

            case TokenType.equal:
                return value == <number>(secondOperand.value);

            case TokenType.notEqual:
                return value != <number>(secondOperand.value);

        }


    }

    public debugOutput(value: Value): string {
        return "" + <number>value.value;
    }


}

export class BooleanPrimitiveType extends PrimitiveType {

    init() {

        this.initialValue = false;

        this.identifier = "boolean";

        this.description = "boolescher Wert (true oder false)"

        this.operationTable = {
            [TokenType.plus]: {},
            [TokenType.and]: { "boolean": booleanPrimitiveType },
            [TokenType.or]: { "boolean": booleanPrimitiveType },
            [TokenType.not]: { "none": booleanPrimitiveType },
            [TokenType.equal]: { "boolean": booleanPrimitiveType },
            [TokenType.notEqual]: { "boolean": booleanPrimitiveType },
        };

        this.canCastToMap = {
            "boolean": { automatic: true, needsStatement: false },
            "Boolean": { automatic: true, needsStatement: true },
        }


    }

    toTokenType(): TokenType {
        return TokenType.booleanConstant;
    }

    public castTo(value: Value, type: Type): Value {

        return undefined;

    }


    public compute(operation: TokenType, firstOperand: Value, secondOperand?: Value): any {

        let value = <boolean>(firstOperand.value);

        switch (operation) {
            case TokenType.plus:
                return value + nullToString(<string>(secondOperand.value));

            case TokenType.equal:
                return value == <boolean>(secondOperand.value);

            case TokenType.notEqual:
                return value != <boolean>(secondOperand.value);

            case TokenType.and:
                return value && <boolean>(secondOperand.value);

            case TokenType.or:
                return value || <boolean>(secondOperand.value);

            case TokenType.not:
                return !value;

        }


    }

    public debugOutput(value: Value): string {
        return "" + <boolean>value.value;
    }


}

export class VoidPrimitiveType extends PrimitiveType {

    init() {

        this.initialValue = false;

        this.identifier = "void";

        this.description = "leerer Rückgabewert"

        this.operationTable = {
        };

        this.canCastToMap = {};

    }

    public toTokenType(): TokenType {
        return TokenType.keywordVoid;
    }

    public castTo(value: Value, type: Type): Value {

        return value;

    }


    public compute(operation: TokenType, firstOperand: Value, secondOperand?: Value): any {

        return null;

    }

    public debugOutput(value: Value): string {
        return "void";
    }


}

export class StringPrimitiveType extends Klass {

    private operationTable: { [operation: number]: { [typename: string]: Type } }

    public toTokenType(): TokenType {
        return TokenType.stringConstant;
    }

    public getResultType(operation: TokenType, secondOperandType?: Type): Type {

        if (operation == TokenType.keywordInstanceof) {
            return super.getResultType(operation, secondOperandType);
        }

        let opTypeMap = this.operationTable[operation];

        if (opTypeMap == null) {
            return null; // Operation not possible
        }

        if (secondOperandType != null) {
            return opTypeMap[secondOperandType.identifier];
        }

        return opTypeMap["none"];

    }


    constructor(baseClass: Klass) {
        super("String", null, "Ein Objekt der Klasse String speichert eine Zeichenkette.");
        this.baseClass = baseClass;
        let stringClass = this;
        baseClass.methods.filter(m => m.identifier == "toString").forEach(m => m.returnType = stringClass);
    }

    init() {
        this.operationTable = {
            [TokenType.plus]: {
                "String": stringPrimitiveType
            },
            [TokenType.equal]: { "String": booleanPrimitiveType, "null": booleanPrimitiveType },
            [TokenType.notEqual]: { "String": booleanPrimitiveType, "null": booleanPrimitiveType },
            [TokenType.lower]: { "String": booleanPrimitiveType },
            [TokenType.greater]: { "String": booleanPrimitiveType },
            [TokenType.lowerOrEqual]: { "String": booleanPrimitiveType },
            [TokenType.greaterOrEqual]: { "String": booleanPrimitiveType }

        };


        this.addMethod(new Method("length", new Parameterlist([]), intPrimitiveType,
            (parameters) => { return (<string>parameters[0].value).length; }, false, false, "Länge der Zeichenkette, d.h. Anzahl der Zeichen in der Zeichenkette."));
        this.addMethod(new Method("charAt", new Parameterlist([{ identifier: "Position", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: false }]), charPrimitiveType,
            (parameters) => { return (<string>parameters[0].value).charAt(<number>(parameters[1].value)); }, false, false, "Zeichen an der gegebenen Position.\n**Bem.: ** Position == 0 bedeutet das erste Zeichen in der Zeichenkette, Position == 1 das zweite usw. ."));
        this.addMethod(new Method("equals", new Parameterlist([{ identifier: "otherString", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: false }]), booleanPrimitiveType,
            (parameters) => { return <string>parameters[0].value == <string>(parameters[1].value); }, false, false, "Gibt genau dann **wahr** zurück, wenn die zwei Zeichenketten übereinstimmen (unter Berücksichtigung von Klein-/Großschreibung)."));
        this.addMethod(new Method("compareTo", new Parameterlist([{ identifier: "otherString", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: false }]), intPrimitiveType,
            (parameters) => { return (<string>(parameters[0].value)).localeCompare(<string>(parameters[1].value), 'de', { caseFirst: 'upper' }); }, false, false, "Vergleicht den String mit dem übergebenen String. Gibt -1 zurück, falls ersterer im Alphabet vor letzterem steht, +1, falls umgekehrt und 0, falls beide Strings identisch sind."));
        this.addMethod(new Method("compareToIgnoreCase", new Parameterlist([{ identifier: "otherString", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: false }]), intPrimitiveType,
            (parameters) => { return (<string>(parameters[0].value)).localeCompare(<string>(parameters[1].value), 'de', { sensitivity: "accent" }); }, false, false, "Vergleicht den String mit dem übergebenen String. Gibt -1 zurück, falls ersterer im Alphabet vor letzterem steht, +1, falls umgekehrt und 0, falls beide Strings identisch sind."));
        this.addMethod(new Method("equalsIgnoreCase", new Parameterlist([{ identifier: "otherString", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: false }]), booleanPrimitiveType,
            (parameters) => { return (<string>(parameters[0].value)).toLowerCase() == (<string>(parameters[1].value).toLowerCase()); }, false, false, "Gibt genau dann **wahr** zurück, wenn die zwei Zeichenketten übereinstimmen (**ohne** Berücksichtigung von Klein-/Großschreibung)."));
        this.addMethod(new Method("endsWith", new Parameterlist([{ identifier: "suffix", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: false }]), booleanPrimitiveType,
            (parameters) => { return (<string>(parameters[0].value)).endsWith(<string>(parameters[1].value)); }, false, false, "Gibt genau dann **wahr** zurück, wenn die Zeichenkette mit der übergebenen Zeichenkette ( = suffix) endet. Klein-/Großschreibung wird dabei berücksichtigt!"));
        this.addMethod(new Method("startsWith", new Parameterlist([{ identifier: "präfix", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: false }]), booleanPrimitiveType,
            (parameters) => { return (<string>(parameters[0].value)).startsWith(<string>(parameters[1].value)); }, false, false, "Gibt genau dann **wahr** zurück, wenn die Zeichenkette mit der übergebenen Zeichenkette ( = präfix) beginnt. Klein-/Großschreibung wird dabei berücksichtigt!"));
        this.addMethod(new Method("toLowerCase", new Parameterlist([]), stringPrimitiveType,
            (parameters) => { return (<string>(parameters[0].value)).toLocaleLowerCase(); }, false, false, "Gibt die Zeichenkette zurück, die sich ergibt, wenn man in der gegebenen Zeichnkette jeden Großbuchstaben durch den entsprechenden Kleinbuchstaben ersetzt.\n**Bemerkung: ** Die Methode verändert die Zeichenkette selbst nicht."));
        this.addMethod(new Method("toUpperCase", new Parameterlist([]), stringPrimitiveType,
            (parameters) => { return (<string>(parameters[0].value)).toLocaleUpperCase(); }, false, false, "Gibt die Zeichenkette zurück, die sich ergibt, wenn man in der gegebenen Zeichnkette jeden Kleinbuchstaben durch den entsprechenden Großbuchstaben ersetzt.\n**Bemerkung: ** Die Methode verändert die Zeichenkette selbst nicht."));
        this.addMethod(new Method("substring", new Parameterlist([{ identifier: "beginIndex", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: false }]), stringPrimitiveType,
            (parameters) => { return (<string>(parameters[0].value)).substring(<number>(parameters[1].value)); }, false, false, "Gibt das hintere Ende der Zeichenkette ab **beginIndex** zurück. **beginIndex** == 1 bedeutet, dass die Zeichenkette ab dem 2.(!) Zeichen zurückgegeben wird. "));
        this.addMethod(new Method("substring", new Parameterlist([{ identifier: "beginIndex", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: false },
        { identifier: "endIndex", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: false }]), stringPrimitiveType,
            (parameters) => { return (<string>(parameters[0].value)).substring(<number>(parameters[1].value), <number>(parameters[2].value)); }, false, false, "Gibt die Teil-Zeichenkette von **beginIndex** bis **endIndex** zurück.\n**Vorsicht: ** beginIndex und endIndex sind nullbasiert, d.h. beginIndex == 0 bedeutet die Position vor dem ersten Zeichen."));
        this.addMethod(new Method("trim", new Parameterlist([]), stringPrimitiveType,
            (parameters) => { return (<string>(parameters[0].value)).trim(); }, false, false, "Gibt die Zeichenkette zurück, die entsteht, wenn man am Anfang und Ende der Zeichenkette alle Leerzeichen, Tabs und Zeilenumbrüche entfernt."));
        this.addMethod(new Method("isEmpty", new Parameterlist([]), booleanPrimitiveType,
            (parameters) => { return (<string>(parameters[0].value)) == ""; }, false, false, "Gibt genau dann wahr zurück, wenn die Zeichenkette leer ist.\n**Warnung: ** Die Methode darf nicht mit dem '''null'''-Objekt aufgerufen werden!"));
        this.addMethod(new Method("indexOf", new Parameterlist([{ identifier: "otherString", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: false }]), intPrimitiveType,
            (parameters) => { return (<string>(parameters[0].value)).indexOf(<string>(parameters[1].value)); }, false, false, "Gibt die erste Position zurück, an der **otherString** in der Zeichenkette gefunden wird."));
        this.addMethod(new Method("indexOf", new Parameterlist([
            { identifier: "otherString", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: false },
            { identifier: "fromIndex", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: false },
        ]), intPrimitiveType,
            (parameters) => { return (<string>(parameters[0].value)).indexOf(<string>(parameters[1].value), <number>(parameters[2].value)); }, false, false, "Gibt die erste Position zurück, an der **otherString** in der Zeichenkette gefunden wird. Dabei wird erst bei fromIndex mit der Suche begonnen."));
        this.addMethod(new Method("lastIndexOf", new Parameterlist([{ identifier: "otherString", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: false }]), intPrimitiveType,
            (parameters) => { return (<string>(parameters[0].value)).lastIndexOf(<string>(parameters[1].value)); }, false, false, "Gibt die letzte Position zurück, bei der otherString in der Zeichenkette gefunden wird."));
        this.addMethod(new Method("lastIndexOf", new Parameterlist([
            { identifier: "otherString", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: false },
            { identifier: "fromIndex", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: false },
        ]), intPrimitiveType,
            (parameters) => { return (<string>(parameters[0].value)).lastIndexOf(<string>(parameters[1].value), <number>(parameters[2].value)); }, false, false, "Gibt die letzte Position zurück, bei der otherString in der Zeichenkette gefunden wird. Dabei wird erst bei fromIndex - von rechts her beginnend - gesucht."));
        this.addMethod(new Method("replace", new Parameterlist([
            { identifier: "target", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: false },
            { identifier: "replacement", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: false },
        ]), stringPrimitiveType,
            (parameters) => { return (<string>(parameters[0].value)).replace(<string>(parameters[1].value), <string>(parameters[2].value)); }, false, false, "Ersetzt alle Vorkommen von **target** durch **replacement** und gibt die entstandene Zeichenkette zurück. Die Zeichenkette selbst wird nicht verändert."));
        this.addMethod(new Method("replaceAll", new Parameterlist([
            { identifier: "regex", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: false },
            { identifier: "replacement", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: false },
        ]), stringPrimitiveType,
            (parameters) => {
                let pattern = <string>(parameters[1].value);
                let regExp = new RegExp(pattern, 'g');

                return (<string>(parameters[0].value)).replace(regExp, <string>(parameters[2].value));
            }, false, false, "Durchsucht den String mit dem regulären Ausdruck (regex) und ersetzt **alle** Fundstellen durch **replacement**."));
        this.addMethod(new Method("matches", new Parameterlist([
            { identifier: "regex", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: false }
        ]), booleanPrimitiveType,
            (parameters) => {
                let pattern = <string>(parameters[1].value);
                let regExp = new RegExp(pattern, 'g');

                return <string>(parameters[0].value).match(regExp) != null;
            }, false, false, "Gibt genau dann true zurück, wenn der Wert der Zeichenkette dem regulären Ausdruck (regex) entspricht."));
        this.addMethod(new Method("replaceFirst", new Parameterlist([
            { identifier: "regex", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: false },
            { identifier: "replacement", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: false },
        ]), stringPrimitiveType,
            (parameters) => {
                let pattern = <string>(parameters[1].value);
                let regExp = new RegExp(pattern, '');

                return (<string>(parameters[0].value)).replace(regExp, <string>(parameters[2].value));
            }, false, false, "Durchsucht den String mit dem regulären Ausdruck (regex) und ersetzt **die erste** Fundstelle durch **replacement**."));
        this.addMethod(new Method("split", new Parameterlist([
            { identifier: "regex", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: false },
        ]), new ArrayType(stringPrimitiveType),
            (parameters) => {
                let pattern = <string>(parameters[1].value);
                let regExp = new RegExp(pattern, '');

                let strings = (<string>(parameters[0].value)).split(regExp);
                let values: Value[] = [];
                for (let s of strings) {
                    values.push({ type: stringPrimitiveType, value: s });
                }

                return values;

            }, false, false, "Teilt die Zeichenkette an den Stellen, die durch den regulären Ausdruck (regex) definiert sind, in Teile auf. Die Fundstellen des regex werden dabei weggelassen. Gibt die Teile als String-Array zurück."));

    }

    public compute(operation: TokenType, firstOperand: Value, secondOperand?: Value): any {

        let value = <string>(firstOperand.value);

        let err: Error = checkNotNull(operation, this, firstOperand, secondOperand, [TokenType.plus, TokenType.keywordInstanceof])
        if (err != null) return err;

        switch (operation) {
            case TokenType.plus:
                if (secondOperand.type == stringPrimitiveType) {
                    return nullToString(value) + <string>(secondOperand.value); // because null + null = 0 in javascript
                }

            case TokenType.lower:
                return value.localeCompare(<string>(secondOperand.value), 'de', { caseFirst: 'upper' }) < 0;
            // return value < (<string>(secondOperand.value));

            case TokenType.greater:
                return value.localeCompare(<string>(secondOperand.value), 'de', { caseFirst: 'upper' }) > 0;
            // return value > <string>(secondOperand.value);

            case TokenType.lowerOrEqual:
                return value.localeCompare(<string>(secondOperand.value), 'de', { caseFirst: 'upper' }) <= 0;
            // return value <= <string>(secondOperand.value);

            case TokenType.greaterOrEqual:
                return value.localeCompare(<string>(secondOperand.value), 'de', { caseFirst: 'upper' }) >= 0;
            // return value >= <string>(secondOperand.value);

            case TokenType.equal:
                return value == <string>(secondOperand.value);

            case TokenType.notEqual:
                return value != <string>(secondOperand.value);

            case TokenType.keywordInstanceof:
                return super.compute(operation, firstOperand, secondOperand);

        }


    }

    public allowsNull(): boolean { return true; }

    public debugOutput(value: Value): string {
        return '"' + <string>value.value + '"';
    }


}

export class CharPrimitiveType extends PrimitiveType {

    init() {

        this.initialValue = "\u0000";

        this.identifier = "char";

        this.description = "ein Zeichen"

        this.operationTable = {
            [TokenType.plus]: { "String": stringPrimitiveType, "char": stringPrimitiveType },
            [TokenType.equal]: { "char": booleanPrimitiveType },
            [TokenType.notEqual]: { "char": booleanPrimitiveType },
            [TokenType.lower]: { "char": booleanPrimitiveType },
            [TokenType.greater]: { "char": booleanPrimitiveType },
            [TokenType.lowerOrEqual]: { "char": booleanPrimitiveType },
            [TokenType.greaterOrEqual]: { "char": booleanPrimitiveType }

        };

        // this.canCastTolist = [intPrimitiveType, floatPrimitiveType, doublePrimitiveType, stringPrimitiveType];
        this.canCastToMap = {
            "int": { automatic: true, needsStatement: true },
            "float": { automatic: true, needsStatement: true },
            "double": { automatic: true, needsStatement: true },
            "String": { automatic: true, needsStatement: true },
            "char": { automatic: true, needsStatement: false },
            "Character": { automatic: true, needsStatement: true },
        }

    }

    public toTokenType(): TokenType {
        return TokenType.charConstant;
    }

    public castTo(value: Value, type: Type): Value {

        // let unboxed = this.unboxFrom(value, type);
        // if (unboxed != null) return unboxed;

        // if (type == stringPrimitiveType || type == CharacterType) {
        //     return {
        //         type: type,
        //         value: value
        //     }
        // }

        if (type == intPrimitiveType || type == floatPrimitiveType || type == doublePrimitiveType) {
            return {
                type: type,
                value: (<string>value.value).charCodeAt(0)
            }
        }

    }

    public compute(operation: TokenType, firstOperand: Value, secondOperand?: Value): any {

        let value = <string>(firstOperand.value);

        switch (operation) {
            case TokenType.plus:
                return value + <string>(secondOperand.value);

            case TokenType.lower:
                return value < (<string>(secondOperand.value));

            case TokenType.greater:
                return value > <string>(secondOperand.value);

            case TokenType.lowerOrEqual:
                return value <= <string>(secondOperand.value);

            case TokenType.greaterOrEqual:
                return value >= <string>(secondOperand.value);

            case TokenType.equal:
                return value == <string>(secondOperand.value);

            case TokenType.notEqual:
                return value != <string>(secondOperand.value);

        }


    }

    public debugOutput(value: Value): string {
        return "'" + <string>value.value + "'";
    }


}

export var voidPrimitiveType = new VoidPrimitiveType();
export var intPrimitiveType = new IntPrimitiveType();
export var longPrimitiveType = new LongPrimitiveType();
export var floatPrimitiveType = new FloatPrimitiveType();
export var doublePrimitiveType = new DoublePrimitiveType();
export var booleanPrimitiveType = new BooleanPrimitiveType();
setBooleanPrimitiveTypeCopy(booleanPrimitiveType);
export var objectType = new ObjectClass(null);
export var stringPrimitiveType = new StringPrimitiveType(objectType);
export var charPrimitiveType = new CharPrimitiveType();
export var nullType = new NullType();
export var varType = new VarType();

export var IntegerType = new IntegerClass(objectType);
export var LongType = new LongClass(objectType);
export var FloatType = new FloatClass(objectType);
export var DoubleType = new DoubleClass(objectType);
export var CharacterType = new CharacterClass(objectType);
export var BooleanType = new BooleanClass(objectType);

export var TokenTypeToDataTypeMap: { [tt: number]: Type } = {
    [TokenType.integerConstant]: intPrimitiveType,
    [TokenType.longConstant]: longPrimitiveType,
    [TokenType.floatingPointConstant]: floatPrimitiveType,
    [TokenType.booleanConstant]: booleanPrimitiveType,
    [TokenType.stringConstant]: stringPrimitiveType,
    [TokenType.charConstant]: charPrimitiveType,
    [TokenType.keywordNull]: nullType
}


function checkNotNull(operation: TokenType, type: Type, firstOperand: Value, secondOperand?: Value, nullAllowedFor: TokenType[] = []): Error {
    if ((firstOperand.value == null || secondOperand.value == null) && !nullAllowedFor.concat([TokenType.equal, TokenType.notEqual]).includes(operation)) {
        let typeAndNull: (v: Value) => string = (v: Value) => v.value == null ? "(" + type.identifier + ")" + " null" : type.identifier;
        return new OperandIsNull("Unerlaubte Rechnung mit null: " + typeAndNull(firstOperand) + " " + TokenTypeReadable[operation] + " " + typeAndNull(secondOperand));
    }
    return null;
}

export class OperandIsNull extends Error {
    constructor(message?: string) {
        super(message);
        this.name = "OperandIsNullError";
    }
}