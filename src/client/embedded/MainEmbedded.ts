import { Compiler, CompilerStatus } from "../compiler/Compiler.js";
import { Module, File, ExportedWorkspace } from "../compiler/parser/Module.js";
import { Debugger } from "../interpreter/Debugger.js";
import { Interpreter, InterpreterState } from "../interpreter/Interpreter.js";
import { ActionManager } from "../main/gui/ActionManager.js";
import { BottomDiv } from "../main/gui/BottomDiv.js";
import { Editor } from "../main/gui/Editor.js";
import { ProgramControlButtons } from "../main/gui/ProgramControlButtons.js";
import { RightDiv } from "../main/gui/RightDiv.js";
import { MainBase } from "../main/MainBase.js";
import { Workspace } from "../workspace/Workspace.js";
import { JOScript } from "./EmbeddedStarter.js";
import { downloadFile, makeDiv, makeTabs, openContextMenu } from "../tools/HtmlTools.js";
import { EmbeddedSlider } from "./EmbeddedSlider.js";
import { EmbeddedFileExplorer } from "./EmbeddedFileExplorer.js";
import { TextPosition } from "../compiler/lexer/Token.js";
import { EmbeddedIndexedDB } from "./EmbeddedIndexedDB.js";
import { SemicolonAngel } from "../compiler/parser/SemicolonAngel.js";
import { TextPositionWithModule } from "../compiler/types/Types.js";
import { HitPolygonStore } from "../runtimelibrary/graphics/PolygonStore.js";
import { SpritesheetData } from "../spritemanager/SpritesheetData.js";
import * as PIXI from 'pixi.js';
import jQuery from "jquery";


type JavaOnlineConfig = {
    withFileList?: boolean,
    withPCode?: boolean,
    withConsole?: boolean,
    withErrorList?: boolean,
    withBottomPanel?: boolean,
    speed?: number | "max",
    id?: string,
    hideStartPanel?: boolean,
    hideEditor?: boolean,
    libraries?: string[],
    jsonFilename?: string,
    spritesheetURL?: string
}

export class MainEmbedded implements MainBase {

    pixiApp: PIXI.Application;

    isEmbedded(): boolean { return true; }

    jumpToDeclaration(module: Module, declaration: TextPositionWithModule) { };

    getCompiler(): Compiler {
        return this.compiler;
    }
    getInterpreter(): Interpreter {
        return this.interpreter;
    }
    getCurrentWorkspace(): Workspace {
        return this.currentWorkspace;
    }
    getDebugger(): Debugger {
        return this.debugger;
    }
    getMonacoEditor(): monaco.editor.IStandaloneCodeEditor {
        return this.editor.editor;
    }

    getRightDiv(): RightDiv {
        return this.rightDiv;
    }

    getBottomDiv(): BottomDiv {
        return this.bottomDiv;
    }

    getActionManager(): ActionManager {
        return this.actionManager;
    }

    getCurrentlyEditedModule(): Module {
        if (this.config.withFileList) {
            return this.fileExplorer.currentFile?.module;
        } else {
            return this.currentWorkspace.moduleStore.getFirstModule();
        }
    }

    config: JavaOnlineConfig;

    editor: Editor;
    programPointerDecoration: string[] = [];
    programPointerModule: Module;

    currentWorkspace: Workspace;
    actionManager: ActionManager;

    compiler: Compiler;

    interpreter: Interpreter;
    $runDiv: JQuery<HTMLElement>;

    debugger: Debugger;
    $debuggerDiv: JQuery<HTMLElement>;

    bottomDiv: BottomDiv;
    $filesListDiv: JQuery<HTMLElement>;

    $hintDiv: JQuery<HTMLElement>;
    $monacoDiv: JQuery<HTMLElement>;
    $resetButton: JQuery<HTMLElement>;

    programIsExecutable = false;
    version: number = 0;

    timerHandle: any;

    rightDiv: RightDiv;
    $rightDivInner: JQuery<HTMLElement>;

    fileExplorer: EmbeddedFileExplorer;

