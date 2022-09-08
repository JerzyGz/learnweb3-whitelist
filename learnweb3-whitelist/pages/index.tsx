import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import Web3Modal from 'web3modal'
import { useCallback, useEffect, useRef, useState } from 'react'
import styles from '../styles/Home.module.css'
import { Contract, providers, Signer } from 'ethers'
import { ABI, WHITELIST_CONTRACT_ADDRESS } from '../constants'

const Home: NextPage = () => {

  const [walletConnected, setWalletConnected] = useState(false);
  const [joinedWhitelist, setJoinedWhitelist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [numberOfWhitelisted, setNumberOfWhitelisted] = useState(0);
 console.log('Home')
  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef<Web3Modal>();

  /**
   * Returns a Provider or Signer object representing the Ethereum RPC with or 
   * without the signing capabilities of metamask attached.
   * 
   * A Provider is needed to interact with the blockchain: reading transactions,
   * reading balances, reading states,etc.
   * 
   * A Signer is special type of Provider used in case a transaction needs to be
   * made to the blockchain (write), which involves the connected account needing to make
   * a digital signature to authorize the transaction being sent. Metamask exposes
   * a Signer API to allow your website request signatures from the user using 
   * Signer function. 
   * 
   * @param {*} needSigner - True if you need the signer, default false otherwise
   */ 
  const getProviderOrSigner = async (needSigner: boolean = false) => {
    // connect to metamask
    const provider = await web3ModalRef?.current?.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the GOERLI network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    //goerli
    if (chainId !== 5) { 
      window.alert("Change the network to Goerli");
      throw new Error('Change Network to GOERLI')
    }

    if (needSigner) {
  
      return web3Provider.getSigner();
    } 

    return web3Provider;

  };


  /**
   * addAddressToWhitelist: Adds the current connected address to the whitelist
   */
  const addAddressToWhitelist = async () => {
    try {
      // We need a Signer here since this is a 'write' transaction.
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(WHITELIST_CONTRACT_ADDRESS, ABI, signer);
      
      // call the addAddressToWhitelist from the contract
      const tx = await whitelistContract.addAddressToWhitelist();
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);

      // get the updated number of address in the whitelist
      await getNumberOfWhitelisted();

      setJoinedWhitelist(true);


    } catch (error) {
      console.log(error);
    }
  };
  
  /**
   * getNumberOfWhitelisted:  gets the number of whitelisted addresses
   */
  const getNumberOfWhitelisted = async () => {
    
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      
      const provider = await getProviderOrSigner();
      const whitelistContract = new Contract(WHITELIST_CONTRACT_ADDRESS, ABI, provider);
      
      const numAddressesWhitelisted = await whitelistContract.numAddressesWhitelisted();
      setNumberOfWhitelisted(numAddressesWhitelisted);

    } catch (error) {
      console.log(error);
    }
  };
  
  /**
   * checkIfAddressInWhitelist: Checks if the address is in whitelist
   */
  const checkIfAddressInWhitelist = async () => {
    try {
     // We will need the signer later to get the user's address
      // Even though it is a read transaction, since Signers are just special kinds of Providers,
      // We can use it in it's place
      const signer = await getProviderOrSigner(true) as Signer;
      const whitelistContract = new Contract(WHITELIST_CONTRACT_ADDRESS, ABI, signer);

      // Get the address associated to the signer which is connected to Metamask
      const address = await signer.getAddress();
      console.log({address});
      // call the whitelistedAddresses from the contract
      const isJoined = await whitelistContract.whitelistedAddresses(address)
      setJoinedWhitelist(isJoined);

    } catch (error) {
      console.log(error);
    }
  };

  /*
    connectWallet: Connects the MetaMask wallet
  */
  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet
      await getProviderOrSigner();
      setWalletConnected(true);

      checkIfAddressInWhitelist();
      getNumberOfWhitelisted();
      
    } catch (error) {
      console.log(error);
    }
  };

  const renderButton = () => {
    if (!walletConnected) {
      return (
        <button className={styles.button} onClick={connectWallet}>
          Connect your wallet
        </button>
      );
    }

    if (loading) {
      return <button className={styles.button}>Loading...</button>
    }

    return (
      joinedWhitelist ? (
        <button className={styles.button}>
          Thanks for joining the Whitelist!
        </button>
      ) :
      (<button className={styles.button} onClick={addAddressToWhitelist}>
        Join the Whitelist
      </button>)
      
      );

  };

  useEffect(() => {
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
    }

  }, [walletConnected]);


  return (
    <div>
      <Head>
        <title>Whitelist Dapp</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            {numberOfWhitelisted} have already joined the Whitelist
          </div>
          { renderButton()}
        </div>
    
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}

export default Home
