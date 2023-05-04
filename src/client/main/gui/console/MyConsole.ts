import { AdhocCompiler } from "../../../compiler/AdhocCompiler.js";
import { Error } from "../../../compiler/lexer/Lexer.js";
import { Heap, Value } from "../../../compiler/types/Types.js";
import { InterpreterState, Interpreter } from "../../../interpreter/Interpreter.js";
import { ConsoleEntry } from "./ConsoleEntry.js";
import { Main } from "../../Main.js";
import { Module } from "../../../compiler/parser/Module.js";
import { TextPosition, TokenType } from "../../../compiler/lexer/Token.js";
import { Program } from "../../../compiler/parser/Program.js";
import { Helper } from "../Helper.js";
import { MainBase } from "../../MainBase.js";

export class MyConsole {

    editor: monaco.editor.IStandaloneCodeEditor;
    history: string[] = [];
    historyPos: number = 0;

    timerHandle: any;
    isDirty: boolean = false;
    readyToExecute: boolean = false;

    compiler: AdhocCompiler;

    consoleEntries: ConsoleEntry[] = [];

    errorDecoration: string[] = [];
    $consoleTabHeading: JQuery<HTMLElement>;
    $consoleTab: JQuery<HTMLElement>;

    constructor(private main: MainBase, public $bottomDiv: JQuery<HTMLElement>){
        if($bottomDiv == null) return; // Console is only used to highlight exceptions

        this.$consoleTabHeading = $bottomDiv.find('.jo_tabheadings>.jo_console-tab');
        this.$consoleTab = $bottomDiv.find('.jo_tabs>.jo_consoleTab');
    }

    initConsoleClearButton(){

        let that = this;

        let $consoleClear = this.$consoleTabHeading.parent().find('.jo_console-clear');

        this.$consoleTab.on('myshow', () => {
            $consoleClear.show();
            that.editor.layout();
        });

        this.$consoleTab.on('myhide', () => {
            $consoleClear.hide();
        });

        $consoleClear.on('mousedown', (e) => {
            e.stopPropagation();
            that.clear();
        });

    }

    initGUI() {

        if(this.$bottomDiv == null) return;

        this.initConsoleClearButton();

        let $editorDiv = this.$consoleTab.find('.jo_commandline');

        this.editor = monaco.editor.create($editorDiv[0], {
            value: [
                ''
            ].join('\n'),
            automaticLayout: false,
            renderLineHighlight: "none",
            guides: {
                bracketPairs: false,
                highlightActiveIndentation: false,
                indentation: false
            },
            overviewRulerLanes: 0,
            lineNumbers: 'off',
            glyphMargin: false,
            folding: false,
            // Undocumented see https://github.com/Microsoft/vscode/issues/30795#issuecomment-410998882
            lineDecorationsWidth: 0,
            lineNumbersMinChars: 0,
            fixedOverflowWidgets: true,
            language: 'myJava',

            fontSize: 14,
            //@ts-ignore
            fontFamily: window.javaOnlineFont == null ? "Consolas, Roboto Mono" : window.javaOnlineFont,
            fontWeight: "500",
            roundedSelection: true,
            occurrencesHighlight: false,
            suggest: { 
                localityBonus: true,
                snippetsPreventQuickSuggestions: false
            },
            minimap: {
                enabled: false
            },
            scrollbar: {
                vertical: 'hidden',
                horizontal: 'hidden'
            },
            theme: "myCustomThemeDark"

        }
        );

        this.editor.layout();
        
        let that = this;

        this.editor.addCommand(monaco.KeyCode.Enter, () => {

            that.compileIfDirty();

            if (that.readyToExecute) {
                let command = that.editor.getModel().getValue(monaco.editor.EndOfLinePreference.LF, false);

                if(command == ""){
                    return;
                }

                that.history.push(command);
                that.historyPos = 0;

                that.execute();

                that.editor.setValue("");

            } else {
                // TODO: Fehlermeldung!
            }


        }, "!suggestWidgetVisible");

        this.editor.addCommand(monaco.KeyCode.UpArrow, () => {

            let nextHistoryPos = that.history.length - (that.historyPos + 1);
            if (nextHistoryPos >= 0) {
                that.historyPos++;
                let text = that.history[nextHistoryPos];
                that.editor.setValue(text);
                that.editor.setPosition({
                    lineNumber: 1,
                    column: text.length + 1
                })
            }

        }, "!suggestWidgetVisible");

        this.editor.addCommand(monaco.KeyCode.DownArrow, () => {

            let nextHistoryPos = that.history.length - (that.historyPos - 1);
            if (nextHistoryPos <= that.history.length - 1) {
                that.historyPos--;
                let text = that.history[nextHistoryPos];
                that.editor.setValue(text);
                that.editor.setPosition({
                    lineNumber: 1,
                    column: text.length + 1
                })
            } else {
                that.editor.setValue("");
                that.historyPos = 0;
            }

        }, "!suggestWidgetVisible");

        this.compiler = new AdhocCompiler(this.main);

        let model = this.editor.getModel();
        let lastVersionId = 0;

        model.onDidChangeContent(() => {
            let versionId = model.getAlternativeVersionId();

            if (versionId != lastVersionId) {
                that.isDirty = true;
                lastVersionId = versionId;
            }
        });

        this.startTimer();

        this.$consoleTabHeading.on("mousedown", ()=>{
            Helper.showHelper("consoleHelper", this.main);

            setTimeout(() => {
                that.editor.focus();
            }, 500);
        });

    }

