// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract LabyrinthGame {
    address public owner;
    uint256 public constant GAME_COST = 0.05 ether;
    uint256 public constant WINNING_MULTIPLIER = 2;

    event GameStarted(address player);
    event GameWon(address player, uint256 payout);
    event GameLost(address player);

    constructor() {
        owner = msg.sender;
    }

    function startGame() external payable {
        require(msg.value == GAME_COST, "Incorrect payment amount");
        emit GameStarted(msg.sender);
    }

    function endGame(address player, bool won) external {
        require(msg.sender == owner, "Only owner can end game");
        if (won) {
            uint256 payout = GAME_COST *
