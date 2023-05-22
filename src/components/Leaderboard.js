import {
  Table,
  TableHeader,
  TableCell,
  SectionTitle,
} from '../styles/StyledComponents';

const Leaderboard = ({ leaderboardData }) => {
  // ...
  return (
    <div>
      <SectionTitle>Leaderboard</SectionTitle>
      <Table>
        <thead>
          <tr>
            <TableHeader>Username</TableHeader>
            <TableHeader>Wins</TableHeader>
          </tr>
        </thead>
        <tbody>
          {leaderboardData.map((entry, index) => (
            <tr key={index}>
              <TableCell>{entry.username}</TableCell>
              <TableCell>{entry.wins}</TableCell>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default Leaderboard;