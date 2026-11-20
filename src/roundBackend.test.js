const mockSend = jest.fn();
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: class { send(command) { return mockSend(command); } },
  ScanCommand: class { constructor(input) { this.input = input; this.kind = 'scan'; } },
  PutItemCommand: class { constructor(input) { this.input = input; this.kind = 'put'; } },
  GetItemCommand: class { constructor(input) { this.input = input; this.kind = 'get'; } },
}), { virtual: true });

const { getPreviousResults, submitGuess } = require('../lambdas/index');
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

test('uses a conditional round key and confirms a retried submission', async () => {
  const requestId = '01234567-0123-0123-0123-0123456789ab';
  const duplicate = Object.assign(new Error(), { name: 'ConditionalCheckFailedException' });
  mockSend
    .mockResolvedValueOnce({ Items: [] })
    .mockRejectedValueOnce(duplicate)
    .mockResolvedValueOnce({ Item: { guess: { N: '0' }, requestId: { S: requestId } } });

  const response = await submitGuess(event({ username: 'Ada', guess: 0, day: '2026-11-20', requestId }));
  expect(response.statusCode).toBe(200);
  expect(mockSend.mock.calls[1][0].input).toMatchObject({
    Item: { timestamp: { S: '2026-11-20#Ada' } },
    ConditionExpression: 'attribute_not_exists(#key)',
  });
});
