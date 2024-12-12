// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RideSharing {
    // Struct to store ride details
    struct Ride {
        uint256 rideId;
        address payable rider;
        address payable driver;
        string pickupLocation;
        string dropLocation;
        uint256 price; // In Wei
        uint256 distance; // in meters
        bool isAccepted;
        bool isCompleted;
        bool isCancelled;
    }

    // State variables
    uint256 public rideCounter;
    mapping(uint256 => Ride) public rides;
    mapping(address => uint256[]) public riderRides; // Tracks rides by rider
    mapping(address => uint256[]) public driverRides; // Tracks rides by driver
    mapping(uint256 => uint256) public escrowBalances; // Tracks escrow balance for each ride

    // Events
    event RideCreated(
        uint256 indexed rideId,
        address indexed rider,
        string pickupLocation,
        string dropLocation,
        uint256 price,
        uint256 distance
    );
    event RideAccepted(uint256 indexed rideId, address indexed driver);
    event RideCompleted(uint256 indexed rideId, address indexed rider, address indexed driver);
    event RideCancelled(uint256 indexed rideId, address indexed rider);

    // Modifier to ensure only the rider can modify their rides
    modifier onlyRider(uint256 rideId) {
        require(rides[rideId].rider == msg.sender, "Only the rider can perform this action");
        _;
    }

    // Modifier to ensure only the driver can modify their accepted rides
    modifier onlyDriver(uint256 rideId) {
        require(rides[rideId].driver == msg.sender, "Only the driver can perform this action");
        _;
    }

    // Function 1: Create a ride
    function createRide(
        string memory _pickupLocation,
        string memory _dropLocation,
        uint256 _price,
        uint256 _distance
    ) external payable {
        require(msg.value == _price, "Insufficient Ether sent to create the ride");
        require(_price > 0, "Price must be greater than zero");
        require(_distance > 0, "Distance must be greater than zero");

        rideCounter++;
        rides[rideCounter] = Ride({
            rideId: rideCounter,
            rider: payable(msg.sender),
            driver: payable(address(0)),
            pickupLocation: _pickupLocation,
            dropLocation: _dropLocation,
            price: _price,
            distance: _distance,
            isAccepted: false,
            isCompleted: false,
            isCancelled: false
        });
        riderRides[msg.sender].push(rideCounter);
        escrowBalances[rideCounter] = msg.value; // Store Ether in escrow

        emit RideCreated(rideCounter, msg.sender, _pickupLocation, _dropLocation, _price, _distance);
    }

    // Function 2: Accept a ride
    function acceptRide(uint256 _rideId) external {
        Ride storage ride = rides[_rideId];
        require(ride.rider != address(0), "Ride does not exist");
        require(ride.driver == address(0), "Ride already accepted");
        require(ride.rider != msg.sender, "Rider cannot accept their own ride");
        require(!ride.isCancelled, "Ride is cancelled");

        ride.driver = payable(msg.sender);
        ride.isAccepted = true;
        driverRides[msg.sender].push(_rideId);

        emit RideAccepted(_rideId, msg.sender);
    }

    // Function 3: Complete a ride
    function completeRide(uint256 _rideId) external onlyRider(_rideId) {
        Ride storage ride = rides[_rideId];
        require(!ride.isCompleted, "Ride is already completed");
        require(ride.driver != address(0), "Ride has not been accepted by a driver");

        ride.isCompleted = true;

        // Transfer Ether from escrow to driver
        uint256 amount = escrowBalances[_rideId];
        escrowBalances[_rideId] = 0; // Clear escrow balance
        ride.driver.transfer(amount);

        emit RideCompleted(_rideId, ride.rider, ride.driver);
    }

    // Function 4: Cancel a ride
    function cancelRide(uint256 _rideId) external onlyRider(_rideId) {
        Ride storage ride = rides[_rideId];
        require(!ride.isCompleted, "Cannot cancel a completed ride");
        require(!ride.isCancelled, "Ride is already cancelled");
        require(ride.driver == address(0), "Cannot cancel a ride that has been accepted by a driver");

        ride.isCancelled = true;

        // Refund Ether from escrow to rider
        uint256 amount = escrowBalances[_rideId];
        escrowBalances[_rideId] = 0; // Clear escrow balance
        ride.rider.transfer(amount);

        emit RideCancelled(_rideId, ride.rider);
    }

    // Get all available rides
    function getAvailableRides() external view returns (Ride[] memory) {
        uint256 availableCount = 0;

        // Count available rides
        for (uint256 i = 1; i <= rideCounter; i++) {
            if (rides[i].driver == address(0) && !rides[i].isCompleted && !rides[i].isCancelled) {
                availableCount++;
            }
        }

        // Create an array for available rides
        Ride[] memory availableRides = new Ride[](availableCount);
        uint256 index = 0;

        for (uint256 i = 1; i <= rideCounter; i++) {
            if (rides[i].driver == address(0) && !rides[i].isCompleted && !rides[i].isCancelled) {
                availableRides[index] = rides[i];
                index++;
            }
        }

        return availableRides;
    }

    // Get rider rides
    function getRiderRides(address rider) external view returns (Ride[] memory) {
        uint256 rideCount = riderRides[rider].length;
        Ride[] memory riderRideList = new Ride[](rideCount);

        for (uint256 i = 0; i < rideCount; i++) {
            riderRideList[i] = rides[riderRides[rider][i]];
        }

        return riderRideList;
    }

    // Get driver rides
    function getDriverRides(address driver) external view returns (Ride[] memory) {
        uint256 rideCount = driverRides[driver].length;
        Ride[] memory driverRideList = new Ride[](rideCount);

        for (uint256 i = 0; i < rideCount; i++) {
            driverRideList[i] = rides[driverRides[driver][i]];
        }

        return driverRideList;
    }

    // Fallback function to accept Ether payments
    receive() external payable {}
}
