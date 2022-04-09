// import { Module } from "../../compiler/parser/Module.js";
// import { Klass } from "../../compiler/types/Class.js";
// import { doublePrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
// import { Method, Parameterlist } from "../../compiler/types/Types.js";
// import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
// import { FilledShapeHelper } from "./FilledShape.js";
// import { WorldHelper } from "./World.js";
// import { Interpreter } from "../../interpreter/Interpreter.js";
// import { FilledShapeDefaults } from "./FilledShapeDefaults.js";
// import { ShapeHelper } from "./Shape.js";

// export class RobotClass extends Klass {

//     constructor(module: Module) {

//         super("Robot", module, "Java Karol");

//         this.setBaseClass(<Klass>module.typeStore.getType("Shape"));

//         // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));

//         this.addMethod(new Method("Robot", new Parameterlist([
//             // { identifier: "left", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             // { identifier: "top", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             // { identifier: "width", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             // { identifier: "height", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//         ]), null,
//             (parameters) => {

//                 let o: RuntimeObject = parameters[0].value;
                
//                 let rh = new RobotHelper(module.main.getInterpreter(), o);
//                 o.intrinsicData["Actor"] = rh;
                
//             }, false, false, 'Instanziert ein neues Robot-Objekt', true));
            
//             // this.addMethod(new Method("setWidth", new Parameterlist([
//             //     { identifier: "width", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
//             // ]), null,
//             // (parameters) => {
                
//             //     let o: RuntimeObject = parameters[0].value;
//             //     let sh: RectangleHelper = o.intrinsicData["Actor"];
//             //     let width: number = parameters[1].value;
                
//             //     if (sh.testdestroyed("setWidth")) return;

//             //     sh.width = width / sh.displayObject.scale.x;
//             //     sh.centerXInitial = sh.left + sh.width/2;

//             //     sh.render();

//             // }, false, false, "Setzt die Breite des Rechtecks.", false));

    

//     }

// }

// export class RobotHelper extends ShapeHelper {

//     constructor(interpreter: Interpreter, runtimeObject: RuntimeObject) {
//         super(interpreter, runtimeObject);
//         this.centerXInitial = 0;
//         this.centerYInitial = 0;

//         this.render();

//         this.addToDefaultGroupAndSetDefaultVisibility();

//     }

//     getCopy(klass: Klass): RuntimeObject {

//         let ro: RuntimeObject = new RuntimeObject(klass);
//         let rh = new RobotHelper(this.worldHelper.interpreter, ro);
//         ro.intrinsicData["Actor"] = rh;

//         rh.copyFrom(this);
//         rh.render();

//         this.addToDefaultGroupAndSetDefaultVisibility();

//         return ro;
//     }

//     render(): void {

//         this.hitPolygonInitial = [
//         ];

//         this.worldHelper.app.renderer.backgroundColor = 0xffffff;

//         if (this.displayObject == null) {
//             let mesh = PIXI3D.Mesh3D.createCube()
//             let plane = PIXI3D.Mesh3D.createPlane();
//             plane.y = -0.8;
//             plane.scale.set(150);

//             let container3D = new PIXI3D.Container3D();
//             container3D.addChild(mesh);
//             container3D.addChild(plane);

//             this.displayObject = container3D;
//             this.worldHelper.stage.addChild(this.displayObject);

//             let light1 = Object.assign(new PIXI3D.Light(), {
//                 type: PIXI3D.LightType.point,
//                 range: 100,
//                 intensity: 60,
//                 color: new PIXI3D.Color(1, 1, 1)
//               });
//             light1.position.set(-4, 7, 4);
//             let light2 = Object.assign(new PIXI3D.Light(), {
//                 type: PIXI3D.LightType.point,
//                 range: 100,
//                 intensity: 60,
//                 color: new PIXI3D.Color(1, 1, 1)
//               });
//             light2.position.set(4, 7, -4);
//             // light.rotationQuaternion.setEulerAngles(45, 45, 0);
            
            
//             let lightingEnvironment = new PIXI3D.LightingEnvironment(<PIXI.Renderer>this.worldHelper.app.renderer);
//             lightingEnvironment.lights.push(light1, light2);
//             let camera = new PIXI3D.Camera(<PIXI.Renderer>this.worldHelper.app.renderer);

//             for(let mesh of container3D.children as PIXI3D.Mesh3D[]){
//                 let material = <PIXI3D.StandardMaterial>mesh.material;
//                 material.lightingEnvironment = lightingEnvironment;
//                 material.camera = camera;
//                 material.baseColor = new PIXI3D.Color(1, 0, 0, 1); // The base color will be blended together with base color texture (if available).
//                 material.unlit = false; // Set unlit = true to disable all lighting.
//             }
//             // material.alphaMode = PIXI3D.StandardMaterialAlphaMode.opaque; // Set alpha mode to "blend" for transparency (base color alpha less than 1).
//             // material.exposure = 2; // Set exposure to be able to control the brightness.
//             // material.metallic = 0; // Set to 1 for a metallic material.
//             // material.roughness = 0.3; // Value between 0 and 1 which describes the roughness of the material.
        
//             // material.emissive = new PIXI3D.Color(1.0, 0.0, 0.0, 1.0);
//             // material.baseColor = new PIXI3D.Color(1.0, 0.3, 0.3, 1.0);
            
//             let control = new PIXI3D.CameraOrbitControl(this.worldHelper.app.view, camera);
//             control.angles.x = 20;
//         } 


//     };


// }
