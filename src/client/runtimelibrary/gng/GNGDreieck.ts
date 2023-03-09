import { Module, ModuleStore } from "../../compiler/parser/Module.js";
import { Klass, Visibility } from "../../compiler/types/Class.js";
import { intPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Attribute, Method, Parameterlist, Value } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { CircleHelper } from "../graphics/Circle.js";
import { PolygonHelper } from "../graphics/Polygon.js";
import { RectangleHelper } from "../graphics/Rectangle.js";
import { ShapeHelper } from "../graphics/Shape.js";
import { GNGHelper } from "./GNGConstants.js";

export class GNGDreieckClass extends Klass {

    constructor(module: Module, moduleStore: ModuleStore) {

        super("Dreieck", module, "Dreieck-Klasse der Graphics'n Games-Bibliothek (Cornelsen-Verlag)");

        this.setBaseClass(<Klass>module.typeStore.getType("GNGBaseFigur"));

        this.addAttribute(new Attribute("breite", intPrimitiveType, (value: Value) => { 
            value.value = Math.round(value.object.gngAttributes.width); 
        }, false, Visibility.protected, false, "Breite des Dreiecks"));

        this.addAttribute(new Attribute("höhe", intPrimitiveType, (value: Value) => { 
            value.value = Math.round(value.object.gngAttributes.height); 
        }, false, Visibility.protected, false, "Höhe des Dreiecks"));

        this.setupAttributeIndicesRecursive();

        this.addMethod(new Method("Dreieck", new Parameterlist([]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                o.intrinsicData["isGNG"] = true;


                let rh = new GNGDreieckHelper([60, 10, 110,110, 10, 110],true, module.main.getInterpreter(), o);
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


            }, false, false, 'Instanziert ein neues Dreieck-Objekt.', true));

            this.addMethod(new Method("GrößeSetzen", new Parameterlist([
                { identifier: "breite", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
                { identifier: "höhe", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
            ]), null,
                (parameters) => {
    
                    let o: RuntimeObject = parameters[0].value;
                    let sh: GNGDreieckHelper = o.intrinsicData["Actor"];
                    let breite: number = parameters[1].value;
                    let höhe: number = parameters[2].value;

                    if (sh.testdestroyed("GrößeSetzen")) return;

                    o.gngAttributes.width = breite;
                    o.gngAttributes.height = höhe;

                    sh.renderGNG(o);

                    
                }, false, false, "Setzt die Breite und Höhe des Dreiecks.", false));
    



    }

}

class GNGDreieckHelper extends PolygonHelper implements GNGHelper {
    renderGNG(ro: RuntimeObject): void {
        let att = ro.gngAttributes;
        let max = att.moveAnchor.x;
        let may = att.moveAnchor.y;

        let rotationCenterX = max;
        let rotationCenterY = may + att.height/2;

        this.hitPolygonInitial = [{x: max, y: may}, {x: max + att.width/2, y: may + att.height}, {x: max - att.width/2, y: may + att.height}];

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