import { Module } from "../../compiler/parser/Module.js";
import { Klass, Visibility } from "../../compiler/types/Class.js";
import { booleanPrimitiveType, doublePrimitiveType, intPrimitiveType, stringPrimitiveType, voidPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Attribute, Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { FilledShapeHelper } from "./FilledShape.js";
import { WorldHelper } from "./World.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import * as PIXI from 'pixi.js';



export class JavaKaraWorldClass extends Klass {

    constructor(module: Module) {

        super("JavaKaraWorld", module, "JavaKara-Welt");

        this.setBaseClass(<Klass>module.typeStore.getType("Group"));
        let positionKlass = <Klass>module.typeStore.getType("Position");

        let directions: string[] = ["NORTH", "WEST", "SOUTH", "EAST"];
        for (let i = 0; i < directions.length; i++) {
            this.addAttribute(new Attribute(directions[i], intPrimitiveType, (object) => { return i }, true, Visibility.public, true, "Direction " + directions[i]));
        }

        this.addMethod(new Method("JavaKaraWorld", new Parameterlist([
            { identifier: "sizeX", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "sizeY", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;
                let sizeX: number = parameters[1].value;
                let sizeY: number = parameters[2].value;

                let rh = new JavaKaraWorldHelper(10, 10, sizeX, sizeY, module.main.getInterpreter(), o, positionKlass);
                o.intrinsicData["Actor"] = rh;

            }, false, false, 'Instanziert eine neue JavaKara-Welt', true));

        this.addMethod(new Method("getSizeX", new Parameterlist([]
        ), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: JavaKaraWorldHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getSizeX")) return;

                return sh.sizeX;

            }, false, false, "Gibt zurück, wie viele Felder breit die Welt ist.", false));

        this.addMethod(new Method("clearAll", new Parameterlist([]
        ), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: JavaKaraWorldHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("clearAll")) return;

                sh.clearAll();

                return;

            }, false, false, "Löscht alles aus der Welt bis auf Kara.", false));

        this.addMethod(new Method("setLeaf", new Parameterlist([
            { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let sh: JavaKaraWorldHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setLeaf")) return;

                sh.setOrRemoveLeaf(x, y);

            }, false, false, 'Setzt oder entfernt an der Position (x, y) ein Kleeblatt.', false));

        this.addMethod(new Method("setTree", new Parameterlist([
            { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let sh: JavaKaraWorldHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setTree")) return;

                sh.setOrRemoveTree(x, y);

            }, false, false, 'Setzt oder entfernt an der Position (x, y) einen Baumstumpf.', false));

        this.addMethod(new Method("setMushroom", new Parameterlist([
            { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let sh: JavaKaraWorldHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setMushroom")) return;

                sh.setOrRemoveMushroom(x, y);

            }, false, false, 'Setzt oder entfernt an der Position (x, y) einen Pilz.', false));

        this.addMethod(new Method("isEmpty", new Parameterlist([
            { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let sh: JavaKaraWorldHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setEmpty")) return;

                return sh.isEmpty(x, y);

            }, false, false, 'Gibt genau dann true zurück, wenn sich auf dem angegebenen Feld nichts befindet (auch nicht Kara).', false));

        this.addMethod(new Method("init", new Parameterlist([
            { identifier: "worldAsString", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;
                let s: string = parameters[1].value;
                let sh: JavaKaraWorldHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("init")) return;

                sh.clearAll();
                sh.init(s);

                return;

            }, false, false, 'Baut die Welt mithilfe eines mehrzeiligen Strings. Dabei bedeutet \\n einen Zeilenumbruch, l ein Kleeblatt, t einen Baumstumpf und m einen Pilz.', false));


    }


}

type Position = {
    x: number,
    y: number
}

export class JavaKaraWorldHelper extends FilledShapeHelper {

    cellWidth: number = 28;
    backgroundGraphics: PIXI.Graphics;
    rows: KaraSpriteHelper[][][];

    karas: KaraSpriteHelper[] = [];

    constructor(public left: number, public top: number, public sizeX: number, public sizeY: number,
        interpreter: Interpreter, public runtimeObject: RuntimeObject, public positionKlass: Klass) {
        super(interpreter, runtimeObject);

        this.rows = [];
        for (let i = 0; i < sizeX; i++) {
            let row = [];
            this.rows.push(row);
            for (let j = 0; j < sizeY; j++) row.push([]);
        }

        this.borderWidth = 2;
        this.fillColor = 0xb4e6b4;
        this.fillAlpha = 1.0;
        this.borderColor = 0xaaaaaa;
        this.borderAlpha = 1.0;

        this.centerXInitial = left + this.borderWidth / 2 + sizeX * this.cellWidth / 2;
        this.centerYInitial = top + this.borderWidth / 2 + sizeY * this.cellWidth / 2;

        this.displayObject = new PIXI.Container();
        this.worldHelper.stage.addChild(this.displayObject);

        this.backgroundGraphics = new PIXI.Graphics();
        (<PIXI.Container>this.displayObject).addChild(this.backgroundGraphics);


        this.addToDefaultGroupAndSetDefaultVisibility();

        this.render();

    }

    isMushroom(x: number, y: number) {
        for (let sprite of this.rows[x][y]) {
            if (sprite.isMushroom()) return true;
        }
        return false;
    }

    isTree(x: number, y: number) {
        for (let sprite of this.rows[x][y]) {
            if (sprite.isTree()) return true;
        }
        return false;
    }

    isLeaf(x: number, y: number) {
        for (let sprite of this.rows[x][y]) {
            if (sprite.isLeaf()) return true;
        }
        return false;
    }

    getCopy(klass: Klass): RuntimeObject {

        let ro: RuntimeObject = new RuntimeObject(klass);
        let jwh = new JavaKaraWorldHelper(this.left, this.top, this.sizeX, this.sizeY, this.worldHelper.interpreter, ro, this.positionKlass);
        ro.intrinsicData["Actor"] = jwh;

        jwh.copyFrom(this);
        jwh.render();

        return ro;
    }

    render(): void {

        let width = this.sizeX * this.cellWidth;
        let height = this.sizeY * this.cellWidth;

        this.hitPolygonInitial = [
            { x: this.left, y: this.top }, { x: this.left, y: this.top + height },
            { x: this.left + width, y: this.top + height }, { x: this.left + width, y: this.top }
        ];

        this.backgroundGraphics.clear();

        if (this.fillColor != null) {
            this.backgroundGraphics.beginFill(this.fillColor, this.fillAlpha);
        }
        if (this.borderColor != null) {
            this.backgroundGraphics.lineStyle(this.borderWidth, this.borderColor, this.borderAlpha, 1.0);
        }

        this.backgroundGraphics.moveTo(this.left, this.top);
        this.backgroundGraphics.lineTo(this.left + width, this.top);
        this.backgroundGraphics.lineTo(this.left + width, this.top + height);
        this.backgroundGraphics.lineTo(this.left, this.top + height);
        this.backgroundGraphics.closePath();

        if (this.fillColor != null) {
            this.backgroundGraphics.endFill();
        }

        this.backgroundGraphics.lineStyle(1, this.borderColor, this.borderAlpha, 0.5);

        for (let c = 1; c < this.sizeX; c++) {
            let x = this.left + this.cellWidth * c;
            this.backgroundGraphics.moveTo(x, this.top);
            this.backgroundGraphics.lineTo(x, this.top + height);
        }

        for (let r = 1; r < this.sizeY; r++) {
            let y = this.top + this.cellWidth * r;
            this.backgroundGraphics.moveTo(this.left, y);
            this.backgroundGraphics.lineTo(this.left + width, y);
        }

    };

    removeSprite(sprite: KaraSpriteHelper) {
        let array = this.rows[sprite.x][sprite.y];
        let index = array.indexOf(sprite);
        if (index > 0) array.splice(index, 1);
    }

    addSprite(x: number, y: number, sprite: KaraSpriteHelper) {
        let array = this.rows[x][y];
        array.push(sprite);
    }

    moveSprite(xTo: number, yTo: number, sprite: KaraSpriteHelper) {
        this.removeSprite(sprite);
        this.addSprite(xTo, yTo, sprite);
    }

    getMushroom(x: number, y: number): KaraSpriteHelper {
        let array = this.rows[x][y];
        return array.find((s) => s.isMushroom());
    }

    isOutside(x: number, y: number) {
        return x <= 0 || y <= 0 || x >= this.sizeX || y >= this.sizeY;
    }

    put(x: number, y: number, sprite: KaraSpriteHelper) {
        if (x < 0) x = - x + this.sizeX - 1;
        if (y < 0) y = - y + this.sizeY - 1;
        x = x % this.sizeX;
        y = y % this.sizeY;
        this.rows[x][y].push(sprite);
        if (sprite.isKara()) {
            this.karas.push(sprite);
        } else {
            for (let kara of this.karas) {
                let container: PIXI.Container = <PIXI.Container>this.displayObject;
                let highestIndex = container.children.length - 1;

                container.setChildIndex(kara.sprite, highestIndex);

            }
        }
    }

    removeLeaf(x: number, y: number) {
        let array = this.rows[x][y];
        let leaf = array.find((s) => s.isLeaf());
        this.removeSprite(leaf);
        leaf.sprite.destroy();
    }

    removeTree(x: number, y: number) {
        let array = this.rows[x][y];
        let tree = array.find((s) => s.isTree());
        this.removeSprite(tree);
        tree.sprite.destroy();
    }

    removeMushroom(x: number, y: number) {
        let array = this.rows[x][y];
        let mushroom = array.find((s) => s.isMushroom());
        this.removeSprite(mushroom);
        mushroom.sprite.destroy();
    }

    clearAll() {
        for (let column of this.rows) {
            for (let cellArray of column) {
                this.emptyCellArray(cellArray);
            }
        }
    }

    emptyCellArray(cellArray: KaraSpriteHelper[]) {
        let kara: KaraSpriteHelper = null;
        for (let sprite of cellArray) {
            if (sprite.isKara()) {
                kara = sprite;
            } else {
                sprite.sprite.destroy();
            }
        }
        while (cellArray.length > 0) cellArray.pop();
        if (kara != null) cellArray.push(kara);
    }

    setOrRemoveLeaf(x: number, y: number) {
        if (!this.isLeaf(x, y)) { new KaraSpriteHelper(this, x, y, 3, 1); } else {
            this.removeLeaf(x, y);
        }
    }

    setOrRemoveTree(x: number, y: number) {
        if (!this.isTree(x, y)) { new KaraSpriteHelper(this, x, y, 3, 3); } else {
            this.removeTree(x, y);
        }
    }

    setOrRemoveMushroom(x: number, y: number) {
        if (!this.isMushroom(x, y)) { new KaraSpriteHelper(this, x, y, 3, 2); } else {
            this.setOrRemoveMushroom(x, y);
        }
    }

    isEmpty(x: number, y: number) {
        let a = this.rows[x][y];
        return a.length == 0;
    }

    init(s: string) {
        let lines = s.split("\n");
        for (let y = 0; y < lines.length; y++) {
            if (y >= this.sizeY) break;
            let line = lines[y];
            for (let x = 0; x < line.length; x++) {
                if (x > this.sizeX) break;
                let c = line.charAt(x).toLocaleLowerCase();
                switch (c) {
                    case 'l':
                        this.setOrRemoveLeaf(x, y);
                        break;
                    case 't':
                        this.setOrRemoveTree(x, y);
                        break;
                    case 'm':
                        this.setOrRemoveMushroom(x, y);
                        break;

                    default:
                        break;
                }
            }
        }
    }

    public destroy(): void {
        for (let row of this.rows) {
            for (let a of row) {
                for (let sprite of a) {
                    sprite.sprite.destroy();
                }
                while (a.length > 0) a.pop();
            }
        }
        super.destroy();
    }
}


export class KaraClass extends Klass {

    constructor(module: Module) {

        super("Kara", module, "JavaKara-Marienkäfer");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));

        let karaWorldClass = <Klass>module.typeStore.getType("JavaKaraWorld");
        let positionClass = <Klass>module.typeStore.getType("Position");
        let interpreter = module.main.getInterpreter();

        // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));

        this.addMethod(new Method("Kara", new Parameterlist([
            { identifier: "javaKaraWorld", type: karaWorldClass, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "direction", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;
                let world: RuntimeObject = parameters[1].value;
                let x: number = parameters[2].value;
                let y: number = parameters[3].value;
                let direction: number = parameters[4].value;

                if (world == null) {
                    interpreter.throwException("Der Parameter javaKaraWorld darf nicht null sein.");
                    return;
                }

                let rh = new KaraSpriteHelper(world.intrinsicData["Actor"], x, y, direction, 0);

                o.intrinsicData["Helper"] = rh;

            }, false, false, 'Instanziert ein neues Kara-Objekt', true));

        this.addMethod(new Method("setPosition", new Parameterlist([
            { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]
        ), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let sh: KaraSpriteHelper = o.intrinsicData["Helper"];
                sh.setPosition(x, y);

                return;

            }, false, false, "Setzt Kara an die angegebene Position. (0,0) ist dabei die linke obere Ecke der Welt.", false));

        this.addMethod(new Method("getPosition", new Parameterlist([]
        ), positionClass,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: KaraSpriteHelper = o.intrinsicData["Helper"];
                return sh.getPosition();

            }, false, false, "Gibt Karas Position zurück. Dabei ist (0/0) die Position der linken oberen Ecke.", false));

        this.addMethod(new Method("move", new Parameterlist([]
        ), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: KaraSpriteHelper = o.intrinsicData["Helper"];
                sh.forward();

                return;

            }, false, false, "Bewegt Kara um ein Feld nach vorne.", false));

        this.addMethod(new Method("getWorld", new Parameterlist([]
        ), karaWorldClass,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: KaraSpriteHelper = o.intrinsicData["Helper"];

                return sh.world.runtimeObject;

            }, false, false, "Gibt das JavaKaraWorld-Objekt zurück, in dem sich Kara befindet.", false));

        this.addMethod(new Method("getDirection", new Parameterlist([]
        ), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: KaraSpriteHelper = o.intrinsicData["Helper"];

                return sh.direction;

            }, false, false, "Gibt die Blickrichtung von Kara zurück: 0 == Norden, 1 == Westen, 2 == Süden, 3 == Osten", false));

        this.addMethod(new Method("onLeaf", new Parameterlist([]
        ), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: KaraSpriteHelper = o.intrinsicData["Helper"];

                return sh.world.isLeaf(sh.x, sh.y);

            }, false, false, "Gibt genau dann true zurück, wenn sich Kara auf einem Kleeblatt befindet.", false));

        this.addMethod(new Method("treeFront", new Parameterlist([]
        ), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: KaraSpriteHelper = o.intrinsicData["Helper"];

                let front = sh.getPositionFront();

                return sh.world.isTree(front.x, front.y);

            }, false, false, "Gibt genau dann true zurück, wenn sich vor Kara ein Baumstumpf befindet.", false));

        this.addMethod(new Method("mushroomFront", new Parameterlist([]
        ), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: KaraSpriteHelper = o.intrinsicData["Helper"];

                let front = sh.getPositionFront();

                return sh.world.isMushroom(front.x, front.y);

            }, false, false, "Gibt genau dann true zurück, wenn sich vor Kara ein Pilz befindet.", false));

        this.addMethod(new Method("treeLeft", new Parameterlist([]
        ), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: KaraSpriteHelper = o.intrinsicData["Helper"];

                let front = sh.getPositionLeft();

                return sh.world.isTree(front.x, front.y);

            }, false, false, "Gibt genau dann true zurück, wenn sich links von Kara ein Baumstumpf befindet.", false));

        this.addMethod(new Method("treeRight", new Parameterlist([]
        ), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: KaraSpriteHelper = o.intrinsicData["Helper"];

                let front = sh.getPositionRight();

                return sh.world.isTree(front.x, front.y);

            }, false, false, "Gibt genau dann true zurück, wenn sich rechts von Kara ein Baumstumpf befindet.", false));



        this.addMethod(new Method("turnLeft", new Parameterlist([]
        ), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: KaraSpriteHelper = o.intrinsicData["Helper"];
                sh.turn(1);

                return;

            }, false, false, "Dreht Kara um 90° nach links", false));

        this.addMethod(new Method("turnRight", new Parameterlist([]
        ), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: KaraSpriteHelper = o.intrinsicData["Helper"];
                sh.turn(-1);

                return;

            }, false, false, "Dreht Kara um 90° nach rechts", false));

        this.addMethod(new Method("putLeaf", new Parameterlist([]
        ), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: KaraSpriteHelper = o.intrinsicData["Helper"];
                sh.putLeaf();

                return;

            }, false, false, "Legt ein Kleeblatt auf die Position, an der Kara gerade steht.", false));

        this.addMethod(new Method("removeLeaf", new Parameterlist([]
        ), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: KaraSpriteHelper = o.intrinsicData["Helper"];
                sh.removeLeaf();

                return;

            }, false, false, "Kara nimmt das Kleeblatt, das sich auf seiner aktuellen Position befindet.", false));
    }



}

