export class SVGHelper {

    svg: Element;
    defs: Element;
    style: Element;

    inlineStyles: { [selector: string]: { [key: string]: string } } = {};

    public find(selector: string): JQuery<Element> {
        return jQuery(this.svg).find(selector);
    }

    public getSVG(): Element {
        return this.svg;
    }

    constructor(width: string = "0", height: string = "0") {
        let ns = 'http://www.w3.org/2000/svg';
        this.svg = document.createElementNS(ns, 'svg');
        jQuery(this.svg).css('pointer-events', 'none');

        this.setTopLeft("0", "0");

        this.svg.setAttributeNS(null, 'width', width);
        this.svg.setAttributeNS(null, 'height', height);
    }

    /**
     * Inserts new SVG Element into given htmlElement
     */
    public appendToHtmlElement(htmlElement: Element): SVGHelper {


        // this.svg.setAttributeNS(null, 'id', 'svgtest');
        //xmlns="http://www.w3.org/2000/svg" version="1.1"
        //this.svg.setAttributeNS(null, "xmlns", "http://www.w3.org/2000/svg");
        //this.svg.setAttributeNS(null, "version", "1.1");
        htmlElement.appendChild(this.svg);

        return this;

    }

    public setTopLeft(top: string, left: string) {
        let $svg = jQuery(this.svg);
        $svg.css({
            top: top,
            left: left,
            position: "absolute"
        });

    }

    public setSize(width: string, height: string) {
        let $svg = jQuery(this.svg);
        $svg.css({
            width: width,
            height: height
        });
    }

    public setAttributes(element: Element = null, attributes: { [key: string]: string }) {
        if (element == null) {
            element = this.svg;
        }

        for (let key in attributes) {
            element.setAttributeNS(null, key, attributes[key]);

        };

    }

    public insertElement(name: string, parent: Element = null, attributes?: { [key: string]: string }): Element {

        let ns = 'http://www.w3.org/2000/svg';
        let element = document.createElementNS(ns, name);

        if (parent == null) {
            parent = this.svg;
        }

        this.setAttributes(element, attributes);

        parent.appendChild(element);

        return element;

    }

    public insertStyleElement(styles: { [selector: string]: { [key: string]: string } } = null): SVGHelper {

        let ns = 'http://www.w3.org/2000/svg';

        if (this.style == null) {
            this.defs = document.createElementNS(ns, 'defs');
            this.style = document.createElementNS(ns, 'style');
            this.defs.appendChild(this.style);
            this.svg.appendChild(this.defs);
        }

        if (styles != null) {
            this.inlineStyles = styles;
            this.refreshInlineStyles();
        }

        return this;
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

    public setStyle(selector: string, key: string, value: string, refresh: boolean = true) {

        if (this.style == null) {
            this.insertStyleElement();
        }

        this.setStyleIntern(selector, key, value, refresh);
    }

    private setStyleIntern(selector: string, key: string, value: string, refresh: boolean = true) {

        let styleForSelector = this.inlineStyles[selector];
        if (styleForSelector == null) {
            this.inlineStyles[selector] = {};
        }

        this.inlineStyles[selector][key] = value;

        if (refresh) {
            this.refreshInlineStyles();
        }

    }

    public setStyles(styles: { [selector: string]: { [key: string]: string } } = null): SVGHelper {

        if (this.style == null) {
            this.insertStyleElement();
        }

        for (let selector in styles) {
            let stylesForSelector = styles[selector];

            for (let key in stylesForSelector) {
                let value = stylesForSelector[key];
                this.setStyleIntern(selector, key, value, false);
            }

        }

        this.refreshInlineStyles();

        return this;
    }




}