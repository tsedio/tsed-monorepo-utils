import Table from "cli-table3";
import {getNpmPackageTrustStatus} from "../../utils/packages/trustedPublishing.js";

export class PackagesCmd {
  mapContext(commander) {
    return {type: commander.type};
  }

  getTasks(context) {
    return [
      {
        title: "List package publication and trusted publishing status",
        enabled: () => context.type === "status",
        task: async () => {
          const statuses = await getNpmPackageTrustStatus(context);
          const table = new Table({head: ["Package", "Status"]});

          statuses.forEach(({pkg, status}) => table.push([pkg.pkg.name, status]));
          context.logger.info(`\n${table.toString()}`);
        }
      }
    ];
  }
}
