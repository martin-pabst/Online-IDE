import { BaseTexture } from "pixi.js/index.js";
import { MainBase } from "../main/MainBase.js";
import { CacheManager } from "../tools/CacheManager.js";
import { Workspace } from "../workspace/Workspace.js";


export type PixiSpritesheetData = {
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

export class SpritesheetData {

    pixiSpritesheetData: PixiSpritesheetData;
    pngImageData: Uint8Array;
    pngFile: Uint8Array;

    async initializeSpritesheetForWorkspace(workspace: Workspace, main: MainBase){

        let spriteIdentifiers: Set<string> = new Set();

        if(workspace.spritesheetId != null){
            await this.load(workspace.spritesheetId);
    
            if(main.userSpritesheet != null){
                main.userSpritesheet.destroy();
                main.userSpritesheet = null;
            }
    
            if(this.pngImageData != null && this.pixiSpritesheetData != null){
                let baseTexture = PIXI.BaseTexture.fromBuffer(this.pngImageData, this.pixiSpritesheetData.meta.size.w, this.pixiSpritesheetData.meta.size.h);
                main.userSpritesheet = new PIXI.Spritesheet(baseTexture, this.pixiSpritesheetData);
                main.userSpritesheet.parse(() => {});
                for(let identifier in this.pixiSpritesheetData.frames){
                    let hashIndex = identifier.indexOf('#');
                    spriteIdentifiers.add(identifier.substring(0, hashIndex));
                }
            }
            
        }

        let spriteLibrary = workspace.moduleStore.getBaseModule().typeStore.getType("SpriteLibrary");

        let identifierList: string[] = Array.from(spriteIdentifiers);

        //@ts-ignore
        spriteLibrary.includeUserSpritesheet(identifierList);

    }


    async load(spritesheetId: number): Promise<void> {
        if(spritesheetId == null) return;

        let path = "sprites/" +   ('0' + (spritesheetId % 256).toString(16)).slice(-2).toUpperCase() + "/" + spritesheetId;

        let cacheManager = new CacheManager();
        this.pngFile = await cacheManager.fetchUint8ArrayFromCache(path + ".png");
        let sd = await cacheManager.fetchStringFromCache(path + ".json");
        if(this.pngFile == null || sd == null){
            await this.loadFromServer(path);
            if(this.pngFile != null && this.pixiSpritesheetData != null){
                cacheManager.store(path + ".png", this.pngFile);
                cacheManager.store(path + ".json", JSON.stringify(this.pixiSpritesheetData));
            }
        } else {
            this.pixiSpritesheetData = JSON.parse(sd);
        }

        this.unpackPngFile();
        return;
    }

    public unpackPngFile(){
        let img = UPNG.decode(this.pngFile.buffer);
        let rgba8 = UPNG.toRGBA8(img)[0];
        this.pngImageData = new Uint8Array(rgba8);
        this.pixiSpritesheetData.meta.size.w = img.width;
        this.pixiSpritesheetData.meta.size.h = img.height;
    }

    private async loadFromServer(path: string):Promise<void>{
        return new Promise((resolve, reject) => {
            $.ajax({
                type: 'GET',
                async: true,
                url: path + ".png",
                xhrFields: { responseType: 'arraybuffer' },
                success: (arrayBuffer: ArrayBuffer) => {
                    this.pngFile = new Uint8Array(arrayBuffer);

                    $.ajax({
                        type: 'GET',
                        async: true,
                        url: path + ".json",
                        success: (pixiSpritesheetData: PixiSpritesheetData) => {
                            this.pixiSpritesheetData = pixiSpritesheetData;
                            resolve();
                        },
                        error: (jqXHR, message) => {
                            alert("Konnte das Spritesheet nicht laden: " + message);
                            reject();
                        }
                    });


                },
                error: (jqXHR, message) => {
                    alert("Konnte das Spritesheet nicht laden: " + message);
                }
            });

        });

    }


}