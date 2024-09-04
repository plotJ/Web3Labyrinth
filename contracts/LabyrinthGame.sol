// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract LabyrinthGame {
    address public owner;
    uint256 public constant GAME_COST = 0.05 ether;
    uint256 public constant WINNING_MULTIPLIER = 2;
    
    mapping(address => bool) public canPlay;
    mapping(address => uint256) public pendingWinnings;

    event GameStarted(address player);
    event GameWon(address player, uint256 payout);
    event GameLost(address player);
    event WinningsClaimed(address player, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    function startGame() external payable {
        require(msg.value == GAME_COST, "Incorrect payment amount");
        canPlay[msg.sender] = true;
        emit GameStarted(msg.sender);
    }

    function endGame(address player, bool won) external {
        require(msg.sender == owner, "Only owner can end game");
        require(canPlay[player], "Player hasn't paid to play");
        
        canPlay[player] = false;
        
        if (won) {
            uint256 payout = GAME_COST * WINNING_MULTIPLIER;
            pendingWinnings[player] += payout;
            emit GameWon(player, payout);
        } else {
            emit GameLost(player);
        }
    }

    function claimWinnings() external {
        uint256 winnings = pendingWinnings[msg.sender];
        require(winnings > 0, "No winnings to claim");
        
        pendingWinnings[msg.sender] = 0;
        payable(msg.sender).transfer(winnings);
        emit WinningsClaimed(msg.sender, winnings);
    }

    function withdraw() external {
        require(msg.sender == owner, "Only owner can withdraw");
        uint256 balance = address(this).balance;
        payable(owner).transfer(balance);
    }

    // Function to check contract balance
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {}
}
