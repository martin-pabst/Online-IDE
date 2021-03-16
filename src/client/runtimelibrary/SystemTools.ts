import { Type, Method, Parameterlist, Value, Attribute } from "../compiler/types/Types.js";
import { Klass, Visibility, Interface } from "../compiler/types/Class.js";
import { stringPrimitiveType, doublePrimitiveType, floatPrimitiveType, intPrimitiveType, voidPrimitiveType } from "../compiler/types/PrimitiveTypes.js";
import { Module } from "../compiler/parser/Module.js";
import { PrintManager } from "../main/gui/PrintManager.js";
import { RuntimeObject } from "../interpreter/RuntimeObject.js";
import { EnumRuntimeObject } from "../compiler/types/Enum.js";
import { SoundTools } from "../tools/SoundTools.js";

export class SystemToolsClass extends Klass {

    constructor(module: Module) {
        super("SystemTools", module, "Klasse mit statischen Methoden für Systemfunktionen, z.B. Löschen der Ausgabe, Registrieren eines Tastaturlisteners usw.");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));

        this.staticClass.classObject = new RuntimeObject(this.staticClass);

        this.addMethod(new Method("clearScreen", new Parameterlist([
        ]), null,
            (parameters) => {
                module.main.getInterpreter().printManager.clear();
            }, false, true, "Löscht den Bildschirm"));

        this.addMethod(new Method("addKeyListener", new Parameterlist([
            { identifier: "keyListener", type: module.typeStore.getType("KeyListener"), declaration: null, usagePositions: null, isFinal: true }
        ]), null,
        (parameters) => {
            let r: RuntimeObject = parameters[1].value;
            let method = (<Klass>r.class).getMethodBySignature("onKeyTyped(String)");

            if (method != null) {

                module.main.getInterpreter().keyboardTool.keyPressedCallbacks.push((key) => {

                    let program = method?.program;
                    let invoke = method?.invoke;

                    let stackElements: Value[] = [
                        {
                            type: r.class,
                            value: r
                        },
                        {
                            type: stringPrimitiveType,
                            value: key
                        }
                    ];

                    if (program != null) {
                        module.main.getInterpreter().runTimer(method, stackElements, null, false);
                    } else if (invoke != null) {
                        invoke([]);
                    }


                });
            }
        }    
        , false, true, "Fügt einen KeyListener hinzu, dessen Methode keyTyped immer dann aufgerufen wird, wenn eine Taste gedrückt und anschließend losgelassen wird."));

        // this.addMethod(new Method("playSound", new Parameterlist([
        //     { identifier: "sound", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        // ]), null,
        // (parameters) => {
        //     let sound: string = parameters[1].value;
        //     SoundTools.play(sound);
        // }    
        // , false, true, "Spielt einen Sound ab. Die Möglichen Sounds sind als statische Variablen der Klasse Sound hinterlegt. Tippe als Parameter also Sound gefolgt von einem Punkt ein, um eine Auswahl zu sehen!"));
    }
}

export class KeyListener extends Interface {

    constructor(module: Module) {
        super("KeyListener", module, "Interface mit Methode onKeyTyped. Eine Klasse, die dieses Interface implementiert, kann auf Tastatureingaben reagieren. Ein Objekt dieser Klasse muss zuvor aber mit System.addKeyListener() registriert werden.");

        this.addMethod(new Method("onKeyTyped", new Parameterlist([
            { identifier: "key", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
            null,  // no implementation!
            false, false, "Wird aufgerufen, nachdem eine Taste gedrückt wurde."));
    }

}


export class PrintStreamClass extends Klass {

    constructor(module: Module) {
        super("PrintStream", module, "Interne Hilfsklasse, um System.out.println zu ermöglichen. Das Objekt System.out ist von der Klasse PrintStream.");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));

        this.addMethod(new Method("print", new Parameterlist([
            { identifier: "text", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {
                module.main.getInterpreter().printManager.print(parameters[1].value);
            }, false, true, "Gibt den Text aus."));

        this.addMethod(new Method("println", new Parameterlist([
            { identifier: "text", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {
                module.main.getInterpreter().printManager.println(parameters[1].value);
            }, false, true, "Gibt den Text aus, gefolgt von einem Zeilensprung."));


    }

}