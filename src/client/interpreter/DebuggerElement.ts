import { Value, Type, Variable } from "../compiler/types/Types.js";
import { stringPrimitiveType } from "../compiler/types/PrimitiveTypes.js";
import { ArrayType } from "../compiler/types/Array.js";
import { Klass, Visibility, StaticClass, Interface } from "../compiler/types/Class.js";
import { Enum } from "../compiler/types/Enum.js";
import { RuntimeObject } from "./RuntimeObject.js";
import { ListHelper } from "../runtimelibrary/collections/ArrayList.js";
import jQuery from "jquery";

export class DebuggerElement {

    caption: string; // only used for root elements, e.g. "Local variables"
    // if caption is set then value == null and parent == null

    parent: DebuggerElement;
    children: DebuggerElement[] = [];

    canOpen: boolean;
    isOpen: boolean = false;

    value: Value;
    variable: Variable;

    type: Type;
    identifier: string;

    $debuggerElement: JQuery<HTMLElement>;

    constructor(caption: string, parent: DebuggerElement, identifier: string, value: Value, type: Type, variable: Variable) {
        this.caption = caption;
        this.parent = parent;
        if (parent != null) {
            parent.children.push(this);
        }
        this.value = value;
        this.type = type;
        this.variable = variable;
        this.identifier = identifier;
    }

    getLevel(): number {
        return this.parent == null ? 0 : this.parent.getLevel() + 1;
    }

    getIndent(): number {
        // return this.getLevel() * 15;
        return this.getLevel() == 0 ? 0 : 15;
    }

    render() {

        this.renderValue();

    }

    initHtml(){
        if (this.$debuggerElement == null) {
            this.$debuggerElement = jQuery('<div>');
            this.$debuggerElement.addClass("jo_debuggerElement");
            this.$debuggerElement.css('margin-left', '' + this.getIndent() + 'px');

            let $deFirstLine = jQuery('<div class="jo_deFirstline"><span class="jo_deIdentifier">' +
                this.identifier + '</span>:&nbsp;<span class="jo_deValue"></span></div>');

            this.$debuggerElement.append($deFirstLine);

        }

        let valueType = this.value?.type;
        if(valueType != null){
            // show compound types in own branch of visible tree
            if (valueType instanceof ArrayType ||
                (valueType instanceof Klass && !(valueType instanceof Enum) && valueType != stringPrimitiveType && valueType.hasAttributes())
                || valueType instanceof StaticClass
                || valueType instanceof Interface
            ) {
                if(!this.canOpen || this.type != valueType){
                    this.type = valueType;
                    this.$debuggerElement.find(".jo_deChildContainer").remove();
                    this.canOpen = true;
                    this.$debuggerElement.addClass('jo_canOpen');
                    this.$debuggerElement.append(jQuery('<div class="jo_deChildContainer"></div>'));
        
                    this.$debuggerElement.find('.jo_deFirstline').on('mousedown', (event) => {
                        if (this.value != null && this.value.value != null) {
                            if (this.children.length == 0) {
                                this.onFirstOpening();
                            }
                            this.$debuggerElement.toggleClass('jo_expanded');
                            this.isOpen = !this.isOpen;
                        } else {
                            this.children = [];
                        }
        
                        event.stopPropagation();
        
                    });
                }
    
            } else {
                this.canOpen = false;
                this.$debuggerElement.removeClass('jo_canOpen');
                this.$debuggerElement.find(".jo_deChildContainer").remove();

            }
        }

    }

    updateChildValues(){
        if (this.type instanceof Klass && this.children.length > 0) {

            let ro: RuntimeObject = this.value.value;

            let listHelper: ListHelper = ro.intrinsicData == null ? null : ro.intrinsicData["ListHelper"];
            if (listHelper == null) {
                let childIndex = 0;
                for (let a of (<Klass>this.value.type).getAttributes(Visibility.private)) {
                    this.children[childIndex++].value = ro.getValue(a.index);
                }
            }
        }
    }


