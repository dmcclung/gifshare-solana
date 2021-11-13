use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod gifshare {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>, base_account_bump: u8) -> ProgramResult {
        ctx.accounts.base_account.bump = base_account_bump;
        Ok(())
    }

    pub fn add_gif(ctx: Context<AddGif>, gif_link: String) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;

        let item = ItemStruct {
          gif_link: gif_link.to_string(),
          user_address: *ctx.accounts.user.to_account_info().key,
        };

        base_account.gif_list.push(item);
        base_account.total_gifs += 1;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(base_account_bump: u8)]
pub struct Initialize<'info> {
    #[account(init, seeds = [b"base_account".as_ref()], bump = base_account_bump, payer = user, space = 9000)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program <'info, System>,
}

#[derive(Accounts)]
pub struct AddGif<'info> {
    #[account(mut, seeds = [b"base_account".as_ref()], bump = base_account.bump)]
    pub base_account: Account<'info, BaseAccount>,
    pub user: Signer<'info>,
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct ItemStruct {
    pub gif_link: String,
    pub user_address: Pubkey,
}

#[account]
#[derive(Default)]
pub struct BaseAccount {
    pub total_gifs: u64,
    pub gif_list: Vec<ItemStruct>,
    pub bump: u8,
}