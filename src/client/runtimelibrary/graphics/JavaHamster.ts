import { Module } from "../../compiler/parser/Module.js";
import { Klass, Visibility } from "../../compiler/types/Class.js";
import { booleanPrimitiveType, doublePrimitiveType, intPrimitiveType, stringPrimitiveType, voidPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Attribute, Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { FilledShapeHelper } from "./FilledShape.js";
import { WorldHelper } from "./World.js";
import { Interpreter, InterpreterState } from "../../interpreter/Interpreter.js";
import * as PIXI from 'pixi.js';



export class JavaHamsterWorldClass extends Klass {

    constructor(module: Module) {

        super("JavaHamsterWorld", module, "JavaHamster-Welt");

        this.setBaseClass(<Klass>module.typeStore.getType("FilledShape"));

        this.addMethod(new Method("JavaHamsterWorld", new Parameterlist([
            { identifier: "Breite", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "Höhe", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;
                let Breite: number = parameters[1].value;
                let Höhe: number = parameters[2].value;

                let rh = new JavaHamsterWorldHelper(10, 10, Breite, Höhe, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = rh;

            }, false, false, 'Instanziert eine neue JavaHamster-Welt', true));

        this.addMethod(new Method("getBreite", new Parameterlist([]
        ), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: JavaHamsterWorldHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getBreite")) return;

                return sh.sizeX;

            }, false, false, "Gibt zurück, wie viele Felder breit die Welt ist.", false));

        this.addMethod(new Method("getHöhe", new Parameterlist([]
        ), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: JavaHamsterWorldHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getHöhe")) return;

                return sh.sizeX;

            }, false, false, "Gibt zurück, wie viele Felder hoch die Welt ist.", false));

        this.addMethod(new Method("löscheAlles", new Parameterlist([]
        ), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: JavaHamsterWorldHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("löscheAlles")) return;

                sh.clearAll();

                return;

            }, false, false, "Löscht alles aus der Welt bis auf den Hamster.", false));

        this.addMethod(new Method("setzeMauer", new Parameterlist([
            { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let sh: JavaHamsterWorldHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setzeMauer")) return;

                sh.setOrRemoveWall(x, y);

            }, false, false, 'Setzt oder entfernt an der Position (x, y) eine Mauer.', false));

        this.addMethod(new Method("setzeGetreide", new Parameterlist([
            { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "anzahl", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let count: number = parameters[3].value;
                let sh: JavaHamsterWorldHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setzeAnzahl")) return;

                sh.setGrain(x, y, count);

            }, false, false, 'Setzt an der Position (x, y) die Anzahl der Getreidekörner.', false));

        this.addMethod(new Method("init", new Parameterlist([
            { identifier: "worldAsString", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;
                let s: string = parameters[1].value;
                let sh: JavaHamsterWorldHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("init")) return;

                sh.clearAll();
                sh.init(s);

                return;

            }, false, false, 'Baut die Welt mithilfe eines mehrzeiligen Strings. Dabei bedeutet \\n einen Zeilenumbruch, m eine Mauer und 1 ... 9, a ... f die entsprechende Anzahl an Getreidekörnern.', false));


        this.addMethod(new Method("scale", new Parameterlist([
            { identifier: "factor", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let factor: number = parameters[1].value;
                let sh: JavaHamsterWorldHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("scale")) return;

                sh.scaleNew(factor);

            }, false, false, "Streckt das Grafikobjekt um den angegebenen Faktor. Das Zentrum der Streckung ist der 'Mittelpunkt' des Objekts.", false));

    }



}

export class JavaHamsterWorldHelper extends FilledShapeHelper {

    cellWidth: number = 40;
    backgroundGraphics: PIXI.Graphics;
    columns: WallGrainSprite[][];

    hamsters: HamsterSpriteHelper[] = [];

    // Below World
    belowWorldText: PIXI.Text;

    constructor(public left: number, public top: number, public sizeX: number, public sizeY: number,
        interpreter: Interpreter, public runtimeObject: RuntimeObject) {
        super(interpreter, runtimeObject);

        this.borderWidth = 2;
        this.fillColor = 0x90ee90;
        this.fillAlpha = 1.0;
        this.borderColor = 0x8b4513;
        this.borderAlpha = 1.0;

        this.centerXInitial = left + this.borderWidth / 2 + sizeX * this.cellWidth / 2;
        this.centerYInitial = top + this.borderWidth / 2 + sizeY * this.cellWidth / 2;

        this.displayObject = new PIXI.Container();
        this.worldHelper.stage.addChild(this.displayObject);

        this.addToDefaultGroupAndSetDefaultVisibility();

        this.render();

        this.renderBelowWorld();

        this.columns = [];
        for (let column = 0; column < sizeX; column++) {
            let columnArray = [];
            this.columns.push(columnArray);
            for (let row = 0; row < sizeY; row++) columnArray.push(new WallGrainSprite(this, column, row));
        }

    }

    setGrain(x: number, y: number, count: number) {
        let sprite = this.columns[x][y];
        sprite.setGrainCount(count);
    }

    setOrRemoveWall(x: number, y: number) {
        let sprite = this.columns[x][y];
        sprite.setWall(!sprite.isWall());
    }

    scaleNew(factor: number) {
        this.displayObject.updateTransform();
        let p = new PIXI.Point(this.left, this.top);
        this.displayObject.transform.worldTransform.apply(p, p);
        this.scale(factor, p.x, p.y);
    }

    isWall(x: number, y: number) {
        let sprite = this.columns[x][y];
        return sprite.isWall();
    }

    getGrainCount(x: number, y: number) {
        let sprite = this.columns[x][y];
        return sprite.getGrainCount();
    }

    getCopy(klass: Klass): RuntimeObject {

        let ro: RuntimeObject = new RuntimeObject(klass);
        let jwh = new JavaHamsterWorldHelper(this.left, this.top, this.sizeX, this.sizeY, this.worldHelper.interpreter, ro);
        ro.intrinsicData["Actor"] = jwh;

        jwh.copyFrom(this);
        jwh.render();

        return ro;
    }

    renderBelowWorld(){
        let textstyle = new PIXI.TextStyle({
            fontFamily: "sans-serif",
            fontSize: 28,
            fontStyle: 'normal',
            fontWeight: 'normal',
            fill: 0xffffff,
            stroke: '#00000040',
            strokeThickness: 2,
            align: "center",
        })

        this.belowWorldText = new PIXI.Text("Hamster: 0, Feld: 0", textstyle);
        this.belowWorldText.localTransform.translate(this.left, this.top + this.sizeY * this.cellWidth + 5);
        //@ts-ignore
        this.belowWorldText.transform.onChange();
        let container = <PIXI.Container>this.displayObject;
        container.addChild(this.belowWorldText);
    }

    render(): void {

        if (this.backgroundGraphics != null) this.backgroundGraphics.destroy();

        let container = <PIXI.Container>this.displayObject;
        this.backgroundGraphics = new PIXI.Graphics();
        container.addChild(this.backgroundGraphics);
        container.setChildIndex(this.backgroundGraphics, 0);

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

    getWallGrainSprite(x: number, y: number): WallGrainSprite {
        return this.columns[x][y];
    }

    isOutside(x: number, y: number) {
        return x < 0 || y < 0 || x >= this.sizeX || y >= this.sizeY;
    }

    clearAll() {
        // TODO
    }

    init(s: string) {
        let lines = s.split("\n");
        for (let y = 0; y < lines.length; y++) {
            if (y >= this.sizeY) break;
            let line = lines[y];
            for (let x = 0; x < line.length; x++) {
                if (x >= this.sizeX) break;
                let sprite = this.columns[x][y];
                let c = line.charAt(x).toLocaleLowerCase();
                if (c == 'm') {
                    sprite.setWall(true);
                } else {
                    let code = c.charCodeAt(0);
                    let grainCount = 0;
                    if (code >= 97 && code <= 102) grainCount = code - 97 + 10; // a ... f
                    if (code >= 49 && code <= 57) grainCount = code - 49 + 1; // 1 ... 9
                    if (grainCount > 0) {
                        sprite.setGrainCount(grainCount)
                    }
                }
            }
        }
    }

    public destroy(): void {
        for (let columnArray of this.columns) {
            for (let sprite of columnArray) {
                sprite.destroy();
            }
        }

        this.backgroundGraphics.destroy();
        this.hamsters.forEach((h) => h.destroy());
        this.belowWorldText.destroy();

        super.destroy();

    }
}


export class HamsterClass extends Klass {

    constructor(module: Module) {

        super("Hamster", module, "JavaHamster-Marienkäfer");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));

        this.addAttribute(new Attribute("NORD", intPrimitiveType, (value) => { value.value = 0 }, true, Visibility.public, true, "Direction NORD"));
        this.addAttribute(new Attribute("OST", intPrimitiveType, (value) => { value.value = 1 }, true, Visibility.public, true, "Direction OST"));
        this.addAttribute(new Attribute("SÜD", intPrimitiveType, (value) => { value.value = 2 }, true, Visibility.public, true, "Direction SÜD"));
        this.addAttribute(new Attribute("WEST", intPrimitiveType, (value) => { value.value = 3 }, true, Visibility.public, true, "Direction WEST"));

        this.staticClass.setupAttributeIndicesRecursive();
        this.staticClass.classObject = new RuntimeObject(this.staticClass);

        let HamsterWorldClass = <Klass>module.typeStore.getType("JavaHamsterWorld");

        this.addMethod(new Method("Hamster", new Parameterlist([
            { identifier: "javaHamsterWorld", type: HamsterWorldClass, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "reihe", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "spalte", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "blickrichtung", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "anzahlKörner", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {
                let o: RuntimeObject = parameters[0].value;
                let world: RuntimeObject = parameters[1].value;
                let x: number = parameters[3].value;
                let y: number = parameters[2].value;
                let direction: number = parameters[4].value;
                let grainCount: number = parameters[5].value;

                if (world == null) {
                    module.main.getInterpreter().throwException("Der Parameter javaHamsterWorld darf nicht null sein.");
                    return;
                }

                let rh = new HamsterSpriteHelper(world.intrinsicData["Actor"], x, y, direction, grainCount);

                o.intrinsicData["Helper"] = rh;

            }, false, false, 'Instanziert ein neues Hamster-Objekt', true));

        this.addMethod(new Method("vor", new Parameterlist([]
        ), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: HamsterSpriteHelper = o.intrinsicData["Helper"];

                if (sh.testDestroyed("vor")) return;
                sh.forward();

                return;

            }, false, false, "Bewegt Hamster um ein Feld nach vorne.", false));

        this.addMethod(new Method("getWorld", new Parameterlist([]
        ), HamsterWorldClass,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: HamsterSpriteHelper = o.intrinsicData["Helper"];
                if (sh.testDestroyed("getWorld")) return;

                return sh.world.runtimeObject;

            }, false, false, "Gibt das JavaHamsterWorld-Objekt zurück, in dem sich Hamster befindet.", false));

        this.addMethod(new Method("getBlickrichtung", new Parameterlist([]
        ), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: HamsterSpriteHelper = o.intrinsicData["Helper"];
                if (sh.testDestroyed("getBlickrichtung")) return;

                return sh.direction;

            }, false, false, "Gibt die Blickrichtung von Hamster zurück: 0 == Norden, 1 == Osten, 2 == Süden, 3 == Westen", false));

        this.addMethod(new Method("getReihe", new Parameterlist([]
        ), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: HamsterSpriteHelper = o.intrinsicData["Helper"];
                if (sh.testDestroyed("getReihe")) return;

                return sh.y;

            }, false, false, "Gibt die Reihe zurück, in der sich der Hamster gerade befindet. Reihe 0 ist ganz oben.", false));

        this.addMethod(new Method("getSpalte", new Parameterlist([]
        ), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: HamsterSpriteHelper = o.intrinsicData["Helper"];
                if (sh.testDestroyed("getSpalte")) return;

                return sh.y;

            }, false, false, "Gibt die Spalte zurück, in der sich der Hamster gerade befindet. Reihe 0 ist ganz links.", false));

        this.addMethod(new Method("getAnzahlKoerner", new Parameterlist([]
        ), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: HamsterSpriteHelper = o.intrinsicData["Helper"];
                if (sh.testDestroyed("getAnzahlKörner")) return;

                return sh.grainCount;

            }, false, false, "Gibt die Anzahl der Körner zurück, die der Hamster gerade im Mund hat.", false));

        this.addMethod(new Method("linksUm", new Parameterlist([]
        ), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: HamsterSpriteHelper = o.intrinsicData["Helper"];
                if (sh.testDestroyed("linksUm")) return;

                sh.turn(-1);

                return;

            }, false, false, "Dreht Hamster um 90° nach links", false));

        this.addMethod(new Method("gib", new Parameterlist([]
        ), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: HamsterSpriteHelper = o.intrinsicData["Helper"];
                if (sh.testDestroyed("gib")) return;

                sh.give();

                return;

            }, false, false, "Dreht Hamster legt ein Korn in der Zelle ab, in der er sich gerade befindet.", false));

        this.addMethod(new Method("nimm", new Parameterlist([]
        ), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: HamsterSpriteHelper = o.intrinsicData["Helper"];
                if (sh.testDestroyed("nimm")) return;

                sh.take();

                return;

            }, false, false, "Dreht Hamster nimmt ein Korn aus der Zelle, in der er sich gerade befindet.", false));

        this.addMethod(new Method("vornFrei", new Parameterlist([]
        ), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: HamsterSpriteHelper = o.intrinsicData["Helper"];
                if (sh.testDestroyed("vornFrei")) return;

                return sh.nextCellFree();


            }, false, false, "Liefert genau dann true, wenn sich in Blickrichtung vor dem aufgerufenen Hamster keine Mauer befindet (wenn sich der Hamster in Blickrichtung am Rand des Territoriums befindet, wird false geliefert)", false));

        this.addMethod(new Method("maulLeer", new Parameterlist([]
        ), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: HamsterSpriteHelper = o.intrinsicData["Helper"];
                if (sh.testDestroyed("maulLeer")) return;

                return sh.grainCount == 0;

            }, false, false, "Liefert genau dann true, wenn der Hamster keine Körner im Mund hat.", false));

        this.addMethod(new Method("kornDa", new Parameterlist([]
        ), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: HamsterSpriteHelper = o.intrinsicData["Helper"];
                if (sh.testDestroyed("kornDa")) return;

                return sh.sitsOnGrain();

            }, false, false, "Liefert genau dann true, wenn sich in der Zelle, auf der der Hamster sich befindet, mindestens ein Korn befindet.", false));

        this.addMethod(new Method("schreib", new Parameterlist([
            { identifier: "text", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]
        ), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let text: string = parameters[1].value;
                let sh: HamsterSpriteHelper = o.intrinsicData["Helper"];
                if (sh.testDestroyed("schreib")) return;

                if (!text.endsWith("\\n")) text += "\n";

                module.main.getInterpreter().printManager.print(text);

            }, false, false, "Gibt den Text auf dem Bildschirm aus.", false));



    }


}


