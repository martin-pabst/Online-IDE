import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { doublePrimitiveType, intPrimitiveType, stringPrimitiveType, voidPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist, Value } from "../../compiler/types/Types.js";
import { Interpreter, InterpreterState } from "../../interpreter/Interpreter.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { ActorHelper } from "./Actor.js";
import { ColorHelper } from "./ColorHelper.js";
import { FilledShapeDefaults } from "./FilledShapeDefaults.js";
import { GroupClass, GroupHelper } from "./Group.js";
import { MouseListenerInterface } from "./MouseListener.js";
import { ShapeClass, ShapeHelper } from "./Shape.js";
import { SpriteHelper } from "./Sprite.js";
import * as PIXI from 'pixi.js';
import jQuery from 'jquery';

export class WorldClass extends Klass {

    constructor(public module: Module) {

        super("World", module, "Grafische Zeichenfläche mit Koordinatensystem")

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));

        let groupType = <GroupClass>module.typeStore.getType("Group");
        let shapeType = <ShapeClass>module.typeStore.getType("Shape");
        let mouseListenerType = <MouseListenerInterface>module.typeStore.getType("MouseListener");

        // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));

        this.addMethod(new Method("World", new Parameterlist([
            { identifier: "breite", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "höhe", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let breite: number = parameters[1].value;
                let höhe: number = parameters[2].value;
                let gh: WorldHelper = this.getWorldHelper(o, breite, höhe);  //new WorldHelper(breite, höhe, this.module, o);
                o.intrinsicData["World"] = gh;

            }, false, false, "Legt einen neuen Grafikbereich (='Welt') an", true));

        this.addMethod(new Method("World", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let gh: WorldHelper = this.getWorldHelper(o); // new WorldHelper(800, 600, this.module, o);
                o.intrinsicData["World"] = gh;

            }, false, false, "Legt einen neuen Grafikbereich (='Welt') an. Das Koordinatensystem geht von 0 bis 800 in x-Richtung und von 0 - 600 in y-Richtung.", true));

        this.addMethod(new Method("setBackgroundColor", new Parameterlist([
            { identifier: "colorAsRGBInt", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let color: number = parameters[1].value;
                let wh: WorldHelper = o.intrinsicData["World"];

                wh.setBackgroundColor(color);

            }, false, false, 'Setzt die Hintergrundfarbe. Die Farbe wird als integer-Zahl erwartet. Am besten schreibt man sie als Hexadezimalzahl, also z.B. setBackgroundColor(0xff8080)."', false));

        this.addMethod(new Method("setBackgroundColor", new Parameterlist([
            { identifier: "colorAsRGBAString", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let color: string = parameters[1].value;
                let wh: WorldHelper = o.intrinsicData["World"];

                wh.setBackgroundColor(color);

            }, false, false, 'Setzt die Hintergrundfarbe. Die Farbe ist entweder eine vordefinierte Farbe ("schwarz", "rot", ...) oder eine css-Farbe der Art "#ffa7b3" (ohne alpha), "#ffa7b380" (mit alpha), "rgb(172, 22, 18)" oder "rgba(123, 22,18, 0.3)"', false));

        this.addMethod(new Method("move", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let x: number = parameters[1].value;
                let y: number = parameters[2].value;
                let wh: WorldHelper = o.intrinsicData["World"];

                let matrix = new PIXI.Matrix().copyFrom(wh.stage.projectionTransform);
                wh.stage.projectionTransform.identity();
                wh.stage.projectionTransform.translate(x, y);
                wh.stage.projectionTransform.prepend(matrix);

                wh.computeCurrentWorldBounds();
                wh.computeGraphicalControlsMatrix();
                wh.shapesNotAffectedByWorldTransforms.forEach((shape) => shape.move(-x, -y));

            }, false, false, 'Verschiebt alle Objekte der Welt um x nach rechts und y nach unten.', false));

        this.addMethod(new Method("follow", new Parameterlist([
            { identifier: "shape", type: shapeType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "margin", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "xMin", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "xMax", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "yMin", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "yMax", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let shape: RuntimeObject = parameters[1].value;
                let frameWidth: number = parameters[2].value;
                let xMin: number = parameters[3].value;
                let xMax: number = parameters[4].value;
                let yMin: number = parameters[5].value;
                let yMax: number = parameters[6].value;
                let wh: WorldHelper = o.intrinsicData["World"];

                let shapeHelper: ShapeHelper = shape.intrinsicData["Actor"];

                let moveX: number = 0;
                let moveY: number = 0;

                let shapeX: number = shapeHelper.getCenterX();
                let shapeY: number = shapeHelper.getCenterY();

                let outsideRight = shapeX - (wh.currentLeft + wh.currentWidth - frameWidth);
                if (outsideRight > 0 && wh.currentLeft + wh.currentWidth < xMax) {
                    moveX = -outsideRight;
                }

                let outsideLeft = (wh.currentLeft + frameWidth) - shapeX;
                if (outsideLeft > 0 && wh.currentLeft > xMin) {
                    moveX = outsideLeft;
                }

                let outsideBottom = shapeY - (wh.currentTop + wh.currentHeight - frameWidth);
                if (outsideBottom > 0 && wh.currentTop + wh.currentHeight <= yMax) {
                    moveY = -outsideBottom;
                }

                let outsideTop = (wh.currentTop + frameWidth) - shapeY;
                if (outsideTop > 0 && wh.currentTop >= yMin) {
                    moveY = outsideTop;
                }

                if (moveX != 0 || moveY != 0) {
                    let matrix = new PIXI.Matrix().copyFrom(wh.stage.projectionTransform);
                    wh.stage.projectionTransform.identity();
                    wh.stage.projectionTransform.translate(moveX, moveY);
                    wh.stage.projectionTransform.prepend(matrix);

                    wh.computeCurrentWorldBounds();
                    wh.computeGraphicalControlsMatrix();
                    wh.shapesNotAffectedByWorldTransforms.forEach((shape) => shape.move(-moveX, -moveY));
                }


            }, false, false, 'Verschiebt die Welt so, dass das übergebene graphische Objekt (shape) sichtbar wird. Verschoben wird nur, wenn das Objekt weniger als frameWidth vom Rand entfernt ist und die Welt nicht über die gegebenen Koordinaten xMin, xMax, yMin und yMax hinausragt.', false));

        this.addMethod(new Method("rotate", new Parameterlist([
            { identifier: "angleInDeg", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let angle: number = parameters[1].value;
                let x: number = parameters[2].value;
                let y: number = parameters[3].value;
                let wh: WorldHelper = o.intrinsicData["World"];



                let angleRad = -angle / 180 * Math.PI;
                let matrix = new PIXI.Matrix().copyFrom(wh.stage.projectionTransform);
                wh.stage.projectionTransform.identity();
                wh.stage.projectionTransform.translate(-x, -y);
                wh.stage.projectionTransform.rotate(angleRad);
                wh.stage.projectionTransform.translate(x, y);
                wh.stage.projectionTransform.prepend(matrix);

                wh.computeCurrentWorldBounds();
                wh.computeGraphicalControlsMatrix();
                wh.shapesNotAffectedByWorldTransforms.forEach(
                    (shape) => {
                        shape.rotate(-angle, x, y);
                    });

            }, false, false, 'Rotiert die Welt um den angegebenen Winkel im Urzeigersinn. Drehpunkt ist der Punkt (x/y).', false));

        this.addMethod(new Method("scale", new Parameterlist([
            { identifier: "factor", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let factor: number = parameters[1].value;
                let x: number = parameters[2].value;
                let y: number = parameters[3].value;
                let wh: WorldHelper = o.intrinsicData["World"];


                let matrix = new PIXI.Matrix().copyFrom(wh.stage.projectionTransform);
                wh.stage.projectionTransform.identity();
                wh.stage.projectionTransform.translate(-x, -y);
                wh.stage.projectionTransform.scale(factor, factor);
                wh.stage.projectionTransform.translate(x, y);
                wh.stage.projectionTransform.prepend(matrix);
                wh.computeCurrentWorldBounds();
                wh.computeGraphicalControlsMatrix();
                wh.shapesNotAffectedByWorldTransforms.forEach((shape) => shape.scale(1 / factor, x, y));

            }, false, false, 'Streckt die Welt um den angegebenen Faktor. Zentrum der Streckung ist (x/y).', false));

        this.addMethod(new Method("setCoordinateSystem", new Parameterlist([
            { identifier: "left", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "top", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "width", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "height", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let left: number = parameters[1].value;
                let top: number = parameters[2].value;
                let width: number = parameters[3].value;
                let height: number = parameters[4].value;
                let wh: WorldHelper = o.intrinsicData["World"];


                wh.stage.projectionTransform.identity();     // coordinate system (0/0) to (initialWidth/initialHeight)
                wh.stage.projectionTransform.translate(-left, -top);
                wh.stage.projectionTransform.scale(wh.initialWidth / width, wh.initialHeight / height);
                wh.computeCurrentWorldBounds();
                wh.computeGraphicalControlsMatrix();
                wh.shapesNotAffectedByWorldTransforms.forEach((shape) => {
                    shape.scale(width / wh.initialWidth, left, top);
                    shape.move(left, top);
                });

            }, false, false, 'Streckt die Welt um den angegebenen Faktor. Zentrum der Streckung ist (x/y).', false));


        this.addMethod(new Method("setDefaultGroup", new Parameterlist([
            { identifier: "group", type: groupType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let group: RuntimeObject = parameters[1].value;
                let wh: WorldHelper = o.intrinsicData["World"];

                wh.defaultGroup = group == null ? null : group.intrinsicData["Actor"];

            }, false, false, 'Legt eine Gruppe fest, zu der ab jetzt alle neuen Objekte automatisch hinzugefügt werden. Falls null angegeben wird, werden neue Objekte zu keiner Gruppe automatisch hinzugefügt.', false));


        this.addMethod(new Method("getDefaultGroup", new Parameterlist([
        ]), groupType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let wh: WorldHelper = o.intrinsicData["World"];

                return wh.getDefaultGroup();

            }, false, false, 'Gibt die Gruppe zurück, zu der aktuell alle neuen Objekte automatisch hinzugefügt werden. Falls gerade keine defaultGroup festgelegt ist, wird null zurückgegeben.', false));


        this.addMethod(new Method("addMouseListener", new Parameterlist([
            { identifier: "listener", type: mouseListenerType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let listener: RuntimeObject = parameters[1].value;
                let wh: WorldHelper = o.intrinsicData["World"];

                wh.addMouseListener(listener);

            }, false, false, 'Fügt einen neuen MouseListener hinzu, dessen Methoden bei Mausereignissen aufgerufen werden.', false));


        this.addMethod(new Method("getWidth", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let wh: WorldHelper = o.intrinsicData["World"];

                return Math.round(wh.currentWidth);

            }, false, false, 'Gibt die "Breite" des Grafikbereichs zurück, genauer: die x-Koordinate am rechten Rand.', false));

        this.addMethod(new Method("getHeight", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let wh: WorldHelper = o.intrinsicData["World"];

                return Math.round(wh.currentHeight);

            }, false, false, 'Gibt die "Höhe" des Grafikbereichs zurück, genauer: die y-Koordinate am unteren Rand.', false));

        this.addMethod(new Method("getTop", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let wh: WorldHelper = o.intrinsicData["World"];

                return Math.round(wh.currentTop);

            }, false, false, 'Gibt die y-Koordinate der linken oberen Ecke zurück.', false));

        this.addMethod(new Method("getLeft", new Parameterlist([
        ]), intPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let wh: WorldHelper = o.intrinsicData["World"];

                return Math.round(wh.currentLeft);

            }, false, false, 'Gibt die x-Koordinate der linken oberen Ecke zurück.', false));

        this.addMethod(new Method("setCursor", new Parameterlist([
            { identifier: "cursor", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let wh: WorldHelper = o.intrinsicData["World"];
                let cursor: string = parameters[1].value;

                wh.setCursor(cursor);

            }, false, false, 'Ändert die Form des Mauscursors im gesamten Grafikbereich. Mögiche Werte: siehe https://developer.mozilla.org/de/docs/Web/CSS/cursor.', false));

        this.addMethod(new Method("clear", new Parameterlist([
        ]), null,
            (parameters) => {

                let wh = module.main.getInterpreter().worldHelper;

                wh?.destroyAll();

            }, false, true, 'Löscht alle grafischen Objekte', false));


    }

    getWorldHelper(worldObject: RuntimeObject, breite: number = 800, höhe: number = 600): WorldHelper {

        let wh = this.module?.main?.getInterpreter()?.worldHelper;


        if (wh != null) {
            if (wh.width != breite || wh.height != höhe) {

                let ratio: number = Math.round(höhe / breite * 100);
                wh.$containerOuter.css('padding-bottom', ratio + "%");

                wh.stage.projectionTransform.scale(wh.width / breite, wh.width / höhe);

                this.module.main.getRightDiv()?.adjustWidthToWorld();

            }

            return wh;

        } else {

            return new WorldHelper(breite, höhe, this.module, worldObject);
        }

    }


}

export type MouseListenerShapeData = {
    shapeHelper: ShapeHelper,
    types: { [type: string]: boolean },
    methods: { [type: string]: Method }
}

export type MouseListenerData = {
    listener: RuntimeObject,
    types: { [type: string]: boolean },
    methods: { [type: string]: Method }
}

export interface InternalMouseListener {
   onMouseEvent(kind: MouseEvent, x: number, y: number):void;
}

export interface InternalKeyboardListener {
    onKeyDown(key: string, isShift: boolean, isCtrl: boolean, isAlt: boolean): void;
    looseKeyboardFocus(): void;
}

export type MouseEvent = "mouseup"| "mousedown"| "mousemove"| "mouseenter"| "mouseleave";

export type ActorData = {
    actorHelper: ActorHelper,
    method: Method
}

/**
 * @see https://javascript.plainenglish.io/inside-pixijs-projection-system-897872a3dc17
 */
class WorldContainer extends PIXI.Container {

    projectionTransform: PIXI.Matrix;

    constructor(public sourceFrame: PIXI.Rectangle, public destinationFrame: PIXI.Rectangle) {
        super();
        this.projectionTransform = new PIXI.Matrix();
    }

    render(renderer: PIXI.Renderer) {

        renderer.projection.projectionMatrix.identity();
        renderer.projection.transform = this.projectionTransform;
        renderer.renderTexture.bind(
            renderer.renderTexture.current,
            this.sourceFrame,
            this.destinationFrame,
        );
        super.render(renderer);
        renderer.batch.flush();

        // renderer.batch.flush();
        renderer.projection.projectionMatrix.identity();
        renderer.projection.transform = null;
        renderer.renderTexture.bind(null);
    }
}


export class WorldHelper {

    $containerOuter: JQuery<HTMLElement>;
    $containerInner: JQuery<HTMLElement>;
    $controlsContainer: JQuery<HTMLElement>;
    app: PIXI.Application;
    stage: WorldContainer;

    actActors: ActorData[] = [];
    keyPressedActors: ActorData[] = [];
    keyUpActors: ActorData[] = [];
    keyDownActors: ActorData[] = [];
    actorHelpersToDestroy: ActorHelper[] = [];

    mouseListenerShapes: MouseListenerShapeData[] = [];
    mouseListeners: MouseListenerData[] = [];
    
    internalMouseListeners: InternalMouseListener[] = [];
    internalKeyboardListeners: InternalKeyboardListener[] = [];

    interpreter: Interpreter;
    actorsFinished: boolean = true;
    summedDelta: number = 0;

    defaultGroup: GroupHelper;

    initialWidth: number;
    initialHeight: number;

    $coordinateDiv: JQuery<HTMLElement>;

    public scaledTextures: { [name: string]: PIXI.Texture } = {};


    shapes: ShapeHelper[] = [];     // all shapes incl. groups that aren't part of a group

    currentLeft: number;
    currentTop: number;
    currentWidth: number;
    currentHeight: number;

    shapesNotAffectedByWorldTransforms: ShapeHelper[] = [];

    globalScale: number;

    robotWorldHelper: any;

    tickerFunction: (t: number) => void;

    clearActorLists() {
        this.actActors = [];
        this.keyPressedActors = [];
        this.keyUpActors = [];
        this.keyDownActors = [];
    }

    constructor(public width: number, public height: number, public module: Module, public world: RuntimeObject) {

        this.globalScale = 1;

        while (height > 1000 || width > 2000) {
            this.globalScale *= 2;
            height /= 2;
            width /= 2;
        }

        this.initialHeight = this.height;
        this.initialWidth = this.width;

        this.currentLeft = 0;
        this.currentTop = 0;
        this.currentWidth = this.width;
        this.currentHeight = this.height;

        this.interpreter = this.module?.main?.getInterpreter();

        if (this.interpreter.processingHelper != null) {
            this.interpreter.throwException("Die herkömmliche Grafikausgabe kann nicht zusammen mit Processing genutzt werden.");
        }

        if (this.interpreter.worldHelper != null) {
            this.interpreter.throwException("Es darf nur ein World-Objekt instanziert werden.");
        }

        this.interpreter.worldHelper = this;

        let $graphicsDiv = this.module.main.getInterpreter().printManager.getGraphicsDiv();
        this.$coordinateDiv = this.module.main.getRightDiv().$rightDiv.find(".jo_coordinates");

        let f = () => {
            let $jo_tabs = $graphicsDiv.parents(".jo_tabs");
            if ($jo_tabs.length == 0) {
                $jo_tabs = $graphicsDiv.parents(".joe_rightDivInner");
            }
            let maxWidth: number = $jo_tabs.width();
            let maxHeight: number = $jo_tabs.height();

            if (height / width > maxHeight / maxWidth) {
                $graphicsDiv.css({
                    'width': width / height * maxHeight + "px",
                    'height': maxHeight + "px",
                })
            } else {
                $graphicsDiv.css({
                    'height': height / width * maxWidth + "px",
                    'width': maxWidth + "px",
                })
            }
        };

        $graphicsDiv.off('sizeChanged');
        $graphicsDiv.on('sizeChanged', f);

        f();

        this.$containerOuter = jQuery('<div></div>');
        this.$containerInner = jQuery('<div></div>');
        this.$controlsContainer = jQuery('<div class="graphical_controls"></div>');
        this.$containerOuter.append(this.$containerInner, this.$controlsContainer);

        new ResizeObserver(() => {that.computeGraphicalControlsMatrix()}).observe(this.$containerInner[0]);

        $graphicsDiv.append(this.$containerOuter);

        $graphicsDiv.show();

        $graphicsDiv[0].oncontextmenu = function (e) {
            e.preventDefault();
        };

        if (this.module.main.pixiApp) {
            this.app = this.module.main.pixiApp;
            let renderer = <PIXI.Renderer>this.app.renderer;
            renderer.resize(width, height);
            renderer.background.color = 0x0;

        } else {
            this.app = new PIXI.Application({
                antialias: true,
                width: width, height: height,
                //resizeTo: $containerInner[0]
            });
            this.module.main.pixiApp = this.app;
        }

        let that = this;

        this.tickerFunction = (delta) => {
            that.tick(PIXI.Ticker.shared.elapsedMS);
        };

        this.app.ticker.add(this.tickerFunction);
        this.app.ticker.maxFPS = 30;
        this.app.ticker.minFPS = 30;

        this.interpreter.timerExtern = true;

        let sourceFrame = new PIXI.Rectangle(0, 0, this.width, this.height);
        let destinationFrame = new PIXI.Rectangle(0, 0, width, height);
        this.stage = new WorldContainer(sourceFrame, destinationFrame);

        // let shader = `precision mediump float;

        // varying vec2 vTextureCoord;
        // varying vec4 vColor;
        
        // uniform sampler2D uSampler;
        // uniform vec4 filterArea;
        // uniform float mx, my, r;
        
        // void main(void)
        // {
        //    vec2 uvs = vTextureCoord.xy;
        //    vec2 tex = vTextureCoord * filterArea.xy;

        //    vec4 fg;

        //     float dx = tex.x - mx;
        //     float dy = tex.y - my;
        //     dx = dx*dx;
        //     dy = dy*dy;

        //   if(dx + dy < r * r){
        //       fg = texture2D(uSampler, vTextureCoord);
        //     } else {
        //         fg = vec4(0.0, 0.0, 0.0, 0.0);
        //   }
        
        //    gl_FragColor = fg;
        
        // }`

        // let filter = new PIXI.Filter(null, shader, {
        //     mx: 400.0,
        //     my: 300.0,
        //     r: 400
        // });


        // this.app.stage.filters = [filter]


        this.stage.projectionTransform = new PIXI.Matrix();

        this.app.stage.addChild(this.stage);

        this.$containerInner.append(<any>this.app.view);

        this.interpreter.keyboardTool.keyPressedCallbacks.push((key) => {
            for (let kpa of that.keyPressedActors) {

                that.runActorWhenKeyEvent(kpa, key);

            }
        });

        this.interpreter.keyboardTool.keyUpCallbacks.push((key) => {
            for (let kpa of that.keyUpActors) {

                that.runActorWhenKeyEvent(kpa, key);

            }
        });

        this.interpreter.keyboardTool.keyDownCallbacks.push((key, isShift, isCtrl, isAlt) => {
            for (let kpa of that.keyDownActors) {

                that.runActorWhenKeyEvent(kpa, key);

            }

            for(let ikl of that.internalKeyboardListeners){
                ikl.onKeyDown(key, isShift, isCtrl, isAlt);
            }
        });


        for (let listenerType of ["mouseup", "mousedown", "mousemove", "mouseenter", "mouseleave"]) {

            let eventType = listenerType;
            if (window.PointerEvent) {
                eventType = eventType.replace('mouse', 'pointer');
            }

            this.$containerInner.on(eventType, (e) => {
                let x = width * e.offsetX / this.$containerInner.width();
                let y = height * e.offsetY / this.$containerInner.height();

                let p = new PIXI.Point(x * this.globalScale, y * this.globalScale);
                this.stage.projectionTransform.applyInverse(p, p);
                x = p.x;
                y = p.y;

                that.onMouseEvent(listenerType, x, y, e.button);

                for(let internalListener of this.internalMouseListeners){
                    internalListener.onMouseEvent(<MouseEvent>listenerType, x, y);
                }

                for (let listener of this.mouseListeners) {
                    if (listener.types[listenerType] != null) {
                        this.invokeMouseListener(listener, listenerType, x, y, e.button);
                    }
                }

                if (listenerType == "mousedown") {
                    let gngEreignisbehandlung = this.interpreter.gngEreignisbehandlungHelper;
                    if (gngEreignisbehandlung != null) {
                        gngEreignisbehandlung.handleMouseClickedEvent(x, y);
                    }
                }

            });
        }

        let $coordinateDiv = this.$coordinateDiv;

        let mousePointer = window.PointerEvent ? "pointer" : "mouse";

        this.$containerInner.on(mousePointer + "move", (e) => {
            let x = width * e.offsetX / this.$containerInner.width();
            let y = height * e.offsetY / this.$containerInner.height();

            let p = new PIXI.Point(x * this.globalScale, y * this.globalScale);
            this.stage.projectionTransform.applyInverse(p, p);
            x = Math.round(p.x);
            y = Math.round(p.y);
            $coordinateDiv.text(`(${x}/${y})`);
        });

        this.$containerInner.on(mousePointer + "enter", (e) => {
            $coordinateDiv.show();
        });

        this.$containerInner.on(mousePointer + "leave", (e) => {
            $coordinateDiv.hide();
        });

        this.module.main.getRightDiv()?.adjustWidthToWorld();

    }

    computeCurrentWorldBounds() {

        let p1: PIXI.Point = new PIXI.Point(0, 0);
        this.stage.projectionTransform.applyInverse(p1, p1);

        let p2: PIXI.Point = new PIXI.Point(this.initialWidth, this.initialHeight);
        this.stage.projectionTransform.applyInverse(p2, p2);

        this.currentLeft = p1.x;
        this.currentTop = p1.y;
        this.currentWidth = Math.abs(p2.x - p1.x);
        this.currentHeight = Math.abs(p2.y - p1.y);

    }

    computeGraphicalControlsMatrix(){
        let ccWidth = this.$containerInner.width();
        let ccHeight = this.$containerInner.height();

        let ccm = new PIXI.Matrix();
        ccm.scale(ccWidth/this.width, ccHeight/this.height);
        let inv = this.stage.projectionTransform.clone().invert();
        ccm.append(this.stage.projectionTransform);

        this.$controlsContainer.css('transform', `matrix(${ccm.a}, ${ccm.b}, ${ccm.c}, ${ccm.d}, ${ccm.tx}, ${ccm.ty})`);
    }


    hasActors(): boolean {
        return this.actActors.length > 0 || this.keyPressedActors.length > 0 || this.keyUpActors.length > 0
            || this.keyDownActors.length > 0 || this.mouseListeners.length > 0 || this.mouseListenerShapes.length > 0;
    }

    setAllHitpolygonsDirty() {
        for (let shape of this.shapes) {
            shape.setHitPolygonDirty(true);
        }
    }

    destroyAll(){
        while(this.shapes.length > 0){
            // console.log(this.shapes);
            // debugger;
            this.shapes.pop().destroy();
        }
    }

    setCursor(cursor: string) {
        this.$containerInner.css('cursor', cursor);
    }


    actorsNotFinished: number = 0;
    ticks: number = 0;
    deltaSum: number = 0;

    spriteAnimations: SpriteHelper[] = [];

    tick(delta: any) {

        if (this.interpreter != null) {
            switch (this.interpreter.state) {
                case InterpreterState.running:
                    this.summedDelta += delta;
                    for (let spriteHelper of this.spriteAnimations) {
                        spriteHelper.tick(delta);
                    }

                    if (!this.actorsFinished) {
                        this.actorsNotFinished++;
                        break;
                    }

                    if (this.interpreter.pauseUntil != null) {
                        break;
                    }

                    let first: boolean = true;

                    for (let actorData of this.actActors) {

                        let actorHelper = actorData.actorHelper;
                        if (actorHelper.timerPaused || actorHelper.isDestroyed) continue;

                        let program = actorData.method?.program;
                        this.runActor(first, actorData, this.summedDelta);
                        if (program != null && !actorData.actorHelper.isDestroyed) {
                            first = false;
                            this.actorsFinished = false;
                        }
                    }
                    break;
                case InterpreterState.done:
                case InterpreterState.error:
                case InterpreterState.not_initialized:
                    this.clearActorLists();
                    break;
            }


            this.summedDelta = 0;

            if (this.interpreter.state == InterpreterState.running) {
                if (this.actActors.length > 0) {
                    this.interpreter.timerFunction(33.33, true, 0.5);
                    //@ts-ignore
                    if (this.interpreter.state == InterpreterState.running) {
                        this.interpreter.timerStopped = false;
                        this.interpreter.timerFunction(33.33, false, 0.08);
                    }
                } else {
                    this.interpreter.timerFunction(33.33, false, 0.7);
                }
            }
        }

        while (this.actorHelpersToDestroy.length > 0) {

            let actorHelper = this.actorHelpersToDestroy.pop();

            for (let actorList of [this.keyPressedActors, this.keyUpActors, this.keyDownActors]) {
                for (let i = 0; i < actorList.length; i++) {
                    if (actorList[i].actorHelper === actorHelper) {
                        actorList.splice(i, 1);
                        i--;
                    }
                }
            }


            for (let i = 0; i < this.mouseListenerShapes.length; i++) {
                if (this.mouseListenerShapes[i].shapeHelper === actorHelper) {
                    this.mouseListenerShapes.splice(i, 1);
                    i--;
                }
            }

            for (let i = 0; i < this.actActors.length; i++) {
                if (this.actActors[i].actorHelper === actorHelper) {
                    this.actActors.splice(i, 1);
                    i--;
                }
            }

            let displayObject = (<ShapeHelper>actorHelper).displayObject;
            if (displayObject != null) {
                displayObject.destroy();
                (<ShapeHelper>actorHelper).displayObject = null;
            }
        }


    }

    setBackgroundColor(color: string | number) {
        let renderer = (<PIXI.Renderer>(this.app.renderer));
        if (typeof color == "string") {
            let c = ColorHelper.parseColorToOpenGL(color);
            renderer.background.color = c.color;
        } else {
            renderer.background.color = color;
        }

    }

    runActorWhenKeyEvent(actorData: ActorData, key: string) {

        let program = actorData.method?.program;
        let invoke = actorData.method?.invoke;

        let rto = actorData.actorHelper.runtimeObject;

        let stackElements: Value[] = [
            {
                type: rto.class,
                value: rto
            },
            {
                type: stringPrimitiveType,
                value: key
            }
        ];

        if (program != null) {
            this.interpreter.runTimer(actorData.method, stackElements, null, false);
        } else if (invoke != null) {
            invoke([]);
        }
    }


    runActor(first: boolean, actorData: ActorData, delta: number) {

        let program = actorData.method?.program;
        let invoke = actorData.method?.invoke;

        let rto = actorData.actorHelper.runtimeObject;

        let stackElements: Value[] = [
            {
                type: rto.class,
                value: rto
            },
        ];

        if (actorData.method.getParameterCount() > 0) {
            stackElements.push(
                {
                    type: doublePrimitiveType,
                    value: delta
                }

            );
        }

        let that = this;

        if (program != null) {
            this.interpreter.runTimer(actorData.method, stackElements, first ? (interpreter) => {
                that.actorsFinished = true;
                interpreter.timerStopped = true;
            } : null, true);
        } else if (invoke != null) {
            invoke([]);
        }
    }

    cacheAsBitmap() {

        let hasRobot = this.robotWorldHelper != null;

        this.mouseListeners = [];
        this.mouseListenerShapes = [];
        this.internalMouseListeners = [];
        this.internalKeyboardListeners = [];

        let scaleMin = 1.0;
        if (this.currentWidth * this.currentHeight > 2500000) scaleMin = Math.sqrt(2500000 / (this.currentWidth * this.currentHeight));
        if (this.currentWidth * this.currentHeight < 1024 * 1024) scaleMin = Math.sqrt(1024 * 1024 / (this.currentWidth * this.currentHeight));

        const brt = new PIXI.BaseRenderTexture(
            {
                scaleMode: PIXI.SCALE_MODES.LINEAR,
                width: Math.round(this.currentWidth * scaleMin),
                height: Math.round(this.currentHeight * scaleMin)
            }
        );
        let rt: PIXI.RenderTexture = new PIXI.RenderTexture(brt);

        let transform = new PIXI.Matrix().scale(scaleMin, scaleMin);

        setTimeout(() => {
            if (!hasRobot) {
                this.app.renderer.render(this.stage, {
                    renderTexture: rt,
                    transform: transform
                });

                setTimeout(() => {
                    this.stage.children.forEach(c => c.destroy());
                    this.stage.removeChildren();

                    let sprite = new PIXI.Sprite(rt);
                    sprite.localTransform.scale(this.globalScale, this.globalScale);
                    // debugger;
                    // sprite.localTransform.translate(0, rt.height);
                    //@ts-ignore
                    sprite.transform.onChange();
                    // this.stage.projectionTransform = new PIXI.Matrix().scale(1, -1).translate(0, this.currentHeight);
                    this.stage.projectionTransform = new PIXI.Matrix();
                    this.stage.addChild(sprite);

                }, 300);
            }
        }, 150);   // necessary to await Turtle's deferred rendering

    }

    destroyWorld() {
        for (let listenerType of ["mouseup", "mousedown", "mousemove", "mouseenter", "mouseleave"]) {
            this.$containerInner.off(listenerType);
        }
        this.spriteAnimations = [];
        this.app.ticker.remove(this.tickerFunction);

        this.app.stage.children.forEach(c => c.destroy());
        this.app.stage.removeChildren();

        if (this.robotWorldHelper != null) {
            this.robotWorldHelper.destroy();
            this.robotWorldHelper = null;
        }

        jQuery(this.app.view).detach();

        this.$containerOuter.remove();
        this.module.main.getInterpreter().printManager.getGraphicsDiv().hide();
        this.interpreter.timerExtern = false;
        this.interpreter.worldHelper = null;
        this.$coordinateDiv.hide();

        FilledShapeDefaults.initDefaultValues();
    }

    onMouseEvent(listenerType: string, x: number, y: number, button: number) {

        switch (listenerType) {
            case "mousedown":
            case "mouseup":
                for (let listener of this.mouseListenerShapes) {
                    let shapeHelper: ShapeHelper = listener.shapeHelper;

                    if (listener.types[listenerType] != null && (shapeHelper.containsPoint(x, y) || shapeHelper.trackMouseMove)) {
                        this.invokeShapeMouseListener(listener, listenerType, x, y, button);
                    }

                }

                break;
            case "mouseenter":
                for (let listener of this.mouseListenerShapes) {
                    let shapeHelper: ShapeHelper = listener.shapeHelper;

                    if (listener.types[listenerType] != null && shapeHelper.containsPoint(x, y) && !shapeHelper.mouseLastSeenInsideObject) {
                        this.invokeShapeMouseListener(listener, listenerType, x, y, button, () => {
                            shapeHelper.mouseLastSeenInsideObject = true;
                        });
                    }

                }
                break;
            case "mouseleave":
                for (let listener of this.mouseListenerShapes) {
                    let shapeHelper: ShapeHelper = listener.shapeHelper;

                    if (listener.types[listenerType] != null && shapeHelper.mouseLastSeenInsideObject) {
                        this.invokeShapeMouseListener(listener, listenerType, x, y, button, () => {
                            shapeHelper.mouseLastSeenInsideObject = false;
                        });
                    }

                }
                break;
            case "mousemove":
                for (let listener of this.mouseListenerShapes) {
                    let shapeHelper: ShapeHelper = listener.shapeHelper;

                    if (listener.types["mousemove"] != null ||
                        (listener.types["mouseenter"] != null && !shapeHelper.mouseLastSeenInsideObject) ||
                        (listener.types["mouseleave"] != null && shapeHelper.mouseLastSeenInsideObject)
                    ) {
                        let containsPoint = shapeHelper.containsPoint(x, y);
                        if ((shapeHelper.trackMouseMove || containsPoint) && listener.types["mousemove"] != null) {
                            this.invokeShapeMouseListener(listener, "mousemove", x, y, button);
                        }
                        if (containsPoint && listener.types["mouseenter"] != null && !shapeHelper.mouseLastSeenInsideObject) {
                            this.invokeShapeMouseListener(listener, "mouseenter", x, y, button, () => {
                                shapeHelper.mouseLastSeenInsideObject = true;
                            });
                        }
                        if (!containsPoint && listener.types["mouseleave"] != null && shapeHelper.mouseLastSeenInsideObject) {
                            this.invokeShapeMouseListener(listener, "mouseleave", x, y, button, () => {
                                shapeHelper.mouseLastSeenInsideObject = false;
                            });
                        }
                    }
                }
                break;
        }
    }

    invokeShapeMouseListener(listener: MouseListenerShapeData, listenerType: string,
        x: number, y: number, button: number, callback?: () => void) {

        if (!listener.shapeHelper.reactToMouseEventsWhenInvisible &&
            !listener.shapeHelper.displayObject.visible) return;

        let method = listener.methods[listenerType];
        let program = method.program;
        let invoke = method.invoke;

        let rto = listener.shapeHelper.runtimeObject;

        let stackElements: Value[] = [
            {
                type: rto.class,
                value: rto
            },
            {
                type: doublePrimitiveType,
                value: x
            },
            {
                type: doublePrimitiveType,
                value: y
            }
        ];

        if (listenerType != "mousemove" && listenerType != "mouseenter" && listenerType != "mouseleave") {
            stackElements.push(
                {
                    type: intPrimitiveType,
                    value: button
                });
        }

        if (program != null) {
            this.interpreter.runTimer(method, stackElements, callback, false);
        } else if (invoke != null) {
            invoke([]);
        }

    }

    addMouseListener(listener: RuntimeObject) {

        /*
            If a shape is registered as MouseListener of the world-object, it gets all mouse-events twice. 
            => Deregister shape as mouseListenerShape and register it as mouse listener for the world object.
        */
        let index: number = this.mouseListenerShapes.findIndex((mls) => { return mls.shapeHelper.runtimeObject == listener });
        if (index >= 0) {
            this.mouseListenerShapes.splice(index, 1);
        }

        let listenerTypes = [
            { identifier: "MouseUp", signature: "(double, double, int)" },
            { identifier: "MouseDown", signature: "(double, double, int)" },
            { identifier: "MouseMove", signature: "(double, double)" },
            { identifier: "MouseEnter", signature: "(double, double)" },
            { identifier: "MouseLeave", signature: "(double, double)" },
        ];

        let sd: MouseListenerData = null;

        for (let lt of listenerTypes) {
            let method: Method = (<Klass>listener.class).getMethodBySignature("on" + lt.identifier + lt.signature);

            if (method?.program != null && method.program.statements.length > 2 || method?.invoke != null) {

                if (sd == null) {
                    sd = {
                        listener: listener,
                        types: {},
                        methods: {}
                    };
                    this.mouseListeners.push(sd);
                }

                sd.types[lt.identifier.toLowerCase()] = true;
                sd.methods[lt.identifier.toLowerCase()] = method;

            }
        }

    }


    invokeMouseListener(listener: MouseListenerData, listenerType: string,
        x: number, y: number, button: number, callback?: () => void) {

        let method = listener.methods[listenerType];
        let program = method.program;
        let invoke = method.invoke;

        let rto = listener.listener;

        let stackElements: Value[] = [
            {
                type: rto.class,
                value: rto
            },
            {
                type: doublePrimitiveType,
                value: x
            },
            {
                type: doublePrimitiveType,
                value: y
            }
        ];

        if (listenerType != "mousemove" && listenerType != "mouseenter" && listenerType != "mouseleave") {
            stackElements.push(
                {
                    type: intPrimitiveType,
                    value: button
                });
        }

        if (program != null) {
            this.interpreter.runTimer(method, stackElements, callback, false);
        } else if (invoke != null) {
            invoke([]);
        }

    }

    getDefaultGroup(): RuntimeObject {
        return this.defaultGroup?.runtimeObject;
    }

}