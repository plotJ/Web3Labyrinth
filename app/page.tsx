"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { ethers } from 'ethers';
import LabyrinthGameABI from '@/contracts/LabyrinthGame.json';
import { ArrowUpIcon, ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, ClockIcon, TrophyIcon } from '@heroicons/react/24/solid';
import { Labyrinth, CANVAS_WIDTH, CANVAS_HEIGHT, TIME_LIMIT } from '@/components/Labyrinth'; 


const Frontend: React.FC = () => {
    const [isWalletConnected, setIsWalletConnected] = useState(false);
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [signer, setSigner] = useState<ethers.Signer | null>(null);
    const [contract, setContract] = useState<ethers.Contract | null>(null);
    const [gameInstance, setGameInstance] = useState<Labyrinth | null>(null);
    const [walletAddress, setWalletAddress] = useState<string>('');
    const [gameTime, setGameTime] = useState<string>('00:00');
    const [gameScore, setGameScore] = useState<number>(0);
    const [transactionStatus, setTransactionStatus] = useState<string>('');
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(TIME_LIMIT);

    const contractAddress = '0xdbde4c6a6a7b7c55309242d8e3e1c86fbf0cf2e5';

    useEffect(() => {
      if (isGameStarted && canvasRef.current) {
          const newGame = new Labyrinth(canvasRef.current);
          setGameInstance(newGame);
          newGame.draw();
  
          const handleKeyDown = (event: KeyboardEvent) => {
              if (!newGame) return;
  
              if (event.code === 'Space' && !newGame.started) {
                  newGame.start();
                  return;
              }
  
              if (newGame.gameOver && event.code === 'KeyR') {
                  setGameInstance(new Labyrinth(canvasRef.current!));
                  return;
              }
  
              switch(event.key) {
                  case 'ArrowUp':
                      newGame.move(0, -5);
                      break;
                  case 'ArrowDown':
                      newGame.move(0, 5);
                      break;
                  case 'ArrowLeft':
                      newGame.move(-5, 0);
                      break;
                  case 'ArrowRight':
                      newGame.move(5, 0);
                      break;
              }
          };
  
          document.addEventListener('keydown', handleKeyDown);
  
          const gameLoop = setInterval(() => {
              if (newGame.gameOver) {
                  clearInterval(gameLoop);
                  if (newGame.win) {
                      alert('You win!');
                      endGame(true);
                  } else {
                      alert('Game over!');
                      endGame(false);
                  }
              } else {
                  newGame.update();
                  newGame.draw();
                  setTimeLeft(newGame.timeLeft); // Update the time left state
              }
          }, 1000 / 60); // 60 FPS
  
          return () => {
              document.removeEventListener('keydown', handleKeyDown);
              clearInterval(gameLoop);
          };
      }
  }, [isGameStarted]);
  

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
        try {
            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Create a new provider
            const provider = new ethers.BrowserProvider(window.ethereum);
            
            // Get the signer
            const signer = await provider.getSigner();
            setSigner(signer);

            // Get the connected wallet address
            const address = await signer.getAddress();
            setWalletAddress(address);

            // Initialize the contract
            const labyrinthGameContract = new ethers.Contract(
                contractAddress,
                LabyrinthGameABI,  // Note: We're using the ABI directly, not LabyrinthGameABI.abi
                signer
            );
            setContract(labyrinthGameContract);
            setIsWalletConnected(true);
            console.log("Wallet connected and contract initialized.");
        } catch (error) {
            console.error("Failed to connect wallet:", error);
            alert("Failed to connect wallet. Please check your MetaMask settings.");
        }
    } else {
        alert('Please install MetaMask!');
    }
};

    const startGame = async () => {
        if (!contract) return;

        try {
            setTransactionStatus('Pending');
            const tx = await contract.startGame({ value: ethers.parseEther("0.05") });
            await tx.wait();
            setIsGameStarted(true);
            setTransactionStatus('Completed');
            console.log("Game started successfully");
        } catch (error) {
            console.error("Transaction failed:", error);
            setTransactionStatus('Failed');
        }
    };

    const endGame = async (won: boolean) => {
        if (!contract || !signer) return;

        try {
            const tx = await contract.endGame(await signer.getAddress(), won);
            await tx.wait();
            console.log("Game ended successfully");
        } catch (error) {
            console.error("Failed to end game:", error);
        }
    };

    const claimWinnings = async () => {
        if (!contract) return;

        try {
            const tx = await contract.claimWinnings();
            await tx.wait();
            console.log("Winnings claimed successfully");
        } catch (error) {
            console.error("Failed to claim winnings:", error);
        }
    };

    return (
        <div className="grid min-h-screen grid-cols-[300px_1fr] bg-background text-foreground">
            <aside className="border-r border-muted p-6">
                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold">Game Rules</h2>
                        <p className="mt-2 text-muted-foreground">
                            Navigate the labyrinth to reach the exit. Avoid obstacles and traps to complete the game.
                        </p>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Payout Info</h2>
                        <p className="mt-2 text-muted-foreground">Successfully completing the game will reward you with 0.1 ETH. A win state transaction must be completed before you can initiate the payout transaction.</p>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Blockchain Integration</h2>
                        <p className="mt-2 text-muted-foreground">
                            The game requires a wallet to be connected to the Sepolia testnet in order to load. Once you've connected your wallet and paid the .05 Sepolia ETH fee, the game will appear. A transaction will appear after you've lost to let the blockchain know you've lost. Or you can hit refresh to play again.
                        </p>
                    </div>
                    {/* GitHub Button */}
                    <a href="https://github.com/plotJ/Web3Labyrinth" target="_blank" rel="noopener noreferrer">
                            View on GitHub
                    </a>
                </div>
            </aside>
            <main className="flex flex-col gap-8 p-8">
                <div className="grid grid-cols-[1fr_1fr] items-start gap-8">
                    <div className="relative">
                        <canvas 
                            ref={canvasRef}
                            id="gameCanvas" 
                            width={CANVAS_WIDTH} 
                            height={CANVAS_HEIGHT} 
                            className="rounded-lg border border-muted" 
                        />
                        
                    </div>
                    <div className="space-y-4">
                        {!isWalletConnected ? (
                            <Button
                                onClick={connectWallet}
                                className="w-full rounded-lg bg-secondary px-4 py-2 text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                Connect Wallet
                            </Button>
                        ) : !isGameStarted ? (
                            <Button
                                onClick={startGame}
                                className="w-full rounded-lg bg-primary px-4 py-2 text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                Start Game
                            </Button>
                        ) : (
                            <Button
                                onClick={claimWinnings}
                                className="w-full rounded-lg bg-secondary px-4 py-2 text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                Claim Winnings
                            </Button>
                        )}
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">Wallet Connection</h2>
                            <div className="flex items-center gap-2">
                                <div className="text-sm text-muted-foreground">{walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not connected'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-[1fr_1fr_1fr] items-start gap-8">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">Game Controls</h2>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <ArrowUpIcon className="h-4 w-4" />
                                Move Up
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <ArrowDownIcon className="h-4 w-4" />
                                Move Down
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <ArrowLeftIcon className="h-4 w-4" />
                                Move Left
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <ArrowRightIcon className="h-4 w-4" />
                                Move Right
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">Game Info</h2>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <ClockIcon className="h-4 w-4" />
                                <span>Time: {gameTime}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <TrophyIcon className="h-4 w-4" />
                                <span>Score: {gameScore}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">Transaction</h2>
                            <Button
                                className="w-full rounded-lg bg-secondary px-4 py-2 text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                onClick={startGame}
                                disabled={!isWalletConnected || isGameStarted}
                            >
                                Pay to Play (0.05 ETH)
                            </Button>
                            <div className="text-sm text-muted-foreground">Transaction Status: {transactionStatus}</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-[1fr_1fr] items-start gap-8">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">Game Over</h2>
                            <Button
                                className="w-full rounded-lg bg-secondary px-4 py-2 text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                onClick={claimWinnings}
                                disabled={!isGameStarted}
                            >
                                Claim Prize (0.1 ETH)
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">Play Again</h2>
                            <Button
                                className="w-full rounded-lg bg-secondary px-4 py-2 text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                onClick={() => {
                                    setIsGameStarted(false);
                                    setGameInstance(null);
                                    setGameTime('00:00');
                                    setGameScore(0);
                                    setTransactionStatus('');
                                }}
                                disabled={!isGameStarted}
                            >
                                Play Again
                            </Button>
                        </div>
                    </div>
                </main>
            </div>
        );
    };
    
    export default Frontend;
