use anchor_lang::prelude::*;
mod instructions;
mod state;
mod errors;

use instructions::*;
use state::*;
use errors::*;

declare_id!("aZBEKazqtq7Mx14nNRn4Da1Pta3xL2zznmCg58jwA59");

#[program]
pub mod basic {
    use super::*;

    pub fn initialize_election(
        ctx: Context<InitializeElection>,
        name: String,
        description: String,
        start_time: i64,
        end_time: i64,
        num_winners: u8,
        allow_minus_votes: bool,
    ) -> Result<()> {
        instructions::initialize_election(ctx, name, description, start_time, end_time, num_winners, allow_minus_votes)
    }

    pub fn add_candidate(
        ctx: Context<AddCandidate>,
        name: String,
        description: String,
    ) -> Result<()> {
        instructions::add_candidate(ctx, name, description)
    }

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
        instructions::cast_vote(ctx, plus_vote_1, plus_vote_2, plus_vote_3, plus_vote_4, minus_vote_1, minus_vote_2)
    }

    pub fn finalize_election(ctx: Context<FinalizeElection>) -> Result<()> {
        instructions::finalize_election(ctx)
    }
}






