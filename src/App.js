import React, { useState } from 'react';
import GameForm from './components/GameForm';
import Leaderboard from './components/Leaderboard';
import Results from './components/Results';
import GlobalStyles from './styles/GlobalStyles';
import { Container } from './styles/StyledComponents';

const App = () => {
  // Dummy data for demonstration purposes
  const [leaderboardData] = useState([
    { username: 'player1', wins: 5 },
    { username: 'player2', wins: 3 },
    { username: 'player3', wins: 2 },
  ]);

  const [previousDayResults] = useState({
    averageGuess: 50,
    target: 33,
    winnerGuess: 32,
  });

  const [userGuess, setUserGuess] = useState(null);

  const handleSubmitGuess = (guess) => {
    setUserGuess(guess);
    // TODO: Submit the guess to the server
  };

  return (
    <>
      <GlobalStyles />
      <Container>
        <h1>TwoThirds</h1>
        <GameForm onSubmit={handleSubmitGuess} />
        <Results
          previousDayResults={previousDayResults}
          userGuess={userGuess}
        />
        <Leaderboard leaderboardData={leaderboardData} />
      </Container>
    </>
  );
};

export default App;