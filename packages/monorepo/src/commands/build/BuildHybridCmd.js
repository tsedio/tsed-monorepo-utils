import {buildHybridPackage} from "../../utils/packages/buildHybridPackages.js";

export class BuildHybridCmd {
  getTasks(context) {
    return [
      {
        task() {
          return buildHybridPackage(process.cwd(), null, context);
        }
      }
    ];
  }
}
