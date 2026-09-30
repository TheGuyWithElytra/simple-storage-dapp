# Simple Storage mobile dapp

A new responsive dapp using the supplied, unchanged SimpleStorage Solidity contract. The reference ZIP was consulted for its wallet-based read/write approach. This app runs as a static site on Render; it never receives wallet private keys.

## Publish on Render

1. Create a GitHub repository and upload **the contents of this folder** at its root (including package-lock.json).
2. Sign in at https://dashboard.render.com and choose **New → Static Site**. Connect that repository.
3. Set **Build Command** to `npm ci && npm run build` and **Publish Directory** to `dist`.
4. Choose **Create Static Site**. Open the resulting HTTPS `onrender.com` address.

Alternatively choose **New → Blueprint** with the same repository; the included render.yaml supplies the settings. No environment variables are needed. Hosting the website does not deploy the blockchain contract.

## First use on a phone

1. Install MetaMask and create or import your wallet privately in the wallet app.
2. Open the Render URL inside MetaMask's built-in browser. The site's **Open in MetaMask** link provides a shortcut from a regular phone browser.
3. Enable test networks in MetaMask and select **Sepolia**. Obtain Sepolia test ETH from a faucet for transaction fees.
4. Tap **Connect wallet**, expand **Don’t have a contract yet?**, and tap **Deploy new contract**. Approve in MetaMask and wait for confirmation.
5. The contract address fills automatically. Enter a whole number and tap **Save on blockchain**, then approve the transaction.

Other phones can use the same contract by pasting its address, or opening `https://YOUR-SITE.onrender.com/?address=0xYOUR_CONTRACT_ADDRESS` inside their wallet browser. The address is remembered on this device. The on-chain number is shared publicly; anyone can change it because that is how the supplied contract works. A Remix VM address cannot be used here.

Supported: mobile wallet browsers with an Ethereum provider and desktop wallet extensions. Ordinary Safari/Chrome can show the app but wallet transactions require opening the wallet browser. The app uses Sepolia only. No real ETH is required.

## Local development

Requires Node.js 20.19+ or 22.12+ and npm.

```
npm ci
npm run build
npm test
npm run dev
```

The build compiles contracts/SimpleStorage.sol with solc 0.8.20, produces its ABI and bytecode, and bundles the app into dist. Fonts have local system fallbacks.

## Verification

Automated tests check number input bounds and actual deployment/read/write using a local blockchain, including the maximum uint256 and updates from a second wallet. Live Sepolia transactions and physical phone wallet handoff require a user wallet and test ETH.
