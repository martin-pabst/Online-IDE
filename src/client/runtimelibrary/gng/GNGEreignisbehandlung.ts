import { Module, ModuleStore } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { charPrimitiveType, intPrimitiveType, voidPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist, Value } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";


export type GNGAktionsempfaengerType = "ausführen" | "taste" | "sondertaste" | "geklickt";

export type GNGAktionsempfaengerData = {
    type: GNGAktionsempfaengerType,
    method: Method,
    runtimeObject: RuntimeObject
}

export class GNGEreignisbehandlung extends Klass {

    aktionsempfaengerTypes: string[] = ["ausführen", "taste", "sondertaste", "geklickt"];
    methodSignatureList: string[] = ["TaktImpulsAusführen()", "AktionAusführen()", "MausGeklickt(int, int, int)", "TasteGedrückt(char)", "SonderTasteGedrückt(int)"];
    methodToAktionsempfaengerTypeMap: { [signature: string]: string } = {
        "TaktImpulsAusführen()": "ausführen",
        "AktionAusführen()": "ausführen",
        "MausGeklickt(int, int, int)": "geklickt",
        "TasteGedrückt(char)": "taste",
        "SonderTasteGedrückt(int)": "sondertaste"
    };

    // see https://www.freecodecamp.org/news/javascript-keycode-list-keypress-event-key-codes/
    keyToKeyCodeMap: { [key: string]: number } = {
        "Enter": 13,
        "ArrowLeft": 37,
        "ArrowRight": 39,
        "ArrowUp": 38,
        "ArrowDown": 40
    }

    // For gng library (Cornelsen-Verlag):
    aktionsempfaengerMap: { [aktionsempfaengerType: string]: GNGAktionsempfaengerData[] };

    timerRunning: boolean;
    taktdauer: number = 300;
    remainingTime: number = 0;

    onKeyDownMethod: (key: string) => void;


