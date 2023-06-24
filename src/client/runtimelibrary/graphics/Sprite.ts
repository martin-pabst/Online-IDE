import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { doublePrimitiveType, intPrimitiveType, voidPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist, Value } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { FilledShapeHelper } from "./FilledShape.js";
import { WorldHelper } from "./World.js";
import { EnumRuntimeObject } from "../../compiler/types/Enum.js";
import { ShapeHelper } from "./Shape.js";
import { HitPolygonStore } from "./PolygonStore.js";
import { ArrayType } from "../../compiler/types/Array.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import { SpriteLibraryPage } from "../../help/SpriteLibraryPage.js";
import { RenderTexture } from "@pixi/core";
import { convexhull } from "../../tools/ConvexHull.js";
import { GroupHelper } from "./Group.js";
import * as PIXI from 'pixi.js';
import { RepeatType } from "./RepeatType.js";
export class SpriteClass extends Klass {

    constructor(module: Module) {

        super("Sprite", module, "Ein Sprite ist eine kleine Pixelgrafik, die verschoben, gedreht und skaliert werden kann. Zudem besitzt es Methoden zum Erkennen von Kollisionen mit anderen grafischen Objekten.");

        this.setBaseClass(<Klass>module.typeStore.getType("Shape"));

        let scaleModeClass = <Klass>module.typeStore.getType("ScaleMode")

        // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));

        this.addMethod(new Method("Sprite", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "spriteLibraryEntry", type: module.typeStore.getType("SpriteLibrary"), declaration: null, usagePositions: null, isFinal: true },
            { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "scalemode", type: scaleModeClass, declaration: null, usagePositions: null, isFinal: true },

        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let spriteLibraryEntry: EnumRuntimeObject = parameters[3].value;
                let index: number = parameters[4].value;
                let scaleMode: EnumRuntimeObject = parameters[5].value;

                let rh = new SpriteHelper(x, y, spriteLibraryEntry.enumValue.identifier, index, module.main.getInterpreter(), o, null, scaleMode.enumValue.identifier);
                o.intrinsicData["Actor"] = rh;

            }, false, false, 'Instanziert ein neues Sprite und stellt es an der Position (x, y) dar. SpriteLibraryEntry ist ein Auzählungstyp (enum). Gib einfach SpriteLibraryEntry gefolgt von einem Punkt ein, dann erhältst Du ein Auswahl von Bildern. Einen Überblick über die Bilder bekommst Du auch über den Menüpunkt Hilfe->Sprite-Bilderübersicht.', true));

        this.addMethod(new Method("Sprite", new Parameterlist([
            { identifier: "shape", type: module.typeStore.getType("Shape"), declaration: null, usagePositions: null, isFinal: true },
            { identifier: "scalemode", type: scaleModeClass, declaration: null, usagePositions: null, isFinal: true },

        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let shape: RuntimeObject = parameters[1].value;
                let scaleMode: EnumRuntimeObject = parameters[2].value;

                if (shape == null) {
                    module.main.getInterpreter().throwException("Die übergebene Figur ist null.");
                    return;
                }

                let rh = new SpriteHelper(0, 0, "", 0, module.main.getInterpreter(), o, shape.intrinsicData["Actor"], scaleMode.enumValue.identifier);
                o.intrinsicData["Actor"] = rh;

            }, false, false, 'Zeichnet das graphische Objekt (shape) in eine Bitmap und macht daraus ein Sprite. Dieses wird an der Position (x, y) dargestellt.', true));

        this.addMethod(new Method("Sprite", new Parameterlist([
            { identifier: "shape", type: module.typeStore.getType("Shape"), declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let shape: RuntimeObject = parameters[1].value;

                if (shape == null) {
                    module.main.getInterpreter().throwException("Die übergebene Figur ist null.");
                    return;
                }

                let rh = new SpriteHelper(0, 0, "", 0, module.main.getInterpreter(), o, shape.intrinsicData["Actor"], "linear");
                o.intrinsicData["Actor"] = rh;

            }, false, false, 'Zeichnet das graphische Objekt (shape) in eine Bitmap und macht daraus ein Sprite. Dieses wird an der Position (x, y) dargestellt.', true));

        this.addMethod(new Method("Sprite", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "spriteLibraryEntry", type: module.typeStore.getType("SpriteLibrary"), declaration: null, usagePositions: null, isFinal: true },
            { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },

        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let spriteLibraryEntry: EnumRuntimeObject = parameters[3].value;
                let index: number = parameters[4].value;

                let rh = new SpriteHelper(x, y, spriteLibraryEntry.enumValue.identifier, index, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = rh;

            }, false, false, 'Instanziert ein neues Sprite und stellt es an der Position (x, y) dar. SpriteLibraryEntry ist ein Aufzählungstyp (enum). Gib einfach SpriteLibraryEntry gefolgt von einem Punkt ein, dann erhältst Du ein Auswahl von Bildern. Einen Überblick über die Bilder bekommst Du auch über den Menüpunkt Hilfe->Sprite-Bilderübersicht.', true));

        this.addMethod(new Method("Sprite", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "spriteLibraryEntry", type: module.typeStore.getType("SpriteLibrary"), declaration: null, usagePositions: null, isFinal: true },

        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let spriteLibraryEntry: EnumRuntimeObject = parameters[3].value;

                let rh = new SpriteHelper(x, y, spriteLibraryEntry.enumValue.identifier, null, module.main.getInterpreter(), o);
                o.intrinsicData["Actor"] = rh;

            }, false, false, 'Instanziert ein neues Sprite und stellt es an der Position (x, y) dar. SpriteLibraryEntry ist ein Auzählungstyp (enum). Gib einfach SpriteLibraryEntry gefolgt von einem Punkt ein, dann erhältst Du ein Auswahl von Bildern. Einen Überblick über die Bilder bekommst Du auch über den Menüpunkt Hilfe->Sprite-Bilderübersicht.', true));

        this.addMethod(new Method("setImage", new Parameterlist([
            { identifier: "spriteLibraryEntry", type: module.typeStore.getType("SpriteLibrary"), declaration: null, usagePositions: null, isFinal: true },

        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let spriteLibraryEntry: EnumRuntimeObject = parameters[1].value;
                let sh: SpriteHelper = <SpriteHelper>o.intrinsicData["Actor"];

                if (sh.isDestroyed) return;

                sh.setTexture(spriteLibraryEntry.enumValue.identifier);

            }, false, false, 'Ändert das Bild des Sprites. SpriteLibraryEntry ist ein Auzählungstyp (enum). Gib einfach SpriteLibraryEntry gefolgt von einem Punkt ein, dann erhältst Du ein Auswahl von Bildern. Einen Überblick über die Bilder bekommst Du auch über den Menüpunkt Hilfe->Sprite-Bilderübersicht.', false));

        this.addMethod(new Method("setImage", new Parameterlist([
            { identifier: "spriteLibraryEntry", type: module.typeStore.getType("SpriteLibrary"), declaration: null, usagePositions: null, isFinal: true },
            { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },

        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let spriteLibraryEntry: EnumRuntimeObject = parameters[1].value;
                let index: number = parameters[2].value;
                let sh: SpriteHelper = <SpriteHelper>o.intrinsicData["Actor"];

                if (sh.isDestroyed) return;

                sh.setTexture(spriteLibraryEntry.enumValue.identifier, index);

            }, false, false, 'Ändert das Bild des Sprites. SpriteLibraryEntry ist ein Auzählungstyp (enum). Gib einfach SpriteLibraryEntry gefolgt von einem Punkt ein, dann erhältst Du ein Auswahl von Bildern. Einen Überblick über die Bilder bekommst Du auch über den Menüpunkt Hilfe->Sprite-Bilderübersicht.', false));

        this.addMethod(new Method("setImageIndex", new Parameterlist([
            { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let index: number = parameters[1].value;
                let sh: SpriteHelper = <SpriteHelper>o.intrinsicData["Actor"];

                if (sh.isDestroyed) return;


                sh.setTexture(sh.textureName, index);

            }, false, false, 'Ändert den Bildindex des Sprites.', false));

        this.addMethod(new Method("playAnimation", new Parameterlist([
            { identifier: "indexArray", type: new ArrayType(intPrimitiveType), declaration: null, usagePositions: null, isFinal: true },
            { identifier: "repeatType", type: module.typeStore.getType("RepeatType"), declaration: null, usagePositions: null, isFinal: true },
            { identifier: "imagesPerSecond", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },

        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let indexArray: Value[] = parameters[1].value;
                let repeatType: EnumRuntimeObject = parameters[2].value;
                let imagesPerSecond: number = parameters[3].value;
                let sh: SpriteHelper = <SpriteHelper>o.intrinsicData["Actor"];

                let indices: number[] = [];
                for (let v of indexArray) {
                    indices.push(v.value);
                }

                if (sh.testdestroyed("playAnimation")) return;

                sh.playAnimation(indices, <RepeatType>repeatType.enumValue.identifier, imagesPerSecond);

            }, false, false, 'Spielt eine Animation ab.', false));

        this.addMethod(new Method("playAnimation", new Parameterlist([
            { identifier: "fromIndex", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "toIndex", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "repeatType", type: module.typeStore.getType("RepeatType"), declaration: null, usagePositions: null, isFinal: true },
            { identifier: "imagesPerSecond", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },

        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let fromIndex: number = parameters[1].value;
                let toIndex: number = parameters[2].value;
                let repeatType: EnumRuntimeObject = parameters[3].value;
                let imagesPerSecond: number = parameters[4].value;
                let sh: SpriteHelper = <SpriteHelper>o.intrinsicData["Actor"];

                if (sh.testdestroyed("playAnimation")) return;

                let indices: number[] = [];

                if (Math.abs(toIndex - fromIndex) < 10000) {
                    let delta = Math.sign(toIndex - fromIndex);
                    for (let i = fromIndex; i != toIndex; i = i + delta) indices.push(i);
                    indices.push(toIndex);
                }

                sh.playAnimation(indices, <RepeatType>repeatType.enumValue.identifier, imagesPerSecond);

            }, false, false, 'Spielt eine Animation ab.', false));

        this.addMethod(new Method("stopAnimation", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: SpriteHelper = <SpriteHelper>o.intrinsicData["Actor"];

                if (sh.isDestroyed) return;

                sh.stopAnimation(false);

            }, false, false, 'Stoppt die gerade laufende Animation', false));

        this.addMethod(new Method("pauseAnimation", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: SpriteHelper = <SpriteHelper>o.intrinsicData["Actor"];

                if (sh.testdestroyed("pauseAnimation")) return;

                sh.pauseAnimation();

            }, false, false, 'Pausiert die laufende Animation.', false));

        this.addMethod(new Method("resumeAnimation", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: SpriteHelper = <SpriteHelper>o.intrinsicData["Actor"];

                if (sh.testdestroyed("resumeAnimation")) return;

                sh.resumeAnimation();

            }, false, false, 'Fährt mit einer pausierten Animation wieder fort.', false));

        this.addMethod(new Method("setAlpha", new Parameterlist([
            { identifier: "alphaValue", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let alpha: number = parameters[1].value;
                let sh: SpriteHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("setAlpha")) return;

                sh.setAlpha(alpha);

            }, false, false, 'Setzt die Durchsichtigkeit. 0.0 bedeutet vollkommen durchsichtig, 1.0 bedeutet vollkommen undurchsichtig.', false));

        this.addMethod(new Method("copy", new Parameterlist([
        ]), this,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: SpriteHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("copy")) return;

                return sh.getCopy(<Klass>o.class);

            }, false, false, 'Erstellt eine Kopie des Sprite-Objekts und git sie zurück.', false));


        this.addMethod(new Method("getWidth", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: SpriteHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getWidth")) return;

                return sh.getWidth();

            }, false, false, "Gibt die Breite zurück.", false));

        this.addMethod(new Method("getHeight", new Parameterlist([
        ]), doublePrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: SpriteHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getHeight")) return;

                return sh.getHeight();

            }, false, false, "Gibt die Höhe zurück.", false));

        this.addMethod(new Method("getImageIndex", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: SpriteHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getImageIndex")) return;

                return sh.index;

            }, false, false, "Gibt den Index des Bildes innerhalb der Sprite-Library zurück.", false));

        this.addMethod(new Method("makeTiling", new Parameterlist([
            { identifier: "width", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "height", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let width: number = parameters[1].value;
                let height: number = parameters[2].value;
                let sh: SpriteHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("makeTiling")) return;

                sh.makeTiling(width, height, 0, 0);

            }, false, false, "Fügt das identische Bild nach rechts und unten kachelartig ('tile'!) so oft hinzu, bis die angegebene Breite erreicht ist. \nTIPP: Mit der Methode getTileImage() erhält man ein Tile-Objekt, dessen Methoden move, scale, mirrorX und mirrorY sich gleichzeitig auf jede einzelne Kachel auswirken.", false));

        this.addMethod(new Method("makeTiling", new Parameterlist([
            { identifier: "width", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "height", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "gapX", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "gapY", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let width: number = parameters[1].value;
                let height: number = parameters[2].value;
                let gapX: number = parameters[3].value;
                let gapY: number = parameters[4].value;
                let sh: SpriteHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("makeTiling")) return;

                sh.makeTiling(width, height, gapX, gapY);

            }, false, false, "Fügt das identische Bild nach rechts und unten kachelartig ('tile'!) so oft hinzu, bis die angegebene Breite erreicht ist. \nTIPP: Mit der Methode getTileImage() erhält man ein Tile-Objekt, dessen Methoden move, scale, mirrorX und mirrorY sich gleichzeitig auf jede einzelne Kachel auswirken. GapX und GapY sind die Abstände, die zwischen den einzelnen Kacheln eingehalten werden.", false));

        this.addMethod(new Method("getTileImage", new Parameterlist([
        ]), <Klass>module.typeStore.getType("Tile"),
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: SpriteHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("getTileImage")) return;

                if (!sh.isTileSprite) {
                    sh.worldHelper.interpreter.throwException("Das Sprite hat kein TileImage. Sie müssen es zuerst mit der Methode makeTiling in ein Kachel-Sprite umwandeln.")
                    return;
                }

                let ret: RuntimeObject = new RuntimeObject(<Klass>module.typeStore.getType("Tile"));

                ret.intrinsicData["Actor"] = new TileHelper(sh);

                return ret;

            }, false, false, "Nachdem das Sprite mittels der Methode 'makeTiling' zum TileSprite gemacht wurde, kann wirken die Methoden move, scale und rotate immer auf den ganzen gekachelten Bereich. Will man das verfielfachte Bild ändern, so bekommt man über diese Methode das Sprite-Objekt, das diesem Bild entspricht. Ruft man für dieses Objekt die Methoden move, rotate oder scale auf, so wirken sie auf jede der einzelnen Kacheln.", false));

    }

}

