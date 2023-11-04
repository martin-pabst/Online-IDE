import { Interpreter, ProgramStackElement, InterpreterState } from "./Interpreter.js";
import { Main } from "../main/Main.js";
import { Value, Heap } from "../compiler/types/Types.js";
import { Module } from "../compiler/parser/Module.js";
import { TextPosition } from "../compiler/lexer/Token.js";
import { Program } from "../compiler/parser/Program.js";
import { SymbolTable } from "../compiler/parser/SymbolTable.js";
import { DebuggerElement } from "./DebuggerElement.js";
import { Accordion, AccordionPanel, AccordionElement } from "../main/gui/Accordion.js";
import { StaticClass } from "../compiler/types/Class.js";
import { AdhocCompiler } from "../compiler/AdhocCompiler.js";
import { WatcherElement } from "./WatcherElement.js";
import { MainBase } from "../main/MainBase.js";
import jQuery from "jquery";

export class Debugger {

    lastSymboltable: SymbolTable;
    lastDebuggerElements: DebuggerElement[] = [];
    accordion: Accordion;

    variablePanel: AccordionPanel;

    watchPanel: AccordionPanel;

    isBlurred: boolean = false;


    constructor(private main: MainBase, private $debuggerDiv: JQuery<HTMLElement>, private $projectexplorerDiv?: JQuery<HTMLElement>) {

        this.accordion = new Accordion(main, $debuggerDiv);

        this.variablePanel = new AccordionPanel(this.accordion, "Variablen", "3", null, null, "", false, false, "file", false, []);
        this.variablePanel.$listElement.css('margin-left', '4px');

        this.watchPanel = new AccordionPanel(this.accordion, "Beobachten", "2",
            "img_add-dark", "Beobachtungsterm hinzufügen",
            "watcher", true, false, "file", false, []);
        this.watchPanel.$listElement.css('margin-left', '4px');

        let that = this;
        this.watchPanel.newElementCallback = (accordionElement, callbackIfSuccesful) => {
            that.addWatchExpression(accordionElement);
            callbackIfSuccesful(accordionElement.externalElement);
            return null;
        };

        this.watchPanel.deleteCallback = (watchExpression, callbackIfSuccesful) => {
            that.deleteWatchExpression(watchExpression);
            callbackIfSuccesful();
        };

        this.watchPanel.renameCallback = (watchExpression, newName) => {
            that.renameWatchExpression(watchExpression, newName);
            return newName;
        }

        this.$debuggerDiv.hide();
    }

    public enable() {
        if (this.$projectexplorerDiv != null) {
            this.$projectexplorerDiv.hide();
        }
        this.$debuggerDiv.show();
        this.$debuggerDiv.parent().find(".jo_alternativeText").hide();
    }

    public disable() {
        if (this.$projectexplorerDiv != null) {
            this.$projectexplorerDiv.show();
        }
        this.$debuggerDiv.hide();
        this.$debuggerDiv.parent().find(".jo_alternativeText").show();
    }

