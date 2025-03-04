import * as t from "https://deno.land/std/testing/asserts.ts";
import { Pbf } from "../Pbf.js";
import { ieee754 } from "https://taisukef.github.io/ieee754/ieee754.js";
import { parseURL } from "https://code4sabae.github.io/js/parseURL.js";
const { dirname } = parseURL(import.meta.url);

const assertEquals2 = (a, b) => {
    if (typeof a == "number" && typeof b == "number") {
        if (a === 0 && b === -0) {
            t.assertEquals(a, -b);
            return;
        } else if (a === -0 && b === 0) {
            t.assertEquals(-a, b);
            return;
        }
    }
    t.assertEquals(a, b);
};

const writeFloatLE = (buf, val, pos) => {
    ieee754.write(buf, val, pos, true, 23, 4);
};
const writeDoubleLE = (buf, val, pos) => {
    ieee754.write(buf, val, pos, true, 52, 8)
};
const writeUInt32LE = (buf, val, pos) => {
    const b = Uint32Array.from([val]);
    const bin = new Uint8Array(b.buffer);
    for (let i = 0; i < 4; i++) {
        buf[pos + i] = bin[i];
    }
};
const writeInt32LE = (buf, val, pos) => {
    const b = new Int32Array([val]);
    const bin = new Uint8Array(b.buffer);
    for (let i = 0; i < 4; i++) {
        buf[pos + i] = bin[i];
    }
};

/*eslint comma-spacing: 0*/

function toArray(buf) {
    var arr = [];
    for (var i = 0; i < buf.length; i++) {
        arr.push(buf[i]);
    }
    return arr;
}

Deno.test('initialization', () => {
    var buf = new Pbf(new Uint8Array([]));
    buf.destroy();
});

Deno.test('realloc', () => {
    var buf = new Pbf(new Uint8Array([]));
    buf.realloc(5);
    t.assert(buf.length >= 5);
    buf.realloc(25);
    t.assert(buf.length >= 30);
});

var testNumbers = [1,0,0,4,14,23,40,86,127,141,113,925,258,1105,1291,6872,12545,16256,65521,126522,133028,444205,
    846327,1883372, 2080768, 266338304, 34091302912, 17179869184,
    3716678,674158,15203102,27135056,42501689,110263473,6449928,65474499,943840723,1552431153,407193337,2193544970,
    8167778088,5502125480,14014009728,56371207648,9459068416,410595966336,673736830976,502662539776,2654996269056,
    5508583663616,6862782705664,34717688324096,1074895093760,95806297440256,130518477701120,197679237955584,
    301300890730496,1310140661760000,2883205519638528,2690669862715392,3319292539961344];

Deno.test('readVarint & writeVarint', () => {
    var buf = new Pbf(new Uint8Array(0));

    for (var i = 0; i < testNumbers.length; i++) {
        buf.writeVarint(testNumbers[i]);
        buf.writeVarint(-testNumbers[i]);
    }
    var len = buf.finish().length;
    t.assertEquals(len, 841);
    buf.finish();

    i = 0;
    while (buf.pos < len) {
        t.assertEquals(buf.readVarint(), testNumbers[i]);
        assertEquals2(buf.readVarint(true), -testNumbers[i++]);
    }

});

Deno.test('writeVarint writes 0 for NaN', () => {
    var buf = new Uint8Array(16);
    var pbf = new Pbf(buf);

    // Initialize Uint8Array to ensure consistent tests
    //buf.write('0123456789abcdef', 0);
    const s = '0123456789abcdef';
    for (let i = 0; i < s.length; i++) {
        buf[i] = s.charCodeAt(i);
    }

    pbf.writeVarint('not a number');
    pbf.writeVarint(NaN);
    pbf.writeVarint(50);
    pbf.finish();

    t.assertEquals(pbf.readVarint(), 0);
    t.assertEquals(pbf.readVarint(), 0);
    t.assertEquals(pbf.readVarint(), 50);

});

Deno.test('readVarint signed', () => {
    var bytes = [0xc8,0xe8,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0x01];
    var buf = new Pbf(new Uint8Array(bytes));
    t.assertEquals(buf.readVarint(true), -3000);

    bytes = [0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0x01];
    buf = new Pbf(new Uint8Array(bytes));
    t.assertEquals(buf.readVarint(true), -1);

    bytes = [0xc8,0x01];
    buf = new Pbf(new Uint8Array(bytes));
    t.assertEquals(buf.readVarint(true), 200);

});

Deno.test('readVarint64 (compatibility)', () => {
    var bytes = [0xc8,0xe8,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0x01];
    var buf = new Pbf(new Uint8Array(bytes));
    t.assertEquals(buf.readVarint64(), -3000);
});

