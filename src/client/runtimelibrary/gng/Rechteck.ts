import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { doublePrimitiveType, intPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import { RectangleHelper } from "../graphics/Rectangle.js";

export class GNGRechteckClass extends Klass {

    constructor(module: Module) {

        super("Rechteck", module, "Rechteck-Klasse der Graphics'n Games-Bibliothek (Cornelsen-Verlag)");

        // this.setBaseClass(<Klass>module.typeStore.getType("FilledShape"));

        // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));

        this.addMethod(new Method("Rechteck", new Parameterlist([]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let rh = new RectangleHelper(10, 10, 100, 100, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = rh;

            }, false, false, 'Instanziert ein neues, achsenparalleles Rechteck-Objekt.', true));

        this.addMethod(new Method("positionSetzen", new Parameterlist([
            { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: RectangleHelper = o.intrinsicData["Actor"];
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;

                if (sh.testdestroyed("positionSetzen")) return;

                sh.move(x - sh.getCenterX() + sh.width/2, y - sh.getCenterY() + sh.height/2);

            }, false, false, "Verschiebt das Rechteck so, dass seine linke obere Ecke bei (x,y) zu liegen kommt.", false));


        this.addMethod(new Method("verschieben", new Parameterlist([
            { identifier: "deltaX", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "deltaY", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: RectangleHelper = o.intrinsicData["Actor"];
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;

                if (sh.testdestroyed("verschieben")) return;

                sh.move(x, y);

            }, false, false, "Verschiebt das Rechteck um (x, y)", false));

        this.addMethod(new Method("drehen", new Parameterlist([
            { identifier: "grad", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: RectangleHelper = o.intrinsicData["Actor"];
                let grad: number = parameters[1].value;

                if (sh.testdestroyed("drehen")) return;

                sh.rotate(grad);

            }, false, false, "Dreht das Rechteck um den angegebenen Winkel. Drehpunkt ist der Diagonalenschnittpunkt des Rechtecks.", false));

        this.addMethod(new Method("größeSetzen", new Parameterlist([
            { identifier: "breite", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "höhe", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: RectangleHelper = o.intrinsicData["Actor"];
                let breite: number = parameters[1].value;
                let höhe: number = parameters[2].value;

                if (sh.testdestroyed("größeSetzen")) return;

                sh.height = höhe / sh.displayObject.scale.y;
                sh.width = breite / sh.displayObject.scale.x;
                sh.render();

            }, false, false, "Setzt die Breite und Höhe des Rechtecks.", false));


    }

}

