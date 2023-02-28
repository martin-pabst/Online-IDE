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

    constructor(module: Module, private moduleStore: ModuleStore) {

        super("Ereignisbehandlung", module, "Zugriff auf Ereignisse einschließlich Taktgeber (Graphics'n Games-Bibliothek (Cornelsen-Verlag))");

        let objectType = <Klass>moduleStore.getType("Object").type;
        this.setBaseClass(objectType);

        this.addMethod(new Method("Ereignisbehandlung", new Parameterlist([]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let helper = GNGEreignisbehandlung.getHelper(module);

                helper.registerEvents(o);

            }, false, false, 'Instanziert ein neues Ereignisbehandlungs-Objekt.', true));

        // this.addMethod(new Method("GrößeSetzen", new Parameterlist([
        //     { identifier: "größe", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        // ]), null,
        //     (parameters) => {

        //         let o: RuntimeObject = parameters[0].value;
        //         let sh: GroupHelper = o.intrinsicData["Actor"];
        //         let groesse: number = parameters[1].value;


        //     }, false, false, "Setzt die Größe der Figur.", false));

        this.addMethod(new Method("Starten", new Parameterlist([
        ]), null,
            (parameters) => {
                 GNGEreignisbehandlung.getHelper(module).startTimer();

            }, false, false, "Zeitgeber starten.", false));

        this.addMethod(new Method("Anhalten", new Parameterlist([
        ]), null,
            (parameters) => {
                GNGEreignisbehandlung.getHelper(module).stopTimer();

            }, false, false, "Zeitgeber anhalten.", false));

        this.addMethod(new Method("TaktdauerSetzen", new Parameterlist([
            { identifier: "dauer", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let dauer: number = parameters[1].value;
                GNGEreignisbehandlung.getHelper(module).taktdauer = dauer;

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

        this.addMethod(new Method("MausGeklickt", new Parameterlist([
            { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "anzahl", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            null,  // no implementation!
            false, false, "Wird aufgerufen, wenn eine die linke Maustaste gedrückt wird."));

    }

    static getHelper(module: Module):GNGEreignisbehandlungHelper{
        let interpreter = module.main.getInterpreter();
        if (interpreter.gngEreignisbehandlungHelper == null) {
            interpreter.gngEreignisbehandlungHelper = new GNGEreignisbehandlungHelper(module);
            interpreter.gngEreignisbehandlungHelper.bindEvents();
        }

        return interpreter.gngEreignisbehandlungHelper;

    }

}


export class GNGEreignisbehandlungHelper {

    aktionsempfaengerTypes: string[] = ["ausführen", "taste", "sondertaste", "geklickt"];
    methodSignatureList: string[] = ["TaktImpulsAusführen()", "Ausführen()", "AktionAusführen()", "MausGeklickt(int, int, int)", "Taste(char)", "TasteGedrückt(char)", 
    "SonderTaste(int)", "SonderTasteGedrückt(int)"];
    methodToAktionsempfaengerTypeMap: { [signature: string]: string } = {
        "TaktImpulsAusführen()": "ausführen",
        "Ausführen()": "ausführen",
        "AktionAusführen()": "ausführen",
        "MausGeklickt(int, int, int)": "geklickt",
        "Taste(char)": "taste",
        "TasteGedrückt(char)": "taste",
        "SonderTaste(int)": "sondertaste",
        "SonderTasteGedrückt(int)": "sondertaste"
    };

    // see https://www.freecodecamp.org/news/javascript-keycode-list-keypress-event-key-codes/
    keyToKeyCodeMap: { [key: string]: number } = {
        "Enter": 13,
        "ArrowLeft": 37,
        "ArrowRight": 39,
        "ArrowUp": 38,
        "ArrowDown": 40,
        "F1": 112,
        "F2": 113,
        "F3": 114,
        "F4": 115,
        "F5": 116,
        "F6": 117,
        "F7": 118,
        "F8": 119,
        "F9": 120,
        "F10": 121,
        "F11": 122,
        "F12": 123,
        "PageUp": 33,
        "PageDown": 34,
        "Insert": 155
    }

    // For gng library (Cornelsen-Verlag):
    aktionsempfaengerMap: { [aktionsempfaengerType: string]: GNGAktionsempfaengerData[] } = {};

    timerRunning: boolean = false;
    taktdauer: number = 300;
    remainingTime: number = 0;

    onKeyDownMethod: (key: string) => void;

    constructor(private module:Module){
        for (let type of this.aktionsempfaengerTypes) {
            this.aktionsempfaengerMap[type] = [];
        }

    }

    hasAktionsEmpfaenger(): boolean {

        for(let type of this.aktionsempfaengerTypes){
            if(this.aktionsempfaengerMap[type].length > 0){
                return true;
            }
        }

        return false;

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

        // this.startTimer();

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

        parameters = parameters.slice(0);
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
            { type: intPrimitiveType, value: Math.round(y) },
            { type: intPrimitiveType, value: 1 }
        ]

        let liste = this.aktionsempfaengerMap["geklickt"];
        for (let ae of liste) {
            this.invokeMethod(ae.method, ae.runtimeObject, parameters);

        }

    }


}

