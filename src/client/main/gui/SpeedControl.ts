import jQuery from 'jquery';
import { convertPxToNumber } from "../../tools/HtmlTools.js";
import { Interpreter, InterpreterState } from "../../interpreter/Interpreter.js";



export class SpeedControl {

    position: number = 0;
    xMax: number;
    $grip: JQuery<HTMLElement>;
    $bar: JQuery<HTMLElement>;
    $display: JQuery<HTMLElement>;
    $outer: JQuery<HTMLElement>;

    gripWidth: number = 10;
    overallWidth: number = 100;

    interpreter: Interpreter

// <div id="speedcontrol-outer" title="Geschwindigkeitsregler" draggable="false">
//     <div id="speedcontrol-bar" draggable="false"></div>
//     <div id="speedcontrol-grip" draggable="false">
//         <div id="speedcontrol-display">100 Schritte/s</div>
//     </div>
// </div>


    constructor($container: JQuery<HTMLElement>){

        this.$outer = jQuery('<div class="jo_speedcontrol-outer" title="Geschwindigkeitsregler" draggable="false"></div>');
        this.$bar = jQuery('<div class="jo_speedcontrol-bar" draggable="false"></div>');
        this.$grip = jQuery('<div class="jo_speedcontrol-grip" draggable="false"></div>');
        this.$display = jQuery('<div class="jo_speedcontrol-display" draggable="false">100 Schritte/s</div>');

        this.$grip.append(this.$display);
        this.$outer.append(this.$bar, this.$grip);

        $container.append(this.$outer);

    }

    setInterpreter(i: Interpreter){
        this.interpreter = i;
    }

    initGUI(){
        
        let mousedownX: number;
        let oldPosition: number;
        let that = this;
        that.overallWidth = convertPxToNumber(this.$outer.css('width'));
        that.gripWidth = convertPxToNumber(that.$grip.css('width'));
        that.xMax = that.overallWidth - that.gripWidth;
        
        let mousePointer = window.PointerEvent ? "pointer" : "mouse";
        
        that.$outer.on(mousePointer + 'down', (e) => {
            
            

            let x = e.pageX - that.$outer.offset().left - 4;
            that.setSpeed(x);
            that.$grip.css('left', x + 'px');
            //@ts-ignore
            that.$grip.trigger(mousePointer + 'down', [e.clientX]);

            // jQuery('#speedcontrol-display').show();
            // jQuery(document).on('mouseup.speedcontrol1', () => {
            //     jQuery(document).off('mouseup.speedcontrol1');
            //     jQuery('#speedcontrol-display').hide();
            // });

        });
        
        
        this.$grip.on(mousePointer + 'down', (e, x) => {
            if(x == null) x = e.clientX;
            mousedownX = x;
            oldPosition = that.position;
            jQuery('.joe_controlPanel_top').css("z-index", "1000");
            that.$display.show();

            jQuery(document).on(mousePointer + 'move.speedcontrol', (e)=>{
                let deltaX = e.clientX - mousedownX;
                that.setSpeed(oldPosition + deltaX);
            });

            jQuery(document).on(mousePointer + 'up.speedcontrol', () => {
                jQuery(document).off(mousePointer + 'up.speedcontrol');
                jQuery(document).off(mousePointer + 'move.speedcontrol');
                that.$display.hide();
                jQuery('.joe_controlPanel_top').css("z-index", "0");
            });

            e.stopPropagation();

        });

    }

    getSpeedInStepsPerSecond(): number {
        return this.interpreter.stepsPerSecond;
    }

    setSpeedInStepsPerSecond(stepsPerSecond: number | "max"){
        let intervalBorders = [1, 10, 100, 1000, 10000, 100000, this.interpreter.maxStepsPerSecond];

        if(stepsPerSecond == "max") stepsPerSecond = this.interpreter.maxStepsPerSecond;
        stepsPerSecond = Math.min(stepsPerSecond, this.interpreter.maxStepsPerSecond);
        stepsPerSecond = Math.max(stepsPerSecond, 1);

        for(let i = 0; i < intervalBorders.length - 1; i++){
            let left = intervalBorders[i];
            let right = intervalBorders[i+1];
            if(stepsPerSecond >= left && stepsPerSecond <= right){
                let gripIntervalLength = this.xMax/(intervalBorders.length - 1);
                let gripPosition = Math.round(gripIntervalLength * i + gripIntervalLength * (stepsPerSecond - left)/(right - left));
                this.$grip.css('left', gripPosition + 'px');
                this.position = gripPosition;
                break;
            }
        }

        this.setInterpreterSpeed(stepsPerSecond);

    }

    setSpeed(newPosition: number){

        if(newPosition < 0){
            newPosition = 0;
        }

        if(newPosition > this.xMax){
            newPosition = this.xMax;
        }

        this.position = newPosition;

        this.$grip.css('left', newPosition + "px");

        // in steps/s
        let intervalBorders = [1, 10, 100, 1000, 10000, 100000, this.interpreter.maxStepsPerSecond];

        let intervalDelta = this.xMax / (intervalBorders.length - 1);
        let intervalIndex = Math.floor(newPosition/intervalDelta);
        if(intervalIndex == intervalBorders.length - 1) intervalIndex--;
        let factorInsideInterval = (newPosition - intervalIndex*intervalDelta)/intervalDelta;

        let intervalMin = intervalBorders[intervalIndex];
        let intervalMax = intervalBorders[intervalIndex + 1];

        let speed = intervalMin + (intervalMax - intervalMin) * factorInsideInterval;

        this.setInterpreterSpeed(speed);
        
        // console.log( speed + ' steps/s entspricht ' + this.interpreter.timerDelayMs + ' ms zwischen Steps')

    }
    
    setInterpreterSpeed(stepsPerSecond: number){
        this.interpreter.setStepsPerSecond(stepsPerSecond);

        this.interpreter.hideProgrampointerPosition();

        let speedString = "" + Math.ceil(stepsPerSecond);
        if(stepsPerSecond >= this.interpreter.maxStepsPerSecond - 10){
            speedString = "Maximale Geschwindigkeit";
        }

        this.$display.html(speedString + " Schritte/s");
    }


}