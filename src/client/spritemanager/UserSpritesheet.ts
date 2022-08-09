import { SpriteData } from "./ImageLoader.js";
import { potpack } from "./RectanglePacker.js";

type PixiSpritesheetData = {
    frames: {
        [name: string]: {
            frame: { x: number, y: number, w: number, h: number },
            rotated: boolean,
            trimmed: boolean,
            spriteSourceSize: { x: number, y: number, w: number, h: number },
            sourceSize: { w: number, h: number },
            pivot: { x: number, y: number }
        }
    },
    meta: {
        app: string,
        version: string,
        image: string,
        format: "RGBA8888",
        size: { w: number, h: number },
        scale: string
    }
}


export class UserSpritesheet {

    spriteDataList: SpriteData[] = [];

    pixiSpritesheetData: PixiSpritesheetData;
    pngImageData: Uint8Array;
    pngFile: Uint8Array;

    async loadFromServer(path: string): Promise<void> {

        let that = this;

        return new Promise((resolve, reject) => {
            $.ajax({
                type: 'GET',
                async: true,
                url: "sprites/" + path + ".png",
                xhrFields: { responseType: 'arraybuffer' },
                success: (arrayBuffer: ArrayBuffer) => {

                    $.ajax({
                        type: 'GET',
                        async: true,
                        url: "sprites/" + path + ".json",
                        xhrFields: { responseType: 'json' },
                        success: (pixiSpritesheetData: PixiSpritesheetData) => {
                            let img = UPNG.decode(arrayBuffer);
                            let rgba8 = UPNG.toRGBA8(img)[0];
                            let imageData: Uint8Array = new Uint8Array(rgba8);
                            pixiSpritesheetData.meta.size.w = img.width;
                            pixiSpritesheetData.meta.size.h = img.height;

                            that.extractImagesFromSheet(pixiSpritesheetData, imageData);
                            resolve();
                        },
                        error: (jqXHR, message) => {
                            alert("Konnte das Spritesheet nicht laden.");
                            reject();
                        }
                    });


                },
                error: (jqXHR, message) => {
                    alert("Konnte das Spritesheet nicht laden.");
                }
            });

        });

    }

    private extractImagesFromSheet(pixiSpritesheetData: PixiSpritesheetData, imageData: Uint8Array) {
        let sheetWidth = pixiSpritesheetData.meta.size.w;

        this.spriteDataList = [];

        for (let key in pixiSpritesheetData.frames) {
            let frame = pixiSpritesheetData.frames[key];
            let hashIndex = key.indexOf('#');
            let series = key.substring(0, hashIndex);
            let index = Number.parseInt(key.substring(hashIndex + 1));
            let image = new Uint8Array(frame.frame.w * frame.frame.h * 4);
            let spriteData: SpriteData = {
                image: image,
                width: frame.frame.w,
                height: frame.frame.h,
                x: frame.frame.x,
                y: frame.frame.y,
                filename: "",
                series: series,
                index: index
            }

            let source = (spriteData.y * sheetWidth + spriteData.x) * 4;
            let dest = 0;

            for (let y = 0; y < frame.frame.h; y++) {
                for (let x = 0; x < frame.frame.w * 4; x++) {
                    imageData[source + x] = image[dest + x];
                }
                source += sheetWidth * 4;
                dest += frame.frame.w * 4;
            }

            this.spriteDataList.push(spriteData);
        }
    }

    addSprite(spriteData: SpriteData) {
        this.spriteDataList.push(spriteData);
    }

    generatePixiSpritesheet() {
        let sheetDimensions = potpack(this.spriteDataList, 1);

        this.pngImageData = new Uint8Array(sheetDimensions.w * sheetDimensions.h * 4);
        this.pixiSpritesheetData = {
            frames: {},
            meta: {
                "app": "",
                "version": "1.0",
                "image": "dummy.png",
                "format": "RGBA8888",
                "size": {
                    "w": sheetDimensions.w,
                    "h": sheetDimensions.h
                },
                "scale": "1"
            }
        }

        for (let spriteData of this.spriteDataList) {
            let dest = ((spriteData.y + 1) * sheetDimensions.w + spriteData.x + 1) * 4;
            let source = 0;

            for (let y = 0; y < spriteData.height; y++) {
                for (let x = 0; x < spriteData.width * 4; x++) {
                    this.pngImageData[dest + x] = spriteData.image[source + x];
                }
                dest += sheetDimensions.w * 4;
                source += spriteData.width * 4;
            }

            dest = (spriteData.y * sheetDimensions.w + spriteData.x + 1) * 4;
            source = dest + sheetDimensions.w * 4;
            this.pngImageData.copyWithin(dest, source, source + spriteData.width * 4);
            dest = ((spriteData.y + spriteData.height) * sheetDimensions.w + spriteData.x + 1) * 4;
            source = dest - sheetDimensions.w * 4;
            this.pngImageData.copyWithin(dest, source, source + spriteData.width * 4);

            let dest1 = ((spriteData.y + 1) * sheetDimensions.w + spriteData.x) * 4;
            let dest2 = ((spriteData.y + 1) * sheetDimensions.w + spriteData.x + 1 + spriteData.width) * 4;
            for (let y = 0; y < spriteData.height; y++) {
                this.pngImageData[dest1] = this.pngImageData[dest1 + 1];
                this.pngImageData[dest2] = this.pngImageData[dest2 - 1];
                dest1 += sheetDimensions.w;
                dest2 += sheetDimensions.w;
            }

            this.pixiSpritesheetData.frames[spriteData.series + "#" + spriteData.index] = {
                "frame": {
                    "x": spriteData.x,
                    "y": spriteData.y,
                    "w": spriteData.width,
                    "h": spriteData.height
                },
                "rotated": false,
                "trimmed": false,
                "spriteSourceSize": {
                    "x": 0,
                    "y": 0,
                    "w": spriteData.width,
                    "h": spriteData.height
                },
                "sourceSize": {
                    "w": spriteData.width,
                    "h": spriteData.height
                },
                "pivot": {
                    "x": 0.5,
                    "y": 0.5
                }
            }

        }

        let pngFileBuffer = UPNG.encode([this.pngImageData.buffer], sheetDimensions.w, sheetDimensions.h, 0);
        this.pngFile = new Uint8Array(pngFileBuffer);

    }


}