const express = require('express');
const bodyParser = require('body-parser');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const mysql = require('mysql2');
const axios = require('axios');
const Web3 = require('web3');

const app = express();
app.use(cors());
app.use(bodyParser.json()); // Parse JSON requests

// Load ABI and deployed address
const contractABI = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, 'build/contracts', 'RideSharing.json'), 'utf8')
).abi;

const contractAddress = fs
    .readFileSync(path.resolve(__dirname, 'build/contracts', 'RideSharing.txt'), 'utf8')
    .trim();
console.log(contractAddress)
// Connect to Ganache
// Connect to Ganache
const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:7545')); // Ganache RPC URL
let defaultAccount;
let rideSharingContract;
// Get Default Account
web3.eth.getAccounts()
    .then((accounts) => {
        defaultAccount = accounts[0]; // Use the first account as the default
        console.log('Default Account:', defaultAccount);

        // Initialize Contract Instance
        rideSharingContract = new web3.eth.Contract(contractABI, contractAddress, {
            from: defaultAccount, // Default sender
        });

        console.log('Contract initialized successfully');
    })
    .catch((error) => {
        console.error('Error initializing contract:', error);
    });

// MySQL Database Configuration
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Its_me691',
    database: 'ride_sharing'
});

// Connect to MySQL
db.connect(err => {
    if (err) throw err;
    console.log('MySQL connected');
});


// API to fetch available rides
app.get('/rides', async (req, res) => {
    try {
        const rides = await readContract.getAvailableRides(); // Call with provider
        res.json(rides);
    } catch (error) {
        console.error('Error fetching rides:', error);
        res.status(500).send('Error fetching rides');
    }
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Ensure both fields are provided
    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    const sql = "SELECT * FROM users WHERE username = ? AND password = SHA2(?, 256)";
    db.query(sql, [username, password], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('An error occurred while processing the request');
        }

        // Check if user exists
        if (results.length === 0) {
            return res.status(401).send('Invalid username or password');
        }

        // User found
        const user = results[0];
        res.json({
            id: user.id,
            username: user.username,
            ethereumAddress: user.ethereum_address,
            role: user.role
        });
    });
});

// API to create a ride
app.post('/createRide', async (req, res) => {
    const { pickupLocation, dropLocation, price, distance, senderAddress } = req.body;

    // Validate required fields
    if (!pickupLocation || !dropLocation || !price || !distance || !senderAddress) {
        return res.status(400).send('All fields (pickupLocation, dropLocation, price, distance, senderAddress) are required.');
    }

    try {
        // Ensure price is fixed to 2 decimal places
        const fixedPrice = Number(price).toFixed(2); // Ensure the price has 2 decimal places
        const weiPrice = web3.utils.toWei(fixedPrice.toString(), 'ether'); // Pass fixedPrice as a string
        console.log(weiPrice)
        // Convert price to Wei
        // const weiPrice = web3.utils.toWei(fixedPrice, 'ether');

        // Ensure distance is an integer
        const integerDistance = Math.floor(distance);

        // Send transaction to create a ride
        const tx = await rideSharingContract.methods.createRide(
            pickupLocation,
            dropLocation,
            weiPrice,
            integerDistance
        ).send({
            from: senderAddress,
            value: weiPrice, // Include the price in Ether
            gas: 500000, // Gas limit
        });
        console.log(JSON.stringify(tx))
        res.json({
            message: 'Ride created successfully',
            transactionHash: tx.transactionHash,
            rideId: tx?.events?.RideCreated?.returnValues?.rideId, // Extract rideId from event
        });
    } catch (error) {
        console.error('Error creating ride:', error);
        res.status(500).send('Failed to create ride.');
    }
});



