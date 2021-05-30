import { Module } from "../../compiler/parser/Module.js";
import { Klass, Visibility } from "../../compiler/types/Class.js";
import { Attribute, Method, Parameterlist, Value } from "../../compiler/types/Types.js";
import { doublePrimitiveType, floatPrimitiveType, intPrimitiveType, voidPrimitiveType, stringPrimitiveType, booleanPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { ActorHelper } from "./Actor.js";
import { InterpreterState, Interpreter } from "../../interpreter/Interpreter.js";
import { ShapeClass, ShapeHelper } from "./Shape.js";
import { KeyboardTool } from "../../tools/KeyboardTool.js";
import { SpriteHelper } from "./Sprite.js";
import { ColorHelper } from "./ColorHelper.js";
import { Punkt } from "../../tools/MatheTools.js";
import { GroupClass, GroupHelper } from "./Group.js";
import { MouseListenerInterface } from "./MouseListener.js";

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

                let matrix = new PIXI.Matrix().copyFrom(wh.stage.localTransform);
                wh.stage.localTransform.identity();
                wh.stage.localTransform.translate(x, y);
                wh.stage.localTransform.prepend(matrix);


                // wh.stage.localTransform.translate(x,y);
                //@ts-ignore
                wh.stage.transform.onChange();
                wh.stage.updateTransform();
                wh.setAllHitpolygonsDirty();
                wh.computeCurrentWorldBounds();
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
                    let matrix = new PIXI.Matrix().copyFrom(wh.stage.localTransform);
                    wh.stage.localTransform.identity();
                    wh.stage.localTransform.translate(moveX, moveY);
                    wh.stage.localTransform.prepend(matrix);


                    // wh.stage.localTransform.translate(x,y);
                    //@ts-ignore
                    wh.stage.transform.onChange();
                    wh.stage.updateTransform();
                    wh.setAllHitpolygonsDirty();
                    wh.computeCurrentWorldBounds();
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
                let matrix = new PIXI.Matrix().copyFrom(wh.stage.localTransform);
                wh.stage.localTransform.identity();
                wh.stage.localTransform.translate(-x, -y);
                wh.stage.localTransform.rotate(angleRad);
                wh.stage.localTransform.translate(x, y);
                wh.stage.localTransform.prepend(matrix);


                // wh.stage.localTransform.translate(-x, -y);
                // wh.stage.localTransform.rotate(-angle / 180 * Math.PI);
                // wh.stage.localTransform.translate(x, y);
                //@ts-ignore
                wh.stage.transform.onChange();
                wh.setAllHitpolygonsDirty();
                wh.computeCurrentWorldBounds();
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


                let matrix = new PIXI.Matrix().copyFrom(wh.stage.localTransform);
                wh.stage.localTransform.identity();
                wh.stage.localTransform.translate(-x, -y);
                wh.stage.localTransform.scale(factor, factor);
                wh.stage.localTransform.translate(x, y);
                wh.stage.localTransform.prepend(matrix);


                // wh.stage.localTransform.translate(-x, -y);
                // wh.stage.localTransform.scale(factor, factor);
                // wh.stage.localTransform.translate(x, y);
                //@ts-ignore
                wh.stage.transform.onChange();
                wh.setAllHitpolygonsDirty();
                wh.computeCurrentWorldBounds();
                wh.shapesNotAffectedByWorldTransforms.forEach((shape) => shape.scale(1/factor,x, y));

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

                wh.stage.localTransform.identity();     // coordinate system (0/0) to (initialWidth/initialHeight)
                wh.stage.localTransform.translate(-left, -top);
                wh.stage.localTransform.scale(wh.initialWidth / width, wh.initialHeight / height);

                // wh.stage.localTransform.translate(x, y);
                //@ts-ignore
                wh.stage.transform.onChange();
                wh.setAllHitpolygonsDirty();
                wh.computeCurrentWorldBounds();
                wh.shapesNotAffectedByWorldTransforms.forEach((shape) => {
                    shape.scale(width/wh.initialWidth, left, top);
                    shape.move(left, top);
                } );

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


    }

    getWorldHelper(worldObject: RuntimeObject, breite: number = 800, höhe: number = 600): WorldHelper {

        let wh = this.module?.main?.getInterpreter()?.worldHelper;


        if (wh != null) {

            if (wh.width != breite || wh.height != höhe) {

                let ratio: number = Math.round(höhe / breite * 100);
                wh.$containerOuter.css('padding-bottom', ratio + "%");

                wh.stage.localTransform.scale(wh.width / breite, wh.height / höhe);
                wh.width = breite;
                wh.height = höhe;
                // this.stage.localTransform.rotate(45/180*Math.PI);
                // this.stage.localTransform.translate(400,300);
                //@ts-ignore
                wh.stage.transform.onChange();

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

export type ActorData = {
    actorHelper: ActorHelper,
    method: Method
}

export class WorldHelper {

    $containerOuter: JQuery<HTMLElement>;
    $containerInner: JQuery<HTMLElement>;
    app: PIXI.Application;
    stage: PIXI.Container;

    actActors: ActorData[] = [];
    keyPressedActors: ActorData[] = [];
    keyUpActors: ActorData[] = [];
    keyDownActors: ActorData[] = [];
    actorHelpersToDestroy: ActorHelper[] = [];

    mouseListenerShapes: MouseListenerShapeData[] = [];
    mouseListeners: MouseListenerData[] = [];

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

    tickerFunction: (t: number) => void;

    clearActorLists() {
        this.actActors = [];
        this.keyPressedActors = [];
        this.keyUpActors = [];
        this.keyDownActors = [];
    }

    constructor(public width: number, public height: number, private module: Module, public world: RuntimeObject) {
        
        PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
        PIXI.settings.TARGET_FPMS = 30.0 / 1000.0;

        this.initialHeight = height;
        this.initialWidth = width;

        this.currentLeft = 0;
        this.currentTop = 0;
        this.currentWidth = width;
        this.currentHeight = height;

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
            let maxWidth: number = $jo_tabs.width();
            let maxHeight: number = $jo_tabs.height();
            // let maxWidth: number = $graphicsDiv.parent().width();
            // let maxHeight: number = $graphicsDiv.parent().height();
            
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
        this.$containerOuter.append(this.$containerInner);
        
        $graphicsDiv.append(this.$containerOuter);

        $graphicsDiv.show();

        $graphicsDiv[0].oncontextmenu = function (e) {
            e.preventDefault();
        };

        if(this.module.main.pixiApp){
            this.app = this.module.main.pixiApp;
            this.app.renderer.resize(width, height);
            this.app.renderer.backgroundColor = 0x0;
        } else {
            this.app = new PIXI.Application({
                antialias: true,
                width: width, height: height,
                //resizeTo: $containerInner[0]
            });
            this.module.main.pixiApp = this.app;
        }

        let that = this;
        // let i = 0;

        this.tickerFunction = (delta) => {
            // if (i++ % 2 == 0) 
            that.tick(PIXI.Ticker.shared.elapsedMS);
        };

        this.app.ticker.add(this.tickerFunction);
        this.app.ticker.maxFPS = 30;

        this.interpreter.timerExtern = true;

        this.stage = new PIXI.Container();

        this.app.stage.addChild(this.stage);

        this.$containerInner.append(this.app.view);


        // this.stage.localTransform.translate(-400, -300);
        // this.stage.localTransform.rotate(-45/180*Math.PI);
        // this.stage.localTransform.translate(400,300);
        // this.stage.transform.onChange();

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

        this.interpreter.keyboardTool.keyDownCallbacks.push((key) => {
            for (let kpa of that.keyDownActors) {

                that.runActorWhenKeyEvent(kpa, key);

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

                let p = new PIXI.Point(x, y);
                this.stage.localTransform.applyInverse(p, p);
                x = p.x;
                y = p.y;

                that.onMouseEvent(listenerType, x, y, e.button);

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

            let p = new PIXI.Point(x, y);
            this.stage.localTransform.applyInverse(p, p);
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
        this.stage.localTransform.applyInverse(p1, p1);

        let p2: PIXI.Point = new PIXI.Point(this.initialWidth, this.initialHeight);
        this.stage.localTransform.applyInverse(p2, p2);

        this.currentLeft = p1.x;
        this.currentTop = p1.y;
        this.currentWidth = p2.x - p1.x;
        this.currentHeight = p2.y - p1.y;
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

    setCursor(cursor: string) {
        this.$containerInner.css('cursor', cursor);
    }


    actorsNotFinished: number = 0;
    ticks: number = 0;
    deltaSum: number = 0;

    spriteAnimations: SpriteHelper[] = [];

    tick(delta: any) {

        this.summedDelta += delta;

        for (let spriteHelper of this.spriteAnimations) {
            spriteHelper.tick(delta);
        }

        if (this.interpreter != null) {
            switch (this.interpreter.state) {
                case InterpreterState.running:

                    if (!this.actorsFinished) {
                        this.actorsNotFinished++;
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

        while (this.actorHelpersToDestroy.length > 0) {

            let actorHelper = this.actorHelpersToDestroy.pop();

            // actActors: ActorData[] = [];
            // keyPressedActors: ActorData[] = [];
            // actorHelpersToDestroy: ActorHelper[] = [];

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

    setBackgroundColor(color: string) {
        let c = ColorHelper.parseColorToOpenGL(color);
        this.app.renderer.backgroundColor = c.color;
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
        this.stage.cacheAsBitmap = true;
        setTimeout(() => {
            this.stage.children.forEach(c => c.destroy());            
        }, 100);
}


    destroyWorld() {
        for (let listenerType of ["mouseup", "mousedown", "mousemove", "mouseenter", "mouseleave"]) {
            this.$containerInner.off(listenerType);
        }
        this.spriteAnimations = [];
        this.app.ticker.remove(this.tickerFunction);

        // this.app.destroy(true, { children: true, texture: false, baseTexture: false});
        this.app.stage.children.forEach(c => c.destroy());
        jQuery(this.app.view).detach();

        this.$containerOuter.remove();
        this.module.main.getInterpreter().printManager.getGraphicsDiv().hide();
        this.interpreter.timerExtern = false;
        this.interpreter.worldHelper = null;
        this.$coordinateDiv.hide();
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

}