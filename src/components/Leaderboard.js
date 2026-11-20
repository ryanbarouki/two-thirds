import { formatGuess } from '../utils';

export default function Leaderboard({ data, username }) {
  return (
    <section className="card leaderboard" aria-labelledby="leaderboard-title">
      <h2 id="leaderboard-title">Top guesses</h2>
      <table aria-labelledby="leaderboard-title">
        <thead><tr><th scope="col">Rank</th><th scope="col">Player</th><th scope="col">Guess</th></tr></thead>
        <tbody>
          {data.map(entry => (
            <tr key={entry.username} className={entry.username === username ? 'own-row' : undefined}>
              <td>{entry.rank}</td>
              <th scope="row">{entry.username}{entry.username === username && <span className="you-tag">You</span>}</th>
              <td>{formatGuess(entry.guess)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
