import React, { useState } from 'react';
import {
    TextField,
    Button,
    Typography,
    Box,
    IconButton,
    InputAdornment,
    CircularProgress,
    AppBar,
    Toolbar,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const RegistrationPage = () => {
    const [username, setUsername] = useState('');
    const [ethereumAddress, setEthereumAddress] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('rider');
    const [showPassword, setShowPassword] = useState(false);
    const [loadingValidation, setLoadingValidation] = useState(false);
    const [addressError, setAddressError] = useState('');

    const navigate = useNavigate();

    const handleTogglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    const validateEthereumAddress = async () => {
        if (!ethereumAddress) {
            setAddressError('Ethereum address is required.');
            return false;
        }

        setLoadingValidation(true);
        setAddressError('');

        try {
            const response = await axios.post('http://localhost:5000/validateEthereumAddress', {
                ethereumAddress,
            });

            if (!response.data.valid) {
                setAddressError('Ethereum address is either invalid or already in use.');
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error validating Ethereum address:', error);
            setAddressError('Error validating Ethereum address.');
            return false;
        } finally {
            setLoadingValidation(false);
        }
    };

    const handleRegister = async () => {
        const isAddressValid = await validateEthereumAddress();

        if (!isAddressValid) return;

        if (!username || !password || !role) {
            alert('All fields are required.');
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/register', {
                username,
                ethereumAddress,
                password,
                role,
            });
            alert('User registered successfully!');
            navigate('/'); // Redirect to login after successful registration
        } catch (error) {
            console.error('Error during registration:', error);
            alert(error.response?.data || 'Registration failed.');
        }
    };

    return (
        <Box>
            {/* AppBar Header with Back Button */}
            <AppBar position="static" color="primary">
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={() => navigate('/')}
                        aria-label="back"
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        Registration
                    </Typography>
                </Toolbar>
            </AppBar>

            {/* Registration Form */}
            <Box sx={{ maxWidth: 400, margin: '50px auto', padding: 2, boxShadow: 3, borderRadius: 2 }}>
                <Typography variant="h5" sx={{ mb: 2, textAlign: 'center' }}>
                    User Registration
                </Typography>

                <TextField
                    fullWidth
                    label="Username"
                    variant="outlined"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    sx={{ mb: 2 }}
                />

                <TextField
                    fullWidth
                    label="Ethereum Address"
                    variant="outlined"
                    value={ethereumAddress}
                    onChange={(e) => setEthereumAddress(e.target.value)}
                    onBlur={validateEthereumAddress} // Validate on blur
                    error={!!addressError}
                    helperText={addressError}
                    sx={{ mb: 2 }}
                />

                <TextField
                    fullWidth
                    label="Password"
                    variant="outlined"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={{ mb: 2 }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={handleTogglePasswordVisibility}>
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                        Select Role:
                    </Typography>
                    <Button
                        variant={role === 'rider' ? 'contained' : 'outlined'}
                        onClick={() => setRole('rider')}
                        sx={{ mr: 2 }}
                    >
                        Rider
                    </Button>
                    <Button
                        variant={role === 'driver' ? 'contained' : 'outlined'}
                        onClick={() => setRole('driver')}
                    >
                        Driver
                    </Button>
                </Box>

                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleRegister}
                    disabled={loadingValidation}
                >
                    {loadingValidation ? <CircularProgress size={20} /> : 'Register'}
                </Button>
            </Box>
        </Box>
    );
};

export default RegistrationPage;
     