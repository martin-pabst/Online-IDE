import { DiagramElement } from "../DiagramElement.js";
import { Value } from "../../../../compiler/types/Types.js";
import { ObjectDiagram } from "./ObjectDiagram.js";

export class ObjectElement extends DiagramElement {

    constructor(public diagram: ObjectDiagram, public value: Value){
        super(diagram.svgElement);
    }


}