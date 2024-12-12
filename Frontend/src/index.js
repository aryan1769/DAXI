import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import theme from './theme';
import { ThemeProvider } from '@mui/material/styles';
import { UserProvider } from './UserContext';

ReactDOM.render(
  <ThemeProvider theme={theme}>
    <UserProvider>
      <App />
    </UserProvider>
  </ThemeProvider>,
  document.getElementById('root')
);
