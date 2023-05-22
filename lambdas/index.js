const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.submitGuess = async (event) => {
  const { username, guess } = JSON.parse(event.body);
  const params = {
    TableName: process.env.GUESSES_TABLE_NAME,
    Item: { username, guess, timestamp: new Date().toISOString() },
  };

  await dynamoDb.put(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Guess submitted successfully' }),
  };
};

exports.getLeaderboard = async (event) => {
  // Query DynamoDB for leaderboard data
  const params = {
    TableName: process.env.GUESSES_TABLE_NAME,
    IndexName: 'WinsIndex',
    KeyConditionExpression: 'wins > :wins',
    ExpressionAttributeValues: { ':wins': 0 },
    ScanIndexForward: false,
  };

  const result = await dynamoDb.query(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify(result.Items),
  };
};

exports.getPreviousResults = async (event) => {
  // Query DynamoDB for previous day's results
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const params = {
    TableName: process.env.GUESSES_TABLE_NAME,
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

exports.endGame = async (event) => {
  // Assume event.body contains an array of all the game guesses
  const guesses = JSON.parse(event.body);
  const averageGuess = guesses.reduce((a, b) => a + b, 0) / guesses.length;
  const target = averageGuess * 2 / 3;

  let winner = null;
  let smallestDifference = Infinity;
  for (let guess of guesses) {
    let difference = Math.abs(guess.number - target);
    if (difference < smallestDifference) {
      smallestDifference = difference;
      winner = guess.username;
    }
  }

  const params = {
    TableName: process.env.GUESSES_TABLE_NAME,
    Key: { username: winner },
    UpdateExpression: "ADD wins :inc",
    ExpressionAttributeValues: {
      ":inc": 1
    },
    ReturnValues: "UPDATED_NEW"
  };

  await dynamoDb.update(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Game ended', winner })
  };
};
