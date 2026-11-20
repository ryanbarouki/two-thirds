import { useRef, useState } from 'react';
import { FiLock, FiMinus, FiPlus } from 'react-icons/fi';

export default function GameForm({ onSubmit, initialUsername }) {
  const [guess, setGuess] = useState('0');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(null);
  const hasGuess = guess !== '' && Number(guess) >= 0 && Number(guess) <= 100;
  const position = hasGuess ? Number(guess) : 0;

  const nudgeGuess = delta => {
    const hundredths = Math.min(10000, Math.max(0, Math.round(position * 100) + delta));
    setGuess(String(hundredths / 100));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (pending) return;

    const fields = new FormData(event.currentTarget);
    setPending(true);
    setError('');
    try {
      const username = fields.get('username');
      const guess = Number(fields.get('guess'));
      if (request.current?.username !== username || request.current?.guess !== guess) {
        request.current = { username, guess, requestId: window.crypto?.randomUUID?.() };
      }
      await onSubmit(request.current);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="guess-form">
      <fieldset disabled={pending}>
        <div className="guess-playfield" data-picked={hasGuess}>
          <label htmlFor="guess">Your guess</label>
          <div className="guess-readout">
            <button type="button" className="tuning-button" onClick={() => nudgeGuess(-1)}
              disabled={position === 0} aria-label="Decrease guess by 0.01">
              <FiMinus aria-hidden="true" />
            </button>
            <input id="guess" name="guess" className="guess-value" type="number" inputMode="decimal"
              min="0" max="100" step="0.01" placeholder="—" value={guess}
              onChange={event => setGuess(event.target.value)} aria-describedby="guess-hint" required />
            <button type="button" className="tuning-button" onClick={() => nudgeGuess(1)}
              disabled={position === 100} aria-label="Increase guess by 0.01">
              <FiPlus aria-hidden="true" />
            </button>
          </div>
          <div className="guess-ruler" style={{ '--guess-position': position + '%' }}>
            <input type="range" className="guess-scale" min="0" max="100" step="0.01"
              value={position} onChange={event => setGuess(event.currentTarget.value)}
              aria-label="Choose a guess on the number line" aria-describedby="guess-hint" />
            <div className="guess-ticks" aria-hidden="true">
              <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
            </div>
          </div>
          <p id="guess-hint">Drag the scale or type a number.</p>
        </div>
        <div className="guess-entry">
          <div className="username-field">
            <label htmlFor="username">Username</label>
            <input id="username" name="username" autoComplete="nickname" defaultValue={initialUsername}
              pattern="[a-zA-Z0-9]+" maxLength={32} title="Use up to 32 letters or numbers" required />
          </div>
          <button className="primary-button" type="submit">
            <FiLock aria-hidden="true" />{pending ? 'Locking in…' : 'Lock in my guess'}
          </button>
        </div>
      </fieldset>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}
