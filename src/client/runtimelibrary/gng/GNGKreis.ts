import { Module, ModuleStore } from "../../compiler/parser/Module.js";
import { Klass, Visibility } from "../../compiler/types/Class.js";
import { intPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Attribute, Method, Parameterlist, Value } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { CircleHelper } from "../graphics/Circle.js";
import { RectangleHelper } from "../graphics/Rectangle.js";
import { ShapeHelper } from "../graphics/Shape.js";
import { GNGHelper } from "./GNGConstants.js";

export class GNGKreisClass extends Klass {

    constructor(module: Module, moduleStore: ModuleStore) {

        super("Kreis", module, "Kreis-Klasse der Graphics'n Games-Bibliothek (Cornelsen-Verlag)");

        this.setBaseClass(<Klass>module.typeStore.getType("GNGBaseFigur"));

        this.addAttribute(new Attribute("radius", intPrimitiveType, (value: Value) => { 
            let sh = value.object.intrinsicData["Actor"];
            value.value = Math.round(sh.r * sh.displayObject.scale.x); 
        }, false, Visibility.protected, false, "Radius des Kreises"));

        this.setupAttributeIndicesRecursive();  

        this.addMethod(new Method("Kreis", new Parameterlist([]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                o.intrinsicData["isGNG"] = true;

                let rh = new GNGKreisHelper(60, 60, 50, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = rh;

                
                o.gngAttributes = {
                    moveAnchor: {x: 60, y: 10},
                    width: 100,
                    height: 100,
                    colorString: "rot"
                }

                rh.centerXInitial = 60;
                rh.centerYInitial = 60;

                rh.setFillColor(0xff0000);

            }, false, false, 'Instanziert ein neues Kreis-Objekt.', true));

        this.addMethod(new Method("RadiusSetzen", new Parameterlist([
            { identifier: "radius", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: GNGKreisHelper = o.intrinsicData["Actor"];
                let radius: number = parameters[1].value;

                o.gngAttributes.width = 2*radius;
                o.gngAttributes.height = 2*radius;

                sh.renderGNG(o);

            }, false, false, "Setzt den Radius des Kreis-Objekts.", false));


    }

}

class GNGKreisHelper extends CircleHelper implements GNGHelper {
    renderGNG(ro: RuntimeObject): void {
        let att = ro.gngAttributes;

        this.mx = att.moveAnchor.x;
        this.my = att.moveAnchor.y;

        this.r = att.width/2;

        this.render();

    }

}