type KaraDirection = {
    index: number,
    dx: number,
    dy: number
}

class KaraSpriteHelper {

    static directions: KaraDirection[] = [{ index: 0, dx: 0, dy: -1 }, { index: 1, dx: -1, dy: 0 }, { index: 2, dx: 0, dy: 1 }, { index: 3, dx: 1, dy: 0 }];

    sprite: PIXI.Sprite;

    constructor(public world: JavaKaraWorldHelper, public x: number, public y: number, public direction: number, public imageIndex: number) {
        let sheet = PIXI.Assets.get('spritesheet');

        let texture = sheet.textures["Kara#" + imageIndex];
        texture.baseTexture.scaleMode = 0;
        this.sprite = new PIXI.Sprite(texture);
        this.move(world.left + x * world.cellWidth, world.top + y * world.cellWidth);

        (<PIXI.Container>world.displayObject).addChild(this.sprite);
        this.direction = 3;
        this.setDirection(direction);

        this.world.put(x, y, this);

    }

    forward() {
        let direction = KaraSpriteHelper.directions[this.direction];
        let newX = (this.x + direction.dx + this.world.sizeX) % this.world.sizeX;
        let newY = (this.y + direction.dy + this.world.sizeY) % this.world.sizeY;

        if (this.world.isTree(newX, newY)) {
            this.throwException(`An der neuen Position (${newX}, ${newY}) befindet sich ein Baumstumpf. Kara kann nicht dorthin gehen.`);
            return;
        }

        if (this.world.isMushroom(newX, newY)) {
            let nextX = newX + direction.dx;
            let nextY = newY + direction.dy;

            nextX = (nextX + this.world.sizeX) % this.world.sizeX;
            nextY = (nextY + this.world.sizeY) % this.world.sizeY;

            if (this.world.isTree(nextX, nextY)) {
                this.throwException(`An der neuen Position (${newX}, ${newY}) befindet sich ein Pilz, dahinter ein Baum. Kara kann den Pilz daher nicht schieben.`);
                return;
            }
            if (this.world.isMushroom(nextX, nextY)) {
                this.throwException(`An der neuen Position (${newX}, ${newY}) befindet sich ein Pilz, dahinter noch ein Pilz. Kara kann den Pilz daher nicht schieben.`);
                return;
            }

            let mushroom = this.world.getMushroom(newX, newY);
            mushroom.moveToCell(nextX, nextY)
        }

        this.moveToCell(newX, newY);
    }

