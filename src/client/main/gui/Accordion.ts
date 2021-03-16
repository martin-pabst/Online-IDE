import { openContextMenu, makeEditable, ContextMenuItem } from "../../tools/HtmlTools.js";
import { Helper } from "./Helper.js";
import { escapeHtml } from "../../tools/StringTools.js";

export type AccordionElement = {
    name: string;
    sortName?: string;      // if sortName == null, then name will be used when sorting
    externalElement?: any;
    iconClass?: string;
    $htmlFirstLine?: JQuery<HTMLElement>;
    $htmlSecondLine?: JQuery<HTMLElement>;
}

export type AccordionContextMenuItem = {
    caption: string;
    color?: string;
    callback: (panel: AccordionElement) => void;
    subMenu?: AccordionContextMenuItem[]
}

export class AccordionPanel {

    elements: AccordionElement[] = [];

    $captionElement: JQuery<HTMLElement>;
    $buttonNew: JQuery<HTMLElement>;
    $listElement: JQuery<HTMLElement>;

    private fixed: boolean;

    dontSortElements: boolean = false;

    newElementCallback: (ae: AccordionElement, callbackIfSuccessful: (externalElement: any) => void) => void;
    renameCallback: (externalElement: any, newName: string) => string;
    deleteCallback: (externalElement: any, callbackIfSuccessful: () => void) => void;
    selectCallback: (externalElement: any) => void;
    addElementActionCallback: (accordionElement: AccordionElement) => JQuery<HTMLElement>;
    contextMenuProvider: (externalElement: any) => AccordionContextMenuItem[];

    constructor(private accordion: Accordion, private caption: string, private flexWeight: string,
        private newButtonClass: string, private buttonNewTitle: string,
        private defaultIconClass: string, private withDeleteButton: boolean) {

        accordion.addPanel(this);

    }

    remove() {
        this.$captionElement.remove();
        this.$listElement.remove();
    }

    setFixed(fixed: boolean) {
        this.fixed = fixed;
        if (this.fixed) {
            this.$captionElement.addClass('jo_fixed');
        } else {
            this.$captionElement.removeClass('jo_fixed');
        }

    }

    //     <div class="jo_leftpanelcaption expanded" id="workspace" data-panel="filelistouter">
    //     <span>WORKSPACE</span>
    //     <div class="jo_actions"><img id="buttonNewFile" title="Neue Datei hinzufügen"
    //             src="assets/projectexplorer/add-file-dark.svg"></div>
    // </div>
    // <div id="filelistouter" class="jo_projectexplorerdiv scrollable" data-grow="3"
    //     style="flex-grow: 3">
    //     <div id="filelist"></div>
    // </div>


    enableNewButton(enabled: boolean) {
        if (this.$buttonNew != null) {
            if (enabled) {
                this.$buttonNew.show();
            } else {
                this.$buttonNew.hide();
            }
        }
    }


    renderOuterHtmlElements($accordionDiv: JQuery<HTMLElement>) {
        let that = this;

        this.$captionElement = jQuery(`<div class="jo_leftpanelcaption jo_expanded" id="workspace">
        <span>` + this.caption + `</span><div class="jo_actions"></div></div>`);

        if (this.newButtonClass != null) {
            this.$buttonNew = jQuery('<div class="jo_button jo_active ' + this.newButtonClass + '" title="' + this.buttonNewTitle + '">');
            this.$captionElement.find('.jo_actions').append(this.$buttonNew);

            this.$buttonNew.on('mousedown', (ev) => {

                Helper.close();
                ev.stopPropagation();

                let ae: AccordionElement = {
                    name: "Neu"
                }

                that.elements.push(ae);

                let $element = that.renderElement(ae);
                that.$listElement.prepend($element);

                that.$listElement.scrollTop(0);

                that.renameElement(ae, () => {

                    that.newElementCallback(ae, (externalElement: any) => {

                        ae.externalElement = externalElement;

                        if (ae.$htmlSecondLine != null) {
                            ae.$htmlSecondLine.insertAfter($element);
                        }

                        if (that.selectCallback != null) that.select(ae.externalElement);

                    });

                });

            });

        }

        let $listOuter = jQuery('<div id="filelistouter" class="jo_projectexplorerdiv jo_scrollable" data-grow="'
            + this.flexWeight + '" style="flex-grow: ' + this.flexWeight + '"></div>');
        this.$listElement = jQuery('<div class="jo_filelist"></div>')

        $listOuter.append(this.$listElement);

        $accordionDiv.append(this.$captionElement);
        $accordionDiv.append($listOuter);

        let $ce = this.$captionElement;
        let $li = this.$listElement.parent();

        $ce.on('mousedown', (ev) => {
            if (ev.button != 0) {
                return;
            }

            if (!this.fixed) {
                let targetGrow = $li.data('grow');
                if ($ce.hasClass('jo_expanded')) {
                    if (that.accordion.parts.length > 1) {
                        $li.animate({
                            'flex-grow': 0.001
                        }, 1000, () => { $ce.toggleClass('jo_expanded'); });
                    }
                } else {
                    $ce.toggleClass('jo_expanded');
                    $li.animate({
                        'flex-grow': targetGrow
                    }, 1000);
                }
            }
        });


    }