    showData(currentProgram: Program, textPosition: TextPosition,
        stack: Value[], stackframe: number, heap: Heap) {

        if(this.$debuggerDiv.is(':hidden')) return;

        if (currentProgram.module.file == null) return; // inside command line

        let elementsToKeep: HTMLElement[] = [];

        let module = currentProgram.module;
        let symbolTable = module.findSymbolTableAtPosition(textPosition.line, textPosition.column);

        let oldDebuggerElements = this.lastDebuggerElements;

        this.lastDebuggerElements = [];
        let $variableList = this.variablePanel.$listElement;

        let st = symbolTable;

        if(symbolTable == null) return;

        if (st.classContext != null) {

            let object = stack[stackframe];
            // same object context as before?
            if (oldDebuggerElements.length > 0 && oldDebuggerElements[0].value == object && oldDebuggerElements[0].variable == null) {
                // yes => keep old Debugger Element and html-Element
                this.lastDebuggerElements.push(oldDebuggerElements[0]);
                elementsToKeep.push(this.lastDebuggerElements[0].$debuggerElement[0]);
            } else {
                // no => make a new one
                let thisString = (st.classContext instanceof StaticClass) ? st.classContext.identifier : "this";
                let de: DebuggerElement = new DebuggerElement(null, null, thisString, object, st.classContext, null);
                this.lastDebuggerElements.push(de);
            }

        }

        // in nested scopes there may be a variable in inner scope with same
        // identifier as variable in outer scope. We only want to show the variable in 
        // the inner scope, so we iterate from inner scope to outer scope and keep
        // track of already shown variable names:
        let visibleVariablesMap: { [identifier: string]: boolean } = {};

        // iterate over SymbolTable from inside to outside
        while (st != null) {

            st.variableMap.forEach((variable, identifier) => {

                // had there been a variable with same identifier in inner scope?
                if (visibleVariablesMap[variable.identifier] == null) {
                    // no
                    visibleVariablesMap[variable.identifier] = true;

                    let de: DebuggerElement;

                    // Reuse old Debugger Element vor variable, if present
                    for (let oldDe of oldDebuggerElements) {
                        if (oldDe.variable == variable && oldDe.$debuggerElement != null) {
                            de = oldDe;
                            elementsToKeep.push(de.$debuggerElement[0]);

                            if (de.value == null && de.variable != null) {
                                de.value = stack[stackframe + de.variable.stackPos];
                            }

                        }
                    }

                    // no old debugger element present, so make a new one
                    if (de == null) {
                        let value = stack[stackframe + variable.stackPos];
                        de = new DebuggerElement(null, null, identifier, value, variable.type, variable);
                    }

                    this.lastDebuggerElements.push(de);

                }

            }, this);

            // next outer symbol table
            st = st.parent;
        }

        // if we are outside class context, then variables on heap are visible:
        if (symbolTable.classContext == null) {
            for (let identifier in heap) {

                let variable = heap[identifier];

                if (visibleVariablesMap[variable.identifier] != true) {

                    visibleVariablesMap[variable.identifier] = true;

                    let de: DebuggerElement;

                    for (let oldDe of oldDebuggerElements) {
                        if (oldDe.variable == variable) {
                            de = oldDe;
                            elementsToKeep.push(de.$debuggerElement[0]);

                            de.value = de.variable.value;

                        }
                    }

                    if (de == null) {
                        let value = variable.value;
                        de = new DebuggerElement(null, null, identifier, value, variable.type, variable);
                    }

                    this.lastDebuggerElements.push(de);

                }
            }
        }

        // remove unused elements from html DOM:
        for (let child of $variableList.children()) {
            if (!(elementsToKeep.indexOf(child) >= 0)) {
                child.remove();
            }
        }

        // inject new values into debugger elements:
        for (let de of this.lastDebuggerElements) {

            if (de.variable != null) {
                if (de.variable.stackPos != null) {
                    de.value = stack[stackframe + de.variable.stackPos];
                } else {
                    de.value = de.variable.value;
                }
            }

            de.render();

            // if html element corresponding to debugger element is not already present in Browser-DOM
            // then append it to DOM
            if (elementsToKeep.indexOf(de.$debuggerElement[0]) < 0) {
                $variableList.append(de.$debuggerElement);
            }
        }

        this.lastSymboltable = symbolTable;

        // this.evaluateWatcherExpressions(currentProgram, textPosition, stack, stackframe);
        this.evaluateWatcherExpressions();

    }

    renameWatchExpression(watcherElement: WatcherElement, newName: string) {
        watcherElement.expression = newName;

        monaco.editor.colorize(newName, 'myJava', { tabSize: 3 }).then((command) => {

            let $div = watcherElement.accordionElement.$htmlFirstLine.find('.jo_filename');
            command = '<span class="jo_watcherExpression">' + command + "</span>";
            $div.html(command);
            $div.attr('title', watcherElement.expression);

        });

        if (this.main.getInterpreter().state == InterpreterState.paused) {
            watcherElement.evaluate();
        }


    }

    deleteWatchExpression(watchExpression: any) {
        // nothing to do
    }

    addWatchExpression(accordionElement: AccordionElement) {

        accordionElement.$htmlSecondLine = jQuery('<div></div>');
        let $rightTextAfterFilename = accordionElement.$htmlFirstLine.parent().find('.jo_textAfterName').first();

        let we = new WatcherElement(accordionElement.name, accordionElement,
            this.main, accordionElement.$htmlSecondLine, $rightTextAfterFilename);

        accordionElement.externalElement = we;

        monaco.editor.colorize(accordionElement.name, 'myJava', { tabSize: 3 }).then((command) => {

            let $div = accordionElement.$htmlFirstLine.find('.jo_filename');
            command = '<span class="jo_watcherExpression">' + command + "</span>";
            $div.html(command);
            $div.attr('title', accordionElement.externalElement.expression);

        });

        we.evaluate();

    }

    evaluateWatcherExpressions() {

        for (let ae of this.watchPanel.elements) {
            let we: WatcherElement = ae.externalElement;
            we.evaluate();
        }


    }

    blur(doBlur: boolean){
        // first check against field for performance reasons:
        if(this.isBlurred != doBlur){
            this.$debuggerDiv.find('.jo_projectexplorerdiv').css('filter', doBlur ? 'blur(2px)': 'none');
            this.isBlurred = doBlur;
        }
    }

}