type HamsterDirection = {
    index: number,
    dx: number,
    dy: number
}

class HamsterSpriteHelper {

    static directions: HamsterDirection[] = [{ index: 0, dx: 0, dy: -1 }, { index: 1, dx: 1, dy: 0 }, { index: 2, dx: 0, dy: 1 }, { index: 3, dx: -1, dy: 0 }];

    sprite: PIXI.Sprite;

    constructor(public world: JavaHamsterWorldHelper, public x: number, public y: number, public direction: number, public grainCount: number) {
        let sheet = PIXI.Assets.get('spritesheet');

        let texture = sheet.textures["Hamster#" + 0];
        texture.baseTexture.scaleMode = 0;
        this.sprite = new PIXI.Sprite(texture);
        this.sprite.anchor.x = 0.5;
        this.sprite.anchor.y = 0.5;
        this.move(world.left + (x + 0.5) * world.cellWidth, world.top + (y + 0.5) * world.cellWidth);

        (<PIXI.Container>world.displayObject).addChild(this.sprite);
        this.direction = 2;
        this.setDirection(direction);

        world.hamsters.push(this);

    }

    writeBelowWorldText(){
        if(this.world.hamsters.length == 1){
            this.world.belowWorldText.text = `Hamster: ${this.grainCount}, Zelle: ${this.world.getGrainCount(this.x, this.y)}`;    
        }
    }

