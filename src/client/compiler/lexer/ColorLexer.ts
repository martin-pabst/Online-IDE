export class ColorLexer {
    hexColorRegExp = /^#([a-fA-F0-9]{6})$/;
    rgbColorRegExp = /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/;
    rgbaColorRegExp = /^rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*(\d*(?:\.\d+)?)\)$/;

    getColorInfo(s: string): monaco.languages.IColor {

        if(s.startsWith('#')){
            let m1 = s.match(this.hexColorRegExp);
            if(m1 == null) return null;

            let value = Number.parseInt(m1[1], 16);
            return {
                red: (value >> 16)/255,
                green: ((value >> 8) & 0xff) / 255,
                blue: (value & 0xff)/255,
                alpha: 1
            }

        } else if(s.startsWith('rgb')){

            if(s.startsWith('rgba')){
                let m2 = s.match(this.rgbaColorRegExp);
                if(m2 == null) return null;

                return {
                    red: Number.parseInt(m2[1])/255,
                    green: Number.parseInt(m2[2]) / 255,
                    blue: Number.parseInt(m2[3])/255,
                    alpha: Number.parseFloat(m2[4])
                }
            } else {
                let m3 = s.match(this.rgbColorRegExp);
                if(m3 == null) return null;

                return {
                    red: Number.parseInt(m3[1])/255,
                    green: Number.parseInt(m3[2]) / 255,
                    blue: Number.parseInt(m3[3])/255,
                    alpha: 1
                }
    

            }

        }

        return null;
    }


}