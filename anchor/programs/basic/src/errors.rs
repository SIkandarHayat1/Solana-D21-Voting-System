use anchor_lang::prelude::*;

#[error_code]
pub enum VotingError {
    #[msg("Invalid time range")]
    InvalidTimeRange,
    
    #[msg("Invalid winner count")]
    InvalidWinnerCount,
    
    #[msg("Name too long")]
    NameTooLong,
    
    #[msg("Description too long")]
    DescriptionTooLong,
    
    #[msg("Election is finalized")]
    ElectionFinalized,
    
    #[msg("Too many candidates")]
    TooManyCandidates,
    
    #[msg("Election has started")]
    ElectionStarted,
    
    #[msg("Election is not active")]
    ElectionNotActive,
    
    #[msg("Already voted")]
    AlreadyVoted,
    
    #[msg("Too many plus votes")]
    TooManyPlusVotes,
    
    #[msg("Too many minus votes")]
    TooManyMinusVotes,
    
    #[msg("Insufficient plus votes for minus voting")]
    InsufficientPlusVotes,
    
    #[msg("Invalid candidate ID")]
    InvalidCandidateId,
    
    #[msg("Duplicate vote")]
    DuplicateVote,
    
    #[msg("Conflicting vote")]
    ConflictingVote,
    
    #[msg("Election not ended")]
    ElectionNotEnded,
}