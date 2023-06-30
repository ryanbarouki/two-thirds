import {
  Table,
  TableHeader,
  TableCell,
  SectionTitle,
  Label,
} from '../styles/StyledComponents';

const Leaderboard = ({ leaderboardData, username }) => {
  // ...
  return (
    <div>
      <SectionTitle>Yesterday's top 10 players</SectionTitle>
      <Table>
        <thead>
          <tr>
            <TableHeader>Username</TableHeader>
            <TableHeader>Guess</TableHeader>
          </tr>
        </thead>
        <tbody>
          {leaderboardData.map((entry, index) => (
            <tr key={index}>
              <TableCell>{entry.username}{entry.username === username ? <strong> (You)</strong> : ""}</TableCell>
              <TableCell>{entry.guess}</TableCell>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default Leaderboard;