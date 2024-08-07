import { Type, Method, Parameterlist, Value, Attribute } from "../../compiler/types/Types.js";
import { Klass, Visibility } from "../../compiler/types/Class.js";
import { stringPrimitiveType, doublePrimitiveType, floatPrimitiveType, intPrimitiveType, voidPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Module } from "../../compiler/parser/Module.js";
import { PrintManager } from "../../main/gui/PrintManager.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { SoundTools } from "../../../tools/SoundTools.js";

export class SoundKlass extends Klass {

    constructor(module: Module) {
        super("Sound", module, "Aufzählung aller Geräusche");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));

        for(let sound of SoundTools.sounds){
            this.addAttribute(new Attribute(sound.name, stringPrimitiveType, (value) => { value.value = sound.name }, true, Visibility.public, true, sound.description));
        }

        this.staticClass.setupAttributeIndicesRecursive();

        this.staticClass.classObject = new RuntimeObject(this.staticClass);

        this.addMethod(new Method("playSound", new Parameterlist([
            { identifier: "sound", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
        (parameters) => {
            let sound: string = parameters[1].value;
            SoundTools.play(sound);
        }    
        , false, true, "Spielt einen Sound ab. Die Möglichen Sounds sind als statische Variablen der Klasse Sound hinterlegt. Tippe als Parameter also Sound gefolgt von einem Punkt ein, um eine Auswahl zu sehen!"));

        this.addMethod(new Method("getVolume", new Parameterlist([
        ]), doublePrimitiveType,
        (parameters) => {
            if(!SoundTools.volumeDetectionRunning) SoundTools.startDetectingVolume();
            return SoundTools.getVolume();
        }    
        , false, true, "Gibt die aktuelle Mikrofonlautstärke zurück. Beim ersten Aufruf muss der Benutzer dem Browser die Erlaubnis zur Benutzung des Mikrofons geben. Solange dies noch nicht erfolgt ist, gibt die Funktion den Wert -1 zurück."));


    }

}