import { Module } from "../../compiler/parser/Module.js";
import { Interface, Klass, TypeVariable } from "../../compiler/types/Class.js";
import { booleanPrimitiveType, intPrimitiveType, stringPrimitiveType, objectType, StringPrimitiveType, DoubleType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist, Value, PrimitiveType } from "../../compiler/types/Types.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { Program, Statement } from "../../compiler/parser/Program.js";
import { TokenType, TextPosition } from "../../compiler/lexer/Token.js";
import { ArrayType } from "../../compiler/types/Array.js";
import { ListIteratorImplClass } from "./ListIteratorImpl.js";
import { Enum } from "../../compiler/types/Enum.js";

export class ArrayListClass extends Klass {

    constructor(module: Module) {

        super("ArrayList", module, "Liste mit Zugriff auf das n-te Objekt in konstanter Zeit, Einfügen in konstanter Zeit und Suchen in linearer Zeit");

        let objectType = module.typeStore.getType("Object");

        this.setBaseClass(<Klass>objectType);

        let typeA: Klass = (<Klass>objectType).clone();
        typeA.identifier = "A";
        typeA.isTypeVariable = true;

        let tvA: TypeVariable = {
            identifier: "A",
            scopeFrom: { line: 1, column: 1, length: 1 },
            scopeTo: { line: 1, column: 1, length: 1 },
            type: typeA
        };

        this.typeVariables.push(tvA);

        let listInterface = (<Interface>module.typeStore.getType("List")).clone();
        listInterface.typeVariables = [tvA];

        this.implements.push(listInterface);

        let iteratorType = (<Klass>module.typeStore.getType("Iterator")).clone();
        iteratorType.typeVariables = [tvA];

        this.addMethod(new Method("ArrayList", new Parameterlist([
            // { identifier: "mx", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let ah = new ListHelper(o, module.main.getInterpreter(), module);
                o.intrinsicData["ListHelper"] = ah;

            }, false, false, 'Instanziert eine neue ArrayList', true));

        this.addMethod(new Method("iterator", new Parameterlist([
        ]), iteratorType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ListIteratorImplClass.getIterator(ah, ah.interpreter, module, "ascending").value;

            }, true, false, "Gibt einen Iterator über die Elemente dieser Collection zurück."));

        this.addMethod(new Method("add", new Parameterlist([
            { identifier: "element", type: typeA, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let r: Value = parameters[1];
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.add(r);

            }, false, false, "Fügt der Liste ein Element hinzu. Gibt genau dann true zurück, wenn sich der Zustand der Liste dadurch geändert hat."));

        this.addMethod(new Method("add", new Parameterlist([
            { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "element", type: typeA, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let index: number = parameters[1].value;
                let r: Value = parameters[2];
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.add(r, index);

            }, false, false, "Fügt das Element an der Position index der Liste ein. Tipp: Das erste Element der Liste hat index == 0."));

        this.addMethod(new Method("get", new Parameterlist([
            { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), typeA,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let index: number = parameters[1].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];
                
                return ah.get(index)?.value;

            }, false, false, "Gibt das i-te Element der Liste zurück."));

        this.addMethod(new Method("remove", new Parameterlist([
            { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let index: number = parameters[1].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                ah.remove(index);

                return null;

            }, true, false, "Entfernt das Element an der Stelle index. WICHTIG: Das erste Element hat den Index 0. Es ist 0 <= index < size()"));

        this.addMethod(new Method("indexOf", new Parameterlist([
            { identifier: "o", type: typeA, declaration: null, usagePositions: null, isFinal: true }
        ]), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let object: Value = parameters[1];
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.indexOf(object);

            }, true, false, "Gibt den Index des Elements o zurück. Gibt -1 zurück, wenn die Liste das Element o nicht enthält. WICHTIG: Das erste Element hat den Index 0, das letzte den Index size() - 1. "));

        this.addMethod(new Method("addAll", new Parameterlist([
            { identifier: "c", type: this, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let object: RuntimeObject = parameters[1].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.adAll(object);

            },
            true, false, "Fügt alle Elemente von c dieser Collection hinzu."));

        this.addMethod(new Method("clear", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.clear();

            },
            true, false, "Entfernt alle Element aus dieser Collection."));

        this.addMethod(new Method("contains", new Parameterlist([
            { identifier: "o", type: typeA, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let object: Value = parameters[1];
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.contains(object);

            },
            true, false, "Testet, ob die Collection das Element enthält."));

        this.addMethod(new Method("remove", new Parameterlist([
            { identifier: "o", type: typeA, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let object: Value = parameters[1];
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.removeObject(object);

            },
            true, false, "Entfernt das Element o aus der Collection. Gibt true zurück, wenn die Collection das Element enthalten hatte."));

        this.addMethod(new Method("isEmpty", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.isEmpty();

            },
            true, false, "Testet, ob die Collection das leer ist."));

        this.addMethod(new Method("size", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.size();

            },
            true, false, "Gibt die Anzahl der Elemente der Collection zurück."));

        this.addMethod(new Method("toString", new Parameterlist([]), stringPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.to_String();

            }, false, false));

    }

}

export class ListHelper {

    valueArray: Value[] = [];
    objectArray: any[] = []; // wird mitgeführt, um schnelle indexOf-Operationen zu ermöglichen

    constructor(private runtimeObject: RuntimeObject, public interpreter: Interpreter, private module: Module) {
    }

    allElementsPrimitive(): boolean {
        for (let v of this.valueArray) {
            if (!(v.type instanceof PrimitiveType || ["String", "_Double", "Integer", "Boolean" ,"Character"].indexOf(v.type.identifier) >= 0)) {
                return false;
                break;
            }
        }
        return true;
    }

    to_String(): any {

        if (this.allElementsPrimitive()) {
            return "[" + this.objectArray.map(o => "" + o).join(", ") + "]";
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
            let value = this.valueArray[i];
            if (value.value == null || value.type instanceof PrimitiveType || value.type instanceof StringPrimitiveType) {
                statements.push({
                    type: TokenType.pushConstant,
                    dataType: stringPrimitiveType,
                    value: value.value == null ? "null" : value.type.castTo(value, stringPrimitiveType).value,
                    position: position,
                    stepFinished: false
                });
            } else {
                statements.push({
                    type: TokenType.pushConstant,
                    dataType: value.type,
                    value: value.value,
                    stepFinished: false,
                    position: position
                });
                statements.push({
                    type: TokenType.callMethod,
                    method: (<Klass | Interface | Enum>value.type).getMethod("toString", toStringParameters),
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
        this.interpreter.runTimer(method, [], () => {}, true);

        return "";
    }

    adAll(object: RuntimeObject): boolean {

        let ah: ListHelper = object.intrinsicData["ListHelper"];
        if (ah != null) {
            this.valueArray = this.valueArray.concat(ah.valueArray);
            this.objectArray = this.objectArray.concat(ah.objectArray);
        }

        return true;
    }


    get(index: number): Value {
        if (index >= 0 && index < this.valueArray.length) {
            return this.valueArray[index];
        }
        this.interpreter.throwException("Der ArrayList-Index ist außerhalb des Intervalls von 0 bis " + (this.valueArray.length - 1) + ". ")
        return null;
    }

    remove(index: number): Value {

        if (index >= 0 && index < this.valueArray.length) {
            this.valueArray.splice(index, 1);
            this.objectArray.splice(index, 1);
            return null;
        }

        this.interpreter.throwException("Der ArrayList-Index ist außerhalb des Intervalls von 0 bis " + (this.valueArray.length - 1) + ". ")

        return null;
    }

    add(r: Value, index?): boolean {
        if(index == null){
            this.valueArray.push(r);
            this.objectArray.push(r.value);
        } else {
            if(index <= this.objectArray.length && index >= 0){
                this.valueArray.splice(index, 0, r);
                this.objectArray.splice(index, 0, r.value);
            } else {
                this.interpreter.throwException("Der ArrayList-Index ist außerhalb des Intervalls von 0 bis " + (this.valueArray.length - 1) + ". ")
            }
        }
        return true;
    }

    pop(): any {
        if (this.objectArray.length == 0) {
            this.interpreter.throwException("Der ArrayList-Index ist außerhalb des Intervalls von 0 bis " + (this.valueArray.length - 1) + ". ")
            return null;
        } else {
            this.valueArray.pop();
            return this.objectArray.pop();
        }
    }

    peek(): any {
        if (this.objectArray.length == 0) {
            this.interpreter.throwException("Der ArrayList-Index ist außerhalb des Intervalls von 0 bis " + (this.valueArray.length - 1) + ". ")
            return null;
        } else {
            return this.objectArray[this.objectArray.length - 1];
        }
    }

    indexOf(o: Value): number {
        return this.objectArray.indexOf(o.value);
    }

    size(): number {
        return this.objectArray.length;
    }

    isEmpty(): boolean {
        return this.valueArray.length == 0;
    }

    removeObject(object: Value) {
        let index = this.objectArray.indexOf(object.value);
        if (index >= 0) {
            this.objectArray.splice(index, 1);
            this.valueArray.splice(index, 1);
        }
    }

    contains(object: Value): any {
        return this.objectArray.indexOf(object.value) >= 0;
    }

    clear() {
        this.valueArray = [];
        this.objectArray = [];
    }

    peek_last_or_null(): any {
        if (this.objectArray.length == 0) {
            return null;
        } else {
            return this.objectArray[this.objectArray.length - 1];
        }
    }
    peek_first_or_null(): any {
        if (this.objectArray.length == 0) {
            return null;
        } else {
            return this.objectArray[0];
        }
    }
    
    removeLast_or_error(){
        if (this.objectArray.length == 0) {
            return null;
        } else {
            this.valueArray.pop();
            return this.objectArray.pop();
        }
    };

    addLast(object: Value) {
        this.valueArray.push(object);
        this.objectArray.push(object.value);
        return true;
    }
    addFirst(object: Value): any {
        this.valueArray.splice(0, 0, object);
        this.objectArray.splice(0, 0, object.value);
        return true;
    }
    removeFirstOccurrence(object: Value): boolean {
        let index = this.objectArray.indexOf(object.value);
        if(index >= 0){
            this.valueArray.splice(index, 1);
            this.objectArray.splice(index, 1);
            return true;
        }
        return false;
    }

    peek_or_null(): any {
        if (this.objectArray.length == 0) {
            return null;
        } else {
            return this.objectArray[this.objectArray.length - 1];
        }
    }

    poll_or_null(): any {
        if (this.objectArray.length == 0) {
            return null;
        } else {
            this.valueArray.pop();
            return this.objectArray.pop();
        }
    }

    removeFirst_or_error(): any {
        if(this.objectArray.length == 0){
            this.interpreter.throwException("Der ArrayList-Index ist außerhalb des Intervalls von 0 bis " + (this.valueArray.length - 1) + ". ")
        } else {
            let object = this.objectArray[0];
            this.objectArray.splice(0, 1);
            this.valueArray.splice(0, 1);
            return object;
        }
    }


}
