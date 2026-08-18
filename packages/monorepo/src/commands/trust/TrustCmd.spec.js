import {describe, expect, it, vi} from "vitest";

const mocks = vi.hoisted(() => ({
  globSync: vi.fn(() => [".github/workflows/build.yml", ".github/workflows/release.yaml"])
}));

vi.mock("../../utils/common/glob.js", () => ({globSync: mocks.globSync}));

import {TrustCmd} from "./TrustCmd.js";

describe("TrustCmd", () => {
  it("forwards the npm confirmation option", () => {
    expect(new TrustCmd().mapContext({type: "migrate", yes: true})).toMatchObject({trustedPublishingYes: true});
  });

  it("prompts with Inquirer's registered select type", () => {
    const prompts = new TrustCmd().prompt({rootDir: "/repo", type: "migrate"});

    expect(prompts).toEqual([
      {
        type: "select",
        name: "trustedPublishingWorkflow",
        message: "Which GitHub Actions workflow can publish these packages?",
        choices: ["build.yml", "release.yaml"]
      }
    ]);
  });
});
