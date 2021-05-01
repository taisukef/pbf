import { Pbf } from "./Pbf.js";
var pbf = new Pbf(await Deno.readFile('1.pbf'));
console.log(pbf);
var result = pbf.readFields(readData, {})
console.log(result);

function readData(tag, data, pbf) {
    console.log("readData", tag);
    if (tag === 1) data.name = pbf.readString();
    else if (tag === 2) data.version = pbf.readVarint();
    else if (tag === 3) data.layer = pbf.readMessage(readLayer, {});
}
function readLayer(tag, layer, pbf) {
    console.log("readLayer", tag);
    if (tag === 1) layer.name = pbf.readString();
    else if (tag === 3) layer.size = pbf.readVarint();
}
