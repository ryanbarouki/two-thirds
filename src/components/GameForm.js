import { useState, useMemo } from 'react';
import { Form, Label, Input, Button } from '../styles/StyledComponents';
import { saveUsername, getDayString } from '../save_local';


const GameForm = ({ onSubmit }) => {
  // ...
  const dayString = useMemo(getDayString, []);
  const [guess, setGuess] = useState('');
  const [username, setUsername] = useState('');
  const [disabled, setDisabled] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setDisabled(true);
    if (await onSubmit(username, parseFloat(guess, 10)) === true) {
      setGuess('');
      setUsername('');
      saveUsername(dayString, username);
    } else {
      setDisabled(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Input
        type="text"
        id="username"
        name="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder='Enter a username'
        pattern='[a-zA-Z0-9]+'
        title='Please enter only letters and numbers'
        disabled={disabled}
        required
      />
      <Input
        type="number"
        id="guess"
        name="guess"
        value={guess}
        min="0"
        max="100"
        step="0.01"
        onChange={(e) => setGuess(e.target.value)}
        placeholder='Enter your guess'
        disabled={disabled}
        required
      />
      <Button type="submit" disabled={disabled}>Guess!</Button>
    </Form>
  );
};

export default GameForm;