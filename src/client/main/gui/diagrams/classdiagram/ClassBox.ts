import { DiagramElement, Alignment } from "../DiagramElement.js";
import { Klass, Visibility, Interface } from "../../../../compiler/types/Class.js";
import { getDeclarationAsString, getTypeIdentifier } from "../../../../compiler/types/DeclarationHelper.js";
import { Diagram } from "../Diagram.js";
import { Point } from "./Router.js";
import { ClassDiagram } from "./ClassDiagram.js";
import { TextLine } from "../DiagramElement.js";
import { hash } from "../../../../tools/StringTools.js";
import { Method, Attribute } from "../../../../compiler/types/Types.js";
import jQuery from 'jquery';

export type SerializedClassBox = {
    className: string,
    filename: string,
    hashedSignature: number,
    withMethods: boolean,
    withAttributes: boolean,
    leftCm: number,
    topCm: number,
    isSystemClass: boolean,
    workspaceId?: number
}

export class ClassBox extends DiagramElement {

    className: string;
    klass: Klass | Interface;
    filename: string;
    hashedSignature: number;
    documentation: string;
    active: boolean = true;
    withMethods: boolean = true;
    withAttributes: boolean = true;

    inDebounce: any;

    isSystemClass: boolean;

    $dropdownTriangle: JQuery<Element>;

    constructor(public diagram: Diagram, leftCm: number, topCm: number, klass: Klass | Interface) {
        super(diagram.svgElement);

        this.klass = klass;

        if (klass != null) {
            this.attachToClass(this.klass);
            this.isSystemClass = klass.module.isSystemModule;
            this.withAttributes = false; //!this.isSystemClass;
            this.withMethods = false; // !this.isSystemClass;
        }

        this.moveTo(leftCm, topCm, true);

    }

    copy(): ClassBox {
        let cb1 = new ClassBox(this.diagram, this.leftCm, this.topCm, null);
        cb1.className = this.className;
        cb1.filename = this.filename;
        cb1.hashedSignature = this.hashedSignature;
        cb1.documentation = this.documentation;
        cb1.active = false;
        cb1.withMethods = this.withMethods;
        cb1.withAttributes = this.withAttributes;
        
        cb1.isSystemClass = this.isSystemClass;
        return cb1;
    }

    serialize(): SerializedClassBox {
        return {
            className: this.className,
            filename: this.filename,
            hashedSignature: this.hashedSignature,
            withAttributes: this.withAttributes,
            withMethods: this.withMethods,
            isSystemClass: this.isSystemClass,
            leftCm: this.leftCm,
            topCm: this.topCm
        }
    }

    static deserialize(diagram: Diagram, scb: SerializedClassBox): ClassBox {

        let cb = new ClassBox(diagram, scb.leftCm, scb.topCm, null);
        cb.hashedSignature = scb.hashedSignature;
        cb.className = scb.className;
        cb.filename = scb.filename;
        cb.withAttributes = scb.withAttributes;
        cb.withMethods = scb.withMethods;
        cb.isSystemClass = scb.isSystemClass;

        return cb;

    }

    attachToClass(klass: Klass | Interface) {

        this.klass = klass;
        let klassSignature: number = this.getSignature(klass);

        if (this.className != klass.identifier || this.hashedSignature != klassSignature || this.widthCm < 0.7 || this.documentation != klass.documentation) {
            this.isSystemClass = klass.module.isSystemModule;
            this.renderLines();
        } else {
            this.addMouseEvents();
        }

        this.className = klass.identifier;
        this.filename = klass.module.file.name;
        this.hashedSignature = klassSignature;
        this.documentation = klass.documentation;
    }

    jumpToDeclaration(element: Klass | Interface | Method | Attribute) {
        this.diagram.main.jumpToDeclaration(this.klass.module, element.declaration);
    }


    renderLines() {

        this.clear();

        let parametersWithTypes = (<ClassDiagram>this.diagram).currentClassBoxes.parametersWithTypes;

        this.addTextLine({
            type: "text",
            text: (this.klass instanceof Interface ? "<<interface>> " : ( this.klass.isAbstract ? "<<abstract>> " : "")) + this.klass.identifier,
            tooltip: getDeclarationAsString(this.klass, "", true),
            alignment: Alignment.center,
            bold: true,
            italics: this.klass instanceof Interface || this.klass.isAbstract,
            onClick: this.isSystemClass ? undefined : () => { this.jumpToDeclaration(this.klass) }
        });

        if (this.klass instanceof Klass && this.withAttributes) {
            this.addTextLine({
                type: "line",
                thicknessCm: 0.05
            });
            for (let a of this.klass.attributes) {

                let text: string = this.getVisibilityText(a.visibility) + getTypeIdentifier(a.type) + " " +  a.identifier;

                this.addTextLine({
                    type: "text",
                    text: text,
                    tooltip: getDeclarationAsString(a),
                    alignment: Alignment.left,
                    onClick: this.isSystemClass ? undefined : () => { this.jumpToDeclaration(a) }
                });
            }
        }

        if (this.withMethods) {
            this.addTextLine({
                type: "line",
                thicknessCm: 0.05
            });
            this.klass.methods.filter(m => m.signature != "toJson()").forEach(m => {
                let text: string = this.getVisibilityText(m.visibility) + m.identifier + "()";

                if (parametersWithTypes) {
                    let returnType: string = m.isConstructor ? "" :
                        (m.returnType == null ? "void " : getTypeIdentifier(m.returnType) + " ");
                    text = this.getVisibilityText(m.visibility) + returnType + m.identifier + "(" +
                        m.parameterlist.parameters.map((p) => { return getTypeIdentifier(p.type) + " " + p.identifier }).join(", ") + ")";
                }

                this.addTextLine({
                    type: "text",
                    text: text,
                    tooltip: getDeclarationAsString(m),
                    alignment: Alignment.left,
                    italics: this.klass instanceof Interface || m.isAbstract,
                    onClick: this.isSystemClass ? undefined : () => { this.jumpToDeclaration(m) }
                });

            });
        }

        this.backgroundColor = this.isSystemClass ? "#aaaaaa" : "#ffffff";
        this.render();

        this.$dropdownTriangle = this.createElement("path", this.$element[0], {
            d: this.getTrianglePath(),
            class: "dropdown-triangle",
            style: "transform: " + "translate(" + (this.widthCm - 0.35) + "cm,0.05cm)", // + (<TextLine>this.lines[0]).textHeightCm + "cm)"
        })

        this.addMouseEvents();
    }

