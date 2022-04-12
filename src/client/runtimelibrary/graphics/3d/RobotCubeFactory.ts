import { Mesh3D } from "pixi3d";
import { WorldHelper } from "../World.js";
import { Boxes3d } from "./Boxes3d.js";

export function getSpritesheetTexture(identifier: string, copy: boolean = false, renderer: PIXI.Renderer = null) {
    let sheet = PIXI.Loader.shared.resources["spritesheet"].spritesheet;
    let texture = sheet.textures[identifier];

    if (copy) {
        let sprite = new PIXI.Sprite(texture);

        let dynamicTexture1 = PIXI.RenderTexture.create({
            width: sprite.width,
            height: sprite.height,
            scaleMode: PIXI.SCALE_MODES.NEAREST,
            wrapMode: PIXI.WRAP_MODES.REPEAT
        });

        renderer.render(sprite, {
            renderTexture: dynamicTexture1
        });

        return new Pixi3d.StandardMaterialTexture(dynamicTexture1.baseTexture);        
    } else {
        let smt = new Pixi3d.StandardMaterialTexture(texture.baseTexture);
        smt.transform = new Pixi3d.TextureTransform()
        smt.transform.offset.set(
            (texture.frame.x + 0) / texture.baseTexture.width,
            (texture.frame.y + 0) / texture.baseTexture.height
        )
        smt.transform.scale.set(
            texture.frame.width / texture.baseTexture.width,
            texture.frame.height / texture.baseTexture.height
        )
        return smt;

    }


}

export class RobotMarker extends Pixi3d.Mesh3D {
    constructor(geometry: Pixi3d.MeshGeometry3D, material: Pixi3d.Material, public farbe: string){
        super(geometry, material);
    }
}

export class RobotBrick extends Pixi3d.Mesh3D {
    constructor(geometry: Pixi3d.MeshGeometry3D, material: Pixi3d.Material, public farbe: string){
        super(geometry, material);
    }
}

export class RobotCubeFactory {

    farben: string[] = ["rot", "gelb", "grün", "blau"];
    farbeToColorInfoMap: {[farbe: string] : number[]} = {
        "rot": [1.0, 0.0, 0.0],
        "gelb": [1.0, 1.0, 0.0],
        "grün": [0.0, 1.0, 0.0],
        "blau": [0.0, 0.0, 1.0]
    }
    farbeToMarkerMaterialMap: {[farbe: string] : Pixi3d.StandardMaterial} = {};
    farbeToBrickMaterialMap: {[farbe: string] : Pixi3d.StandardMaterial} = {};


    grassBrickMaterial: Pixi3d.StandardMaterial;
    groundPlaneMaterial: Pixi3d.StandardMaterial;
    sidePlaneMaterial: Pixi3d.StandardMaterial;

    light1: Pixi3d.Light;
    light2: Pixi3d.Light;
    lightingEnvironment: Pixi3d.LightingEnvironment;



    getBrick(farbe: string) {
        return new RobotBrick(Boxes3d.createHalfheightCube3dMesh(), this.farbeToBrickMaterialMap[farbe], farbe);
    }

    getGrassBrick() {
        return new Pixi3d.Mesh3D(Boxes3d.createCube3dMesh(), this.grassBrickMaterial);
    }

    getGroundPlane(x: number, z: number) {
        let mesh = new Pixi3d.Mesh3D(Boxes3d.createPlane3dMesh(x, z), this.groundPlaneMaterial);
        mesh.scale.x = x;
        mesh.scale.z = z;
        mesh.x += x - 1;
        mesh.z += z - 1;
        //let plane = Pixi3d.Mesh3D.createPlane();
        // (<Pixi3d.StandardMaterial>plane.material).baseColor = new Pixi3d.Color(0, 1, 0, 1); // The base color will be blended together with base color texture (if available).
        // plane.y = -0.5;
        // plane.scale.set(10);
        return mesh;
    }

    getMarker(farbe: string){
        let marker = new RobotMarker(Boxes3d.createCube3dMesh(), this.farbeToMarkerMaterialMap[farbe], farbe);
        marker.scale.set(0.9, 0.1, 0.9);
        return marker;
    }

