import { ZoomControl } from "./ZoomControl.js";
import { ClassBox } from "./classdiagram/ClassBox.js";
import { Rectangle, Point } from "./classdiagram/Router.js";
import { DiagramElement } from "./DiagramElement.js";
import { Main } from "../../Main.js";
import { MainBase } from "../../MainBase.js";

export var DiagramUnitCm = 0.2; // in cm

export class Diagram {

    zoomControl: ZoomControl;
    zoomfactor: number = 1.0;

    $canvas: JQuery<HTMLElement>;
    svgElement: Element;

    $menuButton: JQuery<HTMLElement>;

    defs: Element;
    style: Element;

    inlineStyles: { [selector: string]: { [key: string]: string } } = {};
    marginCm = 1.6;
    minDistance = 2.0;
    minWidthHeightCm = 10;
    widthCm = this.minWidthHeightCm;
    heightCm = this.minWidthHeightCm;

    $centerRectangle: JQuery<SVGElement>;

    constructor($htmlElement: JQuery<HTMLElement>, public main: MainBase){

        this.$menuButton = jQuery('<div class="jo_classDiagram_Menubutton jo_button jo_active img_menu-three-bars"></div>');
        $htmlElement.append(this.$menuButton);

        let $scrollpane = jQuery('<div></div>');
        $htmlElement.append($scrollpane);
        $scrollpane.addClass('jo_scrollable');
        $scrollpane.css({overflow: "auto", position: "relative", width: "100%", height: "100%"});

        this.$canvas = jQuery('<div class="jo_diagram-canvas"></div>');
        $scrollpane.append(this.$canvas);
        this.zoomControl = new ZoomControl($htmlElement, (factor: number) => {
            this.$canvas.css({
                transform: "scale(" + factor + ")"
            });
            this.zoomfactor = factor;
        });

        let ns = 'http://www.w3.org/2000/svg';
        this.svgElement = document.createElementNS(ns, 'svg');
        // jQuery(this.svgElement).css('pointer-events', 'none');
        jQuery(this.svgElement).addClass("jo_diagram-svg svg_all_pointer_events");

        // this.insertStyleElement({".svp_draggable": {cursor: "pointer"}});

        this.$canvas[0].appendChild(this.svgElement);

        this.$centerRectangle = <any>jQuery(this.createElement("rect", this.svgElement));

        this.$centerRectangle.css({fill: "#ffffff", "stroke": "none"});

        this.adjustCenterRectangle();

        let $svgElement =  jQuery(this.svgElement);

        let x: number;
        let y: number;

        $svgElement.on('mousedown', (ev1) => {
            x = ev1.screenX;
            y = ev1.screenY;
            
            jQuery(document).on('mousemove.diagram', (ev) => {
                let dx = ev.screenX - x;
                let dy = ev.screenY - y;
                x = ev.screenX;
                y = ev.screenY;
                $scrollpane.scrollLeft($scrollpane.scrollLeft() - dx);
                $scrollpane.scrollTop($scrollpane.scrollTop() - dy);
            })

            jQuery(document).on('mouseup.diagram', () => {
                jQuery(document).off('mousemove.diagram');
                jQuery(document).off('mouseup.diagram');
            });


        });


    }    

    adjustCenterRectangle(){
        this.$centerRectangle.attr({
            x: this.marginCm + "cm",
            y: this.marginCm + "cm",
            width: (this.widthCm - 2*this.marginCm) + "cm",    
            height: (this.heightCm - 2*this.marginCm) + "cm"
        });
    }

    setSize(widthCm: number, heightCm: number){
        if(widthCm < this.minWidthHeightCm) widthCm = this.minWidthHeightCm;
        if(heightCm < this.minWidthHeightCm) heightCm = this.minWidthHeightCm;

        this.$canvas.css({
            width: widthCm + "cm",
            height: heightCm + "cm"
        })

        this.widthCm = widthCm;
        this.heightCm = heightCm;

        this.adjustCenterRectangle();
    }

