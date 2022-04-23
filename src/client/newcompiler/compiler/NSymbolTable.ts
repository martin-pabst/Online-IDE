import { TextPosition } from "src/client/compiler/lexer/Token.js";
import { NClass } from "../types/NClass.js";
import { NMethodInfo, NVariable } from "../types/NewType.js";

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


    
}