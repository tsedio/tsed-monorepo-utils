import {
  assertNoUnpublishedNpmPackages,
  bootstrapTrustedPackages,
  getUnpublishedNpmPackages,
  migrateTrustedPackages
} from "../../utils/packages/trustedPublishing.js";
import {globSync} from "../../utils/common/glob.js";
import {basename} from "path";

export class TrustCmd {
  mapContext(commander) {
    return {
      type: commander.type,
      trustedPublishingRepository: commander.repository,
      trustedPublishingWorkflow: commander.file
    };
  }

  prompt(context) {
    if (!["bootstrap", "migrate"].includes(context.type) || context.trustedPublishingWorkflow) {
      return [];
    }

    const workflows = globSync([".github/workflows/*.yml", ".github/workflows/*.yaml"], {cwd: context.rootDir});

    if (!workflows.length) {
      throw new Error("No GitHub Actions workflow found. Pass --file <workflow.yml> to select one.");
    }

    return [
      {
        type: "list",
        name: "trustedPublishingWorkflow",
        message: "Which GitHub Actions workflow can publish these packages?",
        choices: workflows.map((workflow) => basename(workflow))
      }
    ];
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
