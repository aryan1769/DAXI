import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useUser } from './UserContext'; // Import UserContext
import {
    Button,
    List,
    ListItem,
    ListItemText,
    Typography,
    Box,
    CircularProgress,
    AppBar,
    Toolbar,
    IconButton,
    CssBaseline,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // Back button icon
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import CachedIcon from '@mui/icons-material/Cached'; // Taxi icon

const DriverHistory = () => {
    const { user } = useUser(); // Access user from context
    const userAddress = user?.ethereumAddress; // Get user's Ethereum address
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const fetchDriverRides = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/driverHistory/${userAddress}`);
            setRides(response.data);
        } catch (err) {
            console.error('Error fetching driver history:', err);
            setError('Failed to load driver history.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        // Fetch driver's accepted rides
      

        if (userAddress) {
            fetchDriverRides();
        } else {
            setError('User address not found. Please log in.');
            setLoading(false);
        }
    }, [userAddress]);

    if (loading) return <CircularProgress />;
    if (error) return <Typography color="error">{error}</Typography>;

    return (
        <Box>
            <CssBaseline />

            {/* Header */}
            <AppBar position="static" color="primary">
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={() => navigate('/driver')} aria-label="back">
                        <ArrowBackIcon />
                    </IconButton>
                    <LocalTaxiIcon sx={{ mr: 1 }} />
                    <Typography
                        variant="h6"
                        sx={{
                            flexGrow: 1,
                            fontSize: { xs: '1.2rem', sm: '1.5rem' },
                        }}
                    >
                        Driver History
                    </Typography>
                    <IconButton edge="end" color="inherit" onClick={() => { fetchDriverRides() }} aria-label="back">
                        <CachedIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* Driver History List */}
            <Box sx={{ maxWidth: 600, margin: '0 auto', padding: 2, marginTop: 2 }}>
                {rides.length === 0 ? (
                    <Typography>No rides found.</Typography>
                ) : (
                    <List>
                        {rides.map((ride) => (
                            <ListItem
                                key={ride.rideId}
                                sx={{
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 4,
                                    marginBottom: 2,
                                    padding: 2,
                                    backgroundColor: ride.isCompleted
                                        ? '#d4edda' // Green for completed rides
                                        : '#fffbe6', // Yellow for ongoing rides
                                }}
                            >
                                <ListItemText
                                    primary={`Ride ID: ${ride.rideId}`}
                                    secondary={
                                        <>
                                            <Typography variant="body2">
                                                <strong>Pickup:</strong> {ride.pickupLocation}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Drop:</strong> {ride.dropLocation}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Price:</strong> {ride.price} ETH
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Distance:</strong> {ride.distance} km
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Status:</strong>{' '}
                                                {ride.isCompleted ? 'Completed' : 'Ongoing'}
                                            </Typography>
                                        </>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </Box>
        </Box>
    );
};

export default DriverHistory;