    constructor(module: Module, private moduleStore: ModuleStore) {

        super("Ereignisbehandlung", module, "Zugriff auf Ereignisse einschließlich Taktgeber (Graphics'n Games-Bibliothek (Cornelsen-Verlag))");

        let interpreter = module.main.getInterpreter();
        if (interpreter.gngEreignisbehandlung != null) {
            interpreter.gngEreignisbehandlung.detachEvents();
        }

        interpreter.gngEreignisbehandlung = this;
        this.bindEvents();

        // let polygonClass: Klass = <Klass>moduleStore.getType("Polygon").type;

        // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));



        this.addMethod(new Method("Ereignisbehandlung", new Parameterlist([]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                for (let type of this.aktionsempfaengerTypes) {
                    this.aktionsempfaengerMap[type] = [];
                }

                this.registerEvents(o);

            }, false, false, 'Instanziert ein neues Ereignisbehandlungs-Objekt.', true));

        // this.addMethod(new Method("GrößeSetzen", new Parameterlist([
        //     { identifier: "größe", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        // ]), null,
        //     (parameters) => {

        //         let o: RuntimeObject = parameters[0].value;
        //         let sh: GroupHelper = o.intrinsicData["Actor"];
        //         let groesse: number = parameters[1].value;


        //     }, false, false, "Setzt die Größe der Figur.", false));

        this.addMethod(new Method("Starten()", new Parameterlist([
        ]), null,
            (parameters) => {
                this.startTimer();

            }, false, false, "Zeitgeber starten.", false));

        this.addMethod(new Method("Anhalten()", new Parameterlist([
        ]), null,
            (parameters) => {
                this.stopTimer();

            }, false, false, "Zeitgeber anhalten.", false));

        this.addMethod(new Method("TaktdauerSetzen", new Parameterlist([
            { identifier: "dauer", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let dauer: number = parameters[1].value;
                this.taktdauer = dauer;

            }, false, true, 'Setzt die Taktdauer des Zeitgebers in Millisekunden', false));


        this.addMethod(new Method("TaktImpulsAusführen", new Parameterlist([]), voidPrimitiveType,
            null,  // no implementation!
            false, false, "Diese Methode wird vom Taktgeber aufgerufen."));

        this.addMethod(new Method("TasteGedrückt", new Parameterlist([
            { identifier: "taste", type: charPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
            null,  // no implementation!
            false, false, "Wird aufgerufen, wenn eine Taste gedrückt wird."));

        this.addMethod(new Method("SonderTasteGedrückt", new Parameterlist([
            { identifier: "taste", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
            null,  // no implementation!
            false, false, "Wird aufgerufen, wenn eine Sondertaste gedrückt wird."));

        this.addMethod(new Method("MausGecklickt", new Parameterlist([
            { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "anzahl", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            null,  // no implementation!
            false, false, "Wird aufgerufen, wenn eine die linke Maustaste gedrückt wird."));

    }

    registerEvents(o: RuntimeObject) {
        let klass = <Klass>o.class;   // This might be a child class of Ereignisbehandlung!

        for (let ms of this.methodSignatureList) {
            let method: Method = klass.getMethodBySignature(ms);
            let type = this.methodToAktionsempfaengerTypeMap[ms];

            if (method?.program != null || method?.invoke != null) {
                this.aktionsempfaengerMap[type].push({
                    type: <GNGAktionsempfaengerType>type,
                    method: method,
                    runtimeObject: o
                });
            }
        }

    }

    unregisterEvents(o: RuntimeObject) {
        let klass = <Klass>o.class;   // This might be a child class of Ereignisbehandlung!

        for (let ms of this.methodSignatureList) {
            let type = this.methodToAktionsempfaengerTypeMap[ms];

            this.aktionsempfaengerMap[type] =
                this.aktionsempfaengerMap[type].filter(ae => ae.runtimeObject != o);
        }
    }


    bindEvents() {
        let interpreter = this.module.main.getInterpreter();

        this.onKeyDownMethod = (key: string) => {
            if (key.length == 1) {
                for (let ae of this.aktionsempfaengerMap["taste"]) {
                    this.invokeMethod(ae.method, ae.runtimeObject, [{ type: charPrimitiveType, value: key }]);
                }
            } else {
                let keyCode = this.keyToKeyCodeMap[key];
                if (keyCode != null) {
                    for (let ae of this.aktionsempfaengerMap["sondertaste"]) {
                        this.invokeMethod(ae.method, ae.runtimeObject, [{ type: charPrimitiveType, value: keyCode }]);
                    }
                }
            }

        };

        interpreter.keyboardTool.keyDownCallbacks.push(this.onKeyDownMethod);

        this.startTimer();

    }

    detachEvents() {
        let interpreter = this.module.main.getInterpreter();
        let index = interpreter.keyboardTool.keyDownCallbacks.indexOf(this.onKeyDownMethod);
        if (index >= 0) interpreter.keyboardTool.keyDownCallbacks.splice(index, 1);
        this.stopTimer();
    }


    invokeMethod(method: Method, runtimeObject: RuntimeObject, parameters: Value[] = [], callback?: () => void) {
        let program = method.program;
        let invoke = method.invoke;

        parameters.unshift({ type: runtimeObject.class, value: runtimeObject });

        if (program != null) {
            this.module.main.getInterpreter().runTimer(method, parameters, callback, false);
        } else if (invoke != null) {
            invoke(parameters);
        }

    }

    stopTimer() {
        this.timerRunning = false;
    }

    startTimer() {

        if (!this.timerRunning) {
            this.timerRunning = true;
            this.processTimerEntries();
        }

    }

    processTimerEntries() {

        if (!this.timerRunning) return;

        let dt = 10;

        this.remainingTime += dt;
        if (this.remainingTime > this.taktdauer) {
            this.remainingTime -= this.taktdauer;

            let liste = this.aktionsempfaengerMap["ausführen"];
            for (let ae of liste) {

                this.invokeMethod(ae.method, ae.runtimeObject, []);

            }

        }

        let that = this;
        setTimeout(() => {
            that.processTimerEntries();
        }, dt);

    }

    handleMouseClickedEvent(x: number, y: number) {
        let parameters: Value[] = [
            { type: intPrimitiveType, value: Math.round(x) },
            { type: intPrimitiveType, value: Math.round(y) }
        ]

        let liste = this.aktionsempfaengerMap["geklickt"];
        for (let ae of liste) {
            this.invokeMethod(ae.method, ae.runtimeObject, parameters);

        }

    }


}

