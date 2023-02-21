import Jimp from 'jimp';

//let extrudeMarginInformation = [];
// type { left: number, top: number, width: number, height: number, marginWidth: number}



export function extrudeMargin(extrudeMarginInformation, filename1){

    if(extrudeMarginInformation.length > 0){
        Jimp.read(filename1, (err, image) => {
            if (err) throw err;

            for(let i = 0; i < extrudeMarginInformation.length; i++){
                
                let emi = extrudeMarginInformation[i];

                extrudeMarginIntern(image, emi);

            }

              image.write(filename1);
          });



    }


}


// type of emi: { left: number, top: number, width: number, height: number, marginWidth: number}
function extrudeMarginIntern(image, emi){

    let mw = emi.marginWidth;
    let left = emi.left;
    let top = emi.top;
    let right = emi.left + emi.width - 1;
    let bottom = emi.top + emi.height - 1;

    copyPixelToRectangle(image, left, top, left - mw, top - mw, mw, mw);
    copyPixelToRectangle(image, left, bottom, left - mw, bottom + 1, mw, mw);
    copyPixelToRectangle(image, right, top, right + 1, top - mw, mw, mw);
    copyPixelToRectangle(image, right, bottom, right + 1, bottom + 1, mw, mw);

    for(let x = left; x < left + emi.width; x++){
        copyPixelToRectangle(image, x, top, x, top - mw, 1, mw);
        copyPixelToRectangle(image, x, top + emi.height - 1, x, top + emi.height, 1, mw);
    }

    for(let y = top; y < top + emi.height; y++){
        copyPixelToRectangle(image, left, y, left - mw, y, mw, 1);
        copyPixelToRectangle(image, left + emi.width - 1, y, left + emi.width, y, mw, 1);
    }

}

function copyPixelToRectangle(image, x, y, left, top, width, height){

    let color = image.getPixelColor(x, y);
    for(let x1 = left; x1 < left + width; x1++){
        for(let y1 = top; y1 < top + height; y1++){
            image.setPixelColor(color, x1, y1);
        }
    }

}
