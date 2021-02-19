import { Module } from "../../compiler/parser/Module.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { Interface, TypeVariable, Klass } from "../../compiler/types/Class.js";
import { voidPrimitiveType, booleanPrimitiveType, intPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";

export class DequeClass extends Interface {

    constructor(module: Module) {

        super("Deque", module, "Interface für Liste mit zweiseitigem Zugriff (insbesondere Anfügen an beiden Enden)");

        let objectType = <Klass>module.typeStore.getType("Object");

        let typeE: Klass = objectType.clone();
        typeE.identifier = "E";
        typeE.isTypeVariable = true;

        let tvE: TypeVariable = {
            identifier: "E",
            scopeFrom: { line: 1, column: 1, length: 1 },
            scopeTo: { line: 1, column: 1, length: 1 },
            type: typeE
        };

        this.typeVariables.push(tvE);

        let QueueInterface = (<Interface>module.typeStore.getType("Queue")).clone();
        QueueInterface.typeVariables = [tvE];

        this.extends.push(QueueInterface);


        this.addMethod(new Method("removeFirstOccurrence", new Parameterlist([
            { identifier: "element", type: typeE, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            null,  // no implementation!
            true, false, "Löscht das Erste Vorkommen des Objekts. Gibt true zurück, wenn die Liste dadurch verändert wurde."));

        this.addMethod(new Method("removeLastOccurrence", new Parameterlist([
            { identifier: "element", type: typeE, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            null,  // no implementation!
            true, false, "Löscht das Letzte Vorkommen des Objekts. Gibt true zurück, wenn die Liste dadurch verändert wurde."));

        this.addMethod(new Method("addFirst", new Parameterlist([
            { identifier: "element", type: typeE, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            null,  // no implementation!
            true, false, "Fügt das Element am Anfang der Liste hinzu."));

        this.addMethod(new Method("addLast", new Parameterlist([
            { identifier: "element", type: typeE, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            null,  // no implementation!
            true, false, "Fügt das Element am Ende der Liste hinzu."));

        this.addMethod(new Method("removeFirst", new Parameterlist([
        ]), typeE,
            null,  // no implementation!
            true, false, "Entfernt das Element am Anfang der Liste und gibt es zurück. Führt zum Fehler, wenn die Liste leer ist."));

        this.addMethod(new Method("removeLast", new Parameterlist([
        ]), typeE,
            null,  // no implementation!
            true, false, "Entfernt das Element am Ende der Liste und gibt es zurück. Führt zum Fehler, wenn die Liste leer ist."));

        this.addMethod(new Method("peekFirst", new Parameterlist([
        ]), typeE,
            null,  // no implementation!
            true, false, "Gibt das Element am Anfang der Liste zurück, entfernt es aber nicht. Gib null zurück, wenn die Liste leer ist."));

        this.addMethod(new Method("peekLast", new Parameterlist([
        ]), typeE,
            null,  // no implementation!
            true, false, "Gibt das Element am Ende der Liste zurück, entfernt es aber nicht. Gib null zurück, wenn die Liste leer ist."));

        this.addMethod(new Method("push", new Parameterlist([
            { identifier: "element", type: typeE, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            null,  // no implementation!
            true, false, "Fügt das Element am Ende der Liste hinzu."));

        this.addMethod(new Method("pop", new Parameterlist([
        ]), typeE,
            null,  // no implementation!
            true, false, "Gibt das Element am Ende der Liste zurück und entfernt es von der Liste. Erzeugt einen Fehler, wenn die Liste leer ist."));

        let iteratorType = (<Klass>module.typeStore.getType("Iterator")).clone();
        iteratorType.typeVariables = [tvE];

        this.addMethod(new Method("descendingIterator", new Parameterlist([
        ]), iteratorType,
            null,  // no implementation!
            true, false, "Gibt einen Iterator über die Elemente dieser Collection zurück, der die Liste in umgekehrter Reihenfolge (Ende -> Anfang) durchläuft."));

    }


}
