import { InterpreterState } from "../client/interpreter/Interpreter.js";
import { MainBase } from "../client/main/MainBase.js";

export class KeyboardTool {
    
    element: JQuery<any>;

    pressedKeys: {[key: string]: boolean} = {};

    keyPressedCallbacks: ((key: string) => void)[] = [];
    keyUpCallbacks: ((key: string) => void)[] = [];
    keyDownCallbacks: ((key: string, isShift: boolean, isCtrl: boolean, isAlt: boolean) => void)[] = [];

    constructor(element: JQuery<any>, private main: MainBase){
        this.registerListeners(element);
    }

    unregisterListeners(){
        this.element.off("keydown");
        this.element.off("keyup");
        this.element.off("keypressed");
    }

    private registerListeners(element: JQuery<any>){
        this.element = element;
        let that = this;
        element.on("keydown", (e) => {
            let key = e.key;
            if(key == null) return true;
            // if(e.shiftKey) key = "shift+" + key;
            // if(e.ctrlKey) key = "ctrl+" + key;
            // if(e.altKey) key = "alt+" + key;
            that.pressedKeys[key.toLowerCase()] = true;

            for(let kpc of that.keyDownCallbacks){
                kpc(key, e.shiftKey, e.ctrlKey, e.altKey);
            }

            // prevent <html>-Element from scrolling in embedded mode
            if(this.main.isEmbedded() && this.main.getInterpreter().state == InterpreterState.running && !this.main.getMonacoEditor().hasTextFocus()){
                if(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.key) >= 0)
                e.preventDefault();
            }

            return true;
        });

        element.on("keyup", (e) => {
            let key = e.key;
            if(key == null) return true;
            if(typeof key == "undefined") return;

            // if(e.shiftKey) key = "shift+" + key;
            // if(e.ctrlKey) key = "ctrl+" + key;
            // if(e.altKey) key = "alt+" + key;
            that.pressedKeys[key.toLowerCase()] = false;

            for(let kpc of that.keyUpCallbacks){
                kpc(key);
            }

            // in ActionManager.init there is a 
            // if(that.main.isEmbedded && key == " "){
            //     for(let kpc of that.keyPressedCallbacks){
            //         kpc(key);
            //     }    
            // }

            return true;
        });
        element.on("keyup", (e) => {
            let k = e.key;
            if(e.shiftKey && k.length > 1){
                k = "[shift]+" + k;
            }
            if(e.ctrlKey && k.length > 1){
                k = "[ctrl]+" + k;
            }
            if(e.altKey && k.length > 1){
                k = "[alt]+" + k;
            }
            for(let kpc of that.keyPressedCallbacks){
                kpc(k);
            }
            return true;
        });

    }

    isPressed(key: string){
        if(key == null) return null;
        return this.pressedKeys[key.toLowerCase()] == true;
    }

    unsubscribeAllListeners() {
        this.keyPressedCallbacks = [];
    }


}