Deno.test('readVarint & writeVarint handle really big numbers', () => {
    var buf = new Pbf();
    var bigNum1 = Math.pow(2, 60);
    var bigNum2 = Math.pow(2, 63);
    buf.writeVarint(bigNum1);
    buf.writeVarint(bigNum2);
    buf.finish();
    t.assertEquals(buf.readVarint(), bigNum1);
    t.assertEquals(buf.readVarint(), bigNum2);
});

var testSigned = [0,1,2,0,2,-1,11,18,-17,145,369,891,-1859,-798,2780,-13107,12589,-16433,21140,148023,221062,-985141,
    494812,-2121059,-2078871,82483,19219191,29094607,35779553,-215357075,-334572816,-991453240,-1677041436,-3781260558,
    -6633052788,1049995056,-22854591776,37921771616,-136983944384,187687841024,107420097536,1069000079360,1234936065024,
    -2861223108608,-492686688256,-6740322942976,-7061359607808,24638679941120,19583051038720,83969719009280,
    52578722775040,416482297118720,1981092523409408,-389256637841408];

Deno.test('readSVarint & writeSVarint', () => {
    var buf = new Pbf(new Uint8Array(0));

    for (var i = 0; i < testSigned.length; i++) {
        buf.writeSVarint(testSigned[i]);
    }
    var len = buf.finish().length;
    t.assertEquals(len, 224);
    buf.finish();

    i = 0;
    while (buf.pos < len) {
        t.assertEquals(buf.readSVarint(), testSigned[i++]);
    }

});

Deno.test('writeVarint throws error on a number that is too big', () => {
    var buf = new Pbf(new Uint8Array(0));

    t.assertThrows(function() {
        buf.writeVarint(29234322996241367000012);
    });

    t.assertThrows(function() {
        buf.writeVarint(-29234322996241367000012);
    });

});

Deno.test('readVarint throws error on a number that is longer than 10 bytes', () => {
    var buf = new Pbf(new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]));
    t.assertThrows(function() {
        buf.readVarint();
    });
});

Deno.test('readBoolean & writeBoolean', () => {
    var buf = new Pbf();
    buf.writeBoolean(true);
    buf.writeBoolean(false);
    buf.finish();
    t.assertEquals(buf.readBoolean(), true);
    t.assertEquals(buf.readBoolean(), false);
});

Deno.test('readBytes', () => {
    var buf = new Pbf([8, 1, 2, 3, 4, 5, 6, 7, 8]);
    t.assertEquals(toArray(buf.readBytes()), [1, 2, 3, 4, 5, 6, 7, 8]);
});

Deno.test('writeBytes', () => {
    var buf = new Pbf();
    buf.writeBytes([1, 2, 3, 4, 5, 6, 7, 8]);
    var bytes = buf.finish();
    t.assertEquals(toArray(bytes), [8, 1, 2, 3, 4, 5, 6, 7, 8]);
});

Deno.test('readDouble', () => {
    var buffer = new Uint8Array(8);
    writeDoubleLE(buffer, 12345.6789012345, 0);
    var buf = new Pbf(buffer);
    t.assertEquals(Math.round(buf.readDouble() * 1e10) / 1e10, 12345.6789012345);
});

Deno.test('readPacked and writePacked', () => {
    var testNumbers2 = testNumbers.slice(0, 10);

    function testPacked(type) {
        var buf = new Pbf();
        buf['writePacked' + type](1, testNumbers2);
        buf.finish();
        buf.readFields(function readField(tag) {
            var arr = [];
            buf['readPacked' + type](arr);
            if (tag === 1) t.assertEquals(arr, testNumbers2, 'packed ' + type);
            else t.fail('wrong tag encountered: ' + tag);
        });
    }

    function testUnpacked(type) {
        var buf = new Pbf();
        var arr = [];

        testNumbers2.forEach(function(n) {
            buf['write' + type + 'Field'](1, n);
        });

        buf.finish();
        buf.readFields(function readField() {
            buf['readPacked' + type](arr);
        });

        t.assertEquals(arr, testNumbers2, 'packed ' + type);
    }

    ['Varint', 'SVarint', 'Float', 'Double', 'Fixed32', 'SFixed32', 'Fixed64', 'SFixed64'].forEach(function(type) {
        testPacked(type);
        testUnpacked(type);
    });

    var buf = new Pbf();
    buf.writePackedBoolean(1, testNumbers2);
    buf.finish();
    buf.readFields(function readField(tag) {
        var arr = [];
        buf.readPackedBoolean(arr);
        if (tag === 1) t.assertEquals(arr,
            [true, false, false, true, true, true, true, true, true, true], 'packed Boolean');
        else t.fail('wrong tag encountered: ' + tag);
    });

});

