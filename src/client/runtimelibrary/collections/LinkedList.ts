import { Module } from "../../compiler/parser/Module.js";
import { Interface, Klass, TypeVariable } from "../../compiler/types/Class.js";
import { booleanPrimitiveType, intPrimitiveType, stringPrimitiveType, objectType, StringPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist, Value, PrimitiveType } from "../../compiler/types/Types.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { Program, Statement } from "../../compiler/parser/Program.js";
import { TokenType, TextPosition } from "../../compiler/lexer/Token.js";
import { ArrayType } from "../../compiler/types/Array.js";
import { ListIteratorImplClass } from "./ListIteratorImpl.js";
import { Enum } from "../../compiler/types/Enum.js";
import { ListHelper } from "./ArrayList.js";

export class LinkedListClass extends Klass {

    constructor(module: Module) {

        super("LinkedList", module, "Verkettete Liste");

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

        let dequeInterface = (<Interface>module.typeStore.getType("Deque")).clone();
        dequeInterface.typeVariables = [tvA];

        this.implements.push(dequeInterface);

        let iteratorType = (<Klass>module.typeStore.getType("Iterator")).clone();
        iteratorType.typeVariables = [tvA];

        this.addMethod(new Method("LinkedList", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let ah = new ListHelper(o, module.main.getInterpreter(), module);
                o.intrinsicData["ListHelper"] = ah;

            }, false, false, 'Instanziert eine neue LinkedList', true));

        this.addMethod(new Method("iterator", new Parameterlist([
        ]), iteratorType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ListIteratorImplClass.getIterator(ah, ah.interpreter, module, "ascending").value;

            }, false, false, "Gibt einen Iterator über die Elemente dieser Collection zurück."));

        this.addMethod(new Method("descendingIterator", new Parameterlist([
        ]), iteratorType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ListIteratorImplClass.getIterator(ah, ah.interpreter, module, "descending").value;

            }, false, false, "Gibt einen Iterator über die Elemente dieser Collection zurück, der die Liste in umgekehrter Reihenfolge durchläuft (Ende -> Anfang)."));

        this.addMethod(new Method("add", new Parameterlist([
            { identifier: "element", type: typeA, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let r: Value = parameters[1];
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.add(r);

            }, false, false, "Fügt der Liste am Ende ein Element hinzu. Gibt genau dann true zurück, wenn sich der Zustand der Liste dadurch geändert hat."));

        this.addMethod(new Method("addAll", new Parameterlist([
            { identifier: "c", type: this, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let object: RuntimeObject = parameters[1].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.addAll(object);

            },
            false, false, "Fügt alle Elemente von c dieser Collection hinzu."));

        this.addMethod(new Method("clear", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.clear();

            },
            false, false, "Entfernt alle Element aus dieser Collection."));

        this.addMethod(new Method("contains", new Parameterlist([
            { identifier: "o", type: typeA, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let object: Value = parameters[1];
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.contains(object);

            },
            false, false, "Testet, ob die Collection das Element enthält."));

        this.addMethod(new Method("remove", new Parameterlist([
            { identifier: "o", type: typeA, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let object: Value = parameters[1];
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.removeObject(object);

            },
            false, false, "Entfernt das Element o aus der Collection. Gibt true zurück, wenn die Collection das Element enthalten hatte."));

        this.addMethod(new Method("isEmpty", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.isEmpty();

            },
            false, false, "Testet, ob die Collection das leer ist."));

        this.addMethod(new Method("size", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.size();

            },
            false, false, "Gibt die Anzahl der Elemente der Collection zurück."));

        this.addMethod(new Method("toString", new Parameterlist([]), stringPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.to_String();

            }, false, false));


        this.addMethod(new Method("remove", new Parameterlist([
        ]), typeA,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.removeFirst_or_error();

            },
            false, false, "Entfernt das Element am Kopf der Liste und gibt es zurück. Führt zum Fehler, wenn die Liste leer ist."));

        this.addMethod(new Method("poll", new Parameterlist([
        ]), typeA,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let object: Value = parameters[1];
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.poll_or_null();

            },
            false, false, "Entfernt das Element am Kopf der Liste und gibt es zurück. Gibt null zurück, wenn die Liste leer ist."));

        this.addMethod(new Method("peek", new Parameterlist([
        ]), typeA,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.peek_or_null();

            },
            false, false, "Gibt das Element am Kopf der Liste zurück, entfernt es aber nicht. Gib null zurück, wenn die Liste leer ist."));

        this.addMethod(new Method("removeFirstOccurrence", new Parameterlist([
            { identifier: "element", type: typeA, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let object: Value = parameters[1];
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.removeFirstOccurrence(object);

            },
            false, false, "Löscht das Erste Vorkommen des Objekts. Gibt true zurück, wenn die Liste dadurch verändert wurde."));

        this.addMethod(new Method("removeLastOccurrence", new Parameterlist([
            { identifier: "element", type: typeA, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let object: Value = parameters[1];
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.removeFirstOccurrence(object);

            },
            false, false, "Löscht das Letzte Vorkommen des Objekts. Gibt true zurück, wenn die Liste dadurch verändert wurde."));

        this.addMethod(new Method("addFirst", new Parameterlist([
            { identifier: "element", type: typeA, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let object: Value = parameters[1];
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.addFirst(object);

            },
            false, false, "Fügt das Element am Anfang der Liste hinzu."));

        this.addMethod(new Method("addLast", new Parameterlist([
            { identifier: "element", type: typeA, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let object: Value = parameters[1];
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.addLast(object);

            },
            false, false, "Fügt das Element am Ende der Liste hinzu."));

        this.addMethod(new Method("removeFirst", new Parameterlist([
        ]), typeA,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.removeFirst_or_error();

            },
            false, false, "Entfernt das Element am Anfang der Liste und gibt es zurück. Führt zum Fehler, wenn die Liste leer ist."));

        this.addMethod(new Method("removeLast", new Parameterlist([
        ]), typeA,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.removeLast_or_error();

            },
            false, false, "Entfernt das Element am Ende der Liste und gibt es zurück. Führt zum Fehler, wenn die Liste leer ist."));

        this.addMethod(new Method("peekFirst", new Parameterlist([
        ]), typeA,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.peek_first_or_null();

            },
            false, false, "Gibt das Element am Anfang der Liste zurück, entfernt es aber nicht. Gib null zurück, wenn die Liste leer ist."));

        this.addMethod(new Method("peekLast", new Parameterlist([
        ]), typeA,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.peek_last_or_null();

            },
            false, false, "Gibt das Element am Ende der Liste zurück, entfernt es aber nicht. Gib null zurück, wenn die Liste leer ist."));

        this.addMethod(new Method("push", new Parameterlist([
            { identifier: "element", type: typeA, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let object: Value = parameters[1];
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.add(object);

            },
            false, false, "Fügt das Element am Ende der Liste hinzu."));

        this.addMethod(new Method("pop", new Parameterlist([
        ]), typeA,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: ListHelper = o.intrinsicData["ListHelper"];

                return ah.pop();

            },
            false, false, "Gibt das Element am Ende der Liste zurück und entfernt es von der Liste. Erzeugt einen Fehler, wenn die Liste leer ist."));

    }

}

