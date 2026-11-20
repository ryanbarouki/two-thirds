import { useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { FiShare2 } from 'react-icons/fi';
import { formatGuess } from '../utils';

export function InviteFriends() {
  const [copyMode, setCopyMode] = useState(() => typeof navigator.share !== 'function');
  const [feedback, setFeedback] = useState('');
  const url = window.location.origin + window.location.pathname;

  const shareInvite = async () => {
    setFeedback('');
    try {
      await navigator.share({
        title: 'Two Thirds',
        text: 'I just played Two Thirds. Can you outwit the crowd?',
        url,
      });
    } catch (error) {
      if (error?.name === 'AbortError') return;
      const copied = await navigator.clipboard?.writeText(url).then(() => true, () => false);
      if (copied) {
        setFeedback('copied');
      } else {
        setCopyMode(true);
        setFeedback('use-copy');
      }
    }
  };

  return (
    <div className="invite">
      {copyMode ? (
        <CopyToClipboard text={url} onCopy={(_, success) => setFeedback(success ? 'copied' : 'copy-failed')}>
          <button className="primary-button" type="button"><FiShare2 aria-hidden="true" /> Copy invite link</button>
        </CopyToClipboard>
      ) : (
        <button className="primary-button" type="button" onClick={shareInvite}>
          <FiShare2 aria-hidden="true" /> Invite friends
        </button>
      )}
      <p className="invite-status" role="status">
        {feedback === 'copied' && 'Invite link copied.'}
        {feedback === 'use-copy' && 'Use Copy invite link to share the game.'}
        {feedback === 'copy-failed' && 'Select and copy the game link below.'}
      </p>
      {feedback === 'copy-failed' && (
        <input className="invite-link" aria-label="Game link" value={url} readOnly onFocus={event => event.currentTarget.select()} />
      )}
    </div>
  );
}

export function Share({ day, guess, rank, total }) {
  const [status, setStatus] = useState('');
  const round = 1 + (Date.parse(day) - Date.parse('2023-06-29')) / 86400000;
  const text = [
    '#TwoThirds #' + round,
    'I guessed ' + formatGuess(guess) + ' and placed ' + rank + ' of ' + total + '.',
    'https://www.twothirds.app',
  ].join('\n');

  return (
    <div className="share">
      <CopyToClipboard text={text} onCopy={(_, success) => setStatus(success ? 'Copied!' : 'Could not copy the score.')}>
        <button className="secondary-button" type="button"><FiShare2 aria-hidden="true" /> Share score</button>
      </CopyToClipboard>
      <span role="status">{status}</span>
    </div>
  );
}
