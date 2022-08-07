export type PackBox = {width: number, height: number, x?: number, y?: number};

export function potpack(boxes: PackBox[], spaceAround: number): {w: number, h: number, fill: number} {

    // calculate total box area and maximum box width
    let area = 0;
    let maxWidth = 0;

    for(let box of boxes){
        box.width += 2*spaceAround;
        box.height += 2*spaceAround;
    }

    for (const box of boxes) {
        area += box.width * box.height;
        maxWidth = Math.max(maxWidth, box.width);
    }

    // sort the boxes for insertion by height, descending
    boxes.sort((a, b) => b.height - a.height);

    // aim for a squarish resulting container,
    // slightly adjusted for sub-100% space utilization
    const startWidth = Math.max(Math.ceil(Math.sqrt(area / 0.95)), maxWidth);

    // start with a single empty space, unbounded at the bottom
    const spaces: PackBox[] = [{x: 0, y: 0, width: startWidth, height: Infinity}];

    let width = 0;
    let height = 0;

    for (const box of boxes) {
        // look through spaces backwards so that we check smaller spaces first
        for (let i = spaces.length - 1; i >= 0; i--) {
            const space = spaces[i];

            // look for empty spaces that can accommodate the current box
            if (box.width > space.width || box.height > space.height) continue;

            // found the space; add the box to its top-left corner
            // |-------|-------|
            // |  box  |       |
            // |_______|       |
            // |         space |
            // |_______________|
            box.x = space.x;
            box.y = space.y;

            height = Math.max(height, box.y + box.height);
            width = Math.max(width, box.x + box.width);

            if (box.width === space.width && box.height === space.height) {
                // space matches the box exactly; remove it
                const last = spaces.pop();
                if (i < spaces.length) spaces[i] = last;

            } else if (box.height === space.height) {
                // space matches the box height; update it accordingly
                // |-------|---------------|
                // |  box  | updated space |
                // |_______|_______________|
                space.x += box.width;
                space.width -= box.width;

            } else if (box.width === space.width) {
                // space matches the box width; update it accordingly
                // |---------------|
                // |      box      |
                // |_______________|
                // | updated space |
                // |_______________|
                space.y += box.height;
                space.height -= box.height;

            } else {
                // otherwise the box splits the space into two spaces
                // |-------|-----------|
                // |  box  | new space |
                // |_______|___________|
                // | updated space     |
                // |___________________|
                spaces.push({
                    x: space.x + box.width,
                    y: space.y,
                    width: space.width - box.width,
                    height: box.height
                });
                space.y += box.height;
                space.height -= box.height;
            }
            break;
        }
    }

    for(let box of boxes){
        box.width -= 2*spaceAround;
        box.height -= 2*spaceAround;
        box.x += spaceAround;
        box.y += spaceAround;
    }


    return {
        w: width, // container width
        h: height, // container height
        fill: (area / (width * height)) || 0 // space utilization
    };
}