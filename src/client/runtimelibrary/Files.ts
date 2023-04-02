import { Type, Method, Parameterlist, Value, Attribute } from "../compiler/types/Types.js";
import { Klass, Visibility } from "../compiler/types/Class.js";
import { stringPrimitiveType, doublePrimitiveType, floatPrimitiveType, intPrimitiveType } from "../compiler/types/PrimitiveTypes.js";
import { Module } from "../compiler/parser/Module.js";
import { PrintManager } from "../main/gui/PrintManager.js";
import { RuntimeObject } from "../interpreter/RuntimeObject.js";

export class FilesClass extends Klass {

    constructor(module: Module) {
        super("Files", module, "Klasse mit statischen Methoden zum Lesen/Schreiben von Dateien.");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));

        this.staticClass.setupAttributeIndicesRecursive();

        this.staticClass.classObject = new RuntimeObject(this.staticClass);

        this.addMethod(new Method("read", new Parameterlist([
            { identifier: "workspaceFilename", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), stringPrimitiveType,
            (parameters) => {
                let filename: string = <string>parameters[1].value;
                let m = module.main.getCurrentWorkspace().moduleStore.getModule(filename);
                let interpreter = module.main.getInterpreter();
                if(m == null){
                    interpreter.throwException("Die Datei mit dem angegebenen Namen '" + filename + "' gibt es nicht.");
                    return;
                }
                
                return m.getProgramTextFromMonacoModel();
            }, false, true, "Gibt den Inhalt der Workspacedatei zurück."));

        this.addMethod(new Method("write", new Parameterlist([
            { identifier: "workspaceFilename", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "text", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), stringPrimitiveType,
            (parameters) => {
                let filename: string = <string>parameters[1].value;
                let text: string = <string>parameters[2].value;
                let m = module.main.getCurrentWorkspace().moduleStore.getModule(filename);
                let interpreter = module.main.getInterpreter();
                if(m == null){
                    interpreter.throwException("Die Datei mit dem angegebenen Namen '" + filename + "' gibt es nicht.");
                    return;
                }
                if(text.length > 200000){
                    interpreter.throwException("Der Text ist zu lang (> 200 000 Zeichen).");
                    return;
                }
                m.file.text = text;
                m.model.setValue(text);
                m.file.saved = false;
            }, false, true, "Schreibt den Text in die Workspacedatei."));

        this.addMethod(new Method("append", new Parameterlist([
            { identifier: "workspaceFilename", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "text", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), stringPrimitiveType,
            (parameters) => {
                let filename: string = <string>parameters[1].value;
                let text: string = <string>parameters[2].value;
                let m = module.main.getCurrentWorkspace().moduleStore.getModule(filename);
                let interpreter = module.main.getInterpreter();
                if(m == null){
                    interpreter.throwException("Die Datei mit dem angegebenen Namen '" + filename + "' gibt es nicht.");
                    return;
                }
                if(text.length + m.file.text.length > 200000){
                    interpreter.throwException("Der Text ist zu lang (> 200 000 Zeichen).");
                    return;
                }
                m.file.text += text;
                m.model.setValue(m.file.text);
                m.file.saved = false;
            }, false, true, "Fügt den Text zur Workspacedatei hinzu."));


    }
}