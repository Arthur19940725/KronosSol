#!/bin/bash

# Kronos DApp Deployment Script
echo "🚀 Starting Kronos DApp deployment..."

# Set Solana network to devnet
echo "📡 Setting Solana network to devnet..."
solana config set --url https://api.devnet.solana.com

# Check if wallet exists, create if not
if [ ! -f ~/.config/solana/id.json ]; then
    echo "🔑 Creating new Solana wallet..."
    solana-keygen new --no-bip39-passphrase
fi

# Get wallet address
WALLET_ADDRESS=$(solana address)
echo "💰 Wallet address: $WALLET_ADDRESS"

# Check balance and airdrop if needed
BALANCE=$(solana balance)
echo "💵 Current balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 1" | bc -l) )); then
    echo "🪂 Requesting airdrop..."
    solana airdrop 2
fi

# Build the program
echo "🔨 Building Solana program..."
anchor build

# Deploy the program
echo "🚀 Deploying program to devnet..."
anchor deploy --provider.cluster devnet

# Get program ID
PROGRAM_ID=$(solana address -k target/deploy/kronos_dapp-keypair.json)
echo "📋 Program ID: $PROGRAM_ID"

# Update frontend config with program ID
echo "⚙️ Updating frontend configuration..."
sed -i "s/KronosDApp1111111111111111111111111111111111/$PROGRAM_ID/g" app/lib/config.ts

echo "✅ Deployment completed!"
echo "🌐 Program ID: $PROGRAM_ID"
echo "🔗 Devnet Explorer: https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
