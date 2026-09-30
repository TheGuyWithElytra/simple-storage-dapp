import './style.css';
import { BrowserProvider, Contract, ContractFactory, isAddress, getAddress } from 'ethers';
import artifact from './contract.json';
import { parseNumber } from './validation.js';
const $ = id => document.getElementById(id);
const CHAIN = 11155111n;
let provider, signer, loadedAddress, busy = false, session = 0;
function message(text, kind = '') { $('status').textContent = text; $('status').className = `status ${kind}`; }
function forgetNumber() { loadedAddress = undefined; $('current').textContent = '—'; $('current').className = ''; $('read-time').textContent = 'Load a contract to see its number.'; }
function sync() {
  const ready = Boolean(signer);
  for (const id of ['connect','address','number']) $(id).disabled = busy;
  $('switch').disabled = busy;
  $('deploy').disabled = busy || !ready;
  $('load').disabled = busy || !ready || !isAddress($('address').value.trim());
  $('save').disabled = $('refresh').disabled = busy || !ready || !loadedAddress;
}
function errorText(e) {
  if (e.code === 4001 || e.code === 'ACTION_REJECTED') return 'Request cancelled in your wallet.';
  if (e.code === 'INSUFFICIENT_FUNDS') return 'Your wallet needs Sepolia test ETH to pay the transaction fee.';
  if (e.code === 'CALL_EXCEPTION' || e.code === 'BAD_DATA') return 'This address does not behave like SimpleStorage. Check the address and network.';
  return e.shortMessage || e.message || 'The request failed. Please try again.';
}
async function run(action) {
  if (busy) return;
  busy = true; sync();
  try { await action(); } catch(e) { message(errorText(e), 'error'); }
  finally { busy = false; sync(); }
}
function transactionLink(hash) { $('transaction').href = `https://sepolia.etherscan.io/tx/${hash}`; $('transaction').hidden = false; }
async function requireSepolia() {
  if (!signer) throw new Error('Connect your wallet on Sepolia first.');
  if (BigInt(await window.ethereum.request({method:'eth_chainId'})) !== CHAIN) throw new Error('Switch your wallet to Sepolia first.');
}
async function connect() {
  if (!window.ethereum) { message('Open this page in MetaMask’s mobile browser, or install a wallet extension on your computer.', 'error'); return; }
  const version = session;
  provider = new BrowserProvider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  const account = (await provider.send('eth_accounts', []))[0];
  const network = await provider.getNetwork();
  if (version !== session) return;
  $('wallet').textContent = `${account.slice(0,6)}…${account.slice(-4)}`;
  $('network').textContent = network.chainId === CHAIN ? 'Sepolia' : `Chain ${network.chainId}`;
  $('switch').hidden = network.chainId === CHAIN;
  signer = network.chainId === CHAIN ? await provider.getSigner() : undefined;
  $('connect').textContent = 'Reconnect wallet';
  if (!signer) { message('Your wallet is connected. Switch to Sepolia to continue.'); return; }
  $('mobile-help').hidden = true;
  message('Wallet connected. Load an existing contract or deploy a new one.', 'success');
}
async function read(address) {
  await requireSepolia();
  const version = session;
  const number = await new Contract(address, artifact.abi, provider).number();
  if (version !== session) return;
  $('current').textContent = number.toString();
  $('current').className = number.toString().length > 12 ? 'long' : '';
  $('read-time').textContent = `Updated at ${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
}
async function load() {
  forgetNumber(); await requireSepolia();
  const address = getAddress($('address').value.trim());
  if (await provider.getCode(address) === '0x') throw new Error('No contract found at this address on Sepolia.');
  const version = session;
  message('Reading your contract…'); await read(address);
  if (version !== session) return;
  loadedAddress = address;
  try { localStorage.setItem('simpleStorage:sepolia', address); } catch {}
  message('Contract loaded. You can now save a number.', 'success');
}
async function deploy() {
  await requireSepolia(); const version = session;
  $('transaction').hidden = true;
  message('Approve deployment in your wallet. This uses Sepolia test ETH.');
  const contract = await new ContractFactory(artifact.abi, artifact.bytecode, signer).deploy();
  transactionLink(contract.deploymentTransaction().hash);
  message('Deployment sent. Waiting for confirmation…');
  await contract.waitForDeployment();
  if (version !== session) return;
  $('address').value = await contract.getAddress();
  await load();
  message('Your new contract is deployed. Its first stored number is 0.', 'success');
}
async function save() {
  const value = parseNumber($('number').value);
  await requireSepolia(); const address = loadedAddress, version = session;
  if (!address) throw new Error('Load a contract first.');
  $('transaction').hidden = true;
  message('Approve saving this number in your wallet.');
  const tx = await new Contract(address, artifact.abi, signer).setNumber(value);
  transactionLink(tx.hash); message('Transaction sent. Waiting for confirmation…');
  const receipt = await tx.wait();
  if (!receipt || receipt.status !== 1) throw new Error('The transaction did not succeed.');
  if (version !== session) return;
  await read(address); message('Your transaction is confirmed. The latest number is shown above.', 'success');
}
$('connect').addEventListener('click', ()=>run(connect));
$('load').addEventListener('click', ()=>run(load));
$('deploy').addEventListener('click', ()=>run(deploy));
$('refresh').addEventListener('click', ()=>run(async()=> {await read(loadedAddress); message('Latest number loaded.', 'success');}));
$('save-form').addEventListener('submit', event=> {event.preventDefault(); run(save);});
$('switch').addEventListener('click', ()=>run(async()=> {
  await window.ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:'0xaa36a7'}]});
  await connect();
}));
$('address').addEventListener('input', ()=> {forgetNumber(); $('transaction').hidden = true; sync();});
function invalidate() {
  session++; signer = undefined; provider = undefined; forgetNumber();
  $('wallet').textContent = 'Not connected'; $('network').textContent = 'Not connected';
  $('transaction').hidden = true; $('switch').hidden = true;
  message('Wallet account or network changed. Reconnect to continue.'); sync();
}
window.ethereum?.on?.('accountsChanged', invalidate);
window.ethereum?.on?.('chainChanged', invalidate);
try {
  const urlAddress = new URL(location.href).searchParams.get('address');
  const saved = urlAddress || localStorage.getItem('simpleStorage:sepolia');
  if (saved && isAddress(saved)) $('address').value = saved;
} catch {}
if (location.protocol === 'https:') $('open-wallet').href = `https://metamask.app.link/dapp/${location.host}${location.pathname}${location.search}`;
sync();