export class SpriteHelper extends ShapeHelper {

    animationIndices: number[] = [];
    animationRuns: boolean = false;
    imagesPerMillisecond: number = 1;
    animationTime: number = 0;
    animationPaused: boolean = false;

    repeatType: RepeatType = "once";
    textureName: string = "";

    isTileSprite: boolean = false;

    constructor(public x: number, public y: number, public name: string, public index: number,
        private interpreter: Interpreter, runtimeObject: RuntimeObject, copyFromOtherShape?: ShapeHelper,
        public scaleMode: string = "nearest_neighbour") {
        super(interpreter, runtimeObject);

        if (copyFromOtherShape == null) {
            this.setTexture(null, index);
        } else {
            this.copyBitmapFromShape(copyFromOtherShape);
            let bounds = copyFromOtherShape.displayObject.getBounds();
            this.x = bounds.left + bounds.width / 2;
            this.y = bounds.top + bounds.height / 2;
        }

        let sprite = <PIXI.Sprite>this.displayObject;

        this.displayObject.localTransform.translate(this.x - sprite.width / 2, this.y - sprite.height / 2);
        //@ts-ignore
        this.displayObject.transform.onChange();

        this.worldHelper.stage.addChild(sprite);

        this.centerXInitial = sprite.width / 2;
        this.centerYInitial = sprite.height / 2;

        this.addToDefaultGroupAndSetDefaultVisibility();

    }

