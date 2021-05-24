import { openContextMenu, makeEditable, ContextMenuItem, jo_mouseDetected } from "../../tools/HtmlTools.js";
import { Helper } from "./Helper.js";
import { escapeHtml } from "../../tools/StringTools.js";
import { isJSDocThisTag, isThisTypeNode } from "typescript";

export type AccordionElement = {
    name: string;
    sortName?: string;      // if sortName == null, then name will be used when sorting
    externalElement?: any;
    iconClass?: string;
    $htmlFirstLine?: JQuery<HTMLElement>;
    $htmlSecondLine?: JQuery<HTMLElement>;

    isFolder: boolean;
    path: string[];
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

    currentlyDraggedElement: AccordionElement;

    newElementCallback: (ae: AccordionElement, callbackIfSuccessful: (externalElement: any) => void) => void;
    newFolderCallback: (ae: AccordionElement, callbackIfSuccessful: (externalElement: any) => void) => void;
    renameCallback: (externalElement: any, newName: string) => string;
    deleteCallback: (externalElement: any, callbackIfSuccessful: () => void) => void;
    selectCallback: (externalElement: any) => void;
    addElementActionCallback: (accordionElement: AccordionElement) => JQuery<HTMLElement>;
    contextMenuProvider: (externalElement: any) => AccordionContextMenuItem[];
    moveCallback: (ae: AccordionElement) => void;

    $newFolderAction: JQuery<HTMLElement>;

    constructor(private accordion: Accordion, private caption: string, private flexWeight: string,
        private newButtonClass: string, private buttonNewTitle: string,
        private defaultIconClass: string, private withDeleteButton: boolean, private withFolders: boolean) {

        accordion.addPanel(this);

        let mousePointer = window.PointerEvent ? "pointer" : "mouse";

        if (withFolders) {
            this.$newFolderAction = jQuery('<div class="img_add-folder-dark jo_button jo_active" style="margin-right: 4px"' +
                ' title="Neuen Ordner anlegen">');
            this.$newFolderAction.on(mousePointer + 'down', (e) => {
                e.stopPropagation();
                e.preventDefault();

                let pathArray = this.getCurrentlySelectedPath();

                this.addFolder("Neuer Ordner", pathArray, (newElement: AccordionElement) => {
                    this.newFolderCallback(newElement, () => { this.sortElements(); });
                });

            })

            this.addAction(this.$newFolderAction);

        }

    }

    remove() {
        this.$captionElement.remove();
        this.$listElement.remove();
    }

    setFixed(fixed: boolean) {
        this.fixed = fixed;
        if (this.fixed) {
            this.grow();
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

    getCurrentlySelectedPath(): string[] {
        let pathArray: string[] = [];
        let selectedElement = this.getSelectedElement();
        if (selectedElement != null) {
            pathArray = selectedElement.path.slice(0);
            if (selectedElement.isFolder) pathArray.push(selectedElement.name);
        }
        return pathArray;
    }

    compareWithPath(name1: string, path1: string[], name2: string, path2: string[]) {

        let nameWithPath1 = path1.join("/");
        if (nameWithPath1 != "") nameWithPath1 += "/";
        nameWithPath1 += name1;

        let nameWithPath2 = path2.join("/");
        if (nameWithPath2 != "") nameWithPath2 += "/";
        nameWithPath2 += name2;

        return nameWithPath1.localeCompare(nameWithPath2);
    }


    getElementIndex(name: string, path: string[]): number {

        for (let i = 0; i < this.elements.length; i++) {
            let element = this.elements[i];

            if (this.compareWithPath(name, path, element.name, element.path) < 0) return i - 1;

        }
        return this.elements.length;
    }

    insertElement(ae: AccordionElement) {
        let insertIndex = this.getElementIndex(ae.name, ae.path);
        this.elements.splice(insertIndex, 0, ae);

        if (insertIndex == 0) {
            this.$listElement.prepend(ae.$htmlFirstLine);
        } else {
            let elementAtIndex = this.$listElement.find('.jo_file').get(insertIndex);
            jQuery(elementAtIndex).after(ae.$htmlFirstLine);
        }

    }

    addFolder(name: string, path: string[], callback: (newPanel: AccordionElement) => void) {

        let ae: AccordionElement = {
            name: name,
            isFolder: true,
            path: path
        }

        let $element = this.renderElement(ae);

        this.insertElement(ae);

        $element[0].scrollIntoView();

        this.renameElement(ae, () => {

            callback(ae);

        });

    }






    renderOuterHtmlElements($accordionDiv: JQuery<HTMLElement>) {
        let that = this;

        this.$captionElement = jQuery(`<div class="jo_leftpanelcaption jo_expanded">
        <span>` + this.caption + `</span><div class="jo_actions"></div></div>`);

        if (this.newButtonClass != null) {
            this.$buttonNew = jQuery('<div class="jo_button jo_active ' + this.newButtonClass + '" title="' + this.buttonNewTitle + '">');
            this.$captionElement.find('.jo_actions').append(this.$buttonNew);

            let mousePointer = window.PointerEvent ? "pointer" : "mouse";
            this.$buttonNew.on(mousePointer + 'down', (ev) => {

                Helper.close();
                ev.stopPropagation();

                let path = that.getCurrentlySelectedPath();

                let ae: AccordionElement = {
                    name: "Neu",
                    isFolder: false,
                    path: path
                }

                let insertIndex = this.getElementIndex("", path);
                this.elements.splice(insertIndex, 0, ae);
                let $element = this.renderElement(ae);


                if (insertIndex == 0) {
                    this.$listElement.prepend($element);
                } else {
                    let elementAtIndex = this.$listElement.find('.jo_file').get(insertIndex);
                    jQuery(elementAtIndex).after($element);
                }

                $element[0].scrollIntoView();

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
        let mousePointer = window.PointerEvent ? "pointer" : "mouse";

        $ce.on(mousePointer + 'down', (ev) => {
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

    grow() {
        let $li = this.$listElement.parent();
        let targetGrow = $li.data('grow');
        $li.css('flex-grow', targetGrow);
        this.$captionElement.addClass('jo_expanded');
    }

    addElement(element: AccordionElement) {
        this.elements.push(element);
        element.$htmlFirstLine = this.renderElement(element);
        this.$listElement.prepend(element.$htmlFirstLine);
    }

    sortElements() {
        if (this.dontSortElements) return;
        this.elements.sort((a, b) => {
            let aName = a.sortName ? a.sortName : a.name;
            let bName = b.sortName ? b.sortName : b.name;

            return this.compareWithPath(aName, a.path, bName, b.path);

        });
        this.elements.forEach((element) => { this.$listElement.append(element.$htmlFirstLine) });
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

        let mousePointer = window.PointerEvent ? "pointer" : "mouse";
        let that = this;

        let expandedCollapsed = "";

        if (element.iconClass == null) element.iconClass = this.defaultIconClass;
        if (element.isFolder) {
            element.iconClass = "folder";
            expandedCollapsed = " jo_expanded";
        }

        let pathHtml = "";
        for (let i = 0; i < element.path.length; i++) {
            pathHtml += '<div class="jo_folderline"></div>';
        }

        element.$htmlFirstLine = jQuery(`<div class="jo_file jo_${element.iconClass} ${expandedCollapsed}">
        <div class="jo_folderlines">${pathHtml}</div>
           <div class="jo_fileimage"></div>
           <div class="jo_filename">${escapeHtml(element.name)}</div>
           <div class="jo_textAfterName"></div>
           <div class="jo_additionalButtonHomework"></div>
           <div class="jo_additionalButtonStart"></div>
           <div class="jo_additionalButtonRepository"></div>
           ${this.withDeleteButton ? '<div class="jo_delete img_delete jo_button jo_active' + (false ? " jo_delete_always" : "") + '"></div>' : ""}
           ${!jo_mouseDetected ? '<div class="jo_settings_button img_ellipsis-dark jo_button jo_active"></div>' : ""}
           </div>`);

        if (this.addElementActionCallback != null) {
            let $elementAction = this.addElementActionCallback(element);
            element.$htmlFirstLine.append($elementAction);
        }

        if (this.withFolders) {
            if (element.isFolder) {
                element.$htmlFirstLine.on('dragover', (event) => {
                    element.$htmlFirstLine.addClass('jo_file_dragover');
                    event.preventDefault();
                })

                element.$htmlFirstLine.on('dragleave', (event) => {
                    element.$htmlFirstLine.removeClass('jo_file_dragover');
                })

                element.$htmlFirstLine.on('drop', (event) => {
                    event.preventDefault();
                    element.$htmlFirstLine.removeClass('jo_file_dragover');
                    let element1 = that.currentlyDraggedElement;
                    if (element1 != null) {
                        that.moveElement(element1, element);
                    }
                });
            }

            let $filedragpart = element.$htmlFirstLine.find('.jo_filename');
            $filedragpart.attr('draggable', 'true');
            $filedragpart.on('drag', (event) => {
                that.currentlyDraggedElement = element;
            })
        }


        element.$htmlFirstLine.on(mousePointer + 'down', (ev) => {

            if (ev.button == 0 && that.selectCallback != null) {
                that.selectCallback(element.externalElement);

                for (let ae of that.elements) {
                    if (ae != element && ae.$htmlFirstLine.hasClass('jo_active')) {
                        ae.$htmlFirstLine.removeClass('jo_active');
                    }
                }

                element.$htmlFirstLine.addClass('jo_active');

                if (element.isFolder) {

                    if (element.$htmlFirstLine.hasClass('jo_expanded')) {
                        element.$htmlFirstLine.removeClass('jo_expanded');
                        element.$htmlFirstLine.addClass('jo_collapsed');
                    } else {
                        element.$htmlFirstLine.addClass('jo_expanded');
                        element.$htmlFirstLine.removeClass('jo_collapsed');
                    }

                    let pathIsCollapsed: { [path: string]: boolean } = {};
                    for (let e of this.elements) {
                        if (e.isFolder) {
                            let path = e.path.join("/");
                            if (path != "") path += "/";
                            path += e.name;
                            pathIsCollapsed[path] = e.$htmlFirstLine.hasClass('jo_collapsed');
                            if (pathIsCollapsed[e.path.join("/")]) pathIsCollapsed[path] = true;
                        }
                    }
                    pathIsCollapsed[""] = false;

                    for (let e of this.elements) {
                        if (pathIsCollapsed[e.path.join("/")]) {
                            e.$htmlFirstLine.hide();
                        } else {
                            e.$htmlFirstLine.show();
                        }
                    }

                }


            }
        });

        let contextmenuHandler = function (event) {

            let contextMenuItems: ContextMenuItem[] = [];
            if (that.renameCallback != null) {
                contextMenuItems.push({
                    caption: "Umbenennen",
                    callback: () => {
                        that.renameElement(element);
                    }
                })
            }

            let mousePointer = window.PointerEvent ? "pointer" : "mouse";

            if (element.isFolder) {
                contextMenuItems = contextMenuItems.concat([
                    {
                        caption: "Neuer Ordner...",
                        callback: () => {
                            that.select(element.externalElement);
                            that.$newFolderAction.trigger(mousePointer + 'down');
                        }
                    }, {
                        caption: "Neuer Workspace...",
                        callback: () => {
                            that.select(element.externalElement);
                            that.$buttonNew.trigger(mousePointer + 'down');
                        }
                    }
                ])
            }


            if (that.contextMenuProvider != null && !element.isFolder) {

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
                event.stopPropagation();
                openContextMenu(contextMenuItems, event.pageX, event.pageY);
            }
        };

        element.$htmlFirstLine[0].addEventListener("contextmenu", contextmenuHandler, false);

        // long press for touch devices
        let pressTimer: number;
        if (!jo_mouseDetected) {
            element.$htmlFirstLine.on('pointerup', () => {
                clearTimeout(pressTimer);
                return false;
            }).on('pointerdown', (event) => {
                pressTimer = window.setTimeout(() => {
                    contextmenuHandler(event);
                }, 500);
                return false;
            });
        }

        if (!jo_mouseDetected) {
            element.$htmlFirstLine.find('.jo_settings_button').on('pointerdown', (e) => {
                contextmenuHandler(e);
            });
            element.$htmlFirstLine.find('.jo_settings_button').on('mousedown click', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        }

        if (that.withDeleteButton) {
            element.$htmlFirstLine.find('.jo_delete').on(mousePointer + 'down', (ev) => {
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

                        if (element.isFolder) {
                            if (that.getChildElements(element).length > 0) {
                                alert('Dieser Ordner kann nicht gelöscht werden, da er nicht leer ist.');
                                return;
                            }
                        }

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

    moveElement(elementToMove: AccordionElement, destinationFolder: AccordionElement) {
        let destinationPath: string[] = destinationFolder == null ? [] : destinationFolder.path.slice(0).concat([destinationFolder.name]);
        if (elementToMove.isFolder) {
            let sourcePath = elementToMove.path.concat([elementToMove.name]).join("/");
            for(let element of this.elements){
                if(element.path.join("/").startsWith(sourcePath)){
                    element.path.splice(0, elementToMove.path.length);
                    element.path = destinationPath.concat(element.path);
                    element.$htmlFirstLine.remove();
                    this.elements.splice(this.elements.indexOf(element), 1);
                    this.renderElement(element);
                    this.insertElement(element);
                    this.moveCallback(element);
                }
            }
        } else {
            elementToMove.path = destinationPath;
            elementToMove.$htmlFirstLine.remove();
            this.elements.splice(this.elements.indexOf(elementToMove), 1);
            this.renderElement(elementToMove);
            this.insertElement(elementToMove);
            this.moveCallback(elementToMove);
        }
    }

    getChildElements(folder: AccordionElement): AccordionElement[] {
        let path = folder.path.slice(0).concat(folder.name).join("/");
        return this.elements.filter((element) => element.path.join("/").startsWith(path));
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

    select(externalElement: any, invokeCallback: boolean = true, scrollIntoView: boolean = false) {

        if (externalElement == null) {
            for (let ae1 of this.elements) {
                if (ae1.$htmlFirstLine.hasClass('jo_active')) ae1.$htmlFirstLine.removeClass('jo_active');
            }
        } else {
            let ae = this.findElement(externalElement);

            if (ae != null) {
                for (let ae1 of this.elements) {
                    if (ae1.$htmlFirstLine.hasClass('jo_active')) ae1.$htmlFirstLine.removeClass('jo_active');
                }

                ae.$htmlFirstLine.addClass('jo_active');
                if (scrollIntoView) {
                    ae.$htmlFirstLine[0].scrollIntoView();
                }
            }

        }

        if (invokeCallback && this.selectCallback != null) this.selectCallback(externalElement);

    }

    setElementClass(element: AccordionElement, iconClass: string) {
        if (element != null) {
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

    getSelectedElement(): AccordionElement {
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