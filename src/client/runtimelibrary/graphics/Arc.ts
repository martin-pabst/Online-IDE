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

export class ArcClass extends Klass {

    constructor(module: Module) {

        super("Arc", module, "Kreisbogenumriss (wahlweise gefüllt)");

        this.setBaseClass(<Klass>module.typeStore.getType("FilledShape"));

        this.addMethod(new Method("Arc", new Parameterlist([
            { identifier: "mx", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "my", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "innerRadius", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "outerRadius", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "startAngle", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "endAngle", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let mx: number = parameters[1].value;
                let my: number = parameters[2].value;
                let ri: number = parameters[3].value;
                let ra: number = parameters[4].value;
                let startAngle: number = parameters[5].value;
                let endAngle: number = parameters[6].value;

                let rh = new ArcHelper(mx, my, ri, ra, startAngle / 180 * Math.PI, endAngle / 180 * Math.PI, true, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = rh;

            }, false, false, 'Instanziert einen neuen Kreisbogen. (mx, my) ist der Mittelpunt, ri sein Innenradius, ra sein Außenradius. Der Kreisbogen wird von startAngle bis endAngle (beides in Grad) gegen den Uhrzeigersinn gezogen.', true));

        this.addMethod(new Method("setInnerRadius", new Parameterlist([
            { identifier: "innerRadius", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let r: number = parameters[1].value;
                let sh: ArcHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setRadius")) return;
                sh.ri = r;
                sh.render();

            }, false, false, 'Setzt den inneren Radius des Kreisbogens"', false));

        this.addMethod(new Method("setOuterRadius", new Parameterlist([
            { identifier: "outerRadius", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let r: number = parameters[1].value;
                let sh: ArcHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setRadius")) return;
                sh.ra = r;
                sh.render();

            }, false, false, 'Setzt den äußeren Radius des Kreisbogens"', false));

        this.addMethod(new Method("setStartAngle", new Parameterlist([
            { identifier: "startWinkelInGrad", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let angle: number = parameters[1].value;
                let sh: ArcHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setStartAngle")) return;

                if (angle < 0) {
                    angle += Math.ceil(-angle / 360) * 360;
                }

                if (angle > 360) {
                    angle -= Math.trunc(angle / 360) * 360;
                }

                sh.startAngleRad = angle / 180 * Math.PI;
                sh.render();

            }, false, false, 'Setzt den Startwinkel des Kreisbogens/Kreissektors."', false));

        this.addMethod(new Method("setEndAngle", new Parameterlist([
            { identifier: "endWinkelInGrad", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let angle: number = parameters[1].value;
                let sh: ArcHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setEndAngle")) return;

                if (angle < 0) {
                    angle += Math.ceil(-angle / 360) * 360;
                }

                if (angle > 360) {
                    angle -= Math.trunc(angle / 360) * 360;
                }

                sh.endAngleRad = angle / 180 * Math.PI;
                sh.render();

            }, false, false, 'Setzt den Endwinkel des Kreisbogens/Kreissektors."', false));

        this.addMethod(new Method("getInnerRadius", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ArcHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getRadius")) return;

                return sh.ri * sh.displayObject.scale.x;

            }, false, false, "Gibt den inneren Radius zurück.", false));

        this.addMethod(new Method("getOuterRadius", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ArcHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getOuterRadius")) return;

                return sh.ra * sh.displayObject.scale.x;

            }, false, false, "Gibt den äußeren Radius zurück.", false));

        this.addMethod(new Method("getStartAngle", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ArcHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getStartAngle")) return;

                return sh.startAngleRad / Math.PI * 180;

            }, false, false, "Gibt den Startwinkel in Grad zurück.", false));

        this.addMethod(new Method("getEndAngle", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ArcHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getEndAngle")) return;

                return sh.endAngleRad / Math.PI * 180;

            }, false, false, "Gibt den Endwinkel in Grad zurück.", false));

        this.addMethod(new Method("copy", new Parameterlist([
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: ArcHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("copy")) return;

                return sh.getCopy(<Klass>o.class);

            }, false, false, 'Erstellt eine Kopie des Arc-Objekts und git sie zurück.', false));


    }

}

export class ArcHelper extends FilledShapeHelper {

    constructor(public mx: number, public my: number, public ri: number,
        public ra: number,
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
        let rh: ArcHelper = new ArcHelper(this.mx, this.my, this.ri, this.ra, this.startAngleRad, this.endAngleRad, this.drawRadii, this.worldHelper.interpreter, ro);
        ro.intrinsicData["Actor"] = rh;

        rh.copyFrom(this);
        rh.render();

        return ro;
    }


    render(): void {

        this.hitPolygonInitial = [];

        let deltaAlpha = this.endAngleRad - this.startAngleRad;

        for (let i = 0; i < 16; i++) {
            let alpha = this.startAngleRad + deltaAlpha * i;
            this.hitPolygonInitial.push({
                x: this.mx + this.ra * Math.cos(alpha),
                y: this.my + this.ra * Math.sin(alpha)
            });
        }

        for (let i = 0; i < 16; i++) {
            let alpha = this.endAngleRad - deltaAlpha * i;
            this.hitPolygonInitial.push({
                x: this.mx + this.ri * Math.cos(alpha),
                y: this.my + this.ri * Math.sin(alpha)
            });
        }

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


        if (this.startAngleRad === void 0) { this.startAngleRad = 0; }
        if (this.endAngleRad === void 0) { this.endAngleRad = Math.PI * 2; }
        if (Math.abs(this.endAngleRad - this.startAngleRad) >= Math.PI * 2) {
            g.drawCircle(this.mx, this.my, this.ra)
                .beginHole()
                .drawCircle(this.mx, this.my, this.ri)
                .endHole();
        } else {
            g.moveTo(this.mx + this.ra * Math.cos(this.startAngleRad), this.my - this.ra * Math.sin(this.startAngleRad));
            g.lineTo(this.mx + this.ri * Math.cos(this.startAngleRad), this.my - this.ri * Math.sin(this.startAngleRad));
            g.arc(this.mx, this.my, this.ri, -this.startAngleRad, -this.endAngleRad, true)
                .arc(this.mx, this.my, this.ra, -this.endAngleRad, -this.startAngleRad, false)
        }

        g.closePath();


        if (this.fillColor != null) {
            g.endFill();
        }

    };

    

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

        let r2 = dx * dx + dy * dy;

        if ( r2 <= this.ra * this.ra && r2 >= this.ri * this.ri) {
            let towPI = 2 * Math.PI;
            let normalizedStartAngle = this.startAngleRad < 0 ? towPI + this.startAngleRad : this.startAngleRad;
            let normalizedEndAngle = this.endAngleRad < 0 ? towPI + this.endAngleRad : this.endAngleRad;
            let normalizedAngle = angle < 0 ? towPI + angle : angle;
            let ret = (normalizedAngle >= normalizedStartAngle && normalizedStartAngle <= normalizedEndAngle);
            if (normalizedStartAngle <= normalizedEndAngle) {
                return ret;
            } else {
                return !ret;
            }
        } else {
            return false;
        }

    }




}
