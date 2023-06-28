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
      <SectionTitle>Yesterday's Leaderboard</SectionTitle>
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
              <TableCell>{entry.username}</TableCell>
              <TableCell>{entry.guess}</TableCell>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default Leaderboard;