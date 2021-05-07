import * as t from "https://deno.land/std/testing/asserts.ts";
import { resolve } from "https://taisukef.github.io/resolve-protobuf-schema-deno/index.js";
import { Pbf } from "../Pbf.js";
import { compile } from "../compile.js";
import { parseURL } from "https://code4sabae.github.io/js/parseURL.js";
const { dirname } = parseURL(import.meta.url);

const path = {
    join(dir, fn) {
        return dir + fn;
    }
};

Deno.test('compiles vector tile proto', async () => {
    var proto = await resolve(path.join(dirname, '../bench/vector_tile.proto'));
    var tileBuf = Deno.readFileSync(path.join(dirname, 'fixtures/12665.vector.pbf'));
    var Tile = compile(proto).Tile;
    
    var tile = Tile.read(new Pbf(tileBuf));
    t.assertEquals(tile.layers.length, 11);

    var pbf = new Pbf();
    Tile.write(tile, pbf);
    var buf = pbf.finish();
    t.assertEquals(buf.length, 124946);
});

Deno.test('compiles proto with embedded type reference', async () => {
    var proto = await resolve(path.join(dirname, './fixtures/embedded_type.proto'));
    compile(proto);

});

Deno.test('compiles packed proto', async () => {
    var proto = await resolve(path.join(dirname, './fixtures/packed.proto'));
    var NotPacked = compile(proto).NotPacked;
    var FalsePacked = compile(proto).FalsePacked;

    var original = {
        types: [0, 1, 0, 1],
        value: [300, 400, 500]
    };
    var pbf = new Pbf();
    NotPacked.write(original, pbf);
    var buf = pbf.finish();

    var decompressed = FalsePacked.read(new Pbf(buf));
    t.assertEquals(buf.length, 17);
    t.assertEquals(original, decompressed);

});

Deno.test('reads packed with unpacked field', async () => {
    var proto = await resolve(path.join(dirname, './fixtures/packed.proto'));
    var Packed = compile(proto).Packed;
    var FalsePacked = compile(proto).FalsePacked;

    var original = {
        types: [0, 1, 0, 1],
        value: [300, 400, 500]
    };
    var pbf = new Pbf();
    Packed.write(original, pbf);
    var buf = pbf.finish();

    var decompressed = FalsePacked.read(new Pbf(buf));
    t.assertEquals(buf.length, 14);
    t.assertEquals(original, decompressed);

});

Deno.test('compiles packed proto3', async () => {
    var proto = await resolve(path.join(dirname, './fixtures/packed_proto3.proto'));
    var NotPacked = compile(proto).NotPacked;
    var FalsePacked = compile(proto).FalsePacked;

    var original = {
        types: [0, 1, 0, 1],
        value: [300, 400, 500]
    };
    var pbf = new Pbf();
    FalsePacked.write(original, pbf);
    var falsePackedBuf = pbf.finish();

    pbf = new Pbf();
    NotPacked.write(original, pbf);
    var notPackedBuf = pbf.finish();

    var decompressed = NotPacked.read(new Pbf(falsePackedBuf));
    t.assertEquals(original, decompressed);
    t.assertEquals(notPackedBuf.length, 14);
    t.assert(falsePackedBuf.length > notPackedBuf.length, 'Did not respect [packed=false]');

});

Deno.test('compiles packed with multi-byte tags', async () => {
    var proto = await resolve(path.join(dirname, './fixtures/packed_proto3.proto'));
    var Packed = compile(proto).Packed;

    var original = {
        value: [300, 400, 500]
    };
    var pbf = new Pbf();
    Packed.write(original, pbf);
    var buf = pbf.finish();

    var decompressed = Packed.read(new Pbf(buf));
    t.assertEquals(buf.length, 9);
    t.assertEquals(original, decompressed);

});

Deno.test('compiles defaults', async () => {
    var proto = await resolve(path.join(dirname, './fixtures/defaults.proto'));
    var Envelope = compile(proto).Envelope;
    var pbf = new Pbf();

    Envelope.write({}, pbf);

    var buf = pbf.finish();
    var data = Envelope.read(new Pbf(buf));

    t.assertEquals(buf.length, 0);
    t.assertEquals(data, {
        type: {
            options: {},
            value: 1
        },
        name: 'test',
        flag: true,
        weight: 1.5,
        id: 1
    });

});

Deno.test('compiles proto3 ignoring defaults', async () => {
    var proto = await resolve(path.join(dirname, './fixtures/defaults_proto3.proto'));
    var Envelope = compile(proto).Envelope;
    var pbf = new Pbf();

    Envelope.write({}, pbf);

    var buf = pbf.finish();
    var data = Envelope.read(new Pbf(buf));

    t.assertEquals(buf.length, 0);

    t.assertEquals(data.type, 0);
    t.assertEquals(data.name, '');
    t.assertEquals(data.flag, false);
    t.assertEquals(data.weight, 0);
    t.assertEquals(data.id, 0);

});