    oldTexture: PIXI.Texture;

    makeTiling(width: number, height: number, gapX: number, gapY: number) {
        width /= this.scaleFactor;
        height /= this.scaleFactor;
        let sprite: PIXI.Sprite = <PIXI.Sprite>this.displayObject;

        if (this.oldTexture == null) this.oldTexture = sprite.texture;

        let texture = this.oldTexture;
        if (gapX > 0 || gapY > 0) {
            texture = this.generateGapTexture(texture, gapX, gapY);
        }
        texture.baseTexture.mipmap = PIXI.MIPMAP_MODES.OFF;
        let tileSprite = new PIXI.TilingSprite(texture, width, height);
        tileSprite.setParent(sprite.parent);
        tileSprite.transform.localTransform.copyFrom(sprite.transform.localTransform);
        //@ts-ignore
        tileSprite.transform.onChange();
        tileSprite.updateTransform();
        // tileSprite.clampMargin = -0.5;
        this.displayObject = tileSprite;
        this.centerXInitial += -sprite.width / 2 + width / 2;
        this.centerYInitial += -sprite.height / 2 + height / 2;
        let left = this.centerXInitial - width / 2;
        let top = this.centerYInitial - height / 2;
        let right = left + width;
        let bottom = top + height;
        this.hitPolygonInitial = [
            { x: left, y: top }, { x: right, y: top }, { x: right, y: bottom }, { x: left, y: bottom }
        ];
        this.setHitPolygonDirty(true);
        sprite.destroy();
        this.isTileSprite = true;
    }

