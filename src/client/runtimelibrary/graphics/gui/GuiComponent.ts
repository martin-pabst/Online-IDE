import * as PIXI from 'pixi.js';
import { Module } from "../../../compiler/parser/Module.js";
import { Klass } from "../../../compiler/types/Class.js";
import { doublePrimitiveType, objectType, stringPrimitiveType, voidPrimitiveType } from "../../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../../compiler/types/Types.js";
import { Interpreter } from "../../../interpreter/Interpreter.js";
import { RuntimeObject } from "../../../interpreter/RuntimeObject.js";
import { FilledShapeHelper } from "../FilledShape.js";
import { InternalKeyboardListener, InternalMouseListener, MouseEvent } from '../World.js';

type ChangeListenerInformation = {
    rto: RuntimeObject,
    method: Method
}

export class GuiComponentClass extends Klass {

    constructor(module: Module) {

        super("GuiComponent", module, "Oberklasse für alle GUI-Komponenten");

        this.setBaseClass(<Klass>module.typeStore.getType("FilledShape"));

        this.isAbstract = true;

        let changeListenerType = <Klass>module.typeStore.getType("ChangeListener");


        this.postConstructorCallbacks = [
            (r: RuntimeObject) => {

                let method: Method = (<Klass>r.class).getMethodBySignature("onChange(String)");

                if (method?.program != null) {
                    r.intrinsicData["onChange"] = method;
                }
            }
        ];

        this.addMethod(new Method("getWidth", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: GuiComponentHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getWidth")) return;

                return sh.getWidth();

            }, false, false, 'Gibt die Breite des Buttons zurück.', false));

        this.addMethod(new Method("getHeight", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: GuiComponentHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getHeight")) return;

                return sh.getHeight();

            }, false, false, 'Gibt die Höhe des Buttons zurück.', false));


        this.addMethod(new Method("addChangeListener", new Parameterlist([
            { identifier: "changeListener", type: changeListenerType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let changeListener: RuntimeObject = parameters[1].value;
                let sh: GuiComponentHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("addChangeListener")) return;

                sh.addChangeListener(changeListener);

            }, false, false, 'Fügt einen ChangeListener hinzu, dessen onChange-Methode immer dann aufgerufen wird, wenn sich der Wert der GUI-Komponente aufgrund von Benutzeraktionen ändert.', false));

        this.addMethod(new Method("onChange", new Parameterlist([
            { identifier: "newValue", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
            () => {

            },
            false, false, "Wird aufgerufen, wenn sich der Wert der GUI-Komponente aufgrund von Benutzeraktionen ändert.", false));

    }
    
}

export abstract class GuiComponentHelper extends FilledShapeHelper implements InternalMouseListener, InternalKeyboardListener {

    height: number = 0;
    width: number = 0;

    changeListeners: RuntimeObject[] = [];

    constructor(public interpreter: Interpreter, public runtimeObject: RuntimeObject, private registerAsMouseListener: boolean, private registerAsKeyboardListener: boolean) {
        super(interpreter, runtimeObject);
        this.registerAsListener();
    }

    registerAsListener(){
        if (this.registerAsMouseListener){
            this.worldHelper.internalMouseListeners.push(this);
        }

        if(this.registerAsKeyboardListener){
            this.worldHelper.internalKeyboardListeners.push(this);
        }
    }

    abstract onMouseEvent(kind: MouseEvent, x: number, y: number): void;

    abstract onKeyDown(key: string, isShift: boolean, isCtrl: boolean, isAlt: boolean): void;

    abstract looseKeyboardFocus(): void;

    unregisterAsListener() {
        let index = this.worldHelper.internalMouseListeners.indexOf(this);
        this.worldHelper.internalMouseListeners.splice(index, 1);
        let index1 = this.worldHelper.internalKeyboardListeners.indexOf(this);
        this.worldHelper.internalKeyboardListeners.splice(index1, 1);
    }

    destroy(): void {
        this.unregisterAsListener();
        super.destroy();
    }

    setVisible(visible: boolean) {
        super.setVisible(visible);
        if (visible) {
            this.registerAsListener();
        } else {
            this.unregisterAsListener();
        }
    }


    moveTo(newX: number, newY: number) {
        let p = new PIXI.Point(0, 0);
        this.displayObject.updateTransform();
        this.displayObject.localTransform.apply(p, p);
        this.move(newX - p.x, newY - p.y);
    }

    getWidth(): number {
        return this.width;
    }

    getHeight(): number {
        return this.height;
    }

    addChangeListener(cl: RuntimeObject) {
        this.changeListeners.push(cl);
    }

    onChange(newValue: string) {

        let infoList: ChangeListenerInformation[] = [];

        let m: Method = this.runtimeObject.intrinsicData["onChange"];
        if (m != null) {
            infoList.push({ rto: this.runtimeObject, method: m });
        }

        for (let cl of this.changeListeners) {
            let m1 = (<Klass>cl.class).getMethodBySignature("onChange(Object, String)");
            if (m1 != null) {
                infoList.push({ rto: cl, method: m1 });
            }
        }

        let worker = () => {

            let info = infoList.pop();
            if(info.method.parameterlist.parameters.length == 2){
                this.worldHelper.module.main.getInterpreter().runTimer(info.method, [{ value: info.rto, type: this.runtimeObject.class }, {value: this.runtimeObject, type: this.runtimeObject.class}, { value: newValue, type: stringPrimitiveType }], () => {
                    if(infoList.length > 0) worker();
                }, true);
            } else {
                this.worldHelper.module.main.getInterpreter().runTimer(info.method, [{ value: info.rto, type: this.runtimeObject.class }, { value: newValue, type: stringPrimitiveType }], () => {
                    if(infoList.length > 0) worker();
                }, true);
            }
        }

        if(infoList.length > 0) worker();

    }

}