    debounceDiagramDrawing: any;

    indexedDB: EmbeddedIndexedDB;

    compileRunsAfterCodeReset: number = 0;

    semicolonAngel: SemicolonAngel;

    userSpritesheet: PIXI.Spritesheet;
    
    constructor($div: JQuery<HTMLElement>, private scriptList: JOScript[]) {

        this.readConfig($div);

        this.initGUI($div);

        this.initScripts();

        if (!this.config.hideStartPanel) {
            this.indexedDB = new EmbeddedIndexedDB();
            this.indexedDB.open(() => {

                if (this.config.id != null) {
                    this.readScripts();
                }

            });
        }

        this.semicolonAngel = new SemicolonAngel(this);

    }

    initScripts() {

        this.fileExplorer?.removeAllFiles();

        this.initWorkspace(this.scriptList);

        if (this.config.withFileList) {
            this.fileExplorer = new EmbeddedFileExplorer(this.currentWorkspace.moduleStore, this.$filesListDiv, this);
            this.fileExplorer.setFirstFileActive();
            this.scriptList.filter((script) => script.type == "hint").forEach((script) => this.fileExplorer.addHint(script));
        } else {
            this.setModuleActive(this.currentWorkspace.moduleStore.getFirstModule());
        }

    }


    readConfig($div: JQuery<HTMLElement>) {
        let configJson: string | object = $div.data("java-online");
        if (configJson != null && typeof configJson == "string") {
            this.config = JSON.parse(configJson.split("'").join('"'));
        } else {
            this.config = {}
        }

        if (this.config.hideEditor == null) this.config.hideEditor = false;
        if (this.config.hideStartPanel == null) this.config.hideStartPanel = false;

        if (this.config.withBottomPanel == null) {
            this.config.withBottomPanel = this.config.withConsole || this.config.withPCode || this.config.withFileList || this.config.withErrorList;
        }

        if (this.config.hideEditor) {
            this.config.withBottomPanel = false;
            this.config.withFileList = false;
            this.config.withConsole = false;
            this.config.withPCode = false;
            this.config.withErrorList = false;
        }

        if (this.config.withBottomPanel) {
            if (this.config.withFileList == null) this.config.withFileList = true;
            if (this.config.withPCode == null) this.config.withPCode = true;
            if (this.config.withConsole == null) this.config.withConsole = true;
            if (this.config.withErrorList == null) this.config.withErrorList = true;
        }

        if (this.config.speed == null) this.config.speed = "max";
        if (this.config.libraries == null) this.config.libraries = [];
        if(this.config.jsonFilename == null) this.config.jsonFilename = "workspace.json";

    }

    setModuleActive(module: Module) {

        if(module == null) return;

        if (this.config.withFileList && this.fileExplorer.currentFile != null) {
            this.fileExplorer.currentFile.module.editorState = this.getMonacoEditor().saveViewState();
        }

        if (this.config.withFileList) {
            this.fileExplorer.markFile(module);
        }

        /**
         * WICHTIG: Die Reihenfolge der beiden Operationen ist extrem wichtig.
         * Falls das Model im readonly-Zustand gesetzt wird, funktioniert <Strg + .> 
         * nicht und die Lightbulbs werden nicht angezeigt, selbst dann, wenn
         * später readonly = false gesetzt wird.
         */
        this.getMonacoEditor().updateOptions({
            readOnly: false,
            lineNumbersMinChars: 4
        });
        this.editor.editor.setModel(module.model);


        if (module.editorState != null) {
            this.getMonacoEditor().restoreViewState(module.editorState);
        }

        module.renderBreakpointDecorators();

    }

    eraseDokuwikiSearchMarkup(text: string): string {
        return text.replace(/<span class="search\whit">(.*?)<\/span>/g, "$1");
    }

