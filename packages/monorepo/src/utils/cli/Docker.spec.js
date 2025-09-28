import {docker} from "./Docker.js";
import {Cli} from "./Cli.js";
import axios from "axios";

vi.mock("axios", () => ({
  default: vi.fn()
}));

describe("Docker CLI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getToken should POST to docker hub login", async () => {
    axios.mockResolvedValue({data: "TOKEN"});
    const token = await docker.getToken("user", "pwd");
    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        url: "https://hub.docker.com/v2/users/login/",
        data: {username: "user", password: "pwd"}
      })
    );
    expect(token).toBe("TOKEN");
  });

  it("getTags should GET tags with JWT header", async () => {
    axios.mockResolvedValue({data: {results: [{name: "latest"}]}});
    const res = await docker.getTags({token: "abc", repository: "org/repo"});
    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: "https://hub.docker.com/v2/repositories/org/repo/tags/?page=1&page_size=500",
        headers: expect.objectContaining({Authorization: "JWT abc"})
      })
    );
    expect(res).toEqual([{name: "latest"}]);
  });

  it("deleteTag should DELETE tag with JWT header", async () => {
    axios.mockResolvedValue({});
    await docker.deleteTag("old", {token: "abc", repository: "org/repo"});
    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "DELETE",
        url: "https://hub.docker.com/v2/repositories/org/repo/tags/old/",
        headers: expect.objectContaining({Authorization: "JWT abc"})
      })
    );
  });

  it("tag/login/push should call underlying Cli.run/get/sync", async () => {
    const spy = vi.spyOn(Cli, "run").mockReturnValue({
      get: vi.fn(() => "OK"),
      sync: vi.fn(() => ({})),
      run: vi.fn(() => ({}))
    });

    docker.tag("a", "b");
    docker.login("-u", "user");
    docker.push("img");

    expect(spy).toHaveBeenCalledWith("docker", ["tag", "a", "b"]);
    expect(spy).toHaveBeenCalledWith("docker", ["login", "-u", "user"]);
    expect(spy).toHaveBeenCalledWith("docker", ["push", "img"]);
  });
});
