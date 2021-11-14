import { useEffect, useState } from 'react'
import { Connection, PublicKey, clusterApiUrl} from '@solana/web3.js'
import {
  Program, Provider, web3, BN
} from '@project-serum/anchor'
import twitterLogo from './assets/twitter-logo.svg'
import './App.css'
import idl from './idl.json'

const { SystemProgram, Keypair } = web3

const programID = new PublicKey(idl.metadata.address)

const network = clusterApiUrl('devnet')

const opts = {
  preflightCommitment: "processed"
}

const connection = new Connection(network, opts.preflightCommitment)

const getProvider = () => {
  const provider = new Provider(
    connection, window.solana, opts.preflightCommitment,
  )
	return provider
}

const TWITTER_HANDLE = '_buildspace'
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`

const checkIfWalletIsConnected = async (setWalletAddress) => {
  try {
    const { solana } = window

    if (solana) {
      if (solana.isPhantom) {
        console.log('Phantom wallet found!')

        const response = await solana.connect({ onlyIfTrusted: true })
        console.log(
          'Connected with Public Key:',
          response.publicKey.toString()
        )
        setWalletAddress(response.publicKey.toString())
      }
    } else {
      alert('Solana object not found! Get a Phantom Wallet 👻')
    }
  } catch (error) {
    console.error(error)
  }
}

const connectWallet = async (setWalletAddress) => {
  const { solana } = window

  if (solana) {
    const response = await solana.connect()
    console.log('Connected with Public Key:', response.publicKey.toString())
    setWalletAddress(response.publicKey.toString())
  }
}

const App = () => {
  const [walletAddress, setWalletAddress] = useState()
  const [inputValue, setInputValue] = useState('')
  const [gifList, setGifList] = useState(null)

  const createGifAccount = async () => {
    try {
      const provider = getProvider()
      const [ baseAccountPublicKey, baseAccountBump ] = 
        await PublicKey.findProgramAddress([Buffer.from('base_account')], programID)
      const program = new Program(idl, programID, provider)
      console.log('Initializing')
      await program.rpc.initialize(new BN(baseAccountBump), {
        accounts: {
          baseAccount: baseAccountPublicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
      })
      console.log("Created a new BaseAccount w/ address:", baseAccountPublicKey.toString())
      getGifList()
    } catch(error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  const getGifList = async () => {
    try {
      const provider = getProvider()
      
      const [ baseAccountPublicKey, baseAccountBump ] = 
        await PublicKey.findProgramAddress([Buffer.from('base_account')], programID)

      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccountPublicKey)
      
      console.log("Got the account", account)
      setGifList(account.gifList)
  
    } catch (error) {
      console.log("Error in getGifs: ", error)
      setGifList(null);
    }
  }

  useEffect(() => {
    window.addEventListener('load', async () => {
      await checkIfWalletIsConnected(setWalletAddress)
    })
  })

  useEffect(async () => {
    if (walletAddress) {
      console.log('Fetching GIF list...')
      await getGifList()
    }
  }, [walletAddress])

  const onInputChange = (event) => {
    const { value } = event.target
    setInputValue(value)
  }

  const sendGif = async () => {
    if (inputValue.length > 0) {
      console.log('Gif link:', inputValue)
      const provider = getProvider()
      const [ baseAccountPublicKey, baseAccountBump ] = 
        await PublicKey.findProgramAddress([Buffer.from('base_account')], programID)
      const program = new Program(idl, programID, provider)
      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccountPublicKey,
          user: provider.wallet.publicKey,
        }
      })
      getGifList()
    } else {
      console.log('Empty input. Try again.');
    }
  }

  return (
    <div className="App">
      <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">🖼 Gif share</p>
          <p className="sub-text">
            Share gifs and tip your favorites in the metaverse ✨
          </p>
          {!walletAddress && (
            <button
              className="cta-button connect-wallet-button"
              onClick={() => connectWallet(setWalletAddress)}>
              Connect to Wallet
            </button>
          )}
          {walletAddress && gifList && (
            <div className="connected-container">
              <input type="text" value={inputValue} onChange={onInputChange} placeholder="Enter gif link!" />
              <button className="cta-button submit-gif-button" onClick={sendGif}>
                Submit
              </button>
              <div className="gif-grid">
                {gifList.map((gif, index) => (
                  <div className="gif-item" key={index}>
                    <img src={gif.gifLink} alt={gif.gifLink} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {walletAddress && !gifList && (
            <div className="connected-container">
              <button className="cta-button submit-gif-button" onClick={createGifAccount}>
                Do One-Time Initialization For Gif Program Account
              </button>
            </div>
          )}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  )
}

export default App