import { QueryResult } from "../../tools/database/DatabaseTool.js";
import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { booleanPrimitiveType, charPrimitiveType, doublePrimitiveType, floatPrimitiveType, intPrimitiveType, StringPrimitiveType, stringPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist, Type } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { Interpreter } from "../../interpreter/Interpreter.js";

export class ResultSetClass extends Klass {

    constructor(module: Module) {
        super("ResultSet", module, "Ein ResultSet-Objekt speichert das Ergebnis einer Abfrage an die Datenbank.");

        let resultSetType = <Klass>module.typeStore.getType("ResultSet");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));
 
        this.addMethod(new Method("next", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rsh: ResultsetHelper = o.intrinsicData["Helper"];
                return rsh.next();

            }, false, false, 'Bewegt den "Cursor" zum nächsten Datensatz und gibt genau dann true zurück, wenn noch ein Datensatz da ist.',
            false));

        this.addMethod(new Method("size", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rsh: ResultsetHelper = o.intrinsicData["Helper"];
                return rsh.size();

            }, false, false, 'Gibt die Anzahl der Zeilen der Ergebnistabelle zurück.',
            false));

        this.addMethod(new Method("getIndex", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rsh: ResultsetHelper = o.intrinsicData["Helper"];
                return rsh.cursor;

            }, false, false, 'Gibt den Index zurück, auf dem der "Cursor" in der Liste der Zeilen der Ergebnistabelle steht. Vor dem ersten Aufruf von next() wird -1 zurückgegeben.',
            false));

        this.addMethod(new Method("wasNull", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rsh: ResultsetHelper = o.intrinsicData["Helper"];
                return rsh.wasNull;

            }, false, false, 'Gibt genau dann true zurück, wenn der zuletzt gelesene Wert null war.',
            false));

        let types = [booleanPrimitiveType, intPrimitiveType, floatPrimitiveType, doublePrimitiveType, stringPrimitiveType];

        for(let type of types){

            let typeIdFirstUppercase = type.identifier.charAt(0).toUpperCase() + type.identifier.substring(1);

            this.addMethod(new Method("get"+typeIdFirstUppercase, new Parameterlist([
                { identifier: "columnIndex", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            ]), type,
                (parameters) => {
    
                    let o: RuntimeObject = parameters[0].value;
                    let columnIndex: number = parameters[1].value;

                    let rsh: ResultsetHelper = o.intrinsicData["Helper"];

                    let interpreter = module.main.getInterpreter();
                    if(columnIndex < 1 || columnIndex > rsh.columnCount()){
                        interpreter.throwException("Das Ergebnis hat keine Spalte " + columnIndex + ".");
                        return;
                    }

                    if(rsh.isAfterLast()){
                        interpreter.throwException("Der Cursor befindet sich hinter dem letzten Datensatz des ResultSet.");
                    }
    
                    return rsh.getValue(type, columnIndex, module.main.getInterpreter());
    
                }, false, false, 'Gibt den Wert der Spalte mit dem angegebenen Spaltenindex als ' + type.identifier + " zurück.",
                false));

            this.addMethod(new Method("get"+typeIdFirstUppercase, new Parameterlist([
                { identifier: "columnLabel", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            ]), type,
                (parameters) => {
    
                    let o: RuntimeObject = parameters[0].value;
                    let columnLabel: string = parameters[1].value;

                    let rsh: ResultsetHelper = o.intrinsicData["Helper"];

                    let interpreter = module.main.getInterpreter();


                    if(rsh.isAfterLast()){
                        interpreter.throwException("Der Cursor befindet sich hinter dem letzten Datensatz des ResultSet.");
                    }

                    let columnIndex: number = rsh.getColumnIndex(columnLabel);
                    if(columnIndex < 0){
                        interpreter.throwException("Das Ergebnis hat keine Spalte mit dem Bezeichner " + columnLabel + ".");
                        return;
                    }
    
                    return rsh.getValue(type, columnIndex, module.main.getInterpreter());
    
                }, false, false, 'Gibt den Wert der Spalte mit dem angegebenen Spaltenindex als ' + type.identifier + " zurück.",
                false));

        }


        

    }

}


export class ResultsetHelper {
    cursor: number = -1;
    wasNull: boolean = false;

    constructor(private result: QueryResult){

    }

    getColumnIndex(columnLabel: string): number {
        
        columnLabel = columnLabel.toLocaleLowerCase();

        let index = this.result.columns.findIndex((value, index) => {return value.toLocaleLowerCase() == columnLabel});
        if(index < 0) return index;
        return index + 1;
    }


    next(): boolean {
        this.cursor++;
        if(this.result == null) return false;
        return this.cursor < this.result.values.length;
    }

    size(): number {
        return this.result.values.length;
    }

    columnCount(): number {
        return this.result.columns.length;
    }

    getValue(type: Type, columnIndex: number, interpreter: Interpreter) {

        if(this.cursor < 0) this.cursor = 0;

        if(this.cursor >= this.result.values.length){
            interpreter.throwException("Es wurde versucht, auf den " + (this.cursor + 1) + ". Datensatz zuzugreifen, das ResultSet hat aber nur " + this.result.values.length + " Datensätze.");
            return null;
        }

        let value = this.result.values[this.cursor][columnIndex - 1];
        this.wasNull = value == null;

        if(type == stringPrimitiveType){
            return value == null ? null : "" + value;
        }

        if(type == intPrimitiveType){
            if(value == null || !(typeof value == "number")){
                return 0;
            }
            return Math.floor(value);
        }

        if(type == floatPrimitiveType || type == doublePrimitiveType){
            if(value == null || !(typeof value == "number")){
                return 0;
            }
            return value;
        }

        if(type == booleanPrimitiveType){
            if(value == null) return false;
            return (value + "").indexOf("1") >= 0;
        }

    }

    isAfterLast(): boolean {
        return this.cursor > this.result.values.length - 1;
    }


}