    readScripts() {

        let modules = this.currentWorkspace.moduleStore.getModules(false);

        let that = this;

        this.indexedDB.getScript(this.config.id, (scriptListJSon) => {
            if (scriptListJSon == null) {
                setInterval(() => {
                    that.saveScripts();
                }, 1000);
            } else {

                let scriptList: string[] = JSON.parse(scriptListJSon);
                let countDown = scriptList.length;

                for (let module of modules) {
                    that.fileExplorer?.removeModule(module);
                    that.removeModule(module);
                }

                for (let name of scriptList) {

                    let scriptId = this.config.id + name;
                    this.indexedDB.getScript(scriptId, (script) => {
                        if (script != null) {

                            script = this.eraseDokuwikiSearchMarkup(script);

                            let module = that.addModule({
                                title: name,
                                text: script,
                                type: "java"
                            });

                            that.fileExplorer?.addModule(module);
                            that.$resetButton.fadeIn(1000);

                            // console.log("Retrieving script " + scriptId);
                        }
                        countDown--;
                        if (countDown == 0) {
                            setInterval(() => {
                                that.saveScripts();
                            }, 1000);
                            that.fileExplorer?.setFirstFileActive();
                            if (that.fileExplorer == null) {
                                let modules = that.currentWorkspace.moduleStore.getModules(false);
                                if (modules.length > 0) that.setModuleActive(modules[0]);
                            }
                        }
                    })

                }

            }


        });


    }

    saveScripts() {

        let modules = this.currentWorkspace.moduleStore.getModules(false);

        let scriptList: string[] = [];
        let oneNotSaved: boolean = false;

        modules.forEach(m => oneNotSaved = oneNotSaved || !m.file.saved);

        if (oneNotSaved) {

            for (let module of modules) {
                scriptList.push(module.file.name);
                let scriptId = this.config.id + module.file.name;
                this.indexedDB.writeScript(scriptId, module.getProgramTextFromMonacoModel());
                module.file.saved = true;
                // console.log("Saving script " + scriptId);
            }

            this.indexedDB.writeScript(this.config.id, JSON.stringify(scriptList));
        }

    }

    deleteScriptsInDB() {
        this.indexedDB.getScript(this.config.id, (scriptListJSon) => {
            if (scriptListJSon == null) {
                return;
            } else {

                let scriptList: string[] = JSON.parse(scriptListJSon);

                for (let name of scriptList) {

                    let scriptId = this.config.id + name;
                    this.indexedDB.removeScript(scriptId);
                }

                this.indexedDB.removeScript(this.config.id);

            }


        });

    }

    initWorkspace(scriptList: JOScript[]) {
        this.currentWorkspace = new Workspace("Embedded-Workspace", this, 0);
        this.currentWorkspace.settings.libraries = this.config.libraries;
        this.currentWorkspace.alterAdditionalLibraries();

        let i = 0;
        for (let script of scriptList) {
            if (script.type == "java") {
                this.addModule(script);
            }

        }

    }

    addModule(script: JOScript): Module {
        let module: Module = Module.restoreFromData({
            id: this.currentWorkspace.moduleStore.getModules(true).length,
            name: script.title,
            text: script.text,
            text_before_revision: null,
            submitted_date: null,
            student_edited_after_revision: false,
            version: 1,
            workspace_id: 0,
            forceUpdate: false,
            identical_to_repository_version: false,
            file_type: 0
        }, this);

        this.currentWorkspace.moduleStore.putModule(module);

        let that = this;

        module.model.onDidChangeContent(() => {
            that.considerShowingCodeResetButton();
        });

        return module;
    }

    removeModule(module: Module) {
        this.currentWorkspace.moduleStore.removeModule(module);
    }


