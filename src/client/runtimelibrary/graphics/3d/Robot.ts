import { Module } from "../../../compiler/parser/Module.js";
import { Klass } from "../../../compiler/types/Class.js";
import { booleanPrimitiveType, doublePrimitiveType, intPrimitiveType, stringPrimitiveType } from "../../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../../compiler/types/Types.js";
import { RuntimeObject } from "../../../interpreter/RuntimeObject.js";
import { FilledShapeHelper } from "../FilledShape.js";
import { WorldHelper } from "../World.js";
import { Interpreter } from "../../../interpreter/Interpreter.js";
import { FilledShapeDefaults } from "../FilledShapeDefaults.js";
import { ShapeHelper } from "../Shape.js";
import { Boxes3d } from "./Boxes3d.js";
import { RobotBrick, RobotCubeFactory, RobotMarker } from "./RobotCubeFactory.js";
import { Mesh3D } from "pixi3d";

export class RobotClass extends Klass {

    constructor(module: Module) {

        super("Robot", module, "Robot Karol");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));

        // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));

        this.addMethod(new Method("Robot", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let rh = new RobotHelper(module.main.getInterpreter(), o, 5, 8)
                o.intrinsicData["Robot"] = rh;

            }, false, false, 'Instanziert ein neues Robot-Objekt. Der Roboter steht anfangs an der Stelle (1/1)', true));

        this.addMethod(new Method("Robot", new Parameterlist([
            { identifier: "startX", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "startY", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let startX: number = parameters[1].value;
                let startY: number = parameters[2].value;

                let rh = new RobotHelper(module.main.getInterpreter(), o, 10, 10, startX, startY)
                o.intrinsicData["Robot"] = rh;

            }, false, false, 'Instanziert ein neues Robot-Objekt. Der Roboter wird anfangs an die Stelle (startX/startY) gesetzt.', true));

        this.addMethod(new Method("Robot", new Parameterlist([
            { identifier: "worldX", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "worldY", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let startX: number = parameters[1].value;
                let startY: number = parameters[2].value;
                let worldX: number = parameters[3].value;
                let worldY: number = parameters[4].value;

                let rh = new RobotHelper(module.main.getInterpreter(), o, worldX, worldY, startX, startY)
                o.intrinsicData["Robot"] = rh;

            }, false, false, 'Instanziert ein neues Robot-Objekt. Der Roboter wird anfangs an die Stelle (startX/startY) gesetzt. Wenn die RobotWorld noch nicht instanziert ist, wird sie mit der Größe worldX * worldY neu erstellt.', true));

        this.addMethod(new Method("rechtsDrehen", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];

                rh.direction.turnRight();
                rh.adjustAngle();

            }, false, false, 'Dreht den Roboter um 90° nach rechts.', false));

        this.addMethod(new Method("linksDrehen", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];

                rh.direction.turnLeft();
                rh.adjustAngle();

            }, false, false, 'Dreht den Roboter um 90° nach links.', false));

        this.addMethod(new Method("schritt", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];

                rh.schritt();

            }, false, false, 'Lässt den Roboter einen Schritt nach vorne gehen.', false));

        this.addMethod(new Method("schritt", new Parameterlist([
            { identifier: "Anzahl", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let anzahl: number = parameters[1].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];

                for (let i = 0; i < anzahl; i++) {
                    if (!rh.schritt()) break;
                }

            }, false, false, 'Lässt den Roboter Anzahl Schritte nach vorne gehen.', false));

        this.addMethod(new Method("hinlegen", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];

                rh.hinlegen("rot");

            }, false, false, 'Lässt den Roboter einen roten Ziegel vor sich hinlegen.', false));

        this.addMethod(new Method("markeLöschen", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];

                rh.markeLöschen();

            }, false, false, 'Lässt den Roboter eine Marke, die direkt unter ihm liegt, löschen.', false));

        this.addMethod(new Method("markeSetzen", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];

                rh.markeSetzen("gelb");

            }, false, false, 'Lässt den Roboter eine gelbe Marke direkt unter sich setzen.', false));

        this.addMethod(new Method("markeSetzen", new Parameterlist([
            { identifier: "Farbe", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let farbe: string = parameters[1].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];

                rh.markeSetzen(farbe);

            }, false, false, 'Lässt den Roboter eine Marke der angegebenen Farbe direkt unter sich setzen.', false));

        this.addMethod(new Method("hinlegen", new Parameterlist([
            { identifier: "Anzahl", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let anzahl: number = parameters[1].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];

                for (let i = 0; i < anzahl; i++) {
                    if (!rh.hinlegen("rot")) break;
                }

            }, false, false, 'Lässt den Roboter Anzahl rote Ziegel vor sich hinlegen.', false));

        this.addMethod(new Method("hinlegen", new Parameterlist([
            { identifier: "Farbe", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let farbe: string = parameters[1].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];

                rh.hinlegen(farbe);

            }, false, false, 'Lässt den Roboter einen Ziegel der angegebenen Farbe vor sich hinlegen.', false));

        this.addMethod(new Method("aufheben", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];

                rh.aufheben();

            }, false, false, 'Lässt den Roboter einen roten Ziegel vor sich aufheben.', false));

        this.addMethod(new Method("aufheben", new Parameterlist([
            { identifier: "Anzahl", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let anzahl: number = parameters[1].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];

                for (let i = 0; i < anzahl; i++) {
                    if (!rh.aufheben()) break;
                }

            }, false, false, 'Lässt den Roboter Anzahl rote Ziegel vor sich aufheben.', false));

        this.addMethod(new Method("warten", new Parameterlist([
            { identifier: "ZeitInMillisekunden", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

            }, false, true, "Pausiert das Programm für die angegebene Zeit in ms."));

        this.addMethod(new Method("langsam", new Parameterlist([
        ]), null,
            (parameters) => {
                module.main.getInterpreter().controlButtons.speedControl.setSpeedInStepsPerSecond(5);

            }, false, true, "Setzt die Ausführungsgeschwindigkeit auf 5 Programmschritte/Sekunde."));

        this.addMethod(new Method("schnell", new Parameterlist([
        ]), null,
            (parameters) => {
                module.main.getInterpreter().controlButtons.speedControl.setSpeedInStepsPerSecond("max");
            }, false, true, "Setzt die Ausführungsgeschwindigkeit auf 'maximal'."));

        this.addMethod(new Method("beenden", new Parameterlist([
        ]), null,
            (parameters) => {
                let console = module.main.getBottomDiv()?.console;
                if (console != null) {
                    console.writeConsoleEntry("Das Programm wurde durch einen Roboter angehalten.", null, "#0000ff");
                    console.showTab();
                }
                module.main.getInterpreter().stop();
            }, false, true, "Beendet das Programm."));

        this.addMethod(new Method("istWand", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];
                return rh.istWand();

            }, false, true, "Gibt genau dann true zurück, wenn der Roboter direkt vor einer Wand steht."));

        this.addMethod(new Method("nichtIstWand", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];
                return !rh.istWand();

            }, false, true, "Gibt genau dann true zurück, wenn der Roboter nicht direkt vor einer Wand steht."));

        this.addMethod(new Method("istZiegel", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];
                return rh.istZiegel(undefined);

            }, false, true, "Gibt genau dann true zurück, wenn direkt vor dem Roboter mindestens ein Ziegel liegt."));

        this.addMethod(new Method("istZiegel", new Parameterlist([
            { identifier: "Anzahl", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let anzahl: number = parameters[1].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];
                return rh.istZiegel(anzahl);

            }, false, true, "Gibt genau dann true zurück, wenn direkt vor dem Roboter genau Anzahl Ziegel liegen."));

        this.addMethod(new Method("istZiegel", new Parameterlist([
            { identifier: "Farbe", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let farbe: string = parameters[1].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];
                return rh.istZiegel(farbe);

            }, false, true, "Gibt genau dann true zurück, wenn auf dem Ziegelstapel direkt vor dem Roboter mindestens ein Ziegel mit der angegebenen Farbe liegt."));

        this.addMethod(new Method("nichtIstZiegel", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];
                return !rh.istZiegel(undefined);

            }, false, true, "Gibt genau dann true zurück, wenn direkt vor dem Roboter kein Ziegel liegt."));

        this.addMethod(new Method("nichtIstZiegel", new Parameterlist([
            { identifier: "Anzahl", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let anzahl: number = parameters[1].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];
                return !rh.istZiegel(anzahl);

            }, false, true, "Gibt genau dann true zurück, wenn direkt vor dem Roboter nicht genau Anzahl Ziegel liegen."));

        this.addMethod(new Method("nichtIstZiegel", new Parameterlist([
            { identifier: "Farbe", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let farbe: string = parameters[1].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];
                return !rh.istZiegel(farbe);

            }, false, true, "Gibt genau dann true zurück, wenn auf dem Ziegelstapel direkt vor dem Roboter kein Ziegel mit der angegebenen Farbe liegt."));

        this.addMethod(new Method("istMarke", new Parameterlist([
            { identifier: "Farbe", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let farbe: string = parameters[1].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];
                return rh.istMarke(farbe);

            }, false, true, "Gibt genau dann true zurück, wenn unter dem Roboter eine Marke in der angegebenen Farbe liegt."));

        this.addMethod(new Method("istMarke", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let farbe: string = parameters[1].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];
                return rh.istMarke(undefined);

            }, false, true, "Gibt genau dann true zurück, wenn unter dem Roboter eine Marke (egal in welcher Farbe) liegt."));

        this.addMethod(new Method("nichtIstMarke", new Parameterlist([
            { identifier: "Farbe", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let farbe: string = parameters[1].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];
                return !rh.istMarke(farbe);

            }, false, true, "Gibt genau dann true zurück, wenn unter dem Roboter keine Marke in der angegebenen Farbe liegt."));

        this.addMethod(new Method("nichtIstMarke", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let farbe: string = parameters[1].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];
                return !rh.istMarke(undefined);

            }, false, true, "Gibt genau dann true zurück, wenn unter dem Roboter keine Marke (egal in welcher Farbe) liegt."));

        let himmelsrichtungen = ["Norden", "Osten", "Süden", "Westen"];

        for (let i = 0; i < 4; i++) {
            let hr: string = himmelsrichtungen[i];

            this.addMethod(new Method("ist" + hr, new Parameterlist([
            ]), booleanPrimitiveType,
                (parameters) => {

                    let o: RuntimeObject = parameters[0].value;
                    let rh = <RobotHelper>o.intrinsicData["Robot"];
                    return rh.direction.index == i;

                }, false, true, "Gibt genau dann true zurück, wenn der Roboter nach " + hr + " blickt."));
        }




    }



}

