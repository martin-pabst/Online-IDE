
export type Punkt = {
    x: number,
    y: number
}

export function gleich(a: number, b: number) {

    return Math.abs(a - b) < 0.000000001;

}

export function drehenUm(drehpunkt: Punkt, punkt: Punkt, winkelInGrad: number): Punkt {

    let w = winkelInGrad / 180 * Math.PI;
    let s = Math.sin(w);
    let c = Math.cos(w);

    let dx = punkt.x - drehpunkt.x;
    let dy = punkt.y - drehpunkt.y;

    let dxNeu = dx * c - dy * s;
    let dyNeu = dx * s + dy * c;

    return { x: drehpunkt.x + dxNeu, y: drehpunkt.y + dyNeu };

}

/**
 * Gibt true zurück, wenn die Strecke von (x0, y0) nach (x1, y1) die Strecke von
 * (x2, y2) nach (x3, y3) berührt.
 *
 * @param x0
 * @param y0
 * @param x1
 * @param y1
 * @param x2
 * @param y2
 * @param x3
 * @param y3
 * @return
 */
export function streckeSchneidetStrecke(p0: Punkt, p1: Punkt, p2: Punkt, p3: Punkt, schnittpunkt?:Punkt) {

    let a1 = p1.x - p0.x;
    let a2 = p1.y - p0.y;
    let b1 = p2.x - p3.x;
    let b2 = p2.y - p3.y;
    let c1 = p2.x - p0.x;
    let c2 = p2.y - p0.y;

    let det = a1 * b2 - a2 * b1;

    if (det * det < 0.000001) {
        return false; // die Strecken sind so gut wie parallel
    }

    let det1 = c1 * b2 - c2 * b1;
    let det2 = a1 * c2 - a2 * c1;

    let s = det1 / det;
    let t = det2 / det;

    // liegt der Schnittpunkt innerhalb von beiden Strecken?
    let schneidet = s >= 0 && s <= 1 && t >= 0 && t <= 1;

    if(schneidet && schnittpunkt != null){
        schnittpunkt.x = p0.x + s*(p1.x - p0.x);
        schnittpunkt.y = p0.y + s*(p1.y - p0.y)
        }

    return schneidet;

}

export function abstand(p1: Punkt, p2: Punkt) {

    let dx = p2.x - p1.x;
    let dy = p2.y - p1.y;

    return Math.sqrt(dx * dx + dy * dy);

}

export function winkelGradZwischenPunkten(p1: Punkt, p2: Punkt): number {
    let d = {
        x: p2.x - p1.x,
        y: p2.y - p1.y
    }

    return Math.atan2(d.y, d.x)/Math.PI*180;
}

export function streckenzugEnthältPunkt(punkte: Punkt[], punkt: Punkt, abstand: number = 0.000001) {
    for(let i = 0; i < punkte.length - 1; i++){
        if(abstandPunktZuStrecke(punkte[i], punkte[i+1], punkt) < abstand){
            return true;
        }
    }
    return false;
}

export function polygonzugEnthältPunkt(punkte: Punkt[], punkt: Punkt, abstand: number = 0.000001) {
    for(let i = 0; i < punkte.length; i++){
        if(abstandPunktZuStrecke(punkte[i % punkte.length], punkte[(i+1) % punkte.length], punkt) < abstand){
            return true;
        }
    }
    return false;
}

export function polygonEnthältPunkt(punkte: Punkt[], punkt: Punkt) {

    let inside = false;
    let vertexCount = punkte.length;

    for (let index = 0; index <= vertexCount - 1; index++) {

        let i = index % vertexCount;
        let j = (index - 1) % vertexCount;
        if (j < 0) {
            j += vertexCount;
        }

        if (((punkte[i].y > punkt.y) != (punkte[j].y > punkt.y)) &&
            (punkt.x < (punkte[j].x - punkte[i].x) * (punkt.y - punkte[i].y) / (punkte[j].y - punkte[i].y) + punkte[i].x))
            inside = !inside;
    }

    return inside;

}

export function kreisSchneidetStrecke(m: Punkt, r: number, p1: Punkt, p2: Punkt): boolean {
    /*
 * Gerade: (x, y) = (x1, x2) + t*(x2-x1, y2-y1)
 * Kreis: (x-mx)^2 + (y-my)^2 = r^2
 *
 * Schneiden der beiden liefert eine quadratische Gleichung in t, die wir lösen...
 
 */

    let x1 = p1.x;
    let y1 = p1.y;
    let x2 = p2.x;
    let y2 = p2.y;


    let a = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    let b = 2 * (x1 - m.x) * (x2 - x1) + 2 * (y1 - m.y) * (y2 - y1);
    let c = (x1 - m.x) * (x1 - m.x) + (y1 - m.y) * (y1 - m.y) - r * r;

    let determiante = b * b - 4 * a * c;

    if (determiante < 0) {
        return false; // Kreis schneidet die Gerade nicht
    }

    // Kreis schneidet die Gerade -> innerhalb der Strecke?

    let sqrt = Math.sqrt(determiante);
    let t1 = (-b + sqrt) / (2 * a);
    let t2 = (-b - sqrt) / (2 * a);

    if (t1 >= 0 && t1 <= 1) {
        return true;
    }

    if (t2 >= 0 && t2 <= 1) {
        return true;
    }

    return false;

}

