import { Type, Method, Value } from "../compiler/types/Types.js";
import { stringPrimitiveType, charPrimitiveType, intPrimitiveType } from "../compiler/types/PrimitiveTypes.js";
import { MainBase } from "../main/MainBase.js";
import { PrintManager } from "../main/gui/PrintManager.js";

export class InputManager {

    $input: JQuery<HTMLInputElement>;

    constructor(private $runDiv: JQuery<HTMLElement>, private main: MainBase){

    }

    public readInput(method: Method, parameters: Value[], callback: (value: Value) => void){

        let returnType = method.getReturnType();
        let message = parameters[1].value;
        let defaultValue = parameters.length == 3 ? parameters[2].value : null;

        let printManager: PrintManager = this.main.getInterpreter().printManager;
        if(message != null && message != ""){
            printManager.beginOfLineState = true;
            printManager.println("\n" + message);
            printManager.doPrinting();
        }

        this.$input = jQuery('<input class="jo_newInput" type="text"/>');

        let $od = printManager.$outputDiv;
        $od.append(this.$input);

        let dvt = defaultValue == null ? "" : defaultValue;
        this.$input.val(dvt);

        let that = this;

        // this.$runDiv.find('.jo_run-input-button').on('mousedown', (e)=>{
        //     e.preventDefault();
        //     that.onSubmit(returnType, callback);
        // });
        
        this.$input.on('keydown', (e) => {
            if(e.key == "Enter"){
                that.onSubmit(returnType, callback);
            }
        })

        setTimeout(() => {
            that.$input.focus();
        }, 200);

        printManager.$outputDiv.on('mousedown.inputmanager', (e) => {
            setTimeout(() => {
                that.$input?.focus();
            }, 200);
        })

    }

    onSubmit(type: Type, callback: (value: Value) => void){
        let v: string = <string>(this.$input.val());
        let printManager = this.main.getInterpreter().printManager;

        let valueAndError = this.parse(v, type);

        if(valueAndError.error != null){
            // jQuery('<div style="color: red">' + valueAndError.error + '</div>').insertBefore(this.$input);
            this.$input.detach();
            printManager.println(valueAndError.error, "#ff0000");
            printManager.doPrinting();
            printManager.$outputDiv.append(this.$input);
            this.$input[0].scrollIntoView();
            this.$input.focus();
            return;
        }
        
        printManager.$outputDiv.off('mousedown.inputmanager');
        printManager.println(v);
        this.$input.off('keydown');
        this.hide();

        callback(valueAndError.value);

    }

    parse(v: string, type: Type):{value: Value, error: string} {

        if(type == stringPrimitiveType){
            return {
                error: null,
                value: {value: v, type: type}
            }
        }

        if(type == charPrimitiveType){
            if(v.length == 0) return {error: "Leere Eingabe. Erwartet wird ein Zeichen.", value: null};
            if(v.length > 1) return {error: "Zu lange Eingabe. Erwartet wird ein Zeichen.", value: null};
            return {
                error: null,
                value: {value: v, type: type}
            }
        }

        if(type == charPrimitiveType){
            if(v != "true" && v != "false") return {error: "Erwartet wird true oder false.", value: null};
            return {
                error: null,
                value: {value: v == "true", type: type}
            }
        }

        v = v.replace(",", ".");

        let n = Number(v);

        if(n == null){
            return {error: "Erwartet wird eine Zahl.", value: null};
        }

        if(type == intPrimitiveType){
            if(n != Math.round(n)) return {error: "Erwartet wird eine ganze Zahl.", value: null};
            return {
                error: null,
                value: {value: Math.round(n), type: type}
            }
        }

        return {
            error: null,
            value: {value: n, type: type}
        }

    }


    hide(){

        if(this.$input != null){
            this.$input.remove();
            this.$input = null;
        }

        // this.$runDiv.find('.jo_run-input').css('display', 'none');

        // this.$runDiv.find('.jo_run-input-button').off('mousedown');
        
        // this.$runDiv.find('.jo_run-input-input').off('keydown');

    }


}