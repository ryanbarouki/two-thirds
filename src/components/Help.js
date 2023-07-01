import styled from 'styled-components';
import { useState } from 'react';
import { RiCloseLine } from "react-icons/ri";
import { FiHelpCircle } from 'react-icons/fi';

const Background = styled.div`
  background-color: rgba(0, 0, 0, 0.2);
  width: 100vw;
  height: 100vh;
  z-index: 999;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  position: absolute;
`;

const Centered = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const Modal = styled.div`
  width: 330px;
  height: 210px;
  background: white;
  color: white;
  z-index: 1000;
  border-radius: 16px;
  box-shadow: 0 5px 20px 0 rgba(0, 0, 0, 0.04);
  overflow: auto;
`

const ModalHeader = styled.div`
  height: 50px;
  background: white;
  overflow: hidden;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
`;

const Heading = styled.h5`
  margin: 0;
  padding: 15px;
  color: #2c3e50;
  font-weight: 500;
  font-size: 18px;
  text-align: center;
`;

const ModalContent = styled.div`
  padding: 0 10px;
  font-size: 14px;
  color: #2c3e50;
  text-align: center;
  p {
    margin: 0;
  }
`;

const ModalActions = styled.div`
  position: absolute;
  bottom: 2px;
  margin-bottom: 10px;
  width: 100%;
`;

const ActionsContainer = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
`;

const CloseButton = styled.button`
  cursor: pointer;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 8px;
  border: none;
  font-size: 18px;
  color: #2c3e50;
  background: white;
  transition: all 0.25s ease;
  box-shadow: 0 5px 20px 0 rgba(0, 0, 0, 0.06);
  position: absolute;
  right: 0;
  top: 0;
  align-self: flex-end;
  margin-top: -7px;
  margin-right: -7px;
  :hover{
    box-shadow: 0 5px 20px 0 rgba(0, 0, 0, 0.04);
    transform: translate(-4px, 4px);
  }
`;

const DeleteButton = styled.button`
  margin-top: 10px;
  cursor: pointer;
  font-weight: 500;
  font-family: inherit;
  padding: 11px 28px;
  border-radius: 12px;
  font-size: 0.8rem;
  border: none;
  color: #fff;
  background: var(--primary-button-unpressed);
  transition: all 0.25s ease;
  :hover{
    box-shadow: 0 10px 20px -10px rgba(142, 209, 195, 0.6);
    transform: translateY(-5px);
    background: #8ddbca;
  }
`;

const List = styled.ol`
  text-align: left;
`;

export const Help = () => {
  const [show, setShow] = useState(false);

  return (
    <>
      <FiHelpCircle size={30} onClick={() => setShow(true)} />
      {show &&
        <Background>
          <Centered>
            <Modal>
              <ModalHeader>
                <Heading>
                  How to play
                </Heading>
              </ModalHeader>
              <CloseButton onClick={() => setShow(false)}>
                <RiCloseLine style={{ marginBottom: "-3px", color: "black", marginLeft: 0 }} />
              </CloseButton>
              <ModalContent>
                <List>
                  <li><strong>The goal:</strong> The aim of the game is to guess a number between 0-100 that is two-thirds of the average of all guesses made by players.</li>
                  <br/>
                  <li><strong>Enter a unique username:</strong> You'll need to input a unique username for each day you play. This allows us to keep track of your guess and compare it with others.</li>
                  <br/>
                  <li><strong>Submit your guess:</strong> Each day, you'll have the opportunity to submit one guess. The guess should be a number you think will be closest to two-thirds of the average of all guesses for that day.</li>
                  <br/>
                  <li><strong>Check back for results:</strong> Results are calculated and displayed the following day, so make sure to check back! You'll be able to see the average of all guesses, the target number (two-thirds of the average), and how your own guess compared.</li>
                  <br/>
                  <li><strong>Strategize and guess again:</strong> Over time, you may begin to notice patterns or develop a strategy. Feel free to adjust your guess each day based on past results or your own intuition. Good luck!</li>
                </List>
              </ModalContent>
            </Modal>
          </Centered>
        </Background>
      }
    </>
  )
}
