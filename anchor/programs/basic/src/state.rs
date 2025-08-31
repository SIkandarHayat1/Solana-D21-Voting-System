use anchor_lang::prelude::*;

#[account]
pub struct Election {
    pub authority: Pubkey,
    pub name: String,
    pub description: String,
    pub start_time: i64,
    pub end_time: i64,
    pub num_winners: u8,
    pub allow_minus_votes: bool,
    pub candidate_count: u8,
    pub voter_count: u64,
    pub is_finalized: bool,
}

#[account]
pub struct Candidate {
    pub election: Pubkey,
    pub id: u8,
    pub name: String,
    pub description: String,
    pub plus_votes: u64,
    pub minus_votes: u64,
}

// Fixed VoterRecord structure without Vec<u8>
#[account]
pub struct VoterRecord {
    pub election: Pubkey,
    pub voter: Pubkey,
    pub plus_vote_1: Option<u8>,
    pub plus_vote_2: Option<u8>,
    pub plus_vote_3: Option<u8>,
    pub plus_vote_4: Option<u8>,
    pub minus_vote_1: Option<u8>,
    pub minus_vote_2: Option<u8>,
    pub has_voted: bool,
}