export function schnittpunkteKreisStrecke(m: Punkt, r: number, p1: Punkt, p2: Punkt, schnittpunkte: Punkt[]): void {
    /*
 * Gerade: (x, y) = (x1, x2) + t*(x2-x1, y2-y1)
 * Kreis: (x-mx)^2 + (y-my)^2 = r^2
 *
 * Schneiden der beiden liefert eine quadratische Gleichung in t, die wir lösen...
 
 */

    let x1 = p1.x;
    let y1 = p1.y;
    let x2 = p2.x;
    let y2 = p2.y;


    let a = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    let b = 2 * (x1 - m.x) * (x2 - x1) + 2 * (y1 - m.y) * (y2 - y1);
    let c = (x1 - m.x) * (x1 - m.x) + (y1 - m.y) * (y1 - m.y) - r * r;

    let determiante = b * b - 4 * a * c;

    if (determiante < 0) {
        return; // Kreis schneidet die Gerade nicht
    }

    // Kreis schneidet die Gerade -> innerhalb der Strecke?

    let sqrt = Math.sqrt(determiante);
    let t1 = (-b + sqrt) / (2 * a);
    let t2 = (-b - sqrt) / (2 * a);

    if (t1 >= 0 && t1 <= 1) {
        schnittpunkte.push({ x: x1 + t1 * (x2 - x1), y: y1 + t1 * (y2 - y1) });
    }
    if (t2 >= 0 && t2 <= 1) {
        schnittpunkte.push({ x: x1 + t2 * (x2 - x1), y: y1 + t2 * (y2 - y1) });
    }

    return;

}

export function KreisBerührtPolygon(m: Punkt, r: number, punkte: Punkt[]) {

    for (let i = 0; i < punkte.length; i++) {

        if (abstand(punkte[i], m) <= r) {
            return true;
        }

    }

    // Der Kreis enthält keinen Punkt des Vielecks. Enthält es den Mittelpunkt des Kreises?
    if (polygonEnthältPunkt(punkte, m)) {
        return true;
    }

    // schneidet die Kreislinie eine der Vielecksstrecken?
    for (let i = 0; i < punkte.length; i++) {

        let p2 = punkte[(i + 1) % punkte.length];
        if (kreisSchneidetStrecke(m, r, punkte[i], p2)) {
            return true;
        }

    }

    return false;

}




export function polygonBerührtPolygon(punkte1: Punkt[], punkte2: Punkt[]) {

    // Nicht-exakte Lösung: prüfe, ob eines der Vielecke einen Eckpunkt des anderen enthält.
    // Jede Kollision beginnt damit, dass ein Eckpunkt eines Polygons eine Seite des anderen schneidet.
    // Falls oft genug geprüft wird, bleiben Kollisionen also nicht unerkannt.
    for (let i = 0; i < punkte1.length; i++) {
        if (polygonEnthältPunkt(punkte2, punkte1[i])) {
            return true;
        }
    }

    for (let i = 0; i < punkte2.length; i++) {
        if (polygonEnthältPunkt(punkte1, punkte2[i])) {
            return true;
        }
    }

    return false;

}

export function steckenzugSchneidetStreckenzug(punkte1: Punkt[], punkte2: Punkt[]) {

    for(let i = 0; i < punkte1.length - 1; i++){
        for(let j = 0; j < punkte2.length - 1; j++){
            if(streckeSchneidetStrecke(punkte1[i], punkte1[i+1], punkte2[j], punkte2[j+1])){
                return true;
            }
        }
    }

    return false;
}


export function abstandPunktZuStrecke(a: Punkt, b: Punkt, p: Punkt){

    let dx = b.x - a.x;
    let dy = b.y - a.y;

    let q = dx*dx+dy*dy;

    let lambda = ((-a.x+p.x)*dx + (-a.y+p.y)*dy)/q;

    if(lambda < 0){
        return abstand(a, p);
    }

    if(lambda > 1){
        return abstand(b, p);
    }

    let fx = a.x + lambda * (b.x - a.x);
    let fy = a.y + lambda * (b.y - a.y);

    let s1 = p.x - fx;
    let s2 = p.y - fy;

    return Math.sqrt(s1*s1 + s2*s2);
    
}

export function abstandPunktZuGerade(a: Punkt, b: Punkt, p: Punkt) {

    let dx = b.x - a.x;
    let dy = b.y - a.y;

    let l = Math.sqrt(dy * dy + dx * dx);

    if (l < 0.000000001) {
        return abstand(a, p);
    }

    return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / l;

}

