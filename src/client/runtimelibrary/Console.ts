import { Type, Method, Parameterlist, Value, Attribute } from "../compiler/types/Types.js";
import { Klass } from "../compiler/types/Class.js";
import { stringPrimitiveType } from "../compiler/types/PrimitiveTypes.js";
import { Module } from "../compiler/parser/Module.js";
import { PrintManager } from "../main/gui/PrintManager.js";

export class ConsoleClass extends Klass {

    constructor(module: Module){
        super("Console", module, "Klasse zur Textausgabe in der Konsole.");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));

        this.addMethod( new Method("log", new Parameterlist([{identifier: "text", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: false}]), null, 
                (parameters) => { 
                    // console.log(<string>(parameters[0].value)); 
                    module.main.getBottomDiv()?.console.$consoleTab.find('.jo_console-top').append("<div>" + <string>(parameters[1].value) + "</div>"); 
                }, false, true));

    }

}