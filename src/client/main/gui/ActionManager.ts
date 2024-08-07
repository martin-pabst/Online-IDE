import jQuery from 'jquery';
import { InterpreterState } from "../../interpreter/Interpreter.js";
import { SoundTools } from "../../../tools/SoundTools.js";
import { MainBase } from "../MainBase.js";

export type ButtonToggler = (state: boolean) => void;

export type Action = (name: string, buttonToggler?: ButtonToggler, pressed_key?: string) => void;

export type ActionEntry = {
    text?: string,
    keys: string[],
    action: Action,
    identifier: string, // name of Action is copied automatically to name of ActionEntry
    active: boolean
}

export class ActionManager {

    actions: { [actionIdentifier: string]: ActionEntry } = { };

    keyEntries: { [key: string]: ActionEntry[] } = {};

    buttons: { [actionIdentifier: string]: JQuery<HTMLElement>[] } = {};

    constructor(private $mainElement: JQuery<HTMLElement>, private main: MainBase){

    }

    public init(){

        let $element:JQuery<any> = this.$mainElement;
        
        if($element == null) $element = jQuery(document);

        let that = this;
        $element.on("keydown", function (event: JQuery.KeyDownEvent) { 
            if(event != null){
                that.executeKeyDownEvent(event); 

                /*
                 * Event is bubbling down to body element
                 * when pressing space bar in embedded mode while program runs.
                 * This leads to scrolling page down. To prevent this:
                 */
                if(event.key == " " && that.main.isEmbedded() && 
                   that.main.getInterpreter().state == InterpreterState.running && !that.main.getMonacoEditor().hasTextFocus()){
                    event.preventDefault();
                }
            }
        });

    }

    trigger(actionIdentifier: string) {
        let ae = this.actions[actionIdentifier];
        if(ae != null){
            ae.action(actionIdentifier, null, "");
        }
    }


    public registerAction(identifier: string, keys: string[], action: Action, text: string = "", button?: JQuery<HTMLElement>){
        let ae: ActionEntry = {
            action: action,
            identifier: identifier,
            keys: keys,
            text: text,
            active: true
        };

        this.actions[identifier] = ae;

        for(let key of keys){
            if(this.keyEntries[key.toLowerCase()] == null){
                this.keyEntries[key.toLowerCase()] = [];
            }
            this.keyEntries[key.toLowerCase()].push(ae);
        }

        if(button != null){
            if(this.buttons[identifier] == null){
                this.buttons[identifier] = [];
            }
            this.buttons[identifier].push(button);

            let t = text;
            if(keys.length > 0){
                t += " [" + keys.join(", ") + "]";
            }

            button.attr("title", t);

            let mousePointer = window.PointerEvent ? "pointer" : "mouse";

            button.on(mousePointer + 'down', () => {
                if(ae.active){
                    action(identifier, null, "mousedown");
                }
                if(identifier == "interpreter.start"){
                    SoundTools.init();
                }
            });

        }

    }

    public isActive(actionIdentifier: string): boolean {

        let ae: ActionEntry = this.actions[actionIdentifier];
        
        if(ae == null) return false;

        return ae.active;
    
    }

    public setActive(actionIdentifier: string, active: boolean){
        let ae: ActionEntry = this.actions[actionIdentifier];
        
        if(ae != null){
            ae.active = active;
        }

        let buttons = this.buttons[actionIdentifier];
        if(buttons != null){
            for(let button of buttons){
                if(active){
                    button.addClass('jo_active');
                } else {
                    button.removeClass('jo_active');
                }
            }
        }

    }

    public executeKeyDownEvent(event: JQuery.KeyDownEvent) {

        if(document.activeElement.tagName.toLowerCase() == "input"){
            return;
        }

        if (event.keyCode <= 18 && event.keyCode >= 16) {
            return; // ctrl, alt, shift
        }

        let key: string = "";

        if (event.ctrlKey) {
            key += "ctrl+";
        }

        if (event.shiftKey) {
            key += "shift+";
        }

        if (event.altKey) {
            key += "alt+";
        }

        if(event.key != null){
            key += event.key.toLowerCase();
        }

        let actionEntries = this.keyEntries[key];

        if(actionEntries != null){
            for(let actionEntry of actionEntries){
                if (actionEntry.active) {
                    event.stopPropagation();
                    event.preventDefault();
                    actionEntry.action(actionEntry.identifier, null, key);
                    break;
                }
            }
        }


    }


}