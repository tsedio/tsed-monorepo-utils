import path from "node:path";
import {test} from "./test";

const rootDir = path.join(__dirname, "..");

console.log(test(rootDir));
