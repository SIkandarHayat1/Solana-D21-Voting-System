use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

pub fn initialize_election(
        ctx: Context<InitializeElection>,
        name: String,
        description: String,
        start_time: i64,
        end_time: i64,
        num_winners: u8,
        allow_minus_votes: bool,
    ) -> Result<()> {
        let election = &mut ctx.accounts.election;
        
        require!(start_time < end_time, VotingError::InvalidTimeRange);
        require!(num_winners > 0, VotingError::InvalidWinnerCount);
        require!(name.len() <= 50, VotingError::NameTooLong);
        require!(description.len() <= 200, VotingError::DescriptionTooLong);

        election.authority = ctx.accounts.authority.key();
        election.name = name;
        election.description = description;
        election.start_time = start_time;
        election.end_time = end_time;
        election.num_winners = num_winners;
        election.allow_minus_votes = allow_minus_votes;
        election.candidate_count = 0;
        election.voter_count = 0;
        election.is_finalized = false;

        msg!("Election initialized: {}", election.name);
        Ok(())
    }

    #[derive(Accounts)]
#[instruction(name: String)]
pub struct InitializeElection<'info> {
    #[account(
    init,
    payer = authority,
    space = 8 + // discriminator
           32 + // authority pubkey
           4 + 50 + // name string (4 bytes length + max 50 chars)
           4 + 200 + // description string (4 bytes length + max 200 chars)
           8 + // start_time i64
           8 + // end_time i64
           1 + // num_winners u8
           1 + // allow_minus_votes bool
           1 + // candidate_count u8
           8 + // voter_count u64
           1 + // is_finalized bool
           50, // padding for safety
    seeds = [b"election", authority.key().as_ref(), name.as_bytes()],
    bump
    )]
    pub election: Account<'info, Election>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}