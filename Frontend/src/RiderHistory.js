import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useUser } from './UserContext'; // Import the UserContext
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

const RiderHistory = () => {
    const { user } = useUser(); // Access user from context
    const userAddress = user?.ethereumAddress; // Get user's Ethereum address
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const fetchRideHistory = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/rideHistory/${userAddress}`);
            setRides(response.data);
        } catch (err) {
            console.error('Error fetching ride history:', err);
            setError('Failed to load ride history.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        // Fetch ride history


        if (userAddress) {
            fetchRideHistory();
        } else {
            setError('User address not found. Please log in.');
            setLoading(false);
        }
    }, [userAddress]);

    // Cancel ride function
    const cancelRide = async (rideId) => {
        try {
            await axios.post('http://localhost:5000/cancelRide', { rideId, senderAddress: userAddress });
            alert(`Ride ${rideId} canceled successfully.`);
            // Update ride state after cancellation
            setRides((prevRides) =>
                prevRides.map((ride) =>
                    ride.rideId === rideId
                        ? { ...ride, isCancelled: true }
                        : ride
                )
            );
        } catch (err) {
            console.error(`Error canceling ride ${rideId}:`, err);
            alert('Failed to cancel ride.');
        }
    };

    // Complete ride function
    const completeRide = async (rideId) => {
        try {
            await axios.post('http://localhost:5000/completeRide', { rideId, senderAddress: userAddress });
            alert(`Ride ${rideId} completed successfully.`);
            // Update ride state after completion
            setRides((prevRides) =>
                prevRides.map((ride) =>
                    ride.rideId === rideId
                        ? { ...ride, isCompleted: true }
                        : ride
                )
            );
        } catch (err) {
            console.error(`Error completing ride ${rideId}:`, err);
            alert('Failed to complete ride.');
        }
    };

    if (loading) return <CircularProgress />;
    if (error) return <Typography color="error">{error}</Typography>;

    return (
        <Box>
            <CssBaseline />

            {/* Header */}
            <AppBar position="static" color="primary">
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={() => navigate('/rider')} aria-label="back">
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
                        Ride History
                    </Typography>
                    <IconButton edge="end" color="inherit" onClick={() => { fetchRideHistory() }} aria-label="back">
                        <CachedIcon />
                    </IconButton>

                </Toolbar>
            </AppBar>

            {/* Ride History List */}
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
                                    backgroundColor: ride.isCancelled
                                        ? '#f8d7da'
                                        : ride.isCompleted
                                            ? '#d4edda'
                                            : ride.isAccepted
                                                ? '#fff3cd'
                                                : '#ffffff',
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
                                                {ride.isCancelled
                                                    ? 'Cancelled'
                                                    : ride.isCompleted
                                                        ? 'Completed'
                                                        : ride.isAccepted
                                                            ? 'Accepted'
                                                            : 'Pending'}
                                            </Typography>
                                        </>
                                    }
                                />
                                {!ride.isCompleted && !ride.isCancelled && ride.isAccepted && (
                                    <Button
                                        variant="contained"
                                        color="success"
                                        onClick={() => completeRide(ride.rideId)}
                                    >
                                        Complete Ride
                                    </Button>
                                )}
                                {!ride.isCompleted && !ride.isCancelled && !ride.isAccepted && (
                                    <Button
                                        variant="contained"
                                        color="error"
                                        onClick={() => cancelRide(ride.rideId)}
                                    >
                                        Cancel
                                    </Button>
                                )}
                            </ListItem>
                        ))}
                    </List>
                )}
            </Box>
        </Box>
    );
};

export default RiderHistory;
