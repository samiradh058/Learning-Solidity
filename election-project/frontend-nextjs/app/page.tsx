// pages/index.tsx

import ConnectMetaMask from "../app/_components/ConnectMetamask";

const Home = () => {
  return (
    <div>
      <h1 className="flex justify-center">Welcome to the MetaMask Example</h1>
      <ConnectMetaMask />
    </div>
  );
};

export default Home;