    testDestroyed(method: string): boolean {
        if (this.sprite.destroyed) {
            this.throwException("Die Methode " + method + " eines schon zerstörten Hamsters wurde aufgerufen.");
            return true;
        }
        return false;
    }

    destroy(): void {
        this.sprite.destroy();
    }

    forward() {
        let direction = HamsterSpriteHelper.directions[this.direction];
        let newX = (this.x + direction.dx + this.world.sizeX) % this.world.sizeX;
        let newY = (this.y + direction.dy + this.world.sizeY) % this.world.sizeY;

        if (this.world.isOutside(newX, newY)) {
            this.throwException(`Die neue Position (${newX}, ${newY}) ist außerhalb der Welt. Der Hamster kann daher nicht weitergehen.`);
            return;
        }

        if (this.world.isWall(newX, newY)) {
            this.throwException(`An der neuen Position (${newX}, ${newY}) befindet sich eine Mauer. Der Hamster kann daher nicht weitergehen.`);
            return;
        }

        this.moveToCell(newX, newY);
        this.writeBelowWorldText();
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
    }

    setDirection(direction: number) {
        let d = (direction - this.direction + 4) % 4;
        let centerX = this.world.left + (this.x + 0.5) * this.world.cellWidth;
        let centerY = this.world.top + (this.y + 0.5) * this.world.cellWidth;

        this.sprite.localTransform.translate(-centerX, -centerY);
        this.sprite.localTransform.rotate(d * Math.PI / 2);
        this.sprite.localTransform.translate(centerX, centerY);
        //@ts-ignore
        this.sprite.transform.onChange();
        this.direction = direction;
    }