    adjustSizeAndElements(diagramElements: DiagramElement[]): {isAdjusted: boolean}{

        let xMin = 100000;
        let yMin = 100000;
        let xMax = -100000;
        let yMax = -100000;

        for(let rr of diagramElements){
            if(xMin > rr.leftCm) xMin = rr.leftCm;
            if(xMax < rr.leftCm + rr.widthCm) xMax = rr.leftCm + rr.widthCm;
            if(yMin > rr.topCm) yMin = rr.topCm;
            if(yMax < rr.topCm + rr.heightCm) yMax = rr.topCm + rr.heightCm;
        }

        xMin -= this.marginCm;
        xMax += this.marginCm;
        yMin -= this.marginCm;
        yMax += this.marginCm;

        let isAdjusted: boolean = false;
        let newWidthCm = this.widthCm;
        let newHeightCm = this.heightCm;

        if(xMin < 0 || xMax > this.widthCm || (xMax - xMin <= this.widthCm && this.widthCm > this.minWidthHeightCm)){
            let delta = 0;
            newWidthCm = Math.max(this.minWidthHeightCm, xMax - xMin);

            if(xMin < 0){
                delta = -xMin;
            }

            if(xMin > 0 && xMax > newWidthCm){
                delta = newWidthCm - xMax;
            }
            isAdjusted = delta != 0;

            if(isAdjusted)
            for(let rr of diagramElements){
                rr.move(delta, 0, true, true);
            }

        }

        if(yMin < 0 || yMax > this.heightCm || (yMax - yMin <= this.heightCm && this.heightCm > this.minWidthHeightCm)){
            let delta = 0;
            newHeightCm = Math.max(this.minWidthHeightCm, yMax - yMin);

            if(yMin < 0){
                delta = -yMin;
            }

            if(yMin > 0 && yMax > newHeightCm){
                delta = newHeightCm - yMax;
            }
            isAdjusted = delta != 0;

            if(isAdjusted)
            for(let rr of diagramElements){
                rr.move(0, delta, true, true);
            }

        }


        this.setSize(newWidthCm, newHeightCm);
        

        return {isAdjusted: isAdjusted};

    }

    public insertStyleElement(styles: { [selector: string]: { [key: string]: string } } = null) {

        let ns = 'http://www.w3.org/2000/svg';

        if (this.style == null) {
            this.defs = document.createElementNS(ns, 'defs');
            this.style = document.createElementNS(ns, 'style');
            this.defs.appendChild(this.style);
            this.svgElement.appendChild(this.defs);
        }

        if (styles != null) {
            this.inlineStyles = styles;
            this.refreshInlineStyles();
        }

    }

    public createElement(name: string, parent: Element = null, attributes?:
        { [key: string]: string }): JQuery<Element> {

        let ns = 'http://www.w3.org/2000/svg';
        let $element = jQuery(document.createElementNS(ns, name));

        if(attributes != null) $element.attr(attributes);

        if(parent != null) parent.appendChild($element[0]);

        return $element;

    }

    private refreshInlineStyles() {

        let s: string = "";

        for (let selector in this.inlineStyles) {
            let stylesForSelector = this.inlineStyles[selector];
            if (stylesForSelector != null) {
                s += selector + "{\n";
                for (let key in stylesForSelector) {
                    s += "   " + key + ":" + stylesForSelector[key] + ";\n";
                }
                s += "}\n";
            } else {
                s += selector + "\n";
            }
        }

        this.style.textContent = s;

    }

    findFreeSpace(elements: DiagramElement[], width: number, height: number, minDistance: number): Point {

        let radius = 0;
        let fertig: boolean = false;
        let xCm = 0;
        let yCm = 0;
        while(!fertig){

            let y = radius;
            let x = 0;
            for(x = 0; x <= radius; x++){
                xCm = this.marginCm + x * DiagramUnitCm;
                yCm = this.marginCm + y * DiagramUnitCm;
                if(this.isFree(elements, width, height, xCm, yCm, minDistance)){
                    fertig = true;
                    break;
                }
            }
            if(fertig) break;
            x--;
            for(y = 0; y <= radius - 1; y++){
                xCm = this.marginCm + x * DiagramUnitCm;
                yCm = this.marginCm + y * DiagramUnitCm;
                if(this.isFree(elements, width, height, xCm, yCm, minDistance)){
                    fertig = true;
                    break;
                }
            }

            radius += 2;

        }

        return {x: xCm, y: yCm};

    }

    isFree(elements: DiagramElement[], widthCm: number, heightCm: number, leftCm: number, topCm: number, minDistance: number):boolean {

        for(let element of elements){

            let insideX = Math.abs(element.leftCm + element.widthCm/2 - leftCm - widthCm/2) 
                       <= (element.widthCm + widthCm)/2 + minDistance;

            let insideY = Math.abs(element.topCm + element.heightCm/2 - topCm - heightCm/2) <= (element.heightCm + heightCm)/2 + minDistance;

            if(insideX && insideY) return false;

        }

        return true;

    }


}