    generateGapTexture(texture, gapx: number, gapy: number) {
        const gapBox = new PIXI.Graphics()
        const originSprite = new PIXI.Sprite(texture)
        gapBox.lineStyle(1, 0x0, 0.01)
        gapBox.drawRect(0, 0, originSprite.width + gapx, originSprite.height + gapy)
        gapBox.addChild(originSprite)
        //@ts-ignore
        return this.worldHelper.app.renderer.generateTexture(gapBox);
    }

    setTileOffset(x: number, y: number) {
        if (this.isTileSprite) {
            let tileSprite: PIXI.TilingSprite = <PIXI.TilingSprite>this.displayObject;
            tileSprite.tilePosition.set(x, y);
        }
    }


    copyBitmapFromShape(copyFromOtherShape: ShapeHelper) {

        let bounds = copyFromOtherShape.displayObject.getBounds();

        let width = bounds.width;
        let height = bounds.height;

        const brt = new PIXI.BaseRenderTexture(
            {
                scaleMode: this.scaleMode == "nearest_neighbour" ? PIXI.SCALE_MODES.NEAREST : PIXI.SCALE_MODES.LINEAR,
                width: width,
                height: height
            }
        );
        let rt: PIXI.RenderTexture = new PIXI.RenderTexture(brt);

        let dob = copyFromOtherShape.displayObject;
        this.worldHelper.app.renderer.render(dob, {
            renderTexture: rt,
            transform: new PIXI.Matrix().translate(-bounds.left, -bounds.top)
        });

        let points: convexhull.Point[] = [];
        points = this.extractPoints(copyFromOtherShape, points);

        for (let p of points) {
            p.x -= bounds.left;
            p.y -= bounds.top;
        }

        this.hitPolygonInitial = points;
        this.hitPolygonInitial = convexhull.makeHull(points);

        this.hitPolygonDirty = true;

        this.displayObject = new PIXI.Sprite(rt);

        copyFromOtherShape.setHitPolygonDirty(true);

    }