    startTimer() {
        this.stopTimer();

        let that = this;
        this.timerHandle = setInterval(() => {

            that.compileIfDirty();

        }, 500);

    }

    stopTimer() {
        if (this.timerHandle != null) {
            clearInterval(this.timerHandle);
            this.timerHandle = null;
        }

    }


    compileIfDirty() {

        if (this.isDirty) {

            let command = this.editor.getModel().getValue(monaco.editor.EndOfLinePreference.LF, false);
            let moduleStore = this.main.getCurrentWorkspace().moduleStore;
            let symbolTable = this.main.getDebugger().lastSymboltable;
            let heap = this.main.getInterpreter().heap;

            if (command.length > 0 && moduleStore != null) {

                let compilation = this.compiler.compile(command, moduleStore, heap, symbolTable);

                this.readyToExecute = compilation.errors.find(e => e.level == "error") == null;

                this.showErrors(compilation.errors);

                this.isDirty = false;

            } else {
                this.showErrors([]);
            }

        }

    }

    showErrors(errors: Error[]) {

        let markers: monaco.editor.IMarkerData[] = [];
        let errorLevelToMonacoSeverityMap: {[errorlevel: string]: monaco.MarkerSeverity} = {
            "info": monaco.MarkerSeverity.Info,
            "warning": monaco.MarkerSeverity.Warning,
            "error": monaco.MarkerSeverity.Error
        }

        for (let error of errors) {
            markers.push({
                startLineNumber: error.position.line,
                startColumn: error.position.column,
                endLineNumber: error.position.line,
                endColumn: error.position.column + error.position.length,
                message: error.text,
                severity: errorLevelToMonacoSeverityMap[error.level]
            });

        }

        monaco.editor.setModelMarkers(this.editor.getModel(), 'Fehler', markers);

    }

    execute() {

        let interpreter = this.main.getInterpreter();
        let module = this.compiler.module;
        let command = this.editor.getModel().getValue(monaco.editor.EndOfLinePreference.LF, false);
        let program = module.mainProgram;

        monaco.editor.colorize(command, 'myJava', { tabSize: 3 }).then((command) => {

            // if(this.programHasMethodCalls(program)){
                // this.executeInStepMode(interpreter, program, command);
            // } else {
                this.executeRapidly(interpreter, program, command);
                interpreter.showProgramPointerAndVariables();
            // }

        });

    }
    programHasMethodCalls(program: Program): boolean {
        
        for(let statement of program.statements){
            if(statement.type == TokenType.callMethod && statement.method.invoke == null){
                return true;
            }
        }
        
        return false;

    }

