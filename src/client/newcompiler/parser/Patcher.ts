type Patch = {
    old: RegExp, 
    new: string
}

export class Patcher {

    static patches: Patch[] = [
        {old: /SpriteLibrary.Ship_Adrian,\s*0/g, new: "SpriteLibrary.Space_Shooter_1, 0"},
        {old: /SpriteLibrary.Ship_Adrian,\s*1/g, new: "SpriteLibrary.Space_Shooter_1, 1"},
        {old: /SpriteLibrary.Ship_Adrian,\s*2/g, new: "SpriteLibrary.Space_Shooter_1, 2"},
        {old: /SpriteLibrary.Ship_Adrian,\s*3/g, new: "SpriteLibrary.Space_Shooter_1, 3"},
        {old: /SpriteLibrary.Ship_Adrian,\s*4/g, new: "SpriteLibrary.Space_Shooter_1, 4"},

        {old: /SpriteLibrary.Schuss_Adrian,\s*0/g, new: "SpriteLibrary.Space_Shooter_1, 5"},
        {old: /SpriteLibrary.Schuss_Adrian,\s*1/g, new: "SpriteLibrary.Space_Shooter_1, 6"},
        {old: /SpriteLibrary.Schuss_Adrian,\s*2/g, new: "SpriteLibrary.Space_Shooter_1, 7"},
        {old: /SpriteLibrary.Schuss_Adrian,\s*3/g, new: "SpriteLibrary.Space_Shooter_1, 8"},
        {old: /SpriteLibrary.Schuss_Adrian,\s*4/g, new: "SpriteLibrary.Space_Shooter_1, 9"},

        {old: /SpriteLibrary.Asteroid_Adrian,\s*0/g, new: "SpriteLibrary.Space_Shooter_1, 10"},
        {old: /SpriteLibrary.Gegner_Adrian,\s*0/g, new: "SpriteLibrary.Space_Shooter_1, 11"},

        {old: /SpriteLibrary.Explosion_Adrian,\s*0/g, new: "SpriteLibrary.Space_Shooter_1, 12"},
        {old: /SpriteLibrary.Explosion_Adrian,\s*1/g, new: "SpriteLibrary.Space_Shooter_1, 13"},
        {old: /SpriteLibrary.Explosion_Adrian,\s*2/g, new: "SpriteLibrary.Space_Shooter_1, 14"},
        {old: /SpriteLibrary.Explosion_Adrian,\s*3/g, new: "SpriteLibrary.Space_Shooter_1, 15"},
        {old: /SpriteLibrary.Explosion_Adrian,\s*4/g, new: "SpriteLibrary.Space_Shooter_1, 16"},
        {old: /SpriteLibrary.Explosion_Adrian,\s*5/g, new: "SpriteLibrary.Space_Shooter_1, 17"},
        {old: /SpriteLibrary.Explosion_Adrian,\s*6/g, new: "SpriteLibrary.Space_Shooter_1, 18"},
        {old: /SpriteLibrary.Explosion_Adrian,\s*7/g, new: "SpriteLibrary.Space_Shooter_1, 19"},
        {old: /SpriteLibrary.Explosion_Adrian,\s*8/g, new: "SpriteLibrary.Space_Shooter_1, 20"},
        {old: /SpriteLibrary.Explosion_Adrian,\s*9/g, new: "SpriteLibrary.Space_Shooter_1, 21"},
        {old: /SpriteLibrary.Explosion_Adrian,\s*10/g, new: "SpriteLibrary.Space_Shooter_1, 22"},
        {old: /SpriteLibrary.Explosion_Adrian,\s*11/g, new: "SpriteLibrary.Space_Shooter_1, 23"},
    ] 

    static patch(text: string): {patchedText: string, modified: boolean} {

        let modified: boolean = false;

        for(let patch of Patcher.patches){
            if(text.match(patch.old) != null){
                text = text.replace(patch.old, patch.new);
                modified = true;
            }
        }

        return {patchedText: text, modified: modified}

    }




}