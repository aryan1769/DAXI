import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#121212',
        color: '#fff',
      }}
    >
      {/* Animated Daxi Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5 }}
        style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          marginBottom: '20px',
          color: '#fdd835', // Yellow color
        }}
      >
        Daxi
      </motion.div>

      {/* Decentralized Taxi Animation */}
      <motion.div
        initial={{ x: '-100vw' }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 50 }}
        style={{ fontSize: '1.2rem', marginBottom: '30px', textAlign: 'center' }}
      >
        Decentralized Taxi Service
      </motion.div>

      {/* Login Button */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={handleLoginClick}
          sx={{
            backgroundColor: '#fdd835',
            color: '#000',
            '&:hover': {
              backgroundColor: '#c6a700',
            },
          }}
        >
          Login
        </Button>
      </motion.div>
    </Box>
  );
};

export default LandingPage;