    getPositionInDirection(dirDelta: number) {
        let dir = HamsterSpriteHelper.directions[(this.direction + dirDelta + 4) % 4];
        return { x: (this.x + dir.dx + this.world.sizeX) % this.world.sizeX, y: (this.y + dir.dy + this.world.sizeY) % this.world.sizeY };

    }

    setPosition(x: any, y: any) {
        if (x < 0) x = -x - 1 + this.world.sizeX;
        if (y < 0) y = -y - 1 + this.world.sizeY;
        this.moveToCell(x % this.world.sizeX, y % this.world.sizeY);
    }

    give() {
        if (this.grainCount <= 0) {
            this.throwException("Der Hamster hat kein Korn mehr, das er ablegen könnte.");
            return;
        }
        this.grainCount--;
        this.world.setGrain(this.x, this.y, this.world.getGrainCount(this.x, this.y) + 1);
        this.writeBelowWorldText();
    }

    take() {
        if (this.world.getGrainCount(this.x, this.y) <= 0) {
            this.throwException("In der Zelle, in der sich der Hamster befindet, liegt kein Korn. Der Hamster kann daher keines nehmen.");
            return;
        }
        this.grainCount++;
        this.world.setGrain(this.x, this.y, this.world.getGrainCount(this.x, this.y) - 1);
        this.writeBelowWorldText();
    }

