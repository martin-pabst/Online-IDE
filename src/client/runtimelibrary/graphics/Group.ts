import { Module } from "../../compiler/parser/Module.js";
import { Klass, Visibility } from "../../compiler/types/Class.js";
import { doublePrimitiveType, intPrimitiveType, booleanPrimitiveType, voidPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist, Value, Attribute, Type } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { FilledShapeHelper } from "./FilledShape.js";
import { WorldHelper } from "./World.js";
import { EnumRuntimeObject } from "../../compiler/types/Enum.js";
import { ShapeHelper, ShapeClass } from "./Shape.js";
import { HitPolygonStore } from "./PolygonStore.js";
import { ArrayType } from "../../compiler/types/Array.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import * as PIXI from 'pixi.js';

export class CollisionPairClass extends Klass {

    constructor(module: Module) {

        super("CollisionPair", module, "Speichert die Referenzen auf zwei Figuren, die gerade kollidiert sind. Diese Klasse von den Kollisionsmethden der Klasse Group benutzt.");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));

        let shapeType = module.typeStore.getType("Shape");

        this.addAttribute(new Attribute("shapeA", shapeType,
            (value) => {

                let rto: RuntimeObject = value.object;
                value.value = rto.intrinsicData["ShapeA"];

            }, false, Visibility.public, true, "Erstes an der Kollision beteiligtes Shape"));

        this.addAttribute(new Attribute("shapeB", shapeType,
            (value) => {

                let rto: RuntimeObject = value.object;
                value.value = rto.intrinsicData["ShapeB"];

            }, false, Visibility.public, true, "Zweites an der Kollision beteiligtes Shape"));

        this.setupAttributeIndicesRecursive();

    }
}



export class GroupClass extends Klass {

