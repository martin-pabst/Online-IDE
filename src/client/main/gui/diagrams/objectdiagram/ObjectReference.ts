import { Value } from "../../../../compiler/types/Types.js";
import { ObjectElement } from "./ObjectElement.js";

export class ObjectReference {

    bidirectional: boolean = false;

    $arrow: Element;

    constructor(public objectFrom: ObjectElement, public objectTo: ObjectElement, parent: Element){

    }

    render(){
        // TODO
    }

    public createElement(name: string, parent: Element = null, attributes?:
        { [key: string]: string }): JQuery<Element> {

        let ns = 'http://www.w3.org/2000/svg';
        let $element = jQuery(document.createElementNS(ns, name));

        if(attributes != null) $element.attr(attributes);

        if(parent != null) parent.appendChild($element[0]);

        return $element;

    }


}