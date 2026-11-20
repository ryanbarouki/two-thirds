import { useEffect, useState } from 'react';
import axios from 'axios';
import { FiCheck, FiClock } from 'react-icons/fi';
import GameForm from './components/GameForm';
import Leaderboard from './components/Leaderboard';
import Results from './components/Results';
import CountdownTimer from './components/CountdownTimer';
import { useRoundClock } from './hooks/useCountdown';
import { getEntry, getLastUsername, loadEntries, saveEntry } from './save_local';
import { formatDay, formatGuess, getDayString, shiftDay } from './utils';

const endpoint = path => {
  const apiBase = process.env.REACT_APP_API_ENDPOINT?.trim().replace(/\/+$/, '');
  return apiBase ? apiBase + '/' + path : null;
};

export default function App() {
  const now = useRoundClock();
  const day = getDayString(new Date(now));
  const nextRound = Date.parse(shiftDay(day, 1) + 'T00:00:00Z');
  const resultsDay = shiftDay(day, -1);
  const [entries, setEntries] = useState(loadEntries);
  const [results, setResults] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const entry = getEntry(entries, day);
  const previousUsername = getEntry(entries, resultsDay)?.username ?? '';
  const currentResults = results?.day === resultsDay && results.username === previousUsername &&
    results.attempt === attempt ? results : null;
  const resultData = currentResults?.data;

  useEffect(() => {
    const sync = () => setEntries(loadEntries());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const url = endpoint('previous-results');
    const load = async () => {
      try {
        if (!url) throw new Error('The game server is not configured.');
        const { data } = await axios.post(url, { username: previousUsername }, {
          signal: controller.signal, timeout: 10000,
        });
        if (data.day !== resultsDay) throw new Error('Round results are out of sync. Try again shortly.');
        setResults({ day: resultsDay, username: previousUsername, attempt, data });
      } catch (error) {
        if (!controller.signal.aborted) {
          setResults({ day: resultsDay, username: previousUsername, attempt,
            error: error.response?.data?.message || 'Results are unavailable right now.' });
        }
      }
    };
    load();
    return () => controller.abort();
  }, [resultsDay, previousUsername, attempt]);

  const submitGuess = async ({ username, guess, requestId }) => {
    const url = endpoint('submit-guess');
    if (!url) throw new Error('The game server is not configured.');
    try {
      const { data } = await axios.post(url, { username, guess, day, requestId }, { timeout: 10000 });
      setEntries(saveEntry(data.day, { username, guess }));
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Could not confirm your guess. Please try again.');
    }
  };

  return (
    <main className="shell">
      <header className="masthead">
        <div className="wordmark"><span className="brand-mark" aria-hidden="true">⅔</span> Two Thirds</div>
        <div className="round-indicator"><span aria-hidden="true" /> Daily round <time dateTime={day}>{formatDay(day)} UTC</time></div>
      </header>

      <div className="game-layout">
        <section className="card play-card" aria-labelledby="play-title">
          <div className="card-meta"><FiClock aria-hidden="true" /> {entry ? 'Next round in' : 'Round closes in'}
            <CountdownTimer now={now} deadline={nextRound} />
          </div>
          <h1 id="play-title">{entry ? 'Guess locked in.' : 'Outsmart the crowd'}</h1>
          {entry ? (
            <div className="locked-guess" role="status">
              <FiCheck aria-hidden="true" />
              <div><strong>{entry.guess == null ? 'Entry confirmed' : formatGuess(entry.guess)}</strong>
                <span>Playing as {entry.username}. Results unlock at midnight UTC.</span></div>
            </div>
          ) : (
            <>
              <p className="intro">Pick a number from 0 to 100. Closest to two-thirds of today’s average wins.</p>
              <p className="example">If the average is <b>60</b>, the target is <b>40</b>.</p>
              <GameForm key={day} onSubmit={submitGuess} initialUsername={getLastUsername(entries, day)} />
            </>
          )}
        </section>

        <div className="round-summary">
          <Results result={resultData} day={resultsDay} error={currentResults?.error}
            onRetry={() => setAttempt(value => value + 1)} />
          {resultData?.leaderboard.length > 0 &&
            <Leaderboard data={resultData.leaderboard} username={previousUsername} />}
        </div>
      </div>

      <footer className="footer">One guess per round. Resets at midnight UTC.</footer>
    </main>
  );
}
