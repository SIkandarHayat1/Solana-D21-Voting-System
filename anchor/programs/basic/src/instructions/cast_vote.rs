use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

// Fixed version - using individual votes instead of Vec<u8>
pub fn cast_vote(
        ctx: Context<CastVote>,
        plus_vote_1: Option<u8>,
        plus_vote_2: Option<u8>,
        plus_vote_3: Option<u8>,
        plus_vote_4: Option<u8>,
        minus_vote_1: Option<u8>,
        minus_vote_2: Option<u8>,
    ) -> Result<()> {
        let election = &mut ctx.accounts.election;
        let voter_record = &mut ctx.accounts.voter_record;
        
        let clock = Clock::get()?;
        require!(
            clock.unix_timestamp >= election.start_time && 
            clock.unix_timestamp <= election.end_time,
            VotingError::ElectionNotActive
        );

        require!(!voter_record.has_voted, VotingError::AlreadyVoted);

        // Collect plus votes
        let mut plus_votes = Vec::new();
        if let Some(vote) = plus_vote_1 { plus_votes.push(vote); }
        if let Some(vote) = plus_vote_2 { plus_votes.push(vote); }
        if let Some(vote) = plus_vote_3 { plus_votes.push(vote); }
        if let Some(vote) = plus_vote_4 { plus_votes.push(vote); }

        // Collect minus votes
        let mut minus_votes = Vec::new();
        if let Some(vote) = minus_vote_1 { minus_votes.push(vote); }
        if let Some(vote) = minus_vote_2 { minus_votes.push(vote); }

        // Calculate D21 votes - simplified version
        let max_plus_votes = calculate_max_plus_votes(election.num_winners, election.candidate_count);
        let max_minus_votes = if election.allow_minus_votes { max_plus_votes / 3 } else { 0 };

        require!(plus_votes.len() <= max_plus_votes as usize, VotingError::TooManyPlusVotes);
        require!(minus_votes.len() <= max_minus_votes as usize, VotingError::TooManyMinusVotes);

        // If minus votes, need at least 2 plus votes
        if !minus_votes.is_empty() {
            require!(plus_votes.len() >= 2, VotingError::InsufficientPlusVotes);
        }

        // Validate candidate IDs
        for &candidate_id in &plus_votes {
            require!(candidate_id < election.candidate_count, VotingError::InvalidCandidateId);
        }
        for &candidate_id in &minus_votes {
            require!(candidate_id < election.candidate_count, VotingError::InvalidCandidateId);
        }

        // Check for duplicates and conflicts
        let mut used_candidates = std::collections::HashSet::new();
        
        for &id in &plus_votes {
            require!(used_candidates.insert(id), VotingError::DuplicateVote);
        }
        for &id in &minus_votes {
            require!(used_candidates.insert(id), VotingError::ConflictingVote);
        }

        voter_record.election = election.key();
        voter_record.voter = ctx.accounts.voter.key();
        voter_record.plus_vote_1 = plus_vote_1;
        voter_record.plus_vote_2 = plus_vote_2;
        voter_record.plus_vote_3 = plus_vote_3;
        voter_record.plus_vote_4 = plus_vote_4;
        voter_record.minus_vote_1 = minus_vote_1;
        voter_record.minus_vote_2 = minus_vote_2;
        voter_record.has_voted = true;

        election.voter_count += 1;

        msg!("Vote cast successfully by {}", ctx.accounts.voter.key());
        Ok(())
    }


    fn calculate_max_plus_votes(num_winners: u8, candidate_count: u8) -> u8 {
    let base_votes = match num_winners {
        1 => 2,
        2 => 3,
        3 => 4,
        _ => num_winners + 1,
    };
    
    // Don't exceed candidate count - 1
    std::cmp::min(base_votes, candidate_count.saturating_sub(1))
}



    #[derive(Accounts)]
    pub struct CastVote<'info> {
    #[account(mut)]
    pub election: Account<'info, Election>,
    
    #[account(
        init,
        payer = voter,
        space = 8 + 32 + 32 + (1 + 1) * 4 + (1 + 1) * 2 + 1 + 100, // Fixed-size fields
        seeds = [b"voter", election.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub voter_record: Account<'info, VoterRecord>,
    
    #[account(mut)]
    pub voter: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}