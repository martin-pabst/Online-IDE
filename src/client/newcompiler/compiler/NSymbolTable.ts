import { TextPosition } from "src/client/compiler/lexer/Token.js";
import { NMethodInfo, NVariable } from "../types/NAttributeMethod.js";
import { NClass } from "../types/NClass.js";

export class NSymbolTable {
    parent: NSymbolTable; // SymbolTable of parent scope
    positionFrom: TextPosition;
    positionTo: TextPosition;

    beginsNewStackframe: boolean = false;
    stackframeSize: number;

    childSymbolTables: NSymbolTable[] = [];

    variableMap: Map<string, NVariable> = new Map();

    classContext: NClass = null;
    classContextIsStatic: boolean = false;
    method: NMethodInfo = null;

    constructor(parentSymbolTable: NSymbolTable, positionFrom: TextPosition, positionTo: TextPosition) {

        this.parent = parentSymbolTable;

        this.positionFrom = positionFrom;
        this.positionTo = positionTo;

        this.classContext = parentSymbolTable == null ? null : parentSymbolTable.classContext;

        if (this.parent != null) {
            this.parent.childSymbolTables.push(this);
            this.method = this.parent.method;
        }
    }

    getImitation(): NSymbolTable {
        let imitation = new NSymbolTable(null, { line: 1, column: 1, length: 0 }, { line: 1, column: 10000, length: 0 });

        imitation.beginsNewStackframe = true;
        let st: NSymbolTable = this;

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

    
}