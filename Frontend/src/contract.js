import web3 from './web3';
import ContractABI from './DecentralizedRideSharing.json'; // ABI file from Truffle build

// Replace with the actual deployed contract address from Ganache 0x23FA420b91C8dCc0D58997DF0AB0b411413E1314
const contractAddress = "0x8e2E905cAC14409e46D495008E32dEF5261A7B59";

const rideSharingContract = new web3.eth.Contract(ContractABI.abi, contractAddress);

export default rideSharingContract;
