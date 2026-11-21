const mockDb = jest.fn();
const mockSendEmail = jest.fn();

jest.mock('@aws-sdk/client-dynamodb', () => {
  const command = kind => class { constructor(input) { this.kind = kind; this.input = input; } };
  return {
    DynamoDBClient: class { send(request) { return mockDb(request); } },
    DeleteItemCommand: command('delete'),
    QueryCommand: command('query'),
    TransactWriteItemsCommand: command('transaction'),
    UpdateItemCommand: command('update'),
  };
}, { virtual: true });
jest.mock('@aws-sdk/client-sesv2', () => ({
  SESv2Client: class { send(request) { return mockSendEmail(request); } },
  SendEmailCommand: class { constructor(input) { this.input = input; } },
}), { virtual: true });

const { register, sendRound } = require('../lambdas/reminders');
const requestId = '01234567-0123-0123-0123-0123456789ab';
const registration = body => ({ body: JSON.stringify({
  day: '2026-11-20', username: 'Ada', requestId, email: 'Ada@example.com', ...body,
}) });

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-11-20T08:00:00Z'));
  mockDb.mockReset();
  mockSendEmail.mockReset();
});
afterEach(() => jest.useRealTimers());

test('registers only a confirmed current-round receipt, without sending during signup', async () => {
  expect((await register(registration({ email: 'not-an-email' }))).statusCode).toBe(400);
  expect((await register(registration({ day: '2026-11-19' }))).statusCode).toBe(409);
  expect(mockDb).not.toHaveBeenCalled();

  mockDb.mockResolvedValueOnce({});
  expect((await register(registration())).statusCode).toBe(200);
  expect(mockDb.mock.calls[0][0].input.TransactItems).toMatchObject([
    { Update: {
      Key: { timestamp: { S: '2026-11-20#Ada' } },
      ConditionExpression: 'requestId = :id AND attribute_not_exists(reminderRequested)',
      ExpressionAttributeValues: { ':id': { S: requestId } },
    } },
    { Put: {
      Item: { roundDay: { S: '2026-11-20' }, emailKey: { S: 'ada@example.com' } },
      ConditionExpression: 'attribute_not_exists(emailKey)',
    } },
  ]);
  mockDb.mockRejectedValueOnce({ CancellationReasons: [{ Code: 'ConditionalCheckFailed' }] });
  expect((await register(registration())).statusCode).toBe(403);
  expect(mockSendEmail).not.toHaveBeenCalled();
});

test('sends only for the completed round and claims each delivery before sending', async () => {
  const item = {
    roundDay: { S: '2026-11-20' }, emailKey: { S: 'ada@example.com' }, email: { S: 'Ada@example.com' },
  };
  mockDb
    .mockResolvedValueOnce({ Items: [item] })
    .mockResolvedValueOnce({})
    .mockResolvedValueOnce({})
    .mockResolvedValueOnce({ Items: [item] })
    .mockRejectedValueOnce({ name: 'ConditionalCheckFailedException' });
  mockSendEmail.mockResolvedValueOnce({});
  const event = { time: '2026-11-21T00:05:00Z' };
  await sendRound(event);
  await sendRound(event);
  expect(mockDb.mock.calls[0][0].input.ExpressionAttributeValues[':day']).toEqual({ S: '2026-11-20' });
  expect(mockDb.mock.calls.map(([command]) => command.kind)).toEqual(['query', 'update', 'delete', 'query', 'update']);
  expect(mockSendEmail).toHaveBeenCalledTimes(1);
  expect(mockSendEmail.mock.calls[0][0].input.Destination.ToAddresses).toEqual(['Ada@example.com']);
});