    getSidePlanes(x: number, z: number): Mesh3D[]{
        let planes: Mesh3D[] = [];
        let mesh1 = new Pixi3d.Mesh3D(Boxes3d.createPlane3dMesh(x, 1), this.sidePlaneMaterial);
        mesh1.scale.x = x;
        mesh1.x += x - 1;
        mesh1.y -= 1;
        mesh1.z -= 1;
        mesh1.rotationQuaternion.setEulerAngles(-90, 0, 180);
        planes.push(mesh1);

        let mesh2 = new Pixi3d.Mesh3D(Boxes3d.createPlane3dMesh(x, 1), this.sidePlaneMaterial);
        mesh2.scale.x = x;
        mesh2.x += x - 1;
        mesh2.y -= 1;
        mesh2.z += 2*z - 1;
        mesh2.rotationQuaternion.setEulerAngles(90, 0, 0);
        planes.push(mesh2);

        let mesh3 = new Pixi3d.Mesh3D(Boxes3d.createPlane3dMesh(z, 1), this.sidePlaneMaterial);
        mesh3.scale.x = z;
        mesh3.y -= 1;
        mesh3.x -= 1;
        mesh3.z += z - 1;
        mesh3.rotationQuaternion.setEulerAngles(90, -90, 0);
        planes.push(mesh3);

        let mesh4 = new Pixi3d.Mesh3D(Boxes3d.createPlane3dMesh(z, 1), this.sidePlaneMaterial);
        mesh4.scale.x = z;
        mesh4.y -= 1;
        mesh4.x += 2*x - 1;
        mesh4.z += z - 1;
        mesh4.rotationQuaternion.setEulerAngles(90, 90, 0);
        planes.push(mesh4);
        return planes;
    }

    constructor(worldHelper: WorldHelper, private camera: Pixi3d.Camera) {

        let renderer = <PIXI.Renderer>worldHelper.app.renderer;

        this.light1 = Object.assign(new Pixi3d.Light(), {
            type: Pixi3d.LightType.ambient,
            range: 100,
            intensity: 30,
            color: new Pixi3d.Color(1, 1, 1)
        });
        this.light1.position.set(-4, 4, 4);

        this.light2 = Object.assign(new Pixi3d.Light(), {
            type: Pixi3d.LightType.directional,
            range: 600,
            intensity: 4,
            color: new Pixi3d.Color(1, 1, 1)
        });
        this.light2.position.set(12, 16, -12);
        this.light2.rotationQuaternion.setEulerAngles(25, 45, 0);

        this.lightingEnvironment = new Pixi3d.LightingEnvironment(<PIXI.Renderer>worldHelper.app.renderer);
        this.lightingEnvironment.lights.push(this.light1, this.light2);


        this.grassBrickMaterial = new Pixi3d.StandardMaterial();
        this.initMaterial(this.grassBrickMaterial);
        this.grassBrickMaterial.baseColorTexture = getSpritesheetTexture("3d#0");

        this.groundPlaneMaterial = new Pixi3d.StandardMaterial();
        this.initMaterial(this.groundPlaneMaterial);
        this.groundPlaneMaterial.baseColorTexture = getSpritesheetTexture("3d#2", true, renderer);

        this.sidePlaneMaterial = new Pixi3d.StandardMaterial();
        this.initMaterial(this.sidePlaneMaterial);
        this.sidePlaneMaterial.baseColorTexture = getSpritesheetTexture("3d#3", true, renderer);

        for(let farbe of this.farben){
            let material = new Pixi3d.StandardMaterial();
            this.initMaterial(material);
            let colorInfo = this.farbeToColorInfoMap[farbe];
            material.baseColor = new Pixi3d.Color(colorInfo[0], colorInfo[1], colorInfo[2], 1);
            this.farbeToMarkerMaterialMap[farbe] = material;

            let brickMaterial = new Pixi3d.StandardMaterial();
            this.initMaterial(brickMaterial);
            let index = this.farben.indexOf(farbe) + 4;
            brickMaterial.baseColorTexture = getSpritesheetTexture("3d#" + index);
            this.farbeToBrickMaterialMap[farbe] = brickMaterial;
        }

    }

    initMaterial(material: Pixi3d.StandardMaterial){
        material.camera = this.camera;
        material.exposure = 1;
        material.roughness = 0.9;
        material.lightingEnvironment = this.lightingEnvironment;
    }

}