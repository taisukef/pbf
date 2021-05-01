import { Pbf } from "./Pbf.js";

const t = {
    equal(n1, n2) {
        if (n1 != n2) {
            throw "not match!";
        }
    },
    end() {
        console.log("test complete!");
    }
};

const buf = new Pbf();
const bigNum1 = Math.pow(2, 60);
const bigNum2 = Math.pow(2, 63);
buf.writeVarint(bigNum1);
buf.writeVarint(bigNum2);
buf.finish();
t.equal(buf.readVarint(), bigNum1);
t.equal(buf.readVarint(), bigNum2);
t.end();
