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
    constructor(geometry: Pixi3d.MeshGeometry3D, material: Pixi3d.Material, public farbe: string) {
        super(geometry, material);
    }
}

export class RobotBrick extends Pixi3d.Mesh3D {
    constructor(geometry: Pixi3d.MeshGeometry3D, material: Pixi3d.Material, public farbe: string) {
        super(geometry, material);
    }
}

export class RobotCubeFactory {

    farben: string[] = ["rot", "gelb", "grün", "blau"];
    farbeToColorInfoMap: { [farbe: string]: number[] } = {
        "rot": [1.0, 0.0, 0.0],
        "gelb": [1.0, 1.0, 0.0],
        "grün": [0.0, 1.0, 0.0],
        "blau": [0.0, 0.0, 1.0]
    }
    farbeToMarkerMaterialMap: { [farbe: string]: Pixi3d.StandardMaterial } = {};
    farbeToBrickMaterialMap: { [farbe: string]: Pixi3d.StandardMaterial } = {};


    grassBrickMaterial: Pixi3d.StandardMaterial;
    groundPlaneMaterial: Pixi3d.StandardMaterial;

    planeMaterial: { [key: string]: Pixi3d.StandardMaterial } = {};

    cloudMaterial: Pixi3d.StandardMaterial;

    light1: Pixi3d.Light;
    light2: Pixi3d.Light;
    lightingEnvironment: Pixi3d.LightingEnvironment;



    getBrick(farbe: string) {
        return new RobotBrick(Boxes3d.createHalfheightCube3dMesh(), this.farbeToBrickMaterialMap[farbe], farbe);
    }

    getGrassBrick() {
        return new Pixi3d.Mesh3D(Boxes3d.createCube3dMesh(), this.grassBrickMaterial);
    }

