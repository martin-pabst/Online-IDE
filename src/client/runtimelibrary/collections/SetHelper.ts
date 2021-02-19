import { TextPosition, TokenType } from "../../compiler/lexer/Token.js";
import { Module } from "../../compiler/parser/Module.js";
import { Program, Statement } from "../../compiler/parser/Program.js";
import { Interface, Klass } from "../../compiler/types/Class.js";
import { Enum } from "../../compiler/types/Enum.js";
import { booleanPrimitiveType, stringPrimitiveType, StringPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist, PrimitiveType, Value } from "../../compiler/types/Types.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { ListHelper } from "./ArrayList.js";


export class SetHelper {

    valueArray: Value[] = [];

    map: Map<any, boolean> = new Map(); // Maps key objects to index in keyArray/valueArray

    constructor(private runtimeObject: RuntimeObject, public interpreter: Interpreter, private module: Module) {
    }

    allElementsPrimitive(): boolean {
        for (let v of this.valueArray) {
            if (!(v.type instanceof PrimitiveType || ["String", "_Double", "Integer", "Boolean" ,"Character"].indexOf(v.type.identifier) >= 0)) {
                return false;
            }
        }
        return true;
    }

    to_String(): any {

        if (this.allElementsPrimitive()) {
            return "[" + this.valueArray.map(o => "" + o.value).join(", ") + "]";
        }

        let position: TextPosition = {
            line: 1,
            column: 1,
            length: 1
        }

        let statements: Statement[] = [
            {
                type: TokenType.noOp,
                position: position,
                stepFinished: false
            },
            {
                type: TokenType.pushConstant,
                dataType: stringPrimitiveType,
                value: "[",
                position: position,
                stepFinished: false
            },
        ];

        let toStringParameters = new Parameterlist([]);

        for (let i = 0; i < this.valueArray.length; i++) {

            let key = this.valueArray[i];
            if (key.type instanceof PrimitiveType || key.type instanceof StringPrimitiveType) {
                statements.push({
                    type: TokenType.pushConstant,
                    dataType: stringPrimitiveType,
                    value: key.type.castTo(key, stringPrimitiveType).value,
                    position: position,
                    stepFinished: false
                });
            } else {
                statements.push({
                    type: TokenType.pushConstant,
                    dataType: key.type,
                    value: key.value,
                    stepFinished: false,
                    position: position
                });
                statements.push({
                    type: TokenType.callMethod,
                    method: (<Klass | Interface | Enum>key.type).getMethod("toString", toStringParameters),
                    isSuperCall: false,
                    stackframeBegin: -1,
                    stepFinished: false,
                    position: position
                });

            }

            statements.push({
                type: TokenType.binaryOp,
                operator: TokenType.plus,
                leftType: stringPrimitiveType,
                stepFinished: false,
                position: position
            });

            statements.push({
                type: TokenType.binaryOp,
                operator: TokenType.plus,
                leftType: stringPrimitiveType,
                stepFinished: false,
                position: position
            });

            if (i < this.valueArray.length - 1) {
                statements.push({
                    type: TokenType.pushConstant,
                    dataType: stringPrimitiveType,
                    value: ", ",
                    position: position,
                    stepFinished: false
                });
                statements.push({
                    type: TokenType.binaryOp,
                    operator: TokenType.plus,
                    leftType: stringPrimitiveType,
                    stepFinished: false,
                    position: position
                });

            }

        }

        statements.push({
            type: TokenType.pushConstant,
            dataType: stringPrimitiveType,
            value: "]",
            position: position,
            stepFinished: false
        });

        statements.push({
            type: TokenType.binaryOp,
            operator: TokenType.plus,
            leftType: stringPrimitiveType,
            stepFinished: false,
            position: position
        });

        // statements.push({
        //     type: TokenType.binaryOp,
        //     operator: TokenType.plus,
        //     leftType: stringPrimitiveType,
        //     stepFinished: false,
        //     position: position
        // });

        statements.push({
            type: TokenType.return,
            copyReturnValueToStackframePos0: true,
            leaveThisObjectOnStack: false,
            stepFinished: false,
            position: position,
            methodWasInjected: true
        });

        let program: Program = {
            module: this.module,
            statements: statements,
            labelManager: null
        }

        let method: Method = new Method("toString", new Parameterlist([]), stringPrimitiveType, program, false, false);
        this.interpreter.runTimer(method, [], () => console.log("List.toString fertig!"), true)

        return "";
    }

    // Only for Set
    adAll(object: RuntimeObject): boolean {

        let ret: boolean = false;
        let ah: SetHelper | ListHelper = object.intrinsicData["ListHelper"];
        if (ah != null) {
            for (let value of ah.valueArray) {
                ret = ret || this.addToSet(value);
            }
        }

        return ret;
    }

    addToSet(r: Value): boolean {
        if (this.contains(r)) return false;

        this.valueArray.push(r);
        this.map.set(r.value, true);
        return true;
    }

    size(): number {
        return this.valueArray.length;
    }

    isEmpty(): boolean {
        return this.valueArray.length == 0;
    }

    removeObject(object: Value) {

        if(this.map.get(object.value) == null) return false;

        for(let i = 0; i < this.valueArray.length; i++){
            if(this.valueArray[i].value == object.value){
                this.valueArray.splice(i, 1);
            }
        }

        this.map.delete(object.value);
    }

    contains(object: Value): any {
        return this.map.get(object.value) != null;
    }

    clear() {
        this.valueArray = [];
        this.map.clear();
    }

}
