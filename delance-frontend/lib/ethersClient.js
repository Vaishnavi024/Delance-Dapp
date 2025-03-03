//ethersClient.js
import { ethers } from "ethers";
import DelanceABI from "./DelanceABI.json";

// Replace with your Sepolia contract address
const contractAddress = "0x574371104a52067E85f29e34CFe69eaFeCC3a330";

const getContract = () => {
  if (typeof window === "undefined" || !window.ethereum) {
    console.error("MetaMask not detected");
    return null;
  }

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  return new ethers.Contract(contractAddress, DelanceABI, signer);
};

export default getContract;
