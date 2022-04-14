import { Module } from "../../../compiler/parser/Module.js";
import { Klass } from "../../../compiler/types/Class.js";
import { doublePrimitiveType, intPrimitiveType } from "../../../compiler/types/PrimitiveTypes.js";
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
            { identifier: "worldX", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "worldY", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let worldX: number = parameters[1].value;
                let worldY: number = parameters[2].value;

                let rh = new RobotHelper(module.main.getInterpreter(), o, worldX, worldY);
                o.intrinsicData["Actor"] = rh;

            }, false, false, 'Instanziert ein neues Robot-Objekt', true));




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
        control.angles.x = 20;
        control.target = { x: this.worldX - 1, y: 0, z: this.worldY - 1 }
        control.distance = Math.max(this.worldX, this.worldY) + 8;

    }

    addBrick(x: number, y: number, farbe: string): boolean {
        let oldHeight = this.bricks[x][y].length;
        if(oldHeight < this.maximumHeight){
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
        if(this.bricks[x][y].length > 0){
            let brick = this.bricks[x][y].pop();
            brick.destroy();
        } else {
            return false;
        }

    }

    getBrickCount(x: number, y: number){
        return this.bricks[x][y].length;
    }

    getBrickColor(x: number, y: number): string {
        let brickCount = this.bricks[x][y].length;
        if(brickCount == 0) return null;
        return this.bricks[x][y][brickCount - 1].farbe;
    }

    getMarkerColor(x: number, y: number): string {
        let marker = this.markers[x][y];
        if(marker == null) return null;
        return marker.farbe;
    }

    setMarker(x: number, y: number, farbe: string){
        if(this.markers[x][y] != null){
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
        if(marker == null){
            return false;
        } else {
            this.markers[x][y] = null;
            marker.destroy();
            return true;
        }
    }

    adjustMarkerHeight(x: number, y: number){
        let marker = this.markers[x][y];
        if(marker != null){
            let height = this.bricks[x][y].length
            marker.y = height + 0.1;
        }
    }

    clear(){
        for(let x = 0; x < this.bricks.length; x++){
            for(let y = 0; y < this.bricks[x].length; y++){
                let brickList = this.bricks[x][y];
                while(brickList.length > 0){
                    brickList.pop().destroy();
                }
            }
        }
        
        for(let x = 0; x < this.markers.length; x++){
            for(let y = 0; y < this.markers[x].length; y++){
                let marker = this.markers[x][y];
                if(marker != null){
                    this.markers[x][y] = null;
                    marker.destroy();
                }
            }
        }
    }

    setDimensions(worldX: number, worldY: number){
        this.clear();

        this.worldX = worldX;
        this.worldY = worldY;

        this.markers = [];
        this.bricks = [];
        for(let x = 0; x < worldX; x++){
            let markerColumn = [];
            this.markers.push(markerColumn);
            let brickColumn = [];
            this.bricks.push(brickColumn);
            for(let y = 0; y < worldY; y++){
                markerColumn.push(null);
                brickColumn.push([]);
            }
        }
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
    initFromString(initString: string){
        
    }

    setToXY(x: number, y: number, height: number, mesh: Pixi3d.Mesh3D) {
        mesh.x = 2 * (this.worldX - x);
        mesh.z = 2 * (y - 1);
        mesh.y = height;
    }

    // Wird von WorldHelper aufgerufen
    destroy() {

    }

}

export class RobotHelper {

    robotWorldHelper: RobotWorldHelper;
    model: Pixi3d.Model;

    constructor(private interpreter: Interpreter, private runtimeObject: RuntimeObject, private worldX: number, private worldY: number) {

        this.fetchRobotWorld(interpreter);

        this.render();

    }

    fetchRobotWorld(interpreter: Interpreter) {
        let worldHelper = interpreter.worldHelper;
        this.robotWorldHelper = worldHelper?.robotWorldHelper;

        if (this.robotWorldHelper == null) {
            let w: RuntimeObject = new RuntimeObject(<Klass>interpreter.moduleStore.getType("RobotWorld").type);
            this.robotWorldHelper = new RobotWorldHelper(interpreter, w, 20, 20);
            w.intrinsicData["RobotWorldHelper"] = worldHelper;
        }

    }

    render(): void {

        //@ts-ignore
        let robot = Pixi3d.Model.from(PIXI.Loader.shared.resources["steve"].gltf);
        robot.scale.set(0.1);
        robot.x = 5;
        robot.z = 5;
        robot.y = 1.6;
        for (let mesh of robot.meshes) {
            let sm = <Pixi3d.StandardMaterial>mesh.material;
            sm.camera = this.robotWorldHelper.camera;
            sm.exposure = 0.5;
            sm.lightingEnvironment = this.robotWorldHelper.robotCubeFactory.lightingEnvironment;
        }
        this.robotWorldHelper.container3D.addChild(robot);
        this.model = robot;

    };


}
