import { Module, ModuleStore } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { intPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { CircleHelper } from "../graphics/Circle.js";
import { RectangleHelper } from "../graphics/Rectangle.js";

export class GNGKreisClass extends Klass {

    constructor(module: Module, moduleStore: ModuleStore) {

        super("Kreis", module, "Kreis-Klasse der Graphics'n Games-Bibliothek (Cornelsen-Verlag)");

        this.setBaseClass(<Klass>module.typeStore.getType("GNGBaseFigur"));

        // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));

        this.addMethod(new Method("Kreis", new Parameterlist([]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                o.intrinsicData["isGNG"] = true;

                let rh = new CircleHelper(60, 60, 50, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = rh;

            }, false, false, 'Instanziert ein neues Kreis-Objekt.', true));

        this.addMethod(new Method("RadiusSetzen", new Parameterlist([
            { identifier: "radius", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: CircleHelper = o.intrinsicData["Actor"];
                let radius: number = parameters[1].value;

                if (sh.testdestroyed("radiusSetzen")) return;

                sh.setRadius(radius);

            }, false, false, "Setzt den Radius des Kreis-Objekts.", false));


    }

}