    initGUI($div: JQuery<HTMLElement>) {

        // let $leftDiv = jQuery('<div class="joe_leftDiv"></div>');

        $div.css({
            "background-image": "none",
            "background-size": "100%"
        })

        let $centerDiv = jQuery('<div class="joe_centerDiv"></div>');
        let $resetModalWindow = this.makeCodeResetModalWindow($div);

        let $rightDiv = this.makeRightDiv();

        let $editorDiv = jQuery('<div class="joe_editorDiv"></div>');
        this.$monacoDiv = jQuery('<div class="joe_monacoDiv"></div>');
        this.$hintDiv = jQuery('<div class="joe_hintDiv jo_scrollable"></div>');
        this.$resetButton = jQuery('<div class="joe_resetButton jo_button jo_active" title="Code auf Ausgangszustand zurücksetzen">Code Reset</div>');

        $editorDiv.append(this.$monacoDiv, this.$hintDiv, this.$resetButton);

        let $bracketErrorDiv = this.makeBracketErrorDiv();
        $editorDiv.append($bracketErrorDiv);

        this.$resetButton.hide();

        this.$resetButton.on("click", () => { $resetModalWindow.show(); })

        this.$hintDiv.hide();

        let $controlsDiv = jQuery('<div class="joe_controlsDiv"></div>');
        let $bottomDivInner = jQuery('<div class="joe_bottomDivInner"></div>');

        let $buttonOpen = jQuery('<label type="file" class="img_open-file jo_button jo_active"' +
            'style="margin-right: 8px;" title="Workspace aus Datei laden"><input type="file" style="display:none"></label>');

        let that = this;

        $buttonOpen.find('input').on('change', (event) => {
            //@ts-ignore
            var files: FileList = event.originalEvent.target.files;
            that.loadWorkspaceFromFile(files[0]);
        })

        let $buttonSave = jQuery('<div class="img_save-dark jo_button jo_active"' +
            'style="margin-right: 8px;" title="Workspace in Datei speichern"></div>');


        $buttonSave.on('click', () => { that.saveWorkspaceToFile() });

        $controlsDiv.append($buttonOpen, $buttonSave);



        if (this.config.withBottomPanel) {
            let $bottomDiv = jQuery('<div class="joe_bottomDiv"></div>');
            this.makeBottomDiv($bottomDivInner, $controlsDiv);
            $bottomDiv.append($bottomDivInner);
            if (this.config.withFileList) {
                let $filesDiv = this.makeFilesDiv();
                $bottomDiv.prepend($filesDiv);
                new EmbeddedSlider($filesDiv, false, false, () => { });
            }
            makeTabs($bottomDivInner);


            $centerDiv.append($editorDiv, $bottomDiv);
            new EmbeddedSlider($bottomDiv, true, true, () => { this.editor.editor.layout(); });
        } else {
            $centerDiv.prepend($editorDiv);
        }




        if (!this.config.withBottomPanel) {
            if (this.config.hideEditor) {
                $rightDiv.prepend($controlsDiv);
            } else {
                $centerDiv.prepend($controlsDiv);
                $controlsDiv.addClass('joe_controlPanel_top');
                $editorDiv.css({
                    'position': 'relative',
                    'height': '1px'
                });
            }
        }

        $div.addClass('joe_javaOnlineDiv');
        $div.append($centerDiv, $rightDiv);

        if (!this.config.hideEditor) {
            new EmbeddedSlider($rightDiv, true, false, () => {
                jQuery('.jo_graphics').trigger('sizeChanged');
                this.editor.editor.layout();
            });
        }

        this.editor = new Editor(this, false, true);
        this.editor.initGUI(this.$monacoDiv);
        this.$monacoDiv.find('.monaco-editor').css('z-index', '10');

        if ($div.attr('tabindex') == null) $div.attr('tabindex', "0");
        this.actionManager = new ActionManager($div, this);
        this.actionManager.init();

        this.bottomDiv = new BottomDiv(this, $bottomDivInner, $div);
        this.bottomDiv.initGUI();

        this.rightDiv = new RightDiv(this, this.$rightDivInner);
        this.rightDiv.initGUI();

        let $rightSideContainer = jQuery('<div class="jo_rightdiv-rightside-container">');
        let $coordinates = jQuery('<div class="jo_coordinates">(0/0)</div>');
        this.$rightDivInner.append($rightSideContainer);
        $rightSideContainer.append($coordinates);

        this.debugger = new Debugger(this, this.$debuggerDiv, null);

        this.interpreter = new Interpreter(this, this.debugger,
            new ProgramControlButtons($controlsDiv, $editorDiv),
            this.$runDiv);

        let $infoButton = jQuery('<div class="jo_button jo_active img_ellipsis-dark" style="margin-left: 16px"></div>');
        $controlsDiv.append($infoButton);

        $infoButton.on('mousedown', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            openContextMenu([{
                caption: "Über die Online-IDE ...",
                link: "https://www.online-ide.de",
                callback: () => {
                    // nothing to do.
                }
            }], ev.pageX + 2, ev.pageY + 2);
        });

