import { useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { FiShare2 } from 'react-icons/fi';
import { formatGuess } from '../utils';

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
