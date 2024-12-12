const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');



// Load ABI and deployed address
const contractABI = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, 'build', 'DecentralizedRideSharing.json'), 'utf8')
).abi;

const contractAddress = fs
    .readFileSync(path.resolve(__dirname, 'build', 'DeployedAddress.txt'), 'utf8')
    .trim();

// Initialize provider and signer
const provider = new ethers.JsonRpcProvider('http://127.0.0.1:7545'); // Ganache
const signer = provider.getSigner(0); // First account as the signer

// Contract instances
const readContract = new ethers.Contract(contractAddress, contractABI, provider); // For read-only
const writeContract = new ethers.Contract(contractAddress, contractABI, signer); // For write

const app = express();
app.use(bodyParser.json());
app.use(cors());

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

// Register a new user
app.post('/register', (req, res) => {
    const { username, ethereumAddress, role } = req.body;

    const sql = "INSERT INTO users (username, ethereum_address, role) VALUES (?, ?, ?)";
    db.query(sql, [username, ethereumAddress, role], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Registration failed');
        }
        res.send('User registered successfully');
    });
});
app.get('/accounts', async (req, res) => {
    try {
        const accounts = await provider.listAccounts();
        res.json(accounts); // Return accounts as JSON response
    } catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).send('Failed to fetch accounts');
    }
});

// Login endpoint
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

app.get('/rides', async (req, res) => {
    try {
        const rides = await readContract.getAvailableRides(); // Call with provider
        res.json(rides);
    } catch (error) {
        console.error('Error fetching rides:', error);
        res.status(500).send('Error fetching rides');
    }
});

app.post('/createRide', async (req, res) => {
    const { pickup = '2', drop = '3' } = req.body;
    try {
        const tx = await writeContract.createRide(pickup, drop, {
            value: ethers.parseEther('0.01'), // Example Ether value
        });
        await tx.wait(); // Wait for transaction to be mined
        res.send({ message: 'Ride created successfully', transactionHash: tx.hash });
    } catch (error) {
        console.error('Error creating ride:', error);
        res.status(500).send('Error creating ride');
    }
});

const fetchRoute = async () => {
    if (!pickupCoords || !dropCoords) {
      return;
    }

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json`,
        {
          params: {
            origin: `${pickupCoords.lat},${pickupCoords.lng}`,
            destination: `${dropCoords.lat},${dropCoords.lng}`,
            key: googleMapsApiKey,
          },
        }
      );

      if (
        response.data &&
        response.data.routes.length > 0 &&
        response.data.routes[0].legs.length > 0
      ) {
        const route = response.data.routes[0];
        const distanceText = route.legs[0].distance.text;

        setRoute(route);
        setDistance(distanceText);
      } else {
        setRoute(null);
        setDistance('Unable to calculate route');
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      setRoute(null);
      setDistance('Error calculating route');
    }
  };
// Start the server
app.listen(5000, () => console.log('Server running on http://localhost:5000'));
