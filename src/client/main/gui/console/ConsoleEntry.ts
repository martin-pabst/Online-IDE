import { Value } from "../../../compiler/types/Types.js";
import { ArrayType } from "../../../compiler/types/Array.js";
import { Klass, Visibility, StaticClass, Interface } from "../../../compiler/types/Class.js";
import { Enum } from "../../../compiler/types/Enum.js";
import { RuntimeObject } from "../../../interpreter/RuntimeObject.js";
import { stringPrimitiveType } from "../../../compiler/types/PrimitiveTypes.js";
import jQuery from 'jquery';

export class ConsoleEntry {

    caption: string|JQuery<HTMLElement>; // only used for root elements, e.g. "Local variables"
    // if caption is set then value == null and parent == null

    parent: ConsoleEntry;
    children: ConsoleEntry[];

    canOpen: boolean;
    isOpen: boolean = false;

    identifier: string;
    value: Value;

    $consoleEntry: JQuery<HTMLElement>;

    constructor(caption: string|JQuery<HTMLElement>, value: Value, identifier: string, parent: ConsoleEntry, 
        private withBottomBorder: boolean, private color: string = null ) {
        this.caption = caption;
        this.parent = parent;
        if (parent != null) {
            parent.children.push(this);
        }
        this.value = value;

        this.identifier = identifier;

        this.render();
    }

    getLevel(): number {
        return this.parent == null ? 0 : this.parent.getLevel() + 1;
    }

    getIndent(): number {
        // return this.getLevel() * 15;
        return this.getLevel() == 0 ? 0 : 15;
    }

    render() {

        this.$consoleEntry = jQuery('<div>');
        this.$consoleEntry.addClass("jo_consoleEntry");
        this.$consoleEntry.css('margin-left', '' + this.getIndent() + 'px');

        if(this.color != null){
            this.$consoleEntry.css('background-color', this.color);
        }

        if(this.withBottomBorder){
            this.$consoleEntry.addClass('jo_withBorder');
        }

        let $deFirstLine = jQuery('<div class="jo_ceFirstline"></div>');

        this.$consoleEntry.append($deFirstLine);


        if (this.value != null && this.value.type != null && (this.value.type instanceof ArrayType ||
            (this.value.type instanceof Klass && !(this.value.type instanceof Enum) && !(this.value.type == stringPrimitiveType))
            || this.value.type instanceof Interface
            )) {
            this.canOpen = true;
            this.$consoleEntry.addClass('jo_canOpen');
            this.$consoleEntry.append(jQuery('<div class="jo_ceChildContainer"></div>'));

            this.$consoleEntry.find('.jo_ceFirstline').on('mousedown', (event) => {
                if (this.value != null && this.value.value != null) {
                    if (this.children == null) {
                        this.onFirstOpening();
                    }
                    this.$consoleEntry.toggleClass('jo_expanded');
                    this.isOpen = !this.isOpen;
                } else {
                    this.children = null;
                }

                event.stopPropagation();

            });

        } else {
            if(this.caption == null && this.getLevel() == 0){
                this.$consoleEntry.addClass('jo_cannotOpen');
            }
        }

        this.renderValue();

    }

    onFirstOpening() {

        this.children = [];

        let type = this.value.type;

        if (type instanceof Klass) {

            for (let a of (<Klass>this.value.type).getAttributes(Visibility.private)) {
                let ro = <RuntimeObject>this.value.value;
                let de = new ConsoleEntry(null, ro.getValue(a.index), a.identifier, this, false);
                de.render();
                this.$consoleEntry.find('.jo_ceChildContainer').append(de.$consoleEntry);
            }

        } else if (type instanceof ArrayType) {

            let a = <Value[]>this.value.value;

            let $childContainer = this.$consoleEntry.find('.jo_ceChildContainer');
            for (let i = 0; i < a.length && i < 100; i++) {

                let de = new ConsoleEntry(null, a[i], "[" + i + "]", this, false);
                de.render();
                $childContainer.append(de.$consoleEntry);

            }

        } else if (type instanceof StaticClass) {

            let $childContainer = this.$consoleEntry.find('.jo_ceChildContainer');
            for (let a of type.getAttributes(Visibility.private)) {
                let ro = type.classObject;
                let de = new ConsoleEntry(null, ro.getValue(a.index), a.identifier, this, false);
                de.render();
                $childContainer.append(de.$consoleEntry);
            }

        } else if (type instanceof Interface) {

            if(this.value.value != null && this.value.value instanceof RuntimeObject){

                let $childContainer = this.$consoleEntry.find('.jo_ceChildContainer');

                let ro: RuntimeObject = this.value.value;

                for (let a of (<Klass>ro.class).getAttributes(Visibility.private)) {
                    let de = new ConsoleEntry(null, ro.getValue(a.index), a.identifier, this, false);
                    de.render();
                    $childContainer.append(de.$consoleEntry);
                }

            } else {
                this.children == null;
            }

        }

    }

    renderValue() {

        let $firstLine = this.$consoleEntry.find('.jo_ceFirstline');

        let v = this.value;
        
        if (v == null) {
            if(this.caption != null){
                if(typeof this.caption == "string" ){
                    $firstLine.append(jQuery('<span class="jo_ceCaption">' + this.caption + "</span>"));
                } else {
                    let span = jQuery('<span class="jo_ceCaption"></span>');
                    span.append(this.caption);
                    $firstLine.append(span);
                }
            } else {
                $firstLine.append(jQuery('<span class="jo_ceNoValue">Kein Wert zurückgegeben.</span>'));
            }
            return;
        }
        
        let valueString = "";
        if (v.value == null) {
            valueString = "null";
        } else {
            valueString = v.type.debugOutput(v, 400);
        }
        
        if(this.identifier != null){
            $firstLine.append(jQuery('<span class="jo_ceIdentifier">' + this.identifier + ":&nbsp;</span>"));
        }
        $firstLine.append(jQuery('<span class="jo_ceValue">' + valueString + "</span>"));
    }

    detachValue() {
        this.value = undefined;
        this.$consoleEntry.removeClass('jo_canOpen');
        if(this.getLevel() == 0 && this.caption == null){
            this.$consoleEntry.addClass('jo_cannotOpen');
        }
    }

}