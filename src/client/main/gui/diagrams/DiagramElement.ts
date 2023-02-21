import { DiagramUnitCm, Diagram } from "./Diagram.js"; 
import { Rectangle } from "./classdiagram/Router.js";
import jQuery from 'jquery';

export enum Alignment {
    left, center, right
}

export type TextLine = {
    type: "text",
    text: string,
    tooltip?: string,
    alignment?: Alignment,
    bold?: boolean,
    italics?: boolean,
    textHeightCm?: number,
    textWidthCm?: number,
    yCm?: number
    $element?: JQuery<SVGTextElement>,
    onClick?: () => void
}

export type HorizontalLine = {
    type: "line",
    $element?: JQuery<SVGLineElement>,
    thicknessCm: number,
    yCm?: number
}

export abstract class DiagramElement {

    public static cmPerPx: number = 2.54/96;

    public $element: JQuery<Element>;

    public leftCm: number = 0; // x-Koordinate in cm
    public topCm: number = 0; // y-Koordinate in cm
 
    public widthCm: number;
    public heightCm: number; 

    protected lines: (TextLine | HorizontalLine)[] = [];

    public backgroundColor: string = "#ffffff";

    constructor(protected parent: Element) {

    }

    getRoutingRectangle(): Rectangle{
        return {
            left: Math.round(this.leftCm/DiagramUnitCm),
            top: Math.round(this.topCm/DiagramUnitCm),
            width: Math.round(this.widthCm/DiagramUnitCm),
            height: Math.round(this.heightCm/DiagramUnitCm) 
        };
    }

    public show(){
        if(this.$element == null) return;
        this.$element.show();
    }

    public hide(){
        if(this.$element == null) return;
        this.$element.hide();
    }

    detach() {
        if(this.$element == null) return;
        this.$element.detach();        
    }

    remove() {
        if(this.$element == null) return;
        this.$element.remove();
        this.$element = null;        
    }

    appendTo($element: JQuery<Element>){
        $element.append(this.$element);
    }

    public clear(){
        if(this.$element == null) return;
        this.$element.empty();
        this.lines = [];
    }

    public move(xCm: number, yCm: number, withRaster: boolean, adjustToRaster: boolean = false) {
        this.leftCm += xCm;
        this.topCm += yCm;

        let x = this.leftCm;
        let y = this.topCm;

        if(withRaster){
            x = Math.round(x/DiagramUnitCm)*DiagramUnitCm;
            y = Math.round(y/DiagramUnitCm)*DiagramUnitCm;
        }

        if(adjustToRaster){
            this.leftCm = x;
            this.topCm = y;
        }

        jQuery(this.$element).css("transform", "translate(" + x + "cm," + y + "cm)");
    }

    public moveTo(xCm: number, yCm: number, withRaster: boolean) {
        this.move(xCm - this.leftCm, yCm - this.topCm, withRaster);
    }

    public createElement(name: string, parent: Element = null, attributes?:
        { [key: string]: string }): JQuery<Element> {

        let ns = 'http://www.w3.org/2000/svg';
        let $element = jQuery(document.createElementNS(ns, name));

        if(attributes != null) $element.attr(attributes);

        if(parent != null) parent.appendChild($element[0]);

        return $element;

    }

    public createTextElement(text: string, parent: Element = null, attributes?:
        { [key: string]: string }): JQuery<Element> {

            let $element: JQuery<Element> = this.createElement("text", parent, {
                font: "16px Roboto",
                "font-family": "sans-serif",
                fill: "#000",
                "alignment-baseline":"hanging",
                "dominant-baseline":"hanging"
            });

            if(attributes != null) $element.attr(attributes);

            $element.text(text);

            return $element;
    }

    public getTextMetrics(textElement: JQuery<SVGTextElement>):{height: number, width: number}{
        let bbox:DOMRect = textElement[0].getBBox();
        
        return {
            height: bbox.height * DiagramElement.cmPerPx,
            width: bbox.width * DiagramElement.cmPerPx
        }

    }

