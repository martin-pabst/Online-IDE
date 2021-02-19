import { Type, Method, Value } from "../compiler/types/Types.js";
import { stringPrimitiveType, charPrimitiveType, intPrimitiveType } from "../compiler/types/PrimitiveTypes.js";

export class InputManagerOld {

    constructor(private $runDiv: JQuery<HTMLElement>){

    }

    public readInput(method: Method, parameters: Value[], callback: (value: Value) => void){

        let returnType = method.getReturnType();
        let message = parameters[1].value;
        let defaultValue = parameters.length == 3 ? parameters[2].value : null;

        this.$runDiv.find('.jo_run-input-message').html(message);
        this.$runDiv.find('.jo_run-input-error').html("");

        let dvt = defaultValue == null ? "" : defaultValue;
        this.$runDiv.find('.jo_run-input-input').val(dvt);
        this.$runDiv.find('.jo_run-input').css('display', 'flex');

        let that = this;

        this.$runDiv.find('.jo_run-input-button').on('mousedown', (e)=>{
            e.preventDefault();
            that.onSubmit(returnType, callback);
        });
        
        this.$runDiv.find('.jo_run-input-input').on('keydown', (e) => {
            if(e.key == "Enter"){
                that.onSubmit(returnType, callback);
            }
        }).focus();

    }

    onSubmit(type: Type, callback: (value: Value) => void){
        let v: string = <string>(this.$runDiv.find('.jo_run-input-input').val());

        let valueAndError = this.parse(v, type);

        if(valueAndError.error != null){
            this.$runDiv.find('.jo_run-input-error').html(valueAndError.error);
            return;
        }
        
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
        
        this.$runDiv.find('.jo_run-input').css('display', 'none');

        this.$runDiv.find('.jo_run-input-button').off('mousedown');
        
        this.$runDiv.find('.jo_run-input-input').off('keydown');

    }


}