    executeInStepMode(interpreter: Interpreter, program: Program, command: string ){

        interpreter.pushCurrentProgram();

        interpreter.currentProgram = program;
        interpreter.currentProgramPosition = 0;

        let stacksizeBefore = interpreter.stack.length;
        let oldInterpreterState = interpreter.state;

        interpreter.setState(InterpreterState.paused);

        interpreter.start(() => {

            let stackTop: Value;
            if (interpreter.stack.length > stacksizeBefore) {
                stackTop = interpreter.stack.pop();

                while (interpreter.stack.length > stacksizeBefore) {
                    interpreter.stack.pop();
                }

            }

            this.writeConsoleEntry(command, stackTop);

            interpreter.setState(oldInterpreterState);
            if (oldInterpreterState == InterpreterState.paused) {
                interpreter.showProgramPointerAndVariables();
            }

        });

    }

    executeRapidly(interpreter: Interpreter, program: Program, command: string ){

        let result = interpreter.evaluate(program);

        if(result.error == null){
            
            this.writeConsoleEntry(command, result.value);

        } else {

            let $entry = jQuery('<div><div>' + command + '</div></div>');
            $entry.append(jQuery('<div class="jo_console-error"> ' + result.error + '</div>'));

            this.writeConsoleEntry($entry, null)

        }


    }

    showTab(){
        let mousePointer = window.PointerEvent ? "pointer" : "mouse";
        this.$consoleTabHeading.trigger(mousePointer + "down");
    }

    writeConsoleEntry(command: string|JQuery<HTMLElement>, stackTop: Value, color: string = null) {

        if(this.$consoleTab == null){
            return;
        }
        let consoleTop = this.$consoleTab.find('.jo_console-top');

        let commandEntry = new ConsoleEntry(command, null, null, null, stackTop == null, color);
        this.consoleEntries.push(commandEntry);
        consoleTop.append(commandEntry.$consoleEntry);

        if(stackTop != null){
            let resultEntry = new ConsoleEntry(null, stackTop, null, null, true, color);
            this.consoleEntries.push(resultEntry);
            consoleTop.append(resultEntry.$consoleEntry);
        }

        var height = consoleTop[0].scrollHeight;
        consoleTop.scrollTop(height);

    }

    clear() {
        let consoleTop = this.$consoleTab.find('.jo_console-top');
        consoleTop.children().remove(); // empty();
        this.consoleEntries = [];
    }

    detachValues() {
        for(let ce of this.consoleEntries){
            ce.detachValue();
        }
    }

    showError(m: Module, position: TextPosition) {

        if(this.main instanceof Main){
            if (m?.file?.name != this.main.projectExplorer.getCurrentlyEditedModule()?.file?.name) {
                this.main.editor.dontDetectLastChange();
                this.main.projectExplorer.setModuleActive(m);
            }
        }


        let range = {
            startColumn: position.column, startLineNumber: position.line,
            endColumn: position.column + position.length, endLineNumber: position.line
        };

        this.main.getMonacoEditor().revealRangeInCenter(range);
        this.errorDecoration = this.main.getMonacoEditor().deltaDecorations(this.errorDecoration, [
            {
                range: range,
                options: { className: 'jo_revealError' }

            },
            {
                range: range,
                options: { className: 'jo_revealErrorWholeLine', isWholeLine: true }

            }
        ]);


    }

    clearErrors(){
        this.errorDecoration = this.main.getMonacoEditor().deltaDecorations(this.errorDecoration, [
        ]);
    }

    clearExceptions(){
        if(this.$bottomDiv == null) return;
        let $consoleTop = this.$consoleTab.find('.jo_console-top');
        $consoleTop.find('.jo_exception').parents('.jo_consoleEntry').remove();
    }

}