    getTrianglePath() {
        if (this.withMethods) {
            return "M 0 8 L 11 8 L 5.5 2 L 0 8";
        } else {
            return "M 0 2 L 11 2 L 5.5 8 L 0 2";
        }
        // if (this.withMethods) {
        //     return "M 3 6 L 11 6 L 7 2 L 3 6";
        // } else {
        //     return "M 3 2 L 11 2 L 7 6 L 3 2";
        // }
    }

    detach() {
        this.$element?.off('mousedown.diagramElement');
        jQuery(document).off('mouseup.diagramElement');
        jQuery(document).off('mousemove.diagramElement');
        super.detach();
    }

    addMouseEvents() {
        let that = this;

        if (this.$dropdownTriangle != null) {
            this.$dropdownTriangle.off("mouseup.dropdowntriangle");
            this.$dropdownTriangle.off("mousedown.dropdowntriangle");
        }

        this.$dropdownTriangle.on("mousedown.dropdowntriangle", (e) => {
            e.stopPropagation();
        });
        this.$dropdownTriangle.on("mouseup.dropdowntriangle", (e) => {
            e.stopPropagation();
            this.withMethods = !this.withMethods;
            this.withAttributes = !this.withAttributes;
            this.$dropdownTriangle.attr("d", this.getTrianglePath());
            this.renderLines();
            (<ClassDiagram><any>this.diagram).adjustClassDiagramSize();
            (<ClassDiagram><any>this.diagram).updateArrows();
        });

        this.$element.on('mousedown.diagramElement', (event: JQuery.MouseDownEvent) => {

            event.stopPropagation();
            event.stopImmediatePropagation();

            if (event.button != 0) return;

            let x = event.screenX;
            let y = event.screenY;

            that.$element.find('rect').addClass('dragging');

            jQuery(document).off('mouseup.diagramElement');
            jQuery(document).off('mousemove.diagramElement');

            jQuery(document).on('mousemove.diagramElement', (event: JQuery.MouseMoveEvent) => {
                let cmPerPixel = 1 / 96 * 2.36 / this.diagram.zoomfactor;
                let dx = (event.screenX - x) * cmPerPixel;
                let dy = (event.screenY - y) * cmPerPixel;

                x = event.screenX;
                y = event.screenY;

                that.move(dx, dy, true);


                clearTimeout(that.inDebounce);
                that.inDebounce = setTimeout(() => {
                    let classDiagram = <ClassDiagram><any>that.diagram;
                    classDiagram.updateArrows();
                }, 200);
            });

            jQuery(document).on('mouseup.diagramElement', () => {
                that.move(0, 0, true, true);
                let classDiagram = <ClassDiagram><any>that.diagram;
                classDiagram.adjustClassDiagramSize();
                classDiagram.updateArrows();
                that.$element.find('rect').removeClass('dragging');
                jQuery(document).off('mouseup.diagramElement');
                jQuery(document).off('mousemove.diagramElement');
                classDiagram.dirty = true;
            });


        })
    }

    getVisibilityText(visibility: Visibility) {
        switch (visibility) {
            case Visibility.private: return "-";
            case Visibility.protected: return "#";
            case Visibility.public: return "+";
        }
    }

    getSignature(klass: Klass | Interface): number {

        let s: string = "";

        if (klass instanceof Klass && this.withAttributes && klass.attributes.length > 0) {
            for (let a of klass.attributes) s += this.getVisibilityText(a.visibility) + a.type.identifier + " " + a.identifier;
        }

        if (this.withMethods && klass.methods.length > 0) {
            for (let m of klass.methods) {
                if (m.isConstructor) continue;
                let rt: string = m.returnType == null ? "void" : m.returnType.identifier;
                s += this.getVisibilityText(m.visibility) + rt + " " + m.identifier + "(" +
                    m.parameterlist.parameters.map((p) => { return p.type.identifier + " " + p.identifier }).join(", ") + ")";
            }
        }

        return hash(s);

    }

    hasSignatureAndFileOf(klass: Klass | Interface) {
        return klass.module.file.name == this.filename &&
            this.getSignature(klass) == this.hashedSignature;
    }



}