const GOOGLE_API_KEY = 'ADD_YOUR_API_KEY'; // Replace with your Google Maps API key
app.get('/autocomplete', async (req, res) => {
    const { input } = req.query;

    try {
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
            {
                params: {
                    input,
                    key: GOOGLE_API_KEY,
                    types: 'geocode',
                    components: 'country:ca', // Restrict to Canada
                },
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching autocomplete suggestions:', error.message);
        res.status(500).json({ error: 'Error fetching suggestions' });
    }
});

// Autocomplete API
app.get('/autocomplete', async (req, res) => {
    const { input } = req.query;

    try {
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
            {
                params: {
                    input,
                    key: GOOGLE_API_KEY,
                    types: 'geocode',
                    components: 'country:ca', // Restrict to Canada
                },
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching autocomplete suggestions:', error.message);
        res.status(500).json({ error: 'Error fetching suggestions' });
    }
});

// Geocode API
app.get('/geocode', async (req, res) => {
    const { placeId } = req.query;

    if (!placeId) {
        return res.status(400).json({ error: 'placeId is required' });
    }

    try {
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json`,
            {
                params: {
                    place_id: placeId,
                    key: GOOGLE_API_KEY,
                },
            }
        );
        console.log(response.data)
        if (response.data && response.data.results.length > 0) {
            const { lat, lng } = response.data.results[0].geometry.location;
            const formattedAddress = response.data.results[0].formatted_address;

            res.json({ lat, lng, formattedAddress });
        } else {
            res.status(404).json({ error: 'No results found for the given placeId' });
        }
    } catch (error) {
        console.error('Error fetching geocode data:', error.message);
        res.status(500).json({ error: 'Error fetching geocode data' });
    }
});

app.post('/get-route', async (req, res) => {
    const { pickupCoords, dropCoords } = req.body;

    if (!pickupCoords || !dropCoords) {
        return res.status(400).json({ error: 'pickupCoords and dropCoords are required' });
    }

    try {
        // Fetch directions using Google Directions API
        const directionsResponse = await axios.get(
            `https://maps.googleapis.com/maps/api/directions/json`,
            {
                params: {
                    origin: `${pickupCoords.lat},${pickupCoords.lng}`,
                    destination: `${dropCoords.lat},${dropCoords.lng}`,
                    key: GOOGLE_API_KEY,
                },
            }
        );

        // Debugging the response
        console.log('Directions API Response:', JSON.stringify(directionsResponse.data, null, 2));

        if (
            directionsResponse.data &&
            directionsResponse.data.routes &&
            directionsResponse.data.routes.length > 0 &&
            directionsResponse.data.routes[0].legs &&
            directionsResponse.data.routes[0].legs.length > 0
        ) {
            const route = directionsResponse.data.routes[0];
            const distanceText = route.legs[0].distance.text;

            res.status(200).json({
                route,
                distance: distanceText,
            });
        } else {
            console.error('No valid routes found:', directionsResponse.data);
            res.status(404).json({ error: 'Unable to calculate route. No valid routes found.' });
        }
    } catch (error) {
        console.error('Error fetching route:', error.message);
        res.status(500).json({ error: 'Failed to fetch route.' });
    }
});

app.get('/getAvailableRides', async (req, res) => {
    try {
        // Call the smart contract's getAvailableRides function
        const availableRides = await rideSharingContract.methods.getAvailableRides().call();

        const formattedRides = availableRides.map((ride) => ({
            rideId: ride.rideId,
            pickupLocation: ride.pickupLocation,
            dropLocation: ride.dropLocation,
            price: web3.utils.fromWei(ride.price, 'ether'), // Convert price to Ether
            distance: ride.distance,
            rider: ride.rider,
            isCompleted: ride.isCompleted,
            isCancelled: ride.isCancelled
        }));

        res.send({ availableRides: formattedRides });
    } catch (error) {
        console.error('Error fetching available rides:', error);
        res.status(500).send('Failed to fetch available rides.');
    }
});

app.get('/rideHistory/:riderAddress', async (req, res) => {
    const { riderAddress } = req.params;

    if (!riderAddress) {
        return res.status(400).send({ error: 'Rider address is required.' });
    }

    try {
        // Fetch rides data directly
        const ridesData = await rideSharingContract.methods.getRiderRides(riderAddress).call();

        // Map the ridesData response
        const rides = ridesData.map((ride) => ({
            rideId: parseInt(ride[0], 10), // Ensure rideId is a number
            rider: ride[1], // Rider address
            driver: ride[2], // Driver address
            pickupLocation: ride[3], // Pickup location
            dropLocation: ride[4], // Drop location
            price: parseFloat(web3.utils.fromWei(ride[5], 'ether')).toFixed(2), // Convert price from Wei to Ether
            distance: parseFloat(ride[6]).toFixed(1), // Distance (1 decimal place)
            isAccepted: ride[7], // isAccepted
            isCompleted: ride[8], // isCompleted
            isCancelled: ride[9], // isCancelled
        }));

        // Sort the rides by rideId in descending order
        rides.sort((a, b) => b.rideId - a.rideId);

        res.status(200).send(rides);
    } catch (error) {
        console.error('Error fetching rider history:', error.message, error.stack);
        res.status(500).send({ error: 'Failed to fetch rider history.' });
    }
});




app.post('/cancelRide', async (req, res) => {
    const { rideId, senderAddress } = req.body;

    // Validate the input
    if (!rideId || !web3.utils.isAddress(senderAddress)) {
        return res.status(400).send('Invalid ride ID or Ethereum address.');
    }

    try {
        // Call the smart contract's cancelRide function
        const tx = await rideSharingContract.methods.cancelRide(rideId).send({
            from: senderAddress,
            gas: 500000, // Gas limit
        });

        res.json({
            message: 'Ride canceled successfully',
            transactionHash: tx.transactionHash,
        });
    } catch (error) {
        console.error('Error canceling ride:', error);
        res.status(500).send('Failed to cancel ride.');
    }
});

app.get('/balance/:address', async (req, res) => {
    const { address } = req.params;

    try {
        // Validate Ethereum address
        if (!web3.utils.isAddress(address)) {
            return res.status(400).send({ error: 'Invalid Ethereum address' });
        }

        // Fetch balance in Wei and convert to Ether
        const balanceWei = await web3.eth.getBalance(address);
        const balanceEth = web3.utils.fromWei(balanceWei, 'ether');

        res.send({ balance: balanceEth });
    } catch (error) {
        console.error('Error fetching balance:', error);
        res.status(500).send({ error: 'Error fetching balance' });
    }
});

app.post('/acceptRide', async (req, res) => {
    const { rideId, driverAddress } = req.body;

    if (!rideId || !driverAddress) {
        return res.status(400).send({ error: 'Ride ID and Driver Address are required.' });
    }

    try {
        // Call the smart contract to accept the ride
        const tx = await rideSharingContract.methods.acceptRide(rideId).send({
            from: driverAddress,
            gas: 500000, // Adjust gas limit if needed
        });
        console.log(JSON.stringify(tx))
        res.status(200).send({
            message: 'Ride accepted successfully',
            transactionHash: tx.transactionHash,
        });
    } catch (error) {
        console.error('Error accepting ride:', error);
        res.status(500).send({ error: 'Failed to accept ride.' });
    }
});

app.post('/deleteRide', async (req, res) => {
    const { rideId, senderAddress } = req.body;

    // Validate required fields
    if (!rideId || !senderAddress) {
        return res.status(400).send({ error: 'rideId and senderAddress are required.' });
    }

    try {
        // Call the deleteRide function in the smart contract
        const tx = await rideSharingContract.methods.deleteRide(rideId).send({
            from: senderAddress,
            gas: 500000, // Set appropriate gas limit
        });

        res.status(200).send({
            message: 'Ride deleted successfully.',
            transactionHash: tx.transactionHash,
        });
    } catch (error) {
        console.error('Error deleting ride:', error.message, error);
        res.status(500).send({ error: 'Failed to delete ride.' });
    }
});

app.post('/completeRide', async (req, res) => {
    const { rideId, senderAddress } = req.body;

    // Validate input
    if (!rideId || !senderAddress) {
        return res.status(400).send({ error: 'Both rideId and senderAddress are required.' });
    }

    try {
        // Call the `completeRide` method on the smart contract
        const tx = await rideSharingContract.methods.completeRide(rideId).send({
            from: senderAddress,
            gas: 500000, // Specify gas limit
        });

        res.json({
            message: `Ride ${rideId} completed successfully.`,
            transactionHash: tx.transactionHash,
        });
    } catch (error) {
        console.error('Error completing ride:', error);
        res.status(500).send({ error: 'Failed to complete ride.' });
    }
});

app.get('/driverHistory/:driverAddress', async (req, res) => {
    const { driverAddress } = req.params;

    if (!driverAddress) {
        return res.status(400).send({ error: 'Driver address is required.' });
    }

    try {
        // Fetch rides directly from the smart contract
        const rideData = await rideSharingContract.methods.getDriverRides(driverAddress).call();

        // Process the ride data to convert price and format response
        const rides = rideData.map((ride) => ({
            rideId: ride.rideId, // Ride ID
            rider: ride.rider, // Rider address
            driver: ride.driver, // Driver address
            pickupLocation: ride.pickupLocation, // Pickup location
            dropLocation: ride.dropLocation, // Drop location
            price: web3.utils.fromWei(ride.price, 'ether'), // Convert price from Wei to Ether
            distance: parseFloat(ride.distance), // Distance as float
            isAccepted: ride.isAccepted, // Is Accepted status
            isCompleted: ride.isCompleted, // Is Completed status
            isCancelled: ride.isCancelled, // Is Cancelled status
        }));
        rides.sort((a, b) => b.rideId - a.rideId);
        res.status(200).send(rides);
    } catch (error) {
        console.error('Error fetching driver history:', error.message, error.stack);
        res.status(500).send({ error: 'Failed to fetch driver history.' });
    }
});

app.post('/getDirections', async (req, res) => {
    const { pickupLocation, dropLocation } = req.body;

    if (!pickupLocation || !dropLocation) {
        return res.status(400).send({ error: 'Pickup and drop locations are required.' });
    }

    try {
        const directionsServiceUrl = `https://maps.googleapis.com/maps/api/directions/json`;
        const response = await axios.get(directionsServiceUrl, {
            params: {
                origin: pickupLocation,
                destination: dropLocation,
                mode: 'driving',
                key: GOOGLE_API_KEY,
            },
        });

        if (response.data && response.data.routes.length > 0) {
            res.status(200).send({ directions: response.data });
        } else {
            res.status(404).send({ error: 'No directions found.' });
        }
    } catch (error) {
        console.error('Error fetching directions:', error.message);
        res.status(500).send({ error: 'Failed to fetch directions.' });
    }
});

app.post('/get-directions-by-address', async (req, res) => {
    const { pickupAddress, dropAddress } = req.body;

    if (!pickupAddress || !dropAddress) {
        return res.status(400).send({ error: 'Pickup and drop addresses are required.' });
    }

    try {
        // Geocode pickup address
        const pickupGeocodeResponse = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json`,
            {
                params: {
                    address: pickupAddress,
                    key: GOOGLE_API_KEY,
                },
            }
        );

        if (pickupGeocodeResponse.data.status !== 'OK') {
            return res.status(400).send({ error: 'Failed to geocode pickup address.' });
        }

        const pickupLocation = pickupGeocodeResponse.data.results[0].geometry.location;

        // Geocode drop address
        const dropGeocodeResponse = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json`,
            {
                params: {
                    address: dropAddress,
                    key: GOOGLE_API_KEY,
                },
            }
        );

        if (dropGeocodeResponse.data.status !== 'OK') {
            return res.status(400).send({ error: 'Failed to geocode drop address.' });
        }

        const dropLocation = dropGeocodeResponse.data.results[0].geometry.location;

        // Get directions
        const directionsResponse = await axios.get(
            `https://maps.googleapis.com/maps/api/directions/json`,
            {
                params: {
                    origin: `${pickupLocation.lat},${pickupLocation.lng}`,
                    destination: `${dropLocation.lat},${dropLocation.lng}`,
                    mode: 'driving',
                    key: GOOGLE_API_KEY,
                },
            }
        );

        if (directionsResponse.data.status !== 'OK') {
            return res.status(400).send({ error: 'Failed to fetch directions.' });
        }

        res.status(200).send({
            directions: directionsResponse.data,
        });
    } catch (error) {
        console.error('Error fetching directions:', error);
        res.status(500).send({ error: 'Failed to fetch directions.' });
    }
});

