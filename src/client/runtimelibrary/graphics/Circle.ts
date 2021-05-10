import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { doublePrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { FilledShapeHelper } from "./FilledShape.js";
import { WorldHelper } from "./World.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import { ShapeHelper } from "./Shape.js";
// import * as PIXI from "pixi.js";

export class CircleClass extends Klass {

    constructor(module: Module) {

        super("Circle", module, "Kreis");

        this.setBaseClass(<Klass>module.typeStore.getType("FilledShape"));

        // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));

        this.addMethod(new Method("Circle", new Parameterlist([
            { identifier: "mx", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "my", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "r", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let mx: number = parameters[1].value;
                let my: number = parameters[2].value;
                let r: number = parameters[3].value;

                let rh = new CircleHelper(mx, my, r, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = rh;

            }, false, false, 'Instanziert einen neuen Kreis. (mx, my) ist der Mittelpunt, r sein Radius.', true));

        this.addMethod(new Method("setRadius", new Parameterlist([
            { identifier: "radius", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let r: number = parameters[1].value;
                let sh: CircleHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setRadius")) return;

                sh.setRadius(r);

            }, false, false, 'Setzt den Radius des Kreises."', false));

        this.addMethod(new Method("getRadius", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: CircleHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getRadius")) return;

                return sh.r * sh.displayObject.scale.x;

            }, false, false, "Gibt den Radius zurück.", false));

        this.addMethod(new Method("copy", new Parameterlist([
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: CircleHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("copy")) return;

                return sh.getCopy(<Klass>o.class);

            }, false, false, 'Erstellt eine Kopie des Circle-Objekts und git sie zurück.', false));


    }

}

export class CircleHelper extends FilledShapeHelper {

    constructor(public mx: number, public my: number, public r: number,
        interpreter: Interpreter, runtimeObject: RuntimeObject) {
        super(interpreter, runtimeObject);
        this.centerXInitial = mx;
        this.centerYInitial = my;

        this.render();
        this.addToDefaultGroup();

    }

    getCopy(klass: Klass): RuntimeObject {

        let ro: RuntimeObject = new RuntimeObject(klass);
        let rh: CircleHelper = new CircleHelper(this.mx, this.my, this.r, this.worldHelper.interpreter, ro);
        ro.intrinsicData["Actor"] = rh;

        rh.copyFrom(this);
        rh.render();

        return ro;
    }


    render(): void {

        this.hitPolygonInitial = [];

        let deltaAlpha = Math.PI / 8;
        for (let i = 0; i < 16; i++) {
            let alpha = deltaAlpha * i;
            this.hitPolygonInitial.push({
                x: this.mx + this.r * Math.cos(alpha),
                y: this.my + this.r * Math.sin(alpha)
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

        g.drawCircle(this.mx, this.my, this.r);
        g.closePath();

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
        return dx * dx + dy * dy <= this.r * this.r;

    }




}
