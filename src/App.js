import React, { useEffect, useState, useSyncExternalStore } from 'react';
import GameForm from './components/GameForm';
import Leaderboard from './components/Leaderboard';
import Results from './components/Results';
import { Container, Title } from './styles/StyledComponents';
import axios from 'axios';
import { getYesterdaysUsername, getTodaysUsername } from './save_local';
import CountdownTimer from './components/CountdownTimer';
import { getNextOccurrence } from './utils';
import styled from 'styled-components';

const Subheader = styled.div`
  font-weight: 400;
  font-size: 1.2rem;
`;

const SubmittedContainer = styled(Container)`
  gap: 0.5rem;
`;

const App = () => {
  const [previousDayResults, setPreviousDayResults] = useState({
    averageGuess: 'No data',
    target: 'No data',
    winnerGuess: 'No data',
    userGuess: 'No data'
  });

  const [userGuess, setUserGuess] = useState(null);
  const [timeToNext, setTimeToNext] = useState(getNextOccurrence(24));

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
      console.log("fetching prev results");
    },
  [timeToNext]);

  const handleCountdownEnd = () => {
    setTimeToNext(getNextOccurrence(24));
  };

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

        {
          getTodaysUsername() === '' ?

            <GameForm onSubmit={handleSubmitGuess} />
            :
            <SubmittedContainer>
              <Subheader>Come back in</Subheader>
              <CountdownTimer targetDate={timeToNext.getTime()} handleCountdownEnd={handleCountdownEnd} />
              <Subheader>to see your score and play again!</Subheader>
            </SubmittedContainer>
        }

        <Results
          previousDayResults={previousDayResults}
        />
      </Container>
    </>
  );
};

export default App;