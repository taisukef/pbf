import { Pbf } from "https://taisukef.github.io/pbf/Pbf.js";
import { Tile } from "https://taisukef.github.io/pbf/bench/vector_tile.js";

const data = await (await fetch('https://taisukef.github.io/pbf/test/fixtures/12665.vector.pbf')).arrayBuffer();
const tile = Tile.read(new Pbf(data));
console.log(tile);