    getGrassPlane(x: number, z: number) {
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

    makePlane(container: Pixi3d.Container3D, x: number, y: number, z: number, widthX: number, widthZ: number, spriteOrColor: string | Pixi3d.Color) {
        let material: Pixi3d.StandardMaterial;
        if (typeof spriteOrColor == "string") {
            material = this.getPlaneMaterial(spriteOrColor);
        } else {
            material = new Pixi3d.StandardMaterial();
            this.initMaterial(material);
            material.baseColor = spriteOrColor;
        }
        let mesh = new Pixi3d.Mesh3D(Boxes3d.createPlane3dMesh(widthX, widthZ), material);
        mesh.y = y;
        mesh.x = x;
        mesh.z = z;
        mesh.scale.set(widthX, 1, widthZ);
        container.addChild(mesh);
    }

    getMarker(farbe: string) {
        let marker = new RobotMarker(Boxes3d.createCube3dMesh(), this.farbeToMarkerMaterialMap[farbe], farbe);
        marker.scale.set(0.9, 0.1, 0.9);
        return marker;
    }

    getSidePlanes(worldX: number, worldY: number, sideSprite: string, radius: number, deep: number): Pixi3d.Mesh3D[] {
        let planes: Pixi3d.Mesh3D[] = [];

        let sideMaterial = this.getPlaneMaterial(sideSprite); //3d#3

        let mesh1 = new Pixi3d.Mesh3D(Boxes3d.createPlane3dMesh(worldX, 1), sideMaterial);
        mesh1.scale.x = worldX + 2 * radius;
        mesh1.x += worldX - 1;
        mesh1.y -= 1 + 2 * deep;
        mesh1.z -= 1 + 2 * radius;
        mesh1.rotationQuaternion.setEulerAngles(-90, 0, 180);
        planes.push(mesh1);

        let mesh2 = new Pixi3d.Mesh3D(Boxes3d.createPlane3dMesh(worldX, 1), sideMaterial);
        mesh2.scale.x = worldX + 2 * radius;
        mesh2.x += worldX - 1;
        mesh2.y -= 1 + 2 * deep;
        mesh2.z += 2 * worldY - 1 + 2 * radius;
        mesh2.rotationQuaternion.setEulerAngles(90, 0, 0);
        planes.push(mesh2);

        let mesh3 = new Pixi3d.Mesh3D(Boxes3d.createPlane3dMesh(worldY, 1), sideMaterial);
        mesh3.scale.x = worldY + 2 * radius;
        mesh3.y -= 1 + 2 * deep;
        mesh3.x -= 1 + 2 * radius;
        mesh3.z += worldY - 1;
        mesh3.rotationQuaternion.setEulerAngles(90, -90, 0);
        planes.push(mesh3);

        let mesh4 = new Pixi3d.Mesh3D(Boxes3d.createPlane3dMesh(worldY, 1), sideMaterial);
        mesh4.scale.x = worldY + 2 * radius;
        mesh4.y -= 1 + 2 * deep;
        mesh4.x += 2 * worldX - 1 + 2 * radius;
        mesh4.z += worldY - 1;
        mesh4.rotationQuaternion.setEulerAngles(90, 90, 0);
        planes.push(mesh4);

        return planes;
    }

    getHorizontalPlanes(worldX: number, worldY: number, topSprite: string, radius: number, deep: number): Pixi3d.Mesh3D[] {
        let planes: Pixi3d.Mesh3D[] = [];

        let topMaterial = this.getPlaneMaterial(topSprite);

        let mesh5 = new Pixi3d.Mesh3D(Boxes3d.createPlane3dMesh(worldY, 1), topMaterial);
        mesh5.scale.x = worldX + 2 * radius;
        mesh5.x += worldX - 1;
        mesh5.y -= 2 + 2 * deep;
        mesh5.z -= 2 + 2 * radius;
        mesh5.rotationQuaternion.setEulerAngles(180, 0, 180);
        planes.push(mesh5);

        let mesh6 = new Pixi3d.Mesh3D(Boxes3d.createPlane3dMesh(worldX, 1), topMaterial);
        mesh6.scale.x = worldX + 2 * radius;
        mesh6.x += worldX - 1;
        mesh6.y -= 2 + 2 * deep;
        mesh6.z += 2 * worldY + 2 * radius;
        mesh6.rotationQuaternion.setEulerAngles(0, 0, 0);
        planes.push(mesh6);

        let mesh7 = new Pixi3d.Mesh3D(Boxes3d.createPlane3dMesh(worldY, 1), topMaterial);
        mesh7.scale.x = worldY + 2 * radius + 2;
        mesh7.y -= 2 + 2 * deep;
        mesh7.x -= 2 + 2 * radius;
        mesh7.z += worldY - 1;
        mesh7.rotationQuaternion.setEulerAngles(0, -90, 0);
        planes.push(mesh7);

        let mesh8 = new Pixi3d.Mesh3D(Boxes3d.createPlane3dMesh(worldY, 1), topMaterial);
        mesh8.scale.x = worldY + 2 * radius + 2;
        mesh8.y -= 2 + 2 * deep;
        mesh8.x += 2 * worldX + 2 * radius;
        mesh8.z += worldY - 1;
        mesh8.rotationQuaternion.setEulerAngles(0, 90, 0);
        planes.push(mesh8);

        return planes;
    }

    makeClouds(container: Pixi3d.Container3D, height: number, originX: number, originZ: number) {
        let count = 150;
        let numberOfBatches = 20;
        let todo = count;

        let f = () => {
            if (todo <= 0) return;
            let radius = 1500;
            let maxWidth = 20;
            for (let i = 0; i < count / numberOfBatches; i++) {
                todo--;
                let distance = Math.sqrt(Math.random()) * radius;
                let angle = Math.random() * 2 * Math.PI;

                let x1 = Math.floor(distance * Math.cos(angle)) + originX;
                let z1 = Math.floor(distance * Math.sin(angle)) + originZ;

                let count = Math.random() * 10 + 2;

                for (let j = 0; j < count; j++) {
                    let mesh = Boxes3d.createCube3d(this.cloudMaterial);

                    let scaleX = Math.floor(Math.random() * maxWidth + 2);
                    let scaleY = Math.floor(Math.random() * maxWidth / 4 + 2);
                    let scaleZ = Math.floor(Math.random() * maxWidth + 2);

                    let dx = Math.floor(Math.random() * 3 * (5 + count + scaleX));
                    let dz = Math.floor(Math.random() * 3 * (5 + count + scaleZ));

                    mesh.x = x1 + dx;
                    mesh.z = z1 + dz;

                    mesh.y = height + scaleY / 2;

                    mesh.scale.set(scaleX, scaleY, scaleZ);

                    container.addChild(mesh);

                }

            }

            setTimeout(f, 200);

        }

        f();

    }

    constructor(private worldHelper: WorldHelper, private camera: Pixi3d.Camera) {

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
        this.grassBrickMaterial.baseColorTexture = getSpritesheetTexture("robot#0");

        this.cloudMaterial = new Pixi3d.StandardMaterial();
        this.initMaterial(this.cloudMaterial);
        this.cloudMaterial.baseColor = new Pixi3d.Color(1.0, 1.0, 1.0, 0.5);

        this.groundPlaneMaterial = new Pixi3d.StandardMaterial();
        this.initMaterial(this.groundPlaneMaterial);
        this.groundPlaneMaterial.baseColorTexture = getSpritesheetTexture("robot#2", true, renderer);

        for (let farbe of this.farben) {
            let material = new Pixi3d.StandardMaterial();
            this.initMaterial(material);
            let colorInfo = this.farbeToColorInfoMap[farbe];
            material.baseColor = new Pixi3d.Color(colorInfo[0], colorInfo[1], colorInfo[2], 1);
            this.farbeToMarkerMaterialMap[farbe] = material;

            let brickMaterial = new Pixi3d.StandardMaterial();
            this.initMaterial(brickMaterial);
            let index = this.farben.indexOf(farbe) + 4;
            brickMaterial.baseColorTexture = getSpritesheetTexture("robot#" + index);
            this.farbeToBrickMaterialMap[farbe] = brickMaterial;
        }

    }

    initMaterial(material: Pixi3d.StandardMaterial) {
        material.camera = this.camera;
        material.exposure = 1;
        material.roughness = 0.9;
        material.lightingEnvironment = this.lightingEnvironment;
    }

    getPlaneMaterial(spriteKey: string): Pixi3d.StandardMaterial {
        let renderer = <PIXI.Renderer>this.worldHelper.app.renderer;

        if (this.planeMaterial[spriteKey] != null) return this.planeMaterial[spriteKey];

        let material = new Pixi3d.StandardMaterial();
        this.initMaterial(material);
        material.baseColorTexture = getSpritesheetTexture(spriteKey, true, renderer);
        // material.doubleSided = true;
        this.planeMaterial[spriteKey] = material;

        return material;
    }

    makeSprite3d(textureKey: string, container: Pixi3d.Container3D){
        let material = new Pixi3d.StandardMaterial();
        this.initMaterial(material);
        material.baseColorTexture = getSpritesheetTexture(textureKey, false);
        material.alphaMode = Pixi3d.StandardMaterialAlphaMode.mask;
        let sprite = Boxes3d.createPlane3d(1, 1, material);
        container.addChild(sprite);
        return sprite;
    }

}