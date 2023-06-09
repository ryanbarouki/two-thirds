import React, { useEffect, useState } from 'react';
import GameForm from './components/GameForm';
import Leaderboard from './components/Leaderboard';
import Results from './components/Results';
import GlobalStyles from './styles/GlobalStyles';
import { Container } from './styles/StyledComponents';
import axios from 'axios';
import { getYesterdaysUsername } from './save_local';

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
      <GlobalStyles />
      <Container>
        <h1>TwoThirds</h1>
        <GameForm onSubmit={handleSubmitGuess} />
        <Results
          previousDayResults={previousDayResults}
        />
      </Container>
    </>
  );
};

export default App;