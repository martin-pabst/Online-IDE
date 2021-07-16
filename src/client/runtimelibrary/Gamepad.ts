import { Type, Method, Parameterlist, Value, Attribute } from "../compiler/types/Types.js";
import { Klass, Visibility } from "../compiler/types/Class.js";
import { stringPrimitiveType, doublePrimitiveType, floatPrimitiveType, intPrimitiveType, booleanPrimitiveType } from "../compiler/types/PrimitiveTypes.js";
import { Module } from "../compiler/parser/Module.js";
import { PrintManager } from "../main/gui/PrintManager.js";
import { RuntimeObject } from "../interpreter/RuntimeObject.js";

export class GamepadClass extends Klass {

    constructor(module: Module) {
        super("Gamepad", module, "Klasse mit statischen Methoden zur Abfrage der Gamepads");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));

        // this.addAttribute(new Attribute("PI", doublePrimitiveType, (value) => { value.value = Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));
        // this.addAttribute(new Attribute("E", doublePrimitiveType, (value) => { value.value = Math.E }, true, Visibility.public, true, "Die Eulersche Zahl e"));

        this.staticClass.setupAttributeIndicesRecursive();

        this.staticClass.classObject = new RuntimeObject(this.staticClass);

        this.addMethod(new Method("isButtonDown", new Parameterlist([
            { identifier: "gamepadIndex", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "buttonIndex", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let gamepadIndex: number = parameters[1].value;
                let buttonIndex: number = parameters[2].value;

                return module.main.getInterpreter().gamepadTool.isGamepadButtonPressed(gamepadIndex, buttonIndex);

            }, false, true, "Gibt genau dann true zurück, wenn der Button buttonIndex des Gamepads GamepadIndex gedrückt ist.", false));

        this.addMethod(new Method("isConnected", new Parameterlist([
            { identifier: "gamepadIndex", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let gamepadIndex: number = parameters[1].value;

                return module.main.getInterpreter().gamepadTool.isGamepadConnected(gamepadIndex);

            }, false, true, "Gibt true zurück, falls das Gamepad mit dem übergebenen Index angeschlossen ist. VORSICHT: Das erste Gamepad hat Index 0.", false));

        this.addMethod(new Method("getAxisValue", new Parameterlist([
            { identifier: "gamepadIndex", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "axisIndex", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let gamepadIndex: number = parameters[1].value;
                let axisIndex: number = parameters[2].value;

                return module.main.getInterpreter().gamepadTool.getGamepadAxisValue(gamepadIndex, axisIndex);

            }, false, true, "Gibt den Wert des Gamepad-Steuerknüppels mit Index axisIndex zurück.", false));


    }
}