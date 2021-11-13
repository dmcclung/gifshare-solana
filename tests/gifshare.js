const anchor = require('@project-serum/anchor');
const { SystemProgram, PublicKey } = anchor.web3;

describe('gifshare', () => {

  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  it('should save a gif', async () => {
    const program = anchor.workspace.Gifshare;
    const [ baseAccountPubKey, baseAccountBump ] = 
      await PublicKey.findProgramAddress([Buffer.from('base_account')], program.programId);
    
    await program.rpc.initialize(new anchor.BN(baseAccountBump), {
      accounts: {
        baseAccount: baseAccountPubKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
    });

    let account = await program.account.baseAccount.fetch(baseAccountPubKey);
    console.log('👀 GIF Count', account.totalGifs);

    const giphyLink = 'https://media.giphy.com/media/JwNPAckJDiPsI/giphy.gif'
    await program.rpc.addGif(giphyLink, {
      accounts: {
        baseAccount: baseAccountPubKey,
        user: provider.wallet.publicKey,
      },
    });
    
    account = await program.account.baseAccount.fetch(baseAccountPubKey);
    console.log('👀 GIF Count', account.totalGifs.toString());
    console.log('👀 GIF List', account.gifList);
  });
});
