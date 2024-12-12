import React, { useEffect, useState } from 'react';
import {
    Container,
    Box,
    Typography,
    Button,
    CircularProgress,
} from '@mui/material';
import Header from './Header';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from './UserContext';
import ShowDirections from './ShowDirections'; // Import ShowDirections component

const DriverPage = () => {
    const [availableRides, setAvailableRides] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedRide, setSelectedRide] = useState(null); // Track the selected ride for directions

    const { user } = useUser();
    const navigate = useNavigate();

    const fetchAvailableRides = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:5000/getAvailableRides');
            setAvailableRides(response.data.availableRides || []);
        } catch (error) {
            console.error('Error fetching available rides:', error);
            alert('Failed to fetch available rides.');
        } finally {
            setLoading(false);
        }
    };

    const acceptRide = async (rideId) => {
        if (!user || !user.ethereumAddress) {
            alert('Driver address is required.');
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/acceptRide', {
                rideId,
                driverAddress: user.ethereumAddress,
            });
            alert('Ride accepted successfully!');
            fetchAvailableRides(); // Refresh available rides
        } catch (error) {
            console.error(`Error accepting ride ${rideId}:`, error);
            alert('Failed to accept ride.');
        }
    };

    useEffect(() => {
        fetchAvailableRides();
    }, []);

    const navItems = ['Ride History', 'Profile', 'Logout'];

    const handleMenuItemClick = (menuItem) => {
        if (menuItem === 'Logout') {
            navigate('/');
        } else if (menuItem === 'Ride History') {
            navigate('/driverHistory');
        }
    };

    return (
        <div>
            <Header
                navItems={navItems}
                onMenuItemClick={handleMenuItemClick}
                logoText="DAXI - Driver"
            />

            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Typography variant="h4" sx={{ mb: 4 }}>
                    Available Rides
                </Typography>

                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" sx={{ height: '200px' }}>
                        <CircularProgress />
                    </Box>
                ) : availableRides.length === 0 ? (
                    <Typography variant="body1" color="textSecondary">
                        No available rides at the moment.
                    </Typography>
                ) : (
                    availableRides.map((ride) => (
                        <Box
                            key={ride.rideId}
                            sx={{
                                mb: 3,
                                p: 2,
                                border: '1px solid #e0e0e0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                            }}
                        >
                            <Typography variant="body1">
                                <strong>Ride ID:</strong> {ride.rideId}
                            </Typography>
                            <Typography variant="body1">
                                <strong>Pickup Location:</strong> {ride.pickupLocation}
                            </Typography>
                            <Typography variant="body1">
                                <strong>Drop Location:</strong> {ride.dropLocation}
                            </Typography>
                            <Typography variant="body1">
                                <strong>Price:</strong> {ride.price} ETH
                            </Typography>
                            <Typography variant="body1">
                                <strong>Distance:</strong> {ride.distance} km
                            </Typography>
                            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => acceptRide(ride.rideId)}
                                >
                                    Accept Ride
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    onClick={() => setSelectedRide(ride)}
                                >
                                    Show Directions
                                </Button>
                            </Box>
                        </Box>
                    ))
                )}
            </Container>

            {/* Directions Component */}
            {selectedRide && (
                <ShowDirections
                    pickupAddress={selectedRide.pickupLocation}
                    dropAddress={selectedRide.dropLocation}
                    onClose={() => setSelectedRide(null)}
                />
            )}
        </div>
    );
};

export default DriverPage;