    extractPoints(shapeHelper: ShapeHelper, points: convexhull.Point[]): convexhull.Point[] {
        if (shapeHelper instanceof GroupHelper) {
            for (let sh of shapeHelper.shapes) {
                points = this.extractPoints(sh.intrinsicData["Actor"], points);
            }
            return points;
        } else {
            if (shapeHelper.hitPolygonDirty) shapeHelper.transformHitPolygon();
            return points.concat(shapeHelper.hitPolygonTransformed.map(function (punkt) { return { x: punkt.x, y: punkt.y } }));

        }
    }

    getWidth(): number {
        let sprite = <PIXI.Sprite>this.displayObject;
        return sprite.width * this.scaleFactor;
    }

    getHeight(): number {
        let sprite = <PIXI.Sprite>this.displayObject;
        return sprite.height * this.scaleFactor;
    }

    getCopy(klass: Klass): RuntimeObject {

        let ro: RuntimeObject = new RuntimeObject(klass);
        let rh: SpriteHelper = new SpriteHelper(this.x, this.y, this.name, this.index, this.worldHelper.interpreter, ro);
        ro.intrinsicData["Actor"] = rh;

        rh.copyFrom(this);
        rh.render();

        return ro;
    }


    setAlpha(alpha: number) {
        this.displayObject.alpha = alpha;
    }

