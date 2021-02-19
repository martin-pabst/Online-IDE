import { Main } from "../../../Main.js";
import { ObjectDiagram } from "./ObjectDiagram.js";
import { MainBase } from "../../../MainBase.js";


export abstract class ObjectDiagramVariant {

    constructor(protected main: MainBase, protected objectDiagram: ObjectDiagram){

    }

    abstract getName(): string;

    abstract getSettingsElement(): JQuery<HTMLElement>;
    
    abstract updateDiagram(): void;

    abstract clear(): void;

}