export class RobotWorldClass extends Klass {

    constructor(module: Module) {

        super("RobotWorld", module, "Welt für Robot Karol");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));

        // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));

        this.addMethod(new Method("RobotWorld", new Parameterlist([
            { identifier: "worldX", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "worldY", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let worldX: number = parameters[1].value;
                let worldY: number = parameters[2].value;

                const interpreter = module.main.getInterpreter();

                let rh = new RobotWorldHelper(interpreter, o, worldX, worldY);
                o.intrinsicData["RobotWorldHelper"] = rh;

            }, false, false, 'Instanziert eine neue Robot-Welt', true));




    }

}

export class RobotWorldHelper {

    worldHelper: WorldHelper;

    robotCubeFactory: RobotCubeFactory;
    camera: Pixi3d.Camera;
    displayObject: PIXI.DisplayObject;
    container3D: Pixi3d.Container3D;

    markers: RobotMarker[][] = [];    // x, y
    bricks: RobotBrick[][][] = [];   // x, y, height

    maximumHeight: number = 10;

    constructor(public interpreter: Interpreter, public runtimeObject: RuntimeObject,
        public worldX: number, public worldY: number) {

        this.fetchWorld(interpreter);

        if (this.worldHelper.robotWorldHelper != null) {
            this.interpreter.throwException("Es wurde bereits ein Robot-World-Objekt instanziert. Davon kann es aber nur ein einziges geben. \nTipp: Jedes Robot-Objekt kann das Robot-World-Objekt mit der getRobotWorld() holen.");
            return;
        }

        this.worldHelper.robotWorldHelper = this;

        this.camera = new Pixi3d.Camera(<PIXI.Renderer>this.worldHelper.app.renderer);

        this.robotCubeFactory = new RobotCubeFactory(this.worldHelper, this.camera);

        this.markers = [];
        this.bricks = [];
        for (let x = 0; x < worldX; x++) {
            let markerColumn = [];
            this.markers.push(markerColumn);
            let brickColumn = [];
            this.bricks.push(brickColumn);
            for (let y = 0; y < worldY; y++) {
                markerColumn.push(null);
                brickColumn.push([]);
            }
        }

        this.render();
    }

