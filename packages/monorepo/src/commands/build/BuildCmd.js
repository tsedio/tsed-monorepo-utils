import {build} from "../../tasks/build";

export class BuildCmd {
  getTasks(context) {
    return [...build(context)];
  }
}
