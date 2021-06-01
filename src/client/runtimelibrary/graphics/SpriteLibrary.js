var SpriteLibrary = [
    {filename: "ship_1.png", name: "Ship_1", index: 0, scale: 0.8},
    {filename: "ship_2.png", name: "Ship_1", index: 1, scale: 0.8},
    {filename: "ship_3.png", name: "Ship_1", index: 2, scale: 0.8},
    {filename: "Schaufel.png", name: "Werkzeug", index: 0, scale: 1.0},
    {filename: "minesweeper/minesweeper.png", name: "Minesweeper", tilesX: 20, tilesY: 1, spacingX: 1, scale: 1.0, index: 0},
    {filename: "minesweeper/minesweeper-numbers.png", name: "Minesweeper", tilesX: 10, tilesY: 1, scale: 1.0, index: 22},

    { filename: "flappy_bird/bird1.png", name: "Bird", index: 0, indexName: "Bird" },
    { filename: "flappy_bird/bird2.png", name: "Bird", index: 1, indexName: "Bird" },
    { filename: "flappy_bird/bird3.png", name: "Bird", index: 2, indexName: "Bird" },
    { filename: "flappy_bird/Baeume.png", name: "Bird", index: 3, indexName: "Bird" },
    { filename: "flappy_bird/houses.png", name: "Bird", index: 4, indexName: "Bird" },
    { filename: "flappy_bird/Leiste.png", name: "Bird", index: 5, indexName: "Bird" },
    { filename: "flappy_bird/Saeule.png", name: "Bird", index: 6, indexName: "Bird" },
    { filename: "flappy_bird/Wolken.png", name: "Bird", index: 7, indexName: "Bird" },
    
    { filename: "Raumschiff_Adrian/NeuesRaumschiff/raumschiff_0004_geradeaus.png", name: "Space_Shooter_1", index: 0 },
    { filename: "Raumschiff_Adrian/NeuesRaumschiff/raumschiff_0001_runter1.png", name: "Space_Shooter_1", index: 1 },
    { filename: "Raumschiff_Adrian/NeuesRaumschiff/raumschiff_0000_runter2.png", name: "Space_Shooter_1", index: 2 },
    { filename: "Raumschiff_Adrian/NeuesRaumschiff/raumschiff_0003_hoch1.png", name: "Space_Shooter_1", index: 3 },
    { filename: "Raumschiff_Adrian/NeuesRaumschiff/raumschiff_0002_hoch2.png", name: "Space_Shooter_1", index: 4 },

    { filename: "Raumschiff_Adrian/NeuerSchuss.png", name: "Space_Shooter_1", index: 5 },
    { filename: "Raumschiff_Adrian/Schussanimation/schuss_0000.png", name: "Space_Shooter_1", index: 6 },
    { filename: "Raumschiff_Adrian/Schussanimation/schuss_0001.png", name: "Space_Shooter_1", index: 7 },
    { filename: "Raumschiff_Adrian/Schussanimation/schuss_0002.png", name: "Space_Shooter_1", index: 8 },
    { filename: "Raumschiff_Adrian/Schussanimation/schuss_0003.png", name: "Space_Shooter_1", index: 9 },
    
    { filename: "Raumschiff_Adrian/Asteroid.png", name: "Space_Shooter_1", index: 10 },
    { filename: "Raumschiff_Adrian/Gegner.png", name: "Space_Shooter_1", index: 11 },

    { filename: "Raumschiff_Adrian/Explosion/explosion_0000_..png", name: "Space_Shooter_1", index: 12 },
    { filename: "Raumschiff_Adrian/Explosion/explosion_0001_..png", name: "Space_Shooter_1", index: 13 },
    { filename: "Raumschiff_Adrian/Explosion/explosion_0002_..png", name: "Space_Shooter_1", index: 14 },
    { filename: "Raumschiff_Adrian/Explosion/explosion_0003_..png", name: "Space_Shooter_1", index: 15 },
    { filename: "Raumschiff_Adrian/Explosion/explosion_0004_..png", name: "Space_Shooter_1", index: 16 },
    { filename: "Raumschiff_Adrian/Explosion/explosion_0005_..png", name: "Space_Shooter_1", index: 17 },
    { filename: "Raumschiff_Adrian/Explosion/explosion_0006_..png", name: "Space_Shooter_1", index: 18 },
    { filename: "Raumschiff_Adrian/Explosion/explosion_0007_..png", name: "Space_Shooter_1", index: 19 },
    { filename: "Raumschiff_Adrian/Explosion/explosion_0008_..png", name: "Space_Shooter_1", index: 20 },
    { filename: "Raumschiff_Adrian/Explosion/explosion_0009_..png", name: "Space_Shooter_1", index: 21 },
    { filename: "Raumschiff_Adrian/Explosion/explosion_0010_..png", name: "Space_Shooter_1", index: 22 },
    { filename: "Raumschiff_Adrian/Explosion/explosion_0011_..png", name: "Space_Shooter_1", index: 23 },

    {filename: "plattformer/Tiles_gesamt_64x64.png", name: "Plattforms", tilesX: 22, tilesY: 13, spacingX: 2, spacingY: 2, scale: 1.0, index: 0},
    {filename: "plattformer/male.png", name: "Characters_1", tilesX: 6, tilesY: 2, spacingX: 0, spacingY: 0, scale: 1.0, index: 0}
    // {filename: "plattformer/female.png", name: "Characters", tilesX: 6, tilesY: 2, spacingX: 0, spacingY: 0, scale: 1.0, index: 12},

]

function expandDigits(n, digits){
    let s = "" + n;
    while(s.length < digits) s = "0" + s;
    return s;
}

let spriteLibInit = () => {
    for(let i = 0; i < 56; i++){
        SpriteLibrary.push({
            filename: "explosion-images/explosion" + expandDigits(i, 4) + ".png",
            name: "Explosion_1",
            index: i
        })
    }
    for(let i = 1; i <= 10; i++){
        SpriteLibrary.push({
            filename: "boulders/image_part_" + expandDigits(i, 3) + ".png",
            name: "Boulders",
            index: i - 1
        })
    }
}

spriteLibInit();

if(typeof module != "undefined"){
    module.exports = SpriteLibrary; 
}