Deno.test('compiles maps', async () => {
    var proto = await resolve(path.join(dirname, './fixtures/map.proto'));
    var Envelope = compile(proto).Envelope;

    var original = {
        kv : {
            a: 'value a',
            b: 'value b'
        },
        kn : {
            a : 1,
            b : 2
        }
    };

    var pbf = new Pbf();
    Envelope.write(original, pbf);
    var buf = pbf.finish();

    var decompressed = Envelope.read(new Pbf(buf));

    t.assertEquals(original, decompressed);

});

Deno.test('does not write undefined or null values', async () => {
    var proto = await resolve(path.join(dirname, './fixtures/embedded_type.proto'));
    var EmbeddedType = compile(proto).EmbeddedType;
    var pbf = new Pbf();

    EmbeddedType.write({}, pbf);

    EmbeddedType.write({
        'sub_field': null
    }, pbf);

    EmbeddedType.write({
        value: null
    });

});

Deno.test('handles all implicit default values', async () => {
    var proto = await resolve(path.join(dirname, './fixtures/defaults_implicit.proto'));
    var Envelope = compile(proto).Envelope;
    var pbf = new Pbf();

    Envelope.write({}, pbf);
    var buf = pbf.finish();
    var data = Envelope.read(new Pbf(buf));

    t.assertEquals(buf.length, 0);

    t.assertEquals(data.type, 0);
    t.assertEquals(data.name, '');
    t.assertEquals(data.flag, false);
    t.assertEquals(data.weight, 0);
    t.assertEquals(data.id, 0);
    t.assertEquals(data.tags, []);
    t.assertEquals(data.numbers, []);
    t.assertEquals(data.bytes, undefined);
    t.assertEquals(data.custom, undefined);
    t.assertEquals(data.types, []);

});

Deno.test('sets oneof field name', async () => {
    var proto = await resolve(path.join(dirname, './fixtures/oneof.proto'));
    var Envelope = compile(proto).Envelope;
    var pbf = new Pbf();

    Envelope.write({}, pbf);
    var data = Envelope.read(new Pbf(pbf.finish()));

    t.assertEquals(data.value, undefined);
    t.assertEquals(data.id, 0);

    pbf = new Pbf();
    Envelope.write({
        float: 1.5
    }, pbf);
    data = Envelope.read(new Pbf(pbf.finish()));

    t.assertEquals(data.value, 'float');
    t.assertEquals(data[data.value], 1.5);

});

Deno.test('handles jstype=JS_STRING', async () => {
    var proto = await resolve(path.join(dirname, './fixtures/type_string.proto'));
    var TypeString = compile(proto).TypeString;
    var TypeNotString = compile(proto).TypeNotString;
    var pbf = new Pbf();

    TypeString.write({
        int: '-5',
        long: '10000',
        boolVal: true,
        float: '12',
    }, pbf);

    var buf = pbf.finish();
    var data = TypeString.read(new Pbf(buf));

    t.assertEquals(data.int, '-5');
    t.assertEquals(data.long, '10000');
    t.assertEquals(data.boolVal, true);
    t.assertEquals(data.float, '12');
    t.assertEquals(data.default_implicit, '0');
    t.assertEquals(data.default_explicit, '42');

    data = TypeNotString.read(new Pbf(buf));
    t.assertEquals(data.int, -5);
    t.assertEquals(data.long, 10000);
    t.assertEquals(data.boolVal, true);
    t.assertEquals(data.float, 12);

});

Deno.test('handles negative varint', async () => {
    var proto = await resolve(path.join(dirname, './fixtures/varint.proto'));
    var Envelope = compile(proto).Envelope;
    var pbf = new Pbf();

    Envelope.write({
        int: -5,
        long: -10
    }, pbf);

    var buf = pbf.finish();
    var data = Envelope.read(new Pbf(buf));

    t.assertEquals(data.int, -5);
    t.assertEquals(data.long, -10);

});

Deno.test('handles unsigned varint', async () => {
    var proto = await resolve(path.join(dirname, './fixtures/varint.proto'));
    var Envelope = compile(proto).Envelope;
    var pbf = new Pbf();

    Envelope.write({
        uint: Math.pow(2, 31),
        ulong: Math.pow(2, 63)
    }, pbf);

    var buf = pbf.finish();
    var data = Envelope.read(new Pbf(buf));

    t.assertEquals(data.uint, Math.pow(2, 31));
    t.assertEquals(data.ulong, Math.pow(2, 63));

});
