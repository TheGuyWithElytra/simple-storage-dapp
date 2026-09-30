import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ganache from 'ganache';
import { BrowserProvider, ContractFactory } from 'ethers';
import { parseNumber, MAX_UINT256 } from '../src/validation.js';
test('accepts exact uint256 values and rejects invalid inputs',()=> {
  assert.equal(parseNumber('0'),0n);
  assert.equal(parseNumber('9007199254740993'),9007199254740993n);
  assert.equal(parseNumber(MAX_UINT256.toString()),MAX_UINT256);
  for(const value of ['-1','1.2','1e3','','abc',(MAX_UINT256+1n).toString()]) assert.throws(()=>parseNumber(value));
});
test('supplied contract deploys, stores full uint256 precision, and permits another wallet to update',async()=> {
  const rpc = ganache.provider({logging:{quiet:true}});
  try {
    const provider = new BrowserProvider(rpc);
    const artifact = JSON.parse(fs.readFileSync('src/contract.json','utf8'));
    const contract = await new ContractFactory(artifact.abi,artifact.bytecode,await provider.getSigner()).deploy();
    await contract.waitForDeployment(); assert.equal(await contract.number(),0n);
    await (await contract.setNumber(MAX_UINT256)).wait(); assert.equal(await contract.number(),MAX_UINT256);
    await (await contract.connect(await provider.getSigner(1)).setNumber(42n)).wait(); assert.equal(await contract.number(),42n);
  } finally { await rpc.disconnect(); }
});
