const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const GUESS_TABLE_NAME = 'TwoThirdsGuesses';

exports.submitGuess = async (event) => {
  const { username, guess } = JSON.parse(event.body);

  // Generate date string for today
  const today = new Date();
  const todayDateString = today.toISOString().split('T')[0];

  // Check if the user has already made a guess today
  const checkParams = {
    TableName: GUESS_TABLE_NAME,
    FilterExpression: 'begins_with(#ts, :today) AND username = :username',
    ExpressionAttributeNames: {
      '#ts': 'timestamp',
    },
    ExpressionAttributeValues: {
      ':today': todayDateString,
      ':username': username,
    },
  };

  const checkResult = await dynamoDb.scan(checkParams).promise();

  // If the user has already made a guess today, return an error message
  if (checkResult.Items.length > 0) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*", // Or specify your frontend domain
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ message: 'That username is taken!' }),
    };
  }

  // If the user has not made a guess today, store the new guess
  const params = {
    TableName: GUESS_TABLE_NAME,
    Item: { username, guess, timestamp: new Date().toISOString() },
  };

  await dynamoDb.put(params).promise();

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*", // Or specify your frontend domain
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify({ message: 'Guess submitted successfully' }),
  };
};


exports.getLeaderboard = async (event) => {
  // Query DynamoDB for leaderboard data
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toISOString().split('T')[0];

  const params = {
    TableName: GUESS_TABLE_NAME,
    FilterExpression: 'begins_with(#ts, :yesterday)',
    ExpressionAttributeNames: {
      '#ts': 'timestamp',
    },
    ExpressionAttributeValues: {
      ':yesterday': yesterdayString,
    },
  };

  try {
    const data = await dynamoDb.scan(params).promise();
    const guessItems = data.Items;

    const averageGuess = guessItems.length > 0 ? guessItems.reduce((total, item) => total + item.guess, 0) / guessItems.length : null;
    const target = averageGuess ? averageGuess * (2 / 3) : null;

    guessItems.forEach(item => {
      item.distance = Math.abs(target - item.guess);
    });

    // Sort users by their distance to the target, in ascending order
    guessItems.sort((a, b) => a.distance - b.distance);

    // Extract leaderboard information (top 10)
    const leaderboard = guessItems.slice(0, 10).map(item => ({ username: item.username, guess: item.guess, distance: item.distance }));

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Or specify your frontend domain
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(leaderboard),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*", // Or specify your frontend domain
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ error: 'Could not retrieve leaderboard ' + error }),
    };
  }
};

exports.getPreviousResults = async (event) => {
  // Parse the username from the event body
  const { username } = JSON.parse(event.body);

  // Generate date string for yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDateString = yesterday.toISOString().split('T')[0];

  // Scan the entire table and filter items based on the 'timestamp' attribute
  const params = {
    TableName: GUESS_TABLE_NAME,
    FilterExpression: 'begins_with(#ts, :yesterday)',
    ExpressionAttributeNames: {
      '#ts': 'timestamp',
    },
    ExpressionAttributeValues: {
      ':yesterday': yesterdayDateString,
    },
  };

  const result = await dynamoDb.scan(params).promise();
  const userGuess = result.Items.length > 0 ? result.Items.find(item => item.username === username)?.guess || null : null;
  const averageGuess = result.Items.length > 0 ? result.Items.reduce((a, b) => a + b.guess, 0) / result.Items.length : null;
  const target = averageGuess ? averageGuess * 2 / 3 : null;

  // Find the user guess that is closest to the target and calculate all user ranks
  let closestGuess = null;
  let smallestDifference = Infinity;
  const rankList = [];
  result.Items.forEach(item => {
    const difference = Math.abs(item.guess - target);
    rankList.push({username: item.username, difference: difference});
    if (difference < smallestDifference) {
      smallestDifference = difference;
      closestGuess = item;
    }
  });

  // Sort the rank list by difference
  rankList.sort((a, b) => a.difference - b.difference);

  // Find the user's rank
  const userRank = rankList.findIndex(item => item.username === username) + 1;

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*", // Or specify your frontend domain
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify({
      averageGuess: averageGuess?.toFixed(2),
      target: target?.toFixed(2),
      userGuess: userGuess ? userGuess.toFixed(2) : null,
      winnerGuess: closestGuess?.guess.toFixed(2) || null,
      userRank: userRank || null,
      numberOfPlayers: result.Items?.length
    }),
  };
};
