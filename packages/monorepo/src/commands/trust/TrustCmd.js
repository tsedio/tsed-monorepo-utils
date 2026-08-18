import {
  assertNoUnpublishedNpmPackages,
  bootstrapTrustedPackages,
  getUnpublishedNpmPackages,
  migrateTrustedPackages
} from "../../utils/packages/trustedPublishing.js";

export class TrustCmd {
  mapContext(commander) {
    return {
      type: commander.type,
      trustedPublishingRepository: commander.repository,
      trustedPublishingWorkflow: commander.file
    };
  }

  getTasks(context) {
    return [
      {
        title: "List unpublished npm packages",
        enabled: () => context.type === "list",
        task: async () => {
          const packages = await getUnpublishedNpmPackages(context);
          packages.forEach(({pkg}) => context.logger.info(pkg.name));
        }
      },
      {
        title: "Bootstrap npm packages and configure trusted publishing",
        enabled: () => context.type === "bootstrap",
        task: () => bootstrapTrustedPackages(context)
      },
      {
        title: "Configure trusted publishing for existing npm packages",
        enabled: () => context.type === "migrate",
        task: () => migrateTrustedPackages(context)
      },
      {
        title: "Verify all npm packages have been published",
        enabled: () => context.type === "verify",
        task: () => assertNoUnpublishedNpmPackages(context)
      }
    ];
  }
}
