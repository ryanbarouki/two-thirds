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
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Share } from './components/Share';
import { Help } from './components/Help';

const Subheader = styled.div`
  font-weight: 400;
  font-size: 1.2rem;
  text-align: center;
`;

const SubmittedContainer = styled(Container)`
  gap: 0.5rem;
`;

const HowTo = styled.div`
  display: flex;
  svg{
    height: 1.5em;
    width: 1.5em;
    margin-left: 0.5em;
    color: white;
  }
`;

const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
`;

const App = () => {
  const [previousDayResults, setPreviousDayResults] = useState({
    averageGuess: '⌛',
    target: '⌛',
    winnerGuess: '⌛',
  });

  const [userGuess, setUserGuess] = useState(null);
  const [timeToNext, setTimeToNext] = useState(getNextOccurrence(24));
  const [submitted, setSubmitted] = useState(getTodaysUsername() !== '');

  const [leaderboardData, setLeaderboardData] = useState([]);
  const [prevUsername] = useState(getYesterdaysUsername());


  useEffect(() => {
      const fetchPrevResults = async () => {
        axios.post(process.env.REACT_APP_API_ENDPOINT + 'previous-results',
        {
          username: prevUsername
        })
        .then(response => setPreviousDayResults(response.data))
        .catch(error => console.error('Error when fetching previous results', error));
      };

      const fetchLeaderboard = async () => {
        axios.get(process.env.REACT_APP_API_ENDPOINT + 'leaderboard')
        .then(response => setLeaderboardData(response.data))
        .catch(error => console.error('Error when fetching leaderboard', error))
      };
      fetchPrevResults();
      fetchLeaderboard();
    },
  [timeToNext]);

  const handleCountdownEnd = () => {
    setTimeToNext(getNextOccurrence(24));
  };

  const handleSubmitGuess = async (username, guess) => {
    setUserGuess(guess);
    try {
      const response = await axios.post(
        process.env.REACT_APP_API_ENDPOINT + '/submit-guess',
        {
          username: username,
          guess: guess,
        }
      );
      toast.success(response.data.message);
      setSubmitted(true);
      return true;
    } catch (error) {
      toast.error(error.response.data.message);
      return false;
    }
  };

  return (
    <>
    <ToastContainer 
      position='top-center'
    />
      <Container>
        <Title>2/3</Title>
        <HowTo>How to play: <IconButton><Help/></IconButton></HowTo>

        {
          submitted ?

          <>
            <SubmittedContainer>
              <Subheader>Come back in</Subheader>
              <CountdownTimer targetDate={timeToNext.getTime()} handleCountdownEnd={handleCountdownEnd} />
              <Subheader>to see your score and play again!</Subheader>
            </SubmittedContainer>
            <Results
              previousDayResults={previousDayResults}
            />
            {
            previousDayResults.userGuess && 
            <Share
            guess={previousDayResults.userGuess}
            rank={previousDayResults.userRank}
            />
            }
            <Leaderboard 
            leaderboardData={leaderboardData}
            username={prevUsername}
            numberOfPlayers={previousDayResults.numberOfPlayers}
            />
          </>
            :
            <GameForm onSubmit={handleSubmitGuess} />
        }

      </Container>
    </>
  );
};

export default App;