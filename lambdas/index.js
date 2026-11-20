const { DynamoDBClient, GetItemCommand, PutItemCommand, ScanCommand, TransactWriteItemsCommand } = require('@aws-sdk/client-dynamodb');
const { setTimeout: delay } = require('node:timers/promises');

const db = new DynamoDBClient({});
const TableName = process.env.GUESSES_TABLE_NAME || 'TwoThirdsGuesses';
const usernamePattern = /^[a-zA-Z0-9]{1,32}$/;
const requestIdPattern = /^[a-f0-9-]{36}$/i;
const dayString = date => date.toISOString().slice(0, 10);
const countKey = day => ({ timestamp: { S: 'ROUNDCOUNT#' + day } });

function reply(statusCode, body) {
  return {
    statusCode,
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function parseBody(event) {
  try {
    return JSON.parse(event.body) ?? {};
  } catch {
    return null;
  }
}

async function* scanPages(filter, values) {
  let cursor;
  do {
    const page = await db.send(new ScanCommand({
      TableName,
      ConsistentRead: true,
      FilterExpression: filter,
      ExpressionAttributeNames: { '#key': 'timestamp' },
      ExpressionAttributeValues: values,
      ExclusiveStartKey: cursor,
    }));
    yield page.Items ?? [];
    cursor = page.LastEvaluatedKey;
  } while (cursor);
}

async function hasLegacyEntry(day, username) {
  for await (const items of scanPages('begins_with(#key, :prefix) AND username = :username', {
    ':prefix': { S: day + 'T' },
    ':username': { S: username },
  })) {
    if (items.length) return true;
  }
  return false;
}

async function readItem(Key) {
  const { Item } = await db.send(new GetItemCommand({ TableName, Key, ConsistentRead: true }));
  return Item;
}

async function ensureRoundCount(day) {
  const Key = countKey(day);
  const existing = await readItem(Key);
  if (existing) return Number(existing.count.N);

  // Every new writer waits for this seed, so the baseline includes only preexisting guesses.
  const count = (await loadRoundEntries(day)).length;
  try {
    await db.send(new PutItemCommand({
      TableName,
      Item: { ...Key, count: { N: String(count) } },
      ConditionExpression: 'attribute_not_exists(#key)',
      ExpressionAttributeNames: { '#key': 'timestamp' },
    }));
    return count;
  } catch (error) {
    if (error.name !== 'ConditionalCheckFailedException') throw error;
    const seeded = await readItem(Key);
    if (!seeded) throw error;
    return Number(seeded.count.N);
  }
}

exports.getRoundCount = async () => {
  const day = dayString(new Date());
  try {
    const response = reply(200, { day, count: await ensureRoundCount(day) });
    response.headers['Cache-Control'] = 'no-store';
    return response;
  } catch (error) {
    console.error('Could not load the round count', error);
    return reply(503, { message: 'Could not load the round count.' });
  }
};

exports.submitGuess = async event => {
  const body = parseBody(event);
  if (!body) return reply(400, { message: 'Invalid submission.' });

  const { username, guess, day: requestedDay, requestId } = body;
  if (typeof username !== 'string' || !usernamePattern.test(username)) {
    return reply(400, { message: 'Use up to 32 letters or numbers for your username.' });
  }
  if (!Number.isFinite(guess) || guess < 0 || guess > 100 || guess !== Number(guess.toFixed(2))) {
    return reply(400, { message: 'Enter a number from 0 to 100 with up to two decimal places.' });
  }
  if (requestId !== undefined && (typeof requestId !== 'string' || !requestIdPattern.test(requestId))) {
    return reply(400, { message: 'Invalid submission.' });
  }

  const day = dayString(new Date());
  const closed = () => reply(409, { message: 'That round has closed. Submit a guess for the new round.' });
  const duplicate = () => reply(409, { message: 'That username already has a guess this round.' });
  const success = () => reply(200, { day, message: 'Guess submitted successfully' });
  if (requestedDay !== undefined && requestedDay !== day) return closed();

  // New entries use a stable key. Older entries retain their original ISO timestamp keys.
  const Key = { timestamp: { S: day + '#' + username } };
  try {
    if (await hasLegacyEntry(day, username)) return duplicate();
    await ensureRoundCount(day);
    const transaction = new TransactWriteItemsCommand({ TransactItems: [
      {
        Put: {
          TableName,
          Item: {
            ...Key,
            username: { S: username },
            guess: { N: String(guess) },
            submittedAt: { S: new Date().toISOString() },
            ...(requestId ? { requestId: { S: requestId } } : {}),
          },
          ConditionExpression: 'attribute_not_exists(#key)',
          ExpressionAttributeNames: { '#key': 'timestamp' },
        },
      },
      {
        Update: {
          TableName,
          Key: countKey(day),
          UpdateExpression: 'ADD #count :one',
          ConditionExpression: 'attribute_exists(#count)',
          ExpressionAttributeNames: { '#count': 'count' },
          ExpressionAttributeValues: { ':one': { N: '1' } },
        },
      },
    ] });
    for (let attempt = 0; ; attempt++) {
      if (dayString(new Date()) !== day) return closed();
      try {
        await db.send(transaction);
        return success();
      } catch (error) {
        if (error.name !== 'TransactionCanceledException') throw error;
        const entry = await readItem(Key);
        if (entry) {
          return requestId && entry.requestId?.S === requestId && Number(entry.guess.N) === guess
            ? success() : duplicate();
        }
        const conflict = error.CancellationReasons?.some(reason => reason.Code === 'TransactionConflict');
        if (!conflict || attempt === 2) throw error;
        await delay(30 * (attempt + 1) + Math.random() * 50);
      }
    }
  } catch (error) {
    console.error('Could not save a guess', error);
    return reply(503, { message: 'Could not confirm your guess. Please try again.' });
  }
};

async function loadRoundEntries(day) {
  const entriesByUsername = new Map();
  for await (const items of scanPages('begins_with(#key, :legacy) OR begins_with(#key, :current)', {
    ':legacy': { S: day + 'T' },
    ':current': { S: day + '#' },
  })) {
    for (const item of items) {
      const name = item.username?.S;
      const guess = Number(item.guess?.N);
      if (!name || !Number.isFinite(guess) || guess < 0 || guess > 100) continue;
      const submittedAt = item.submittedAt?.S ?? item.timestamp.S;
      const existing = entriesByUsername.get(name);
      if (!existing || submittedAt < existing.submittedAt) {
        entriesByUsername.set(name, { username: name, guess, submittedAt });
      }
    }
  }

  return [...entriesByUsername.values()];
}

async function getRoundResults(day, username) {
  const entries = await loadRoundEntries(day);
  const numberOfPlayers = entries.length;
  if (!numberOfPlayers) {
    return {
      day, numberOfPlayers, leaderboard: [], averageGuess: null, target: null,
      userGuess: null, userRank: null, userDistance: null, winnerGuess: null,
    };
  }

  // Integer hundredths keep mathematically equal distances tied.
  const sum = entries.reduce((total, entry) => total + Math.round(entry.guess * 100), 0);
  const scale = 3 * numberOfPlayers;
  for (const entry of entries) {
    entry.difference = Math.abs(Math.round(entry.guess * 100) * scale - 2 * sum);
  }
  entries.sort((a, b) => a.difference - b.difference || a.username.localeCompare(b.username, 'en'));
  const ranked = entries.map((entry, index) => {
    if (entry.difference !== entries[index - 1]?.difference) entry.rank = index + 1;
    else entry.rank = entries[index - 1].rank;
    return { username: entry.username, guess: entry.guess, rank: entry.rank, distance: entry.difference / (100 * scale) };
  });
  const player = ranked.find(entry => entry.username === username);
  return {
    day, numberOfPlayers, averageGuess: sum / (100 * numberOfPlayers), target: 2 * sum / (100 * scale),
    userGuess: player?.guess ?? null, userRank: player?.rank ?? null, userDistance: player?.distance ?? null,
    winnerGuess: ranked[0].guess, leaderboard: ranked.slice(0, 10),
  };
}

async function previousResults(username) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 1);
  return getRoundResults(dayString(date), username);
}

exports.getPreviousResults = async event => {
  const body = parseBody(event);
  if (!body) return reply(400, { message: 'Invalid results request.' });
  try {
    return reply(200, await previousResults(body.username));
  } catch (error) {
    console.error('Could not load round results', error);
    return reply(503, { message: 'Could not load round results. Please try again.' });
  }
};

exports.getLeaderboard = async () => {
  try {
    return reply(200, (await previousResults()).leaderboard);
  } catch (error) {
    console.error('Could not load leaderboard', error);
    return reply(503, { message: 'Could not load leaderboard. Please try again.' });
  }
};
