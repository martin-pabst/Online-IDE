import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { booleanPrimitiveType, doublePrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { FilledShapeHelper } from "./FilledShape.js";
import { WorldHelper } from "./World.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import { ShapeHelper } from "./Shape.js";
import * as PIXI from 'pixi.js';

export class SectorClass extends Klass {

    constructor(module: Module) {

        super("Sector", module, "Kreisbogen/Kreissektor");

        this.setBaseClass(<Klass>module.typeStore.getType("FilledShape"));

        this.addMethod(new Method("Sector", new Parameterlist([
            { identifier: "mx", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "my", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "r", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "startAngle", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "endAngle", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let mx: number = parameters[1].value;
                let my: number = parameters[2].value;
                let r: number = parameters[3].value;
                let startAngle: number = parameters[4].value;
                let endAngle: number = parameters[5].value;

                let rh = new SectorHelper(mx, my, r, startAngle/180*Math.PI, endAngle/180*Math.PI, true, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = rh;

            }, false, false, 'Instanziert einen neuen Kreisbogen bzw. (falls die Füllfarbe nicht null ist) Kreissektor. (mx, my) ist der Mittelpunt, r sein Radius. Der Kreisbogen wird von startAngle bis endAngle (beides in Grad) gegen den Uhrzeigersinn gezogen.', true));

            this.addMethod(new Method("drawRadii", new Parameterlist([
                { identifier: "radiiZeichnen", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            ]), null,
                (parameters) => {
    
                    let o: RuntimeObject = parameters[0].value;
                    let r: boolean = parameters[1].value;
                    let sh: SectorHelper = o.intrinsicData["Actor"];
    
                    if (sh.testdestroyed("drawRadii")) return;
    
                    sh.drawRadii = r;
                    sh.render();
    
                }, false, false, 'Legt fest, ob beim Zeichnen des Umrisses auch die beiden Radii ( = Strecken vom Mittelpunkt zur Kreislinie) mitgezeichnet werden sollen.', false));
    

        this.addMethod(new Method("setRadius", new Parameterlist([
            { identifier: "radius", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let r: number = parameters[1].value;
                let sh: SectorHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setRadius")) return;

                sh.setRadius(r);

            }, false, false, 'Setzt den Radius des Kreisbogens/Kreissektors."', false));

        this.addMethod(new Method("setStartAngle", new Parameterlist([
            { identifier: "startWinkelInGrad", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let angle: number = parameters[1].value;
                let sh: SectorHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setStartAngle")) return;

                if(angle < 0){
                    angle += Math.ceil(-angle/360) * 360;
                }

                if(angle > 360){
                    angle -= Math.trunc(angle/360) * 360;
                }

                sh.startAngleRad = angle/180*Math.PI;
                sh.render();

            }, false, false, 'Setzt den Startwinkel des Kreisbogens/Kreissektors."', false));

            this.addMethod(new Method("setEndAngle", new Parameterlist([
            { identifier: "endWinkelInGrad", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let angle: number = parameters[1].value;
                let sh: SectorHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setEndAngle")) return;

                if(angle < 0){
                    angle += Math.ceil(-angle/360) * 360;
                }

                if(angle > 360){
                    angle -= Math.trunc(angle/360) * 360;
                }

                sh.endAngleRad = angle/180*Math.PI;
                sh.render();

            }, false, false, 'Setzt den Endwinkel des Kreisbogens/Kreissektors."', false));

        this.addMethod(new Method("getRadius", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: SectorHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getRadius")) return;

                return sh.r * sh.displayObject.scale.x;

            }, false, false, "Gibt den Radius zurück.", false));

        this.addMethod(new Method("getStartAngle", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: SectorHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getStartAngle")) return;

                return sh.startAngleRad/Math.PI*180;

            }, false, false, "Gibt den Startwinkel in Grad zurück.", false));

        this.addMethod(new Method("getEndAngle", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: SectorHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getEndAngle")) return;

                return sh.endAngleRad/Math.PI*180;

            }, false, false, "Gibt den Endwinkel in Grad zurück.", false));

        this.addMethod(new Method("copy", new Parameterlist([
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: SectorHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("copy")) return;

                return sh.getCopy(<Klass>o.class);

            }, false, false, 'Erstellt eine Kopie des Sector-Objekts und git sie zurück.', false));


    }

}

export class SectorHelper extends FilledShapeHelper {

    constructor(public mx: number, public my: number, public r: number,
        public startAngleRad: number, public endAngleRad: number,
        public drawRadii: boolean,
        interpreter: Interpreter, runtimeObject: RuntimeObject) {
        super(interpreter, runtimeObject);
        this.centerXInitial = mx;
        this.centerYInitial = my;

        this.render();
        this.addToDefaultGroupAndSetDefaultVisibility();

    }

    getCopy(klass: Klass): RuntimeObject {

        let ro: RuntimeObject = new RuntimeObject(klass);
        let rh: SectorHelper = new SectorHelper(this.mx, this.my, this.r, this.startAngleRad, this.endAngleRad, this.drawRadii, this.worldHelper.interpreter, ro);
        ro.intrinsicData["Actor"] = rh;

        rh.copyFrom(this);
        rh.render();

        return ro;
    }


    render(): void {

        this.hitPolygonInitial = [];

        let deltaAlpha = this.endAngleRad - this.startAngleRad;
        this.hitPolygonInitial.push({x: this.mx, y: this.my});

        for (let i = 0; i < 16; i++) {
            let alpha = this.startAngleRad + deltaAlpha * i;
            this.hitPolygonInitial.push({
                x: this.mx + this.r * Math.cos(alpha),
                y: this.my + this.r * Math.sin(alpha)
            });
        }
        this.hitPolygonInitial.push({x: this.mx, y: this.my});

        this.hitPolygonDirty = true;

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

        if(Math.abs(this.startAngleRad - this.endAngleRad) < 0.00000001){
            g.drawCircle(this.mx, this.my, this.r);
        } else {
            if(this.drawRadii){
                g.moveTo(this.mx, this.my);
            }
            g.arc(this.mx, this.my, this.r, -this.startAngleRad, -this.endAngleRad, true);
            if(this.drawRadii){
                g.lineTo(this.mx, this.my);
            }
        }
        if(this.drawRadii){
            g.closePath();
        }


        if (this.fillColor != null) {
            g.endFill();
        }

    };

    setRadius(r: number) {
        this.r = r;
        this.render();
    }

    isOutsideView() {

        return super.isOutsideView();

    }

    containsPoint(x: number, y: number) {

        if (!this.displayObject.getBounds().contains(x, y)) return false;

        let p: PIXI.Point = new PIXI.Point(x, y);
        let m = this.displayObject.transform.worldTransform;

        m.applyInverse(p, p);

        let dx = p.x - this.mx;
        let dy = p.y - this.my;
        let angle = Math.atan2(-dy, dx);

        if (dx * dx + dy * dy <= this.r * this.r) {
            let towPI = 2*Math.PI;
            let normalizedStartAngle = this.startAngleRad < 0 ? towPI + this.startAngleRad : this.startAngleRad;
            let normalizedEndAngle = this.endAngleRad < 0 ? towPI + this.endAngleRad : this.endAngleRad;
            let normalizedAngle = angle < 0 ? towPI + angle : angle;
            let ret = (normalizedAngle >= normalizedStartAngle && normalizedStartAngle <= normalizedEndAngle);
            if(normalizedStartAngle <= normalizedEndAngle){
                return ret;
            } else {
                return !ret;
            }  
        } else {
            return false;
        }

    }




}
