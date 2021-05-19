import {docker} from "../cli/Docker";

function mapTags(tags) {
  tags = tags
    .map((tag) => {
      return {
        name: tag.name,
        date: new Date(tag.last_updated).getTime()
      };
    })
    .sort((a, b) => b.date - a.date);

  let tagFound = false;

  return tags.reduce((result, tag) => {
    if (tag.name.match(/\d+\.\d+\.\d+/)) {
      tagFound = true;
    } else if (tagFound) {
      result.push(tag);
    }
    return result;
  }, []);
}

export async function cleanTagsDocker(context) {
  const {
    logger,
    dockerhub: {id, pwd, repository}
  } = context;

  const token = await docker.getToken(id, pwd);
  const options = {
    token,
    repository
  };

  const tags = mapTags(await docker.getTags(options));

  await Promise.all(
    tags.map(async (tag) => {
      await docker.deleteTag(tag.name, options);
      logger.info(`TAG : ${tag.name} deleted`);
    })
  );

  logger.info("Docker Hub Clean !");
}
