import { useRef, useState } from 'react';

export default function GameForm({ onSubmit, initialUsername }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(null);

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
        <label htmlFor="guess">Your guess</label>
        <div className="guess-input">
          <input id="guess" name="guess" type="number" inputMode="decimal" min="0" max="100"
            step="0.01" placeholder="0–100" required />
        </div>
        <label htmlFor="username">Username</label>
        <input id="username" name="username" autoComplete="nickname" defaultValue={initialUsername}
          pattern="[a-zA-Z0-9]+" maxLength={32} title="Use up to 32 letters or numbers" required />
        <button className="primary-button" type="submit">{pending ? 'Locking in…' : 'Lock in my guess'}</button>
      </fieldset>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}