Deno.test('writePacked skips empty arrays', () => {
    var buf = new Pbf();
    buf.writePackedBoolean(1, []);
    t.assertEquals(buf.length, 0);
});

Deno.test('writeDouble', () => {
    var buf = new Pbf(new Uint8Array(8));
    buf.writeDouble(12345.6789012345);
    buf.finish();
    t.assertEquals(Math.round(buf.readDouble() * 1e10) / 1e10, 12345.6789012345);
});

Deno.test('readFloat', () => {
    var buffer = new Uint8Array(4);
    writeFloatLE(buffer, 123.456, 0);
    var buf = new Pbf(buffer);
    t.assertEquals(Math.round(1000 * buf.readFloat()) / 1000, 123.456);
});

Deno.test('writeFloat', () => {
    var buf = new Pbf(new Uint8Array(4));
    buf.writeFloat(123.456);
    buf.finish();
    t.assertEquals(Math.round(1000 * buf.readFloat()) / 1000, 123.456);
});

Deno.test('readFixed32', () => {
    var buffer = new Uint8Array(16);
    writeUInt32LE(buffer, 42, 0);
    writeUInt32LE(buffer, 24, 4);
    var buf = new Pbf(buffer);
    t.assertEquals(buf.readFixed32(), 42);
    t.assertEquals(buf.readFixed32(), 24);
});

Deno.test('writeFixed32', () => {
    var buf = new Pbf(new Uint8Array(16));
    buf.writeFixed32(42);
    buf.writeFixed32(24);
    buf.finish();
    t.assertEquals(buf.readFixed32(), 42);
    t.assertEquals(buf.readFixed32(), 24);
});

Deno.test('readFixed64', () => {
    var buf = new Pbf(new Uint8Array(8));
    buf.writeFixed64(102451124123);
    buf.finish();
    t.assertEquals(buf.readFixed64(), 102451124123);
});

Deno.test('writeFixed64', () => {
    var buf = new Pbf(new Uint8Array(8));
    buf.writeFixed64(102451124123);
    t.assertEquals(toArray(buf.buf), [155,23,144,218,23,0,0,0]);
});

Deno.test('readSFixed32', () => {
    var buffer = new Uint8Array(16);
    writeInt32LE(buffer, 4223, 0);
    writeInt32LE(buffer, -1231, 4);
    var buf = new Pbf(buffer);
    t.assertEquals(buf.readSFixed32(), 4223);
    t.assertEquals(buf.readSFixed32(), -1231);
});

Deno.test('writeSFixed32', () => {
    var buf = new Pbf(new Uint8Array(16));
    buf.writeSFixed32(4223);
    buf.writeSFixed32(-1231);
    buf.finish();
    t.assertEquals(buf.readSFixed32(), 4223);
    t.assertEquals(buf.readSFixed32(), -1231);
});

Deno.test('readSFixed64', () => {
    var buf = new Pbf(new Uint8Array(8));
    buf.writeSFixed64(-102451124123);
    buf.finish();
    t.assertEquals(buf.readSFixed64(), -102451124123);
});

Deno.test('writeSFixed64', () => {
    var buf = new Pbf(new Uint8Array(8));
    buf.writeSFixed64(-102451124123);
    t.assertEquals(toArray(buf.buf), [101,232,111,37,232,255,255,255]);
});

Deno.test('writeString & readString', () => {
    var buf = new Pbf();
    buf.writeString('Привет 李小龙');
    var bytes = buf.finish();
    t.assertEquals(bytes, new Uint8Array([22, 208,159,209,128,208,184,208,178,208,181,209,130,32,230,157,142,229,176,143,233,190,153]));
    t.assertEquals(buf.readString(), 'Привет 李小龙');
});

Deno.test('writeString & readString longer', () => {
    var str = '{"Feature":"http://example.com/vocab#Feature","datetime":{"@id":"http://www.w3.org/2006/time#inXSDDateTime","@type":"http://www.w3.org/2001/XMLSchema#dateTime"},"when":"http://example.com/vocab#when"}';
    var buf = new Pbf();
    buf.writeString(str);
    buf.finish();
    t.assertEquals(buf.readString(), str);
});

