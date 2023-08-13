import jQuery from 'jquery';
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
import { GradingManager } from './GradingManager.js';

export class BottomDiv {

    programPrinter: ProgramPrinter;
    console: MyConsole;
    errorManager: ErrorManager;
    homeworkManager: HomeworkManager;
    gradingManager: GradingManager;

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

        let $gradingTabHeading = this.$bottomDiv.find('.jo_tabheadings>.jo_gradingTabheading');
        if ($gradingTabHeading.length > 0) {
            this.gradingManager = new GradingManager(<Main>main, $bottomDiv, $gradingTabHeading);
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

        jQuery('.jo_homeworkTabheading').css('display', 'block');
        let mousePointer = window.PointerEvent ? "pointer" : "mouse";
        jQuery('.jo_homeworkTabheading').trigger(mousePointer + "down");

    }

    hideHomeworkTab() {

        jQuery('.jo_homeworkTabheading').css('display', 'none');
        let mousePointer = window.PointerEvent ? "pointer" : "mouse";
        jQuery('.jo_tabheadings').children().first().trigger(mousePointer + "down");

    }

    showHideDbBusyIcon(visible: boolean){
        let displayValue: string = visible ? "block" : "none";
        jQuery(".jo_db-busy").css("display", displayValue);
    }

}