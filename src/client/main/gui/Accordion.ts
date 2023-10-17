import jQuery from 'jquery';
import { openContextMenu, makeEditable, ContextMenuItem, jo_mouseDetected, animateToTransparent } from "../../tools/HtmlTools.js";
import { Helper } from "./Helper.js";
import { escapeHtml } from "../../tools/StringTools.js";
import { isJSDocThisTag, isThisTypeNode } from "typescript";
import { WorkspaceImporter } from "./WorkspaceImporter.js";
import { Main } from "../Main.js";
import { MainBase } from "../MainBase.js";
import { Workspace } from '../../workspace/Workspace.js';

export type AccordionElement = {
    name: string;
    sortName?: string;      // if sortName == null, then name will be used when sorting
    externalElement?: any;
    iconClass?: string;
    $htmlFirstLine?: JQuery<HTMLElement>;
    $htmlSecondLine?: JQuery<HTMLElement>;

    isFolder: boolean;
    path: string[];

    isPruefungFolder: boolean;

    readonly: boolean;
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
    $listOuter: JQuery<HTMLElement>;

    private fixed: boolean;

    dontSortElements: boolean = false;

    static currentlyDraggedElement: AccordionElement;
    static currentlyDraggedElementKind: string;
    
    newElementCallback: (ae: AccordionElement, callbackIfSuccessful: (externalElement: any) => void) => void;
    newFolderCallback: (ae: AccordionElement, callbackIfSuccessful: (externalElement: any) => void) => void;
    renameCallback: (externalElement: any, newName: string, ae: AccordionElement) => string;
    deleteCallback: (externalElement: any, callbackIfSuccessful: () => void) => void;
    selectCallback: (externalElement: any) => void;
    addElementActionCallback: (accordionElement: AccordionElement) => JQuery<HTMLElement>;
    contextMenuProvider: (externalElement: any) => AccordionContextMenuItem[];
    moveCallback: (ae: AccordionElement | AccordionElement[]) => void;
    dropElementCallback: (dest: AccordionElement, droppedElement: AccordionElement, dropEffekt: "copy" | "move") => void;

    $newFolderAction: JQuery<HTMLElement>;

    private _$caption: JQuery<HTMLElement>;

    constructor(private accordion: Accordion, caption: string | JQuery<HTMLElement>, private flexWeight: string,
        private newButtonClass: string, private buttonNewTitle: string,
        private defaultIconClass: string, public withDeleteButton: boolean, private withFolders: boolean,
        private kind: "workspace" | "file" | "class" | "student", private enableDrag: boolean, private acceptDropKinds: string[]) {

        this._$caption = (typeof caption == "string") ? jQuery(`<div class="jo_captiontext">${caption}</div>`) : caption;

        accordion.addPanel(this);

        let mousePointer = window.PointerEvent ? "pointer" : "mouse";

        if (withFolders) {
            let that = this;
            this.$newFolderAction = jQuery('<div class="img_add-folder-dark jo_button jo_active" style="margin-right: 4px"' +
                ' title="Neuen Ordner auf oberster Ebene anlegen">');
            this.$newFolderAction.on(mousePointer + 'down', (e) => {
                e.stopPropagation();
                e.preventDefault();

                let pathArray: string[] = [];

                this.addFolder("Neuer Ordner", pathArray, (newElement: AccordionElement) => {
                    this.newFolderCallback(newElement, () => {
                        this.sortElements();
                        newElement.$htmlFirstLine[0].scrollIntoView();
                        animateToTransparent(newElement.$htmlFirstLine.find('.jo_filename'), 'background-color', [0, 255, 0], 2000);
                    });
                });

            })

            this.addAction(this.$newFolderAction);


            let $collapseAllAction = jQuery('<div class="img_collapse-all-dark jo_button jo_active" style="margin-right: 4px"' +
                ' title="Alle Ordner zusammenfalten">');
            $collapseAllAction.on(mousePointer + 'down', (e) => {
                e.stopPropagation();
                e.preventDefault();

                that.collapseAll();

            })

            this.addAction($collapseAllAction);

        }

    }

    hide() {

        this.$listOuter.animate({
            'flex-grow': 0.001
        }, 1000, () => { this.$listOuter.hide(); this.$captionElement.hide(); });
        
    }
    
    show() {
        let targetGrow = this.$listOuter.data('grow');
        this.$listOuter.show();
        this.$captionElement.show();
        this.$listOuter.animate({
            'flex-grow': targetGrow
        }, 1000);
    }

    collapseAll() {
        for (let element of this.elements) {
            if (element.isFolder) {
                if (element.$htmlFirstLine.hasClass('jo_expanded')) {
                    element.$htmlFirstLine.removeClass('jo_expanded');
                    element.$htmlFirstLine.addClass('jo_collapsed');
                }
            }
            if (element.path.length > 0) {
                element.$htmlFirstLine.slideUp(200);
            }
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

    compareWithPath(name1: string, path1: string[], isFolder1: boolean, name2: string, path2: string[], isFolder2: boolean) {

        path1 = path1.slice();
        path1.push(name1);
        name1 = "";

        path2 = path2.slice();
        path2.push(name2);
        name2 = "";

        if(path1[0] == '_Prüfungen' && path2[0] != '_Prüfungen') return 1;
        if(path2[0] == '_Prüfungen' && path1[0] != '_Prüfungen') return -1;

        let i = 0;
        while (i < path1.length && i < path2.length) {
            let cmp = path1[i].localeCompare(path2[i]);
            if (cmp != 0) return cmp;
            i++;
        }

        if (path1.length < path2.length) return -1;
        if (path1.length > path2.length) return 1;

        return name1.localeCompare(name2);


        // let nameWithPath1 = path1.join("/");
        // if (nameWithPath1 != "" && name1 != "") nameWithPath1 += "/";
        // nameWithPath1 += name1;

        // let nameWithPath2 = path2.join("/");
        // if (nameWithPath2 != "" && name2 != "") nameWithPath2 += "/";
        // nameWithPath2 += name2;

        // return nameWithPath1.localeCompare(nameWithPath2);
    }


    getElementIndex(name: string, path: string[], isFolder: boolean): number {

        for (let i = 0; i < this.elements.length; i++) {
            let element = this.elements[i];

            if (this.compareWithPath(name, path, isFolder, element.name, element.path, element.isFolder) < 0) return i;

        }
        return this.elements.length;
    }

    insertElement(ae: AccordionElement) {
        let insertIndex = this.getElementIndex(ae.name, ae.path, ae.isFolder);
        // if (ae.path.length == 0) insertIndex = this.elements.length;
        this.elements.splice(insertIndex, 0, ae);

        let $elements = this.$listElement.find('.jo_file');

        if (insertIndex == 0) {
            this.$listElement.prepend(ae.$htmlFirstLine);
        } else if (insertIndex == $elements.length) {
            this.$listElement.append(ae.$htmlFirstLine);
        } else {
            let elementAtIndex = $elements.get(insertIndex);
            jQuery(elementAtIndex).before(ae.$htmlFirstLine);
        }

    }

    addFolder(name: string, path: string[], callback: (newPanel: AccordionElement) => void) {

        let ae: AccordionElement = {
            name: name,
            isFolder: true,
            path: path,
            readonly: false,
            isPruefungFolder: false
        }

        let $element = this.renderElement(ae, true);

        this.insertElement(ae);

        $element[0].scrollIntoView();

        this.renameElement(ae, () => {

            callback(ae);

        });

    }


    renderOuterHtmlElements($accordionDiv: JQuery<HTMLElement>) {
        let that = this;

        this.$captionElement = jQuery(`<div class="jo_leftpanelcaption jo_expanded"><div class="jo_actions"></div></div>`);
        this.$captionElement.prepend(this._$caption);
        this.$captionElement.prepend(jQuery('<div class="jo_expandIcon"></div>'))

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
                    path: path, 
                    readonly: false,
                    isPruefungFolder: false
                }

                let insertIndex = this.getElementIndex("", path, false);
                this.elements.splice(insertIndex, 0, ae);
                let $element = this.renderElement(ae, true);


                if (insertIndex == 0) {
                    this.$listElement.prepend($element);
                } else {
                    let elementAtIndex = this.$listElement.find('.jo_file').get(insertIndex - 1);
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

        this.$listOuter = jQuery('<div class="jo_projectexplorerdiv jo_scrollable" data-grow="'
            + this.flexWeight + '" style="flex-grow: ' + this.flexWeight + '"></div>');
        this.$listElement = jQuery('<div class="jo_filelist"></div>')

        this.$listOuter.append(this.$listElement);

        $accordionDiv.append(this.$captionElement);
        $accordionDiv.append(this.$listOuter);

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

        $ce.on('dragover', (event) => {
            if (AccordionPanel.currentlyDraggedElementKind == that.kind) {
                $ce.addClass('jo_file_dragover');
                event.preventDefault();
            }
        })

        $ce.on('dragleave', (event) => {
            $ce.removeClass('jo_file_dragover');
        })

        $ce.on('drop', (event) => {
            if (AccordionPanel.currentlyDraggedElementKind == that.kind) {
                event.preventDefault();
                $ce.removeClass('jo_file_dragover');
                let element1 = AccordionPanel.currentlyDraggedElement;
                if (element1 != null) {
                    that.moveElement(element1, null);
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

    addElement(element: AccordionElement, expanded: boolean) {
        // this.elements.push(element);
        // element.$htmlFirstLine = this.renderElement(element, expanded);
        // this.$listElement.prepend(element.$htmlFirstLine);
        element.$htmlFirstLine = this.renderElement(element, expanded);
        this.insertElement(element);
    }

    sortElements() {
        if (this.dontSortElements) return;
        this.elements.sort((a, b) => {
            let aName = a.sortName ? a.sortName : a.name;
            let bName = b.sortName ? b.sortName : b.name;

            return this.compareWithPath(aName, a.path, a.isFolder, bName, b.path, b.isFolder);

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

    renderElement(element: AccordionElement, expanded: boolean): JQuery<HTMLElement> {

        let mousePointer = window.PointerEvent ? "pointer" : "mouse";
        let that = this;

        let expandedCollapsed = "";

        if (element.iconClass == null) element.iconClass = this.defaultIconClass;
        if (element.isFolder) {
            element.iconClass = "folder";
            expandedCollapsed = expanded ? " jo_expanded" : " jo_collapsed";
        }

        let pathHtml = "";
        if (element.path == null) element.path = [];
        for (let i = 0; i < element.path.length; i++) {
            pathHtml += '<div class="jo_folderline"></div>';
        }

        
        element.$htmlFirstLine = jQuery(`<div class="jo_file jo_${element.iconClass} ${expandedCollapsed}">
        <div class="jo_folderlines">${pathHtml}</div>
        <div class="jo_fileimage"></div>
        <div class="jo_filename"></div>
        <div class="jo_textAfterName"></div>
        <div class="jo_additionalButtonHomework"></div>
        <div class="jo_additionalButtonStart"></div>
        <div class="jo_additionalButtonRepository"></div>
        ${this.withDeleteButton && !element.readonly ? '<div class="jo_delete img_delete jo_button jo_active' + (false ? " jo_delete_always" : "") + '"></div>' : ""}
        ${!jo_mouseDetected ? '<div class="jo_settings_button img_ellipsis-dark jo_button jo_active"></div>' : ""}
        </div>`);

        let name = escapeHtml(element.name);
        let $filenameElement = element.$htmlFirstLine.find('.jo_filename');
        if(name == '_Prüfungen' && element.isFolder){
            name = 'Prüfungen';
            element.isPruefungFolder = true;
            $filenameElement.addClass('joe_pruefungfolder');
        }

        $filenameElement.text(name);
        
        if (!expanded && element.path.length > 0) {
            element.$htmlFirstLine.hide();
        }

        if (this.addElementActionCallback != null) {
            let $elementAction = this.addElementActionCallback(element);
            element.$htmlFirstLine.append($elementAction);
        }

        if (this.withFolders) {
            if (element.isFolder && !element.readonly) {
                element.$htmlFirstLine.on('dragover', (event) => {
                    if (AccordionPanel.currentlyDraggedElementKind == that.kind) {
                        element.$htmlFirstLine.addClass('jo_file_dragover');
                        event.preventDefault();
                    }
                })

                element.$htmlFirstLine.on('dragleave', (event) => {
                    element.$htmlFirstLine.removeClass('jo_file_dragover');
                })

                element.$htmlFirstLine.on('drop', (event) => {
                    if (AccordionPanel.currentlyDraggedElementKind == that.kind) {
                        event.preventDefault();
                        element.$htmlFirstLine.removeClass('jo_file_dragover');
                        let element1 = AccordionPanel.currentlyDraggedElement;
                        AccordionPanel.currentlyDraggedElement = null;
                        if (element1 != null) {
                            that.moveElement(element1, element);
                        }
                    }
                });
            }
        }

        if (this.withFolders || this.enableDrag) {
            let $filedragpart = element.$htmlFirstLine.find('.jo_filename');
            $filedragpart.attr('draggable', 'true');
            $filedragpart.on('dragstart', (event) => {
                AccordionPanel.currentlyDraggedElement = element;
                AccordionPanel.currentlyDraggedElementKind = that.kind;
                event.originalEvent.dataTransfer.effectAllowed = element.isFolder ? "move" : "copyMove";
            })
        }

        if (this.acceptDropKinds != null && this.acceptDropKinds.length > 0) {
            if (!element.isFolder) {
                element.$htmlFirstLine.on('dragover', (event) => {
                    if (this.acceptDropKinds.indexOf(AccordionPanel.currentlyDraggedElementKind) >= 0) {
                        element.$htmlFirstLine.addClass('jo_file_dragover');

                        if (event.ctrlKey) {
                            event.originalEvent.dataTransfer.dropEffect = "copy";
                        } else {
                            event.originalEvent.dataTransfer.dropEffect = "move";
                        }

                        event.preventDefault();
                    }
                })

                element.$htmlFirstLine.on('dragleave', (event) => {
                    element.$htmlFirstLine.removeClass('jo_file_dragover');
                })

                element.$htmlFirstLine.on('drop', (event) => {
                    if (this.acceptDropKinds.indexOf(AccordionPanel.currentlyDraggedElementKind) >= 0) {
                        event.preventDefault();
                        element.$htmlFirstLine.removeClass('jo_file_dragover');

                        let element1 = AccordionPanel.currentlyDraggedElement;
                        AccordionPanel.currentlyDraggedElement = null;
                        if (element1 != null) {
                            if (that.dropElementCallback != null) that.dropElementCallback(element, element1, event.ctrlKey ? "copy" : "move");
                        }
                    }
                });
            }
        }


        element.$htmlFirstLine.on(mousePointer + 'up', (ev) => {

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
                            e.$htmlFirstLine.slideUp(200);
                        } else {
                            e.$htmlFirstLine.slideDown(200);
                        }
                    }

                }


            }
        });

        let contextmenuHandler = function (event) {

            let contextMenuItems: ContextMenuItem[] = [];
            if (that.renameCallback != null && !element.readonly) {
                contextMenuItems.push({
                    caption: "Umbenennen",
                    callback: () => {
                        that.renameElement(element);
                    }
                })
            }

            let mousePointer = window.PointerEvent ? "pointer" : "mouse";

            if (element.isFolder && !element.readonly) {
                contextMenuItems = contextMenuItems.concat([
                    {
                        caption: "Neuen Unterordner anlegen (unterhalb '" + element.name + "')...",
                        callback: () => {
                            that.select(element.externalElement);
                            // that.$newFolderAction.trigger(mousePointer + 'down');
                            let pathArray = that.getCurrentlySelectedPath();

                            that.addFolder("Neuer Ordner", pathArray, (newElement: AccordionElement) => {
                                that.newFolderCallback(newElement, () => {
                                    that.sortElements();
                                    newElement.$htmlFirstLine[0].scrollIntoView();
                                    animateToTransparent(newElement.$htmlFirstLine.find('.jo_filename'), 'background-color', [0, 255, 0], 2000);
                                });
                            });

                        }
                    }, {
                        caption: "Neuer Workspace...",
                        callback: () => {
                            that.select(element.externalElement);
                            that.$buttonNew.trigger(mousePointer + 'down');
                        }
                    }, {
                        caption: "Workspace importieren...",
                        callback: () => {
                            new WorkspaceImporter(<Main>that.accordion.main, element.path.concat([element.name])).show();
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

        element.$htmlFirstLine[0].addEventListener("contextmenu", (event) => {
            contextmenuHandler(event);
        }, false);

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

        if (that.withDeleteButton && !element.readonly) {

            element.$htmlFirstLine.find('.jo_delete')[0].addEventListener("contextmenu", (event) => {
                event.preventDefault();
                event.stopPropagation();
            }, false);


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
            let movedElements: AccordionElement[] = [elementToMove];

            let sourcePath = elementToMove.path.concat([elementToMove.name]).join("/");

            if (destinationPath.join('/').indexOf(sourcePath) == 0) return;

            let oldPathLength = elementToMove.path.length;
            elementToMove.path = destinationPath.slice(0);

            for (let element of this.elements) {
                if (element.path.join("/").startsWith(sourcePath)) {
                    element.path.splice(0, oldPathLength);
                    element.path = destinationPath.concat(element.path);
                    movedElements.push(element);
                }
            }

            for (let el of movedElements) {
                el.$htmlFirstLine.remove();
                this.elements.splice(this.elements.indexOf(el), 1);
            }
            for (let el of movedElements) {
                this.renderElement(el, true);
                this.insertElement(el);
            }

            this.moveCallback(movedElements);
        } else {
            elementToMove.path = destinationPath;
            elementToMove.$htmlFirstLine.remove();
            this.elements.splice(this.elements.indexOf(elementToMove), 1);
            this.renderElement(elementToMove, true);
            this.insertElement(elementToMove);
            this.select(elementToMove.externalElement);
            elementToMove.$htmlFirstLine[0].scrollIntoView();
            this.moveCallback(elementToMove);
        }
    }

    getChildElements(folder: AccordionElement): AccordionElement[] {
        let path = folder.path.slice(0).concat(folder.name).join("/");
        return this.elements.filter((element) => element.path.join("/").startsWith(path));
    }


    pathStartsWith(path: string[], pathStart: string[]){
        if(path.length < pathStart.length) return false;
        for(let i = 0; i < pathStart.length; i++){
            if(path[i] != pathStart[i]) return false;
        }

        return true;
    }

    renameElement(element: AccordionElement, callback?: () => void) {
        let that = this;
        let $div = element.$htmlFirstLine.find('.jo_filename');
        let pointPos = element.name.indexOf('.');
        let selection = pointPos == null ? null : { start: 0, end: pointPos };
        this.dontSortElements = true;
        makeEditable($div, $div, (newText: string) => {
            if (element.externalElement != null) newText = that.renameCallback(element.externalElement, newText, element);
            let oldName = element.name;
            element.name = newText;
            $div.html(element.name);

            if(element.isFolder){
                
                let oldPath = element.path.slice().concat([oldName]);

                let movedElements: AccordionElement[] = [];

                for(let e of this.elements){

                    if(this.pathStartsWith(e.path, oldPath)){
                        e.path[oldPath.length - 1] = element.name;
                        movedElements.push(e);
                    }

                }

                if(movedElements.length > 0) this.moveCallback(movedElements);

            }


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
                    let pathString = ae.path.join("/");
                    for (let el of this.elements) {
                        let elPath = el.path.slice(0);
                        if (pathString.startsWith(elPath.join("/"))) {
                            if (el.isFolder) {
                                elPath.push(el.name);
                                if (pathString.startsWith(elPath.join("/"))) {
                                    el.$htmlFirstLine.removeClass("jo_collapsed");
                                    el.$htmlFirstLine.addClass("jo_expanded");
                                }
                            }
                            el.$htmlFirstLine.show();
                        }

                    }

                    ae.$htmlFirstLine[0].scrollIntoView();
                }
            }

        }

        if (invokeCallback && this.selectCallback != null) this.selectCallback(externalElement);

    }

    getPathString(ae: AccordionElement) {
        let ps: string = ae.path.join("/");
        if (ae.isFolder) {
            if (ps != "") ps += "/";
            ps += ae.name;
        }
        return ps;
    }

    setElementClass(element: AccordionElement, iconClass: string, fileimageTitle?: string) {
        if (element != null) {
            element.$htmlFirstLine?.removeClass("jo_" + element.iconClass).addClass("jo_" + iconClass);
            element.iconClass = iconClass;
            if(fileimageTitle != null){
                element.$htmlFirstLine.find('.jo_fileimage').attr('title', fileimageTitle);
            }
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
        this.$captionElement.find('.jo_captiontext').html(text);
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

    constructor(public main: MainBase, $html: JQuery<HTMLElement>) {
        this.$html = $html;
        $html.addClass('jo_leftpanelinner');
    }

    addPanel(panel: AccordionPanel) {
        panel.renderOuterHtmlElements(this.$html);
        this.parts.push(panel);
    }



}