    public addTextLine(line: TextLine | HorizontalLine){

        this.lines.push(line);

        if(line.type == "text"){
            if(line.alignment == null) line.alignment = Alignment.left;
            if(line.bold == null) line.bold = false;
            if(line.italics == null) line.italics = false;
        }

    }

    public render(){

        let $group = this.$element;
        if($group == null){
            $group = this.createElement("g", this.parent);
            $group.addClass("svg_draggable");
            $group.addClass("svg_all_pointer_events");
            this.$element = $group;
            jQuery(this.$element).css("transform", "translate(" + this.leftCm + "cm," + this.topCm + "cm)");
        }

        let $rect = this.createElement("rect", $group[0]);

        let textPosYCm: number = 0.1;
        let maxWidthCm: number = 0;

        let first: boolean = true;
        for(let line of this.lines){
            if(line.type == "text"){
                if(first) textPosYCm += 0.1;
                first = false;
                line.yCm = textPosYCm;
                line.$element = <JQuery<SVGTextElement>>this.createTextElement(line.text, $group[0], {
                    "font-weight" : line.bold?"bold":"normal",
                    "font-size": "12pt",
                    "font-style": line.italics?"italic":"normal",
                    "text-anchor": line.alignment == Alignment.left ? "start" : line.alignment == Alignment.center ? "middle" : "end",
                    "cursor": line.onClick == null ? "" : "pointer"
                } );

                line.$element.css("transform", "translate(0cm,0cm)");
                // line.$element.css("transform", "translate(0cm," + textPosYCm + "cm)");
                // if(line.onClick != null){
                //     line.$element.addClass("clickable");
                //     line.$element.on("mousedown", (event) => {
                //         //@ts-ignore
                //         line.onClick();
                //         event.stopPropagation();
                //     })
                // }
                let metrics = this.getTextMetrics(line.$element);
                line.textHeightCm = metrics.height;
                line.textWidthCm = metrics.width;
                maxWidthCm = Math.max(maxWidthCm, line.textWidthCm);
                textPosYCm += line.textHeightCm;
                if(line.tooltip != null){
                    let $tooltip = this.createElement("title", line.$element[0]);
                    $tooltip.text(line.tooltip);
                }
            } else {
                line.yCm = textPosYCm + line.thicknessCm/2;
                textPosYCm += line.thicknessCm + 0.1;
                first = true;
            }
        }

        let width = 2 * 0.05 + 2*0.2 + maxWidthCm;
        this.widthCm = (Math.trunc(width/DiagramUnitCm) + 1)*DiagramUnitCm;
        this.heightCm = (Math.trunc(textPosYCm/DiagramUnitCm) + 1)*DiagramUnitCm;

        let textLeft = 0.05 + 0.2;
        let textCenter = width/2;
        let textRight = width - textLeft;

        $rect.css({
            width: this.widthCm + "cm",
            height: this.heightCm + "cm",
            fill: this.backgroundColor,
            stroke: "#000",
            "stroke-width": "0.05cm"
        });


        for(let line of this.lines){
            if(line.type == "text"){

                let x: number;
                switch(line.alignment){
                    case Alignment.center: x = textCenter; break;
                    case Alignment.left: x = textLeft; break;
                    case Alignment.right: x = textRight; break;
                }

                // Unfortunately we have to wrap Text-Elements in <g> due to a bug in safari,
                // see 
                //@ts-ignore
                let $g = this.createElement("g", $group[0]);
                $g.append(line.$element);
                //@ts-ignore
                line.$element = $g;

                line.$element.css("transform", "translate(" + x + "cm,"+line.yCm + "cm)");

                if(line.onClick != null){
                    line.$element.addClass("clickable");
                    line.$element.on("mousedown", (event) => {
                        //@ts-ignore
                        line.onClick();
                        event.stopPropagation();
                    })
                }


            } else {
                line.$element = <JQuery<SVGLineElement>>this.createElement("line", $group[0], {
                    x1: "0",
                    y1: line.yCm + "cm",
                    x2: this.widthCm + "cm",
                    y2: line.yCm + "cm"
                });

                line.$element.css({
                    stroke: "#000",
                    "stroke-width": line.thicknessCm + "cm"        
                });

            }
        }


        


    }


}