    fetchWorld(interpreter: Interpreter) {
        let worldHelper = interpreter.worldHelper;
        if (worldHelper == null) {
            let w: RuntimeObject = new RuntimeObject(<Klass>interpreter.moduleStore.getType("World").type);
            worldHelper = new WorldHelper(800, 600, interpreter.moduleStore.getModule("Base Module"), w);
            w.intrinsicData["World"] = worldHelper;
            interpreter.worldHelper = worldHelper;
        }
        this.worldHelper = worldHelper;
    }


    render() {
        this.worldHelper.app.renderer.backgroundColor = 0x8080ff;

        this.container3D = new Pixi3d.Container3D();
        this.displayObject = this.container3D;
        this.worldHelper.stage.addChild(this.displayObject);

        let gp = this.robotCubeFactory.getGroundPlane(this.worldX, this.worldY);
        this.container3D.addChild(gp);

        let sp = this.robotCubeFactory.getSidePlanes(this.worldX, this.worldY);
        for (let p of sp) {
            this.container3D.addChild(p);
        }

        this.addBrick(5, 3, "rot");
        this.addBrick(5, 4, "blau");
        this.addBrick(5, 3, "rot");

        let control = new Pixi3d.CameraOrbitControl(this.worldHelper.app.view, this.camera);
        control.angles.x = 45;
        control.angles.y = -20;
        control.target = { x: this.worldX - 1, y: 0, z: this.worldY - 1 }
        control.distance = Math.max(this.worldX, this.worldY) * 2.3;

    }

