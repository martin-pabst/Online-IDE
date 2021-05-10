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
// import * as PIXI from "pixi.js";

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

                let rh = new SpriteHelper(x, y, spriteLibraryEntry.enumValue.identifier, index, module.main.getInterpreter(), o, scaleMode.enumValue.identifier);
                o.intrinsicData["Actor"] = rh;

            }, false, false, 'Instanziert ein neues Sprite und stellt es an der Position (x, y) dar. Falls scale ungleich 1 ist wird die Bitmap des Sprites VOR dem Rendern um den Faktor scale gestreckt. Dabei wird die nearest neighbour-Interpolation verwendet damit aus Einzelpixeln schöne Quadrate werden. SpriteLibraryEntry ist ein Auzählungstyp (enum). Gib einfach SpriteLibraryEntry gefolgt von einem Punkt ein, dann erhältst Du ein Auswahl von Bildern. Einen Überblick über die Bilder bekommst Du auch über den Menüpunkt Hilfe->Sprite-Bilderübersicht.', true));

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

            }, false, false, 'Instanziert ein neues Sprite und stellt es an der Position (x, y) dar. SpriteLibraryEntry ist ein Auzählungstyp (enum). Gib einfach SpriteLibraryEntry gefolgt von einem Punkt ein, dann erhältst Du ein Auswahl von Bildern. Einen Überblick über die Bilder bekommst Du auch über den Menüpunkt Hilfe->Sprite-Bilderübersicht.', true));

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

                if (sh.testdestroyed("setImage")) return;

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

                if (sh.testdestroyed("setImage")) return;

                sh.setTexture(spriteLibraryEntry.enumValue.identifier, index);

            }, false, false, 'Ändert das Bild des Sprites. SpriteLibraryEntry ist ein Auzählungstyp (enum). Gib einfach SpriteLibraryEntry gefolgt von einem Punkt ein, dann erhältst Du ein Auswahl von Bildern. Einen Überblick über die Bilder bekommst Du auch über den Menüpunkt Hilfe->Sprite-Bilderübersicht.', false));

        this.addMethod(new Method("setImageIndex", new Parameterlist([
            { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let index: number = parameters[1].value;
                let sh: SpriteHelper = <SpriteHelper>o.intrinsicData["Actor"];

                if (sh.testdestroyed("setImage")) return;

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

                sh.playAnimation(indices, repeatType.enumValue.identifier, imagesPerSecond);

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

                if (fromIndex < toIndex && toIndex - fromIndex < 10000) {
                    for (let i = fromIndex; i < toIndex; i++) indices.push(i);
                }

                sh.playAnimation(indices, repeatType.enumValue.identifier, imagesPerSecond);

            }, false, false, 'Spielt eine Animation ab.', false));

        this.addMethod(new Method("stopAnimation", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sh: SpriteHelper = <SpriteHelper>o.intrinsicData["Actor"];

                if (sh.testdestroyed("stopAnimation")) return;

                sh.stopAnimation(true);

            }, false, false, 'Stoppt die gerade laufende Animation und macht das Sprite unsichtbar.', false));

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

    }

}

export class SpriteHelper extends ShapeHelper {

    animationIndices: number[] = [];
    animationRuns: boolean = false;
    imagesPerMillisecond: number = 1;
    animationTime: number = 0;
    animationPaused: boolean = false;

    repeatType = "once";
    textureName: string = "";

    constructor(public x: number, public y: number, public name: string, public index: number,
        interpreter: Interpreter, runtimeObject: RuntimeObject,
        public scaleMode: string = "linear") {
        super(interpreter, runtimeObject);

        this.setTexture(null, index);

        let sprite = <PIXI.Sprite>this.displayObject;

        this.displayObject.localTransform.translate(this.x - sprite.width / 2, this.y - sprite.height / 2);
        //@ts-ignore
        this.displayObject.transform.onChange();

        this.worldHelper.stage.addChild(sprite);


        this.centerXInitial = sprite.width / 2;
        this.centerYInitial = sprite.height / 2;

        this.addToDefaultGroup();

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

        let prefix = "";
        //@ts-ignore
        if (window.javaOnlineDir != null) {
            //@ts-ignore
            prefix = window.javaOnlineDir;
        }

        let sheet = PIXI.Loader.shared.resources[prefix + "assets/graphics/spritesheet.json"];
        let nameWithIndex = name + "#" + index;
        let texture = sheet.textures[nameWithIndex];

        if (texture != null) {

            if (this.scaleMode == "nearest_neighbour") {

                let t = this.worldHelper.scaledTextures[nameWithIndex];

                if (t == null) {
                    let sprite = new PIXI.Sprite(texture);

                    let dynamicTexture1 = PIXI.RenderTexture.create({
                        width: sprite.width,
                        height: sprite.height,
                        scaleMode: PIXI.SCALE_MODES.NEAREST
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

            this.hitPolygonInitial = HitPolygonStore.getPolygonForTexture(name, index, this, new PIXI.Sprite(sheet.textures[nameWithIndex]));
            this.hitPolygonDirty = true;

        } else {
            if (this.displayObject == null) {
                this.displayObject = new PIXI.Sprite();
            }
        }


    }

    render(): void {

    };

    playAnimation(indexArray: number[], repeatType: string, imagesPerSecond: number) {
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
            spriteHelperList.splice(i, 1);
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

        if (this.repeatType == "backAndForth") {
            let period2 = this.animationIndices.length * 2 / this.imagesPerMillisecond;
            let numberOfPeriodsDone = Math.trunc(this.animationTime / period2);
            let timeIntoPeriod = this.animationTime - numberOfPeriodsDone * period2;
            image = this.imagesPerMillisecond * timeIntoPeriod;
            if (image >= this.animationIndices.length) {
                image = 2 * this.animationIndices.length - image;
            }
            image = Math.trunc(image);
        } else
            if (this.repeatType == "loop") {
                let period = this.animationIndices.length / this.imagesPerMillisecond;
                let numberOfPeriodsDone = Math.trunc(this.animationTime / period);
                let timeIntoPeriod = this.animationTime - numberOfPeriodsDone * period;
                image = this.imagesPerMillisecond * timeIntoPeriod;
                image = Math.trunc(image);
            } else {
                image = Math.trunc(this.imagesPerMillisecond * this.animationTime);
                if (image >= this.animationIndices.length) {
                    this.stopAnimation(true);
                    return;
                }
            }

        this.animationTime += deltaTime;

        this.setTexture(null, this.animationIndices[image]);
    }

}
