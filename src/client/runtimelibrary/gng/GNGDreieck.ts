import { Module, ModuleStore } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { intPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { CircleHelper } from "../graphics/Circle.js";
import { PolygonHelper } from "../graphics/Polygon.js";
import { RectangleHelper } from "../graphics/Rectangle.js";

export class GNGDreieckClass extends Klass {

    constructor(module: Module, moduleStore: ModuleStore) {

        super("Dreieck", module, "Dreieck-Klasse der Graphics'n Games-Bibliothek (Cornelsen-Verlag)");

        this.setBaseClass(<Klass>module.typeStore.getType("GNGBaseFigur"));

        // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Dreieckzahl Pi (3.1415...)"));

        this.addMethod(new Method("Dreieck", new Parameterlist([]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                o.intrinsicData["isGNG"] = true;


                let rh = new PolygonHelper([60, 10, 110,110, 10, 110],true, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = rh;

            }, false, false, 'Instanziert ein neues Dreieck-Objekt.', true));

    }

}