export function polygonBerührtPolygonExakt(punkte1: Punkt[], punkte2: Punkt[], istGeschlossen1: boolean = false,
    istGeschlossen2: boolean = false, normaleDerBerührtenGerade1: Punkt = null) {

    if(punkte1.length == 0 || punkte2.length == 0) return false;

    let endIndex1 = punkte1.length + (istGeschlossen1 ? 0 : -1);
    let endIndex2 = punkte2.length + (istGeschlossen2 ? 0 : -1);

    if (istGeschlossen1 && polygonEnthältPunkt(punkte1, punkte2[0])) {

        if (normaleDerBerührtenGerade1 != null) {

            let minAbstand = 100000;
            let minIndex = 0;

            for (let i = 0; i < punkte1.length - 1; i++) {
                let j = (i + 1) % punkte1.length;

                let d = abstandPunktZuStrecke(punkte1[i], punkte1[j], punkte2[0]);
                if (d < minAbstand) {
                    minAbstand = d;
                    minIndex = 0;
                }

            }
            let i2 = (minIndex + 1) % punkte1.length;
            normaleDerBerührtenGerade1.y = punkte1[i2].x - punkte1[minIndex].x;
            normaleDerBerührtenGerade1.x = -(punkte1[i2].y - punkte1[minIndex].y);

        }


        return true;
    }

    if (istGeschlossen1 && polygonEnthältPunkt(punkte2, punkte1[0])) {
        return true;
    }

    for (let i = 0; i < endIndex1; i++) {
        let p1a = punkte1[i];
        let p1b = punkte1[(i + 1) % punkte1.length];
        for (let j = 0; j < endIndex2; j++) {
            let p2a = punkte2[j];
            let p2b = punkte2[(j + 1) % punkte2.length];

            if (streckeSchneidetStrecke(p1a, p1b, p2a, p2b)) {
                return true;
            }

        }

    }

    return false;

}

export function länge(vektor: Punkt): number {
    return Math.sqrt(vektor.x * vektor.x + vektor.y * vektor.y);
}

export function einheitsVektor(vektor: Punkt): Punkt {
    let l = länge(vektor);
    return { x: vektor.x / l, y: vektor.y / l };
}

// export function normalenvektorBeiImpactEinesKreises(punkte: Punkt[], isMove: boolean[], k: Kreis): Punkt {

//     let minAbstand = 100000;
//     let minIndex = 0;
//     let m = k.getMitte();

//     for (let i = 0; i < punkte.length - 1; i++) {
//         if (isMove != null && !isMove[i]) {
//             let j = (i + 1) % punkte.length;

//             let d = abstandPunktZuStrecke(punkte[i], punkte[j], m);
//             if (d < minAbstand) {
//                 minAbstand = d;
//                 minIndex = i;
//             }

//             // console.log("" + i + ": (" + punkte[i].x + "," + punkte[i].y + ")->(" + punkte[j].x + "," + punkte[j].y + "): " + d);
//         }
//     }
//     let i2 = (minIndex + 1) % punkte.length;

//     // let v = {x: punkte[i2].x - punkte[minIndex].x, y: punkte[i2].y - punkte[minIndex].y};
//     let am = { x: m.x - punkte[minIndex].x, y: m.y - punkte[minIndex].y };

//     let n = {
//         y: punkte[i2].x - punkte[minIndex].x,
//         x: -(punkte[i2].y - punkte[minIndex].y)
//     };

//     let sp = skalarprodukt(n, am);
//     if (sp > 0) {
//         return n;
//     } else {
//         return { x: -n.x, y: -n.y };
//     }

// }

// export function normalenvektorBeiImpactAufKreis(punkte: Punkt[], k: Kreis): Punkt {

//     let schnittpunkte = [];
//     let m = k.getMitte();
//     let r = k.getRadius();

//     for (let i = 0; i < punkte.length; i++) {
//         let j = (i + 1) % punkte.length;
//         schnittpunkteKreisStrecke(m, r, punkte[i], punkte[j], schnittpunkte);
//     }

//     if (schnittpunkte.length == 0) {
//         return {
//             x: punkte[0].x - m.x, y: punkte[0].y - m.y
//         }
//     }

//     let schwerpunkt = { x: 0, y: 0 };
//     for (let p of schnittpunkte) {
//         schwerpunkt.x += p.x;
//         schwerpunkt.y += p.y;
//     }
//     schwerpunkt.x /= punkte.length;
//     schwerpunkt.y /= punkte.length;

//     return {
//         x: schwerpunkt.x - m.x,
//         y: schwerpunkt.y - m.y
//     }

// }

export function skalarprodukt(v1: Punkt, v2: Punkt) {
    return v1.x * v2.x + v1.y * v2.y;
}


export function zufall(von: number, bis: number){
    return Math.random()*(bis - von) + von;
}

export function intZufall(von: number, bis: number){
    return Math.floor(Math.random()*(bis - von + 1) + von);
}

export function vektorVonPolarkoordinaten(winkelGrad: number, länge: number){
    let winkel = winkelGrad/180*Math.PI;
    return {
        x: länge * Math.cos(winkel),
        y: länge * Math.sin(winkel)
    }
}

export function farbeAusRGB(rot: number, grün: number, blau: number):number{
    return blau + 256 * (rot + 256 * grün);
}