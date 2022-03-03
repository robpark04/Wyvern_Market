
import { Link } from 'react-router-dom';
import Button from "@material-tailwind/react/Button";

const Header = ({ account, requestAccount }) => {

  function goLink(link) {

  }
  return (
    <div className="bg-green-400 h-16">
      <div className="flex text-white p-2">
        <div className="p-4" onClick={goLink('goLink')}>
          <Link to="/mint">Mint</Link>
        </div>
        {/* <div className="p-4">
          <Link to="/offer_auction">Collection</Link>
        </div> */}
        <div className="p-4">
          <Link to="/market">Market</Link>
        </div>
        <div className="flex-grow"></div>
        <Button
          onClick={requestAccount}
          color="amber"
          buttonType="filled"
          size="regular"
          block={false}
          iconOnly={false}
          ripple="light"
        >
          {
            !account ? (
              <div>Connect Wallet</div>
            ) : (
              <div>{`${account.substring(0, 5)}..${account.substring(account.length - 5)}`}</div>
            )
          }
        </Button>
      </div>
    </div >
  )
}

export default Header;