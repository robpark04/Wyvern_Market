import React, { useState } from 'react';
import Header from './components/common/Header';
import { addNet, switchNet } from './constants/network';
import {
  BrowserRouter,
  Routes,
  Route,
  useRoutes
} from "react-router-dom";

import MintPage from './components/MintPage';
import OfferPage from './components/OfferPage';
import Market from './components/Market';

const ScreenList = (props) => {
  let routes = useRoutes([
      { path: "/mint", element:<MintPage account={props.account}/> },
      { path: "/market", element: <OfferPage account={props.account}/> },
      // { path: "/market", element: <Market account={props.account} /> },
  ]);
  return routes;
};

function App() {
  const [userAccount, setUserAccount] = useState();

  async function requestAccount() {
    await window.ethereum.request(addNet); // 
    try {
      await window.ethereum.request(switchNet); // 
    } catch (err) {
      console.log(err);
    }
    if (typeof window.ethereum !== 'undefined') {
      const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });  // connect wallet
      setUserAccount(account);
    }
  }
  return (
    <div className="bg-blue-100 h-screen">
      <div>
        <BrowserRouter>
          <Header account={userAccount} requestAccount={requestAccount}/>
          <ScreenList account={userAccount} />
        </BrowserRouter>
      </div>
    </div>
  );
}

export default App;
