const mockSend = jest.fn();
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: class { send(command) { return mockSend(command); } },
  ScanCommand: class { constructor(input) { this.input = input; this.kind = 'scan'; } },
  PutItemCommand: class { constructor(input) { this.input = input; this.kind = 'put'; } },
  GetItemCommand: class { constructor(input) { this.input = input; this.kind = 'get'; } },
  TransactWriteItemsCommand: class { constructor(input) { this.input = input; this.kind = 'transaction'; } },
}), { virtual: true });

const { getPreviousResults, getRoundCount, submitGuess } = require('../lambdas/index');
const event = body => ({ body: JSON.stringify(body) });
const item = (username, guess, timestamp) => ({ username: { S: username }, guess: { N: String(guess) }, timestamp: { S: timestamp } });

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-11-20T08:00:00Z'));
  mockSend.mockReset();
});
afterEach(() => jest.useRealTimers());

test('scores all pages together, preserves zero, and gives equal distances equal ranks', async () => {
  const cursor = { timestamp: { S: 'cursor' } };
  mockSend
    .mockResolvedValueOnce({ Items: [], LastEvaluatedKey: cursor })
    .mockResolvedValueOnce({ Items: [
      item('Zero', 0, '2026-11-19T01:00:00.000Z'),
      item('Four', 4, '2026-11-19#Four'),
      item('Five', 5, '2026-11-19#Five'),
    ] });
  const response = await getPreviousResults(event({ username: 'Zero' }));
  const result = JSON.parse(response.body);

  expect(response.statusCode).toBe(200);
  expect(result).toMatchObject({ day: '2026-11-19', numberOfPlayers: 3, target: 2, userGuess: 0, userRank: 1, userDistance: 2 });
  expect(result.leaderboard.map(({ rank }) => rank)).toEqual([1, 1, 3]);
  expect(mockSend.mock.calls[1][0].input.ExclusiveStartKey).toEqual(cursor);
});

test('rejects invalid guesses and stale rounds before writing', async () => {
  expect((await submitGuess(event({ username: 'Ada', guess: '0' }))).statusCode).toBe(400);
  expect((await submitGuess(event({ username: 'Ada', guess: 0.001 }))).statusCode).toBe(400);
  expect((await submitGuess(event({ username: 'Ada', guess: 0, day: '2026-11-19' }))).statusCode).toBe(409);
  expect(mockSend).not.toHaveBeenCalled();
});

test('saves a guess and increments the counter in one transaction', async () => {
  mockSend
    .mockResolvedValueOnce({ Items: [] })
    .mockResolvedValueOnce({ Item: { count: { N: '2' } } })
    .mockResolvedValueOnce({});

  expect((await submitGuess(event({ username: 'Ada', guess: 0, day: '2026-11-20' }))).statusCode).toBe(200);
  expect(mockSend.mock.calls.map(([command]) => command.kind)).toEqual(['scan', 'get', 'transaction']);
  expect(mockSend.mock.calls[2][0].input.TransactItems).toMatchObject([
    { Put: {
      Item: { timestamp: { S: '2026-11-20#Ada' } },
      ConditionExpression: 'attribute_not_exists(#key)',
    } },
    { Update: {
      Key: { timestamp: { S: 'ROUNDCOUNT#2026-11-20' } },
      UpdateExpression: 'ADD #count :one',
      ExpressionAttributeValues: { ':one': { N: '1' } },
    } },
  ]);
});

test('confirms an identical retry and rejects a duplicate without another increment', async () => {
  const requestId = '01234567-0123-0123-0123-0123456789ab';
  const duplicate = Object.assign(new Error(), { name: 'TransactionCanceledException' });
  for (let index = 0; index < 2; index++) {
    mockSend
      .mockResolvedValueOnce({ Items: [] })
      .mockResolvedValueOnce({ Item: { count: { N: '1' } } })
      .mockRejectedValueOnce(duplicate)
      .mockResolvedValueOnce({ Item: { guess: { N: '0' }, requestId: { S: requestId } } });
  }

  expect((await submitGuess(event({ username: 'Ada', guess: 0, requestId }))).statusCode).toBe(200);
  expect((await submitGuess(event({ username: 'Ada', guess: 0 }))).statusCode).toBe(409);
  expect(mockSend.mock.calls.map(([command]) => command.kind))
    .toEqual(['scan', 'get', 'transaction', 'get', 'scan', 'get', 'transaction', 'get']);
});

test('seeds today’s count from existing unique guesses and reads it without rescanning', async () => {
  mockSend
    .mockResolvedValueOnce({})
    .mockResolvedValueOnce({ Items: [
      item('Ada', 0, '2026-11-20T01:00:00.000Z'),
      item('Ada', 10, '2026-11-20#Ada'),
      item('Ben', 30, '2026-11-20#Ben'),
    ] })
    .mockResolvedValueOnce({})
    .mockResolvedValueOnce({ Item: { count: { N: '2' } } });

  for (let index = 0; index < 2; index++) {
    const response = await getRoundCount();
    expect(response.statusCode).toBe(200);
    expect(response.headers['Cache-Control']).toBe('no-store');
    expect(JSON.parse(response.body)).toEqual({ day: '2026-11-20', count: 2 });
  }
  expect(mockSend.mock.calls.map(([command]) => command.kind)).toEqual(['get', 'scan', 'put', 'get']);
  expect(mockSend.mock.calls[2][0].input.Item).toEqual({
    timestamp: { S: 'ROUNDCOUNT#2026-11-20' }, count: { N: '2' },
  });
});
