const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.submitGuess = async (event) => {
  const { username, guess } = JSON.parse(event.body);
  const params = {
    TableName: 'TwoThirdsDailyGuesses',
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
    TableName: 'TwoThirdsDailyGuesses',
    FilterExpression: 'begins_with(timestamp, :date)',
    ExpressionAttributeValues: {
      ':date': yesterdayString,
    },
  };

  try {
    const data = await dynamoDb.scan(params).promise();
    const guessItems = data.Items;

    const averageGuess = guessItems.reduce((total, item) => total + item.guess, 0) / guessItems.length;
    const target = averageGuess * (2 / 3);

    guessItems.forEach(item => {
      item.distance = Math.abs(target - item.guess);
    });

    // Sort users by their distance to the target, in ascending order
    guessItems.sort((a, b) => a.distance - b.distance);

    // Extract leaderboard information (top 10)
    const leaderboard = guessItems.slice(0, 10).map(item => ({ username: item.username, guess: item.guess, distance: item.distance }));

    return {
      statusCode: 200,
      body: JSON.stringify(leaderboard),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not retrieve leaderboard' }),
    };
  }
};

exports.getPreviousResults = async (event) => {
  // Query DynamoDB for previous day's results
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const params = {
    TableName: 'TwoThirdsDailyGuesses',
    KeyConditionExpression: 'timestamp = :yesterday',
    ExpressionAttributeValues: { ':yesterday': yesterday.toISOString() },
  };

  const result = await dynamoDb.query(params).promise();
  const guesses = result.Items.map((item) => item.guess);
  const averageGuess = guesses.reduce((a, b) => a + b, 0) / guesses.length;

  return {
    statusCode: 200,
    body: JSON.stringify({
      averageGuess,
      target: averageGuess * 2 / 3,
    }),
  };
};
