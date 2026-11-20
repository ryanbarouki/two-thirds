import { useEffect, useState } from 'react';
import axios from 'axios';
import { FiClock, FiLock, FiUsers } from 'react-icons/fi';
import GameForm from './components/GameForm';
import Leaderboard from './components/Leaderboard';
import Results from './components/Results';
import { InviteFriends } from './components/Share';
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
  const [roundCount, setRoundCount] = useState(null);
  const [countRefresh, setCountRefresh] = useState(0);
  const entry = getEntry(entries, day);
  const guessCount = roundCount?.day === day ? roundCount.count : null;
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

  useEffect(() => {
    const url = endpoint('round-count');
    if (!url) return;

    const controller = new AbortController();
    axios.get(url, { signal: controller.signal, timeout: 10000 }).then(({ data }) => {
      if (controller.signal.aborted || data.day !== day || !Number.isSafeInteger(data.count) || data.count < 0) return;
      setRoundCount(previous => previous?.day === day && previous.count > data.count ? previous : data);
    }).catch(() => {
      // A temporarily unavailable count should not interrupt play.
    });
    return () => controller.abort();
  }, [day, countRefresh]);

  const submitGuess = async ({ username, guess, requestId }) => {
    const url = endpoint('submit-guess');
    if (!url) throw new Error('The game server is not configured.');
    try {
      const { data } = await axios.post(url, { username, guess, day, requestId }, { timeout: 10000 });
      setEntries(saveEntry(data.day, { username, guess }));
      setCountRefresh(value => value + 1);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Could not confirm your guess. Please try again.');
    }
  };

  return (
    <main className="shell">
      <header className="masthead">
        <div className="wordmark"><span className="brand-mark" aria-hidden="true">⅔</span> Two Thirds</div>
        <div className="round-status">
          <div className="round-indicator"><span aria-hidden="true" /><time dateTime={day}>{formatDay(day)} UTC</time></div>
          {!entry && (
            <div className="card-meta round-clock"><FiClock aria-hidden="true" /> Closes in
              <CountdownTimer now={now} deadline={nextRound} />
            </div>
          )}
        </div>
      </header>

      <div className="game-layout">
        <section className="card play-card" aria-labelledby="play-title">
          <div className="play-header">
            <h1 id="play-title">{entry ? 'Guess locked in.' : <>Can <em>you</em> outwit the crowd?</>}</h1>
            {!entry && (
              <details className="how-to-play">
                <summary>How to play</summary>
                <p>Pick a number from 0 to 100. Closest to two-thirds of today’s average wins.</p>
                <p>If the average is <b>60</b>, the target is <b>40</b>. You get one guess per round.</p>
              </details>
            )}
          </div>
          <div className="play-body">
            {guessCount !== null && (
              <p className="round-count" role="status">
                <FiUsers aria-hidden="true" />
                {guessCount.toLocaleString()} {guessCount === 1 ? 'guess' : 'guesses'} so far
              </p>
            )}
            {entry ? (
              <>
                <div className="locked-guess" role="status">
                  <FiLock aria-hidden="true" />
                  <div><strong>{entry.guess == null ? 'Entry confirmed' : formatGuess(entry.guess)}</strong>
                    <span>Playing as {entry.username}</span></div>
                  <div className="receipt-clock">
                    <span>Results in</span><CountdownTimer now={now} deadline={nextRound} />
                  </div>
                </div>
                <InviteFriends />
              </>
            ) : (
              <GameForm key={day} onSubmit={submitGuess} initialUsername={getLastUsername(entries, day)} />
            )}
          </div>
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
