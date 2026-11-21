import { useState } from 'react';
import { FiMail } from 'react-icons/fi';

export default function ResultReminder({ requested, onRequest }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const register = async event => {
    event.preventDefault();
    if (pending) return;
    const { email } = Object.fromEntries(new FormData(event.currentTarget));
    setPending(true);
    setError('');
    try {
      await onRequest(email.trim());
    } catch (failure) {
      setError(failure.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="result-reminder">
      {requested ? <p role="status"><FiMail aria-hidden="true" /> Email reminder set for this round.</p> : (
        <details>
          <summary>Email me the results</summary>
          <form onSubmit={register}>
            <label htmlFor="reminder-email">Email address</label>
            <input id="reminder-email" name="email" type="email" autoComplete="email"
              maxLength={254} required disabled={pending} aria-describedby="reminder-note" />
            <button className="secondary-button" type="submit" disabled={pending}>
              {pending ? 'Saving…' : 'Set reminder'}
            </button>
            <p id="reminder-note">One email when this round’s results are ready.</p>
          </form>
          {error && <p className="error" role="alert">{error}</p>}
        </details>
      )}
    </div>
  );
}
