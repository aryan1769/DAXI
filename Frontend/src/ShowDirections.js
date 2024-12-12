import React, { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Polyline, Marker } from '@react-google-maps/api';
import axios from 'axios';
import { Button, CircularProgress, Dialog, DialogContent, DialogActions, Typography } from '@mui/material';

const ShowDirections = ({ pickupAddress, dropAddress, onClose }) => {
    const [path, setPath] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pickupLocation, setPickupLocation] = useState(null);
    const [dropLocation, setDropLocation] = useState(null);
    const googleMapsApiKey = 'ADD_YOUR_KEY';

    const fetchCoordinates = async () => {
        try {
            const response = await axios.post('http://localhost:5000/get-directions-by-address', {
                pickupAddress,
                dropAddress,
            });

            const directionsData = response.data.directions;

            if (directionsData && directionsData.routes && directionsData.routes.length > 0) {
                // Extract coordinates from steps
                const route = directionsData.routes[0].legs[0];
                const coordinates = route.steps.flatMap((step) => [
                    {
                        lat: step.start_location.lat,
                        lng: step.start_location.lng,
                    },
                    {
                        lat: step.end_location.lat,
                        lng: step.end_location.lng,
                    },
                ]);

                setPath(coordinates);

                // Set pickup and drop locations for markers
                setPickupLocation({
                    lat: route.start_location.lat,
                    lng: route.start_location.lng,
                });

                setDropLocation({
                    lat: route.end_location.lat,
                    lng: route.end_location.lng,
                });
            } else {
                alert('No routes found for the given addresses.');
            }
        } catch (error) {
            console.error('Error fetching directions:', error);
            alert('Failed to fetch directions.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoordinates();
    }, [pickupAddress, dropAddress]);

    return (
        <Dialog open={true} onClose={onClose} fullWidth maxWidth="lg">
            <DialogContent>
                {loading ? (
                    <CircularProgress />
                ) : path.length > 0 ? (
                    <LoadScript googleMapsApiKey={googleMapsApiKey}>
                        <GoogleMap
                            mapContainerStyle={{ height: '400px', width: '100%' }}
                            zoom={12}
                            center={pickupLocation} // Center on pickup location
                        >
                            {/* Markers for Pickup and Drop Locations */}
                            {pickupLocation && (
                                <Marker
                                    position={pickupLocation}
                                    label="Pickup"
                                />
                            )}
                            {dropLocation && (
                                <Marker
                                    position={dropLocation}
                                    label="Drop"
                                />
                            )}

                            {/* Route Line */}
                            <Polyline
                                path={path}
                                options={{
                                    strokeColor: '#FF0000',
                                    strokeOpacity: 0.8,
                                    strokeWeight: 4,
                                }}
                            />

                            {/* Show Directions Button */}
                            <Button
                                variant="contained"
                                color="primary"
                                sx={{
                                    position: 'absolute',
                                    bottom: 16,
                                    right: 16,
                                    zIndex: 10,
                                }}
                                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&origin=${pickupAddress}&destination=${dropAddress}&travelmode=driving`)}
                            >
                                Open Directions in Google Maps
                            </Button>
                        </GoogleMap>
                    </LoadScript>
                ) : (
                    <Typography color="error">Unable to fetch directions.</Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ShowDirections;
