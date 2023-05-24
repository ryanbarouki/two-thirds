import { useState } from 'react';
import { Form, Label, Input, Button } from '../styles/StyledComponents';

const GameForm = ({ onSubmit }) => {
  // ...
  const [guess, setGuess] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(username, parseInt(guess, 10));
    setGuess('');
    setUsername('');
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Label htmlFor="username">Enter a username:</Label>
      <Input
        type="text"
        id="username"
        name="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <Label htmlFor="guess">Enter your guess (0-100):</Label>
      <Input
        type="number"
        id="guess"
        name="guess"
        value={guess}
        min="0"
        max="100"
        onChange={(e) => setGuess(e.target.value)}
        required
      />
      <Button type="submit">Submit Your Guess</Button>
    </Form>
  );
};

export default GameForm;