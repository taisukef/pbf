import { protobuf } from "https://js.sabae.cc/protobuf-es.js";
import { Pbf } from "../Pbf.js";
import { Tile } from "./vector_tile.js";

/*
const pbfReadTile = Tile.read;
const pbfWriteTile = Tile.write;
*/
const data = await Deno.readFile('../test/fixtures/12665.vector.pbf');
//    suite = new Benchmark.Suite(),
//    ProtocolBuffersTile = protocolBuffers(fs.readFileSync(path.resolve(__dirname, 'vector_tile.proto'))).Tile,

/*
protobuf.load('vector_tile.proto', (err, res) => {
    const tile = res.lookup('vector_tile.Tile');
    const decoded = tile.decode(data);
    console.log("decode", decoded);
});
*/
const pbfTile = Tile.read(new Pbf(data));
console.log(pbfTile);
const tileJSON = JSON.stringify(pbfTile);
//console.log(tileJSON);

/*
//    protocolBuffersTile = ProtocolBuffersTile.decode(data),

suite
    .add('decode vector tile with pbf', function() {
        pbfReadTile(new Pbf(data));
    })
    .add('encode vector tile with pbf', function() {
        var pbf = new Pbf();
        pbfWriteTile(pbfTile, pbf);
        pbf.finish();
    })
    .add('decode vector tile with protocol-buffers', function() {
        ProtocolBuffersTile.decode(data);
    })
    .add('encode vector tile with protocol-buffers', function() {
        ProtocolBuffersTile.encode(protocolBuffersTile);
    })
    .add('decode vector tile with protobuf.js', function() {
        ProtobufjsTile.decode(data);
    })
    .add('encode vector tile with protobuf.js', function() {
        ProtobufjsTile.encode(protobufjsTile);
    })
    .add('JSON.parse vector tile', function() {
        JSON.parse(tileJSON);
    })
    .add('JSON.stringify vector tile', function() {
        JSON.stringify(pbfTile);
    })
    .on('cycle', function(event) {
        console.log(String(event.target));
    })
    .run();
*/
