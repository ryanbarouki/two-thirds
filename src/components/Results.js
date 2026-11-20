import { formatDay, formatGuess } from '../utils';
import { FiBarChart2 } from 'react-icons/fi';
import { Share } from './Share';

function NumberLine({ markers }) {
  return (
    <div className="number-line">
      <div className="number-track" aria-hidden="true">
        {markers.map(({ name, value, color }) => (
          <span key={name} className={'number-marker ' + color} style={{ left: value + '%' }} />
        ))}
      </div>
      <div className="number-ticks" aria-hidden="true"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
      <dl className="result-legend">
        {markers.map(({ name, value, color }) => (
          <div key={name}><dt><span className={'legend-dot ' + color} />{name}</dt><dd>{formatGuess(value)}</dd></div>
        ))}
      </dl>
    </div>
  );
}

export default function Results({ result, day, error, onRetry }) {
  const played = result?.userGuess != null;
  const markers = result?.numberOfPlayers ? [
    { name: 'Crowd average', value: result.averageGuess, color: 'average' },
    { name: 'Target', value: result.target, color: 'target' },
    ...(played ? [{ name: 'Your guess', value: result.userGuess, color: 'your-guess' }] : []),
  ] : [];

  return (
    <section className="card results-card" aria-labelledby="results-title">
      <header className="results-header">
        <h2 id="results-title">Yesterday’s results</h2>
        <time className="card-meta" dateTime={day}>{formatDay(day)}</time>
      </header>
      {error ? <div className="results-status"><p>{error}</p><button className="secondary-button" onClick={onRetry}>Try again</button></div>
        : !result ? <p className="results-status" role="status">Loading results…</p>
        : !result.numberOfPlayers ? (
          <div className="results-status empty-results">
            <FiBarChart2 aria-hidden="true" />
            <p>No guesses were submitted yesterday.</p>
          </div>
        )
        : (
          <>
            {played ? (
              <div className="placement">
                <strong>You placed {result.userRank} of {result.numberOfPlayers}</strong>
                <span>{result.userDistance === 0 ? 'Right on target' : formatGuess(result.userDistance) + ' away from the target'}</span>
              </div>
            ) : <p className="player-count">{result.numberOfPlayers} {result.numberOfPlayers === 1 ? 'player' : 'players'}</p>}
            <NumberLine markers={markers} />
            {played && <Share day={day} guess={result.userGuess} rank={result.userRank} total={result.numberOfPlayers} />}
          </>
        )}
    </section>
  );
}