        setTimeout(() => {
            this.interpreter.initGUI();
            this.editor.editor.layout();
            this.loadUserSpritesheet().then(() => {
                this.compiler = new Compiler(this);
                this.interpreter.controlButtons.speedControl.setSpeedInStepsPerSecond(this.config.speed);
                this.startTimer();
            });
        }, 200);

        if (this.config.hideEditor) {
            $centerDiv.hide();
            $rightDiv.css("flex", "1");
            if (!this.config.hideStartPanel) {
                $div.find(".joe_rightDivInner").css('height', 'calc(100% - 24px)');
                $div.find(".joe_controlsDiv").css('padding', '2px');
                $div.find(".jo_speedcontrol-outer").css('z-index', '10');
            } else {
                $div.find(".joe_controlsDiv").hide();
            }
        }


    }

    makeBracketErrorDiv(): JQuery<HTMLElement> {
        return jQuery(`
        <div class="jo_parenthesis_warning" title="Klammerwarnung!" style="bottom: 55px">
        <div class="jo_warning_light"></div>
        <div class="jo_pw_heading">{ }</div>
        <div title="Letzten Schritt rückgängig" 
            class="jo_pw_undo img_undo jo_button jo_active"></div>
        </div>
        `);
    }

    makeCodeResetModalWindow($parent: JQuery<HTMLElement>): JQuery<HTMLElement> {
        let $window = jQuery(
            `
            <div class="joe_codeResetModal">
            <div style="flex: 1"></div>
            <div style="display: flex">
                <div style="flex: 1"></div>
                <div style="padding-left: 30px;">
                <div style="color: red; margin-bottom: 10px; font-weight: bold">Warnung:</div>
                <div>Soll der Code wirklich auf den Ausgangszustand zurückgesetzt werden?</div>
                <div>Alle von Dir gemachten Änderungen werden damit verworfen.</div>
                </div>
                <div style="flex: 1"></div>
            </div>
            <div class="joe_codeResetModalButtons">
            <div class="joe_codeResetModalCancel jo_button jo_active">Abbrechen</div>
            <div class="joe_codeResetModalOK jo_button jo_active">OK</div>
            </div>
            <div style="flex: 2"></div>
            </div>
        `
        );

        $window.hide();

        $parent.append($window);

        jQuery(".joe_codeResetModalCancel").on("click", () => {
            $window.hide();
        });

        jQuery(".joe_codeResetModalOK").on("click", () => {

            this.initScripts();
            this.deleteScriptsInDB();

            $window.hide();
            this.$resetButton.hide();
            this.compileRunsAfterCodeReset = 1;

        });

        return $window;
    }

    showProgramPointerPosition(file: File, position: TextPosition) {

        if (file == null) {
            return;
        }

        if (this.config.withFileList) {
            let fileData = this.fileExplorer.files.find((fileData) => fileData.module.file == file);
            if (fileData == null) {
                return;
            }

            if (fileData.module != this.getCurrentlyEditedModule()) {
                this.setModuleActive(fileData.module);
            }

            this.programPointerModule = fileData.module;
        } else {
            this.programPointerModule = this.currentWorkspace.moduleStore.getFirstModule();
        }

        let range = {
            startColumn: position.column, startLineNumber: position.line,
            endColumn: position.column + position.length, endLineNumber: position.line
        };

        this.getMonacoEditor().revealRangeInCenterIfOutsideViewport(range);
        this.programPointerDecoration = this.getMonacoEditor().deltaDecorations(this.programPointerDecoration, [
            {
                range: range,
                options: { className: 'jo_revealProgramPointer', isWholeLine: true }
            },
            {
                range: range,
                options: { beforeContentClassName: 'jo_revealProgramPointerBefore' }
            }
        ]);



    }

    hideProgramPointerPosition() {
        if (this.getCurrentlyEditedModule() == this.programPointerModule) {
            this.getMonacoEditor().deltaDecorations(this.programPointerDecoration, []);
        }
        this.programPointerModule = null;
        this.programPointerDecoration = [];
    }

    makeFilesDiv(): JQuery<HTMLElement> {


        let $filesDiv = jQuery('<div class="joe_bottomDivFiles jo_scrollable"></div>');

        let $filesHeader = jQuery('<div class="joe_filesHeader jo_tabheading jo_active"  style="line-height: 24px">Programmdateien</div>');

        this.$filesListDiv = jQuery('<div class="joe_filesList jo_scrollable"></div>');
        // for (let index = 0; index < 20; index++) {            
        //     let $file = jQuery('<div class="jo_file jo_java"><div class="jo_fileimage"></div><div class="jo_filename"></div></div></div>');
        //     $filesList.append($file);
        // }

        $filesDiv.append($filesHeader, this.$filesListDiv);

        return $filesDiv;
    }

    startTimer() {
        if (this.timerHandle != null) {
            clearInterval(this.timerHandle);
        }

        let that = this;
        this.timerHandle = setInterval(() => {

            that.compileIfDirty();

        }, 500);


    }

    compileIfDirty() {

        if (this.currentWorkspace == null) return;

        if (this.currentWorkspace.moduleStore.isDirty() &&
            this.compiler.compilerStatus != CompilerStatus.compiling
            && this.interpreter.state != InterpreterState.running
            && this.interpreter.state != InterpreterState.paused) {
            try {

                this.compiler.compile(this.currentWorkspace.moduleStore);

                let errors = this.
                    bottomDiv?.errorManager?.showErrors(this.currentWorkspace);

                this.editor.onDidChangeCursorPosition(null); // mark occurrencies of symbol under cursor

                this.printProgram();

                this.version++;

                let startable = this.interpreter.getStartableModule(this.currentWorkspace.moduleStore) != null;

                if (startable &&
                    this.interpreter.state == InterpreterState.not_initialized) {
                    this.copyExecutableModuleStoreToInterpreter();
                    this.interpreter.setState(InterpreterState.done);
                    if (this.config.hideStartPanel) {
                        this.actionManager.trigger('interpreter.start');
                    }
                    // this.interpreter.init();
                }

                if (!startable &&
                    (this.interpreter.state == InterpreterState.done || this.interpreter.state == InterpreterState.error)) {
                    this.interpreter.setState(InterpreterState.not_initialized);
                }

                // this.drawClassDiagrams(!this.rightDiv.isClassDiagramEnabled());

            } catch (e) {
                console.error(e);
                this.compiler.compilerStatus = CompilerStatus.error;
            }

        }

    }
    considerShowingCodeResetButton() {
        this.compileRunsAfterCodeReset++;
        if (this.compileRunsAfterCodeReset == 3) {
            this.$resetButton.fadeIn(1000);
        }
    }
    printProgram() {

        this.bottomDiv.printModuleToBottomDiv(this.currentWorkspace, this.getCurrentlyEditedModule());

    }

    drawClassDiagrams(onlyUpdateIdentifiers: boolean) {
        // clearTimeout(this.debounceDiagramDrawing);
        // this.debounceDiagramDrawing = setTimeout(() => {
        //     this.rightDiv?.classDiagram?.drawDiagram(this.currentWorkspace, onlyUpdateIdentifiers);
        // }, 500);
    }

    copyExecutableModuleStoreToInterpreter() {
        let ms = this.currentWorkspace.moduleStore.copy();
        this.interpreter.moduleStore = ms;
        this.interpreter.moduleStoreVersion = this.version;

        if (this.interpreter.state == InterpreterState.not_initialized && this.programIsExecutable) {
            this.interpreter.setState(InterpreterState.done);
        }

    }


    saveWorkspaceToFile() {
        let filename: string = prompt("Bitte geben Sie den Dateinamen ein", this.config.jsonFilename);
        if (filename == null) {
            alert("Der Dateiname ist leer, daher wird nichts gespeichert.");
            return;
        }
        if (!filename.endsWith(".json")) filename = filename + ".json";
        let ws = this.currentWorkspace;
        let name: string = ws.name.replace(/\//g, "_");
        downloadFile(ws.toExportedWorkspace(), filename)
    }


    makeBottomDiv($bottomDiv: JQuery<HTMLElement>, $buttonDiv: JQuery<HTMLElement>) {

        let $tabheadings = jQuery('<div class="jo_tabheadings"></div>');
        $tabheadings.css('position', 'relative');
        let $thRightSide = jQuery('<div class="joe_tabheading-right jo_noHeading"></div>');

        $thRightSide.append($buttonDiv);

        if (this.config.withConsole) {
            let $thConsoleClear = jQuery('<div class="img_clear-dark jo_button jo_active jo_console-clear"' +
                'style="display: none; margin-left: 8px;" title="Console leeren"></div>');
            $thRightSide.append($thConsoleClear);
        }

        if (this.config.withErrorList) {
            let $thErrors = jQuery('<div class="jo_tabheading jo_active" data-target="jo_errorsTab" style="line-height: 24px">Fehler</div>');
            $tabheadings.append($thErrors);
        }


        if (this.config.withConsole) {
            let $thConsole = jQuery('<div class="jo_tabheading jo_console-tab" data-target="jo_consoleTab" style="line-height: 24px">Console</div>');
            $tabheadings.append($thConsole);
        }

        if (this.config.withPCode) {
            let $thPCode = jQuery('<div class="jo_tabheading" data-target="jo_pcodeTab" style="line-height: 24px">PCode</div>');
            $tabheadings.append($thPCode);
        }

        $tabheadings.append($thRightSide);

        $bottomDiv.append($tabheadings);

        let $tabs = jQuery('<div class="jo_tabs jo_scrollable"></div>');

        if (this.config.withErrorList) {
            let $tabError = jQuery('<div class="jo_active jo_scrollable jo_errorsTab"></div>');
            $tabs.append($tabError);
        }

        if (this.config.withConsole) {
            let $tabConsole = jQuery(
                `
        <div class="jo_editorFontSize jo_consoleTab">
        <div class="jo_console-inner">
            <div class="jo_scrollable jo_console-top"></div>
            <div class="jo_commandline"></div>
        </div>
        </div>
    `);

            $tabs.append($tabConsole);
        }

        if (this.config.withPCode) {
            let $tabPCode = jQuery('<div class="jo_scrollable jo_pcodeTab">PCode</div>');
            $tabs.append($tabPCode);
        }

        $bottomDiv.append($tabs);

    }
    loadWorkspaceFromFile(file: globalThis.File) {
        let that = this;
        if (file == null) return;
        var reader = new FileReader();
        reader.onload = (event) => {
            let text: string = <string>event.target.result;
            if (!text.startsWith("{")) {
                alert(`<div>Das Format der Datei ${file.name} passt nicht.</div>`);
                return;
            }

            let ew: ExportedWorkspace = JSON.parse(text);

            if (ew.modules == null || ew.name == null || ew.settings == null) {
                alert(`<div>Das Format der Datei ${file.name} passt nicht.</div>`);
                return;
            }

            let ws: Workspace = new Workspace(ew.name, this, 0);
            ws.settings = ew.settings;
            ws.alterAdditionalLibraries();

            for (let mo of ew.modules) {
                let f: File = {
                    name: mo.name,
                    dirty: false,
                    saved: true,
                    text: mo.text,
                    text_before_revision: null,
                    submitted_date: null,
                    student_edited_after_revision: false,
                    version: 1,
                    is_copy_of_id: null,
                    repository_file_version: null,
                    identical_to_repository_version: null,
                    file_type: 0
                };

                let m = new Module(f, this);
                ws.moduleStore.putModule(m);
            }
            that.currentWorkspace = ws;

            if(that.fileExplorer != null){
                that.fileExplorer.removeAllFiles();
                ws.moduleStore.getModules(false).forEach(module => that.fileExplorer.addModule(module));
                that.fileExplorer.setFirstFileActive();
            } else {
                this.setModuleActive(this.currentWorkspace.moduleStore.getFirstModule());
            }

            that.saveScripts();

        };
        reader.readAsText(file);

    }

    makeRightDiv(): JQuery<HTMLElement> {

        let $rightDiv = jQuery('<div class="joe_rightDiv"></div>');
        this.$rightDivInner = jQuery('<div class="joe_rightDivInner"></div>');
        $rightDiv.append(this.$rightDivInner);

        this.$debuggerDiv = jQuery('<div class="joe_debuggerDiv"></div>');
        this.$runDiv = jQuery(
            `
            <div class="jo_tab jo_active jo_run">
            <div class="jo_run-programend">Programm beendet</div>
            <div class="jo_run-input">
            <div>
            <div>
        <div class="jo_run-input-message" class="jo_rix">Bitte geben Sie eine Zahl ein!</div>
        <input class="jo_run-input-input" type="text" class="jo_rix">
        <div class="jo_run-input-button-outer" class="jo_rix">
        <div class="jo_run-input-button" class="jo_rix">OK</div>
        </div>
        
        <div class="jo_run-input-error" class="jo_rix"></div>
    </div>
    </div>
    </div> 
    <div class="jo_run-inner">
    <div class="jo_graphics"></div>
    <div class="jo_output jo_scrollable"></div>
    </div>
    
    </div>
    
    `);


        if (!this.config.hideEditor) {
            let $tabheadings = jQuery('<div class="jo_tabheadings"></div>');
            $tabheadings.css('position', 'relative');
            let $thRun = jQuery('<div class="jo_tabheading jo_active" data-target="jo_run" style="line-height: 24px">Ausgabe</div>');
            let $thVariables = jQuery('<div class="jo_tabheading jo_console-tab" data-target="jo_variablesTab" style="line-height: 24px">Variablen</div>');
            $tabheadings.append($thRun, $thVariables);
            this.$rightDivInner.append($tabheadings);
            let $vd = jQuery('<div class="jo_scrollable jo_editorFontSize jo_variablesTab"></div>');

            let $alternativeText = jQuery(`
            <div class="jo_alternativeText jo_scrollable">
            <div style="font-weight: bold">Tipp:</div>
            Die Variablen sind nur dann sichtbar, wenn das Programm
            <ul>
            <li>im Einzelschrittmodus ausgeführt wird(Klick auf <span class="img_step-over-dark jo_inline-image"></span>),</li>
            <li>an einem Breakpoint hält (Setzen eines Breakpoints mit Mausklick links neben den Zeilennummern und anschließendes Starten des Programms mit 
                <span class="img_start-dark jo_inline-image"></span>) oder </li>
                <li>in sehr niedriger Geschwindigkeit ausgeführt wird (weniger als 10 Schritte/s).
                </ul>
                </div>
                `);

            $vd.append(this.$debuggerDiv, $alternativeText);
            let $tabs = jQuery('<div class="jo_tabs jo_scrollable"></div>');
            $tabs.append(this.$runDiv, $vd);
            this.$rightDivInner.append($tabs);
            makeTabs($rightDiv);
        } else {
            this.$rightDivInner.append(this.$runDiv);
        }

        return $rightDiv;
    }

    getSemicolonAngel(): SemicolonAngel {
        return this.semicolonAngel;
    }

    async loadUserSpritesheet(){
        if(this.config.spritesheetURL != null){

            let spritesheet = new SpritesheetData();

            await spritesheet.initializeSpritesheetForWorkspace(this.currentWorkspace, this, this.config.spritesheetURL);
    
        }
    }

}


