require('dotenv').config();
const core = require('@actions/core');
const { IncomingWebhook } = require('@slack/webhook');

const {
  getPullRequestsFromRepos,
  extractReviewerMap,
  userMapStringToObject,
  buildMessage,
} = require('./functions');

const { GITHUB_TOKEN } = process.env;

async function main() {
  try {
    const owner = core.getInput('owner', {
      required: true,
    });
    const repos = core
      .getInput('repos', {
        required: true,
      })
      .split(',');
    const githubSlackUserMapString = core.getInput('github-slack-map', {
      required: true,
    });
    const webhookUrl = core.getInput('webhook-url', {
      required: true,
    });

    const prResponses = await getPullRequestsFromRepos(
      GITHUB_TOKEN,
      owner,
      repos
    );

    const reviewerMap = extractReviewerMap(prResponses);

    const githubSlackUserMap = userMapStringToObject(githubSlackUserMapString);

    const webhook = new IncomingWebhook(webhookUrl);

    const message = buildMessage(reviewerMap, githubSlackUserMap);
    console.info(JSON.stringify(message));

    const sendResult = await webhook.send(message);
    console.info(sendResult);
  } catch (error) {
    console.error(error);
    core.setFailed(error.message);
  }
}

main();
