import { SectionTitle } from '../styles/StyledComponents';

const Results = ({ previousDayResults }) => {
  // ...
  return (
    <div>
      <SectionTitle>Yesterday's Results</SectionTitle>
      <p>Average Guess: {previousDayResults.averageGuess ?? "🤔"}</p>
      <p>2/3 Target: {previousDayResults.target ?? "🤔"}</p>
      <p>Winner's Guess: {previousDayResults.winnerGuess ?? "🤔"}</p>
      <p>Your Guess: {previousDayResults.userGuess ?? "🤔"}</p>
    </div>
  );
};

export default Results;