Deno.test('more complicated utf8', () => {
    var buf = new Pbf();
    // crazy test from github.com/mathiasbynens/utf8.js
    var str = '\uDC00\uDC00\uDC00\uDC00A\uDC00\uD834\uDF06\uDC00\uDEEE\uDFFF\uD800\uDC00\uD800\uD800\uD800\uD800A' +
        '\uD800\uD834\uDF06';
    buf.writeString(str);
    buf.finish();
    var str2 = buf.readString();
    t.assertEquals(new Uint8Array(str2), new Uint8Array(str));
});

Deno.test('readFields', () => {
    const buf = new Pbf(Deno.readFileSync(dirname + './fixtures/12665.vector.pbf'));
    var layerOffsets = [],
        foo = {}, res, res2, buf2;

    res2 = buf.readFields(function(tag, result, buf) {
        if (tag === 3) layerOffsets.push(buf.pos);
        res = result;
        buf2 = buf;
    }, foo);

    t.assertEquals(res, foo);
    t.assertEquals(res2, foo);
    t.assertEquals(buf2, buf);

    t.assert(buf.pos >= buf.length);
    t.assertEquals(layerOffsets, [1,2490,2581,2819,47298,47626,55732,56022,56456,88178,112554]);

});

Deno.test('readMessage', () => {
    const buf = new Pbf(Deno.readFileSync(dirname + './fixtures/12665.vector.pbf'));
    const layerNames = [];
    const foo = {};

    buf.readFields(function(tag) {
        if (tag === 3) buf.readMessage(readLayer, foo);
    }, foo);

    function readLayer(tag) {
        if (tag === 1) layerNames.push(buf.readString());
    }

    t.assertEquals(layerNames, ['landuse','water','barrier_line','building','tunnel','road',
        'place_label','water_label','poi_label','road_label','housenum_label']);

});

Deno.test('field writing methods', () => {
    var buf = new Pbf();
    buf.writeFixed32Field(1, 100);
    buf.writeFixed64Field(2, 200);
    buf.writeVarintField(3, 1234);
    buf.writeSVarintField(4, -599);
    buf.writeStringField(5, 'Hello world');
    buf.writeFloatField(6, 123);
    buf.writeDoubleField(7, 123);
    buf.writeBooleanField(8, true);
    buf.writeBytesField(9, [1, 2, 3]);
    buf.writeMessage(10, function() {
        buf.writeBooleanField(1, true);
        buf.writePackedVarint(2, testNumbers);
    });

    buf.writeSFixed32Field(11, -123);
    buf.writeSFixed64Field(12, -256);

    buf.finish();

    buf.readFields(function(tag) {
        if (tag === 1) buf.readFixed32();
        else if (tag === 2) buf.readFixed64();
        else if (tag === 3) buf.readVarint();
        else if (tag === 4) buf.readSVarint();
        else if (tag === 5) buf.readString();
        else if (tag === 6) buf.readFloat();
        else if (tag === 7) buf.readDouble();
        else if (tag === 8) buf.readBoolean();
        else if (tag === 9) buf.readBytes();
        else if (tag === 10) buf.readMessage(function() { /* skip */ });
        else if (tag === 11) buf.readSFixed32();
        else if (tag === 12) buf.readSFixed64();
        else t.fail('unknown tag');
    });
});

Deno.test('skip', () => {
    var buf = new Pbf();
    buf.writeFixed32Field(1, 100);
    buf.writeFixed64Field(2, 200);
    buf.writeVarintField(3, 1234);
    buf.writeStringField(4, 'Hello world');
    buf.finish();

    buf.readFields(function() { /* skip */ });

    t.assertEquals(buf.pos, buf.length);

    t.assertThrows(function() {
        buf.skip(6);
    });
});

Deno.test('write a raw message > 0x10000000', () => {
    var buf = new Pbf();
    var marker = 0xdeadbeef;
    var encodedMarker = new Uint8Array([0xef, 0xbe, 0xad, 0xde]);
    var markerSize = encodedMarker.length;
    var rawMessageSize = 0x10000004;
    var encodedSize = new Uint8Array([0x84, 0x80, 0x80,0x80, 0x01]);

    buf.writeRawMessage(function(_obj, pbf) {
        // Repeatedly fill with the marker until it reaches the size target.
        var n = rawMessageSize / markerSize;
        for (var i = 0; i < n; i++) {
            pbf.writeFixed32(marker);
        }
    }, null);

    var bytes = buf.finish();
    t.assertEquals(bytes.length, rawMessageSize + encodedSize.length);

    // The encoded size in varint should go first
    t.assertEquals(bytes.subarray(0, encodedSize.length), encodedSize);

    // Then the message itself. Verify that the first few bytes match the marker.
    t.assertEquals(bytes.subarray(encodedSize.length, encodedSize.length + markerSize), encodedMarker);

});
