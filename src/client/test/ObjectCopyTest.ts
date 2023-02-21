import jQuery from 'jquery';

jQuery(() => {
    let t: Test = new Test();
    t.list.push(new E(10));
    t.w = "Eins";
    console.log(t);

    let t1: Test = Object.create(t);
    console.log(t1);
    console.log(t1.w);
    t1.w = "Zwei";
    console.log(t1.w);
    console.log(t1.printW());
});



class Test {

    list: E[] = [];
    w: string;

    constructor(){

    }

    toString(): string {
        return this.list.toString();
    }

    printW(): string {
        return this.w;
    }

}

class E {
    constructor(public a: number){

    }

    toString(): string {
        return "" + this.a;
    }
}