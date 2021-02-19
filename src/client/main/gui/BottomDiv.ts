import { makeTabs } from "../../tools/HtmlTools.js";
import { Main } from "../Main.js";
import { ProgramPrinter } from "../../compiler/parser/ProgramPrinter.js";
import { Workspace } from "../../workspace/Workspace.js";
import { Module } from "../../compiler/parser/Module.js";
import { MyConsole } from "./console/MyConsole.js";
import { ErrorManager } from "./ErrorManager.js";
import { MainBase } from "../MainBase.js";
import { InterpreterState } from "../../interpreter/Interpreter.js";
import { UserData } from "../../communication/Data.js";
import { HomeworkManager } from "./HomeworkManager.js";

export class BottomDiv {

    programPrinter: ProgramPrinter;
    console: MyConsole;
    errorManager: ErrorManager;
    homeworkManager: HomeworkManager;

    constructor(private main: MainBase, public $bottomDiv: JQuery<HTMLElement>, public $mainDiv: JQuery<HTMLElement>) {

        if (this.$bottomDiv.find('.jo_tabs>.jo_pcodeTab').length > 0) {
            this.programPrinter = new ProgramPrinter(main, $bottomDiv);
        }

        if (this.$bottomDiv.find('.jo_tabheadings>.jo_console-tab').length > 0) {
            this.console = new MyConsole(main, $bottomDiv);
        } else {
            this.console = new MyConsole(main, null);
        }

        if (this.$bottomDiv.find('.jo_tabheadings>.jo_homeworkTabheading').length > 0) {
            this.homeworkManager = new HomeworkManager(<Main>main, $bottomDiv);
        }

        this.errorManager = new ErrorManager(main, $bottomDiv, $mainDiv);
    }

    initGUI() {
        makeTabs(this.$bottomDiv);
        if (this.programPrinter != null) this.programPrinter.initGUI();
        if (this.console != null) this.console.initGUI();
        if(this.homeworkManager != null) this.homeworkManager.initGUI();

        this.$bottomDiv.find('.jo_tabs').children().first().trigger("click");

        let that = this;
        jQuery(".jo_pcodeTab").on("myshow", () => {
            that.printCurrentlyExecutedModule();
        });

    }

    printCurrentlyExecutedModule() {
        let interpreter = this.main.getInterpreter();
        if (interpreter.state == InterpreterState.running || interpreter.state == InterpreterState.paused) {
            let module = interpreter.currentProgram?.module;
            this.printModuleToBottomDiv(null, module);
        }
    }

    printModuleToBottomDiv(currentWorkspace: Workspace, module: Module) {
        if (this.programPrinter != null) this.programPrinter.printModuleToBottomDiv(currentWorkspace, module);
    }


    showHomeworkTab() {

        jQuery('.jo_homeworkTabheading').css('visibility', 'visible');
        jQuery('.jo_homeworkTabheading').trigger("mousedown");

    }

    hideHomeworkTab() {

        jQuery('.jo_homeworkTabheading').css('visibility', 'hidden');
        jQuery('.jo_tabheadings').children().first().trigger("mousedown");

    }


}