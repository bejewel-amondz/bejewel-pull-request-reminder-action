const {
  getPullRequestsFromRepos,
  extractReviewerMap,
  userMapStringToObject,
  buildHeaderBlock,
  buildReviewerBlock,
  buildMessage,
} = require('../functions');

const { default: axios } = require('axios');
jest.mock('axios');

const mockPullRequests = [
  {
    id: 1,
    title: 'title1',
    html_url: 'https://github.com/1',
    created_at: '2011-01-26T19:01:12Z',
    labels: [
      {
        name: 'bug',
      },
    ],
    requested_reviewers: [
      {
        login: 'User1',
      },
      {
        login: 'User2',
      },
    ],
  },
  {
    id: 2,
    title: 'title2',
    html_url: 'https://github.com/2',
    created_at: '2011-01-26T19:01:12Z',
    labels: [
      {
        name: 'bug',
      },
    ],
    requested_reviewers: [
      {
        login: 'User1',
      },
    ],
  },
  {
    id: 3,
    title: 'title3',
    html_url: 'https://github.com/3',
    created_at: '2011-01-26T19:01:12Z',
    labels: [
      {
        name: 'bug',
      },
    ],
    requested_teams: [
      {
        slug: 'justice-league',
      },
    ],
  },
  {
    id: 4,
    title: 'title4',
    html_url: 'https://github.com/4',
    created_at: '2011-01-26T19:01:12Z',
    labels: [
      {
        name: 'bug',
      },
    ],
    requested_reviewers: [],
    requested_teams: [
      {
        slug: 'justice-league',
      },
    ],
  },
  {
    id: 5,
    title: 'title5',
    html_url: 'https://github.com/5',
    created_at: '2011-01-26T19:01:12Z',
    labels: [
      {
        name: 'bug',
      },
    ],
    requested_reviewers: [],
    requested_teams: [],
  },
];

const mockUserMapString = 'User1:AAAAA,User2:BBBBB,User3:CCCCC';

test('get pull requests from given repos', async () => {
  axios.get.mockResolvedValue({
    data: mockPullRequests,
  });

  const repos = ['repo1', 'repo2'];

  expect(
    getPullRequestsFromRepos('token', 'owner', repos)
  ).resolves.toHaveLength(repos.length);
});

test('pr map key is github username, and value is pr array', () => {
  const prMap = extractReviewerMap([
    {
      data: mockPullRequests,
    },
  ]);

  expect(prMap.has('User1')).toEqual(true);
  expect(prMap.get('User1')).toHaveLength(2);

  expect(prMap.has('User2')).toEqual(true);
  expect(prMap.get('User2')).toHaveLength(1);
});

test('user map string to object', () => {
  expect(userMapStringToObject('')).toEqual({});

  expect(userMapStringToObject(mockUserMapString)).toEqual({
    User1: 'AAAAA',
    User2: 'BBBBB',
    User3: 'CCCCC',
  });
});

test('build header message block', () => {
  expect(buildHeaderBlock()).toEqual(
    expect.objectContaining({
      text: expect.anything(),
    })
  );
});

test('build reviewer message block', () => {
  expect(buildReviewerBlock('<@AAAAA>', 3)).toEqual({
    accessory: {
      text: { emoji: true, text: '3건', type: 'plain_text' },
      type: 'button',
    },
    text: {
      text: '*<@AAAAA>*\n:fire::fire::fire:',
      type: 'mrkdwn',
    },
    type: 'section',
  });
});

test('build entire message', () => {
  const message = buildMessage(
    extractReviewerMap([{ data: mockPullRequests }]),
    userMapStringToObject(mockUserMapString)
  );

  expect(message.blocks).toHaveLength(5);
});
