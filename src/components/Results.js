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
            <TableData>2/3 Average:</TableData>
            <TableValue>{previousDayResults.target ?? "🤔"}</TableValue>
          </TableRow>
          { previousDayResults.userGuess && 
          <>
          <TableRow>
            <TableData><strong>Your Guess:</strong></TableData>
            <TableValue>{previousDayResults.userGuess ?? "🤔"}</TableValue>
          </TableRow>
          <TableRow>
            <TableData><strong>Your Rank:</strong></TableData>
            <TableValue>{previousDayResults.userRank ?? "🤔"}</TableValue>
          </TableRow>
          </>
          }
        </tbody>
      </ResultsTable>
    </div>
  );
};

export default Results;