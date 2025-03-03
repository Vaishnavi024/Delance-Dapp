// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Delance {
    address public owner;

    enum RequestStatus {
        Pending,
        Accepted,
        Rejected,
        Completed
    }

    struct Student {
        uint256 studentId;
        address studentAddress;
        string pseudonym;
        string skills;
        uint256 priceInWei;
        bool isAvailable;
        string portfolioLink; 
    }

    struct Request {
        uint256 requestId;
        address client;
        address studentAddress;
        uint256 amount;
        RequestStatus status;
        bool isDisputeRaised;
        bool isWorkConfirmed;
        string contactInfo;
        string jobDescriptionLink;
        string complaint;
    }

    mapping(address => bool) public isClient;
    mapping(uint256 => Student) public studentsById;
    mapping(uint256 => Request) public requests;
    uint256 public requestCounter;
    uint256 public studentCounter;
    mapping(address => uint256) public studentIdsByAddress;
    mapping(address => uint256[]) public clientRequests; // Client => Request IDs
    mapping(address => uint256[]) public studentRequests; // Student => Request IDs

    address[] public studentAddresses;

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Only the contract owner can perform this action"
        );
        _;
    }

    modifier onlyClient() {
        require(isClient[msg.sender], "You must be a registered client");
        _;
    }

    modifier onlyStudent(uint256 _studentId) {
        require(
            studentIdsByAddress[msg.sender] == _studentId,
            "You are not the student for this request"
        );
        _;
    }

    modifier onlyConcernedParties(uint256 _requestId) {
        Request storage request = requests[_requestId];
        require(
            msg.sender == request.client ||
                msg.sender == request.studentAddress,
            "You are not authorized to view this request"
        );
        _;
    }

    event RegisteredAsClient(address client);
    event RegisteredAsStudent(
        uint256 studentId,
        address studentAddress,
        string pseudonym,
        string skills,
        uint256 priceInWei,
        string portfolioLink
    );
    event ServiceRequested(
        uint256 requestId,
        address client,
        address studentAddress,
        uint256 amount,
        string jobDescriptionLink
    );
    event RequestAccepted(uint256 requestId, string contactInfo);
    event RequestRejected(uint256 requestId);
    event WorkConfirmed(uint256 requestId);
    event DisputeRaised(uint256 requestId, string complaint);
    event DisputeResolved(uint256 requestId, bool clientWins);
    event StudentUpdated(
        uint256 studentId,
        string pseudonym,
        string skills,
        uint256 priceInWei,
        string portfolioLink
    );
    event StudentDeleted(uint256 studentId);

    constructor() {
        owner = msg.sender;
    }

    function registerAsClient() public {
        require(!isClient[msg.sender], "Already registered as a client");
        isClient[msg.sender] = true;
        emit RegisteredAsClient(msg.sender);
    }

    function registerAsStudent(
        string memory _pseudonym,
        string memory _skills,
        uint256 _priceInWei,
        string memory _portfolioLink
    ) public {
        require(
            studentIdsByAddress[msg.sender] == 0,
            "Already registered as a student"
        );
        studentCounter++;
        studentsById[studentCounter] = Student(
            studentCounter,
            msg.sender,
            _pseudonym,
            _skills,
            _priceInWei,
            true,
            _portfolioLink
        );
        studentAddresses.push(msg.sender);
        studentIdsByAddress[msg.sender] = studentCounter;
        emit RegisteredAsStudent(
            studentCounter,
            msg.sender,
            _pseudonym,
            _skills,
            _priceInWei,
            _portfolioLink
        );
    }

    function updateStudentDetails(
        uint256 _studentId,
        string memory _pseudonym,
        string memory _skills,
        uint256 _priceInWei,
        string memory _portfolioLink
    ) public onlyStudent(_studentId) {
        Student storage student = studentsById[_studentId];
        student.pseudonym = _pseudonym;
        student.skills = _skills;
        student.priceInWei = _priceInWei;
        student.portfolioLink = _portfolioLink;
        emit StudentUpdated(
            _studentId,
            _pseudonym,
            _skills,
            _priceInWei,
            _portfolioLink
        );
    }

    function deleteStudentListing(
        uint256 _studentId
    ) public onlyStudent(_studentId) {
        Student storage student = studentsById[_studentId];
        student.isAvailable = false;
        emit StudentDeleted(_studentId);
    }

    function viewStudents() public view returns (Student[] memory) {
        Student[] memory allStudents = new Student[](studentCounter);
        for (uint256 i = 1; i <= studentCounter; i++) {
            allStudents[i - 1] = studentsById[i];
        }
        return allStudents;
    }

    function requestService(
        uint256 _studentId,
        string memory _jobDescriptionLink
    ) public payable onlyClient {
        require(
            studentsById[_studentId].studentAddress != address(0),
            "Student not registered"
        );
        require(
            studentsById[_studentId].isAvailable,
            "Student is not available"
        );

        uint256 amountInWei = studentsById[_studentId].priceInWei;
        require(msg.value >= amountInWei, "Insufficient payment");

        requestCounter++;
         requests[requestCounter] = Request(
        requestCounter,
        msg.sender,
        studentsById[_studentId].studentAddress,
        msg.value,
        RequestStatus.Pending,
        false,
        false,
        "", // Placeholder for contactInfo
        _jobDescriptionLink,
        "" // Placeholder for complaint
    );

        clientRequests[msg.sender].push(requestCounter);
        studentRequests[studentsById[_studentId].studentAddress].push(
            requestCounter
        );

        emit ServiceRequested(
            requestCounter,
            msg.sender,
            studentsById[_studentId].studentAddress,
            msg.value,
            _jobDescriptionLink
        );
    }

    function acceptRequest(
        uint256 _requestId,
        string memory _contactInfo
    ) public onlyConcernedParties(_requestId) {
        Request storage request = requests[_requestId];
        require(
            request.status == RequestStatus.Pending,
            "Request already handled"
        );

        request.status = RequestStatus.Accepted;
        request.contactInfo = _contactInfo;
        emit RequestAccepted(_requestId, _contactInfo);
    }

    function rejectRequest(
        uint256 _requestId
    ) public onlyConcernedParties(_requestId) {
        Request storage request = requests[_requestId];
        require(
            request.status == RequestStatus.Pending,
            "Request already handled"
        );

        request.status = RequestStatus.Rejected;
        address client = request.client;
        uint256 amount = request.amount;
        delete requests[_requestId];

        payable(client).transfer(amount);
        emit RequestRejected(_requestId);
    }

    function confirmWork(
        uint256 _requestId
    ) public onlyConcernedParties(_requestId) {
        Request storage request = requests[_requestId];
        require(
            request.status == RequestStatus.Accepted,
            "Request not accepted"
        );
        require(!request.isWorkConfirmed, "Work already confirmed");

        request.isWorkConfirmed = true;
        request.status = RequestStatus.Completed;
        address student = request.studentAddress;
        uint256 amount = request.amount;

        payable(student).transfer(amount);
        emit WorkConfirmed(_requestId);
    }

    function raiseDispute(
        uint256 _requestId, string memory _complaint
    ) public onlyConcernedParties(_requestId) {
        Request storage request = requests[_requestId];
        require(
            request.status == RequestStatus.Accepted,
            "Request not accepted"
        );
        require(!request.isWorkConfirmed, "Work already confirmed");
        require(!request.isDisputeRaised, "Dispute already raised");

        request.isDisputeRaised = true;
        request.complaint = _complaint;
        emit DisputeRaised(_requestId, _complaint);
    }

    function resolveDispute(
        uint256 _requestId,
        bool clientWins
    ) public onlyOwner {
        Request storage request = requests[_requestId];
        require(request.isDisputeRaised, "No dispute to resolve");

        address client = request.client;
        address student = request.studentAddress;
        uint256 amount = request.amount;

        if (clientWins) {
            payable(client).transfer(amount);
        } else {
            payable(student).transfer(amount);
        }

        delete requests[_requestId];
        emit DisputeResolved(_requestId, clientWins);
    }

    function getStudentRequests() public view returns (Request[] memory) {
        uint256[] storage requestIds = studentRequests[msg.sender];
        Request[] memory studentReqs = new Request[](requestIds.length);

        for (uint256 i = 0; i < requestIds.length; i++) {
            studentReqs[i] = requests[requestIds[i]];
        }
        return studentReqs;
    }

    function getClientRequests() public view returns (Request[] memory) {
        uint256[] storage requestIds = clientRequests[msg.sender];
        Request[] memory clientReqs = new Request[](requestIds.length);

        for (uint256 i = 0; i < requestIds.length; i++) {
            clientReqs[i] = requests[requestIds[i]];
        }
        return clientReqs;
    }


// ** getDisputes function**
function getDisputes() public view returns (Request[] memory) {
    uint256 totalRequests = requestCounter;
    uint256 disputeCount = 0;

    // First count the number of disputes
    for (uint256 i = 1; i <= totalRequests; i++) {
        if (requests[i].isDisputeRaised) {
            disputeCount++;
        }
    }

    // Create an array for disputes
    Request[] memory disputes = new Request[](disputeCount);
    uint256 counter = 0;

    // Populate the disputes array
    for (uint256 i = 1; i <= totalRequests; i++) {
        if (requests[i].isDisputeRaised) {
            disputes[counter] = requests[i];
            counter++;
        }
    }

    return disputes;
}
}