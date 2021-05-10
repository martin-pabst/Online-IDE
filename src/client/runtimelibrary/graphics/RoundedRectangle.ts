import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { doublePrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { FilledShapeHelper } from "./FilledShape.js";
import { WorldHelper } from "./World.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import * as PIXI from "pixi.js";

export class RoundedRectangleClass extends Klass {

    constructor(module: Module) {

        super("RoundedRectangle", module, "Rechteck mit abgerundeten Ecken");

        this.setBaseClass(<Klass>module.typeStore.getType("FilledShape"));

        this.addMethod(new Method("RoundedRectangle", new Parameterlist([
            { identifier: "left", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "top", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "width", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "height", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "radius", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let left: number = parameters[1].value;
                let top: number = parameters[2].value;
                let width: number = parameters[3].value;
                let height: number = parameters[4].value;
                let radius: number = parameters[5].value;

                let rh = new RoundedRectangleHelper(left, top, width, height, radius, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = rh;

            }, false, false, 'Instanziert ein neues, achsenparalleles abgerundetes Rechteck-Objekt. (left, top) sind die Koordinaten der linken oberen Ecke.', true));

        this.addMethod(new Method("getWidth", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: RoundedRectangleHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getWidth")) return;

                return sh.width * sh.displayObject.scale.x;

            }, false, false, "Gibt die Breite zurück.", false));

        this.addMethod(new Method("getHeight", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: RoundedRectangleHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getHeight")) return;

                return sh.height * sh.displayObject.scale.y;

            }, false, false, "Gibt die Höhe zurück.", false));

            this.addMethod(new Method("getRadius", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: RoundedRectangleHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getHeight")) return;

                return sh.radius * sh.displayObject.scale.y;

            }, false, false, "Gibt den Eckradius zurück.", false));

            this.addMethod(new Method("copy", new Parameterlist([
            ]), this,
                (parameters) => {
    
                    let o: RuntimeObject = parameters[0].value;
                    let sh: RoundedRectangleHelper = o.intrinsicData["Actor"];
    
                    if (sh.testdestroyed("copy")) return;
    
                    return sh.getCopy(<Klass>o.class);
    
                }, false, false, 'Erstellt eine Kopie des RoundedRectangle-Objekts und git sie zurück.', false));
    

    }

}

export class RoundedRectangleHelper extends FilledShapeHelper {

    constructor(public left: number, public top: number, public width: number, public height: number, public radius: number,
        interpreter: Interpreter, runtimeObject: RuntimeObject) {
        super(interpreter, runtimeObject);
        this.centerXInitial = left + width / 2;
        this.centerYInitial = top + height / 2;

        this.hitPolygonInitial = [];

        this.addCenterCircle(left + radius, top + radius, Math.PI/2);
        this.addCenterCircle(left + radius, top + height - radius, Math.PI);
        this.addCenterCircle(left + width - radius, top + height - radius, 3*Math.PI/2);
        this.addCenterCircle(left + width - radius, top + radius, 0);
        this.hitPolygonInitial.push({x: left + radius, y: top});

        this.render();
        this.addToDefaultGroup();

    }

    getCopy(klass: Klass): RuntimeObject {

        let ro: RuntimeObject = new RuntimeObject(klass);
        let rh: RoundedRectangleHelper = new RoundedRectangleHelper(this.left, this.top, this.width, this.height, this.radius, this.worldHelper.interpreter, ro);
        ro.intrinsicData["Actor"] = rh;

        rh.copyFrom(this);
        rh.render();

        return ro;
    }


    addCenterCircle(midx: number, midy: number, angleStart: number){
        let n = 8;
        let dw = Math.PI/2/n;

        for(let i = 0; i <= n; i++){
            this.hitPolygonInitial.push({x: midx + this.radius*Math.cos(angleStart + dw*i), y: midy - this.radius*Math.sin(angleStart + dw*i)})
        }
    }

    render(): void {

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

        g.drawRoundedRect(this.left,this.top, this.width, this.height, this.radius);

        if (this.fillColor != null) {
            g.endFill();
        }

        // g.lineStyle(1, 0xff0000, 1);

        // g.moveTo(this.hitPolygonInitial[0].x, this.hitPolygonInitial[0].y);
        // for(let i = 1; i < this.hitPolygonInitial.length; i++){
        //     g.lineTo(this.hitPolygonInitial[i].x, this.hitPolygonInitial[i].y);
        // }
        
    };


}
