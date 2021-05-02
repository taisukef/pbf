import { Pbf } from "../Pbf.js";
import { Tile } from "./vector_tile.js";

const data = await Deno.readFile('../test/fixtures/12665.vector.pbf');
const pbfTile = Tile.read(new Pbf(data));
console.log(pbfTile);
const tileJSON = JSON.stringify(pbfTile);
await Deno.writeTextFile("test-pbf.json", tileJSON);
