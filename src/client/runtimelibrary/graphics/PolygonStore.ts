import { Punkt, abstandPunktZuGerade, abstand } from "../../tools/MatheTools.js";
import { WorldHelper } from "./World.js";
import { SpriteHelper } from "./Sprite.js";

export class HitPolygonStore {

    private static polygonStore: { [path: string]: Punkt[] } = {};

    public static getPolygonForTexture(name: string, index: number, spriteHelper: SpriteHelper, sprite: PIXI.Sprite): Punkt[] {

        if (index == null) {
            index = 0;
        }
        name += "#" + index;

        let polygon = HitPolygonStore.polygonStore[name];

        if (polygon == null) {
            // polygon = HitPolygonStore.getPolygon(<PIXI.Sprite>spriteHelper.displayObject, spriteHelper.worldHelper);
            polygon = HitPolygonStore.getPolygon(sprite, spriteHelper.worldHelper);

            HitPolygonStore.polygonStore[name] = polygon;
        }


        return polygon;

    }

    private static getPolygon(sprite: PIXI.Sprite, worldHelper: WorldHelper): Punkt[] {

        let pixels = worldHelper.app.renderer.plugins.extract.pixels(sprite);
        let w = sprite.width;
        let h = sprite.height;

        if (pixels.length !== 4 * w * h) {
            return [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }];
        }

        let polygon: Punkt[] = [];
        let additionalPointsPerHalfBorder = 3;
        let pointsPerBorder = additionalPointsPerHalfBorder*2 + 3;

        let probes: Punkt[] = [];
        HitPolygonStore.addPointsOnLine({x: 0, y: 0}, {x: w-1, y: 0}, 
            pointsPerBorder, probes);
        HitPolygonStore.addPointsOnLine({x: w-1, y: 0}, {x: w-1, y: h-1}, 
            pointsPerBorder, probes);
        HitPolygonStore.addPointsOnLine({x: w-1, y: h-1}, {x: 0, y: h-1}, 
            pointsPerBorder, probes);
        HitPolygonStore.addPointsOnLine({x: 0, y: h-1}, {x: 0, y: 0}, 
            pointsPerBorder, probes);

        let mid = {x: w/2, y: h/2};    
        for(let probe of probes){
            HitPolygonStore.probe(polygon, probe, mid,w, h, pixels);
        }

        let done: boolean = false;
        while(!done){
            done = true;
            for(let i = 0; i < polygon.length - 1; i++){
                let d = abstandPunktZuGerade(polygon[i], polygon[(i+2)%polygon.length], polygon[i+1]);
                if(d < 2){
                    polygon.splice(i+1, 1);
                    done = false;
                }
            }
        }

        // console.log(polygon);

        return polygon;

    }

    private static addPointsOnLine(start: Punkt, end: Punkt, n: number, points: Punkt[]){
    
        let fx = (end.x - start.x)/(n-1);
        let fy = (end.y - start.y)/(n-1);

        for(let i = 1; i <= n - 1 + 0.1; i++ ){
            points.push({
                x: start.x + fx*i,
                y: start.y + fy*i
            });
        }    


    }

    private static probe(polygon: Punkt[], start: Punkt, end: Punkt, 
        width: number, height: number, pixels: Uint8Array) {

        let length = abstand(start, end);
        let fx = (end.x - start.x) / length;
        let fy = (end.y - start.y) / length;

        let x: number, y: number;

        for (let i = 0; i <= length - 2; i++) {

            x = start.x + i * fx;
            y = start.y + i * fy;

            if (!HitPolygonStore.isTransparent(x, y, width, height, pixels)) {
                break;
            }
        }

        polygon.push({ x: x, y: y });

    }


    private static isTransparent(x: number, y: number, width: number, height: number, pixels: Uint8Array) {

        if (x < 0 || y < 0 || x > width || y > height) {
            return true;
        }

        let p = pixels[4 * Math.round(x) + 4 * width * Math.round(y) + 3];
        // console.log("x: " + x + ", y: " + y + ", width: " + width + " = " + p);
        // console.log("index: " + (4 * x + 4 * width * y + 3) + ", length: " + pixels.length);

        return p == 0;
    }


}