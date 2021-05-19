import axios from "axios";
import {Cli} from "./Cli";

class DockerCli extends Cli {
  constructor() {
    super("docker");
  }

  tag(...args) {
    return this.get("tag", ...args);
  }

  login(...args) {
    return this.sync("login", ...args);
  }

  push(...args) {
    return this.run("push", ...args);
  }

  async getToken(username, password) {
    const {data: token} = await axios({
      method: "POST",
      url: "https://hub.docker.com/v2/users/login/",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      data: {
        username,
        password
      }
    });

    return token;
  }

  async getTags({token, repository}) {
    const {data} = await axios({
      method: "GET",
      url: `https://hub.docker.com/v2/repositories/${repository}/tags/?page=1&page_size=500`,
      headers: {
        Accept: "application/json",
        Authorization: `JWT ${token}`
      }
    });

    return data.results;
  }

  async deleteTag(tag, {token, repository}) {
    await axios({
      method: "DELETE",
      url: `https://hub.docker.com/v2/repositories/${repository}/tags/${tag}/`,
      headers: {
        Accept: "application/json",
        Authorization: `JWT ${token}`
      }
    });
  }
}

export const docker = new DockerCli();
