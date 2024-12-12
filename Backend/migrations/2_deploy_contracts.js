// const DecentralizedRideSharing = artifacts.require("DecentralizedRideSharing");

// module.exports = function (deployer) {
//   deployer.deploy(DecentralizedRideSharing);
// };
const RideSharing = artifacts.require("RideSharing");

module.exports = function (deployer) {
  deployer.deploy(RideSharing);
};