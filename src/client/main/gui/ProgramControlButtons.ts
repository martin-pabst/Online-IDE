// <div id="controls">
// <div id="speedcontrol-outer" title="Geschwindigkeitsregler" draggable="false">
//     <div id="speedcontrol-bar" draggable="false"></div>
//     <div id="speedcontrol-grip" draggable="false">
//         <div id="speedcontrol-display">100 Schritte/s</div>
//     </div>
// </div>
// <!-- <img id="buttonStart" title="Start" src="assets/projectexplorer/start-dark.svg"> -->
// <div id="buttonStart" title="Start" class="img_start-dark button"></div>
// <div id="buttonPause" title="Pause" class="img_pause-dark button"></div>
// <div id="buttonStop" title="Stop" class="img_stop-dark button"></div>
// <div id="buttonStepOver" title="Step over" class="img_step-over-dark button"></div>
// <div id="buttonStepInto" title="Step into" class="img_step-into-dark button"></div>
// <div id="buttonStepOut" title="Step out" class="img_step-out-dark button"></div>
// <div id="buttonRestart" title="Restart" class="img_restart-dark button"></div>
// </div>
import jQuery from 'jquery';

import { Interpreter } from "../../interpreter/Interpreter.js";
import { SpeedControl } from "./SpeedControl.js";



export class ProgramControlButtons {

    speedControl: SpeedControl;

    $buttonStart: JQuery<HTMLElement>;
    $buttonPause: JQuery<HTMLElement>;
    $buttonStop: JQuery<HTMLElement>;
    $buttonStepOver: JQuery<HTMLElement>;
    $buttonStepInto: JQuery<HTMLElement>;
    $buttonStepOut: JQuery<HTMLElement>;
    $buttonRestart: JQuery<HTMLElement>;

    // $buttonEdit: JQuery<HTMLElement>;

    private interpreter: Interpreter;

    buttonActiveMatrix: { [buttonName: string]: boolean[] } = {
        "start": [false, false, true, true, true, false],
        "pause": [false, true, false, false, false, false],
        "stop": [false, true, true, false, false, true],
        "stepOver": [false, false, true, true, true, false],
        "stepInto": [false, false, true, true, true, false],
        "stepOut": [false, false, true, false, false, false],
        "restart": [false, true, true, true, true, true]
    }


    constructor(private $buttonsContainer: JQuery<HTMLElement>, private $editorContainer: JQuery<HTMLElement>){

        this.speedControl = new SpeedControl($buttonsContainer);
        this.speedControl.initGUI();

        this.$buttonStart = jQuery('<div title="Start" class="img_start-dark jo_button"></div>');
        this.$buttonPause = jQuery('<div title="Pause" class="img_pause-dark jo_button"></div>');
        this.$buttonStop = jQuery('<div title="Stop" class="img_stop-dark jo_button"></div>');
        this.$buttonStepOver = jQuery('<div title="Step over" class="img_step-over-dark jo_button"></div>');
        this.$buttonStepInto = jQuery('<div title="Step into" class="img_step-into-dark jo_button"></div>');
        this.$buttonStepOut = jQuery('<div title="Step out" class="img_step-out-dark jo_button"></div>');
        this.$buttonRestart = jQuery('<div title="Restart" class="img_restart-dark jo_button"></div>');

        // this.$buttonEdit = jQuery('<div class="jo_editButton" title="Programm anhalten damit der Programmtext bearbeitbar wird"></div>')
        // $editorContainer.append(this.$buttonEdit);

        $buttonsContainer.append(this.$buttonStart, this.$buttonPause, this.$buttonStop,
            this.$buttonStepOver, this.$buttonStepInto, this.$buttonStepOut, this.$buttonRestart);

// <!-- <img id="buttonStart" title="Start" src="assets/projectexplorer/start-dark.svg"> -->
// <div id="buttonStart" title="Start" class="img_start-dark button"></div>
// <div id="buttonPause" title="Pause" class="img_pause-dark button"></div>
// <div id="buttonStop" title="Stop" class="img_stop-dark button"></div>
// <div id="buttonStepOver" title="Step over" class="img_step-over-dark button"></div>
// <div id="buttonStepInto" title="Step into" class="img_step-into-dark button"></div>
// <div id="buttonStepOut" title="Step out" class="img_step-out-dark button"></div>
// <div id="buttonRestart" title="Restart" class="img_restart-dark button"></div>



    }

    setInterpreter(i: Interpreter){
        this.interpreter = i;
        this.speedControl.setInterpreter(i);
        this.speedControl.setSpeed(this.interpreter.maxStepsPerSecond);
    }
}