    addBrick(x: number, y: number, farbe: string): boolean {
        let oldHeight = this.bricks[x][y].length;
        if (oldHeight < this.maximumHeight) {
            let brick = this.robotCubeFactory.getBrick(farbe);
            this.setToXY(x, y, oldHeight, brick);
            this.bricks[x][y].push(brick);
            this.container3D.addChild(brick);
            this.adjustMarkerHeight(x, y);
            return true;
        } else {
            return false;
        }
    }

    removeBrick(x: number, y: number): boolean {
        if (this.bricks[x][y].length > 0) {
            let brick = this.bricks[x][y].pop();
            brick.destroy();
        } else {
            return false;
        }

    }

    getBrickCount(x: number, y: number) {
        return this.bricks[x][y].length;
    }

    hasBrickColor(x: number, y: number, farbe: string): boolean {
        for (let brick of this.bricks[x][y]) {
            if (brick.farbe == farbe) return true;
        }
        return false;
    }

    getMarkerColor(x: number, y: number): string {
        let marker = this.markers[x][y];
        if (marker == null) return null;
        return marker.farbe;
    }

    setMarker(x: number, y: number, farbe: string) {
        if (this.markers[x][y] != null) {
            this.markers[x][y].destroy();
        }
        let marker = this.robotCubeFactory.getMarker(farbe);
        this.markers[x][y] = marker;
        this.container3D.addChild(marker);
        this.setToXY(x, y, 0, marker);
        this.adjustMarkerHeight(x, y);
    }

    removeMarker(x: number, y: number): boolean {
        let marker = this.markers[x][y];
        if (marker == null) {
            return false;
        } else {
            this.markers[x][y] = null;
            marker.destroy();
            return true;
        }
    }

    adjustMarkerHeight(x: number, y: number) {
        let marker = this.markers[x][y];
        if (marker != null) {
            let height = this.bricks[x][y].length
            marker.y = height + 0.1;
        }
    }

    clear() {
        for (let x = 0; x < this.bricks.length; x++) {
            for (let y = 0; y < this.bricks[x].length; y++) {
                let brickList = this.bricks[x][y];
                while (brickList.length > 0) {
                    brickList.pop().destroy();
                }
            }
        }

        for (let x = 0; x < this.markers.length; x++) {
            for (let y = 0; y < this.markers[x].length; y++) {
                let marker = this.markers[x][y];
                if (marker != null) {
                    this.markers[x][y] = null;
                    marker.destroy();
                }
            }
        }
    }

