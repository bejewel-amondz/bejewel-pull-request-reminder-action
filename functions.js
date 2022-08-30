const { default: axios } = require('axios');

const REVIEW_REQUESTED_URL = 'https://github.com/pulls/review-requested';

/**
 * Get pull requests from multiple github repositories
 * @param {*} token
 * @param {*} owner
 * @param {*} repos
 * @returns
 */
function getPullRequestsFromRepos(token, owner, repos) {
  const requests = repos.map((repo) =>
    axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
      headers: {
        Authorization: `token ${token}`,
      },
    })
  );

  return Promise.all(requests);
}

/**
 * extract reviewer map from pr responses. key is userid, value is array of pr
 * ('User1', [pr, pr, pr])
 * ('User2', [pr])
 * ('User3', [pr, pr])
 * ('Team1', [pr, pr])
 * @param {*} prResponses
 * @returns
 */
function extractReviewerMap(prResponses) {
  const prToReviewMap = new Map();
  prResponses.forEach((prs) => {
    prs.data.forEach((pr) => {
      (pr.requested_reviewers || []).forEach((reviewer) => {
        if (prToReviewMap.has(reviewer.login)) {
          prToReviewMap.get(reviewer.login).push(reviewer);
        } else {
          prToReviewMap.set(reviewer.login, [reviewer]);
        }
      });
    });
  });

  return prToReviewMap;
}

/**
 * build reviewer message block
 * @param {string} reviewer
 * @param {number} prCount
 * @returns {object}
 */
function buildReviewerBlock(reviewer, prCount) {
  const fireEmoji = Array(prCount).fill(':fire:').join('');

  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*${reviewer}*\n${fireEmoji}`,
    },
    accessory: {
      type: 'button',
      text: {
        type: 'plain_text',
        emoji: true,
        text: `${prCount}건`,
      },
    },
  };
}

/**
 * build header message block
 * @returns {object}
 */
function buildHeaderBlock() {
  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `* 리뷰부탁드립니다* :man-bowing: <${REVIEW_REQUESTED_URL}|리뷰하러가기>`,
    },
  };
}

/**
 * build slack message
 */
function buildMessage(reviewerMap, githubSlackUserMap) {
  const headerBlock = buildHeaderBlock();

  const dividerBlock = {
    type: 'divider',
  };

  const reviewerPrCountObj = {};
  for (const [githubUserName, prs] of reviewerMap) {
    reviewerPrCountObj[
      githubSlackUserMap[githubUserName]
        ? `<@${githubSlackUserMap[githubUserName]}>`
        : `@${githubUserName}`
    ] = prs.length;
  }

  const reviewerBlocks = [];
  for (const reviewer in reviewerPrCountObj) {
    reviewerBlocks.push(
      buildReviewerBlock(reviewer, reviewerPrCountObj[reviewer])
    );
  }

  const blocks = {
    blocks: [headerBlock, dividerBlock, ...reviewerBlocks, dividerBlock],
  };

  return blocks;
}

/**
 * githubusername:slackmemberid map string to object
 * @param {string} str
 * @returns {object}
 */
function userMapStringToObject(str) {
  const obj = {};

  if (!str) {
    return obj;
  }

  const users = str.split(',');
  users.forEach((user) => {
    const [githubUserName, slackUserId] = user.split(':');
    obj[githubUserName] = slackUserId;
  });

  return obj;
}

module.exports = {
  getPullRequestsFromRepos,
  extractReviewerMap,
  buildHeaderBlock,
  buildReviewerBlock,
  buildMessage,
  userMapStringToObject,
};
