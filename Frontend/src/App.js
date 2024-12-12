import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './Login';
import RiderPage from './RiderPage';
import DriverPage from './DriverPage';
import { CssBaseline } from '@mui/material';
import RiderHistory from './RiderHistory'
import DriverHistory from './DriverHistory';
import RegistrationPage from './RegistrationPage'

function App() {
  return (
    <>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/rider" element={<RiderPage />} />
          <Route path="/driver" element={<DriverPage />} />
          <Route path="/riderHistory" element={<RiderHistory />} />
          <Route path="/driverHistory" element={<DriverHistory />} />
          <Route path="/register" element={<RegistrationPage />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
