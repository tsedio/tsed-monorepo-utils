import {build} from "../../tasks/build.js";

export class BuildCmd {
  getTasks(context) {
    return [...build(context)];
  }
}
