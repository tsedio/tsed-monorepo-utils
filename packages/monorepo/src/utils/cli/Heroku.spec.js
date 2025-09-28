import {heroku} from "./Heroku.js";
import {Cli} from "./Cli.js";

describe("Heroku CLI", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("container commands should delegate to Cli.run", () => {
    const spy = vi.spyOn(Cli, "run").mockReturnValue({});

    heroku.containerLogin("-i");
    expect(spy).toHaveBeenCalledWith("heroku", ["container:login", "-i"]);

    heroku.containerPush("web", "--arg");
    expect(spy).toHaveBeenCalledWith("heroku", ["container:push", "web", "--arg"]);

    heroku.containerRelease("web");
    expect(spy).toHaveBeenCalledWith("heroku", ["container:release", "web"]);
  });
});
