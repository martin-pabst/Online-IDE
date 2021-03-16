import { Type, Method, Parameterlist, Value, Attribute } from "../compiler/types/Types.js";
import { Klass, Visibility, Interface } from "../compiler/types/Class.js";
import { stringPrimitiveType, doublePrimitiveType, floatPrimitiveType, intPrimitiveType, voidPrimitiveType } from "../compiler/types/PrimitiveTypes.js";
import { Module } from "../compiler/parser/Module.js";
import { PrintManager } from "../main/gui/PrintManager.js";
import { RuntimeObject } from "../interpreter/RuntimeObject.js";
import { EnumRuntimeObject } from "../compiler/types/Enum.js";
import { SoundTools } from "../tools/SoundTools.js";

export class SystemClass extends Klass {

    printStream: RuntimeObject;

    deltaTimeMillis: number = 0; // when using WebSocket then the Server sends time synchronization

    constructor(module: Module) {
        super("System", module, "Klasse mit statischen Methoden für Systemfunktionen, z.B. Sound, Löschen der Ausgabe usw.");

        this.printStream = new RuntimeObject(<Klass>module.typeStore.getType("PrintStream"));

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));

        this.addAttribute(new Attribute("out", module.typeStore.getType("PrintStream"),
            (value) => { value.value = this.printStream }, true, Visibility.public, true, "PrintStream-Objekt, mit dem Text ausgegeben werden kann."));

        this.staticClass.setupAttributeIndicesRecursive();


        this.staticClass.classObject = new RuntimeObject(this.staticClass);

        // this.addMethod(new Method("clearScreen", new Parameterlist([
        // ]), null,
        //     (parameters) => {
        //         module.main.getInterpreter().printManager.clear();
        //     }, false, true, "Löscht den Bildschirm"));

        // this.addMethod(new Method("addKeyListener", new Parameterlist([
        //     { identifier: "keyListener", type: module.typeStore.getType("KeyListener"), declaration: null, usagePositions: null, isFinal: true }
        // ]), null,
        // (parameters) => {
        //     let r: RuntimeObject = parameters[1].value;
        //     let method = (<Klass>r.class).getMethodBySignature("onKeyTyped(String)");

        //     if (method != null) {

        //         module.main.getInterpreter().keyboardTool.keyPressedCallbacks.push((key) => {

        //             let program = method?.program;
        //             let invoke = method?.invoke;

        //             let stackElements: Value[] = [
        //                 {
        //                     type: r.class,
        //                     value: r
        //                 },
        //                 {
        //                     type: stringPrimitiveType,
        //                     value: key
        //                 }
        //             ];

        //             if (program != null) {
        //                 module.main.getInterpreter().runTimer(method, stackElements, null, false);
        //             } else if (invoke != null) {
        //                 invoke([]);
        //             }


        //         });
        //     }
        // }    
        // , false, true, "Fügt einen KeyListener hinzu, dessen Methode keyTyped immer dann aufgerufen wird, wenn eine Taste gedrückt und anschließend losgelassen wird."));

        // this.addMethod(new Method("playSound", new Parameterlist([
        //     { identifier: "sound", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        // ]), null,
        // (parameters) => {
        //     let sound: string = parameters[1].value;
        //     SoundTools.play(sound);
        // }    
        // , false, true, "Spielt einen Sound ab. Die Möglichen Sounds sind als statische Variablen der Klasse Sound hinterlegt. Tippe als Parameter also Sound gefolgt von einem Punkt ein, um eine Auswahl zu sehen!"));

        this.addMethod(new Method("currentTimeMillis", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {
                return Date.now() + this.deltaTimeMillis;
            }
            , false, true, "Gibt die Anzahl der Millisekunden, die seit dem 01.01.1970 00:00:00 UTC vergangen sind, zurück."));

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