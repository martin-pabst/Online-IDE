import { Module, ModuleStore } from "../../compiler/parser/Module.js";
import { Klass, Visibility } from "../../compiler/types/Class.js";
import { Attribute, Method, Parameterlist, Value } from "../../compiler/types/Types.js";
import { doublePrimitiveType, floatPrimitiveType, intPrimitiveType, voidPrimitiveType, stringPrimitiveType, booleanPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { ActorHelper } from "../graphics/Actor.js";
import { InterpreterState, Interpreter } from "../../interpreter/Interpreter.js";
import { ShapeHelper } from "../graphics/Shape.js";
import { WorldHelper } from "../graphics/World.js";
import { GNGSymbolArtClass } from "./GNGSymbolArt.js";

export class GNGZeichenfensterClass extends Klass {

    constructor(public module: Module, moduleStore: ModuleStore) {

        super("Zeichenfenster", module, "Grafische Zeichenfläche mit Koordinatensystem")

        this.setBaseClass(<Klass>moduleStore.getType("Object").type);

        // let groupType = <GroupClass>module.typeStore.getType("Group");
        let aktionsempfaengerType = <GNGZeichenfensterClass>module.typeStore.getType("Aktionsempfaenger");
        let symbolArtType = <GNGSymbolArtClass>module.typeStore.getType("SymbolArt");

        // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));


        this.addMethod(new Method("MalflächenBreiteGeben", new Parameterlist([]), intPrimitiveType,
            (parameters) => {

                return Math.round(this.getWorldHelper().width);

            }, false, true, 'Gibt die Breite des Zeichenbereichs in Pixeln zurück.', false));

        this.addMethod(new Method("MalflächenHöheGeben", new Parameterlist([]), intPrimitiveType,
            (parameters) => {

                return Math.round(this.getWorldHelper().width);

            }, false, true, 'Gibt die Höhe des Zeichenbereichs in Pixeln zurück.', false));

        this.addMethod(new Method("AktionsEmpfängerEintragen", new Parameterlist([
            { identifier: "neu", type: aktionsempfaengerType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let wh = this.getWorldHelper();
                let aktionsempfaenger: RuntimeObject = parameters[1].value;
                let klass = <Klass>aktionsempfaenger.class;

                let methodList = ["Ausführen()", "Taste(char)", "SonderTaste(int)", "Geklickt(int, int, int)"];

                for (let ms of methodList) {
                    let method: Method = klass.getMethodBySignature(ms);

                    if (method?.program != null || method?.invoke != null) {
                        wh.aktionsempfaengerList.push({
                            //@ts-ignore
                            methodIdentifier: ms,
                            method: method,
                            runtimeObject: aktionsempfaenger
                        });
                    }
                }

            }, false, true, 'Trägt einen neuen Aktionsempfänger ein.', false));

        this.addMethod(new Method("AktionsEmpfängerEntfernen", new Parameterlist([
            { identifier: "alt", type: aktionsempfaengerType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let wh = this.getWorldHelper();
                let aktionsempfaenger: RuntimeObject = parameters[1].value;

                wh.aktionsempfaengerList = wh.aktionsempfaengerList.filter(ae => ae.runtimeObject != aktionsempfaenger);

            }, false, true, 'Löscht einen Aktionsempfänger aus der Liste.', false));

        this.addMethod(new Method("TaktgeberStarten", new Parameterlist([]), voidPrimitiveType,
            (parameters) => {

                this.getWorldHelper().gngTaktgeberEnabled = true;

            }, false, true, 'Startet den Taktgeber', false));

        this.addMethod(new Method("TaktgeberStoppen", new Parameterlist([]), voidPrimitiveType,
            (parameters) => {

                this.getWorldHelper().gngTaktgeberEnabled = false;

            }, false, true, 'Stoppt den Taktgeber', false));

        this.addMethod(new Method("TaktdauerSetzen", new Parameterlist([
            { identifier: "dauer", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let wh = this.getWorldHelper();
                let dauer: number = parameters[1].value;
                wh.gngTaktdauer = dauer;

            }, false, true, 'Setzt die Taktdauer des Zeitgebers in Millisekunden', false));


    }

    getWorldHelper(breite: number = 800, höhe: number = 600): WorldHelper {

        let wh = this.module?.main?.getInterpreter()?.worldHelper;

        if (wh != null) {

            if (wh.width != breite || wh.height != höhe) {

                let ratio: number = Math.round(höhe / breite * 100);
                wh.$containerOuter.css('padding-bottom', ratio + "%");

                wh.stage.localTransform.scale(wh.width / breite, wh.height / höhe);
                wh.width = breite;
                wh.height = höhe;
                // this.stage.localTransform.rotate(45/180*Math.PI);
                // this.stage.localTransform.translate(400,300);
                wh.stage.transform.onChange();

                this.module.main.getRightDiv()?.adjustWidthToWorld();

            }

            return wh;

        } else {
            let worldObject: RuntimeObject = new RuntimeObject(<Klass>this.module.typeStore.getType("World"));
            let wh = new WorldHelper(breite, höhe, this.module, worldObject);
            worldObject.intrinsicData["World"] = wh;
        }

    }


}

