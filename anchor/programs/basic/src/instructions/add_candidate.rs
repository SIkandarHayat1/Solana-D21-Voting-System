
 
use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

pub fn add_candidate(
        ctx: Context<AddCandidate>,
        name: String,
        description: String,
    ) -> Result<()> {
        let election = &mut ctx.accounts.election;
        let candidate = &mut ctx.accounts.candidate;

        require!(!election.is_finalized, VotingError::ElectionFinalized);
        require!(name.len() <= 50, VotingError::NameTooLong);
        require!(description.len() <= 200, VotingError::DescriptionTooLong);
        require!(election.candidate_count < 50, VotingError::TooManyCandidates);

        let clock = Clock::get()?;
        require!(clock.unix_timestamp < election.start_time, VotingError::ElectionStarted);

        candidate.election = election.key();
        candidate.id = election.candidate_count;
        candidate.name = name;
        candidate.description = description;
        candidate.plus_votes = 0;
        candidate.minus_votes = 0;

        election.candidate_count += 1;

        msg!("Candidate added: {} (ID: {})", candidate.name, candidate.id);
        Ok(())
    }


    #[derive(Accounts)]
#[instruction(name: String)]
pub struct AddCandidate<'info> {
    #[account(
        mut,
        has_one = authority,
    )]
    pub election: Account<'info, Election>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 1 + 4 + 50 + 4 + 200 + 8 + 8 + 100,
        seeds = [b"candidate", election.key().as_ref(), &[election.candidate_count]],
        bump
    )]
    pub candidate: Account<'info, Candidate>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}