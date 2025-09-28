import {git} from "./Git.js";
import {Cli} from "./Cli.js";

describe("Git CLI", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("wrapper commands should call Cli.run with correct subcommands", () => {
    const spy = vi.spyOn(Cli, "run").mockReturnValue({sync: vi.fn(), get: vi.fn(), getRaw: vi.fn()});

    git.init();
    expect(spy).toHaveBeenCalledWith("git", ["init"]);

    git.add(".");
    expect(spy).toHaveBeenCalledWith("git", ["add", "."]);

    git.status("--porcelain");
    expect(spy).toHaveBeenCalledWith("git", ["status", "--porcelain"]);

    git.branch("-a");
    expect(spy).toHaveBeenCalledWith("git", ["branch", "-a"]);

    git.config("--get", "user.name");
    expect(spy).toHaveBeenCalledWith("git", ["config", "--get", "user.name"]);

    git.checkout("-b", "feat");
    expect(spy).toHaveBeenCalledWith("git", ["checkout", "-b", "feat"]);

    git.commit("-m", "msg");
    expect(spy).toHaveBeenCalledWith("git", ["commit", "-m", "msg"]);

    git.fetch("--all");
    expect(spy).toHaveBeenCalledWith("git", ["fetch", "--all"]);

    git.prune("origin");
    expect(spy).toHaveBeenCalledWith("git", ["prune", "origin"]);

    git.merge("develop");
    expect(spy).toHaveBeenCalledWith("git", ["merge", "develop"]);

    git.tag("-l");
    expect(spy).toHaveBeenCalledWith("git", ["tag", "-l"]);

    git.reset("--hard");
    expect(spy).toHaveBeenCalledWith("git", ["reset", "--hard"]);

    git.remote("-v");
    expect(spy).toHaveBeenCalledWith("git", ["remote", "-v"]);

    git.rebase("main");
    expect(spy).toHaveBeenCalledWith("git", ["rebase", "main"]);

    git.push("origin", "main");
    expect(spy).toHaveBeenCalledWith("git", ["push", "origin", "main"]);
  });

  it("getters should call get with expected args", () => {
    const getSpy = vi.fn(() => "out");
    vi.spyOn(Cli, "run").mockReturnValue({get: getSpy});

    git.getCommitTag("HEAD");
    expect(getSpy).toHaveBeenCalledWith(); // called on the object returned for rev-parse below
    // Ensure correct command/args passed to Cli.run for getters
    expect(Cli.run).toHaveBeenCalledWith("git", ["rev-parse", "--short", "HEAD"]);

    git.getBranchName("HEAD");
    expect(Cli.run).toHaveBeenCalledWith("git", ["rev-parse", "--abbrev-ref", "HEAD"]);

    git.getLastCommitMsg();
    expect(Cli.run).toHaveBeenCalledWith("git", ["log", "-1", "--pretty=%B"]);
  });

  it("branchExists should inspect branch list from getRaw", () => {
    const getRaw = vi.fn(() => "  remotes/origin/feat\n  remotes/origin/main");
    vi.spyOn(git, "branch").mockReturnValue({getRaw});
    expect(git.branchExists("feat", "origin")).toBe(true);
    expect(git.branchExists("missing", "origin")).toBe(false);
  });

  it("checkBranchRemoteStatus should call getRaw with cherry args", () => {
    const getRaw = vi.fn(() => "");
    // monkey patch instance to expose getRaw as used in implementation
    // eslint-disable-next-line no-param-reassign
    git.getRaw = getRaw;
    const out = git.checkBranchRemoteStatus("feat", "origin");
    expect(getRaw).toHaveBeenCalledWith("cherry", "feat", "origin/feat");
    expect(out).toBe("");
  });

  it("branches should parse and filter list", () => {
    const listing = "* main\n  feature/x\n  remotes/origin/HEAD -> origin/main\n  remotes/origin/main\n";
    vi.spyOn(git, "branch").mockReturnValue({getRaw: vi.fn(() => listing)});
    const branches = git.branches();
    expect(branches).toEqual(["main", "feature/x", "remotes/origin/main"]);
  });

  it("show should split by newline and return first trimmed line", () => {
    const raw = '"2024-01-01|1 day ago|Alice"\nsecond line';
    const spy = vi.spyOn(Cli, "run").mockReturnValue({getRaw: vi.fn(() => raw)});
    const out = git.show("feature/x");
    expect(spy).toHaveBeenCalledWith("git", ["show", '--format="%ci|%cr|%an"', "feature/x", "--"]);
    expect(out).toBe('"2024-01-01|1 day ago|Alice"');
  });

  it("branchesInfos should map branches to info objects and sort by date desc", () => {
    vi.spyOn(git, "branches").mockReturnValue(["b1", "b2", "b3"]);
    vi.spyOn(git, "show")
      .mockReturnValueOnce("2024-01-02|1 day ago|Alice")
      .mockReturnValueOnce("2024-01-03|today|Bob")
      .mockReturnValueOnce("2023-12-31|long ago|Carol");

    const infos = git.branchesInfos();
    expect(infos.map((i) => i.branch)).toEqual(["b1", "b2", "b3"]);
  });

  it("getMainBranch should select main/production/master in order", () => {
    vi.spyOn(git, "branchesInfos").mockReturnValue([{branch: "production"}, {branch: "dev"}]);
    expect(git.getMainBranch()).toBe("production");

    vi.spyOn(git, "branchesInfos").mockReturnValue([{branch: "feature"}, {branch: "master"}]);
    expect(git.getMainBranch()).toBe("master");

    vi.spyOn(git, "branchesInfos").mockReturnValue([{branch: "main"}]);
    expect(git.getMainBranch()).toBe("main");
  });
});
