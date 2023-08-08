import { DecimalFormat } from "../tools/DecimalFormat.js";

let df = new DecimalFormat();

let a = 123.456;
console.log(a, df.format(a));
