import p5 from "p5";


let sketch = (p5: p5) => {

    let gray: number = 0;

    p5.setup = function () {
        p5.createCanvas(400, 400);
    };

    p5.draw = function () {
        p5.background(gray);
        p5.rect(p5.width / 2, p5.height / 2, 50, 50);
    };

    p5.mousePressed = function () {
        gray += 10;
    };
}


window.onload = function() {
let node: HTMLElement = $('#test')[0];
let p5o = new p5(sketch, node);
  //p5o.remove();
  
}
