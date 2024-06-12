import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { doublePrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { FilledShapeHelper } from "./FilledShape.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import * as PIXI from 'pixi.js';

export class EllipseClass extends Klass {

    constructor(module: Module) {

        super("Ellipse", module, "Ellipse");

        this.setBaseClass(<Klass>module.typeStore.getType("FilledShape"));

        // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));

        this.addMethod(new Method("Ellipse", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let rh = new EllipseHelper(100, 50, 50, 100, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = rh;

            }, false, false, 'Instanziert eine neue Ellipse. (100, 50) ist der Mittelpunt, 100 und 50 sind ihre Radien.', true));

        this.addMethod(new Method("Ellipse", new Parameterlist([
            { identifier: "mx", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "my", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "rx", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "ry", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let mx: number = parameters[1].value;
                let my: number = parameters[2].value;
                let rx: number = parameters[3].value;
                let ry: number = parameters[4].value;

                let rh = new EllipseHelper(mx, my, rx, ry, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = rh;

            }, false, false, 'Instanziert eine neue Ellipse. (mx, my) ist der Mittelpunt, rx und ry sind ihre Radien.', true));

            this.addMethod(new Method("setRadiusX", new Parameterlist([
                { identifier: "rx", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            ]), null,
                (parameters) => {
    
                    let o: RuntimeObject = parameters[0].value;
                    let r: number = parameters[1].value;
                    let sh: EllipseHelper = o.intrinsicData["Actor"];
    
                    sh.setRadiusX(r);
    
                }, false, false, 'Setzt den x-Radius der Ellipse"', false));

            this.addMethod(new Method("setRadiusY", new Parameterlist([
                { identifier: "ry", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            ]), null,
                (parameters) => {
    
                    let o: RuntimeObject = parameters[0].value;
                    let r: number = parameters[1].value;
                    let sh: EllipseHelper = o.intrinsicData["Actor"];
    
                    sh.setRadiusY(r);
    
                }, false, false, 'Setzt den y-Radius der Ellipse"', false));
    
                this.addMethod(new Method("copy", new Parameterlist([
                ]), this,
                    (parameters) => {
        
                        let o: RuntimeObject = parameters[0].value;
                        let sh: EllipseHelper = o.intrinsicData["Actor"];
        
                        if (sh.testdestroyed("copy")) return;
        
                        return sh.getCopy(<Klass>o.class);
        
                    }, false, false, 'Erstellt eine Kopie des Ellipse-Objekts und git sie zurück.', false));
    

    }

}

export class EllipseHelper extends FilledShapeHelper {

    constructor(public mx: number, public my: number, public rx: number, public ry: number,
        interpreter: Interpreter, runtimeObject: RuntimeObject) {
        super(interpreter, runtimeObject);
        this.centerXInitial = mx;
        this.centerYInitial = my;

        this.render();
        this.addToDefaultGroupAndSetDefaultVisibility();

    }

    getCopy(klass: Klass): RuntimeObject {

        let ro: RuntimeObject = new RuntimeObject(klass);
        let rh: EllipseHelper = new EllipseHelper(this.mx, this.my, this.rx, this.ry, this.worldHelper.interpreter, ro);
        ro.intrinsicData["Actor"] = rh;

        rh.copyFrom(this);
        rh.render();

        return ro;
    }

    
    render(): void {

        this.hitPolygonInitial = [];

        let deltaAlpha = Math.PI/8;
        for(let i = 0; i < 16; i++){
            let alpha = deltaAlpha * i;
            this.hitPolygonInitial.push({
                x: this.mx + this.rx*Math.cos(alpha),
                y: this.my + this.ry*Math.sin(alpha)
            });
        }

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

        g.drawEllipse(this.mx, this.my, this.rx, this.ry);
        g.closePath();

        if (this.fillColor != null) {
            g.endFill();
        }
    };

    setRadiusX(r: number){
        this.rx = r;
        this.render();
    }

    setRadiusY(r: number){
        this.rx = r;
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
        return dx*dx/(this.rx*this.rx) + dy*dy/(this.ry*this.ry) <= 1;
    
    }
    



}
