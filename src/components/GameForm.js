import { useState, useMemo } from 'react';
import { Form, Label, Input, Button } from '../styles/StyledComponents';
import { saveUsername, getDayString } from '../save_local';


const GameForm = ({ onSubmit }) => {
  // ...
  const dayString = useMemo(getDayString, []);
  const [guess, setGuess] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(username, parseFloat(guess, 10));
    setGuess('');
    setUsername('');
    saveUsername(dayString, username);
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
        required
        placeholder='Enter your guess'
      />
      <Button type="submit">Guess!</Button>
    </Form>
  );
};

export default GameForm;