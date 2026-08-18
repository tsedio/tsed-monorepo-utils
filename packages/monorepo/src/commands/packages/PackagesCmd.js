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
          statuses.forEach(({pkg, status}) => context.logger.info(`${pkg.pkg.name}: ${status}`));
        }
      }
    ];
  }
}
