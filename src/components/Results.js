import { SectionTitle } from '../styles/StyledComponents';
import styled from 'styled-components';

const ResultsTable = styled.table`
  width: 100%;
  text-align: left;
  border-collapse: collapse;
`;

const TableRow = styled.tr`
  // Future styling
`;

const TableData = styled.td`
  padding: 8px;
  font-size: 1.2em;
`;

const TableValue = styled.td`
  padding: 8px;
  font-weight: 700;
  font-size: 1.5em;
  color: var(--secondary-text);
`;


const Results = ({ previousDayResults }) => {
  // ...
  return (
    <div>
      <SectionTitle>Yesterday's Results</SectionTitle>
      <ResultsTable>
        <tbody>
          <TableRow>
            <TableData>Average Guess:</TableData>
            <TableValue>{previousDayResults.averageGuess ?? "🤔"}</TableValue>
          </TableRow>
          <TableRow>
            <TableData>2/3 Target:</TableData>
            <TableValue>{previousDayResults.target ?? "🤔"}</TableValue>
          </TableRow>
          <TableRow>
            <TableData>Winner's Guess:</TableData>
            <TableValue>{previousDayResults.winnerGuess ?? "🤔"}</TableValue>
          </TableRow>
          <TableRow>
            <TableData>Your Guess:</TableData>
            <TableValue>{previousDayResults.userGuess ?? "🤔"}</TableValue>
          </TableRow>
        </tbody>
      </ResultsTable>
    </div>
  );
};

export default Results;