    onFirstOpening() {

        this.children = [];

        if (this.type instanceof Klass) {

            let ro: RuntimeObject = this.value.value;
            let listHelper: ListHelper = ro.intrinsicData == null ? null : ro.intrinsicData["ListHelper"];
            if (listHelper != null) {
                this.renderListElements(listHelper);
            } else {
                for (let a of (<Klass>this.value.type).getAttributes(Visibility.private)) {
                    let de = new DebuggerElement(null, this, a.identifier, ro.getValue(a.index), a.type, null);
                    de.render();
                    this.$debuggerElement.find('.jo_deChildContainer').first().append(de.$debuggerElement);
                }
            }


        } else if (this.type instanceof ArrayType) {

            let a = <Value[]>this.value.value;

            let $childContainer = this.$debuggerElement.find('.jo_deChildContainer');
            for (let i = 0; i < a.length && i < 100; i++) {

                let de = new DebuggerElement(null, this, "[" + i + "]", a[i], this.type.arrayOfType, null);
                de.render();
                $childContainer.append(de.$debuggerElement);

            }

        } else if (this.type instanceof StaticClass) {

            for (let a of this.type.getAttributes(Visibility.private)) {
                let ro = this.type.classObject;
                let de = new DebuggerElement(null, this, a.identifier, ro.getValue(a.index), a.type, null);
                de.render();
                this.$debuggerElement.find('.jo_deChildContainer').append(de.$debuggerElement);
            }

        } else if (this.type instanceof Interface) {

            if (this.value.value != null && this.value.value instanceof RuntimeObject) {
                let ro: RuntimeObject = this.value.value;

                for (let a of (<Klass>ro.class).getAttributes(Visibility.private)) {
                    let de = new DebuggerElement(null, this, a.identifier, ro.getValue(a.index), a.type, null);
                    de.render();
                    this.$debuggerElement.find('.jo_deChildContainer').append(de.$debuggerElement);
                }

            } else {
                this.children = [];
            }

        }

    }

    renderListElements(listHelper: ListHelper) {

        let valueArray = listHelper.valueArray;
        if (this.children.length > valueArray.length) {
            for (let i = valueArray.length; i < this.children.length; i++) {
                let childElement = this.children[i];
                childElement.$debuggerElement.remove();
            }
            this.children.splice(valueArray.length);
        }

        if (this.children.length < valueArray.length && this.children.length < 100) {
            for (let i = this.children.length; i < valueArray.length && i <= 100; i++) {
                let v: Value = valueArray[i];
                let title = "" + i;
                if (i == 100) {
                    v = { type: stringPrimitiveType, value: "" + (listHelper.valueArray.length - 100) + " weitere..." };
                    title = "...";
                }
                let de = new DebuggerElement(null, this, title, v, v.type, null);
                de.render();
                this.$debuggerElement.find('.jo_deChildContainer').first().append(de.$debuggerElement);
            }
        }

    }

    renderValue() {

        this.initHtml();

        let s: string;
        let v = this.value;

        if (v == null) {
            this.$debuggerElement.hide();
            return;
        }

        this.$debuggerElement.show();
        if (v.value == null) {
            s = "null";
            this.removeAllChildren();
        } else {

            if (v.updateValue != null) {
                v.updateValue(v);
            }

            s = v.type?.debugOutput(v);

            if (this.type instanceof Klass) {
                let typeIdentifier = this.value?.type?.identifier;
                if(typeIdentifier != null){
                    if(["String", "Integer", "Boolean", "Double", "Float"].indexOf(typeIdentifier) < 0){
                        s = "<span class='jo_debugger_classidentifier'>" + typeIdentifier + "</span>";
                    }
                }
                let ro: RuntimeObject = this.value.value;
                let listHelper: ListHelper = ro.intrinsicData == null ? null : ro.intrinsicData["ListHelper"];
                if (listHelper != null) {
                    this.renderListElements(listHelper);
                    if(listHelper.allElementsPrimitive()){
                        s = "" +listHelper.valueArray.length + " El: "
                        s += "[" + listHelper.objectArray.slice(0, 20).map(o => "" + o).join(", ") + "]"
                    } else {
                        s = v.type.identifier + " (" +listHelper.valueArray.length + " Elemente)";
                    }
                }
            } 
            
        }

        this.$debuggerElement.find('.jo_deValue').first().html(s == null ? "" : s);

        this.updateChildValues();

        for (let child of this.children) {
            child.renderValue();
        }
    }

    removeAllChildren() {
        for (let de of this.children) {
            de.$debuggerElement.remove();
        }
        this.children = []
    }

}