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

        super("Robot", module, "Java Karol");

        this.setBaseClass(<Klass>module.typeStore.getType("Shape"));

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

export class RobotWorldHelper {

    robotCubeFactory: RobotCubeFactory;
    camera: Pixi3d.Camera;
    displayObject: PIXI.DisplayObject;
    container3D: Pixi3d.Container3D;
    
    markers: RobotMarker[][];    // x, y
    bricks: RobotBrick[][][];   // x, y, height

    maximumHeight: number = 10;

    constructor(public worldHelper: WorldHelper, public worldX: number, public worldY: number) {
        this.camera = new Pixi3d.Camera(<PIXI.Renderer>this.worldHelper.app.renderer);
        
        this.robotCubeFactory = new RobotCubeFactory(this.worldHelper, this.camera);

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

        this.render();
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

        this.setMarker(3, 2, "rot");
        
        let control = new Pixi3d.CameraOrbitControl(this.worldHelper.app.view, this.camera);
        control.angles.x = 20;
        control.target = {x: this.worldX - 1, y: 0, z: this.worldY - 1}
        control.distance = Math.max(this.worldX, this.worldY) + 8;

    }

    addBrick(x: number, y: number, farbe: string){
        let oldHeight = this.bricks[x][y].length;
        if(oldHeight < this.maximumHeight){
            let brick = this.robotCubeFactory.getBrick(farbe);
            this.setToXY(x, y, oldHeight, brick);
            this.bricks[x][y].push(brick);
            this.container3D.addChild(brick);
        }
        this.adjustMarkerHeight(x, y);
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

    

    adjustMarkerHeight(x: number, y: number){
        let marker = this.markers[x][y];
        if(marker != null){
            let height = this.bricks[x][y].length
            marker.y = height + 0.1;
        }
    }



    setToXY(x: number, y: number, height: number, mesh: Pixi3d.Mesh3D){
        mesh.x = 2*(this.worldX - x);
        mesh.z = 2*(y - 1);
        mesh.y = height;
    }

    // Wird von WorldHelper aufgerufen
    destroy(){

    }

}

export class RobotHelper extends ShapeHelper {

    robotWorldHelper: RobotWorldHelper;

    constructor(interpreter: Interpreter, runtimeObject: RuntimeObject, private worldX: number, private worldY: number) {
        super(interpreter, runtimeObject);

        this.centerXInitial = 0;
        this.centerYInitial = 0;

        if (this.worldHelper.robotWorldHelper == null) {
            this.worldHelper.robotWorldHelper = new RobotWorldHelper(this.worldHelper, worldX, worldY);
        }

        this.robotWorldHelper = this.worldHelper.robotWorldHelper;

        this.render();
        this.addToDefaultGroupAndSetDefaultVisibility();

    }

    getCopy(klass: Klass): RuntimeObject {

        let ro: RuntimeObject = new RuntimeObject(klass);
        let rh = new RobotHelper(this.worldHelper.interpreter, ro, this.worldX, this.worldY);
        ro.intrinsicData["Actor"] = rh;

        rh.copyFrom(this);
        rh.render();

        this.addToDefaultGroupAndSetDefaultVisibility();

        return ro;
    }

    render(): void {

        this.hitPolygonInitial = [
        ];


        if (this.displayObject == null) {

            //@ts-ignore
            let robot = Pixi3d.Model.from(PIXI.Loader.shared.resources["steve"].gltf);
            robot.scale.set(0.1);
            robot.x = 5;
            robot.z = 5;
            robot.y = 1.6;
            for(let mesh of robot.meshes){
                let sm = <Pixi3d.StandardMaterial>mesh.material;
                sm.camera = this.robotWorldHelper.camera;
                sm.exposure = 0.5;
                sm.lightingEnvironment = this.robotWorldHelper.robotCubeFactory.lightingEnvironment;
            }
            this.robotWorldHelper.container3D.addChild(robot);
            this.displayObject = robot;
        }

    };


}