    addElement(element: AccordionElement) {
        this.elements.push(element);
        element.$htmlFirstLine = this.renderElement(element);
        this.$listElement.prepend(element.$htmlFirstLine);
    }

    sortElements(){
        if(this.dontSortElements) return;
        this.elements.sort((a, b) => {
            let aName = a.sortName ? a.sortName : a.name;
            let bName = b.sortName ? b.sortName : b.name;
            return (aName.localeCompare(bName));
        });
        this.elements.forEach((element) => {this.$listElement.append(element.$htmlFirstLine)});
    }

    setTextAfterFilename(element: AccordionElement, text: string, cssClass: string) {
        let $div = element.$htmlFirstLine.find('.jo_textAfterName');
        $div.addClass(cssClass);
        $div.html(text);
    }

    addAction($element: JQuery<HTMLElement>) {
        this.$captionElement.find('.jo_actions').prepend($element);
    }

    renderElement(element: AccordionElement): JQuery<HTMLElement> {

        let that = this;

        if (element.iconClass == null) element.iconClass = this.defaultIconClass;

        element.$htmlFirstLine = jQuery(`<div class="jo_file jo_${element.iconClass}">
        <div class="jo_fileimage"></div><div class="jo_filename">${escapeHtml(element.name)}</div>
           <div class="jo_textAfterName"></div>
           <div class="jo_additionalButtonHomework"></div>
           <div class="jo_additionalButtonStart"></div>
           <div class="jo_additionalButtonRepository"></div>
           ${this.withDeleteButton ? '<div class="jo_delete img_delete jo_button jo_active"></div>' : ""}
        </div>`);

        if (this.addElementActionCallback != null) {
            let $elementAction = this.addElementActionCallback(element);
            element.$htmlFirstLine.append($elementAction);
        }

        element.$htmlFirstLine.on('mousedown', (ev) => {

            if (ev.button == 0 && that.selectCallback != null) {
                that.selectCallback(element.externalElement);

                for (let ae of that.elements) {
                    if (ae != element && ae.$htmlFirstLine.hasClass('jo_active')) {
                        ae.$htmlFirstLine.removeClass('jo_active');
                    }
                }

                element.$htmlFirstLine.addClass('jo_active');
            }
        });

        element.$htmlFirstLine[0].addEventListener("contextmenu", function (event) {

            let contextMenuItems: ContextMenuItem[] = [];
            if (that.renameCallback != null) {
                contextMenuItems.push({
                    caption: "Umbenennen",
                    callback: () => {
                        that.renameElement(element);
                    }
                })
            }

            if (that.contextMenuProvider != null) {

                for (let cmi of that.contextMenuProvider(element)) {
                    contextMenuItems.push({
                        caption: cmi.caption,
                        callback: () => {
                            cmi.callback(element);
                        },
                        color: cmi.color,
                        subMenu: cmi.subMenu == null ? null : cmi.subMenu.map((mi) => {
                            return {
                                caption: mi.caption,
                                callback: () => {
                                    mi.callback(element);
                                },
                                color: mi.color
                            }
                        })
                    })
                }
            }

            if (contextMenuItems.length > 0) {
                event.preventDefault();
                openContextMenu(contextMenuItems, event.pageX, event.pageY);
            }
        }, false);

        if (that.withDeleteButton) {
            element.$htmlFirstLine.find('.jo_delete').on('mousedown', (ev) => {
                ev.preventDefault();
                openContextMenu([{
                    caption: "Abbrechen",
                    callback: () => {
                        // nothing to do.
                    }
                }, {
                    caption: "Ich bin mir sicher: löschen!",
                    color: "#ff6060",
                    callback: () => {
                        that.deleteCallback(element.externalElement, () => {
                            element.$htmlFirstLine.remove();
                            if (element.$htmlSecondLine != null) element.$htmlSecondLine.remove();
                            that.elements.splice(that.elements.indexOf(element), 1);

                            if (that.selectCallback != null) {
                                if (that.elements.length > 0) {
                                    that.select(that.elements[0].externalElement);
                                } else {
                                    that.select(null);
                                }
                            }
                        });
                    }
                }], ev.pageX + 2, ev.pageY + 2);
                ev.stopPropagation();
            });
        }

        return element.$htmlFirstLine;

    }

