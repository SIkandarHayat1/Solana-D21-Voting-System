use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

pub fn finalize_election(ctx: Context<FinalizeElection>) -> Result<()> {
        let election = &mut ctx.accounts.election;
        
        let clock = Clock::get()?;
        require!(clock.unix_timestamp > election.end_time, VotingError::ElectionNotEnded);
        require!(!election.is_finalized, VotingError::ElectionFinalized);

        election.is_finalized = true;

        msg!("Election finalized: {}", election.name);
        Ok(())
    }


#[derive(Accounts)]
pub struct FinalizeElection<'info> {
    #[account(
        mut,
        has_one = authority,
    )]
    pub election: Account<'info, Election>,
    
    pub authority: Signer<'info>,
}

