import { TextPosition } from "../lexer/Token.js";
import { Type, Variable, Method } from "../types/Types.js";
import { Klass, StaticClass } from "../types/Class.js";
import { ArrayType } from "../types/Array.js";


export class SymbolTable {

    static maxId: number = 0;

    public id = SymbolTable.maxId++;

    parent: SymbolTable; // SymbolTable of parent scope
    positionFrom: TextPosition;
    positionTo: TextPosition;

    beginsNewStackframe: boolean = false;
    stackframeSize: number;

    childSymbolTables: SymbolTable[] = [];

    variableMap: Map<string, Variable> = new Map();

    classContext: Klass | StaticClass = null;
    method: Method = null;

    constructor(parentSymbolTable: SymbolTable, positionFrom: TextPosition, positionTo: TextPosition) {

        this.parent = parentSymbolTable;

        this.positionFrom = positionFrom;
        this.positionTo = positionTo;

        this.classContext = parentSymbolTable == null ? null : parentSymbolTable.classContext;

        if (this.parent != null) {
            this.parent.childSymbolTables.push(this);
            this.method = this.parent.method;
        }
    }

    getImitation(): SymbolTable {
        let imitation = new SymbolTable(null, { line: 1, column: 1, length: 0 }, { line: 1, column: 10000, length: 0 });

        imitation.beginsNewStackframe = true;
        let st: SymbolTable = this;

        let maxStackPos = -1;

        while (st != null) {
            if (st.classContext != null) {
                imitation.classContext = st.classContext;
            }

            st.variableMap.forEach((variable, identifier) => {

                if (imitation.variableMap.get(identifier) == null) {
                    imitation.variableMap.set(identifier, variable);
                }

                if (variable.stackPos > maxStackPos) {
                    maxStackPos = variable.stackPos;
                }

            });

            st = st.parent;

        }

        imitation.stackframeSize = maxStackPos + 1;

        return imitation;
    }



    getLocalVariableCompletionItems(rangeToReplace: monaco.IRange): monaco.languages.CompletionItem[] {

        let completionItems: monaco.languages.CompletionItem[] = [];

        this.variableMap.forEach((variable, identifier) => {

            //@ts-ignore
            if(identifier == 0) return;

            // TODO: Zu einem Objekt mit identifier == 0 kommt es, wenn man ArrayList<In tippt und dann <Strg + Leertaste>.

            if (variable != null && variable.type != null && variable.type instanceof ArrayType) {
                completionItems.push({
                    label: identifier + "[]",
                    insertText: identifier + "[$0]",
                    documentation: "Element des Arrays",
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: rangeToReplace
                });

            }
            
            completionItems.push({
                label: identifier,
                insertText: identifier,
                kind: monaco.languages.CompletionItemKind.Variable,
                range: rangeToReplace
            });


        });

        if (this.parent != null && this.parent.classContext == this.classContext) {
            completionItems = completionItems.concat(this.parent.getLocalVariableCompletionItems(rangeToReplace));
        }

        return completionItems;
    }

    findTableAtPosition(line: number, column: number): SymbolTable {

        if (!this.containsPosition(line, column)) {
            return null;
        }

        let shortestSymbolTableContainingPosition = null;
        let shortestPosition = 10000000;

        for (let st of this.childSymbolTables) {
            if (st.containsPosition(line, column)) {
                let st1 = st.findTableAtPosition(line, column);
                if (st1.positionTo.line - st1.positionFrom.line < shortestPosition) {
                    shortestSymbolTableContainingPosition = st1;
                    shortestPosition = st1.positionTo.line - st1.positionFrom.line;
                }
            }
            // if(st.containsPosition(line, column) && st.positionTo.line - st.positionFrom.line < shortestPosition){
            //     shortestSymbolTableContainingPosition = st;
            //     shortestPosition = st.positionTo.line - st.positionFrom.line;
            // }
        }

        if (shortestSymbolTableContainingPosition != null) {
            return shortestSymbolTableContainingPosition;
        } else {
            return this;
        }

    }

    containsPosition(line: number, column: number) {
        if (line < this.positionFrom.line || line > this.positionTo.line) {
            return false;
        }

        if (line == this.positionFrom.line) return column >= this.positionFrom.column;
        if (line == this.positionTo.line) return column <= this.positionTo.column;

        return true;

    }


}

