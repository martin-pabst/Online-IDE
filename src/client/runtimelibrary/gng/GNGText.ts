import { Module, ModuleStore } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { doublePrimitiveType, intPrimitiveType, stringPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import { RectangleHelper } from "../graphics/Rectangle.js";
import { TextHelper } from "../graphics/Text.js";

export class GNGTextClass extends Klass {

    constructor(module: Module, moduleStore: ModuleStore) {

        super("GText", module, "Text-Klasse der Graphics'n Games-Bibliothek (Cornelsen-Verlag)");

        this.setBaseClass(<Klass>module.typeStore.getType("GNGBaseFigur"));

        // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));

        this.addMethod(new Method("Text", new Parameterlist([]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                o.intrinsicData["isGNG"] = true;

                let rh = new TextHelper(10, 10, 12, "Text", module.main.getInterpreter(), o);
                rh.setFillColor(0);
                o.intrinsicData["Actor"] = rh;

            }, false, false, 'Instanziert ein neues Text-Objekt.', true));

        this.addMethod(new Method("TextSetzen", new Parameterlist([
            { identifier: "text", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TextHelper = o.intrinsicData["Actor"];
                let text: string = parameters[1].value;

                if (sh.testdestroyed("TextSetzen")) return;

                sh.setText(text);

            }, false, false, "Ändert den Text des Text-Objekts.", false));

        this.addMethod(new Method("TextGrößeSetzen", new Parameterlist([
            { identifier: "textGröße", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TextHelper = o.intrinsicData["Actor"];
                let größe: number = parameters[1].value;

                if (sh.testdestroyed("TextGrößeSetzen")) return;

                sh.setFontsize(größe);

            }, false, false, "Setzt die Schriftgröße des Text-Objekts.", false));

        this.addMethod(new Method("TextVergrößern", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TextHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("TextVergrößern")) return;

                let size = sh.fontsize;
                if (size <= 10) {
                    size += 1;
                }
                else if (size <= 40) {
                    size += 2;
                }
                else {
                    size += 4;
                }

                sh.setFontsize(size);

            }, false, false, "Vergrößert die Schriftgröße des Text-Objekts.", false));

        this.addMethod(new Method("TextVerkleinern", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TextHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("TextVerkleinern")) return;

                let size = sh.fontsize;
                if (size <= 10) {
                    size -= 1;
                }
                else if (size <= 40) {
                    size -= 2;
                }
                else {
                    size -= 4;
                }
                if (size < 1) {
                    size = 1;
                }


                sh.setFontsize(size);

            }, false, false, "Verkleinert die Schriftgröße des Text-Objekts.", false));



    }

}

