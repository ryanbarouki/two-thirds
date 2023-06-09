import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background-color: #fff;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
`;

export const Label = styled.label`
  font-size: 1rem;
  margin-bottom: 1rem;
`;

export const Input = styled.input`
  width: 100%;
  max-width: 200px;
  padding: 0.5rem;
  margin-bottom: 1rem;
  font-size: 1rem;
  border: 1px solid #ccc;
`;

export const Button = styled.button`
  padding: 0.5rem 1rem;
  font-size: 1rem;
  color: #fff;
  background-color: #007bff;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;

  &:hover {
    background-color: #0056b3;
  }
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

export const TableHeader = styled.th`
  font-weight: bold;
  text-align: left;
  padding: 0.5rem;
  border-bottom: 1px solid #ccc;
`;

export const TableCell = styled.td`
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
`;

export const SectionTitle = styled.h2`
  margin-top: 3rem;
  margin-bottom: 1rem;
`;