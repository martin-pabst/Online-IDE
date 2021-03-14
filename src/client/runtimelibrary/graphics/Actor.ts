import { Interface, Klass } from "../../compiler/types/Class.js";
import { Module } from "../../compiler/parser/Module.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { voidPrimitiveType, stringPrimitiveType, booleanPrimitiveType, doublePrimitiveType, intPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { WorldHelper, WorldClass } from "./World.js";
import { Interpreter } from "../../interpreter/Interpreter.js";

export class Actor extends Klass {

    constructor(module: Module) {

        super("Actor", module, "Abstrakte Klasse mit überschreibbaren Methoden act (zur Implemntierung eines Timers) und onKeyTyped, onKeyUp usw. zur entgegennahme von Tastaturereignissen");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));
        this.isAbstract = true;

        let methodSignatures: { signature: string, actorListIdentifier: string }[] = [
            { signature: "onKeyTyped(String)", actorListIdentifier: "keyPressedActors" },
            { signature: "onKeyUp(String)", actorListIdentifier: "keyUpActors" },
            { signature: "onKeyDown(String)", actorListIdentifier: "keyDownActors" },
            { signature: "act()", actorListIdentifier: "actActors" },
            { signature: "act(double)", actorListIdentifier: "actActors" },
        ];

        this.postConstructorCallbacks = [
            (r: RuntimeObject) => {

                for (let ms of methodSignatures) {
                    let method: Method = (<Klass>r.class).getMethodBySignature(ms.signature);

                    if (method?.program != null || method?.invoke != null) {
                        let ah: ActorHelper = <ActorHelper>r.intrinsicData['Actor'];
                        ah.worldHelper[ms.actorListIdentifier].push({
                            actorHelper: ah,
                            method: method
                        })
                    }
                }

            }
        ];

        this.addMethod(new Method("Actor", new Parameterlist([
            // { identifier: "deltaTimeInMs", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        // ]), this,
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let actorHelper = new ActorHelper(module.main.getInterpreter(), o);

                o.intrinsicData["Actor"] = actorHelper;

                // return o;

            },  // no implementation!
            false, false, "Der Konstruktor registriert den Actor beim Grafikfenster", true));

        this.addMethod(new Method("destroy", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ActorHelper = o.intrinsicData["Actor"];
                sh.destroy();

            }, false, false, "Vernichtet das Grafikobjekt. Falls es in einem Group-Objekt enthalten ist, wird es vor dem Vernichten automatisch aus diesem entfernt.", false));

        this.addMethod(new Method("isKeyUp", new Parameterlist([
            { identifier: "key", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let key: string = parameters[1].value;
                let sh: ActorHelper = o.intrinsicData["Actor"];

                return !sh.isKeyDown(key);

            }, false, false, "Gibt genau dann true zurück, wenn der Benutzer die gegebenen Taste gerade NICHT drückt. Als Taste kann auch bsw. [shift]+m angegeben werden. Die Angabe von Sondertasten (Enter, ArrowUp, ArrowLeft, ...) ist auch möglich.", false));

        this.addMethod(new Method("isKeyDown", new Parameterlist([
            { identifier: "key", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let key: string = parameters[1].value;
                let sh: ActorHelper = o.intrinsicData["Actor"];

                return sh.isKeyDown(key);

            }, false, false, "Gibt genau dann true zurück, wenn der Benutzer die gegebenen Taste gerade drückt. Als Taste kann auch bsw. [shift]+m angegeben werden. Die Angabe von Sondertasten (Enter, ArrowUp, ArrowLeft, ...) ist auch möglich.", false));

        this.addMethod(new Method("isDestroyed", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ActorHelper = o.intrinsicData["Actor"];

                return sh.isDestroyed;

            }, false, false, "Gibt true zurück, falls das Objekt bereits durch die Methode destroy() zerstört wurde.", false));


        this.addMethod(new Method("getWorld", new Parameterlist([
        ]), module.typeStore.getType("World"),
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ActorHelper = o.intrinsicData["Actor"];

                let interpreter = module.main.getInterpreter();
                let worldHelper = interpreter.worldHelper;
                if (worldHelper == null) {
                    let w: RuntimeObject = new RuntimeObject(<Klass>interpreter.moduleStore.getType("World").type);
                    worldHelper = new WorldHelper(800, 600, interpreter.moduleStore.getModule("Base Module"), w);
                }        
                return worldHelper.world;

            }, false, false, "Gibt das Welt-Objekt zurück.", false));

        this.addMethod(new Method("stopActing", new Parameterlist([
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ah: ActorHelper = o.intrinsicData["Actor"];

                // ah.timerPaused = true;
                ah.setTimerPaused(true);

                return;

            }, false, false, "Stoppt den 30-mal pro Sekunde erfolgenden Aufruf der Methode act für dieses Objekt.", false));

            this.addMethod(new Method("restartActing", new Parameterlist([
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ActorHelper = o.intrinsicData["Actor"];

                // sh.timerPaused = false;
                sh.setTimerPaused(false);

            }, false, false, "Startet den 30-mal pro Sekunde erfolgenden Aufruf der Methode act für dieses Objekt erneut.", false));

            this.addMethod(new Method("isActing", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ActorHelper = o.intrinsicData["Actor"];

                return !sh.timerPaused;

            }, false, false, "Gibt true zurück, wenn der periodische Aufruf der Methode act weiterhin erfolgt.", false));

        this.addMethod(new Method("act", new Parameterlist([
            { identifier: "deltaTime", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            null, // no statements!
            false, false, "Wird ca. 30-mal pro Sekunde aufgerufen", false));

        this.addMethod(new Method("act", new Parameterlist([
        ]), null,
            null, // no statements!
            false, false, "Wird ca. 30-mal pro Sekunde aufgerufen", false));

        this.addMethod(new Method("onKeyTyped", new Parameterlist([
            { identifier: "key", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            null, // no statements!
            false, false, "Wird aufgerufen, nachdem der Benutzer eine Taste gedrückt und wieder losgelassen hat.", false));

        this.addMethod(new Method("onKeyDown", new Parameterlist([
            { identifier: "key", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            null, // no statements!
            false, false, "Wird aufgerufen, nachdem der Benutzer eine Taste gedrückt hat.", false));

        this.addMethod(new Method("onKeyUp", new Parameterlist([
            { identifier: "key", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            null, // no statements!
            false, false, "Wird aufgerufen, nachdem der Benutzer eine Taste losgelassen hat.", false));


    }

    registerWorldType() {
        this.methods.filter(m => m.identifier == "getWorld")[0].returnType = this.module.typeStore.getType("World");
    }


}

export class ActorHelper {

    worldHelper: WorldHelper;
    isDestroyed: boolean = false;

    timerPaused: boolean = false;

    constructor(interpreter: Interpreter, public runtimeObject: RuntimeObject) {
        let worldHelper = interpreter.worldHelper;
        if (worldHelper == null) {
            let w: RuntimeObject = new RuntimeObject(<Klass>interpreter.moduleStore.getType("World").type);
            worldHelper = new WorldHelper(800, 600, interpreter.moduleStore.getModule("Base Module"), w);
            // worldHelper = new WorldHelper(800, 600, interpreter.main.currentWorkspace.moduleStore.getModule("Base Module"), w);
            w.intrinsicData["World"] = worldHelper;
        }
        this.worldHelper = worldHelper;
    }

    setTimerPaused(tp: boolean) {
        this.timerPaused = tp;
    }


    isKeyDown(key: string): boolean {
        return this.worldHelper.interpreter.keyboardTool.isPressed(key);
    }

    destroy() {
        this.isDestroyed = true;
        this.worldHelper.actorHelpersToDestroy.push(this);
    }

}