    renameElement(element: AccordionElement, callback?: () => void) {
        let that = this;
        let $div = element.$htmlFirstLine.find('.jo_filename');
        let pointPos = element.name.indexOf('.');
        let selection = pointPos == null ? null : { start: 0, end: pointPos };
        this.dontSortElements = true;
        makeEditable($div, $div, (newText: string) => {
            if (element.externalElement != null) newText = that.renameCallback(element.externalElement, newText);
            element.name = newText;
            $div.html(element.name);
            if (callback != null) callback();
            that.sortElements();
            $div[0].scrollIntoView();
            this.dontSortElements = false;
        }, selection);
    }

    select(externalElement: any, invokeCallback: boolean = true) {

        if (externalElement == null) {
            for (let ae1 of this.elements) {
                if (ae1.$htmlFirstLine.hasClass('jo_active')) ae1.$htmlFirstLine.removeClass('jo_active');
            }
        } else {
            let ae = this.findElement(externalElement);

            if(ae != null){
                for (let ae1 of this.elements) {
                    if (ae1.$htmlFirstLine.hasClass('jo_active')) ae1.$htmlFirstLine.removeClass('jo_active');
                }
    
                ae.$htmlFirstLine.addClass('jo_active');
            }

        }

        if (invokeCallback && this.selectCallback != null) this.selectCallback(externalElement);

    }

    setElementClass(element: AccordionElement, iconClass: string){
        if(element != null){
            element.$htmlFirstLine?.removeClass("jo_" + element.iconClass).addClass("jo_" + iconClass);
            element.iconClass = iconClass;
        }
        
    }

    findElement(externalElement: any): AccordionElement {
        for (let ae of this.elements) {
            if (ae.externalElement == externalElement) {
                return ae;
            }
        }

        return null;

    }

    removeElement(externalElement: any) {
        for (let ae of this.elements) {
            if (ae.externalElement == externalElement) {
                ae.$htmlFirstLine.remove();
                if (ae.$htmlSecondLine != null) ae.$htmlSecondLine.remove();
                this.elements.splice(this.elements.indexOf(ae), 1);

                if (this.selectCallback != null) {
                    if (this.elements.length > 0) {
                        this.select(this.elements[0].externalElement);
                    } else {
                        this.select(null);
                    }
                }
                return;
            }
        }
    }

    clear() {
        this.$listElement.empty();
        this.elements = [];
    }

    setCaption(text: string) {
        this.$captionElement.find('span').html(text);
    }

    getSelectedElementData(): any {
        for (let ae of this.elements) {
            if (ae.$htmlFirstLine.hasClass('jo_active')) {
                return ae;
            }
        }
        return null;
    }

}


export class Accordion {

    parts: AccordionPanel[] = [];
    $html: JQuery<HTMLElement>;

    constructor($html: JQuery<HTMLElement>) {
        this.$html = $html;
        $html.addClass('jo_leftpanelinner');
    }

    addPanel(panel: AccordionPanel) {
        panel.renderOuterHtmlElements(this.$html);
        this.parts.push(panel);
    }



}