    setDimensions(worldX: number, worldY: number) {
        this.clear();

        this.worldX = worldX;
        this.worldY = worldY;

        this.markers = [];
        this.bricks = [];
        for (let x = 0; x < worldX; x++) {
            let markerColumn = [];
            this.markers.push(markerColumn);
            let brickColumn = [];
            this.bricks.push(brickColumn);
            for (let y = 0; y < worldY; y++) {
                markerColumn.push(null);
                brickColumn.push([]);
            }
        }
    }

    getNumberOfBricks(x: number, y: number) {
        return this.bricks[x][y].length;
    }

    /**
     * 
     * @param initString 
     * " ": empty 
     * "_": no brick, yellow marker
     * "0y", "0g", "0b": no brick, yellow/green/blue marker
     * "1", ..., "9": 1, ..., 9 red bricks (same is "1r", "2r", ...)
     * "1g", ..., "9g": 1, ..., 9 green bricks
     * "1y", "1b": same in yellow, blue
     * "1gy", ..., "9gy": 1, ...., 9 green bricks with yellog marker
     * "1gb", "2gb": 1, ..., 9 green bricks with blue marker
     */
    initFromString(initString: string) {

    }

    setToXY(x: number, y: number, height: number, mesh: Pixi3d.Mesh3D) {
        mesh.x = 2 * (this.worldX - x - 1);
        mesh.z = 2 * (this.worldY - y - 1);
        mesh.y = height;
    }

    // Wird von WorldHelper aufgerufen
    destroy() {

    }

    gibtFarbe(farbe: string): boolean {
        return this.robotCubeFactory.farben.indexOf(farbe) >= 0;
    }

}


class Direction {
    names: string[] = ["top", "right", "bottom", "left"];
    deltas: { dx: number, dy: number }[] = [{ dx: 0, dy: -1 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 1, dy: 0 }];
    angles: number[] = [0, 90, 180, 270];

    public index: number = 2; // top

    turnRight() {
        this.index = (this.index - 1) % 4;
    }

    turnLeft() {
        this.index = (this.index + 1 + 4) % 4;
    }

    getAngle() {
        return this.angles[this.index];
    }

    getDeltas() {
        return this.deltas[this.index];
    }

}

export class RobotHelper {

    robotWorldHelper: RobotWorldHelper;
    model: Pixi3d.Model;
    x: number;
    y: number;

    direction: Direction = new Direction();

    constructor(private interpreter: Interpreter, private runtimeObject: RuntimeObject,
        private worldX: number, private worldY: number, startX: number = 1, startY: number = 1) {

        this.fetchRobotWorld(interpreter, worldX, worldY);

        this.render();

        this.moveTo(startX - 1, startY - 1);
        this.adjustAngle();

    }

    fetchRobotWorld(interpreter: Interpreter, worldX: number, worldY: number) {
        let worldHelper = interpreter.worldHelper;
        this.robotWorldHelper = worldHelper?.robotWorldHelper;

        if (this.robotWorldHelper == null) {
            let w: RuntimeObject = new RuntimeObject(<Klass>interpreter.moduleStore.getType("RobotWorld").type);
            this.robotWorldHelper = new RobotWorldHelper(interpreter, w, worldX, worldY);
            w.intrinsicData["RobotWorldHelper"] = worldHelper;
        }

    }

    render(): void {

        //@ts-ignore
        let robot = Pixi3d.Model.from(PIXI.Loader.shared.resources["steve"].gltf);
        robot.scale.set(0.1);
        for (let mesh of robot.meshes) {
            let sm = <Pixi3d.StandardMaterial>mesh.material;
            sm.camera = this.robotWorldHelper.camera;
            sm.exposure = 0.5;
            sm.lightingEnvironment = this.robotWorldHelper.robotCubeFactory.lightingEnvironment;
        }
        this.robotWorldHelper.container3D.addChild(robot);
        this.model = robot;

    };

    crop(n: number, min: number, max: number): number {
        if (n < min) n = min;
        if (n > max) n = max;
        return n;
    }

    moveTo(x: number, y: number) {
        const rw = this.robotWorldHelper;
        x = this.crop(x, 0, rw.worldX - 1);
        y = this.crop(y, 0, rw.worldY - 1);

        this.model.x = 2 * (rw.worldX - x - 1);
        this.model.z = 2 * (rw.worldY - y - 1);
        this.model.y = rw.getNumberOfBricks(x, y) + 1.6;

        this.x = x;
        this.y = y;
    }

