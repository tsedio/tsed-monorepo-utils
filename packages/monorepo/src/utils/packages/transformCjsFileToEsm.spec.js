import {transformCjsFileToEsm} from "./transformCjsFileToEsm.js";
import {join} from "path";

await transformCjsFileToEsm(join(import.meta.dirname, "./__mock__"), {silent: true, out: true});
