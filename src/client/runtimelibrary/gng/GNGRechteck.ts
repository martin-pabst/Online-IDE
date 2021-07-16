import { Module, ModuleStore } from "../../compiler/parser/Module.js";
import { Klass, Visibility } from "../../compiler/types/Class.js";
import { doublePrimitiveType, intPrimitiveType, stringPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Attribute, Method, Parameterlist, Value } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import { RectangleHelper } from "../graphics/Rectangle.js";

export class GNGRechteckClass extends Klass {

    constructor(module: Module, moduleStore: ModuleStore) {

        super("Rechteck", module, "Rechteck-Klasse der Graphics'n Games-Bibliothek (Cornelsen-Verlag)");

        this.setBaseClass(<Klass>module.typeStore.getType("GNGBaseFigur"));

        this.addAttribute(new Attribute("breite", intPrimitiveType, (value: Value) => { 
            let sh = value.object.intrinsicData["Actor"];
            value.value = Math.round(Math.abs(sh.width * sh.displayObject.scale.x)); 
        }, false, Visibility.private, false, "Breite des Rechtecks"));

        this.addAttribute(new Attribute("höhe", intPrimitiveType, (value: Value) => { 
            let sh = value.object.intrinsicData["Actor"];
            value.value = Math.round(Math.abs(sh.height * sh.displayObject.scale.x)); 
        }, false, Visibility.private, false, "Höhe des Rechtecks"));


        this.setupAttributeIndicesRecursive();


        this.addMethod(new Method("Rechteck", new Parameterlist([]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                o.intrinsicData["isGNG"] = true;

                let rh = new RectangleHelper(10, 10, 100, 100, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = rh;

                o.intrinsicData["Farbe"] = "rot";
                rh.setFillColor(0xff0000);

            }, false, false, 'Instanziert ein neues, achsenparalleles Rechteck-Objekt.', true));

        this.addMethod(new Method("GrößeSetzen", new Parameterlist([
            { identifier: "breite", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "höhe", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: RectangleHelper = o.intrinsicData["Actor"];
                let breite: number = parameters[1].value;
                let höhe: number = parameters[2].value;

                if (sh.testdestroyed("GrößeSetzen")) return;

                sh.height = höhe / sh.displayObject.scale.y;
                sh.width = breite / sh.displayObject.scale.x;

                sh.centerXInitial = sh.left + sh.width/2;
                sh.centerYInitial = sh.top + sh.height/2;

                sh.render();

            }, false, false, "Setzt die Breite und Höhe des Rechtecks.", false));


    }

}

