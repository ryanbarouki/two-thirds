import {
  Table,
  TableHeader,
  TableCell,
  SectionTitle,
  Label,
} from '../styles/StyledComponents';

const Leaderboard = ({ leaderboardData, username, numberOfPlayers }) => {
  // ...
  return (
    <div>
      <SectionTitle>Yesterday's top 10 players</SectionTitle>
      <Label>Number of players: <strong>{numberOfPlayers}</strong></Label>
      <Table>
        <thead>
          <tr>
            <TableHeader>#</TableHeader>
            <TableHeader>Username</TableHeader>
            <TableHeader>Guess</TableHeader>
          </tr>
        </thead>
        <tbody>
          {leaderboardData.map((entry, index) => (
            <tr key={index}>
              <TableCell>{index+1}</TableCell>
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