    setTexture(name?: string, index?: number) {

        if (name == this.name && index == this.index) return;

        if (name == null) name = this.name;
        if (index == null) index = 0;
        this.index = index;

        this.textureName = name;

        // let sheet = PIXI.Loader.shared.resources["spritesheet"].spritesheet;
        let sheet = PIXI.Assets.get('spritesheet');

        let nameWithIndex = name + "#" + index;
        let texture = sheet.textures[nameWithIndex];
        if (texture == null) {
            sheet = this.worldHelper.interpreter.main.userSpritesheet;
            texture = sheet?.textures[nameWithIndex];
        }

        if (texture != null) {
            texture.baseTexture.scaleMode = 0;
            if (this.scaleMode == "linear") {

                let t = this.worldHelper.scaledTextures[nameWithIndex];

                if (t == null) {
                    let sprite = new PIXI.Sprite(texture);

                    let dynamicTexture1 = PIXI.RenderTexture.create({
                        width: sprite.width,
                        height: sprite.height,
                        scaleMode: PIXI.SCALE_MODES.LINEAR
                    });

                    this.worldHelper.app.renderer.render(sprite, {
                        renderTexture: dynamicTexture1
                    });
                    this.worldHelper.scaledTextures[nameWithIndex] = dynamicTexture1;
                    t = dynamicTexture1;
                }

                texture = t;
                if (texture == null) texture = sheet.textures[nameWithIndex];

                // let t = this.worldHelper.scaledTextures[nameWithIndex][this.scaleOnTextureGeneration];
                // if( t != null){
                //     texture = t;
                // } else {
                //     let sprite = new PIXI.Sprite(texture);

                //     let dynamicTexture1 = PIXI.RenderTexture.create({
                //         width: sprite.width,
                //         height: sprite.height,
                //         scaleMode: PIXI.SCALE_MODES.NEAREST
                //     });

                //     this.worldHelper.app.renderer.render(sprite, dynamicTexture1, true);

                //     sprite = new PIXI.Sprite(dynamicTexture1);

                //     let dynamicTexture2 = PIXI.RenderTexture.create({
                //         width: sprite.width * this.scaleOnTextureGeneration,
                //         height: sprite.height * this.scaleOnTextureGeneration,
                //         scaleMode: PIXI.SCALE_MODES.LINEAR
                //     });

                //     let m = new PIXI.Matrix();
                //     m.scale(this.scaleOnTextureGeneration, this.scaleOnTextureGeneration);

                //     this.worldHelper.app.renderer.render(sprite, dynamicTexture2, true,
                //         m);

                //     texture = dynamicTexture2;

                //     this.worldHelper.scaledTextures[nameWithIndex][this.scaleOnTextureGeneration] = texture;
            }

            let sprite: PIXI.Sprite = <PIXI.Sprite>this.displayObject;
            if (sprite == null) {
                sprite = new PIXI.Sprite(texture);
                this.displayObject = sprite;
            } else {
                sprite.texture = texture; // sheet.textures[nameWithIndex];
            }

            if(!this.isTileSprite){
                this.hitPolygonInitial = HitPolygonStore.getPolygonForTexture(name, index, this, new PIXI.Sprite(sheet.textures[nameWithIndex]));
                this.hitPolygonDirty = true;
            }

        } else {
            this.interpreter.throwException("Das Spritesheet " + name + " hat kein Bild mit Index " + index);

            if (this.displayObject == null) {
                this.displayObject = new PIXI.Sprite();
            }
        }


    }

    render(): void {

    };

    playAnimation(indexArray: number[], repeatType: RepeatType, imagesPerSecond: number) {
        this.stopAnimation(false);
        this.animationIndices = indexArray;
        this.repeatType = repeatType;
        this.imagesPerMillisecond = imagesPerSecond / 1000;
        this.animationTime = 0;
        this.animationRuns = true;
        this.worldHelper.spriteAnimations.push(this);
    }

