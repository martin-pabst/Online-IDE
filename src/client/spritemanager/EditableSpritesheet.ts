import { SpriteData } from "./ImageFile.js";
import { potpack } from "./RectanglePacker.js";
import { SpritesheetData } from "./SpritesheetData.js";


export class EditableSpritesheet {

    spriteDataList: SpriteData[] = [];

    constructor(public spritesheet: SpritesheetData){
        if(this.spritesheet == null || spritesheet.pixiSpritesheetData == null){
            this.spritesheet = new SpritesheetData()
        } else {
            this.extractImagesFromSheet();
        }
    }

    public extractImagesFromSheet() {
        let sheetWidth = this.spritesheet.pixiSpritesheetData.meta.size.w;

        this.spriteDataList = [];

        for (let key in this.spritesheet.pixiSpritesheetData.frames) {
            let frame = this.spritesheet.pixiSpritesheetData.frames[key];
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
                    image[dest + x] = this.spritesheet.pngImageData[source + x];
                }
                source += sheetWidth * 4;
                dest += frame.frame.w * 4;
            }

            this.spriteDataList.push(spriteData);
        }
    }

    addSprite(spriteData: SpriteData, linesCount:number, columnscount:number, 
        margin:number, space:number, series:string, indexFrom: number): SpriteData[] {

        let newSprites: SpriteData[] = [];

        if(columnscount > 1 || linesCount > 1){
            
            let width = Math.trunc((spriteData.width - 2*margin + space)/columnscount - space);
            let heigth = Math.trunc((spriteData.height - 2*margin + space)/linesCount - space);

            for(let row = 0; row < linesCount; row++){
            for(let column = 0; column < columnscount; column++){
                    let x = margin + column * (width + space);
                    let y = margin + row * (heigth + space);
                    let singleSpriteData:SpriteData = this.cut(spriteData, x, y, width, heigth);
                    singleSpriteData.series = series;
                    singleSpriteData.index = indexFrom + row*columnscount + column;
                    this.spriteDataList.push(singleSpriteData)
                    newSprites.push(singleSpriteData);
                }
            }


        } else {
            spriteData.series = series;
            spriteData.index = indexFrom;
            this.spriteDataList.push(spriteData);
            newSprites.push(spriteData);
        }
        return newSprites;
    }

    cut(spriteData: SpriteData, left: number, top: number, width: number, height: any): SpriteData {
        let singleSpriteData: SpriteData = {
            height: height,
            width: width,
            image: new Uint8Array(width*height * 4)
        }

        let src = spriteData.image;
        let dest = singleSpriteData.image;

        for(let x = 0; x < width; x++){
            for(let y = 0; y < height; y++){
                let posSrc = (left + x + (top + y)*spriteData.width)*4;
                let posDest = (x + y*width) * 4;

                dest[posDest] = src[posSrc];
                dest[posDest + 1] = src[posSrc + 1];
                dest[posDest + 2] = src[posSrc + 2];
                dest[posDest + 3] = src[posSrc + 3];
            }
        }

        return singleSpriteData;

    }

    async generateAndZipSpritesheet(filename: string = "spritesheet") {
        let sheetDimensions = potpack(this.spriteDataList, 1);

        this.spritesheet.pngImageData = new Uint8Array(sheetDimensions.w * sheetDimensions.h * 4);
        this.spritesheet.pixiSpritesheetData = {
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

            let dest = (spriteData.y * sheetDimensions.w + spriteData.x) * 4;
            let source = 0;

            for (let y = 0; y < spriteData.height; y++) {
                for (let x = 0; x < spriteData.width * 4; x++) {
                    this.spritesheet.pngImageData[dest + x] = spriteData.image[source + x];
                }
                dest += sheetDimensions.w * 4;
                source += spriteData.width * 4;
            }

            /**
             * Avoid tile bleeding by doubling outermost pixels
             */
            // top row
            dest = ((spriteData.y-1) * sheetDimensions.w + spriteData.x) * 4;
            source = dest + sheetDimensions.w * 4;
            this.spritesheet.pngImageData.copyWithin(dest, source, source + spriteData.width * 4);

            // bottom row
            dest = ((spriteData.y + spriteData.height) * sheetDimensions.w + spriteData.x) * 4;
            source = dest - sheetDimensions.w * 4;
            this.spritesheet.pngImageData.copyWithin(dest, source, source + spriteData.width * 4);

            let dest1 = (spriteData.y * sheetDimensions.w + spriteData.x - 1) * 4;
            let dest2 = (spriteData.y * sheetDimensions.w + spriteData.x + spriteData.width) * 4;
            for (let y = 0; y < spriteData.height; y++) {
                this.spritesheet.pngImageData[dest1] = this.spritesheet.pngImageData[dest1 + 4];
                this.spritesheet.pngImageData[dest1+1] = this.spritesheet.pngImageData[dest1 + 5];
                this.spritesheet.pngImageData[dest1+2] = this.spritesheet.pngImageData[dest1 + 6];
                this.spritesheet.pngImageData[dest1+3] = this.spritesheet.pngImageData[dest1 + 7];

                this.spritesheet.pngImageData[dest2] = this.spritesheet.pngImageData[dest2 - 4];
                this.spritesheet.pngImageData[dest2+1] = this.spritesheet.pngImageData[dest2 - 3];
                this.spritesheet.pngImageData[dest2+2] = this.spritesheet.pngImageData[dest2 - 2];
                this.spritesheet.pngImageData[dest2+3] = this.spritesheet.pngImageData[dest2 - 1];

                dest1 += sheetDimensions.w*4;
                dest2 += sheetDimensions.w*4;
            }

            this.spritesheet.pixiSpritesheetData.frames[spriteData.series + "#" + spriteData.index] = {
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

        let pngFileBuffer = UPNG.encode([this.spritesheet.pngImageData.buffer], sheetDimensions.w, sheetDimensions.h, 0);
        this.spritesheet.pngFile = new Uint8Array(pngFileBuffer);
        await this.spritesheet.makeZip(filename);
    }


}