const getUnusedEthereumAddresses = async (req, res) => {
    try {
        // Fetch all Ethereum addresses from Web3 provider
        const accounts = await web3.eth.getAccounts(); // Replace with your logic to fetch addresses
        console.log('All Ethereum Accounts:', accounts);

        // Fetch used addresses from the database
        db.query('SELECT ethereum_address FROM users', (err, results) => {
            if (err) {
                console.error('Error fetching addresses from database:', err);
                return res.status(500).send('Failed to fetch used Ethereum addresses.');
            }

            // Map results to an array of addresses
            const usedAddresses = results.map((row) => row.ethereum_address);

            console.log('Used Ethereum Addresses:', usedAddresses);

            // Filter out used addresses
            const unusedAddresses = accounts.filter((address) => !usedAddresses.includes(address));

            console.log('Unused Ethereum Addresses:', unusedAddresses);

            // Respond with unused addresses
            res.json(unusedAddresses);
        });
    } catch (error) {
        console.error('Error fetching Ethereum addresses:', error);
        res.status(500).send('Failed to fetch Ethereum addresses.');
    }
};

app.get('/ethereum-addresses', (req, res) => {
    getUnusedEthereumAddresses(req, res); // Call the function directly
});

app.post('/register', async (req, res) => {
    const { username, ethereumAddress, password, role } = req.body;

    // Validate input
    if (!username || !ethereumAddress || !password || !role) {
        return res.status(400).send('All fields (username, ethereumAddress, password, role) are required.');
    }
    if (!['rider', 'driver'].includes(role)) {
        return res.status(400).send('Invalid role. Role must be "rider" or "driver".');
    }

    try {
        // Check if Ethereum address is already used
        db.query('SELECT * FROM users WHERE ethereum_address = ?', [ethereumAddress], async (err, results) => {
            if (err) {
                console.error('Error querying the database:', err);
                return res.status(500).send('Database error.');
            }

            if (results.length > 0) {
                return res.status(400).send('Ethereum address is already registered.');
            }

            // Check if username is already used
            db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
                if (err) {
                    console.error('Error querying the database:', err);
                    return res.status(500).send('Database error.');
                }

                if (results.length > 0) {
                    return res.status(400).send('Username is already taken.');
                }

                // Hash the password using SHA2
                const hashedPasswordSQL = 'SHA2(?, 256)';
                const sql = `INSERT INTO users (username, ethereum_address, password, role) VALUES (?, ?, ${hashedPasswordSQL}, ?)`;

                // Insert the new user into the database
                db.query(sql, [username, ethereumAddress, password, role], (err, results) => {
                    if (err) {
                        console.error('Error inserting into the database:', err);
                        return res.status(500).send('Database error.');
                    }

                    res.status(201).send('User registered successfully.');
                });
            });
        });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).send('Internal server error.');
    }
});

app.post('/validateEthereumAddress', async (req, res) => {
    const { ethereumAddress } = req.body;

    if (!ethereumAddress) {
        return res.status(400).send({ valid: false, message: 'Ethereum address is required.' });
    }

    try {
        // Check if Ethereum address exists in the blockchain (stubbed for example)
        const allAddresses = await web3.eth.getAccounts(); // Fetch all available accounts
        const isAddressValid = allAddresses.includes(ethereumAddress);

        if (!isAddressValid) {
            return res.status(400).send({ valid: false, message: 'Ethereum address does not exist.' });
        }

        // Check if Ethereum address is already in the database
        const [rows] = await db.promise().query('SELECT * FROM users WHERE ethereum_address = ?', [ethereumAddress]);
        if (rows.length > 0) {
            return res.status(400).send({ valid: false, message: 'Ethereum address is already in use.' });
        }

        res.send({ valid: true });
    } catch (error) {
        console.error('Error validating Ethereum address:', error);
        res.status(500).send({ valid: false, message: 'Failed to validate Ethereum address.' });
    }
});


// Start the backend server
app.listen(5000, () => {
    console.log('Server running on http://localhost:5000');
});