    stopAnimation(setInvisible: boolean) {
        if (this.animationRuns) {
            let spriteHelperList = this.worldHelper.spriteAnimations;
            let i = spriteHelperList.indexOf(this);
            if (i >= 0) spriteHelperList.splice(i, 1);
        }
        this.animationRuns = false;
        if (setInvisible) this.setVisible(false);
    }

    pauseAnimation() {
        this.animationPaused = true;
    }

    resumeAnimation() {
        this.animationPaused = false;
    }

    tick(deltaTime: number) {

        if (this.animationPaused) return;

        let image: number;

        switch (this.repeatType) {
            case "backAndForth":
                let period2 = this.animationIndices.length * 2 / this.imagesPerMillisecond;
                let numberOfPeriodsDone = Math.trunc(this.animationTime / period2);
                let timeIntoPeriod = this.animationTime - numberOfPeriodsDone * period2;
                image = this.imagesPerMillisecond * timeIntoPeriod;
                if (image >= this.animationIndices.length) {
                    image = Math.max(2 * this.animationIndices.length - 0.1 - image, 0);
                }
                image = Math.trunc(image);
                break;
            case "loop":
                let period = this.animationIndices.length / this.imagesPerMillisecond;
                let numberOfPeriodsDone1 = Math.trunc(this.animationTime / period);
                let timeIntoPeriod1 = this.animationTime - numberOfPeriodsDone1 * period;
                image = this.imagesPerMillisecond * timeIntoPeriod1;
                image = Math.trunc(image);
                image = Math.trunc(image);
                break;
            case "once":
                image = Math.trunc(this.imagesPerMillisecond * this.animationTime);
                if (image >= this.animationIndices.length) {
                    this.stopAnimation(true);
                    this.destroy();
                    return;
                }
                break;
        }

        this.animationTime += deltaTime;

        this.setTexture(null, this.animationIndices[image]);
    }

}

export class TileClass extends Klass {

    constructor(module: Module) {

        super("Tile", module, "Eine Kachel in einem Sprite, das mithilfe der Methode makeTiling zu einer Kachelfläche gemacht wurde.");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));

        this.addMethod(new Method("move", new Parameterlist([
            { identifier: "dx", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "dy", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let dx: number = parameters[1].value;
                let dy: number = parameters[2].value;
                let sh: TileHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("move")) return;

                sh.move(dx, dy);

            }, false, false, "Verschiebt das Grafikobjekt um dx Pixel nach rechts und um dy Pixel nach unten.", false));

        this.addMethod(new Method("scale", new Parameterlist([
            { identifier: "factor", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let factor: number = parameters[1].value;
                let sh: TileHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("scale")) return;

                sh.scale(factor, factor);

            }, false, false, "Streckt das Grafikobjekt um den angegebenen Faktor. Das Zentrum der Streckung ist der 'Mittelpunkt' des Objekts.", false));

        this.addMethod(new Method("mirrorX", new Parameterlist([
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TileHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("mirrorX")) return;

                sh.scale(-1, 1);

            }, false, false, "Spiegelt das Objekt in X-Richtung.", false));

        this.addMethod(new Method("mirrorY", new Parameterlist([
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: TileHelper = o.intrinsicData["Actor"];

                if (sh.testdestroyed("mirrorX")) return;

                sh.scale(1, -1);

            }, false, false, "Spiegelt das Objekt in Y-Richtung.", false));




    }
}


export class TileHelper {
    constructor(public spriteHelper: SpriteHelper) {
    }

    move(dx: number, dy: number) {
        let tileSprite: PIXI.TilingSprite = <PIXI.TilingSprite>this.spriteHelper.displayObject;
        tileSprite.tilePosition.x += dx;
        tileSprite.tilePosition.y += dy;
    }

    scale(fx: number, fy: number) {
        let tileSprite: PIXI.TilingSprite = <PIXI.TilingSprite>this.spriteHelper.displayObject;
        tileSprite.tileScale.x *= fx;
        tileSprite.tileScale.y *= fy;
    }

    testdestroyed(method: string) {
        return this.spriteHelper.testdestroyed(method);
    }


}