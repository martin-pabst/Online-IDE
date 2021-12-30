import { Module, ModuleStore } from "../../compiler/parser/Module.js";
import { Klass, Visibility } from "../../compiler/types/Class.js";
import { intPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Attribute, Method, Parameterlist, Value } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { CircleHelper } from "../graphics/Circle.js";
import { PolygonHelper } from "../graphics/Polygon.js";
import { RectangleHelper } from "../graphics/Rectangle.js";

export class GNGDreieckClass extends Klass {

    constructor(module: Module, moduleStore: ModuleStore) {

        super("Dreieck", module, "Dreieck-Klasse der Graphics'n Games-Bibliothek (Cornelsen-Verlag)");

        this.setBaseClass(<Klass>module.typeStore.getType("GNGBaseFigur"));

        this.addAttribute(new Attribute("breite", intPrimitiveType, (value: Value) => { 
            let breite = value.object.intrinsicData["Breite"];
            value.value = Math.round(breite); 
        }, false, Visibility.private, false, "Breite des Dreiecks"));

        this.addAttribute(new Attribute("höhe", intPrimitiveType, (value: Value) => { 
            let höhe = value.object.intrinsicData["Höhe"];
            value.value = Math.round(höhe); 
        }, false, Visibility.private, false, "Höhe des Dreiecks"));

        this.setupAttributeIndicesRecursive();

        this.addMethod(new Method("Dreieck", new Parameterlist([]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                o.intrinsicData["isGNG"] = true;


                let rh = new PolygonHelper([60, 10, 110,110, 10, 110],true, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = rh;

                o.intrinsicData["moveAnchor"] = {x: 60, y: 10};

                o.intrinsicData["Breite"] = 100;
                o.intrinsicData["Höhe"] = 100;

                o.intrinsicData["Farbe"] = "rot";
                rh.setFillColor(0xff0000);


            }, false, false, 'Instanziert ein neues Dreieck-Objekt.', true));

            this.addMethod(new Method("GrößeSetzen", new Parameterlist([
                { identifier: "breite", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
                { identifier: "höhe", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
            ]), null,
                (parameters) => {
    
                    let o: RuntimeObject = parameters[0].value;
                    let sh: PolygonHelper = o.intrinsicData["Actor"];
                    let breite: number = parameters[1].value;
                    let höhe: number = parameters[2].value;

                    o.intrinsicData["Breite"] = breite;
                    o.intrinsicData["Höhe"] = höhe;    

                    breite /= sh.scaleFactor;
                    höhe /= sh.scaleFactor;

                    if (sh.testdestroyed("GrößeSetzen")) return;
    
                    sh.setAllPointsUntransformed([60, 60 - höhe/2, 60 - breite/2, 60 + höhe/2, 60 + breite/2, 60 + höhe/2 ]);
    
                }, false, false, "Setzt die Breite und Höhe des Dreiecks.", false));
    



    }

}