    adjustAngle() {
        this.model.transform.rotationQuaternion.setEulerAngles(0, this.direction.getAngle(), 0);
    }

    schritt(): boolean {
        let deltas = this.direction.getDeltas();
        let newX = this.x + deltas.dx;
        let newY = this.y + deltas.dy;
        const rw = this.robotWorldHelper;

        if (newX < 0 || newX >= rw.worldX || newY < 0 || newY >= rw.worldY) {
            this.interpreter.throwException("Der Roboter ist gegen eine Wand geprallt!");
            return false;
        }

        this.moveTo(newX, newY);
        return true;
    }

    hinlegen(farbe: string): boolean {
        let deltas = this.direction.getDeltas();
        let newX = this.x + deltas.dx;
        let newY = this.y + deltas.dy;
        const rw = this.robotWorldHelper;

        if (newX < 0 || newX >= rw.worldX || newY < 0 || newY >= rw.worldY) {
            this.interpreter.throwException("Der Roboter steht direkt vor einer Wand. Da kann er keine Ziegel hinlegen.");
            return false;
        }

        farbe = farbe.toLocaleLowerCase();
        if (!rw.gibtFarbe(farbe)) {
            this.interpreter.throwException("Es gibt nur Ziegel der Farben " + rw.robotCubeFactory.farben.join(", ") + ". Die Farbe " + farbe + " ist nicht darunter.");
            return false;
        }

        rw.addBrick(newX, newY, farbe);
        return true;
    }

    aufheben(): boolean {
        let deltas = this.direction.getDeltas();
        let newX = this.x + deltas.dx;
        let newY = this.y + deltas.dy;
        const rw = this.robotWorldHelper;

        if (newX < 0 || newX >= rw.worldX || newY < 0 || newY >= rw.worldY) {
            this.interpreter.throwException("Der Roboter steht direkt vor einer Wand. Da kann er keinen Ziegel aufheben.");
            return false;
        }

        if (rw.getNumberOfBricks(newX, newY) < 1) {
            this.interpreter.throwException("Vor dem Roboter liegt kein Ziegel, er kann daher keinen aufheben.");
            return false;
        }

        rw.removeBrick(newX, newY);
        return true;
    }

    markeSetzen(farbe: string) {
        const rw = this.robotWorldHelper;
        farbe = farbe.toLocaleLowerCase();

        if (!rw.gibtFarbe(farbe)) {
            this.interpreter.throwException("Es gibt nur Marken der Farben " + rw.robotCubeFactory.farben.join(", ") + ". Die Farbe " + farbe + " ist nicht darunter.");
            return false;
        }

        rw.setMarker(this.x, this.y, farbe);
    }

    markeLöschen() {
        const rw = this.robotWorldHelper;

        rw.removeMarker(this.x, this.y);
    }

    istWand(): boolean {
        let deltas = this.direction.getDeltas();
        let newX = this.x + deltas.dx;
        let newY = this.y + deltas.dy;
        const rw = this.robotWorldHelper;

        return (newX < 0 || newX >= rw.worldX || newY < 0 || newY >= rw.worldY)

    }

    istZiegel(param: number | string | undefined): boolean {
        let deltas = this.direction.getDeltas();
        let newX = this.x + deltas.dx;
        let newY = this.y + deltas.dy;
        const rw = this.robotWorldHelper;

        if (newX < 0 || newX >= rw.worldX || newY < 0 || newY >= rw.worldY) {
            return false;
        }

        if (typeof param == "undefined") return rw.getBrickCount(newX, newY) >= 0;

        if (typeof param == "string") {
            return rw.hasBrickColor(newX, newY, param.toLocaleLowerCase());
        }

        return rw.bricks[newX][newY].length == param;

    }

    istMarke(param: string | undefined): boolean {
        const rw = this.robotWorldHelper;
        let marke = rw.markers[this.x][this.y];
        if (typeof param == "undefined") return marke != null;

        if (typeof param == "string") {
            return marke != null && marke.farbe == param.toLocaleLowerCase();
        }

        return false;
    }


}
