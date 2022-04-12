declare module 'pixi3d/animation' {
  import * as PIXI from "pixi.js";
  /**
   * Represents an animation.
   */
  export abstract class Animation extends PIXI.utils.EventEmitter {
      name?: string | undefined;
      private _ticker?;
      private _update?;
      /** The duration (in seconds) of this animation. */
      abstract readonly duration: number;
      /** The current position (in seconds) of this animation. */
      abstract position: number;
      /** The speed that the animation will play at. */
      speed: number;
      /** A value indicating if the animation is looping. */
      loop: boolean;
      /**
       * Creates a new animation with the specified name.
       * @param name Name for the animation.
       */
      constructor(name?: string | undefined);
      /**
       * Starts playing the animation using the specified ticker.
       * @param ticker The ticker to use for updating the animation. If a ticker
       * is not given, the shared ticker will be used.
       */
      play(ticker?: PIXI.Ticker): void;
      /**
       * Stops playing the animation.
       */
      stop(): void;
      /**
       * Updates the animation by the specified delta time.
       * @param delta The time in seconds since last frame.
       */
      update(delta: number): void;
  }

}
declare module 'pixi3d/camera/camera-orbit-control' {
  import * as PIXI from "pixi.js";
  import { Camera } from "pixi3d/camera/camera";
  /**
   * Allows the user to control the camera by orbiting the target.
   */
  export class CameraOrbitControl {
      camera: Camera;
      private _distance;
      private _grabbed;
      private _angles;
      /**
       * Orientation euler angles (x-axis and y-axis). The angle for the x-axis
       * will be clamped between -85 and 85 degrees.
       */
      get angles(): PIXI.ObservablePoint<undefined>;
      /** Target position (x, y, z) to orbit. */
      target: {
          x: number;
          y: number;
          z: number;
      };
      /** Allows the camera to be controlled by user. */
      allowControl: boolean;
      /**
       * Creates a new camera orbit control.
       * @param element The element for listening to user events.
       * @param camera The camera to control. If not set, the main camera will be used
       * by default.
       */
      constructor(element: HTMLElement, camera?: Camera);
      /**
       * Updates the position and rotation of the camera.
       */
      updateCamera(): void;
      /**
       * Distance between camera and the target. Default value is 5.
       */
      get distance(): number;
      set distance(value: number);
  }

}
declare module 'pixi3d/camera/camera' {
  import * as PIXI from "pixi.js";
  import { Container3D } from "pixi3d/container";
  import { Ray } from "pixi3d/math/ray";
  import { ObservablePoint3D } from "pixi3d/transform/observable-point";
  import { TransformId } from "pixi3d/transform/transform-id";
  /**
   * Camera is a device from which the world is viewed.
   */
  export class Camera extends Container3D implements TransformId {
      renderer: PIXI.Renderer;
      private _transformId;
      get transformId(): number;
      private _projection?;
      private _view?;
      private _viewProjection?;
      private _orthographic;
      private _orthographicSize;
      private _obliqueness;
      /**
       * Used for making the frustum oblique, which means that one side is at a
       * smaller angle to the centre line than the opposite side. Only works with
       * perspective projection.
       */
      get obliqueness(): PIXI.IPointData;
      set obliqueness(value: PIXI.IPointData);
      /** Main camera which is used by default. */
      static main: Camera;
      /**
       * Creates a new camera using the specified renderer. By default the camera
       * looks towards negative z and is positioned at z = 5.
       * @param renderer Renderer to use.
       */
      constructor(renderer: PIXI.Renderer);
      destroy(options?: boolean | PIXI.IDestroyOptions): void;
      /**
       * The camera's half-size when in orthographic mode. The visible area from
       * center of the screen to the top.
       */
      get orthographicSize(): number;
      set orthographicSize(value: number);
      /**
       * Camera will render objects uniformly, with no sense of perspective.
       */
      get orthographic(): boolean;
      set orthographic(value: boolean);
      /**
       * Converts screen coordinates to a ray.
       * @param x Screen x coordinate.
       * @param y Screen y coordinate.
       * @param viewSize The size of the view when not rendering to the entire screen.
       */
      screenToRay(x: number, y: number, viewSize?: {
          width: number;
          height: number;
      }): Ray | undefined;
      /**
       * Converts screen coordinates to world coordinates.
       * @param x Screen x coordinate.
       * @param y Screen y coordinate.
       * @param distance Distance from the camera.
       * @param point Point to set.
       * @param viewSize The size of the view when not rendering to the entire screen.
       */
      screenToWorld(x: number, y: number, distance: number, point?: ObservablePoint3D, viewSize?: {
          width: number;
          height: number;
      }): ObservablePoint3D | undefined;
      /**
       * Converts world coordinates to screen coordinates.
       * @param x World x coordinate.
       * @param y World y coordinate.
       * @param z World z coordinate.
       * @param point Point to set.
       * @param viewSize The size of the view when not rendering to the entire screen.
       */
      worldToScreen(x: number, y: number, z: number, point?: PIXI.Point, viewSize?: {
          width: number;
          height: number;
      }): PIXI.Point;
      private _fieldOfView;
      private _near;
      private _far;
      private _aspect?;
      /**
       * The aspect ratio (width divided by height). If not set, the aspect ratio of
       * the renderer will be used by default.
       */
      get aspect(): number | undefined;
      set aspect(value: number | undefined);
      /** The vertical field of view in degrees, 60 is the default value. */
      get fieldOfView(): number;
      set fieldOfView(value: number);
      /** The near clipping plane distance, 0.1 is the default value. */
      get near(): number;
      set near(value: number);
      /** The far clipping plane distance, 1000 is the default value. */
      get far(): number;
      set far(value: number);
      /** Returns the projection matrix. */
      get projection(): Float32Array;
      /** Returns the view matrix. */
      get view(): Float32Array;
      /** Returns the view projection matrix. */
      get viewProjection(): Float32Array;
  }

}
declare module 'pixi3d/capabilities' {
  import { Renderer } from "pixi.js";
  export namespace Capabilities {
      function getMaxVertexUniformVectors(renderer: Renderer): number;
      function isFloatingPointTextureSupported(renderer: Renderer): boolean;
      function isHalfFloatFramebufferSupported(renderer: Renderer): boolean;
      function isFloatFramebufferSupported(renderer: Renderer): boolean;
      function supportsFloatLinear(renderer: Renderer): boolean;
      function isShaderTextureLodSupported(renderer: Renderer): boolean;
      function isInstancingSupported(renderer: Renderer): boolean;
  }

}
declare module 'pixi3d/color' {
  /**
   * Represents a color containing RGBA components.
   */
  export class Color {
      private _array4;
      private _array3;
      /**
       * Creates a new color with the specified components (in range 0-1).
       * @param r The R (red) component.
       * @param g The G (green) component.
       * @param b The B (blue) component.
       * @param a The A (alpha) component.
       */
      constructor(r?: number, g?: number, b?: number, a?: number);
      /**
       * Creates a new color with the specified components (in range 0-255).
       * @param r The R (red) component.
       * @param g The G (green) component.
       * @param b The B (blue) component.
       * @param a The A (alpha) component.
       */
      static fromBytes(r?: number, g?: number, b?: number, a?: number): Color;
      /**
       * Creates a new color from the specified hex value.
       * @param hex The hex value as a string or a number.
       */
      static fromHex(hex: number | string): Color;
      /** The color as an typed array containing RGB. */
      get rgb(): Float32Array;
      /** The color as an typed array containing RGBA. */
      get rgba(): Float32Array;
      /** The R (red) component. */
      get r(): number;
      set r(value: number);
      /** The G (green) component. */
      get g(): number;
      set g(value: number);
      /** The B (blue) component. */
      get b(): number;
      set b(value: number);
      /** The A (alpha) component. */
      get a(): number;
      set a(value: number);
      /**
       * Creates a new color from the specified source.
       * @param source The source to create the color from.
       */
      static from(source: number[] | Float32Array): Color;
  }

}
declare module 'pixi3d/container' {
  import * as PIXI from "pixi.js";
  import { ObservableQuaternion } from "pixi3d/transform/observable-quaternion";
  import { Transform3D } from "pixi3d/transform/transform";
  import { ObservablePoint3D } from "pixi3d/transform/observable-point";
  /**
   * A container represents a collection of 3D objects.
   */
  export class Container3D extends PIXI.Container {
      transform: Transform3D;
      set position(value: ObservablePoint3D);
      get position(): ObservablePoint3D;
      set scale(value: ObservablePoint3D);
      get scale(): ObservablePoint3D;
      set rotationQuaternion(value: ObservableQuaternion);
      /** The quaternion rotation of the object. */
      get rotationQuaternion(): ObservableQuaternion;
      /** The position of the object on the z axis relative to the local
       * coordinates of the parent. */
      get z(): number;
      set z(value: number);
      get localTransform(): import("pixi3d/index").Matrix4;
      get worldTransform(): import("pixi3d/index").Matrix4;
  }

}
declare module 'pixi3d/cubemap/cubemap-faces' {
  import * as PIXI from "pixi.js";
  export interface CubemapFaces {
      /** The texture or url for positive x. */
      posx: PIXI.Texture | string;
      /** The texture or url for negative x. */
      negx: PIXI.Texture | string;
      /** The texture or url for positive y. */
      posy: PIXI.Texture | string;
      /** The texture or url for negative y. */
      negy: PIXI.Texture | string;
      /** The texture or url for positive z. */
      posz: PIXI.Texture | string;
      /** The texture or url for negative z. */
      negz: PIXI.Texture | string;
  }

}
declare module 'pixi3d/cubemap/cubemap-resource' {
  import { CubeResource } from "pixi3d/resource/cube-resource";
  import { Renderer } from "pixi.js";
  import { MipmapResource } from "pixi3d/cubemap/mipmap-resource";
  export type MipmapResourceArray = [
      MipmapResource,
      MipmapResource,
      MipmapResource,
      MipmapResource,
      MipmapResource,
      MipmapResource
  ];
  export class CubemapResource extends CubeResource {
      levels: number;
      constructor(source: MipmapResourceArray, levels?: number);
      style(renderer: Renderer): boolean;
  }

}
declare module 'pixi3d/cubemap/cubemap' {
  import { BaseTexture } from "pixi.js";
  import { CubemapResource } from "pixi3d/cubemap/cubemap-resource";
  import { Color } from "pixi3d/color";
  import { CubemapFaces } from "pixi3d/cubemap/cubemap-faces";
  /**
   * Cubemap which supports multiple user specified mipmaps.
   */
  export class Cubemap extends BaseTexture<CubemapResource> {
      /** Returns an array of faces. */
      static get faces(): ["posx", "negx", "posy", "negy", "posz", "negz"];
      /** Returns the number of mipmap levels. */
      get levels(): number;
      /**
       * Creates a new cubemap from the specified faces.
       * @param faces The faces to create the cubemap from.
       */
      static fromFaces(faces: CubemapFaces | CubemapFaces[]): Cubemap;
      /**
       * Creates a new cubemap from the specified colors.
       * @param posx The color for positive x.
       * @param negx The color for negative x.
       * @param posy The color for positive y.
       * @param negy The color for negative y.
       * @param posz The color for positive z.
       * @param negz The color for negative z.
       */
      static fromColors(posx: Color, negx?: Color, posy?: Color, negy?: Color, posz?: Color, negz?: Color): Cubemap;
  }

}
declare module 'pixi3d/cubemap/mipmap-resource' {
  import { ArrayResource } from "pixi3d/resource/array-resource";
  import { Texture, BaseTexture, Renderer } from "pixi.js";
  export class MipmapResource extends ArrayResource {
      target: number;
      constructor(source: (string | Texture)[], target: number);
      upload(renderer: Renderer, baseTexture: BaseTexture): boolean;
  }

}
declare module 'pixi3d/debug' {
  import * as PIXI from "pixi.js";
  import { Message } from "pixi3d/message";
  export namespace Debug {
      function on(event: string | symbol, fn: PIXI.utils.EventEmitter.ListenerFn, context: any): void;
      function warn(message: Message, args?: any): void;
      function error(message: Message, args?: any): void;
  }

}
declare module 'pixi3d/gltf/animation/gltf-animation' {
  import { Animation } from "pixi3d/animation";
  import { glTFChannel } from "pixi3d/gltf/animation/gltf-channel";
  /**
   * Represents an animation loaded from a glTF model.
   */
  export class glTFAnimation extends Animation {
      private _duration;
      private _position;
      private _channels;
      /**
       * Creates a new glTF animation.
       * @param channels The channels used by this animation.
       * @param name The name for the animation.
       */
      constructor(channels: glTFChannel[], name?: string);
      /** The duration (in seconds) of this animation. */
      get duration(): number;
      /** The current position (in seconds) of this animation. */
      get position(): number;
      set position(value: number);
  }

}
declare module 'pixi3d/gltf/animation/gltf-channel' {
  /**
   * Represents an glTF animation channel which targets a specific node.
   */
  export abstract class glTFChannel {
      private _position;
      private _frame;
      private _interpolation;
      private _input;
      /**
       * Creates a new channel with the specified input and interpolation.
       * @param input An array of inputs representing linear time in seconds.
       * @param interpolation The interpolation method to use.
       */
      constructor(input: ArrayLike<number>, interpolation: glTFInterpolation);
      /** The position (in seconds) for this channel. */
      get position(): number;
      set position(value: number);
      /** The duration (in seconds) for this channel. */
      get duration(): number;
      /** The current frame for this channel. */
      get frame(): number;
      /** The number of frames for this channel. */
      get length(): number;
      /**
       * Sets the position and updates the current frame and animation.
       * @param position The position to set for this channel.
       */
      setPosition(position: number): void;
      abstract updateTarget(data: ArrayLike<number>): void;
      /**
       * Updates the channel with the specified delta time in seconds.
       * @param delta The time (in seconds) since last frame.
       */
      update(delta: number): void;
      /**
       * Calculates the position within the specified frame.
       * @param frame The frame to calculate the position in.
       * @param position The position of this channel.
       */
      calculateFramePosition(frame: number, position: number): number;
      /**
       * Calculates the current frame for the specified position.
       * @param position The position of this channel.
       */
      calculateFrame(position: number): number;
      static from(input: ArrayLike<number>, output: ArrayLike<number>, interpolation: string, path: string, target: Container3D): glTFScale | glTFWeights | glTFRotation | glTFTranslation | undefined;
  }
  import { Container3D } from "pixi3d/container";
  import { glTFInterpolation } from "pixi3d/gltf/animation/gltf-interpolation";
  import { glTFScale } from "pixi3d/gltf/animation/gltf-scale";
  import { glTFWeights } from "pixi3d/gltf/animation/gltf-weights";
  import { glTFRotation } from "pixi3d/gltf/animation/gltf-rotation";
  import { glTFTranslation } from "pixi3d/gltf/animation/gltf-translation";

}
declare module 'pixi3d/gltf/animation/gltf-cubic-spline' {
  import { glTFInterpolation } from "pixi3d/gltf/animation/gltf-interpolation";
  export class glTFCubicSpline extends glTFInterpolation {
      private _input;
      private _output;
      private _stride;
      private _data;
      constructor(_input: ArrayLike<number>, _output: ArrayLike<number>, _stride: number);
      interpolate(frame: number, position: number): Float32Array;
      static calculate(t: number, p0: number, p1: number, m0: number, m1: number): number;
  }

}
declare module 'pixi3d/gltf/animation/gltf-interpolation' {
  /**
   * Represents a specific interpolation method.
   */
  export abstract class glTFInterpolation {
      /**
       * Interpolates within an animation frame and returns the output.
       * @param frame The animation frame to interpolate.
       * @param position The position within the animation frame (between 0-1).
       */
      abstract interpolate(frame: number, position: number): Float32Array;
      static from(type: string, input: ArrayLike<number>, output: ArrayLike<number>, stride: number): glTFLinear | glTFCubicSpline | glTFStep;
  }
  import { glTFLinear } from "pixi3d/gltf/animation/gltf-linear";
  import { glTFCubicSpline } from "pixi3d/gltf/animation/gltf-cubic-spline";
  import { glTFStep } from "pixi3d/gltf/animation/gltf-step";

}
declare module 'pixi3d/gltf/animation/gltf-linear' {
  import { glTFInterpolation } from "pixi3d/gltf/animation/gltf-interpolation";
  export class glTFLinear extends glTFInterpolation {
      private _output;
      private _stride;
      private _data;
      constructor(_output: ArrayLike<number>, _stride: number);
      interpolate(frame: number, position: number): Float32Array;
  }

}
declare module 'pixi3d/gltf/animation/gltf-rotation' {
  import { glTFChannel } from "pixi3d/gltf/animation/gltf-channel";
  import { glTFInterpolation } from "pixi3d/gltf/animation/gltf-interpolation";
  import { Transform3D } from "pixi3d/transform/transform";
  export class glTFRotation extends glTFChannel {
      private _transform;
      constructor(transform: Transform3D, input: ArrayLike<number>, interpolation: glTFInterpolation);
      updateTarget(data: ArrayLike<number>): void;
  }

}
declare module 'pixi3d/gltf/animation/gltf-scale' {
  import { glTFChannel } from "pixi3d/gltf/animation/gltf-channel";
  import { glTFInterpolation } from "pixi3d/gltf/animation/gltf-interpolation";
  import { Transform3D } from "pixi3d/transform/transform";
  export class glTFScale extends glTFChannel {
      private _transform;
      constructor(transform: Transform3D, input: ArrayLike<number>, interpolation: glTFInterpolation);
      updateTarget(data: ArrayLike<number>): void;
  }

}
declare module 'pixi3d/gltf/animation/gltf-spherical-linear' {
  import { glTFInterpolation } from "pixi3d/gltf/animation/gltf-interpolation";
  export class glTFSphericalLinear extends glTFInterpolation {
      private _output;
      private _data;
      constructor(_output: ArrayLike<number>);
      interpolate(frame: number, position: number): Float32Array;
  }

}
declare module 'pixi3d/gltf/animation/gltf-step' {
  import { glTFInterpolation } from "pixi3d/gltf/animation/gltf-interpolation";
  export class glTFStep extends glTFInterpolation {
      private _output;
      private _stride;
      private _data;
      constructor(_output: ArrayLike<number>, _stride: number);
      interpolate(frame: number): Float32Array;
  }

}
declare module 'pixi3d/gltf/animation/gltf-translation' {
  import { glTFChannel } from "pixi3d/gltf/animation/gltf-channel";
  import { glTFInterpolation } from "pixi3d/gltf/animation/gltf-interpolation";
  import { Transform3D } from "pixi3d/transform/transform";
  export class glTFTranslation extends glTFChannel {
      private _transform;
      constructor(transform: Transform3D, input: ArrayLike<number>, interpolation: glTFInterpolation);
      updateTarget(data: ArrayLike<number>): void;
  }

}
declare module 'pixi3d/gltf/animation/gltf-weights' {
  import { glTFChannel } from "pixi3d/gltf/animation/gltf-channel";
  import { glTFInterpolation } from "pixi3d/gltf/animation/gltf-interpolation";
  export class glTFWeights extends glTFChannel {
      private _weights;
      constructor(weights: number[], input: ArrayLike<number>, interpolation: glTFInterpolation);
      updateTarget(data: ArrayLike<number>): void;
  }

}
declare module 'pixi3d/gltf/gltf-asset' {
  import { Texture } from "pixi.js";
  import { glTFResourceLoader } from "pixi3d/gltf/gltf-resource-loader";
  /**
   * glTF assets are JSON files plus supporting external data.
   */
  export class glTFAsset {
      readonly descriptor: any;
      readonly buffers: ArrayBuffer[];
      readonly images: Texture[];
      /**
       * Creates a new glTF asset using the specified JSON descriptor.
       * @param descriptor The JSON descriptor to create the asset from.
       * @param buffers The buffers used by this asset.
       * @param images The images used by this asset.
       */
      constructor(descriptor: any, buffers?: ArrayBuffer[], images?: Texture[]);
      /**
       * Loads a new glTF asset (including resources) using the specified JSON
       * descriptor.
       * @param descriptor The JSON descriptor to create the asset from.
       * @param loader The resource loader to use for external resources. The
       * loader can be empty when all resources in the descriptor is embedded.
       */
      static load(descriptor: any, loader?: glTFResourceLoader): glTFAsset;
      /**
       * Returns a value indicating if the specified data buffer is a valid glTF.
       * @param buffer The buffer data to validate.
       */
      static isValidBuffer(buffer: ArrayBuffer): boolean;
      /**
       * Returns a value indicating if the specified uri is embedded.
       * @param uri The uri to check.
       */
      static isEmbeddedResource(uri: string): boolean;
      /**
       * Creates a new glTF asset from binary (glb) buffer data.
       * @param data The binary buffer data to read from.
       * @param cb The function which gets called when the asset has been
       * created.
       */
      static fromBuffer(data: ArrayBuffer, cb: (gltf: glTFAsset) => void): void;
  }

}
declare module 'pixi3d/gltf/gltf-attribute' {
  /**
   * Represents data for a specific geometry attribute.
   */
  export class glTFAttribute {
      buffer: Uint32Array | Float32Array | Int8Array | Uint8Array | Int16Array | Uint16Array;
      componentType: number;
      stride: number;
      min?: number[] | undefined;
      max?: number[] | undefined;
      constructor(buffer: Uint32Array | Float32Array | Int8Array | Uint8Array | Int16Array | Uint16Array, componentType: number, stride?: number, min?: number[] | undefined, max?: number[] | undefined);
      static from(componentType: number, buffer: ArrayBuffer, offset: number, size: number, stride?: number, min?: number[], max?: number[]): glTFAttribute;
  }

}
declare module 'pixi3d/gltf/gltf-material' {
  import { glTFTexture } from "pixi3d/gltf/gltf-texture";
  /**
   * glTF defines materials using a common set of parameters that are based on
   * widely used material representations from Physically-Based Rendering (PBR).
   */
  export class glTFMaterial {
      alphaCutoff: number;
      alphaMode: string;
      doubleSided: boolean;
      roughness: number;
      metallic: number;
      baseColorTexture?: glTFTexture;
      metallicRoughnessTexture?: glTFTexture;
      normalTexture?: glTFTexture & {
          scale?: number;
      };
      occlusionTexture?: glTFTexture & {
          strength?: number;
      };
      emissiveTexture?: glTFTexture;
      emissiveFactor: number[];
      baseColor: number[];
      unlit: boolean;
  }

}
declare module 'pixi3d/gltf/gltf-parser' {
  import * as PIXI from "pixi.js";
  import { glTFAsset } from "pixi3d/gltf/gltf-asset";
  import { glTFAnimation } from "pixi3d/gltf/animation/gltf-animation";
  import { glTFAttribute } from "pixi3d/gltf/gltf-attribute";
  import { Mesh3D } from "pixi3d/mesh/mesh";
  import { Container3D } from "pixi3d/container";
  import { Material } from "pixi3d/material/material";
  import { MaterialFactory } from "pixi3d/material/material-factory";
  import { Model } from "pixi3d/model";
  import { Skin } from "pixi3d/skinning/skin";
  /**
   * Parses glTF assets and creates models and meshes.
   */
  export class glTFParser {
      private _asset;
      private _materialFactory;
      private _descriptor;
      private _textures;
      /**
       * Creates a new parser using the specified asset.
       * @param asset The asset to parse.
       * @param materialFactory The material factory to use.
       */
      constructor(asset: glTFAsset, materialFactory?: MaterialFactory);
      /**
       * Creates a model from the specified asset.
       * @param asset The asset to create the model from.
       * @param materialFactory The material factory to use.
       */
      static createModel(asset: glTFAsset, materialFactory?: MaterialFactory): Model;
      /**
       * Creates a mesh from the specified asset.
       * @param asset The asset to create the mesh from.
       * @param materialFactory The material factory to use.
       * @param mesh The mesh index in the JSON descriptor.
       */
      static createMesh(asset: glTFAsset, materialFactory?: MaterialFactory, mesh?: number): Mesh3D[];
      /**
       * Creates a new buffer view from the specified accessor.
       * @param accessor The accessor object or index.
       */
      parseBuffer(accessor: any): glTFAttribute | undefined;
      /**
       * Creates an animation from the specified animation.
       * @param animation The source animation object or index.
       * @param nodes The array of nodes which are potential targets for the animation.
       */
      parseAnimation(animation: any, nodes: Container3D[]): glTFAnimation;
      /**
       * Creates a material from the specified source.
       * @param material The source material object or index.
       */
      parseMaterial(material?: any): Material;
      /**
       * Returns the texture used by the specified object.
       * @param source The source object or index.
       */
      parseTexture(index: number): PIXI.Texture<PIXI.Resource>;
      /**
       * Creates an array of meshes from the specified mesh.
       * @param mesh The source mesh object or index.
       * @returns An array which contain arrays of meshes. This is because of the
       * structure used in glTF, where each mesh contain a number of primitives.
       * Read more about this in discussion at https://github.com/KhronosGroup/glTF/issues/821
       */
      parseMesh(mesh: any): Mesh3D[];
      /**
       * Creates a skin from the specified source.
       * @param skin The source skin object or index.
       * @param target The target container for the skin.
       * @param nodes The array of nodes which are potential targets for the animation.
       */
      parseSkin(skin: any, target: Container3D, nodes: Container3D[]): Skin;
      /**
       * Creates a mesh from the specified primitive.
       * @param primitive The source primitive object.
       */
      parsePrimitive(primitive: any): Mesh3D;
      /**
       * Creates a container or joint from the specified node index.
       * @param node The index of the node.
       */
      parseNode(index: number): Container3D;
      parseModel(): Model;
  }

}
declare module 'pixi3d/gltf/gltf-resource-loader' {
  import * as PIXI from "pixi.js";
  /**
   * Represents a loader for glTF asset resources (buffers and images).
   */
  export interface glTFResourceLoader {
      /**
       * Loads the resource from the specified uri.
       * @param uri The uri to load from.
       * @param onComplete Callback when loading is completed.
       */
      load(uri: string, onComplete: (resource: PIXI.ILoaderResource) => void): void;
  }

}
declare module 'pixi3d/gltf/gltf-texture' {
  import { Texture } from "pixi.js";
  export interface glTFTexture extends Texture {
      texCoord?: number;
      transform?: {
          offset?: [number, number];
          rotation?: number;
          scale?: [number, number];
      };
  }

}
declare module 'pixi3d/index' {
  export { glTFLoader } from "pixi3d/loader/gltf-loader";
  export { glTFBinaryLoader } from "pixi3d/loader/gltf-binary-loader";
  export { glTFAsset } from "pixi3d/gltf/gltf-asset";
  export { glTFResourceLoader } from "pixi3d/gltf/gltf-resource-loader";
  export { ObservablePoint3D } from "pixi3d/transform/observable-point";
  export { ObservableQuaternion } from "pixi3d/transform/observable-quaternion";
  export { Transform3D } from "pixi3d/transform/transform";
  export { Matrix4 } from "pixi3d/transform/matrix4";
  export { Container3D } from "pixi3d/container";
  export { Camera } from "pixi3d/camera/camera";
  export { CameraOrbitControl } from "pixi3d/camera/camera-orbit-control";
  export { Mesh3D } from "pixi3d/mesh/mesh";
  export { MeshDestroyOptions } from "pixi3d/mesh/mesh-destroy-options";
  export { MeshGeometry3D } from "pixi3d/mesh/geometry/mesh-geometry";
  export { MeshGeometryAttribute } from "pixi3d/mesh/geometry/mesh-geometry-attribute";
  export { MeshGeometryTarget } from "pixi3d/mesh/geometry/mesh-geometry-target";
  export { MeshShader } from "pixi3d/mesh/mesh-shader";
  export type { InstancedMesh3D } from "pixi3d/mesh/instanced-mesh";
  export { Model } from "pixi3d/model";
  export { InstancedModel } from "pixi3d/instanced-model";
  export { Animation } from "pixi3d/animation";
  export { LightType } from "pixi3d/lighting/light-type";
  export { Light } from "pixi3d/lighting/light";
  export { LightingEnvironment } from "pixi3d/lighting/lighting-environment";
  export { ImageBasedLighting } from "pixi3d/lighting/image-based-lighting";
  export { StandardPipeline } from "pixi3d/pipeline/standard-pipeline";
  export { MaterialRenderPass } from "pixi3d/pipeline/material-render-pass";
  export { Material } from "pixi3d/material/material";
  export { MaterialRenderSortType } from "pixi3d/material/material-render-sort-type";
  export { MaterialFactory } from "pixi3d/material/material-factory";
  export { TextureTransform } from "pixi3d/texture/texture-transform";
  export { CubemapLoader } from "pixi3d/loader/cubemap-loader";
  export { Cubemap } from "pixi3d/cubemap/cubemap";
  export { ShaderSourceLoader } from "pixi3d/loader/shader-source-loader";
  export { Skybox } from "pixi3d/skybox/skybox";
  export { StandardMaterial } from "pixi3d/material/standard/standard-material";
  export { StandardMaterialAlphaMode } from "pixi3d/material/standard/standard-material-alpha-mode";
  export { StandardMaterialDebugMode } from "pixi3d/material/standard/standard-material-debug-mode";
  export { StandardMaterialNormalTexture } from "pixi3d/material/standard/standard-material-normal-texture";
  export { StandardMaterialOcclusionTexture } from "pixi3d/material/standard/standard-material-occlusion-texture";
  export { StandardMaterialTexture } from "pixi3d/material/standard/standard-material-texture";
  export { InstancedStandardMaterial } from "pixi3d/material/standard/instanced-standard-material";
  export { PickingHitArea } from "pixi3d/picking/picking-hitarea";
  export { PickingInteraction } from "pixi3d/picking/picking-interaction";
  export { Skin } from "pixi3d/skinning/skin";
  export { Joint } from "pixi3d/skinning/joint";
  export { ShadowRenderPass } from "pixi3d/shadow/shadow-render-pass";
  export { ShadowCastingLight } from "pixi3d/shadow/shadow-casting-light";
  export { ShadowCastingLightOptions } from "pixi3d/shadow/shadow-casting-light";
  export { ShadowQuality } from "pixi3d/shadow/shadow-quality";
  export { PostProcessingSprite, PostProcessingSpriteOptions } from "pixi3d/sprite/post-processing-sprite";
  export { AABB } from "pixi3d/math/aabb";
  export { Ray } from "pixi3d/math/ray";
  export { Plane } from "pixi3d/math/plane";
  export { Vec3 } from "pixi3d/math/vec3";
  export { Mat4 } from "pixi3d/math/mat4";
  export { Quat } from "pixi3d/math/quat";
  export { Color } from "pixi3d/color";
  export { CubemapFaces } from "pixi3d/cubemap/cubemap-faces";
  export { CubemapResource } from "pixi3d/cubemap/cubemap-resource";
  export { Sprite3D } from "pixi3d/sprite/sprite";
  export { SpriteBatchRenderer } from "pixi3d/sprite/sprite-batch-renderer";
  export { SpriteBillboardType } from "pixi3d/sprite/sprite-billboard-type";
  export { RenderPass } from "pixi3d/pipeline/render-pass";
  export { Debug } from "pixi3d/debug";

}
declare module 'pixi3d/instanced-model' {
  import { Container3D } from "pixi3d/container";
  import { InstancedMesh3D } from "pixi3d/mesh/instanced-mesh";
  import { Model } from "pixi3d/model";
  /**
   * Represents an instance of a model.
   */
  export class InstancedModel extends Container3D {
      /** The meshes included in the model. */
      meshes: InstancedMesh3D[];
      /**
       * Creates a new model instance from the specified model.
       * @param model The model to create instance from.
       */
      constructor(model: Model);
  }

}
declare module 'pixi3d/lighting/image-based-lighting' {
  import { Texture } from "pixi.js";
  import { Cubemap } from "pixi3d/cubemap/cubemap";
  /**
   * Collection of components used for image-based lighting (IBL), a
   * rendering technique which involves capturing an omnidirectional representation
   * of real-world light information as an image.
   */
  export class ImageBasedLighting {
      private _diffuse;
      private _specular;
      /** The default BRDF integration map lookup texture. */
      static defaultLookupBrdf: Texture<import("pixi.js").Resource>;
      /** Cube texture used for the diffuse component. */
      get diffuse(): Cubemap;
      /** Cube mipmap texture used for the specular component. */
      get specular(): Cubemap;
      /** BRDF integration map lookup texture. */
      lookupBrdf?: Texture;
      /**
       * Creates a new image-based lighting object.
       * @param diffuse Cubemap used for the diffuse component.
       * @param specular Cubemap used for the specular component.
       */
      constructor(diffuse: Cubemap, specular: Cubemap);
      /**
       * Value indicating if this object is valid to be used for rendering.
       */
      get valid(): boolean;
  }

}
declare module 'pixi3d/lighting/light-type' {
  export enum LightType {
      /**
       * A light that is located at a point and emits light in a cone shape.
       */
      spot = "spot",
      /**
       * A light that is located infinitely far away, and emits light in one
       * direction only.
       */
      directional = "directional",
      /**
       * A light that is located at a point and emits light in all directions
       * equally.
       */
      point = "point",
      ambient = "ambient"
  }

}
declare module 'pixi3d/lighting/light' {
  import { Color } from "pixi3d/color";
  import { Container3D } from "pixi3d/container";
  import { LightType } from "pixi3d/lighting/light-type";
  export class Light extends Container3D {
      /** The type of the light. */
      type: LightType;
      /** The color of the light. */
      color: Color;
      /** The range of the light. */
      range: number;
      /** The intensity of the light. */
      intensity: number;
      /** The inner cone angle specified in degrees. */
      innerConeAngle: number;
      /** The outer cone angle specified in degrees. */
      outerConeAngle: number;
  }

}
declare module 'pixi3d/lighting/lighting-environment' {
  import { Renderer, IRendererPlugin } from "pixi.js";
  import { ImageBasedLighting } from "pixi3d/lighting/image-based-lighting";
  import { Light } from "pixi3d/lighting/light";
  /**
   * A lighting environment represents the different lighting conditions for a
   * specific object or an entire scene.
   */
  export class LightingEnvironment implements IRendererPlugin {
      renderer: Renderer;
      /** The image-based lighting object. */
      imageBasedLighting?: ImageBasedLighting;
      /** The lights affecting this lighting environment. */
      lights: Light[];
      /** The main lighting environment which is used by default. */
      static main: LightingEnvironment;
      /**
       * Creates a new lighting environment using the specified renderer.
       * @param renderer The renderer to use.
       */
      constructor(renderer: Renderer, imageBasedLighting?: ImageBasedLighting);
      destroy(): void;
      /** Value indicating if this object is valid to be used for rendering. */
      get valid(): boolean;
  }

}
declare module 'pixi3d/loader/cubemap-loader' {
  export const CubemapLoader: {
      use: (resource: any, next: () => void) => void;
      add: () => void;
  };

}
declare module 'pixi3d/loader/gltf-binary-loader' {
  import { ILoaderResource } from "pixi.js";
  export const glTFBinaryLoader: {
      use: (resource: ILoaderResource, next: () => void) => void;
      add: () => void;
  };

}
declare module 'pixi3d/loader/gltf-loader' {
  import { ILoaderResource } from "pixi.js";
  export const glTFLoader: {
      use: (resource: ILoaderResource, next: () => void) => void;
      add: () => void;
  };

}
declare module 'pixi3d/loader/shader-source-loader' {
  export const ShaderSourceLoader: {
      use: (resource: any, next: () => void) => void;
      add: () => void;
  };

}
declare module 'pixi3d/material/material-factory' {
  import { Material } from "pixi3d/material/material";
  /**
   * Factory for creating materials.
   */
  export interface MaterialFactory {
      /**
       * Creates a new material from the specified source.
       * @param source The source of the material.
       */
      create(source: unknown): Material;
  }

}
declare module 'pixi3d/material/material-render-sort-type' {
  export enum MaterialRenderSortType {
      opaque = "opaque",
      transparent = "transparent"
  }

}
declare module 'pixi3d/material/material' {
  import { State, Renderer, DRAW_MODES, BLEND_MODES } from "pixi.js";
  import { Mesh3D } from "pixi3d/mesh/mesh";
  import { MaterialRenderSortType } from "pixi3d/material/material-render-sort-type";
  import { MeshShader } from "pixi3d/mesh/mesh-shader";
  /**
   * Materials are used to render a mesh with a specific visual appearance.
   */
  export abstract class Material {
      protected _renderSortType: MaterialRenderSortType;
      protected _shader?: MeshShader;
      /** State used to render a mesh. */
      state: State & {
          culling: boolean;
          clockwiseFrontFace: boolean;
          depthTest: boolean;
      };
      /** Draw mode used to render a mesh. */
      drawMode: DRAW_MODES;
      /**
       * Sort type used to render a mesh. Transparent materials will be rendered
       * after opaque materials.
       */
      renderSortType: MaterialRenderSortType;
      /**
       * Value indicating if writing into the depth buffer is enabled or disabled.
       * Depth mask feature is only available in PixiJS 6.0+ and won't have any
       * effects in previous versions.
       */
      get depthMask(): boolean;
      set depthMask(value: boolean);
      /**
       * Value indicating if the material is double sided. When set to true, the
       * culling state will be set to false.
       */
      get doubleSided(): boolean;
      set doubleSided(value: boolean);
      /** Blend mode used to render a mesh. */
      get blendMode(): BLEND_MODES;
      set blendMode(value: BLEND_MODES);
      /**
       * Creates a shader used to render the specified mesh.
       * @param mesh The mesh to create the shader for.
       * @param renderer The renderer to use.
       */
      abstract createShader(mesh: Mesh3D, renderer: Renderer): MeshShader | undefined;
      /**
       * Updates the uniforms for the specified shader.
       * @param mesh The mesh used for updating the uniforms.
       * @param shader The shader to update.
       */
      abstract updateUniforms?(mesh: Mesh3D, shader: MeshShader): void;
      /**
       * Destroys the material and it's used resources.
       */
      destroy(): void;
      /**
       * Returns a value indicating if this material supports instancing.
       */
      get isInstancingSupported(): boolean;
      /**
       * Creates a new instanced version of this material.
       */
      createInstance(): unknown;
      /**
       * Renders the specified mesh.
       * @param mesh The mesh to render.
       * @param renderer The renderer to use.
       */
      render(mesh: Mesh3D, renderer: Renderer): void;
  }

}
declare module 'pixi3d/material/standard/instanced-standard-material' {
  import { Color } from "pixi3d/color";
  import { StandardMaterial } from "pixi3d/material/standard/standard-material";
  /** Material for instanced meshes which uses the standard material. */
  export class InstancedStandardMaterial {
      /** The base color of the material. */
      baseColor: Color;
      /** Creates a new instanced standard material from the specified material. */
      constructor(material: StandardMaterial);
  }

}
declare module 'pixi3d/material/standard/standard-material-alpha-mode' {
  export enum StandardMaterialAlphaMode {
      /**
       * The rendered output is fully opaque and any alpha value is ignored.
       */
      opaque = "opaque",
      /**
       * The rendered output is either fully opaque or fully transparent depending
       * on the alpha value and the specified alpha cutoff value. This mode is used
       * to simulate geometry such as tree leaves or wire fences.
       */
      mask = "mask",
      /**
       * The rendered output is combined with the background using the normal
       * painting operation (i.e. the Porter and Duff over operator). This mode is
       * used to simulate geometry such as guaze cloth or animal fur.
       */
      blend = "blend"
  }

}
declare module 'pixi3d/material/standard/standard-material-debug-mode' {
  export enum StandardMaterialDebugMode {
      alpha = "alpha",
      emissive = "emissive",
      f0 = "f0",
      metallic = "metallic",
      normal = "normal",
      occlusion = "occlusion",
      roughness = "roughness"
  }

}
declare module 'pixi3d/material/standard/standard-material-factory' {
  import { glTFTexture } from "pixi3d/gltf/gltf-texture";
  import { TextureTransform } from "pixi3d/texture/texture-transform";
  import { StandardMaterial } from "pixi3d/material/standard/standard-material";
  export class StandardMaterialFactory {
      create(source: unknown): StandardMaterial;
      createTextureTransform(texture: glTFTexture): TextureTransform | undefined;
  }

}
declare module 'pixi3d/material/standard/standard-material-feature-set' {
  import { Renderer } from "pixi.js";
  import { MeshGeometry3D } from "pixi3d/mesh/geometry/mesh-geometry";
  import { StandardMaterial } from "pixi3d/material/standard/standard-material";
  import { LightingEnvironment } from "pixi3d/lighting/lighting-environment";
  import { Mesh3D } from "pixi3d/mesh/mesh";
  export namespace StandardMaterialFeatureSet {
      function build(renderer: Renderer, mesh: Mesh3D, geometry: MeshGeometry3D, material: StandardMaterial, lightingEnvironment: LightingEnvironment): string[] | undefined;
      function hasSkinningTextureFeature(features: string[]): boolean;
  }

}
declare module 'pixi3d/material/standard/standard-material-matrix-texture' {
  import { Texture, Renderer } from "pixi.js";
  export class StandardMaterialMatrixTexture extends Texture {
      private _buffer;
      static isSupported(renderer: Renderer): boolean;
      constructor(matrixCount: number);
      updateBuffer(buffer: Float32Array): void;
  }

}
declare module 'pixi3d/material/standard/standard-material-normal-texture' {
  import { BaseTexture } from "pixi.js";
  import { StandardMaterialTexture } from "pixi3d/material/standard/standard-material-texture";
  /**
   * Represents a texture which holds specific data for a normal map.
   */
  export class StandardMaterialNormalTexture extends StandardMaterialTexture {
      scale?: number | undefined;
      uvSet?: number | undefined;
      /**
       * Creates a new texture from the specified base texture.
       * @param baseTexture The base texture.
       * @param scale The scale of the normal.
       * @param uvSet The uv set to use (0 or 1).
       */
      constructor(baseTexture: BaseTexture, scale?: number | undefined, uvSet?: number | undefined);
  }

}
declare module 'pixi3d/material/standard/standard-material-occlusion-texture' {
  import { BaseTexture } from "pixi.js";
  import { StandardMaterialTexture } from "pixi3d/material/standard/standard-material-texture";
  /**
   * Represents a texture which holds specific data for a occlusion map.
   */
  export class StandardMaterialOcclusionTexture extends StandardMaterialTexture {
      strength?: number | undefined;
      uvSet?: number | undefined;
      /**
       * Creates a new texture from the specified base texture.
       * @param baseTexture The base texture.
       * @param strength The strength of the occlusion.
       * @param uvSet The uv set to use (0 or 1).
       */
      constructor(baseTexture: BaseTexture, strength?: number | undefined, uvSet?: number | undefined);
  }

}
declare module 'pixi3d/material/standard/standard-material-skin-uniforms' {
  import * as PIXI from "pixi.js";
  import { Mesh3D } from "pixi3d/mesh/mesh";
  export class StandardMaterialSkinUniforms {
      private _jointMatrixTexture?;
      private _jointNormalTexture?;
      enableJointMatrixTextures(jointsCount: number): void;
      destroy(): void;
      update(mesh: Mesh3D, shader: PIXI.Shader): void;
  }

}
declare module 'pixi3d/material/standard/standard-material-texture' {
  import { BaseTexture, Texture } from "pixi.js";
  import { TextureTransform } from "pixi3d/texture/texture-transform";
  /**
   * Represents a texture which can have a transform.
   */
  export class StandardMaterialTexture extends Texture {
      uvSet?: number | undefined;
      /** The transform to use for this texture. */
      transform?: TextureTransform;
      /**
       * Creates a new texture from the specified base texture.
       * @param baseTexture The base texture.
       * @param uvSet The uv set to use (0 or 1).
       */
      constructor(baseTexture: BaseTexture, uvSet?: number | undefined);
  }

}
declare module 'pixi3d/material/standard/standard-material' {
  import { Renderer, Shader } from "pixi.js";
  import { StandardShader } from "pixi3d/material/standard/standard-shader";
  import { Material } from "pixi3d/material/material";
  import { Camera } from "pixi3d/camera/camera";
  import { LightingEnvironment } from "pixi3d/lighting/lighting-environment";
  import { Mesh3D } from "pixi3d/mesh/mesh";
  import { StandardMaterialAlphaMode } from "pixi3d/material/standard/standard-material-alpha-mode";
  import { StandardMaterialDebugMode } from "pixi3d/material/standard/standard-material-debug-mode";
  import { ShadowCastingLight } from "pixi3d/shadow/shadow-casting-light";
  import { Color } from "pixi3d/color";
  import { InstancedStandardMaterial } from "pixi3d/material/standard/instanced-standard-material";
  import { StandardMaterialOcclusionTexture } from "pixi3d/material/standard/standard-material-occlusion-texture";
  import { StandardMaterialNormalTexture } from "pixi3d/material/standard/standard-material-normal-texture";
  import { StandardMaterialTexture } from "pixi3d/material/standard/standard-material-texture";
  /**
   * The standard material is using Physically-Based Rendering (PBR) which makes
   * it suitable to represent a wide range of different surfaces. It's the default
   * material when loading models from file.
   */
  export class StandardMaterial extends Material {
      private _lightingEnvironment?;
      private _lightingEnvironmentConfigId;
      private _unlit;
      private _alphaMode;
      private _debugMode?;
      private _baseColorTexture?;
      private _baseColor;
      private _normalTexture?;
      private _occlusionTexture?;
      private _emissiveTexture?;
      private _metallicRoughnessTexture?;
      private _shadowCastingLight?;
      private _instancingEnabled;
      private _skinUniforms;
      /** The roughness of the material. */
      roughness: number;
      /** The metalness of the material. */
      metallic: number;
      /** The base color of the material. */
      baseColor: Color;
      /** The cutoff threshold when alpha mode is set to "mask". */
      alphaCutoff: number;
      /** The emissive color of the material. */
      emissive: Color;
      /** The exposure (brightness) of the material. */
      exposure: number;
      /** The base color texture. */
      get baseColorTexture(): StandardMaterialTexture | undefined;
      set baseColorTexture(value: StandardMaterialTexture | undefined);
      /** The metallic-roughness texture. */
      get metallicRoughnessTexture(): StandardMaterialTexture | undefined;
      set metallicRoughnessTexture(value: StandardMaterialTexture | undefined);
      /** The normal map texture. */
      get normalTexture(): StandardMaterialNormalTexture | undefined;
      set normalTexture(value: StandardMaterialNormalTexture | undefined);
      /** The occlusion map texture. */
      get occlusionTexture(): StandardMaterialOcclusionTexture | undefined;
      set occlusionTexture(value: StandardMaterialOcclusionTexture | undefined);
      /** The emissive map texture. */
      get emissiveTexture(): StandardMaterialTexture | undefined;
      set emissiveTexture(value: StandardMaterialTexture | undefined);
      /** The alpha rendering mode of the material. */
      get alphaMode(): StandardMaterialAlphaMode;
      set alphaMode(value: StandardMaterialAlphaMode);
      /** The shadow casting light of the material. */
      get shadowCastingLight(): ShadowCastingLight | undefined;
      set shadowCastingLight(value: ShadowCastingLight | undefined);
      /** The debug rendering mode of the material. */
      get debugMode(): StandardMaterialDebugMode | undefined;
      set debugMode(value: StandardMaterialDebugMode | undefined);
      /**
       * The camera used when rendering a mesh. If this value is not set, the main
       * camera will be used by default.
       */
      camera?: Camera;
      /**
       * Lighting environment used when rendering a mesh. If this value is not set,
       * the main lighting environment will be used by default.
       */
      get lightingEnvironment(): LightingEnvironment | undefined;
      set lightingEnvironment(value: LightingEnvironment | undefined);
      /**
       * Value indicating if the material is unlit. If this value if set to true,
       * all lighting is disabled and only the base color will be used.
       */
      get unlit(): boolean;
      set unlit(value: boolean);
      destroy(): void;
      /**
       * Invalidates the shader so it can be rebuilt with the current features.
       */
      invalidateShader(): void;
      /**
       * Creates a new standard material from the specified source.
       * @param source Source from which the material is created.
       */
      static create(source: unknown): StandardMaterial;
      render(mesh: Mesh3D, renderer: Renderer): void;
      get isInstancingSupported(): boolean;
      createInstance(): InstancedStandardMaterial;
      createShader(mesh: Mesh3D, renderer: Renderer): StandardShader | undefined;
      updateUniforms(mesh: Mesh3D, shader: Shader): void;
  }

}
declare module 'pixi3d/material/standard/standard-shader-instancing' {
  import * as PIXI from "pixi.js";
  import { InstancedMesh3D } from "pixi3d/mesh/instanced-mesh";
  export class StandardShaderInstancing {
      private _maxInstances;
      private _modelMatrix;
      private _normalMatrix;
      private _baseColor;
      constructor();
      expandBuffers(instanceCount: number): void;
      updateBuffers(instances: InstancedMesh3D[]): void;
      addGeometryAttributes(geometry: PIXI.Geometry): void;
  }

}
declare module 'pixi3d/material/standard/standard-shader-source' {
  import * as PIXI from "pixi.js";
  export namespace StandardShaderSource {
      function build(source: string, features: string[], renderer: PIXI.Renderer): string;
  }

}
declare module 'pixi3d/material/standard/standard-shader' {
  import * as PIXI from "pixi.js";
  import { MeshGeometry3D } from "pixi3d/mesh/geometry/mesh-geometry";
  import { Mesh3D } from "pixi3d/mesh/mesh";
  import { MeshShader } from "pixi3d/mesh/mesh-shader";
  export class StandardShader extends MeshShader {
      private _instancing;
      static build(renderer: PIXI.Renderer, features: string[]): StandardShader;
      get name(): string;
      createShaderGeometry(geometry: MeshGeometry3D, instanced: boolean): PIXI.Geometry;
      render(mesh: Mesh3D, renderer: PIXI.Renderer, state: PIXI.State, drawMode: PIXI.DRAW_MODES): void;
  }

}
declare module 'pixi3d/math/aabb' {
  import { ObservablePoint3D } from "pixi3d/index";
  /**
   * Axis-aligned bounding box.
   */
  export class AABB {
      private _onChanged;
      private _min;
      private _max;
      private _center;
      private _size;
      private _extents;
      /** The minimal point of the bounding box. */
      get min(): ObservablePoint3D;
      set min(value: ObservablePoint3D);
      /** The maximal point of the bounding box. */
      get max(): ObservablePoint3D;
      set max(value: ObservablePoint3D);
      /** The center of the bounding box. */
      get center(): ObservablePoint3D;
      /** The size of the bounding box. */
      get size(): ObservablePoint3D;
      /** The extents of the bounding box. */
      get extents(): ObservablePoint3D;
      /**
       * Creates a new bounding box from the specified source.
       * @param source The source to create the bounding box from.
       */
      static from(source: {
          min: Float32Array;
          max: Float32Array;
      }): AABB;
      /**
       * Grows the bounding box to include the point.
       * @param point The point to include.
       */
      encapsulate(point: {
          x: number;
          y: number;
          z: number;
      }): void;
  }

}
declare module 'pixi3d/math/mat3' {
  export class Mat3 {
      static multiply(a: Float32Array, b: Float32Array, out?: Float32Array): Float32Array;
  }

}
declare module 'pixi3d/math/mat4' {
  export class Mat4 {
      static getTranslation(mat: Float32Array, out?: Float32Array): Float32Array;
      static create(): Float32Array;
      static translate(mat: Float32Array, v: Float32Array, out?: Float32Array): Float32Array;
      static getScaling(mat: Float32Array, out?: Float32Array): Float32Array;
      static getRotation(mat: Float32Array, out?: Float32Array): Float32Array;
      static copy(a: Float32Array, out?: Float32Array): Float32Array;
      static fromQuat(q: Float32Array, out?: Float32Array): Float32Array;
      static fromRotationTranslationScale(q: Float32Array, v: Float32Array, s: Float32Array, out?: Float32Array): Float32Array;
      static fromRotation(rad: number, axis: Float32Array, out?: Float32Array): Float32Array;
      static fromScaling(v: Float32Array, out?: Float32Array): Float32Array;
      static fromTranslation(v: Float32Array, out?: Float32Array): Float32Array;
      static multiply(a: Float32Array, b: Float32Array, out?: Float32Array): Float32Array;
      static lookAt(eye: Float32Array, center: Float32Array, up: Float32Array, out?: Float32Array): Float32Array;
      static identity(out?: Float32Array): Float32Array;
      static perspective(fovy: number, aspect: number, near: number, far: number, out?: Float32Array): Float32Array;
      static ortho(left: number, right: number, bottom: number, top: number, near: number, far: number, out?: Float32Array): Float32Array;
      static invert(a: Float32Array, out?: Float32Array): Float32Array;
      static transpose(a: Float32Array, out?: Float32Array): Float32Array;
      static targetTo(eye: Float32Array, target: Float32Array, up: Float32Array, out?: Float32Array): Float32Array;
      static rotateX(a: Float32Array, rad: number, out?: Float32Array): Float32Array;
      static rotateY(a: Float32Array, rad: number, out?: Float32Array): Float32Array;
      static rotateZ(a: Float32Array, rad: number, out?: Float32Array): Float32Array;
      static rotate(a: Float32Array, rad: number, axis: Float32Array, out?: Float32Array): Float32Array;
      static scale(a: Float32Array, v: Float32Array, out?: Float32Array): Float32Array;
  }

}
declare module 'pixi3d/math/plane' {
  import { Ray } from "pixi3d/math/ray";
  export class Plane {
      distance: number;
      private _normal;
      constructor(normal: Float32Array, distance: number);
      get normal(): Float32Array;
      rayCast(ray: Ray): number;
  }

}
declare module 'pixi3d/math/quat' {
  export class Quat {
      static set(x: number, y: number, z: number, w: number, out?: Float32Array): Float32Array;
      static fromValues(x: number, y: number, z: number, w: number): Float32Array;
      static create(): Float32Array;
      static normalize(a: Float32Array, out?: Float32Array): Float32Array;
      static slerp(a: Float32Array, b: Float32Array, t: number, out?: Float32Array): Float32Array;
      static fromEuler(x: number, y: number, z: number, out?: Float32Array): Float32Array;
      static conjugate(a: Float32Array, out?: Float32Array): Float32Array;
      static rotateX(a: Float32Array, rad: number, out?: Float32Array): Float32Array;
      static rotateY(a: Float32Array, rad: number, out?: Float32Array): Float32Array;
      static rotateZ(a: Float32Array, rad: number, out?: Float32Array): Float32Array;
  }

}
declare module 'pixi3d/math/ray' {
  export class Ray {
      private _direction;
      private _origin;
      constructor(origin: Float32Array, direction: Float32Array);
      get origin(): Float32Array;
      get direction(): Float32Array;
      getPoint(distance: number, point?: Float32Array): Float32Array;
  }

}
declare module 'pixi3d/math/vec3' {
  export class Vec3 {
      static set(x: number, y: number, z: number, out?: Float32Array): Float32Array;
      static fromValues(x: number, y: number, z: number): Float32Array;
      static create(): Float32Array;
      static add(a: Float32Array, b: Float32Array, out?: Float32Array): Float32Array;
      static transformQuat(a: Float32Array, q: Float32Array, out?: Float32Array): Float32Array;
      static subtract(a: Float32Array, b: Float32Array, out?: Float32Array): Float32Array;
      static scale(a: Float32Array, b: number, out?: Float32Array): Float32Array;
      static dot(a: Float32Array, b: Float32Array): number;
      static normalize(a: Float32Array, out?: Float32Array): Float32Array;
      static cross(a: Float32Array, b: Float32Array, out?: Float32Array): Float32Array;
      static transformMat4(a: Float32Array, m: Float32Array, out?: Float32Array): Float32Array;
      static copy(a: Float32Array, out?: Float32Array): Float32Array;
      static magnitude(a: Float32Array): number;
      static inverse(a: Float32Array, out?: Float32Array): Float32Array;
      static negate(a: Float32Array, out?: Float32Array): Float32Array;
      static multiply(a: Float32Array, b: Float32Array, out?: Float32Array): Float32Array;
      static distance(a: Float32Array, b: Float32Array): number;
      static squaredDistance(a: Float32Array, b: Float32Array): number;
  }

}
declare module 'pixi3d/math/vec4' {
  export class Vec4 {
      static set(x: number, y: number, z: number, w: number, out?: Float32Array): Float32Array;
      static transformMat4(a: Float32Array, m: Float32Array, out?: Float32Array): Float32Array;
      static fromValues(x: number, y: number, z: number, w: number): Float32Array;
  }

}
declare module 'pixi3d/mesh/geometry/cube-geometry' {
  import { MeshGeometry3D } from "pixi3d/mesh/geometry/mesh-geometry";
  export namespace CubeGeometry {
      function create(): MeshGeometry3D & {
          positions: {
              buffer: Float32Array;
          };
          indices: {
              buffer: Uint8Array;
          };
          normals: {
              buffer: Float32Array;
          };
          uvs: {
              buffer: Float32Array;
          }[];
          tangents: {
              buffer: Float32Array;
          };
      };
  }

}
declare module 'pixi3d/mesh/geometry/mesh-geometry-attribute' {
  /**
   * Represents an attribute for mesh geometry.
   */
  export interface MeshGeometryAttribute {
      /**
       * The buffer data.
       */
      buffer: Uint32Array | Float32Array | Int8Array | Uint8Array | Int16Array | Uint16Array;
      /**
       * The minimum value of each component in this attribute.
       */
      min?: number[];
      /**
       * The maximum value of each component in this attribute.
       */
      max?: number[];
      /**
       * The datatype of components in this attribute.
       */
      componentType?: number;
      /**
       * The stride, in bytes, between attributes. When this is not defined, data
       * is tightly packed. When two or more attributes use the same buffer, this
       * field must be defined.
       */
      stride?: number;
  }

}
declare module 'pixi3d/mesh/geometry/mesh-geometry-target' {
  import { MeshGeometryAttribute } from "pixi3d/mesh/geometry/mesh-geometry-attribute";
  /**
   * Represents a geometry morph target.
   */
  export interface MeshGeometryTarget {
      positions?: MeshGeometryAttribute;
      normals?: MeshGeometryAttribute;
      tangents?: MeshGeometryAttribute;
  }

}
declare module 'pixi3d/mesh/geometry/mesh-geometry' {
  import { Geometry } from "pixi.js";
  import { MeshShader } from "pixi3d/mesh/mesh-shader";
  import { MeshGeometryAttribute } from "pixi3d/mesh/geometry/mesh-geometry-attribute";
  import { MeshGeometryTarget } from "pixi3d/mesh/geometry/mesh-geometry-target";
  /**
   * Geometry with mesh data (i.e. positions, normals, uvs).
   */
  export class MeshGeometry3D {
      private _shaderGeometry;
      indices?: MeshGeometryAttribute;
      positions?: MeshGeometryAttribute;
      uvs?: MeshGeometryAttribute[];
      normals?: MeshGeometryAttribute;
      tangents?: MeshGeometryAttribute;
      targets?: MeshGeometryTarget[];
      joints?: MeshGeometryAttribute;
      weights?: MeshGeometryAttribute;
      /**
       * Returns geometry with attributes required by the specified shader.
       * @param shader The shader to use.
       */
      getShaderGeometry(shader: MeshShader): Geometry;
      /**
       * Creates geometry with attributes required by the specified shader.
       * @param shader The shader to use.
       * @param instanced Value indicating if the geometry will be instanced.
       */
      addShaderGeometry(shader: MeshShader, instanced: boolean): void;
      /**
       * Returns a value indicating if geometry with required attributes has been
       * created by the specified shader.
       * @param shader The shader to test.
       * @param instanced Value indicating if the geometry is instanced.
       */
      hasShaderGeometry(shader: MeshShader, instanced: boolean): boolean;
      /**
       * Destroys the geometry and it's used resources.
       */
      destroy(): void;
  }

}
declare module 'pixi3d/mesh/geometry/plane-geometry' {
  import { MeshGeometry3D } from "pixi3d/mesh/geometry/mesh-geometry";
  export namespace PlaneGeometry {
      function create(): MeshGeometry3D & {
          positions: {
              buffer: Float32Array;
          };
          indices: {
              buffer: Uint8Array;
          };
          normals: {
              buffer: Float32Array;
          };
          uvs: {
              buffer: Float32Array;
          }[];
      };
  }

}
declare module 'pixi3d/mesh/geometry/quad-geometry' {
  import { MeshGeometry3D } from "pixi3d/mesh/geometry/mesh-geometry";
  export namespace QuadGeometry {
      function create(): MeshGeometry3D & {
          positions: {
              buffer: Float32Array;
          };
          indices: {
              buffer: Uint8Array;
          };
          normals: {
              buffer: Float32Array;
          };
          uvs: {
              buffer: Float32Array;
          }[];
      };
  }

}
declare module 'pixi3d/mesh/instanced-mesh' {
  import { IDestroyOptions } from "pixi.js";
  import { Container3D } from "pixi3d/container";
  import { Mesh3D } from "pixi3d/mesh/mesh";
  export class InstancedMesh3D extends Container3D {
      readonly mesh: Mesh3D;
      readonly material: unknown;
      constructor(mesh: Mesh3D, material: unknown);
      destroy(options: boolean | IDestroyOptions | undefined): void;
  }

}
declare module 'pixi3d/mesh/mesh-destroy-options' {
  import { IDestroyOptions } from "pixi.js";
  export interface MeshDestroyOptions extends IDestroyOptions {
      geometry?: boolean;
      material?: boolean;
  }

}
declare module 'pixi3d/mesh/mesh-shader' {
  import { Shader, State, Geometry, Renderer, DRAW_MODES } from "pixi.js";
  import { Mesh3D } from "pixi3d/mesh/mesh";
  import { MeshGeometry3D } from "pixi3d/mesh/geometry/mesh-geometry";
  /**
   * Shader used specifically to render a mesh.
   */
  export class MeshShader extends Shader {
      private _state;
      /** The name of the mesh shader. Used for figuring out if geometry attributes is compatible with the shader. This needs to be set to something different than default value when custom attributes is used. */
      get name(): string;
      /**
       * Creates geometry with required attributes used by this shader. Override when using custom attributes.
       * @param geometry The geometry with mesh data.
       * @param instanced Value indicating if the geometry will be instanced.
       */
      createShaderGeometry(geometry: MeshGeometry3D, instanced: boolean): Geometry;
      /**
       * Renders the geometry of the specified mesh.
       * @param mesh Mesh to render.
       * @param renderer Renderer to use.
       * @param state Rendering state to use.
       * @param drawMode Draw mode to use.
       */
      render(mesh: Mesh3D, renderer: Renderer, state?: State, drawMode?: DRAW_MODES): void;
  }

}
declare module 'pixi3d/mesh/mesh' {
  import { Renderer } from "pixi.js";
  import { MeshGeometry3D } from "pixi3d/mesh/geometry/mesh-geometry";
  import { Container3D } from "pixi3d/container";
  import { Skin } from "pixi3d/skinning/skin";
  import { InstancedMesh3D } from "pixi3d/mesh/instanced-mesh";
  import { Material } from "pixi3d/material/material";
  import { MeshDestroyOptions } from "pixi3d/mesh/mesh-destroy-options";
  import { AABB } from "pixi3d/math/aabb";
  /**
   * Represents a mesh which contains geometry and has a material.
   */
  export class Mesh3D extends Container3D {
      geometry: MeshGeometry3D;
      material?: Material | undefined;
      /** The name of the plugin used for rendering the mesh. */
      pluginName: string;
      /** Array of weights used for morphing between geometry targets. */
      targetWeights?: number[];
      /** The skin used for vertex skinning. */
      skin?: Skin;
      /** The enabled render passes for this mesh. */
      enabledRenderPasses: {
          [name: string]: unknown;
      };
      /** Used for sorting the mesh before render. */
      renderSortOrder: number;
      /**
       * Creates a new mesh with the specified geometry and material.
       * @param geometry The geometry for the mesh.
       * @param material The material for the mesh. If the material is empty the mesh won't be rendered.
       */
      constructor(geometry: MeshGeometry3D, material?: Material | undefined);
      private _instances;
      /** An array of instances created from this mesh. */
      get instances(): InstancedMesh3D[];
      /**
       * Creates a new instance of this mesh.
       */
      createInstance(): InstancedMesh3D;
      /**
       * Removes an instance from this mesh.
       * @param instance The instance to remove.
       */
      removeInstance(instance: InstancedMesh3D): void;
      /**
       * Enables the render pass with the specified name.
       * @param name The name of the render pass to enable.
       */
      enableRenderPass(name: string, options?: unknown): void;
      /**
       * Disables the render pass with the specified name.
       * @param name The name of the render pass to disable.
       * @param options The options for the render pass.
       */
      disableRenderPass(name: string): void;
      /**
       * Returns a value indicating if the specified render pass is enabled.
       * @param name The name of the render pass to check.
       */
      isRenderPassEnabled(name: string): boolean;
      /**
       * Destroys the mesh and it's used resources.
       */
      destroy(options?: boolean | MeshDestroyOptions): void;
      _render(renderer: Renderer): void;
      /**
       * Calculates and returns a axis-aligned bounding box of the mesh in world space.
       */
      getBoundingBox(): AABB | undefined;
      /**
       * Creates a new quad (flat square) mesh with the specified material.
       * @param material The material to use.
       */
      static createQuad(material?: Material): Mesh3D;
      /**
       * Creates a new cube (six faces) mesh with the specified material.
       * @param material The material to use.
       */
      static createCube(material?: Material): Mesh3D;
      /**
       * Creates a new plane (flat square) mesh with the specified material.
       * @param material The material to use.
       */
      static createPlane(material?: Material): Mesh3D;
  }

}
declare module 'pixi3d/message' {
  export enum Message {
      meshVertexSkinningFloatingPointTexturesNotSupported = "Mesh is using vertex skinning but floating point textures is not supported on this device/environment. In case of errors, try changing the environment in PixiJS settings. Set \"PIXI.settings.PREFER_ENV = PIXI.ENV.WEBGL2\" before creating a renderer/application.",
      meshVertexSkinningNumberOfJointsNotSupported = "Mesh is using vertex skinning but the number of joints ({joints}) is not supported on this device/environment. Max number of supported joints is {maxJoints}, try reducing the number of joints.",
      imageBasedLightingShaderTextureLodNotSupported = "Image based lighting is used but shader texture lod is not supported on this device/environment, the material may not be displayed correctly. Try changing the environment in PixiJS settings. Set \"PIXI.settings.PREFER_ENV = PIXI.ENV.WEBGL2\" before creating a renderer/application."
  }

}
declare module 'pixi3d/model' {
  import { glTFAsset } from "pixi3d/gltf/gltf-asset";
  import { MaterialFactory } from "pixi3d/material/material-factory";
  import { Mesh3D } from "pixi3d/mesh/mesh";
  import { Animation } from "pixi3d/animation";
  import { Container3D } from "pixi3d/container";
  import { InstancedModel } from "pixi3d/instanced-model";
  import { AABB } from "pixi3d/math/aabb";
  /**
   * Represents a model which has been loaded from a file. Contains a hierarchy of meshes and animations.
   */
  export class Model extends Container3D {
      /** The animations included in the model. */
      animations: Animation[];
      /**
       * The meshes included in the model. Note that this array and the actual
       * childen are not automatically synchronized after the model has been loaded.
       */
      meshes: Mesh3D[];
      /**
       * Creates a new model from a source.
       * @param source The source to create the model from.
       * @param materialFactory The factory to use for creating materials.
       */
      static from(source: glTFAsset, materialFactory?: MaterialFactory): Model;
      /**
       * Creates a new instance of this model.
       */
      createInstance(): InstancedModel;
      /**
       * Calculates and returns a axis-aligned bounding box of the model in world
       * space. The bounding box will encapsulate the meshes included in the model.
       */
      getBoundingBox(): AABB;
  }

}
declare module 'pixi3d/picking/picking-hitarea' {
  import { IHitArea, Renderer } from "pixi.js";
  import { Mesh3D } from "pixi3d/mesh/mesh";
  import { Model } from "pixi3d/model";
  import { Camera } from "pixi3d/camera/camera";
  /**
   * Hit area which uses the shape of an object to determine interaction.
   */
  export class PickingHitArea implements IHitArea {
      object: Mesh3D | Model;
      camera?: Camera | undefined;
      /** The id which maps to the object. */
      id: Uint8Array;
      /**
       * Creates a new hitarea using the specified object.
       * @param renderer The renderer to use.
       * @param object The model or mesh to use as the shape for hit testing.
       * @param camera The camera to use when rendering the object picking shape.
       * If not set, the main camera will be used as default.
       */
      constructor(renderer: Renderer | undefined, object: Mesh3D | Model, camera?: Camera | undefined);
      contains(x: number, y: number): boolean;
      /**
       * Creates a new hitarea using the specified object.
       * @param object The model or mesh to use as the shape for hit testing.
       */
      static fromObject(object: Mesh3D | Model): PickingHitArea;
  }

}
declare module 'pixi3d/picking/picking-id' {
  export namespace PickingId {
      function next(): Uint8Array;
  }

}
declare module 'pixi3d/picking/picking-interaction' {
  import { IRendererPlugin, Renderer } from "pixi.js";
  import { PickingHitArea } from "pixi3d/picking/picking-hitarea";
  /**
   * Manages the picking hit areas by keeping track on which hit areas needs to
   * be checked for interaction. Renders the hit area meshes to a texture which
   * is then used to map a mesh to a x/y coordinate. The picking manager is
   * registered as a renderer plugin.
   */
  export class PickingInteraction implements IRendererPlugin {
      renderer: Renderer;
      private _map;
      private _hitAreas;
      /**
       * Creates a new picking manager using the specified renderer.
       * @param renderer The renderer to use.
       */
      constructor(renderer: Renderer);
      /** The main picking interaction which is used by default. */
      static main: PickingInteraction;
      private _update;
      destroy(): void;
      /**
       * Hit tests a area using the specified x/y coordinates.
       * @param x The x coordinate.
       * @param y The y coordinate.
       * @param hitArea The hit area to test.
       */
      containsHitArea(x: number, y: number, hitArea: PickingHitArea): boolean;
  }

}
declare module 'pixi3d/picking/picking-map' {
  import { PickingHitArea } from "pixi3d/picking/picking-hitarea";
  import { Renderer } from "pixi.js";
  export class PickingMap {
      private _renderer;
      private _pixels;
      private _output;
      private _shader;
      private _update;
      constructor(_renderer: Renderer, size: number);
      destroy(): void;
      resizeToAspect(): void;
      containsId(x: number, y: number, id: Uint8Array): boolean;
      update(hitAreas: PickingHitArea[]): void;
      private _matrix;
      renderHitArea(hitArea: PickingHitArea): void;
  }

}
declare module 'pixi3d/pipeline/material-render-pass' {
  import { Color } from "pixi3d/color";
  import { RenderTexture, Renderer } from "pixi.js";
  import { RenderPass } from "pixi3d/pipeline/render-pass";
  import { Mesh3D } from "pixi3d/mesh/mesh";
  /**
   * Pass used for rendering materials.
   */
  export class MaterialRenderPass implements RenderPass {
      renderer: Renderer;
      name: string;
      private _renderTexture?;
      /** The color (r,g,b,a) used for clearing the render texture. If this value is empty, the render texture will not be cleared. */
      clearColor?: Color | undefined;
      /** The texture used when rendering to a texture. */
      get renderTexture(): RenderTexture | undefined;
      set renderTexture(value: RenderTexture | undefined);
      /**
       * Creates a new material render pass.
       * @param renderer The renderer to use.
       * @param name The name of the render pass.
       */
      constructor(renderer: Renderer, name: string);
      clear(): void;
      render(meshes: Mesh3D[]): void;
  }

}
declare module 'pixi3d/pipeline/render-pass' {
  import { Mesh3D } from "pixi3d/mesh/mesh";
  /**
   * Represents a pass used when rendering.
   */
  export interface RenderPass {
      /** The name of the render pass. */
      name: string;
      /** Clears the render pass. Used when rendering to a texture. */
      clear?(): void;
      /**
       * Renders the specified meshes.
       * @param meshes The array of meshes to render.
       */
      render(meshes: Mesh3D[]): void;
  }

}
declare module 'pixi3d/pipeline/standard-pipeline' {
  import { ObjectRenderer, Renderer } from "pixi.js";
  import { MaterialRenderPass } from "pixi3d/pipeline/material-render-pass";
  import { Mesh3D } from "pixi3d/mesh/mesh";
  import { ShadowRenderPass } from "pixi3d/shadow/shadow-render-pass";
  import { PostProcessingSprite, PostProcessingSpriteOptions } from "pixi3d/sprite/post-processing-sprite";
  import { Model } from "pixi3d/model";
  import { ShadowCastingLight } from "pixi3d/shadow/shadow-casting-light";
  import { RenderPass } from "pixi3d/pipeline/render-pass";
  /**
   * The standard pipeline renders meshes using the set render passes. It's
   * created and used by default.
   */
  export class StandardPipeline extends ObjectRenderer {
      renderer: Renderer;
      private _meshes;
      /** The pass used for rendering materials. */
      materialPass: MaterialRenderPass;
      /** The pass used for rendering shadows. */
      shadowPass: ShadowRenderPass;
      /** The array of render passes. Each mesh will be rendered with these passes (if it has been enabled on that mesh). */
      renderPasses: RenderPass[];
      /**
       * Creates a new standard pipeline using the specified renderer.
       * @param renderer The renderer to use.
       */
      constructor(renderer: Renderer);
      /**
       * Creates a new post processing sprite and sets the material pass to render
       * to it's texture.
       * @param options The options when creating the sprite.
       */
      createPostProcessingSprite(options?: PostProcessingSpriteOptions): PostProcessingSprite;
      /**
       * Adds a mesh to be rendered.
       * @param mesh The mesh to render.
       */
      render(mesh: Mesh3D): void;
      /**
       * Renders the added meshes using the specified render passes.
       */
      flush(): void;
      /**
       * Sorts the meshes by rendering order.
       */
      sort(): void;
      /**
       * Enables shadows for the specified object. Adds the shadow render pass to
       * the specified object and enables the standard material to use the casting
       * light.
       * @param object The mesh or model to enable shadows for.
       * @param light The shadow casting light to associate with the
       * object when using the standard material.
       */
      enableShadows(object: Mesh3D | Model, light?: ShadowCastingLight): void;
      /**
       * Disables shadows for the specified object.
       * @param object The mesh or model to disable shadows for.
       */
      disableShadows(object: Mesh3D | Model): void;
  }

}
declare module 'pixi3d/resource/array-resource' {
  import * as PIXI from "pixi.js";
  export const ArrayResource: typeof PIXI.ArrayResource;

}
declare module 'pixi3d/resource/base-image-resource' {
  import * as PIXI from "pixi.js";
  export const BaseImageResource: typeof PIXI.BaseImageResource;

}
declare module 'pixi3d/resource/buffer-resource' {
  import * as PIXI from "pixi.js";
  export const BufferResource: typeof PIXI.BufferResource;

}
declare module 'pixi3d/resource/cube-resource' {
  import * as PIXI from "pixi.js";
  export const CubeResource: typeof PIXI.CubeResource;

}
declare module 'pixi3d/shadow/shadow-casting-light' {
  import { RenderTexture, Renderer } from "pixi.js";
  import { Light } from "pixi3d/lighting/light";
  import { Camera } from "pixi3d/camera/camera";
  import { ShadowQuality } from "pixi3d/shadow/shadow-quality";
  export interface ShadowCastingLightOptions {
      /**
       * The quality (precision) of the shadow. If the quality is not supported by
       * current platform, a lower quality will be selected instead.
       */
      quality?: ShadowQuality;
      /**
       * The size (both width and height) in pixels for the shadow texture.
       * Increasing the size will improve the quality of the shadow.
       */
      shadowTextureSize?: number;
  }
  /**
   * Contains the required components used for rendering a shadow casted by a light.
   */
  export class ShadowCastingLight {
      renderer: Renderer;
      light: Light;
      private _shadowTexture;
      private _filterTexture;
      private _lightViewProjection;
      /** The softness of the edges for the shadow. */
      softness: number;
      /**
       * The area in units of the shadow when using directional lights. Reducing
       * the area will improve the quality of the shadow.
       */
      shadowArea: number;
      /** The light view projection matrix. */
      get lightViewProjection(): Float32Array;
      /** The camera to follow when using directional lights. */
      camera?: Camera;
      /**
       * Value indicating if the shadow should follow the specified camera. If the
       * camera is not set, the main camera will be used as default. Only available
       * when using directional lights.
       */
      followCamera: boolean;
      /**
       * The rendered shadow texture.
       */
      get shadowTexture(): RenderTexture;
      /**
       * The rendered filter texture.
       */
      get filterTexture(): RenderTexture;
      /**
       * Creates a new shadow casting light used for rendering a shadow texture.
       * @param renderer The renderer to use.
       * @param light The light which is casting the shadow.
       * @param options The options to use when creating the shadow texture.
       */
      constructor(renderer: Renderer, light: Light, options?: ShadowCastingLightOptions);
      /**
       * Destroys the shadow casting light and it's used resources.
       */
      destroy(): void;
      /**
       * Clears the rendered shadow texture.
       */
      clear(): void;
      /**
       * Updates the light view projection matrix.
       */
      updateLightViewProjection(): void;
      /**
       * Returns a value indicating if medium quality (16-bit precision) shadows is
       * supported by current platform.
       * @param renderer The renderer to use.
       */
      static isMediumQualitySupported(renderer: Renderer): boolean;
      /**
       * Returns a value indicating if high quality (32-bit precision) shadows is
       * supported by current platform.
       * @param renderer The renderer to use.
       */
      static isHighQualitySupported(renderer: Renderer): boolean;
  }

}
declare module 'pixi3d/shadow/shadow-filter' {
  import { Renderer, RenderTexture } from "pixi.js";
  import { ShadowCastingLight } from "pixi3d/shadow/shadow-casting-light";
  export class ShadowFilter {
      renderer: Renderer;
      private _gaussianBlurShader;
      private _mesh;
      constructor(renderer: Renderer);
      applyGaussianBlur(light: ShadowCastingLight): void;
      applyBlurScale(input: RenderTexture, output: RenderTexture, scale: Float32Array): void;
  }

}
declare module 'pixi3d/shadow/shadow-math' {
  import { ShadowCastingLight } from "pixi3d/shadow/shadow-casting-light";
  export namespace ShadowMath {
      function calculateDirectionalLightViewProjection(shadowCastingLight: ShadowCastingLight): void;
      function calculateSpotLightViewProjection(shadowCastingLight: ShadowCastingLight): void;
  }

}
declare module 'pixi3d/shadow/shadow-quality' {
  export enum ShadowQuality {
      /**
       * Low quality (8-bit) shadows.
       */
      low = "low",
      /**
       * Medium quality (16-bit) shadows.
       */
      medium = "medium",
      /**
       * High quality (32-bit) shadows.
       */
      high = "high"
  }

}
declare module 'pixi3d/shadow/shadow-render-pass' {
  import { Renderer } from "pixi.js";
  import { RenderPass } from "pixi3d/pipeline/render-pass";
  import { Mesh3D } from "pixi3d/mesh/mesh";
  import { ShadowCastingLight } from "pixi3d/shadow/shadow-casting-light";
  /**
   * Pass used for rendering shadows.
   */
  export class ShadowRenderPass implements RenderPass {
      renderer: Renderer;
      name: string;
      private _lights;
      private _filter;
      private _shadow;
      /**
       * Creates a new shadow render pass using the specified renderer.
       * @param renderer The renderer to use.
       * @param name The name for the render pass.
       */
      constructor(renderer: Renderer, name?: string);
      /**
       * Adds a shadow casting light.
       * @param shadowCastingLight The light to add.
       */
      addShadowCastingLight(shadowCastingLight: ShadowCastingLight): void;
      /**
       * Removes a shadow casting light.
       * @param shadowCastingLight The light to remove.
       */
      removeShadowCastingLight(shadowCastingLight: ShadowCastingLight): void;
      clear(): void;
      render(meshes: Mesh3D[]): void;
  }

}
declare module 'pixi3d/shadow/shadow-renderer' {
  import { Renderer } from "pixi.js";
  import { Mesh3D } from "pixi3d/mesh/mesh";
  import { ShadowCastingLight } from "pixi3d/shadow/shadow-casting-light";
  import { SkinningShader } from "pixi3d/shadow/skinning-shader";
  import { TextureShader } from "pixi3d/shadow/texture-shader";
  export class ShadowRenderer {
      renderer: Renderer;
      private _state;
      private _shadowShader;
      private _skinningShader?;
      private _textureShader?;
      constructor(renderer: Renderer);
      getSkinningShader(): SkinningShader | TextureShader | undefined;
      render(mesh: Mesh3D, shadowCastingLight: ShadowCastingLight): void;
  }

}
declare module 'pixi3d/shadow/shadow-shader' {
  import { Renderer, Geometry } from "pixi.js";
  import { MeshGeometry3D } from "pixi3d/mesh/geometry/mesh-geometry";
  import { MeshShader } from "pixi3d/mesh/mesh-shader";
  import { Mesh3D } from "pixi3d/mesh/mesh";
  import { ShadowCastingLight } from "pixi3d/shadow/shadow-casting-light";
  export class ShadowShader extends MeshShader {
      constructor(renderer: Renderer, features?: string[]);
      get maxSupportedJoints(): number;
      createShaderGeometry(geometry: MeshGeometry3D): Geometry;
      get name(): string;
      updateUniforms(mesh: Mesh3D, shadowCastingLight: ShadowCastingLight): void;
  }

}
declare module 'pixi3d/shadow/shadow-texture' {
  import { Renderer, RenderTexture } from "pixi.js";
  import { ShadowQuality } from "pixi3d/shadow/shadow-quality";
  export namespace ShadowTexture {
      function create(renderer: Renderer, size: number, quality: ShadowQuality): RenderTexture;
  }

}
declare module 'pixi3d/shadow/skinning-shader' {
  import { Renderer } from "pixi.js";
  import { MeshGeometry3D } from "pixi3d/mesh/geometry/mesh-geometry";
  import { Mesh3D } from "pixi3d/mesh/mesh";
  import { ShadowCastingLight } from "pixi3d/shadow/shadow-casting-light";
  import { ShadowShader } from "pixi3d/shadow/shadow-shader";
  export class SkinningShader extends ShadowShader {
      private _maxSupportedJoints;
      get maxSupportedJoints(): number;
      static getMaxJointCount(renderer: Renderer): number;
      constructor(renderer: Renderer);
      createShaderGeometry(geometry: MeshGeometry3D): import("pixi.js").Geometry;
      get name(): string;
      updateUniforms(mesh: Mesh3D, shadowCastingLight: ShadowCastingLight): void;
  }

}
declare module 'pixi3d/shadow/texture-shader' {
  import { Renderer } from "pixi.js";
  import { MeshGeometry3D } from "pixi3d/mesh/geometry/mesh-geometry";
  import { Mesh3D } from "pixi3d/mesh/mesh";
  import { ShadowCastingLight } from "pixi3d/shadow/shadow-casting-light";
  import { ShadowShader } from "pixi3d/shadow/shadow-shader";
  export class TextureShader extends ShadowShader {
      private _jointMatrixTexture;
      static isSupported(renderer: Renderer): boolean;
      get maxSupportedJoints(): number;
      constructor(renderer: Renderer);
      createShaderGeometry(geometry: MeshGeometry3D): import("pixi.js").Geometry;
      get name(): string;
      updateUniforms(mesh: Mesh3D, shadowCastingLight: ShadowCastingLight): void;
  }

}
declare module 'pixi3d/skinning/joint' {
  import { Container3D } from "pixi3d/container";
  /**
   * Represents a joint used for vertex skinning.
   */
  export class Joint extends Container3D {
      readonly inverseBindMatrix: Float32Array;
      /**
       * Creates a new joint.
       * @param inverseBindMatrix The inverse of the global transform matrix.
       */
      constructor(inverseBindMatrix: Float32Array);
  }

}
declare module 'pixi3d/skinning/skin' {
  import { Joint } from "pixi3d/skinning/joint";
  import { Container3D } from "pixi3d/container";
  /**
   * Represents a skin used for vertex skinning.
   */
  export class Skin {
      readonly parent: Container3D;
      readonly joints: Joint[];
      private _jointMatrices;
      private _jointNormalMatrices;
      private _transformIds;
      /** The joint normal matrices which has been calculated. */
      jointNormalMatrices: Float32Array;
      /** The joint matrices which has been calculated. */
      jointMatrices: Float32Array;
      /**
       * Creates a new skin.
       * @param parent The parent container node for the skin.
       * @param joints The array of joints included in the skin.
       */
      constructor(parent: Container3D, joints: Joint[]);
      /**
       * Calculates the joint matrices.
       */
      calculateJointMatrices(): void;
  }

}
declare module 'pixi3d/skybox/skybox-material' {
  import { Renderer } from "pixi.js";
  import { Cubemap } from "pixi3d/cubemap/cubemap";
  import { MeshShader } from "pixi3d/mesh/mesh-shader";
  import { Camera } from "pixi3d/camera/camera";
  import { Mesh3D } from "pixi3d/mesh/mesh";
  import { Material } from "pixi3d/material/material";
  export class SkyboxMaterial extends Material {
      private _cubemap;
      get cubemap(): Cubemap;
      set cubemap(value: Cubemap);
      camera?: Camera;
      constructor(cubemap: Cubemap);
      updateUniforms(mesh: Mesh3D, shader: MeshShader): void;
      render(mesh: Mesh3D, renderer: Renderer): void;
      createShader(): MeshShader | undefined;
  }

}
declare module 'pixi3d/skybox/skybox' {
  import { Container3D } from "pixi3d/container";
  import { Cubemap } from "pixi3d/cubemap/cubemap";
  import { Camera } from "pixi3d/camera/camera";
  import { CubemapFaces } from "pixi3d/cubemap/cubemap-faces";
  /**
   * A skybox is a method of creating backgrounds in a 3D scene. It consists of
   * a cubemap texture which has six sides. Note that the skybox should be rendered
   * before all other objects in the scene.
   */
  export class Skybox extends Container3D {
      private _mesh;
      /**
       * Creates a new skybox using the specified cubemap.
       * @param cubemap Cubemap to use for rendering.
       */
      constructor(cubemap: Cubemap);
      /**
       * Camera used when rendering. If this value is not set, the main camera will
       * be used by default.
       */
      get camera(): Camera | undefined;
      set camera(value: Camera | undefined);
      /**
       * The cubemap texture used when rendering.
       */
      get cubemap(): Cubemap;
      set cubemap(value: Cubemap);
      /**
       * Creates a new skybox from the specified source.
       * @param source The source to create the skybox from.
       */
      static from(source: CubemapFaces): Skybox;
  }

}
declare module 'pixi3d/sprite/post-processing-sprite' {
  import { DisplayObject, Sprite, RenderTexture, Renderer, IDestroyOptions } from "pixi.js";
  export interface PostProcessingSpriteOptions {
      /**
       * The width of the texture for the sprite.
       */
      width?: number;
      /**
       * The height of the texture for the sprite.
       */
      height?: number;
      /**
       * The object to render. When set, it will automatically be rendered to the
       * sprite's texture each frame.
       */
      objectToRender?: DisplayObject;
      /**
       * The resolution of the texture for the sprite.
       */
      resolution?: number;
  }
  /**
   * Represents a sprite which can have post processing effects. Can be used for
   * rendering 3D objects as 2D sprites.
   */
  export class PostProcessingSprite extends Sprite {
      renderer: Renderer;
      private _tickerRender;
      private _renderTexture;
      /** The render texture. */
      get renderTexture(): RenderTexture;
      /** The depth texture. */
      get depthTexture(): import("pixi.js").BaseTexture<import("pixi.js").Resource, import("pixi.js").IAutoDetectOptions> | undefined;
      /**
       * Creates a new post processing sprite using the specified options.
       * @param renderer The renderer to use.
       * @param options The options for the render texture. If both width and height
       * has not been set, it will automatically be resized to the renderer size.
       */
      constructor(renderer: Renderer, options?: PostProcessingSpriteOptions);
      /**
       * Sets the resolution of the render texture.
       * @param resolution The resolution to set.
       */
      setResolution(resolution: number): void;
      destroy(options?: boolean | IDestroyOptions): void;
      /**
       * Updates the sprite's texture by rendering the specified object to it.
       * @param object The object to render.
       */
      renderObject(object: DisplayObject): void;
  }

}
declare module 'pixi3d/sprite/projection-sprite' {
  import * as PIXI from "pixi.js";
  export class ProjectionSprite extends PIXI.Sprite {
      private _pixelsPerUnit;
      modelViewProjection: Float32Array;
      constructor(texture?: PIXI.Texture<PIXI.Resource>);
      get pixelsPerUnit(): number;
      set pixelsPerUnit(value: number);
      calculateVertices(): void;
  }

}
declare module 'pixi3d/sprite/sprite-batch-geometry' {
  import * as PIXI from "pixi.js";
  export class SpriteBatchGeometry extends PIXI.BatchGeometry {
      constructor();
  }

}
declare module 'pixi3d/sprite/sprite-batch-renderer' {
  import * as PIXI from "pixi.js";
  export class SpriteBatchRenderer extends PIXI.AbstractBatchRenderer {
      constructor(renderer: PIXI.Renderer);
      packInterleavedGeometry(element: PIXI.IBatchableElement, attributeBuffer: PIXI.ViewableBuffer, indexBuffer: Uint16Array, aIndex: number, iIndex: number): void;
  }

}
declare module 'pixi3d/sprite/sprite-billboard-type' {
  /**
   * Represents different billboard types.
   */
  export enum SpriteBillboardType {
      /**
       * Sprite will be rotated towards the viewer on both the x-plane and y-plane.
       */
      spherical = "spherical",
      /**
       * Sprite will be rotated towards the viewer on the y-plane.
       */
      cylindrical = "cylindrical"
  }

}
declare module 'pixi3d/sprite/sprite' {
  import * as PIXI from "pixi.js";
  import { Camera } from "pixi3d/camera/camera";
  import { SpriteBillboardType } from "pixi3d/sprite/sprite-billboard-type";
  import { Container3D } from "pixi3d/container";
  /**
   * Represents a sprite in 3D space.
   */
  export class Sprite3D extends Container3D {
      private _sprite;
      private _modelView;
      private _cameraTransformId?;
      private _billboardType?;
      private _parentID?;
      /**
       * The camera used when rendering the sprite. Uses main camera by default.
       */
      camera?: Camera;
      /**
       * Creates a new sprite using the specified texture.
       * @param texture The texture to use.
       */
      constructor(texture: PIXI.Texture<PIXI.Resource>);
      /**
       * The billboard type to use when rendering the sprite. Used for making the
       * sprite always face the viewer.
       */
      get billboardType(): SpriteBillboardType | undefined;
      set billboardType(value: SpriteBillboardType | undefined);
      /** Defines the size of the sprite relative to a unit in world space. */
      get pixelsPerUnit(): number;
      set pixelsPerUnit(value: number);
      /**
       * The tint applied to the sprite. This is a hex value. A value of 0xFFFFFF
       * will remove any tint effect.
       */
      get tint(): number;
      set tint(value: number);
      /**
       * Destroys this sprite and optionally its texture and children.
       */
      destroy(options?: boolean | PIXI.IDestroyOptions): void;
      /**
       * Renders the sprite.
       * @param renderer The renderer to use.
       */
      _render(renderer: PIXI.Renderer): void;
      /**
       * The anchor sets the origin point of the sprite.
       */
      get anchor(): PIXI.ObservablePoint;
      set anchor(value: PIXI.ObservablePoint);
      /** The texture used when rendering the sprite. */
      get texture(): PIXI.Texture<PIXI.Resource>;
      set texture(value: PIXI.Texture<PIXI.Resource>);
      /** The blend used when rendering the sprite. */
      get blendMode(): PIXI.BLEND_MODES;
      set blendMode(value: PIXI.BLEND_MODES);
  }

}
declare module 'pixi3d/texture/texture-transform' {
  import { ObservablePoint, Texture } from "pixi.js";
  /**
   * Transform used to offset, rotate and scale texture coordinates.
   */
  export class TextureTransform {
      private _rotation;
      private _array;
      private _dirty;
      private _translation;
      private _scaling;
      private _rotate;
      /** The rotation for the texture coordinates. */
      get rotation(): number;
      set rotation(value: number);
      /** The offset for the texture coordinates. */
      offset: ObservablePoint<undefined>;
      /** The scale of the texture coordinates. */
      scale: ObservablePoint<undefined>;
      /** The matrix array. */
      get array(): Float32Array;
      /**
       * Creates a transform from the specified texture frame. Can be used when
       * texture is in a spritesheet.
       * @param texture The texture to use.
       */
      static fromTexture(texture: Texture): TextureTransform;
  }

}
declare module 'pixi3d/transform/matrix-component' {
  import { TransformId } from "pixi3d/transform/transform-id";
  export class MatrixComponent {
      private _parent;
      private _update;
      private _id?;
      private _array;
      constructor(_parent: TransformId, size: number, _update: (array: Float32Array) => void);
      get array(): Float32Array;
  }

}
declare module 'pixi3d/transform/matrix4' {
  import { Matrix } from "pixi.js";
  import { ObservablePoint3D } from "pixi3d/transform/observable-point";
  import { ObservableQuaternion } from "pixi3d/transform/observable-quaternion";
  import { TransformId } from "pixi3d/transform/transform-id";
  /**
   * Represents a 4x4 matrix.
   */
  export class Matrix4 extends Matrix implements TransformId {
      private _transformId;
      private _position?;
      private _scaling?;
      private _rotation?;
      private _up?;
      private _down?;
      private _forward?;
      private _left?;
      private _right?;
      private _backward?;
      get transformId(): number;
      /** The array containing the matrix data. */
      array: Float32Array;
      /**
       * Creates a new transform matrix using the specified matrix array.
       * @param array The matrix array, expected length is 16. If empty, an identity
       * matrix is used by default.
       */
      constructor(array?: ArrayLike<number>);
      toArray(transpose: boolean, out?: Float32Array): Float32Array;
      /** Returns the position component of the matrix. */
      get position(): Float32Array;
      /** Returns the scaling component of the matrix. */
      get scaling(): Float32Array;
      /** Returns the rotation quaternion of the matrix. */
      get rotation(): Float32Array;
      /** Returns the up vector of the matrix. */
      get up(): Float32Array;
      /** Returns the down vector of the matrix. */
      get down(): Float32Array;
      /** Returns the left vector of the matrix. */
      get right(): Float32Array;
      /** Returns the right vector of the matrix. */
      get left(): Float32Array;
      /** Returns the forward vector of the matrix. */
      get forward(): Float32Array;
      /** Returns the backward vector of the matrix. */
      get backward(): Float32Array;
      copyFrom(matrix: Matrix4): this;
      /**
       * Sets the rotation, position and scale components.
       * @param rotation The rotation to set.
       * @param position The position to set.
       * @param scaling The scale to set.
       */
      setFromRotationPositionScale(rotation: ObservableQuaternion, position: ObservablePoint3D, scaling: ObservablePoint3D): void;
      /**
       * Multiplies this matrix with another matrix.
       * @param matrix The matrix to multiply with.
       */
      multiply(matrix: Matrix4): void;
  }

}
declare module 'pixi3d/transform/observable-point' {
  import * as PIXI from "pixi.js";
  /**
   * Represents a point in 3D space.
   */
  export class ObservablePoint3D extends PIXI.ObservablePoint {
      private _array;
      /** Array containing the x, y, z values. */
      get array(): Float32Array;
      set array(value: Float32Array);
      /**
       * Creates a new observable point.
       * @param cb The callback when changed.
       * @param scope The owner of callback.
       * @param x The position on the x axis.
       * @param y The position on the y axis.
       * @param z The position on the z axis.
       */
      constructor(cb: () => void, scope: any, x?: number, y?: number, z?: number);
      /**
       * Position on the x axis relative to the local coordinates of the parent.
       */
      get x(): number;
      set x(value: number);
      /**
       * Position on the y axis relative to the local coordinates of the parent.
       */
      get y(): number;
      set y(value: number);
      /**
       * Position on the z axis relative to the local coordinates of the parent.
       */
      get z(): number;
      set z(value: number);
      clone(cb?: (this: any) => any, scope?: any): ObservablePoint3D;
      copyFrom(p: ObservablePoint3D): this;
      copyTo<T extends PIXI.IPoint>(p: T): T;
      equals(p: ObservablePoint3D): boolean;
      /**
       * Sets the point to a new x, y and z position.
       * @param x The position on the x axis.
       * @param y The position on the y axis.
       * @param z The position on the z axis.
       */
      set(x: number, y?: number, z?: number): this;
      /**
       * Sets the point to a new x, y and z position.
       * @param array The array containing x, y and z, expected length is 3.
       */
      setFrom(array: ArrayLike<number>): this;
  }

}
declare module 'pixi3d/transform/observable-quaternion' {
  import { ObservablePoint, IPoint } from "pixi.js";
  /**
   * Represents a rotation quaternion in 3D space.
   */
  export class ObservableQuaternion extends ObservablePoint {
      private _array;
      /** Array containing the x, y, z, w values. */
      get array(): Float32Array;
      set array(value: Float32Array);
      /**
       * Creates a new observable quaternion.
       * @param cb The callback when changed.
       * @param scope The owner of callback.
       * @param x The x component.
       * @param y The y component.
       * @param z The z component.
       * @param w The w component.
       */
      constructor(cb: () => void, scope: any, x?: number, y?: number, z?: number, w?: number);
      /** The x component of the quaternion. */
      get x(): number;
      set x(value: number);
      /** The y component of the quaternion. */
      get y(): number;
      set y(value: number);
      /** The z component of the quaternion. */
      get z(): number;
      set z(value: number);
      /** The w component of the quaternion. */
      get w(): number;
      set w(value: number);
      /**
       * Sets the euler angles in degrees.
       * @param x The x angle.
       * @param y The y angle.
       * @param z The z angle.
       */
      setEulerAngles(x: number, y: number, z: number): void;
      /**
       * Creates a clone of this quaternion.
       * @param cb Callback when changed.
       * @param scope Owner of callback.
       */
      clone(cb?: (this: any) => any, scope?: any): ObservableQuaternion;
      /**
       * Copies x, y, z, and w from the given quaternion.
       * @param p The quaternion to copy from.
       */
      copyFrom(p: ObservableQuaternion): this;
      /**
       * Copies x, y, z and w into the given quaternion.
       * @param p The quaternion to copy to.
       */
      copyTo<T extends IPoint>(p: T): T;
      /**
       * Returns true if the given quaternion is equal to this quaternion.
       * @param p The quaternion to check.
       */
      equals(p: ObservableQuaternion): boolean;
      /**
       * Sets the quaternion to new x, y, z and w components.
       * @param x X component to set.
       * @param y Y component to set.
       * @param z Z component to set.
       * @param w W component to set.
       */
      set(x: number, y?: number, z?: number, w?: number): this;
      /**
       * Sets the quaternion to a new x, y, z and w components.
       * @param array The array containing x, y, z and w, expected length is 4.
       */
      setFrom(array: ArrayLike<number>): this;
  }

}
declare module 'pixi3d/transform/transform-id' {
  export interface TransformId {
      readonly transformId: number;
  }

}
declare module 'pixi3d/transform/transform' {
  import { Transform } from "pixi.js";
  import { Matrix4 } from "pixi3d/transform/matrix4";
  import { ObservablePoint3D } from "pixi3d/transform/observable-point";
  import { ObservableQuaternion } from "pixi3d/transform/observable-quaternion";
  /**
   * Handles position, scaling and rotation in 3D.
   */
  export class Transform3D extends Transform {
      /** The position in local space. */
      position: ObservablePoint3D;
      /** The scale in local space. */
      scale: ObservablePoint3D;
      /** The rotation in local space. */
      rotationQuaternion: ObservableQuaternion;
      /** The transformation matrix in world space. */
      worldTransform: Matrix4;
      /** The transformation matrix in local space. */
      localTransform: Matrix4;
      /** The inverse transformation matrix in world space. */
      inverseWorldTransform: Matrix4;
      /** The normal transformation matrix. */
      normalTransform: Matrix4;
      /**
       * Updates the local transformation matrix.
       */
      updateLocalTransform(): void;
      /**
       * Sets position, rotation and scale from a matrix array.
       * @param matrix The matrix to set.
       */
      setFromMatrix(matrix: Matrix4): void;
      /**
       * Updates the world transformation matrix.
       * @param parentTransform The parent transform.
       */
      updateTransform(parentTransform?: Transform): void;
      /**
       * Rotates the transform so the forward vector points at specified point.
       * @param point The point to look at.
       * @param up The upward direction.
       */
      lookAt(point: ObservablePoint3D, up?: Float32Array): void;
  }

}
declare module 'pixi3d' {
  import main = require('pixi3d/index');
  export = main;
}