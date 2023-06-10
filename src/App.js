import React, { useEffect, useState } from 'react';
import GameForm from './components/GameForm';
import Leaderboard from './components/Leaderboard';
import Results from './components/Results';
import { Container, Title } from './styles/StyledComponents';
import axios from 'axios';
import { getYesterdaysUsername } from './save_local';
import CountdownTimer from './components/CountdownTimer';

const App = () => {
  const [previousDayResults, setPreviousDayResults] = useState({
    averageGuess: 'No data',
    target: 'No data',
    winnerGuess: 'No data',
    userGuess: 'No data'
  });

  const [userGuess, setUserGuess] = useState(null);

  const [leaderboardData] = useState([
    { username: 'player1', wins: 5 },
    { username: 'player2', wins: 3 },
    { username: 'player3', wins: 2 },
  ]);

  const timeToMidnight = new Date();
  timeToMidnight.setUTCHours(24,0,0,0);

  useEffect(() => {
      const fetchPrevResults = async () => {
        axios.post(process.env.REACT_APP_API_ENDPOINT + 'previous-results',
        {
          username: getYesterdaysUsername()
        })
        .then(response => setPreviousDayResults(response.data))
        .catch(error => console.error('There was an error!', error));
      };
      fetchPrevResults();
    },
  []);

  const handleSubmitGuess = async (username, guess) => {
    setUserGuess(guess);
    console.log(process.env.REACT_APP_API_ENDPOINT + '/submit-guess')
    try {
      const response = await axios.post(
        process.env.REACT_APP_API_ENDPOINT + '/submit-guess',
        {
          username: username,
          guess: guess,
        }
      );
      console.log(response.data.message);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Container>
        <Title>2/3</Title>
        <GameForm onSubmit={handleSubmitGuess} />
        <CountdownTimer targetDate={timeToMidnight.getTime()} />
        <Results
          previousDayResults={previousDayResults}
        />
      </Container>
    </>
  );
};

export default App;