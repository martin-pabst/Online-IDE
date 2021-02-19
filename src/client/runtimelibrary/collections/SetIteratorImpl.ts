import { Module } from "../../compiler/parser/Module.js";
import { Interface, Klass, TypeVariable } from "../../compiler/types/Class.js";
import { booleanPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist, Value } from "../../compiler/types/Types.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { SetHelper } from "./SetHelper.js";

export type IteratorKind = "descending" | "ascending";

export class SetIteratorImplClass extends Klass {

    public static getIterator(MapHelper: SetHelper, interpreter: Interpreter, module: Module, kind: IteratorKind): Value {

        let klass = <Klass>module.typeStore.getType("SetIteratorImpl");
        let rt: RuntimeObject = new RuntimeObject(klass);
        rt.intrinsicData["SetIteratorHelper"] = new SetIteratorHelper(MapHelper, interpreter, kind);

        return {
            value: rt,
            type: klass
        }
    }

    constructor(module: Module) {

        super("SetIteratorImpl", module);

        let objectType = module.typeStore.getType("Object");

        this.setBaseClass(<Klass>objectType);

        let typeE: Klass = (<Klass>objectType).clone();
        typeE.identifier = "E";
        typeE.isTypeVariable = true;

        let tvE: TypeVariable = {
            identifier: "E",
            scopeFrom: { line: 1, column: 1, length: 1 },
            scopeTo: { line: 1, column: 1, length: 1 },
            type: typeE
        };

        this.typeVariables.push(tvE);

        let iteratorInterface = (<Interface>module.typeStore.getType("Iterator")).clone();
        iteratorInterface.typeVariables = [tvE];

        this.implements.push(iteratorInterface);

        this.addMethod(new Method("hasNext", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: SetIteratorHelper = o.intrinsicData["SetIteratorHelper"];

                return ah.hasNext();

            },
            false, false, "Gibt genau dann true zurück, wenn sich noch mindestens ein weiteres Element in der Collection befindet."));

        this.addMethod(new Method("next", new Parameterlist([
        ]), typeE,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: SetIteratorHelper = o.intrinsicData["SetIteratorHelper"];

                return ah.next();

            },
            false, false, "Gibt das nächste Element der Collection zurück."));

        this.addMethod(new Method("remove", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: SetIteratorHelper = o.intrinsicData["SetIteratorHelper"];

                return ah.remove();

            },
            false, false, "Löscht das letzte durch next zurückgegebene Objekt. Diese Methode beeinflusst nicht, welches Element als nächstes durch next zurückgegeben wird."));



    }
}

class SetIteratorHelper {

    nextPos: number;

    constructor(private MapHelper: SetHelper, private interpreter: Interpreter, private kind: IteratorKind) {
        switch (kind) {
            case "ascending": this.nextPos = 0; break;
            case "descending": this.nextPos = MapHelper.valueArray.length - 1; break;
        }
    }

    remove() {
        switch (this.kind) {
            case "ascending":
                if (this.nextPos == 0) {
                    this.interpreter.throwException("Die Methode remove() des Iterators wurde aufgerufen, obwohl noch nie next() aufgerufen wurde.")
                } else if (this.nextPos > this.MapHelper.valueArray.length - 1) {
                    this.interpreter.throwException("Die Methode remove() des Iterators wurde aufgerufen, obwohl das letzte Element schon beim vorherigen Aufruf zurückgegeben worden war.")
                } else {
                    this.MapHelper.removeObject(this.MapHelper.valueArray[this.nextPos - 1].value);
                    this.nextPos -= 1;
                }
                break;
            case "descending":
                if (this.nextPos == this.MapHelper.valueArray.length - 1) {
                    this.interpreter.throwException("Die Methode remove() des Iterators wurde aufgerufen, obwohl noch nie next() aufgerufen wurde.")
                } else if (this.nextPos < 0) {
                    this.interpreter.throwException("Die Methode remove() des Iterators wurde aufgerufen, obwohl das letzte Element schon beim vorherigen Aufruf zurückgegeben worden war.")
                } else {
                    this.MapHelper.removeObject(this.MapHelper.valueArray[this.nextPos + 1].value);
                    this.nextPos += 1;
                }
                break;
        }
    }

    next(): any {
        switch (this.kind) {
            case "ascending":
                if (this.nextPos > this.MapHelper.valueArray.length - 1) {
                    this.interpreter.throwException("Die Methode next() des Iterators wurde aufgerufen, obwohl das letzte Element schon beim vorherigen Aufruf zurückgegeben worden war.")
                    return null;
                }
                return this.MapHelper.valueArray[this.nextPos++];
            case "descending":
                if (this.nextPos < 0) {
                    this.interpreter.throwException("Die Methode next() des Iterators wurde aufgerufen, obwohl das letzte Element schon beim vorherigen Aufruf zurückgegeben worden war.")
                    return null;
                }
                return this.MapHelper.valueArray[this.nextPos--];
        }
    }

    hasNext(): boolean {
        switch (this.kind) {
            case "ascending":
                return this.nextPos < this.MapHelper.valueArray.length;
            case "descending":
                return this.nextPos >= 0;
        }
    }



}