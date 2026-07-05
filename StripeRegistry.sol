// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract StripeRegistry {
    address public owner;
    
    struct PaymentRecord {
        address wallet;
        string stripeSessionId;
        uint256 amountInCents;
        uint256 timestamp;
        bool exists;
    }
    
    mapping(string => PaymentRecord) public payments;
    string[] public paymentIds;
    
    event PaymentLogged(address indexed wallet, string indexed sessionId, uint256 amount, uint256 timestamp);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function registerPayment(address _wallet, string memory _sessionId, uint256 _amount) external onlyOwner {
        require(!payments[_sessionId].exists, "Payment already registered");
        
        payments[_sessionId] = PaymentRecord({
            wallet: _wallet,
            stripeSessionId: _sessionId,
            amountInCents: _amount,
            timestamp: block.timestamp,
            exists: true
        });
        
        paymentIds.push(_sessionId);
        emit PaymentLogged(_wallet, _sessionId, _amount, block.timestamp);
    }
    
    function getPayment(string memory _sessionId) external view returns (address, string memory, uint256, uint256) {
        require(payments[_sessionId].exists, "Payment does not exist");
        PaymentRecord memory p = payments[_sessionId];
        return (p.wallet, p.stripeSessionId, p.amountInCents, p.timestamp);
    }
}
