import { protobuf } from "https://taisukef.github.io/protobuf-es.js/dist/protobuf-es.js";

const data = await Deno.readFile('../test/fixtures/12665.vector.pbf');
protobuf.load('vector_tile.proto', async (err, res) => {
    const tile = res.lookup('vector_tile.Tile');
    const decoded = tile.decode(data);
    console.log("decode", decoded);
    const tileJSON = JSON.stringify(decoded);
    await Deno.writeTextFile("test-protobuf.json", tileJSON);
});