    turn(angle: number) {
        this.setDirection((this.direction + angle + 4) % 4);
    }

    throwException(text: string) {
        let interpreter = this.world.worldHelper.interpreter;
        interpreter.throwException(text);
        interpreter.stop();
    }

    private move(dx: number, dy: number) {
        this.sprite.localTransform.translate(dx, dy);
        //@ts-ignore
        this.sprite.transform.onChange();
    }

    moveToCell(x: number, y: number) {
        this.move((x - this.x) * this.world.cellWidth, (y - this.y) * this.world.cellWidth);
        this.x = x;
        this.y = y;
        this.world.moveSprite(x, y, this);
    }

    setDirection(direction: number) {
        let d = (direction - this.direction + 4) % 4;
        let centerX = this.world.left + this.x * this.world.cellWidth + 14;
        let centerY = this.world.top + this.y * this.world.cellWidth + 14;

        this.sprite.localTransform.translate(-centerX, -centerY);
        this.sprite.localTransform.rotate(-d * Math.PI / 2);
        this.sprite.localTransform.translate(centerX, centerY);
        //@ts-ignore
        this.sprite.transform.onChange();
        this.direction = direction;
    }

    isLeaf() {
        return this.imageIndex == 1;
    }

    isMushroom() {
        return this.imageIndex == 2;
    }

