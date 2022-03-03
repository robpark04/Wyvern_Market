import { ethers, constants } from 'ethers';
import { formatEther, parseEther } from 'ethers/lib/utils';
import React, { useEffect, useState } from 'react';
import { address } from '../constants/addresses';
import { network } from '../constants/network';
import ERC721 from '../contracts/ERC721A/ERC721AMock.sol/ERC721AMock.json';
import ERC20 from '../contracts/TestERC20.sol/TestERC20.json';
import TokenCard from './common/TokenCard';
import Input from "@material-tailwind/react/Input";
import Button from "@material-tailwind/react/Button";
import Exchange from '../contracts/WyvernExchange.sol/WyvernExchange.json';
import Registry from '../contracts/WyvernRegistry.sol/WyvernRegistry.json';
import StaticMarket from '../contracts/StaticMarket.sol/StaticMarket.json';


const AbiCoder = ethers.utils.AbiCoder;
const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

const OfferPage = ({ account }) => {
  const [tokens, setTokens] = useState([]);
  const [balance, setBalance] = useState();
  const [price, setPrice] = useState(0);
  const [tokenId, setTokenId] = useState(0);
  const [expiration, setExpiration] = useState(0);
  useEffect(() => {
    async function getCollection() {
      try {
        const provider = new ethers.providers.JsonRpcProvider(network.rpcUrls[0]);
        const contract = new ethers.Contract(address['erc721A'], ERC721.abi, provider);
        if (!!account) {
          const erc20 = new ethers.Contract(address['erc20'], ERC20.abi, provider);
          const balance20 = await erc20.balanceOf(account);
          setBalance(formatEther(balance20));
        }
        const totalSupply = await contract.totalSupply();
        let tokenIdList = [];
        for (let i = 0; i < Number(totalSupply); i++) {
          const owner = await contract.ownerOf(i);
          tokenIdList.push({
            id: i,
            owner: owner
          });
        }
        setTokens(tokenIdList);
      } catch (err) {
        console.log(err);
      }
    }

    getCollection();
  }, [account]);

  const requestBid = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const registry = new ethers.Contract(address['registry'], Registry.abi, signer);
      // get proxy
      let proxy = await registry.proxies(account);
      if (proxy === constants.AddressZero) {
        const regProTx = await registry.registerProxy();
        await regProTx.wait();
        proxy = await registry.proxies(account);
      }
      const abiCoder = new AbiCoder();
      const erc20 = new ethers.Contract(address['erc20'], ERC20.abi, signer);
      // approve
      const approveTx = await erc20.approve(proxy, parseEther(String(price)));
      await approveTx.wait();
      // selector
      let iface = new ethers.utils.Interface(StaticMarket.abi);
      let fragment = iface.getFunction("ERC721ForERC20");
      const selector = iface.getSighash(fragment);
      fragment = iface.getFunction("ERC20ForERC721");
      const counterSelector = iface.getSighash(fragment);
      const params = abiCoder.encode(
        ['address[2]', 'uint256[2]'],
        [[address['erc721A'], address['erc20']], [tokenId, parseEther(String(price))]]
      );
      const counterParams = abiCoder.encode(
        ['address[2]', 'uint256[2]'],
        [[address['erc20'], address['erc721A']], [tokenId, parseEther(String(price))]]
      );
      const order = [
        address['registry'],
        owner,
        address['static'],
        selector,
        params,
        1,
        (new Date().getTime() / 1000).toFixed(),
        (new Date().getTime() / 1000).toFixed() + 86400 * Number(expiration),
        Math.floor(Math.random() * 1e10)
      ];
      const counterOrder = [
        address['registry'],
        account,
        address['static'],
        counterSelector,
        counterParams,
        1,
        (new Date().getTime() / 1000).toFixed(),
        (new Date().getTime() / 1000).toFixed() + 86400 * Number(expiration),
        Math.floor(Math.random() * 1e10)
      ]
      const exchange = new ethers.Contract(address['exchange'], Exchange.abi, signer);
      await exchange.approveOrder_(...counterOrder, false);
      const erc721 = new ethers.Contract(address['erc721A'], ERC721.abi, signer);
      const owner = await erc721.ownerOf(tokenId);
      iface = new ethers.utils.Interface(ERC721.abi);
      const firstData = iface.encodeFunctionData("transferFrom", [owner, account, tokenId]);
      const secondData = iface.encodeFunctionData("transferFrom", [account, owner, parseEther(String(price))]);
      const firstCall = [erc721.address, 0, firstData];
      const secondCall = [erc20.address, 0, secondData];
      // const result = await exchange.atomicMatch_(
      //   [
      //     ...order,
      //     erc721.address,
      //     ...counterOrder,
      //     erc20.address
      //   ],
      //   [
      //     selector,
      //     counterSelector
      //   ],
      //   params,
      //   firstData,
      //   counterParams,
      //   secondData,
      //   [0,0],
      //   ZERO_BYTES32,
      //   "dddd"
      // )
    } catch (err) {
      console.log(err);
    }
  }
  return (
    <div>
      <div className="grid grid-cols-4 gap-4 p-5">
        {
          tokens.map(token => (
            <TokenCard id={token.id} key={token.id} owner={token.owner} account={account} />
          ))
        }
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className=""></div>
        <div className="bg-indigo-400 border border-white rounded-md w-full text-white p-5 grid grid-cols-2 gap-4">
          <div>ERC20</div>
          <div></div>
          <div>Balance</div>
          <div>{balance}</div>
          <div>NFT ID</div>
          <div>
            <Input
              value={tokenId}
              onChange={e => setTokenId(e.target.value)}
              type="text"
              color="lightBlue"
              size="regular"
              outline={true}
              placeholder="token ID"
            />
          </div>
          <div>
            Buy Price
          </div>
          <div>
            <Input
              value={price}
              onChange={e => setPrice(e.target.value)}
              type="text"
              color="lightBlue"
              size="regular"
              outline={true}
              placeholder="token ID"
            />
          </div>
          <div>expiration days</div>
          <div>
            <Input
              value={expiration}
              onChange={e => setExpiration(e.target.value)}
              type="text"
              color="lightBlue"
              size="regular"
              outline={true}
              placeholder="Input"
            />
          </div>
          <div></div>
          <div>
            <Button
              onClick={requestBid}
              color="lightGreen"
              buttonType="filled"
              size="regular"
              rounded={false}
              block={false}
              iconOnly={false}
              ripple="light"
            >
              Bid
            </Button>
          </div>
        </div>
        <div></div>
      </div>
    </div>
  )
}

export default OfferPage;