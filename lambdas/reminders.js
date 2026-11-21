const {
  DeleteItemCommand, DynamoDBClient, QueryCommand, TransactWriteItemsCommand, UpdateItemCommand,
} = require('@aws-sdk/client-dynamodb');
const { SESv2Client, SendEmailCommand } = require('@aws-sdk/client-sesv2');

const db = new DynamoDBClient({});
const ses = new SESv2Client({ maxAttempts: 1 });
const dayString = date => date.toISOString().slice(0, 10);
const dayMs = 24 * 60 * 60 * 1000;

function reply(statusCode, message) {
  return {
    statusCode,
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  };
}

exports.register = async (event) => {
  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return reply(400, 'Invalid reminder request.');
  }

  const { day, username, requestId, email } = body ?? {};
  const address = typeof email === 'string' ? email.trim() : '';
  if (address.length > 254 || !/^[\x21-\x3f\x41-\x7e]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(address)) {
    return reply(400, 'Enter a valid email address.');
  }
  if (day !== dayString(new Date())) return reply(409, 'This round has already closed.');
  if (typeof username !== 'string' || !/^[a-zA-Z0-9]{1,32}$/.test(username) ||
      typeof requestId !== 'string' || !/^[a-f0-9-]{36}$/i.test(requestId)) {
    return reply(400, 'A confirmed guess is needed to set a reminder.');
  }

  try {
    await db.send(new TransactWriteItemsCommand({ TransactItems: [
      {
        Update: {
          TableName: process.env.GUESSES_TABLE_NAME,
          Key: { timestamp: { S: day + '#' + username } },
          UpdateExpression: 'SET reminderRequested = :true',
          ConditionExpression: 'requestId = :id AND attribute_not_exists(reminderRequested)',
          ExpressionAttributeValues: { ':id': { S: requestId }, ':true': { BOOL: true } },
          ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
        },
      },
      {
        Put: {
          TableName: process.env.REMINDERS_TABLE_NAME,
          Item: {
            roundDay: { S: day },
            emailKey: { S: address.toLowerCase() },
            email: { S: address },
            expiresAt: { N: String((Date.parse(day) + 3 * dayMs) / 1000) },
          },
          ConditionExpression: 'attribute_not_exists(emailKey)',
        },
      },
    ] }));
    return reply(200, 'Reminder set for this round.');
  } catch (error) {
    const [guess, reminder] = error.CancellationReasons ?? [];
    if (guess?.Code === 'ConditionalCheckFailed' && guess.Item?.requestId?.S !== requestId) {
      return reply(403, 'A confirmed guess is needed to set a reminder.');
    }
    if (guess?.Item?.reminderRequested?.BOOL || reminder?.Code === 'ConditionalCheckFailed') {
      return reply(200, 'Reminder set for this round.');
    }
    console.error('Unable to register a reminder', error.name);
    return reply(503, 'Could not set the reminder. Please try again.');
  }
};

async function deliver(reminder, TableName) {
  const Key = { roundDay: reminder.roundDay, emailKey: reminder.emailKey };
  try {
    await db.send(new UpdateItemCommand({
      TableName,
      Key,
      UpdateExpression: 'SET claimedAt = :now',
      ConditionExpression: 'attribute_exists(roundDay) AND attribute_not_exists(claimedAt)',
      ExpressionAttributeValues: { ':now': { S: new Date().toISOString() } },
    }));
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') return;
    throw error;
  }

  try {
    await ses.send(new SendEmailCommand({
      FromEmailAddress: process.env.REMINDER_SENDER_EMAIL,
      Destination: { ToAddresses: [reminder.email.S] },
      Content: {
        Simple: {
          Subject: { Data: 'Your Two Thirds results are in' },
          Body: { Text: { Data: 'See how your guess ranked and play the next round:\nhttps://twothirds.app/#results-title\n\nYou requested this one-time reminder after submitting a guess.' } },
        },
      },
    }));
  } catch (error) {
    if (error.name === 'TooManyRequestsException') {
      // SES rejected the send before accepting it, so a later attempt is safe.
      await db.send(new UpdateItemCommand({ TableName, Key, UpdateExpression: 'REMOVE claimedAt' }));
    }
    throw error;
  }
  await db.send(new DeleteItemCommand({ TableName, Key }));
}

exports.sendRound = async (event) => {
  const scheduled = new Date(event.time);
  if (!Number.isFinite(scheduled.getTime())) throw new Error('The reminder event is missing its schedule time.');
  const day = dayString(new Date(scheduled.getTime() - dayMs));
  const TableName = process.env.REMINDERS_TABLE_NAME;
  let cursor;
  let failed = 0;
  do {
    const page = await db.send(new QueryCommand({
      TableName,
      KeyConditionExpression: 'roundDay = :day',
      ExpressionAttributeValues: { ':day': { S: day } },
      ConsistentRead: true,
      ExclusiveStartKey: cursor,
    }));
    for (const reminder of page.Items ?? []) {
      try {
        await deliver(reminder, TableName);
      } catch (error) {
        failed += 1;
        console.error('Unable to deliver a result reminder', error.name);
      }
    }
    cursor = page.LastEvaluatedKey;
  } while (cursor);
  if (failed) throw new Error('Some round reminders could not be sent.');
};