    isTree() {
        return this.imageIndex == 3;
    }

    isKara() {
        return this.imageIndex == 0;
    }

    getPositionFront(): Position {
        return this.getPositionInDirection(0);
    }

    getPositionLeft(): Position {
        return this.getPositionInDirection(1);
    }

    getPositionRight(): Position {
        return this.getPositionInDirection(-1);
    }

    getPositionInDirection(dirDelta: number) {
        let dir = KaraSpriteHelper.directions[(this.direction + dirDelta + 4) % 4];
        return { x: (this.x + dir.dx + this.world.sizeX) % this.world.sizeX, y: (this.y + dir.dy + this.world.sizeY) % this.world.sizeY };

    }

    putLeaf() {
        if (this.world.isLeaf(this.x, this.y)) {
            this.throwException("Unter Kara liegt schon ein Kleeblatt, es kann an dieser Position nicht  noch eines abgelegt werden.");
            return;
        }

        new KaraSpriteHelper(this.world, this.x, this.y, 3, 1);
    }

    removeLeaf() {
        if (!this.world.isLeaf(this.x, this.y)) {
            this.throwException("Unter Kara liegt kein Kleeblatt, daher kann Kara keines aufheben (Methode removeLeaf).");
            return;
        }
        this.world.removeLeaf(this.x, this.y);
    }

    setPosition(x: any, y: any) {
        if (x < 0) x = -x - 1 + this.world.sizeX;
        if (y < 0) y = -y - 1 + this.world.sizeY;
        this.moveToCell(x % this.world.sizeX, y % this.world.sizeY);
    }

    getPosition(): RuntimeObject {
        let rto = new RuntimeObject(this.world.positionKlass);
        let xIndex = this.world.positionKlass.attributeMap.get("x").index;
        let yIndex = this.world.positionKlass.attributeMap.get("y").index;
        rto.attributes[xIndex] = { value: this.x, type: intPrimitiveType };
        rto.attributes[yIndex] = { value: this.y, type: intPrimitiveType };
        return rto;
    }

}


