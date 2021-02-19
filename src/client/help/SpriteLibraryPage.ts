type SpriteLibraryEntry = {
    filename: string,
    name: string,
    index?: number,
    scale?: number,
    indexName?: string,
    tilesX?: number,
    tilesY?: number,
    minIndex?: number
}

declare var SpriteLibrary: SpriteLibraryEntry[];

export class SpriteLibraryPage {
    start() {

        let $entries = jQuery('#entries');
        let $set: JQuery<HTMLElement>;

        let nameOld: string = "";
        for (let e of SpriteLibrary) {

            let tilesX = e.tilesX == null ? 1 : e.tilesX;
            let tilesY = e.tilesY == null ? 1 : e.tilesY;
            let index: number = e.index == null ? 0 : e.index;

            for (let row = 0; row < tilesY; row++) {
                for (let column = 0; column < tilesX; column++) {
                    if (e.name != nameOld) {
                        nameOld = e.name;
                        $set = jQuery('<div class="jo_spritelibrary-set jo_scrollable"></div>');
                        $entries.append(jQuery('<div class="jo_spritelibrary-heading">' + e.name + "</div>"));
                        jQuery('#entries').append($set);
                    }
                    let $sh = jQuery('<div class="' + e.name + "_" + (index) + '"></div>');
                    let width: number;
                    let height: number;
                    let $outerbox = jQuery('<div class="jo_spritelibrary-box"></div>');
                    let $innerbox = jQuery('<div class="jo_spritelibrary-innerbox"></div>');
                    $outerbox.append($innerbox);
                    if (e.scale != null) {
                        let $sh1 = jQuery('<div class="jo_transformed-sprite" style="transform: scale(' + e.scale + '); transform-origin: top left"></div>');
                        $sh1.append($sh);
                        $innerbox.append($sh1);
                        $set.append($outerbox);
                        width = $sh.width();
                        height = $sh.height();
                        $sh1.css({ width: width * e.scale + "px", height: height * e.scale + "px" });
                    } else {
                        $innerbox.append($sh);
                        $set.append($outerbox);
                        width = $sh.width();
                        height = $sh.height();
                    }
                    $outerbox.append('<div class="jo_spritelibrary-subscript">Nr. ' + index + '</div>');
                    $outerbox.append('<div class="jo_spritelibrary-subscript">' + width + ' x ' + height + '</div>');
                    if (e.indexName != null) {
                        $outerbox.append('<div class="jo_spritelibrary-subscript">(' + e.indexName + ')</div>');
                    }
                    index++;
                }
            }
        }


    }
}

jQuery(() => {
    new SpriteLibraryPage().start();
})