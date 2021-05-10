import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { doublePrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { FilledShapeHelper } from "./FilledShape.js";
import { WorldHelper } from "./World.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import * as PIXI from "pixi.js";

export class RectangleClass extends Klass {

    constructor(module: Module) {

        super("Rectangle", module, "Rechteck");

        this.setBaseClass(<Klass>module.typeStore.getType("FilledShape"));

        // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));

        this.addMethod(new Method("Rectangle", new Parameterlist([
            { identifier: "left", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "top", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "width", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "height", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let left: number = parameters[1].value;
                let top: number = parameters[2].value;
                let width: number = parameters[3].value;
                let height: number = parameters[4].value;
                
                let rh = new RectangleHelper(left, top, width, height, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = rh;
                
            }, false, false, 'Instanziert ein neues, achsenparalleles Rechteck-Objekt. (left, top) sind die Koordinaten der linken oberen Ecke.', true));
            
            this.addMethod(new Method("setWidth", new Parameterlist([
                { identifier: "width", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
            ]), null,
            (parameters) => {
                
                let o: RuntimeObject = parameters[0].value;
                let sh: RectangleHelper = o.intrinsicData["Actor"];
                let width: number = parameters[1].value;
                
                if (sh.testdestroyed("setWidth")) return;

                sh.width = width / sh.displayObject.scale.x;
                sh.render();

            }, false, false, "Setzt die Breite des Rechtecks.", false));

            this.addMethod(new Method("setHeight", new Parameterlist([
                { identifier: "height", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
            ]), null,
            (parameters) => {
                
                let o: RuntimeObject = parameters[0].value;
                let sh: RectangleHelper = o.intrinsicData["Actor"];
                let height: number = parameters[1].value;
                
                if (sh.testdestroyed("setHeight")) return;

                sh.height = height / sh.displayObject.scale.y;
                sh.render();

            }, false, false, "Setzt die Höhe des Rechtecks.", false));

        this.addMethod(new Method("getWidth", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: RectangleHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getWidth")) return;

                return sh.width * sh.scaleFactor;

            }, false, false, "Gibt die Breite zurück.", false));

        this.addMethod(new Method("getHeight", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: RectangleHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getHeight")) return;

                return sh.height * sh.scaleFactor;

            }, false, false, "Gibt die Höhe zurück.", false));

            this.addMethod(new Method("copy", new Parameterlist([
            ]), this,
                (parameters) => {
    
                    let o: RuntimeObject = parameters[0].value;
                    let sh: RectangleHelper = o.intrinsicData["Actor"];
    
                    if (sh.testdestroyed("copy")) return;
    
                    return sh.getCopy(<Klass>o.class);
    
                }, false, false, 'Erstellt eine Kopie des Rectangle-Objekts und git sie zurück.', false));
    

    }

}

export class RectangleHelper extends FilledShapeHelper {

    constructor(public left: number, public top: number, public width: number, public height: number,
        interpreter: Interpreter, runtimeObject: RuntimeObject) {
        super(interpreter, runtimeObject);
        this.centerXInitial = left + width / 2;
        this.centerYInitial = top + height / 2;

        this.render();

        this.addToDefaultGroup();

    }

    getCopy(klass: Klass): RuntimeObject {

        let ro: RuntimeObject = new RuntimeObject(klass);
        let rh: RectangleHelper = new RectangleHelper(this.left, this.top, this.width, this.height, this.worldHelper.interpreter, ro);
        ro.intrinsicData["Actor"] = rh;

        rh.copyFrom(this);
        rh.render();

        return ro;
    }

    render(): void {

        this.hitPolygonInitial = [
            { x: this.left, y: this.top }, { x: this.left, y: this.top + this.height },
             { x: this.left + this.width, y: this.top + this.height }, { x: this.left + this.width, y: this.top }
        ];

        let g: PIXI.Graphics = <any>this.displayObject;

        if (this.displayObject == null) {
            g = new PIXI.Graphics();
            this.displayObject = g;
            this.worldHelper.stage.addChild(g);

        } else {
            g.clear();
        }

        if (this.fillColor != null) {
            g.beginFill(this.fillColor, this.fillAlpha);
        }
        if (this.borderColor != null) {
            g.lineStyle(this.borderWidth, this.borderColor, this.borderAlpha, 0.5)
        }

        g.moveTo(this.left, this.top);
        g.lineTo(this.left + this.width, this.top);
        g.lineTo(this.left + this.width, this.top + this.height);
        g.lineTo(this.left, this.top + this.height);
        g.closePath();

        if (this.fillColor != null) {
            g.endFill();
        }
    };


}
