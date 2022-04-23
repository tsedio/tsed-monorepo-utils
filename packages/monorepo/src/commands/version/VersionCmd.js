import semver from "semver";
import {syncDependencies} from "../../utils/depencencies/syncDependencies.js";
import {newVersion} from "../../utils/packages/newVersion.js";

export class VersionCmd {
  mapContext(commander, monoRepo) {
    let version = commander.version;
    const [major, minor, patch] = monoRepo.rootPkg.version.split(".");

    if (["major", "minor", "patch"].includes(version)) {
      version = semver.inc(`${major}.${minor}.${patch}`, version);
    }

    if (!version) {
      semver.inc(`${major}.${minor}.${patch}`, "patch");
    }

    return {
      version
    };
  }

  getTasks(context) {
    return [
      {
        title: `Bump version to ${context.version}`,
        task: () => newVersion(context)
      },
      {
        title: "Sync dependencies from root package.json",
        task: () => syncDependencies(context)
      }
    ];
  }
}