    constructor(module: Module) {

        super("Group", module, "Klasse zum Gruppieren grafischer Elemente. Die gruppierten Elemente können miteinander verschoben, gedreht, gestreckt sowie ein- und ausgeblendet werden. Zudem besitzt die Klasse Methoden zur schnellen Erkennung von Kollision mit Elementen außerhalb der Gruppe.");

        this.setBaseClass(<Klass>module.typeStore.getType("Shape"));

        let collisionPairType = module.typeStore.getType("CollisionPair");
        let collisionPairArrayType = new ArrayType(collisionPairType);
        let shapeType = module.typeStore.getType("Shape");


        this.addMethod(new Method("Group", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let rh = new GroupHelper(module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = rh;

            }, false, false, 'Instanziert eine neue Gruppe. Ihr können mit der Methode add Elemente hinzugefügt werden, die dann mit der Gruppe verschoben, gedreht, ... werden.', true));

        this.addMethod(new Method("Group", new Parameterlist([
            { identifier: "shapes", type: new ArrayType(module.typeStore.getType("Shape")), declaration: null, usagePositions: null, isFinal: true, isEllipsis: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let shapes: Value[] = parameters[1].value;

                let rh = new GroupHelper(module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = rh;

                for (let s of shapes) {
                    rh.add(s.value);
                }

            }, false, false, 'Instanziert eine neue Gruppe und fügt die übergebenen Grafikobjekte der Gruppe hinzu. Der Gruppe können mit der Methode add weitere Grafikobjekte hinzugefügt werden, die dann mit der Gruppe verschoben, gedreht, ... werden.', true));

        this.addMethod(new Method("add", new Parameterlist([
            { identifier: "shapes", type: new ArrayType(shapeType), declaration: null, usagePositions: null, isFinal: true, isEllipsis: true },

        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let shapes: Value[] = parameters[1].value;
                let sh: GroupHelper = <GroupHelper>o.intrinsicData["Actor"];

                if (sh.testdestroyed("add")) return;

                for (let s of shapes) {
                    sh.add(s.value);
                }

            }, false, false, 'Fügt die Grafikobjekte der Gruppe hinzu.', false));

        this.addMethod(new Method("get", new Parameterlist([
            { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },

        ]), shapeType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let index: number = parameters[1].value;
                let sh: GroupHelper = <GroupHelper>o.intrinsicData["Actor"];

                if (sh.testdestroyed("get")) return;

                return sh.getElement(index);

            }, false, false, 'Gibt das Grafikelement der Gruppe mit dem entsprechenden Index zurück. VORSICHT: Das erste Element hat Index 0!', false));

        this.addMethod(new Method("remove", new Parameterlist([
            { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },

        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let index: number = parameters[1].value;
                let sh: GroupHelper = <GroupHelper>o.intrinsicData["Actor"];

                sh.removeElementAt(index);

            }, false, false, 'Entfernt das Grafikelement aus der Gruppe mit dem entsprechenden Index, zerstört es jedoch nicht. VORSICHT: Das erste Element hat Index 0!', false));

        this.addMethod(new Method("remove", new Parameterlist([
            { identifier: "shape", type: shapeType, declaration: null, usagePositions: null, isFinal: true },

        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let shape: RuntimeObject = parameters[1].value;
                let sh: GroupHelper = <GroupHelper>o.intrinsicData["Actor"];

                if (sh.testdestroyed("remove")) return;

                sh.remove(shape);
                sh.worldHelper.shapes.push(shape.intrinsicData["Actor"]);

            }, false, false, 'Entfernt das übergebene Grafikelement aus der Gruppe, zerstört es jedoch nicht.', false));


        let shapeArrayType = new ArrayType(shapeType);

        this.addMethod(new Method("getCollidingShapes", new Parameterlist([
            { identifier: "shape", type: module.typeStore.getType("Shape"), declaration: null, usagePositions: null, isFinal: true },

        ]), shapeArrayType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let shape: RuntimeObject = parameters[1].value;
                let sh: GroupHelper = <GroupHelper>o.intrinsicData["Actor"];

                if (sh.testdestroyed("getCollidingShapes") || shape == null) return [];

                let shapes: RuntimeObject[] = sh.getCollidingObjects(shape);

                let values: Value[] = [];
                for (let sh of shapes) {
                    values.push({
                        type: shapeType,
                        value: sh
                    })

                }

                return values;

            }, false, false, 'Gibt die Objekte der Gruppe zurück, die mit dem übergebenen Shape kollidieren.', false));

        this.addMethod(new Method("indexOf", new Parameterlist([
            { identifier: "shape", type: module.typeStore.getType("Shape"), declaration: null, usagePositions: null, isFinal: true },

        ]), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let shape: RuntimeObject = parameters[1].value;
                let sh: GroupHelper = <GroupHelper>o.intrinsicData["Actor"];

                if (sh.testdestroyed("indexOf") || shape == null) return [];

                return sh.indexOf(shape);

            }, false, false, 'Gibt den Index des übergebenen Elements zurück. 0 bedeutet: erstes Element, -1 bedeutet: Das Element ist nicht in der Group enthalten.', false));

        this.addMethod(new Method("getCollisionPairs", new Parameterlist([
            { identifier: "group", type: this, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "maxOneCollisionPerShape", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), collisionPairArrayType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let group2: RuntimeObject = parameters[1].value;
                let maxOneCollisionPerShape: boolean = parameters[2].value;
                let sh: GroupHelper = <GroupHelper>o.intrinsicData["Actor"];
                let groupHelper2: GroupHelper = <GroupHelper>group2.intrinsicData["Actor"];

                if (sh.testdestroyed("getCollidingShapes")) return;

                return sh.getCollidingObjects2(groupHelper2, collisionPairType, maxOneCollisionPerShape);

            }, false, false, 'Überprüft, welche Objekte der Gruppe mit welchen der anderen kollidieren.' +
            ' Gibt für jede Kollision ein Collisionpair-Objekt zurück, das die beiden kollidierenden Objekte enthält.' +
        ' Falls maxOneCollisionPerShape == true ist jedes Objekt dabei aber nur in max. einem Collisionpair-Objekt enthalten.', false));


        this.addMethod(new Method("size", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: GroupHelper = <GroupHelper>o.intrinsicData["Actor"];

                if (sh.testdestroyed("size")) return;

                return sh.shapes.length;

            }, false, false, 'Gibt zurück, wie viele Elemente in der Gruppe enthalten sind.', false));

        this.addMethod(new Method("empty", new Parameterlist([
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: GroupHelper = <GroupHelper>o.intrinsicData["Actor"];

                if (sh.testdestroyed("empty")) return;

                sh.removeAllChidren();

            }, false, false, 'Entfernt alle Elemente aus der Gruppe, löscht die Elemente aber nicht.', false));

        this.addMethod(new Method("destroyAllChildren", new Parameterlist([
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: GroupHelper = <GroupHelper>o.intrinsicData["Actor"];

                if (sh.testdestroyed("destroyAllChildren")) return;

                sh.destroyChildren();

            }, false, false, 'Löscht alle Elemente der Gruppe, nicht aber die Gruppe selbst.', false));


        (<Klass>shapeType).addMethod(new Method("getCollidingShapes", new Parameterlist([
            { identifier: "group", type: this, declaration: null, usagePositions: null, isFinal: true },
        ]), shapeArrayType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let group: RuntimeObject = parameters[1].value;
                let groupHelper: GroupHelper = group.intrinsicData["Actor"];
                let sh: ShapeHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getCollidingShapes")) return;

                return sh.getCollidingShapes(groupHelper, shapeType);

            }, false, false, 'Gibt alle Shapes der Gruppe group zurück, die mit dem Shape kollidieren.', false));

        this.addMethod(new Method("copy", new Parameterlist([
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: GroupHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("copy")) return;

                return sh.getCopy(<Klass>o.class);

            }, false, false, 'Erstellt eine Kopie des Group-Objekts (und aller seiner enthaltenen Grafikobjekte!) und git sie zurück.', false));

        this.addMethod(new Method("renderAsStaticBitmap", new Parameterlist([
            { identifier: "renderAsStaticBitmap", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: GroupHelper = o.intrinsicData["Actor"];
                let doCache: boolean = parameters[1].value;

                if (sh.testdestroyed("renderAsStaticBitmap")) return;

                sh.cacheAsBitmap(doCache);

                return;

            }, false, false, 'Zeichnet alle Objekte dieser Group in ein Bild und verwendet fortan nur noch dieses Bild, ohne die Kindelemente der Group erneut zu zeichnen. Mit dieser Methode können komplexe Bilder (z.B. ein Sternenhimmel) aufgebaut und dann statisch gemacht werden. Nach dem Aufbau brauchen sie daher kaum mehr Rechenzeit.', false));

            (<Klass>shapeType).addMethod(new Method("getParentGroup", new Parameterlist([
            ]), this,
                (parameters) => {
    
                    let o: RuntimeObject = parameters[0].value;
                    let sh: ShapeHelper = o.intrinsicData["Actor"];
    
                    if (sh.testdestroyed("getParentGroup")) return;
    
                    return sh.getParentGroup();
    
                }, false, false, 'Gibt die Group zurück, in der sich das Grafikobjekt befindet, bzw. null, falls es in keiner Group ist.', false));
    
    }

}

export class GroupHelper extends ShapeHelper {

    shapes: RuntimeObject[] = [];

    constructor(interpreter: Interpreter, runtimeObject: RuntimeObject) {
        super(interpreter, runtimeObject);
        this.displayObject = new PIXI.Container();
        this.worldHelper.stage.addChild(this.displayObject);
        this.addToDefaultGroupAndSetDefaultVisibility();

    }

    indexOf(shape: RuntimeObject): any {
        for(let i = 0; i < this.shapes.length; i++){
            if(shape == this.shapes[i]) return i;
        }
        return -1;
    }

    setChildIndex(sh: ShapeHelper, index: number) {
        let container: PIXI.Container = <PIXI.Container>this.displayObject;
        container.setChildIndex(sh.displayObject, index);

        let oldIndex = this.shapes.indexOf(sh.runtimeObject);
        this.shapes.splice(oldIndex, 1);
        this.shapes.splice(index, 0, sh.runtimeObject);
}


    cacheAsBitmap(doCache: boolean) {
        let container = <PIXI.Container>this.displayObject;

        // If you set doCache to false and shortly afterwards to true: 
        // make shure there's at least one rendercycle in between.
        if (doCache) {
            setTimeout(() => {
                container.cacheAsBitmap = true;
            }, 300);
        } else {
            container.cacheAsBitmap = doCache;
        }
    }


    removeElementAt(index: number) {
        if (index < 0 || index >= this.shapes.length) {
            this.worldHelper.interpreter.throwException("In der Gruppe gibt es kein Element mit Index " + index + ".");
            return;
        }

        let shape = this.shapes[index];
        this.remove(shape);
    }

    getElement(index: number): RuntimeObject {
        if (index < 0 || index >= this.shapes.length) {
            this.worldHelper.interpreter.throwException("In der Gruppe gibt es kein Element mit Index " + index + ".");
            return;
        }
        return this.shapes[index];
    }

    getCopy(klass: Klass): RuntimeObject {

        let ro: RuntimeObject = new RuntimeObject(klass);
        let groupHelperCopy: GroupHelper = new GroupHelper(this.worldHelper.interpreter, ro);
        ro.intrinsicData["Actor"] = groupHelperCopy;

        for (let ro of this.shapes) {
            let shapeHelper: ShapeHelper = ro.intrinsicData["Actor"];

            let roCopy: RuntimeObject = shapeHelper.getCopy(<Klass>ro.class)
            let shapeHelperCopy: ShapeHelper = roCopy.intrinsicData["Actor"];

            groupHelperCopy.add(roCopy);
        }

        groupHelperCopy.copyFrom(this);
        groupHelperCopy.render();

        return ro;
    }

    setTimerPaused(tp: boolean) {
        this.timerPaused = tp;

        for (let shape of this.shapes) {
            let sh: ShapeHelper = <ShapeHelper>shape.intrinsicData["Actor"];
            sh.timerPaused = tp;
        }

    }

    collidesWithAnyShape(color?: number): boolean {

        for (let shapeHelper of this.worldHelper.shapes) {
            if (this == shapeHelper) continue;

            if (shapeHelper["fillColor"] && color != null) {
                if (shapeHelper["fillColor"] != color) {
                    continue;
                }
            }

            if (shapeHelper["shapes"] || shapeHelper["turtle"]) {
                if (shapeHelper.collidesWith(this)) {
                    return true;
                } else {
                    continue;
                }
            }

            if(this.collidesWith(shapeHelper)) return true;

        }

        return false;

    }

    transformHitPolygon(){
        for(let rto of this.shapes){
            let shape = <ShapeHelper>rto.intrinsicData["Actor"];
            shape.transformHitPolygon();
        }
        this.hitPolygonDirty = false;
    }

    add(shape: RuntimeObject) {

        if(shape == null) return;

        let shapeHelper: ShapeHelper = <ShapeHelper>shape.intrinsicData["Actor"];

        if (shapeHelper.isDestroyed) {
            this.worldHelper.interpreter.throwException("Ein schon zerstörtes Objekt kann keiner Gruppe hinzugefügt werden.");
            return;
        }

        if (this.hasCircularReference(shape)) {
            return;
        }

        this.shapes.push(shape);

        if (shapeHelper.belongsToGroup != null) {
            shapeHelper.belongsToGroup.remove(shape);
        } else {
            let index = this.worldHelper.shapes.indexOf(shapeHelper);
            if (index >= 0) this.worldHelper.shapes.splice(index, 1);
        }

        shapeHelper.belongsToGroup = this;

        this.displayObject.parent.updateTransform();
        let inverse = new PIXI.Matrix().copyFrom(this.displayObject.transform.worldTransform);
        inverse.invert();
        shapeHelper.displayObject.localTransform.prepend(inverse.prepend(this.worldHelper.stage.localTransform));
        //@ts-ignore
        shapeHelper.displayObject.transform.onChange();

        (<PIXI.Container>this.displayObject).addChild(shapeHelper.displayObject);
        shapeHelper.displayObject.updateTransform();

        let xSum: number = 0;
        let ySum: number = 0;

        for (let shape of this.shapes) {
            let sh: ShapeHelper = <ShapeHelper>shape.intrinsicData["Actor"];
            xSum += sh.getCenterX();
            ySum += sh.getCenterY();
        }

        let x = xSum / this.shapes.length;
        let y = ySum / this.shapes.length;

        this.displayObject.updateTransform();
        let p1: PIXI.Point = this.displayObject.worldTransform.applyInverse(new PIXI.Point(x, y));
        this.centerXInitial = p1.x;
        this.centerYInitial = p1.y;
    }

    public removeAllChidren() {
        let index: number = 0;
        for (let shape of this.shapes) {
            this.deregister(shape, index++);
        }
        this.shapes = [];
    }

    public remove(shape: RuntimeObject) {
        let index = this.shapes.indexOf(shape);
        if (index >= 0) {
            this.shapes.splice(index, 1);
            this.deregister(shape, index);
        }
    }

    private deregister(shape: RuntimeObject, index: number) {
        let shapeHelper: ShapeHelper = shape.intrinsicData['Actor'];

        let transform = new PIXI.Matrix().copyFrom(shapeHelper.displayObject.transform.worldTransform);

        (<PIXI.Container>this.displayObject).removeChild(shapeHelper.displayObject);

        let inverseStageTransform = new PIXI.Matrix().copyFrom(this.worldHelper.stage.localTransform);
        inverseStageTransform.invert();
        shapeHelper.displayObject.localTransform.identity();
        shapeHelper.displayObject.localTransform.append(transform.prepend(inverseStageTransform));
        //@ts-ignore
        shapeHelper.displayObject.transform.onChange();
        this.worldHelper.stage.addChild(shapeHelper.displayObject);
        shapeHelper.displayObject.updateTransform();
        shapeHelper.belongsToGroup = null;

    }


    public render(): void {
    }

    public destroy(): void {
        this.destroyChildren();
        super.destroy();
    }

    public destroyChildren(): void {
        for (let shape of this.shapes.slice(0)) {
            let sh: ShapeHelper = <ShapeHelper>shape.intrinsicData["Actor"];
            sh.destroy();
        }
        this.shapes = [];
    }

    hasOverlappingBoundingBoxWith(shapeHelper: ShapeHelper): boolean {
        this.displayObject.updateTransform();
        shapeHelper.displayObject.updateTransform();

        let bb = this.displayObject.getBounds();
        let bb1 = shapeHelper.displayObject.getBounds();

        if (bb.left > bb1.right || bb1.left > bb.right) return false;

        if (bb.top > bb1.bottom || bb1.top > bb.bottom) return false;
        return true;
    }


    collidesWith(shapeHelper: ShapeHelper) {
        if (!this.hasOverlappingBoundingBoxWith(shapeHelper)) {
            return false;
        }

        for (let shape of this.shapes) {
            let sh: ShapeHelper = <ShapeHelper>shape.intrinsicData["Actor"];
            if (sh.collidesWith(shapeHelper)) {
                return true;
            }
        }
        return false;
    }

    setHitPolygonDirty(dirty: boolean) {
        for (let shape of this.shapes) {
            let sh: ShapeHelper = <ShapeHelper>shape.intrinsicData["Actor"];
            sh.setHitPolygonDirty(dirty);
        }
    }

    containsPoint(x: number, y: number) {
        this.displayObject.updateTransform();

        let bb = this.displayObject.getBounds();

        if (x < bb.left || x > bb.left + bb.width || y < bb.top || y > bb.top + bb.height) {
            return false;
        }

        for (let shape of this.shapes) {
            let sh: ShapeHelper = <ShapeHelper>shape.intrinsicData["Actor"];
            if (sh.containsPoint(x, y)) {
                return true;
            }
        }
        return false;
    }

    getCollidingObjects(shape: RuntimeObject): RuntimeObject[] {

        let collidingShapes: RuntimeObject[] = [];
        let shapeHelper: ShapeHelper = <ShapeHelper>shape.intrinsicData["Actor"];

        for (let s of this.shapes) {
            let sh: ShapeHelper = <ShapeHelper>s.intrinsicData["Actor"];
            if (sh.collidesWith(shapeHelper)) {
                collidingShapes.push(s);
            }
        }

        return collidingShapes;

    }

    getCollidingObjects2(groupHelper2: GroupHelper, collisionPairType: Type,
        maxOneCollisionPerShape: boolean): Value[] {

        let collisionPairs: Value[] = [];

        let alreadyCollidedHelpers2: Map<ShapeHelper, boolean> = new Map();

        for (let shape1 of this.shapes) {
            let shapeHelper1: ShapeHelper = <ShapeHelper>shape1.intrinsicData["Actor"];
            for (let shape2 of groupHelper2.shapes) {
                let shapeHelper2: ShapeHelper = <ShapeHelper>shape2.intrinsicData["Actor"];
                if (shapeHelper1.collidesWith(shapeHelper2)) {

                    if (!maxOneCollisionPerShape || alreadyCollidedHelpers2.get(shapeHelper2) == null) {
                        alreadyCollidedHelpers2.set(shapeHelper2, true);
                        let rto: RuntimeObject = new RuntimeObject(<Klass>collisionPairType);

                        rto.intrinsicData["ShapeA"] = shapeHelper1.runtimeObject;
                        rto.intrinsicData["ShapeB"] = shapeHelper2.runtimeObject;
                        collisionPairs.push({
                            type: collisionPairType,
                            value: rto
                        });
                    }

                    if (maxOneCollisionPerShape) {
                        break;
                    }
                }
            }
        }

        return collisionPairs;

    }

    hasCircularReference(shapeToAdd: RuntimeObject) {
        let gh = shapeToAdd.intrinsicData["Actor"];
        if (gh instanceof GroupHelper) {
            if (gh == this) {
                this.worldHelper.interpreter.throwException("Eine Group darf sich nicht selbst enthalten!");
                return true;
            } else {
                for (let shape of gh.shapes) {
                    if (this.hasCircularReference(shape)) {
                        return true;
                    };
                }
            }
        }
        return false;
    }


    tint(color: string) {
        for (let child of this.shapes) {
            (<ShapeHelper>child.intrinsicData["Actor"]).tint(color);
        }
    }

    public borderContainsPoint(x: number, y: number, color: number = -1): boolean {

        for (let child of this.shapes) {
            let sh = <ShapeHelper>child.intrinsicData["Actor"];
            if(sh.borderContainsPoint(x, y, color)) return true;
        }

        return false;
    }


}
