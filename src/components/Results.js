import { SectionTitle, Result } from '../styles/StyledComponents';

const Results = ({ previousDayResults }) => {
  // ...
  return (
    <div>
      <SectionTitle>Yesterday's Results</SectionTitle>
      <p>Average Guess: <Result>{previousDayResults.averageGuess ?? "🤔"}</Result></p>
      <p>2/3 Target: <Result>{previousDayResults.target ?? "🤔"}</Result></p>
      <p>Winner's Guess: <Result>{previousDayResults.winnerGuess ?? "🤔"}</Result></p>
      <p>Your Guess: <Result>{previousDayResults.userGuess ?? "🤔"}</Result></p>
    </div>
  );
};

export default Results;