export type SpriteData = {
    image: Uint8Array,
    width: number,
    height: number, 
    filename?: string,

    series?: string,
    index?: number
    
    x?: number,
    y?: number
}

export class ImageLoader {

    async loadFiles(files: FileList): Promise<SpriteData[]>{
        if(files == null || files.length == 0){
            alert('Keine Dateien zum Importieren vorhanden.');
            return null;
        }

        let images: SpriteData[] = [];
        for await(let file of files){
            if(file.name.endsWith(".png")){
                try{
                    images.push(await this.loadFile(file));
                } catch (ex){}
            }
        }

        images = images.sort((a, b) => a.filename.localeCompare(b.filename));

        return images;

    }


    async loadFile(file: globalThis.File): Promise<SpriteData>{
        let buffer: ArrayBuffer = await this.readFileAsync(file);

        let img = UPNG.decode(buffer);
        let rgba8 = UPNG.toRGBA8(img)[0];
        let data: Uint8Array = new Uint8Array(rgba8);

        return {
            image: data,
            width: img.width,
            height: img.height,
            filename: file.name
        }
    }



    async readFileAsync(file: globalThis.File): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
          let reader = new FileReader();
      
          reader.onload = () => {
            resolve(<ArrayBuffer>reader.result);
          };
      
          reader.onerror = reject;
      
          reader.readAsArrayBuffer(file);
        })
      }


}