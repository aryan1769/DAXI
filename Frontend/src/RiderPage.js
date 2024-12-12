import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, Polyline } from '@react-google-maps/api';
import axios from 'axios';
import {
  Typography,
  Button,
  Box,
  CssBaseline,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import Header from './Header';
import { useNavigate } from 'react-router-dom';
import { useUser } from './UserContext';

const RiderPage = () => {
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropLocation, setDropLocation] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords] = useState(null);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
  const [route, setRoute] = useState(null);
  const [price, setPrice] = useState(0);
  const [distance, setDistance] = useState('0 km');
  const [center, setCenter] = useState({ lat: 50.4452, lng: -104.6189 });
  const [openPopup, setOpenPopup] = useState(false);
  const [activeRideId, setActiveRideId] = useState(null);
  const cache = {};
  const googleMapsApiKey = 'ADD_YOUR_KEY';
  const navItems = ['Ride History', 'Profile', 'Logout'];
  const navigate = useNavigate();
  const { user } = useUser();
  console.log(user)

  const handleOpenPopup = (rideId) => {
    setActiveRideId(rideId);
    setOpenPopup(true);
  };

  const handleClosePopup = () => {
    setOpenPopup(false);
    setActiveRideId(null);
  };

  const cancelRide = async () => {
    try {
      await axios.post('http://localhost:5000/cancelRide', {
        rideId: activeRideId,
        senderAddress: user.ethereumAddress,
      });
      alert(`Ride ${activeRideId} canceled successfully.`);
      handleClosePopup();
    } catch (err) {
      console.error(`Error canceling ride ${activeRideId}:`, err);
      alert('Failed to cancel ride.');
    }
  };

  const handleMenuItemClick = (menuItem) => {
    if (menuItem === 'Ride History') {
      navigate('/riderHistory');
    } else if (menuItem === 'Logout') {
      navigate('/');
    }
  };

  const fetchRoute = async () => {
    if (!pickupCoords || !dropCoords) {
      alert('Pickup and drop coordinates are required.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/get-route', {
        pickupCoords,
        dropCoords,
      });

      if (response.data) {
        const { route, distance } = response.data;
        setRoute(route);
        setDistance(distance);
        const distanceInKm = parseFloat(distance.replace(' km', ''));
        setPrice((distanceInKm * 0.1).toFixed(2));
      } else {
        alert('Unable to calculate route. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching route:', error.message);
      setRoute(null);
      setDistance('');
      setPrice('');
    }
  };

  const debounce = (func, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  };

  let cancelTokenSource;

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCenter(userLocation);
          setPickupCoords(userLocation);
        },
        (error) => {
          console.error('Error fetching location:', error);
          alert('Default location (Regina, Saskatchewan) will be used.');
        }
      );
    }
  }, []);

  useEffect(() => {
    if (pickupCoords && dropCoords) {
      fetchRoute();
    }
  }, [pickupCoords, dropCoords]);

  const fetchSuggestions = debounce(async (input, setter) => {
    if (input.length < 3) {
      setter([]);
      return;
    }

    if (cache[input]) {
      setter(cache[input]);
      return;
    }

    if (cancelTokenSource) {
      cancelTokenSource.cancel('Request canceled due to a new query.');
    }

    cancelTokenSource = axios.CancelToken.source();

    try {
      const response = await axios.get(`http://localhost:5000/autocomplete`, {
        params: { input },
        cancelToken: cancelTokenSource.token,
      });

      if (response.data && response.data.predictions.length > 0) {
        const predictions = response.data.predictions;
        cache[input] = predictions;
        setter(predictions);
      } else {
        setter([]);
      }
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('Error fetching suggestions:', error);
      }
    }
  }, 300);

  const geocodeLocation = async (placeId, setter, coordsSetter) => {
    try {
      const response = await axios.get(`http://localhost:5000/geocode`, {
        params: { placeId },
      });

      if (response.data) {
        const { lat, lng, formattedAddress } = response.data;
        setter(formattedAddress);
        coordsSetter({ lat, lng });
        setPickupSuggestions([]);
        setDropSuggestions([]);
      } else {
        alert('Unable to find location. Please try again.');
      }
    } catch (error) {
      console.error('Error geocoding location:', error);
    }
  };

  const createRide = async () => {
    if (!pickupCoords || !dropCoords) {
      alert('Please select valid pickup and drop locations.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/createRide', {
        pickupLocation,
        dropLocation,
        price,
        senderAddress: user.ethereumAddress,
        distance: parseFloat(distance.replace(' km', '')),
      });

      const { rideId } = response.data;
      setActiveRideId(rideId);
      setOpenPopup(true); 
    } catch (error) {
      console.error('Error creating ride:', error);
      alert('Failed to create ride.');
    }
  };

  const mapContainerStyle = {
    height: '500px',
    width: '100%',
    marginTop: '20px',
  };

  return (
    <div>
      <CssBaseline />
      <Header navItems={navItems} onMenuItemClick={handleMenuItemClick} logoText="Daxi" />

      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Box sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)' }}>
          <Typography variant="h5" gutterBottom>
            Book a Ride
          </Typography>
          <div style={{ position: 'relative' }}>
            <input
              placeholder="Pickup Location"
              value={pickupLocation}
              onChange={(e) => {
                setPickupLocation(e.target.value);
                fetchSuggestions(e.target.value, setPickupSuggestions);
              }}
              style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
            />
            {pickupSuggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '50px',
                  left: '0',
                  width: '100%',
                  background: '#fff',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                }}
              >
                {pickupSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.place_id}
                    style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #ddd' }}
                    onClick={() =>
                      geocodeLocation(suggestion.place_id, setPickupLocation, setPickupCoords)
                    }
                  >
                    {suggestion.description}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <input
              placeholder="Drop Location"
              value={dropLocation}
              onChange={(e) => {
                setDropLocation(e.target.value);
                fetchSuggestions(e.target.value, setDropSuggestions);
              }}
              style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
            />
            {dropSuggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '50px',
                  left: '0',
                  width: '100%',
                  background: '#fff',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                }}
              >
                {dropSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.place_id}
                    style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #ddd' }}
                    onClick={() =>
                      geocodeLocation(suggestion.place_id, setDropLocation, setDropCoords)
                    }
                  >
                    {suggestion.description}
                  </div>
                ))}
              </div>
            )}
          </div>
          <Typography variant="body1" sx={{ mt: 2 }}>
            <strong>Distance:</strong> {distance}
          </Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            <strong>Price:</strong> {price} ETH
          </Typography>
        </Box>
      </Container>

      <Container maxWidth="md" sx={{ mt: 4, position: 'relative', display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <LoadScript googleMapsApiKey={googleMapsApiKey} libraries={['geometry']}>
          <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={12}>
            {pickupCoords && <Marker position={pickupCoords} label="Pickup" />}
            {dropCoords && <Marker position={dropCoords} label="Drop" />}
            {pickupCoords && dropCoords && (
              <Polyline path={[pickupCoords, dropCoords]} options={{ strokeColor: '#007bff', strokeOpacity: 0.8, strokeWeight: 4 }} />
            )}
          </GoogleMap>
        </LoadScript>
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100%',
            backgroundColor: '#fff',
            boxShadow: '0 -2px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <Button variant="contained" color="primary" fullWidth onClick={createRide}>
            Create Ride
          </Button>
        </Box>
      </Container>

      <Dialog open={openPopup} onClose={handleClosePopup}>
        <DialogTitle>Ride Created Successfully</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            <strong>Ride ID:</strong> {activeRideId}
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Pickup Location:</strong> {pickupLocation}
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Drop Location:</strong> {dropLocation}
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Price:</strong> {price} ETH
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Distance:</strong> {distance} km
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelRide} color="error">
            Cancel Ride
          </Button>
          <Button onClick={handleClosePopup} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default RiderPage;
