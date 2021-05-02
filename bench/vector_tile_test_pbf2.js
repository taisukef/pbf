import { Pbf } from "../Pbf.js";
import { Tile } from "./vector_tile.js";

const read = async (name) => {
    const data = await Deno.readFile(name + ".pbf");
    const pbfTile = Tile.read(new Pbf(data));
    console.log(pbfTile);
    const tileJSON = JSON.stringify(pbfTile);
    await Deno.writeTextFile(name + ".json", tileJSON);
};
read("osm-6-56-25");
read("gsi-6-56-25");
