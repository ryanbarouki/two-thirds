import React from 'react';
import { useCountdown } from '../hooks/useCountdown';
import styled from 'styled-components';

const TimerContainer = styled.div`
  line-height: 1.25rem;
  padding: 0.5rem;
  align-items: center;
  justify-content: center;
  display: flex;
  flex-direction: row;
  text-decoration: none;
  gap: 1rem;
`;

const StyledDateTimeDisplay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const DateTimeDisplay = ({ value, type, isDanger }) => {
  return (
    <StyledDateTimeDisplay>
      <span>{value}</span>
      <span>{type}</span>
    </StyledDateTimeDisplay>
  );
};


const ShowCounter = ({ days, hours, minutes, seconds }) => {
  return (
    <TimerContainer>
        <DateTimeDisplay value={hours} type={'Hours'} isDanger={false} />
        <p>:</p>
        <DateTimeDisplay value={minutes} type={'Mins'} isDanger={false} />
        <p>:</p>
        <DateTimeDisplay value={seconds} type={'Seconds'} isDanger={false} />
    </TimerContainer>
  );
};

const CountdownTimer = ({ targetDate }) => {
  const [days, hours, minutes, seconds] = useCountdown(targetDate);

  return (
    <ShowCounter
      days={days}
      hours={hours}
      minutes={minutes}
      seconds={seconds}
    />
  );
};

export default CountdownTimer;