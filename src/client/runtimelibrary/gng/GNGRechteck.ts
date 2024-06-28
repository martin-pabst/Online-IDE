import { Module, ModuleStore } from "../../compiler/parser/Module.js";
import { Klass, Visibility } from "../../compiler/types/Class.js";
import { doublePrimitiveType, intPrimitiveType, stringPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Attribute, Method, Parameterlist, Value } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import { RectangleHelper } from "../graphics/Rectangle.js";
import { GNGHelper } from "./GNGConstants.js";
import { ShapeHelper } from "../graphics/Shape.js";

export class GNGRechteckClass extends Klass {

    constructor(module: Module, moduleStore: ModuleStore) {

        super("Rechteck", module, "Rechteck-Klasse der Graphics'n Games-Bibliothek (Cornelsen-Verlag)");

        this.setBaseClass(<Klass>module.typeStore.getType("GNGBaseFigur"));

        this.addAttribute(new Attribute("breite", intPrimitiveType, (value: Value) => { 
            let sh = value.object.intrinsicData["Actor"];
            value.value = sh ? Math.round(Math.abs(sh.width * sh.displayObject.scale.x)) : 0; 
        }, false, Visibility.protected, false, "Breite des Rechtecks"));

        this.addAttribute(new Attribute("höhe", intPrimitiveType, (value: Value) => { 
            let sh = value.object.intrinsicData["Actor"];
            value.value = sh ? Math.round(Math.abs(sh.height * sh.displayObject.scale.x)) : 0; 
        }, false, Visibility.protected, false, "Höhe des Rechtecks"));


        this.setupAttributeIndicesRecursive();


        this.addMethod(new Method("Rechteck", new Parameterlist([]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                o.intrinsicData["isGNG"] = true;

                let rh = new GNGRechteckHelper(10, 10, 100, 100, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = rh;

                o.gngAttributes = {
                    moveAnchor: {x: 10, y: 10},
                    width: 100,
                    height: 100,
                    colorString: "rot"
                }

                rh.setFillColor(0xff0000);

            }, false, false, 'Instanziert ein neues, achsenparalleles Rechteck-Objekt.', true));

        this.addMethod(new Method("GrößeSetzen", new Parameterlist([
            { identifier: "breite", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "höhe", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: GNGRechteckHelper = o.intrinsicData["Actor"];
                let breite: number = parameters[1].value;
                let höhe: number = parameters[2].value;

                if (sh.testdestroyed("GrößeSetzen")) return;

                o.gngAttributes.width = breite;
                o.gngAttributes.height = höhe;
                sh.renderGNG(o);

            }, false, false, "Setzt die Breite und Höhe des Rechtecks.", false));


    }

}


class GNGRechteckHelper extends RectangleHelper implements GNGHelper {
    renderGNG(ro: RuntimeObject): void {
        let att = ro.gngAttributes;
        let rotationCenterX = att.moveAnchor.x + att.width/2;
        let rotationCenterY = att.moveAnchor.y + att.height/2;

        this.left = att.moveAnchor.x;
        this.top = att.moveAnchor.y;
        this.width = att.width;
        this.height = att.height;

        this.render();

        this.displayObject.localTransform.identity();
        this.displayObject.localTransform.translate(-rotationCenterX, -rotationCenterY);
        this.displayObject.localTransform.rotate(-this.angle / 180 * Math.PI);
        this.displayObject.localTransform.translate(rotationCenterX, rotationCenterY);
        //@ts-ignore
        this.displayObject.transform.onChange();
        this.displayObject.updateTransform();
        this.setHitPolygonDirty(true);

    }

}