    nextCellFree(): boolean {
        let direction = HamsterSpriteHelper.directions[this.direction];
        let newX = (this.x + direction.dx + this.world.sizeX) % this.world.sizeX;
        let newY = (this.y + direction.dy + this.world.sizeY) % this.world.sizeY;
        if (this.world.isOutside(newX, newY)) return false;
        return !this.world.isWall(newX, newY);
    }

    sitsOnGrain(): boolean {
        return this.world.getGrainCount(this.x, this.y) > 0;
    }

}


class WallGrainSprite {

    wallSprite: PIXI.Sprite;
    grainSprite: PIXI.Sprite;
    grainText: PIXI.Text;

    private grainCount: number = 0;
    private _isWall: boolean = false;

    constructor(public world: JavaHamsterWorldHelper, public x: number, public y: number) {
        let sheet = PIXI.Assets.get('spritesheet');

        let container = <PIXI.Container>world.displayObject;
        let xm = world.left + (x + 0.5) * world.cellWidth;
        let ym = world.top + (y + 0.5) * world.cellWidth;

        let grainTexture = sheet.textures["Hamster#1"];
        grainTexture.baseTexture.scaleMode = 0;
        this.grainSprite = new PIXI.Sprite(grainTexture);
        this.move(xm, ym, this.grainSprite);
        this.grainSprite.anchor.x = 0.5;
        this.grainSprite.anchor.y = 0.5;

        container.addChild(this.grainSprite);

        let wallTexture = sheet.textures["Hamster#2"];
        wallTexture.baseTexture.scaleMode = 0;
        this.wallSprite = new PIXI.Sprite(wallTexture);
        this.move(xm, ym, this.wallSprite);
        this.wallSprite.anchor.x = 0.5;
        this.wallSprite.anchor.y = 0.5;

        container.addChild(this.wallSprite);

        this.grainText = new PIXI.Text("0", new PIXI.TextStyle({
            fontFamily: "sans-serif",
            fontSize: 24,
            fontStyle: 'normal',
            fontWeight: 'normal',
            fill: 0x000000,
            stroke: '#ffffff40',
            strokeThickness: 2,
            align: "center",
        }));

        this.grainText.anchor.x = 0.5;
        this.grainText.anchor.y = 0.5;
        this.move(xm, ym, this.grainText);

        container.addChild(this.grainText);

        this.grainSprite.visible = false;
        this.wallSprite.visible = false;
        this.grainText.visible = false;

    }

    private move(dx: number, dy: number, displayObject: PIXI.DisplayObject) {
        displayObject.localTransform.translate(dx, dy);
        //@ts-ignore
        displayObject.transform.onChange();
    }

    setGrainCount(n: number) {
        this.grainSprite.visible = n > 0;
        this.grainText.visible = n > 0;
        this.grainText.text = "" + n;
        this.grainCount = n;
    }

    getGrainCount(): number { return this.grainCount }

    isWall(): boolean { return this._isWall }

    setWall(isWall: boolean) {
        this._isWall = isWall;
        this.wallSprite.visible = isWall;
    }

    destroy() {
        this.wallSprite.destroy();
        this.grainSprite.destroy();
        this.grainText.destroy();
    }
}

