import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  TextField,
  Button,
  Box,
  Link,
  CssBaseline,
  Grid,
} from '@mui/material';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import { useUser } from './UserContext'; // Taxi Icon
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 


function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useUser(); // Access global state
  const navigate = useNavigate(); // React Router navigation

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !password) {
      setError('Please provide both username and password.');
      setLoading(false);
      return;
    }

    try {
      // API call to login endpoint
      const response = await axios.post('http://localhost:5000/login', {
        username,
        password,
      });

      const userDetails = response.data;

      // Store user info globally
      setUser(userDetails);

      // Navigate based on user role
      if (userDetails.role === 'rider') {
        navigate('/rider');
      } else if (userDetails.role === 'driver') {
        navigate('/driver');
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('Invalid username or password.');
      } else {
        setError('An error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <CssBaseline />

      {/* Header */}
      <AppBar position="static" color="primary" sx={{ mb: 4 }}>
        <Toolbar>
          <LocalTaxiIcon sx={{ mr: 1 }} />
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontSize: { xs: '1.2rem', sm: '1.5rem' },
            }}
          >
            Daxi - Decentralized Taxi
          </Typography>
          <Link
            href="#about-us"
            color="inherit"
            underline="hover"
            sx={{ display: { xs: 'none', sm: 'block' }, mx: 2 }}
          >
            About Us
          </Link>
          <Link
            href="#contact-us"
            color="inherit"
            underline="hover"
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            Contact Us
          </Link>
        </Toolbar>
      </AppBar>

      {/* Login Form */}
      <Container maxWidth="xs" sx={{ mt: 6 }}>
        <Box
          sx={{
            p: 3,
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h4"
            gutterBottom
            color="primary"
            sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
          >
            Login
          </Typography>
          <form onSubmit={handleLogin}>
            <TextField
              label="Username"
              variant="outlined"
              fullWidth
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <TextField
              label="Password"
              variant="outlined"
              fullWidth
              margin="normal"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && (
              <Typography
                color="error"
                variant="body2"
                sx={{ mt: 2 }}
              >
                {error}
              </Typography>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              onClick={() =>  navigate('/register')}
            >
              Register
            </Button>
          </form>
        </Box>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          mt: 8,
          py: 3,
          px: 2,
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
        >
          © {new Date().getFullYear()} Daxi - Decentralized Taxi. All Rights Reserved.
        </Typography>

        {/* Links visible only on mobile */}
        <Box
          sx={{
            mt: 2,
            display: { xs: 'flex', sm: 'none' }, // Show only on mobile (xs)
            justifyContent: 'center',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="#about-us"
            color="primary"
            underline="hover"
            sx={{ fontSize: '0.9rem' }}
          >
            About Us
          </Link>
          <Link
            href="#contact-us"
            color="primary"
            underline="hover"
            sx={{ fontSize: '0.9rem' }}
          >
            Contact Us
          </Link>
        </Box>
      </Box>
    </>
  );
}

export default Login;
