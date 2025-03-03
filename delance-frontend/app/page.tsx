//page.tsx
"use client";

import React, { useEffect, useState } from "react";
import getContract from "../lib/ethersClient";
import { ethers } from "ethers";
import Modal from 'react-modal';
import FloatingParticles from "./FloatingParticles";
import Image from 'next/image';



export default function Home() {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalContent, setModalContent] = useState<string | JSX.Element>('');

  const [connected, setConnected] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [studentList, setStudentList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [studentRequests, setStudentRequests] = useState([]);
  const [clientRequests, setClientRequests] = useState([]);
  const [isRegisteringClient, setIsRegisteringClient] = useState(false);
  const [isRegisteringStudent, setIsRegisteringStudent] = useState(false);
  const [isUpdatingStudentDetails, setIsUpdatingStudentDetails] = useState(false);
  const [isViewingRequests, setIsViewingRequests] = useState(false);
  const [isRaisingDispute, setIsRaisingDispute] = useState(false);
  const [isViewingStudents, setIsViewingStudents] = useState(false);
  const [isViewingDisputes, setIsViewingDisputes] = useState(false);


  const [studentsFetched, setStudentsFetched] = useState(false);
  const [disputes, setDisputes] = useState([]);
  const [disputesFetched, setDisputesFetched] = useState(false);
  const [updatePseudonym, setUpdatePseudonym] = useState("");
  const [updateSkills, setUpdateSkills] = useState("");
  const [updateRateInWei, setUpdateRateInWei] = useState("");
  const [updatePortfolioLink, setUpdatePortfolioLink] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");



  const [studentRequestsFetched, setStudentRequestsFetched] = useState(false);
  const [clientRequestsFetched, setClientRequestsFetched] = useState(false);

  // Form input states for student registration
  const [pseudonym, setPseudonym] = useState("");
  const [skills, setSkills] = useState("");
  const [priceInWei, setPriceInWei] = useState("");

  useEffect(() => {

    const connectWallet = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          const currentAddress = accounts[0];
          setWalletAddress(currentAddress);
          setConnected(true);

          // Check if the connected wallet is the admin
          const adminAddress = "0x234Edbf7Aa092E1f1a40669C425d06826AE90D97";
          if (currentAddress.toLowerCase() === adminAddress.toLowerCase()) {
            setIsAdmin(true); // Assuming you have a state variable for `isAdmin`
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("User denied wallet connection:", error);
        }
      } else {
        console.error("MetaMask is not installed.");
      }
    };

    connectWallet();

    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage("");
      }, 2000); // 1.5 seconds

      return () => clearTimeout(timer);
    }
  }, [statusMessage]);


  const openModal = (content: string | JSX.Element) => {
    setModalContent(content);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  const registerAsClient = async () => {
    try {
      setIsRegisteringClient(true);
      setLoading(true);
      setStatusMessage("Registering as client...");
      const contract = getContract();
      if (!contract) throw new Error("Contract not available");
      const tx = await contract.registerAsClient();
      await tx.wait();
      setIsClient(true);
      setStatusMessage("Registered as client!");
    } catch (error) {
      console.error("Error registering as client:", error);
      setStatusMessage(`Failed to register as client: ${error.message}`);
    } finally {
      setIsRegisteringClient(false);
      setLoading(false);
    }
  };

  const [portfolioLink, setPortfolioLink] = useState("");
  const registerAsStudent = async () => {
    // Clear any previous messages
    setStatusMessage("");

    // Validation checks
    if (!pseudonym || !skills || !priceInWei || !portfolioLink) {
      setStatusMessage("All fields are mandatory for registration. Please fill in all the fields.");
      setStatusMessageColor("#dc3545"); // Red for error
      return;
    }

    const parsedRate = parseFloat(priceInWei);
    if (isNaN(parsedRate) || parsedRate <= 0) {
      setStatusMessage("Rate must be a positive number.");
      setStatusMessageColor("#dc3545"); // Red for error
      return;
    }

    const hasNumbers = /\d/.test(skills);
    if (hasNumbers) {
      setStatusMessage("Skills cannot contain numbers. Please provide a valid skill set.");
      setStatusMessageColor("#dc3545"); // Red for error
      return;
    }

    setIsRegisteringStudent(true);

    try {
      setLoading(true);
      setStatusMessage("Registering as student...");
      statusMessageColor = "#ffc107"; // Yellow for loading

      const contract = getContract();
      if (!contract) throw new Error("Contract not available");

      const priceInEther = ethers.utils.parseEther(priceInWei);
      const tx = await contract.registerAsStudent(pseudonym, skills, priceInEther, portfolioLink); // Include portfolioLink
      await tx.wait();

      setIsStudent(true);
      setStatusMessage("Registered as student successfully!");
      statusMessageColor = "#28a745"; // Green for success
    } catch (error) {
      console.error("Error registering as student:", error);
      setStatusMessage(`Failed to register as student: ${error.message}`);
      statusMessageColor = "#dc3545"; // Red for error
    } finally {
      setIsRegisteringStudent(false);
      setLoading(false);
    }
  };




  const updateStudentDetails = async () => {
    try {
      setIsUpdatingStudentDetails(true);
      setLoading(true);
      setStatusMessage("Updating student details...");
      const contract = getContract();
      if (!contract) throw new Error("Contract not available");

      // Fetch the logged-in student's ID
      const studentId = await contract.studentIdsByAddress(await window.ethereum.selectedAddress);

      // Call the updateStudentDetails contract function
      const tx = await contract.updateStudentDetails(
        studentId,
        updatePseudonym,
        updateSkills,
        ethers.utils.parseEther(updateRateInWei), // Convert rate from ETH to Wei
        updatePortfolioLink
      );
      await tx.wait();
      setStatusMessage("Student details updated successfully!");
    } catch (error) {
      console.error("Error updating student details:", error);
      setStatusMessage(`Failed to update student details: ${error.message}`);
    } finally {
      setIsUpdatingStudentDetails(false);
      setLoading(false);
    }
  };


  const fetchStudents = async () => {
    try {
      setIsViewingStudents(true);
      setLoading(true);
      setStatusMessage("Fetching students...");
      const contract = getContract();
      if (!contract) throw new Error("Contract not available");

      const students = await contract.viewStudents();
      setStudentList(students); // Update global state

      // Render students only in the modal
      const studentDisplay = (
        <div>
          <h3 style={{ textAlign: "center", marginBottom: "20px" }}>Available Students</h3>
          <ul style={{ listStyleType: "none", padding: 0 }}>
            {students.map((student, index) => (
              <li
                key={index}
                style={{
                  padding: "10px",
                  marginBottom: "10px",
                  backgroundColor: "#444",
                  borderRadius: "5px",
                  color: "white",
                }}
              >
                <p><strong>ID:</strong> {student.studentId.toString()}</p>
                <p><strong>Name:</strong> {student.pseudonym}</p>
                <p><strong>Address:</strong> {student.studentAddress}</p>
                <p><strong>Skills:</strong> {student.skills}</p>
                <p><strong>Rate:</strong> {ethers.utils.formatEther(student.priceInWei)} ETH</p>
                <p>
                  <strong>Portfolio:</strong>{" "}
                  {student.portfolioLink ? (
                    <a href={student.portfolioLink} target="_blank" style={{ color: "yellow" }}>
                      View
                    </a>
                  ) : (
                    "N/A"
                  )}
                </p>
                {/* Single request service button */}
                <button
                  onClick={() => requestService(student.studentId)} // Use global requestService
                  style={{
                    padding: "10px 20px",
                    background: "linear-gradient(90deg, #005f6a, #19715d)",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}

                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow = "0 6px 10px rgba(0, 0, 0, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
                  }}
                >
                  Request Service
                </button>
              </li>
            ))}
          </ul>
        </div>
      );

      openModal(studentDisplay); // Display in modal
      setStatusMessage("Fetched students successfully!");
    } catch (error) {
      console.error("Error fetching students:", error);
      setStatusMessage(`Failed to fetch students: ${error.message}`);
    } finally {
      setIsViewingStudents(false);
      setLoading(false);
    }
  };





  const fetchDisputes = async () => {
    try {
      setIsViewingDisputes(true);
      setLoading(true); // Show loading state
      setStatusMessage("Fetching disputes...");

      const contract = getContract();
      if (!contract) throw new Error("Contract not available");

      // Fetch disputes directly from the contract
      const rawDisputes = await contract.getDisputes();

      // Format disputes for rendering
      const formattedDisputes = rawDisputes.map((dispute) => ({
        requestId: dispute.requestId.toString(), // Convert BigNumber to string
        client: dispute.client,
        studentAddress: dispute.studentAddress,
        amount: ethers.utils.formatEther(dispute.amount), // Convert BigNumber to ETH
        status: ["Pending", "Accepted", "Rejected", "Completed"][dispute.status], // Map status
        complaint: dispute.complaint, // Use complaint as is (if it's a string)
      }));

      // Store disputes in state
      setDisputes(formattedDisputes);
      setDisputesFetched(true);

      const disputeDisplay = (
        <div>
          <h3 style={{ textAlign: "center", marginBottom: "20px" }}>Disputes</h3>
          <ul style={{ listStyleType: "none", padding: 0 }}>
            {formattedDisputes.map((dispute, index) => (
              <li
                key={index}
                style={{
                  padding: "10px",
                  marginBottom: "10px",
                  backgroundColor: "#444",
                  borderRadius: "5px",
                  color: "white",
                }}
              >
                <p><strong>Request ID:</strong> {dispute.requestId}</p>
                <p><strong>Client:</strong> {dispute.client}</p>
                <p><strong>Student:</strong> {dispute.studentAddress}</p>
                <p><strong>Amount:</strong> {dispute.amount} ETH</p>
                <p><strong>Complaint:</strong> {dispute.complaint}</p> {/* Display complaint */}
                {isAdmin ? (
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => resolveDispute(dispute.requestId, true)}
                      style={{
                        padding: "8px 15px",
                        background: "linear-gradient(90deg, #864CBF, #A272D4)",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                        boxShadow: "0 3px 5px rgba(0, 0, 0, 0.1)",
                        transition: "transform 0.2s, box-shadow 0.2s",
                      }}
                    >
                      Resolve in Favor of Client
                    </button>
                    <button
                      onClick={() => resolveDispute(dispute.requestId, false)}
                      style={{
                        padding: "8px 15px",
                        background: "linear-gradient(90deg, #00796B, #26A69A)",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                        boxShadow: "0 3px 5px rgba(0, 0, 0, 0.1)",
                        transition: "transform 0.2s, box-shadow 0.2s",
                      }}
                    >
                      Resolve in Favor of Student
                    </button>
                  </div>
                ) : (
                  <p style={{ color: "red", fontWeight: "bold", marginTop: "10px" }}>
                    Only admins can resolve disputes.
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      );

      openModal(disputeDisplay); // Open modal with dispute data
      setStatusMessage("Fetched disputes successfully!");
    } catch (error) {
      console.error("Error fetching disputes:", error);
      setStatusMessage(`Failed to fetch disputes: ${error.message}`);
    } finally {
      setIsViewingDisputes(false);
      setLoading(false);
    }
  };





  const resolveDispute = async (requestId, clientWins) => {
    try {
      setLoading(true);
      setStatusMessage("Resolving dispute...");
      const contract = getContract();
      if (!contract) throw new Error("Contract not available");

      const tx = await contract.resolveDispute(requestId, clientWins);
      await tx.wait();

      setStatusMessage(
        `Dispute for Request ID ${requestId} resolved in favor of ${clientWins ? "Client" : "Student"
        }`
      );

      // Refresh disputes
      fetchDisputes();
    } catch (error) {
      console.error("Error resolving dispute:", error);
      setStatusMessage(`Failed to resolve dispute: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };


  const requestService = async (studentId) => {
    try {
      const jobDescriptionLink = prompt(
        "Enter the Job Description Link (e.g., https://example.com):"
      );
      if (!jobDescriptionLink) {
        alert("Job Description Link is required!");
        return;
      }

      // Find the student directly from the global state
      const student = studentList.find(
        (s) => s.studentId.toString() === studentId.toString()
      );
      if (!student) {
        alert("Student not found or unavailable");
        return;
      }

      setLoading(true);
      setStatusMessage("Requesting service...");
      const contract = getContract();
      if (!contract) throw new Error("Contract not available");

      const tx = await contract.requestService(studentId, jobDescriptionLink, {
        value: student.priceInWei,
      });
      await tx.wait();
      setStatusMessage("Service requested and amount held in escrow!");
    } catch (error) {
      console.error("Error requesting service:", error);
      setStatusMessage(`Failed to request service: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };



  const fetchStudentRequests = async () => {
    try {
      setLoading(true);
      setIsViewingRequests(true);
      setStatusMessage("Fetching requests for student...");
      const contract = getContract();
      if (!contract) throw new Error("Contract not available");

      const requests = await contract.getStudentRequests();
      setStudentRequests(requests);
      setStudentRequestsFetched(true);

      // Modal Content for Student Requests
      const requestDisplay = requests.length > 0 ? (
        <div>
          <h3 style={{ textAlign: "center", marginBottom: "20px" }}>Pending Requests for Student</h3>
          <ul style={{ listStyleType: "none", padding: 0 }}>
            {requests.map((request, index) => (
              <li
                key={index}
                style={{
                  padding: "10px",
                  marginBottom: "10px",
                  backgroundColor: "#444",
                  borderRadius: "5px",
                  color: "white",
                }}
              >
                <p><strong>Request ID:</strong> {request.requestId.toString()}</p>
                <p><strong>Client Address:</strong> {request.client}</p>
                <p><strong>Amount:</strong> {ethers.utils.formatEther(request.amount)} ETH</p>
                <p>
                  <strong>Status:</strong>{" "}
                  {["Pending", "Accepted", "Rejected", "Completed"][request.status]}
                </p>
                {request.status === 0 && (
                  <div style={{ display: "flex", gap: "10px" }}>
                    {/* Accept Button */}
                    <button
                      onClick={() => handleAcceptRequest(request.requestId)}
                      style={{
                        padding: "8px 15px",
                        background: "linear-gradient(90deg, #4CAF50, #388E3C)",
                        // linear-gradient(90deg, #f44336, #d32f2f)
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                        boxShadow: "0 3px 5px rgba(0, 0, 0, 0.1)",
                        transition: "transform 0.2s, box-shadow 0.2s",
                      }}

                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";
                        e.currentTarget.style.boxShadow = "0 5px 8px rgba(0, 0, 0, 0.2)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow = "0 3px 5px rgba(0, 0, 0, 0.1)";
                      }}
                    >


                      Accept
                    </button>
                    {/* Reject Button */}
                    <button
                      onClick={() => handleRejectRequest(request.requestId)}
                      style={{
                        padding: "8px 15px",
                        background: "linear-gradient(90deg, #f44336, #d32f2f)",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                        boxShadow: "0 3px 5px rgba(0, 0, 0, 0.1)",
                        transition: "transform 0.2s, box-shadow 0.2s",
                      }}

                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";
                        e.currentTarget.style.boxShadow = "0 5px 8px rgba(0, 0, 0, 0.2)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow = "0 3px 5px rgba(0, 0, 0, 0.1)";
                      }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>No pending requests for you as a student.</p>
      );

      // Open Modal with Style
      openModal(requestDisplay);

      setStatusMessage("Fetched requests for student.");
    } catch (error) {
      console.error("Error fetching student requests:", error);
      setStatusMessage(`Failed to fetch student requests: ${error.message}`);
    } finally {
      setIsViewingRequests(false);
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    const contactInfo = prompt("Enter your contact information (required):");
    if (!contactInfo || contactInfo.trim() === "") {
      alert("Contact information is required to accept the request!");
      return;
    }

    try {
      setLoading(true);
      setStatusMessage("Accepting request...");
      const contract = getContract();
      if (!contract) throw new Error("Contract not available");

      const tx = await contract.acceptRequest(requestId, contactInfo);
      await tx.wait();
      setStatusMessage("Request accepted and contact info shared!");
      fetchStudentRequests(); // Refresh the student requests
    } catch (error) {
      console.error("Error accepting request:", error);
      setStatusMessage(`Failed to accept request: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  const handleRejectRequest = async (requestId) => {
    try {
      setLoading(true);
      setStatusMessage("Rejecting request...");
      const contract = getContract();
      if (!contract) throw new Error("Contract not available");

      const tx = await contract.rejectRequest(requestId);
      await tx.wait();
      setStatusMessage("Request rejected and escrow released!");
      fetchStudentRequests(); // Refresh the student requests
    } catch (error) {
      console.error("Error rejecting request:", error);
      setStatusMessage(`Failed to reject request: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };


  const raiseDispute = async (requestId, complaint) => {
    try {
      setIsRaisingDispute(true);
      setLoading(true);
      setStatusMessage("Raising dispute...");
      const contract = getContract();
      if (!contract) throw new Error("Contract not available");

      const tx = await contract.raiseDispute(requestId, complaint); // Pass both requestId and complaint
      await tx.wait();

      setStatusMessage(`Dispute raised successfully for Request ID ${requestId}`);
    } catch (error) {
      console.error("Error raising dispute:", error);
      setStatusMessage(`Failed to raise dispute: ${error.message}`);
    } finally {
      setIsRaisingDispute(false);
      setLoading(false);
    }
  };



  const fetchClientRequests = async () => {
    try {
      setLoading(true);
      setIsViewingRequests(true);

      setStatusMessage("Fetching requests made by client...");
      const contract = getContract();
      if (!contract) throw new Error("Contract not available");

      const requests = await contract.getClientRequests();
      setClientRequests(requests);
      setClientRequestsFetched(true);

      // Prepare modal content
      const clientRequestContent = (
        <div>
          <h3 style={{ textAlign: "center", marginBottom: "20px" }}>Your Client Requests</h3>
          {requests.length > 0 ? (
            <ul style={{ listStyleType: "none", padding: 0 }}>
              {requests.map((request, index) => (
                <li
                  key={index}
                  style={{
                    padding: "10px",
                    marginBottom: "10px",
                    backgroundColor: "#444",
                    borderRadius: "5px",
                    color: "white",
                  }}
                >
                  <p><strong>Request ID:</strong> {request.requestId.toString()}</p>
                  <p><strong>Student Address:</strong> {request.studentAddress}</p>
                  <p><strong>Amount:</strong> {ethers.utils.formatEther(request.amount)} ETH</p>
                  <p>
                    <strong>Status:</strong>{" "}
                    {["Pending", "Accepted", "Rejected", "Completed"][request.status]}
                  </p>
                  {request.contactInfo && (
                    <p><strong>Contact Info:</strong> {request.contactInfo}</p>
                  )}
                  {/* Add "Work Complete" button for "Accepted" requests */}
                  {request.status === 1 && ( // 1 corresponds to "Accepted"
                    <button
                      onClick={() => confirmWork(request.requestId)}
                      style={{
                        padding: "8px 15px",
                        background: "linear-gradient(90deg, #4CAF50, #388E3C)",
                        // linear-gradient(90deg, #f44336, #d32f2f)
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                        boxShadow: "0 3px 5px rgba(0, 0, 0, 0.1)",
                        transition: "transform 0.2s, box-shadow 0.2s",
                      }}

                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";
                        e.currentTarget.style.boxShadow = "0 5px 8px rgba(0, 0, 0, 0.2)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow = "0 3px 5px rgba(0, 0, 0, 0.1)";
                      }}
                    >

                      Work Completed
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No requests made by you as a client.</p>
          )}
        </div>
      );

      // Open modal with the content
      openModal(clientRequestContent);
      setStatusMessage("Fetched requests made by client.");
    } catch (error) {
      console.error("Error fetching client requests:", error);
      setStatusMessage(`Failed to fetch client requests: ${error.message}`);
    } finally {
      setIsViewingRequests(false);
      setLoading(false);
    }
  };




  const acceptRequest = async (requestId) => {
    const contactInfo = prompt("Enter your contact information:");
    try {
      setLoading(true);
      setStatusMessage("Accepting request...");
      const contract = getContract();
      if (!contract) throw new Error("Contract not available");

      const tx = await contract.acceptRequest(requestId, contactInfo);
      await tx.wait();
      setStatusMessage("Request accepted and contact info shared!");
    } catch (error) {
      console.error("Error accepting request:", error);
      setStatusMessage(`Failed to accept request: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const rejectRequest = async (requestId) => {
    try {
      setLoading(true);
      setStatusMessage("Rejecting request...");
      const contract = getContract();
      if (!contract) throw new Error("Contract not available");

      const tx = await contract.rejectRequest(requestId);
      await tx.wait();
      setStatusMessage("Request rejected and escrow released!");
    } catch (error) {
      console.error("Error rejecting request:", error);
      setStatusMessage(`Failed to reject request: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  const confirmWork = async (requestId) => {
    try {
      setLoading(true);
      setStatusMessage("Confirming work...");
      const contract = getContract();
      if (!contract) throw new Error("Contract not available");

      const tx = await contract.confirmWork(requestId);
      await tx.wait();

      setStatusMessage("Work confirmed, funds released to student!");

      // Refresh client requests to update the modal
      fetchClientRequests();
    } catch (error) {
      console.error("Error confirming work:", error);
      setStatusMessage(`Failed to confirm work: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Render a section
  const renderSection = (id: string, title: string, content: JSX.Element) => (

    <section
      id={id}
      //  className="animated-gradient"
      style={{
        position: "relative",
        padding: "40px 20px",
        // background: " radial-gradient(circle at center, #6e00ff, #240046, #000000)",
        marginBottom: "20px",
        borderBottom: "2px solid #ccc",
        overflow: "hidden",
        animation: "gradientAnimation 8s ease infinite",
      }}
    >


      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>{title}</h2>
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "20px",
          background: "rgba(255, 255, 255, 0.2)", // Semi-transparent white
          backdropFilter: "blur(10px)", // Glassy blur effect
          WebkitBackdropFilter: "blur(10px)", // Safari support
          borderRadius: "15px", // Smooth, rounded edges
          border: "1px solid rgba(255, 255, 255, 0.3)", // Subtle border to match the glass effect
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2)", // Add depth with a shadow
        }}
      >
        {content}
      </div>
    </section>
  );

  let statusMessageColor = "";
  if (statusMessage.includes("success") || statusMessage.includes("Success")) {
    statusMessageColor = "#28a745"; // Green for success
  } else if (statusMessage.includes("Failed") || statusMessage.includes("Error")) {
    statusMessageColor = "#dc3545"; // Red for errors
  } else {
    statusMessageColor = "#ffc107"; // Yellow for warnings or loading
  }


  return (
    <div
      style={{
        //fontFamily: "'Poppins', sans-serif", // Apply Poppins globally
        fontFamily: "'Space Grotesk', sans-serif",
        lineHeight: "1.6", // Optional for better readability
      }}
    >
      {/* Floating Particles Background */}
      <FloatingParticles />

      {/* Main Content Wrapper */}
      <div style={{ position: "relative", zIndex: 1 }}></div>

      {/* Navbar */}
      <nav
        style={{
          backgroundColor: "#333",
          padding: "5px 20px",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          display: "flex",
          alignItems: "center", // Center the items vertically
          height: "60px",
          justifyContent: "space-between",
        }}
      >

        {/* Logo Section */}
        <div style={{ marginRight: "20px" }}>
          <Image
            src="/images/logo DL no bg.png"
            alt="Logo"
            width={50} // Adjust the width as needed
            height={50} // Adjust the height as needed
            style={{
              cursor: "pointer",
            }}
          />
        </div>

        {/* Navigation Links */}

        <ul
          style={{
            display: "flex",
            justifyContent: "center",
            listStyle: "none",
            margin: 0,
            padding: 0,
            flex: 1,
          }}
        >
          {["Home", "Student", "Client", "Disputes"].map((item) => (
            <li key={item} style={{ margin: "0 15px" }}>
              <a
                href={`#${item.toLowerCase()}`}
                style={{
                  color: "#fff",
                  textDecoration: "none",
                  fontWeight: "bold",
                  fontSize: "16px",
                }}
              >
                {item}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Fixed Message Section */}
      {statusMessage && (
        <div
          style={{
            position: "fixed",
            top: "50px",
            width: "100%",
            backgroundColor: statusMessageColor,
            color: "white",
            padding: "10px",
            fontWeight: "bold",
            textAlign: "center",
            zIndex: 9999,
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
            opacity: 0.95,
          }}
        >
          {statusMessage}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        ariaHideApp={false}
        style={{
          overlay: { backgroundColor: "rgba(0, 0, 0, 0.5)" },
          content: {
            //color: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)", // Blur effect
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            padding: "20px",
            maxWidth: "600px",
            margin: "auto",
            borderRadius: "15px",
            border: "1px solid rgba(255, 255, 255, 0.2)", // Subtle border
            boxShadow: "0 4px 30px rgba(255, 255, 255, 0.2)", // Add depth
          },
        }}
      >
        <button
          onClick={closeModal}
          style={{
            padding: "8px 15px",
            background: "linear-gradient(90deg, #f44336, #d32f2f)",
            color: "white",
            border: "none",
            borderRadius: "3px",
            cursor: "pointer",
            boxShadow: "0 3px 5px rgba(0, 0, 0, 0.1)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}

          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.boxShadow = "0 5px 8px rgba(0, 0, 0, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 3px 5px rgba(0, 0, 0, 0.1)";
          }}
        >

          Close
        </button>
        {modalContent}
      </Modal>

      {/* Sections */}
      {renderSection(
        "home",
        "",
        <>
          <div
            style={{
              textAlign: "center",
              color: "white",
              padding: "30px",
              backgroundColor: "#2C2F33",
              borderRadius: "8px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
            }}
          >
            <h1
              style={{
                fontSize: "48px",
                fontWeight: "700", // Bold for emphasis
                marginBottom: "20px",
                color: "#ffffff",
                fontFamily: "'Space Grotesk', sans-serif", // Apply Space Grotesk
                textAlign: "center", // Center-align 
              }}
            >
              Welcome to Delance DApp
            </h1>

            <p
              style={{
                fontSize: "18px",
                marginBottom: "30px",
                fontFamily: "'Space Grotesk', sans-serif",
                color: "#DDDDDD",
              }}
            >
              The blockchain platform connecting clients and students seamlessly through trust and transparency.
            </p>
            <div
              style={{
                padding: "10px",
                borderRadius: "5px",
                backgroundColor: connected ? "#17a61d" : "#E53935",
                color: "white",
                fontWeight: "bold",
                fontFamily: "'Space Grotesk', sans-serif",
                display: "inline-block",
              }}
            >
              {connected ? `Wallet connected: ${walletAddress}` : "Wallet not connected!"}
            </div>
          </div>
        </>
      )}



      {renderSection(
        "student",
        <span style={{ fontWeight: "bold", color: "#ffff" }}>Student</span>,
        <>
          {/* Register as Student */}
          <div
            style={{
              backgroundColor: "#2C2F33",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "20px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
            }}
          >
            <h3 style={{ color: "#FFFFFF", marginBottom: "15px" }}>Register as Student</h3>
            <input
              type="text"
              placeholder="Pseudonym"
              value={pseudonym}
              onChange={(e) => setPseudonym(e.target.value)}
              className="input-field"
            // style={{
            //   width: "100%",
            //   padding: "10px",
            //   marginBottom: "10px",
            //   borderRadius: "4px",
            //   border: "1px solid #ccc",
            //   backgroundColor: "#FFFFFF",
            //   color: "#000000",
            // }}
            />
            <input
              type="text"
              placeholder="Skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                backgroundColor: "#FFFFFF",
                color: "#000000",
              }}
            />
            <input
              type="text"
              placeholder="Rate in ETH"
              value={priceInWei}
              onChange={(e) => setPriceInWei(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                backgroundColor: "#FFFFFF",
                color: "#000000",
              }}
            />
            <input
              type="text"
              placeholder="Portfolio Link (e.g., https://portfolio.com)"
              value={portfolioLink}
              onChange={(e) => setPortfolioLink(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "20px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                backgroundColor: "#FFFFFF",
                color: "#000000",
              }}
            />
            <button
              onClick={registerAsStudent}
              disabled={isRegisteringStudent}

              style={{
                padding: "10px 20px",
                background: isRegisteringStudent ? "#555" : "linear-gradient(90deg, #7F00FF, #1E90FF)",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isRegisteringStudent ? "not-allowed" : "pointer",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.5s ease-in-out",
              }}

              onMouseEnter={(e) => {
                if (!isRegisteringStudent) {
                  e.currentTarget.style.background =
                    " linear-gradient(90deg, #240046, #7F00FF)"; // Hover gradient #3085a1
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow = "0 6px 10px rgba(0, 0, 0, 0.2)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isRegisteringStudent) {
                  e.currentTarget.style.background =
                    "linear-gradient(90deg, #7F00FF, #1E90FF)"; // Original gradient
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
                }
              }}
            >
              {isRegisteringStudent ? (
                <>
                  <div className="spinner" />
                  <span>Registering...</span>
                </>
              ) : (
                "Register"
              )}
            </button>
          </div>

          {/* Update Student Details */}
          <div
            style={{
              backgroundColor: "#2C2F33",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "20px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
            }}
          >
            <h3 style={{ color: "#FFFFFF", marginBottom: "15px" }}>Update Student Details</h3>
            <input
              type="text"
              placeholder="New Pseudonym"
              value={updatePseudonym}
              onChange={(e) => setUpdatePseudonym(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                backgroundColor: "#FFFFFF",
                color: "#000000",
              }}
            />
            <input
              type="text"
              placeholder="New Skills"
              value={updateSkills}
              onChange={(e) => setUpdateSkills(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                backgroundColor: "#FFFFFF",
                color: "#000000",
              }}
            />
            <input
              type="text"
              placeholder="New Rate in ETH"
              value={updateRateInWei}
              onChange={(e) => setUpdateRateInWei(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                backgroundColor: "#FFFFFF",
                color: "#000000",
              }}
            />
            <input
              type="text"
              placeholder="New Portfolio Link"
              value={updatePortfolioLink}
              onChange={(e) => setUpdatePortfolioLink(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "20px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                backgroundColor: "#FFFFFF",
                color: "#000000",
              }}
            />
            <button
              onClick={updateStudentDetails}
              disabled={isUpdatingStudentDetails}
              style={{
                padding: "10px 20px",
                background: isUpdatingStudentDetails ? "#555" : "linear-gradient(90deg, #7F00FF, #1E90FF)",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isUpdatingStudentDetails ? "not-allowed" : "pointer",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.5s ease-in-out",
              }}

              onMouseEnter={(e) => {
                if (!isUpdatingStudentDetails) {
                  e.currentTarget.style.background =
                    " linear-gradient(90deg, #240046, #7F00FF)"; // Hover gradient #3085a1
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow = "0 6px 10px rgba(0, 0, 0, 0.2)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isUpdatingStudentDetails) {
                  e.currentTarget.style.background =
                    "linear-gradient(90deg, #7F00FF, #1E90FF)"; // Original gradient
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
                }
              }}
            >
              {isUpdatingStudentDetails ? (
                <>
                  <div className="spinner" />
                  <span>Updating...</span>
                </>
              ) : (
                "Update"
              )}
            </button>
          </div>

          {/* View Received Requests */}
          <div
            style={{
              backgroundColor: "#2C2F33",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
            }}
          >
            <h3 style={{ color: "#FFFFFF", marginBottom: "15px" }}>
              View Service Requests Received
            </h3>
            <button
              onClick={fetchStudentRequests}
              disabled={isViewingRequests}
              style={{
                padding: "10px 20px",
                background: isViewingRequests ? "#555" : "linear-gradient(90deg, #7F00FF, #1E90FF)",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isViewingRequests ? "not-allowed" : "pointer",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.5s ease-in-out",
              }}

              onMouseEnter={(e) => {
                if (!isViewingRequests) {
                  e.currentTarget.style.background =
                    " linear-gradient(90deg, #240046, #7F00FF)"; // Hover gradient #3085a1
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow = "0 6px 10px rgba(0, 0, 0, 0.2)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isViewingRequests) {
                  e.currentTarget.style.background =
                    "linear-gradient(90deg, #7F00FF, #1E90FF)"; // Original gradient
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
                }
              }}
            >
              {isViewingRequests ? (
                <>
                  <div className="spinner" />
                  <span>Fetching...</span>
                </>
              ) : (
                "View Requests"
              )}

            </button>
          </div>
        </>
      )}

      {renderSection(
        "client",
        <span style={{ fontWeight: "bold", color: "#ffff" }}>Client</span>,
        <>
          {/* Register as Client */}
          <div
            style={{
              backgroundColor: "#2C2F33",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "20px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
            }}
          >
            <h3 style={{ color: "#FFFFFF", marginBottom: "15px" }}>Register as Client</h3>
            <button
              onClick={registerAsClient}
              disabled={isRegisteringClient}
              style={{
                padding: "10px 20px",
                background: isRegisteringClient ? "#555" : "linear-gradient(90deg, #7F00FF, #1E90FF)",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isRegisteringClient ? "not-allowed" : "pointer",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.5s ease-in-out",
              }}

              onMouseEnter={(e) => {
                if (!isRegisteringClient) {
                  e.currentTarget.style.background =
                    " linear-gradient(90deg, #240046, #7F00FF)"; // Hover gradient #3085a1
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow = "0 6px 10px rgba(0, 0, 0, 0.2)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isRegisteringClient) {
                  e.currentTarget.style.background =
                    "linear-gradient(90deg, #7F00FF, #1E90FF)"; // Original gradient
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
                }
              }}
            >
              {isRegisteringClient ? (
                <>
                  <div className="spinner" />
                  <span>Registering...</span>
                </>
              ) : (
                "Register"
              )}
            </button>
          </div>

          {/* View Available Students */}
          <div
            style={{
              backgroundColor: "#2C2F33",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "20px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
            }}
          >
            <h3 style={{ color: "#FFFFFF", marginBottom: "15px" }}>
              View Available Students
            </h3>
            <button
              onClick={fetchStudents}
              disabled={isViewingStudents}

              style={{
                padding: "10px 20px",
                background: isViewingStudents ? "#555" : "linear-gradient(90deg, #7F00FF, #1E90FF)",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isViewingStudents ? "not-allowed" : "pointer",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.5s ease-in-out",
              }}

              onMouseEnter={(e) => {
                if (!isViewingStudents) {
                  e.currentTarget.style.background =
                    " linear-gradient(90deg, #240046, #7F00FF)"; // Hover gradient #3085a1
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow = "0 6px 10px rgba(0, 0, 0, 0.2)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isViewingStudents) {
                  e.currentTarget.style.background =
                    "linear-gradient(90deg, #7F00FF, #1E90FF)"; // Original gradient
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
                }
              }}
            >
              {isViewingStudents ? (
                <>
                  <div className="spinner" />
                  <span>Fetching...</span>
                </>
              ) : (
                "View Students"
              )}


            </button>
          </div>

          {/* View Requests Made */}
          <div
            style={{
              backgroundColor: "#2C2F33",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
            }}
          >
            <h3 style={{ color: "#FFFFFF", marginBottom: "15px" }}>View Requests Made</h3>
            <button
              onClick={fetchClientRequests}
              disabled={isViewingRequests}
              style={{
                padding: "10px 20px",
                background: isViewingRequests ? "#555" : "linear-gradient(90deg, #7F00FF, #1E90FF)",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isViewingRequests ? "not-allowed" : "pointer",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.5s ease-in-out",
              }}

              onMouseEnter={(e) => {
                if (!isViewingRequests) {
                  e.currentTarget.style.background =
                    " linear-gradient(90deg, #240046, #7F00FF)"; // Hover gradient #3085a1
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow = "0 6px 10px rgba(0, 0, 0, 0.2)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isViewingRequests) {
                  e.currentTarget.style.background =
                    "linear-gradient(90deg, #7F00FF, #1E90FF)"; // Original gradient
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
                }
              }}
            >
              {isViewingRequests ? (
                <>
                  <div className="spinner" />
                  <span>Fetching...</span>
                </>
              ) : (
                "View Requests"
              )}
            </button>
          </div>
        </>
      )}

      {renderSection(
        "disputes",
        <span style={{ fontWeight: "bold", color: "#ffff" }}>Disputes (Admin Only)</span>,
        <>
          {/* Raise Dispute */}
          <div
            style={{
              backgroundColor: "#2C2F33",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "20px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
            }}
          >
            <h3 style={{ color: "#FFFFFF", marginBottom: "15px" }}>Raise Dispute</h3>
            <input
              id="raiseDisputeRequestId"
              type="text"
              placeholder="Enter Request ID"
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                backgroundColor: "#FFFFFF",
                color: "#000000",
              }}
            />
            <textarea
              id="raiseDisputeComplaint"
              placeholder="Enter your complaint"
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                backgroundColor: "#FFFFFF",
                color: "#000000",
                resize: "none",
              }}
              rows={4}
            />
            <button
              onClick={() => {
                const requestId = (document.getElementById(
                  "raiseDisputeRequestId"
                ) as HTMLInputElement).value;
                const complaint = (document.getElementById(
                  "raiseDisputeComplaint"
                ) as HTMLTextAreaElement).value;

                if (!requestId || !complaint) {
                  alert("Please fill in both Request ID and Complaint.");
                  return;
                }
                raiseDispute(requestId, complaint);
              }}
              disabled={isRaisingDispute}
              style={{
                padding: "10px 20px",
                background: isRaisingDispute ? "#555" : "linear-gradient(90deg, #54208a, #ff0000)",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isRaisingDispute ? "not-allowed" : "pointer",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.5s ease-in-out",
              }}

              onMouseEnter={(e) => {
                if (!isRaisingDispute) {
                  e.currentTarget.style.background =
                    " linear-gradient(90deg, #240046, #7F00FF)"; // Hover gradient #3085a1
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow = "0 6px 10px rgba(0, 0, 0, 0.2)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isRaisingDispute) {
                  e.currentTarget.style.background =
                    "linear-gradient(90deg, #54208a, #ff0000)"; // Original gradient
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
                }
              }}
            >
              {isRaisingDispute ? (
                <>
                  <div className="spinner" />
                  <span>Raising...</span>
                </>
              ) : (
                "Raise Dispute"
              )}

            </button>
          </div>


          {/* View Disputes */}
          <div
            style={{
              backgroundColor: "#2C2F33",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
            }}
          >
            <h3 style={{ color: "#FFFFFF", marginBottom: "15px" }}>View Disputes</h3>
            <button
              onClick={fetchDisputes}
              disabled={isViewingDisputes}
              style={{
                padding: "10px 20px",
                background: isViewingDisputes ? "#555" : "linear-gradient(90deg, #54208a, #ff0000)",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isViewingDisputes ? "not-allowed" : "pointer",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.5s ease-in-out",
              }}

              onMouseEnter={(e) => {
                if (!isViewingDisputes) {
                  e.currentTarget.style.background =
                    " linear-gradient(90deg, #240046, #7F00FF)"; // Hover gradient #3085a1
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow = "0 6px 10px rgba(0, 0, 0, 0.2)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isViewingDisputes) {
                  e.currentTarget.style.background =
                    "linear-gradient(90deg, #54208a, #ff0000)"; // Original gradient
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
                }
              }}
            >
              {isViewingDisputes ? (
                <>
                  <div className="spinner" />
                  <span>Fetching...</span>
                </>
              ) : (
                "View Disputes"
              )}

            </button>
          </div>
        </>
      )}

    </div>
  );
}
