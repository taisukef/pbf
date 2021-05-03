import { Pbf } from "https://taisukef.github.io/pbf/Pbf.js";
import { Tile } from "https://taisukef.github.io/pbf/bench/vector_tile.js";

const url = "https://cyberjapandata.gsi.go.jp/xyz/experimental_bvmap/6/57/25.pbf";
const data = await (await fetch(url)).arrayBuffer();
const tile = Tile.read(new Pbf(data));
console.log(tile);
