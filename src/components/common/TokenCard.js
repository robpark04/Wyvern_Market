import { useEffect, useState } from "react";
import { address } from '../../constants/addresses';
import { network } from '../../constants/network';
import ERC721 from '../../contracts/ERC721A/ERC721AMock.sol/ERC721AMock.json';
import { ethers, constants, utils } from 'ethers';
import Input from "@material-tailwind/react/Input";
import Button from "@material-tailwind/react/Button";
import Registry from '../../contracts/WyvernRegistry.sol/WyvernRegistry.json';
import ERC20 from '../../contracts/TestERC20.sol/TestERC20.json';
import Atomicizer from '../../contracts/WyvernAtomicizer.sol/WyvernAtomicizer.json';
import StaticUtil from '../../contracts/static/StaticUtil.sol/StaticUtil.json';
import StaticERC721 from '../../contracts/static/StaticERC721.sol/StaticERC721.json';
import StaticERC20 from '../../contracts/static/StaticERC20.sol/StaticERC20.json';
import { parseEther } from "ethers/lib/utils";
import Exchange from '../../contracts/WyvernExchange.sol/WyvernExchange.json';
import StaticMarket from '../../contracts/StaticMarket.sol/StaticMarket.json';


const AbiCoder = ethers.utils.AbiCoder;

const TokenCard = ({ id, account, owner }) => {
  const [uri, setUri] = useState();
  const [price, setPrice] = useState(0);
  const [expiration, setExpiration] = useState(0);

  useEffect(() => {
    async function getTokenId() {
      try {
        const provider = new ethers.providers.JsonRpcProvider(network.rpcUrls[0]);
        const contract = new ethers.Contract(address['erc721A'], ERC721.abi, provider);
        const tokenuri = await contract.tokenURI(id);
        setUri(tokenuri);
      } catch (err) {
        console.log(err);
      }
    }
    getTokenId();
  }, [id]);

 

  const orderNft2Erc20 = async () => {
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
      const erc721 = new ethers.Contract(address['erc721A'], ERC721.abi, signer);
      // approve
      const approveTx = await erc721.approve(proxy, id);
      await approveTx.wait();
      // selector

      let iface = new ethers.utils.Interface(StaticMarket.abi);
      let fragment = iface.getFunction("ERC721ForERC20");
      const selector = iface.getSighash(fragment);
      fragment = iface.getFunction("ERC20ForERC721");
      const counterSelector = iface.getSighash(fragment);
      const params = abiCoder.encode(
        ['address[2]', 'uint256[2]'],
        [[address['erc721A'], address['erc20']], [id, parseEther(String(price))]]
      );
      const counterParams = abiCoder.encode(
        ['address[2]', 'uint256[2]'],
        [[address['erc20'], address['erc721A']], [id, parseEther(String(price))]]
      );
      const order = [
        address['registry'],
        account,
        address['static'],
        selector,
        params,
        1,
        (new Date().getTime()/1000).toFixed(),
        (new Date().getTime()/1000).toFixed() + 86400 * Number(expiration),
        Math.floor(Math.random() * 1e10)
      ];
      const exchange = new ethers.Contract(address['exchange'], Exchange.abi, signer);
      await exchange.approveOrder_(...order, false);
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div className="bg-indigo-300 border border-white rounded-xl w-full text-white p-5">
      <div className="grid grid-cols-2 gap-4">
        <div>Owner</div>
        <div>{ `${owner.substring(0, 5)}..${owner.substring(42 - 5)}` }</div>
        <div>Id :</div>
        <div>{id}</div>
        <div>URI</div>
        <div>{uri}</div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-12">
        <div>price</div>
        <div>
          <Input
            value={price}
            onChange={e => setPrice(e.target.value)}
            type="text"
            color="lightBlue"
            size="regular"
            outline={true}
            placeholder="Input"
            className="text-white"
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
            onClick={orderNft2Erc20}
            color="lime"
            buttonType="filled"
            size="regular"
            rounded={false}
            block={false}
            iconOnly={false}
            ripple="light"
          >
            order
          </Button>
        </div>
      </div>
    </div>
  )
}

export default TokenCard;