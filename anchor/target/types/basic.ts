/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/basic.json`.
 */
export type Basic = {
  "address": "aZBEKazqtq7Mx14nNRn4Da1Pta3xL2zznmCg58jwA59",
  "metadata": {
    "name": "basic",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "addCandidate",
      "discriminator": [
        172,
        34,
        30,
        247,
        165,
        210,
        224,
        164
      ],
      "accounts": [
        {
          "name": "election",
          "writable": true
        },
        {
          "name": "candidate",
          "writable": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "election"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        }
      ]
    },
    {
      "name": "castVote",
      "discriminator": [
        20,
        212,
        15,
        189,
        69,
        180,
        69,
        151
      ],
      "accounts": [
        {
          "name": "election",
          "writable": true
        },
        {
          "name": "voterRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "election"
              },
              {
                "kind": "account",
                "path": "voter"
              }
            ]
          }
        },
        {
          "name": "voter",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "plusVote1",
          "type": {
            "option": "u8"
          }
        },
        {
          "name": "plusVote2",
          "type": {
            "option": "u8"
          }
        },
        {
          "name": "plusVote3",
          "type": {
            "option": "u8"
          }
        },
        {
          "name": "plusVote4",
          "type": {
            "option": "u8"
          }
        },
        {
          "name": "minusVote1",
          "type": {
            "option": "u8"
          }
        },
        {
          "name": "minusVote2",
          "type": {
            "option": "u8"
          }
        }
      ]
    },
    {
      "name": "finalizeElection",
      "discriminator": [
        175,
        212,
        115,
        202,
        87,
        250,
        48,
        167
      ],
      "accounts": [
        {
          "name": "election",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "election"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "initializeElection",
      "discriminator": [
        59,
        166,
        191,
        126,
        195,
        0,
        153,
        168
      ],
      "accounts": [
        {
          "name": "election",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  108,
                  101,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "arg",
                "path": "name"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "startTime",
          "type": "i64"
        },
        {
          "name": "endTime",
          "type": "i64"
        },
        {
          "name": "numWinners",
          "type": "u8"
        },
        {
          "name": "allowMinusVotes",
          "type": "bool"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "candidate",
      "discriminator": [
        86,
        69,
        250,
        96,
        193,
        10,
        222,
        123
      ]
    },
    {
      "name": "election",
      "discriminator": [
        68,
        191,
        164,
        85,
        35,
        105,
        152,
        202
      ]
    },
    {
      "name": "voterRecord",
      "discriminator": [
        178,
        96,
        138,
        116,
        143,
        202,
        115,
        33
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidTimeRange",
      "msg": "Invalid time range"
    },
    {
      "code": 6001,
      "name": "invalidWinnerCount",
      "msg": "Invalid winner count"
    },
    {
      "code": 6002,
      "name": "nameTooLong",
      "msg": "Name too long"
    },
    {
      "code": 6003,
      "name": "descriptionTooLong",
      "msg": "Description too long"
    },
    {
      "code": 6004,
      "name": "electionFinalized",
      "msg": "Election is finalized"
    },
    {
      "code": 6005,
      "name": "tooManyCandidates",
      "msg": "Too many candidates"
    },
    {
      "code": 6006,
      "name": "electionStarted",
      "msg": "Election has started"
    },
    {
      "code": 6007,
      "name": "electionNotActive",
      "msg": "Election is not active"
    },
    {
      "code": 6008,
      "name": "alreadyVoted",
      "msg": "Already voted"
    },
    {
      "code": 6009,
      "name": "tooManyPlusVotes",
      "msg": "Too many plus votes"
    },
    {
      "code": 6010,
      "name": "tooManyMinusVotes",
      "msg": "Too many minus votes"
    },
    {
      "code": 6011,
      "name": "insufficientPlusVotes",
      "msg": "Insufficient plus votes for minus voting"
    },
    {
      "code": 6012,
      "name": "invalidCandidateId",
      "msg": "Invalid candidate ID"
    },
    {
      "code": 6013,
      "name": "duplicateVote",
      "msg": "Duplicate vote"
    },
    {
      "code": 6014,
      "name": "conflictingVote",
      "msg": "Conflicting vote"
    },
    {
      "code": 6015,
      "name": "electionNotEnded",
      "msg": "Election not ended"
    }
  ],
  "types": [
    {
      "name": "candidate",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "election",
            "type": "pubkey"
          },
          {
            "name": "id",
            "type": "u8"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "plusVotes",
            "type": "u64"
          },
          {
            "name": "minusVotes",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "election",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "endTime",
            "type": "i64"
          },
          {
            "name": "numWinners",
            "type": "u8"
          },
          {
            "name": "allowMinusVotes",
            "type": "bool"
          },
          {
            "name": "candidateCount",
            "type": "u8"
          },
          {
            "name": "voterCount",
            "type": "u64"
          },
          {
            "name": "isFinalized",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "voterRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "election",
            "type": "pubkey"
          },
          {
            "name": "voter",
            "type": "pubkey"
          },
          {
            "name": "plusVote1",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "plusVote2",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "plusVote3",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "plusVote4",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "minusVote1",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "minusVote2",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "hasVoted",
            "type": "bool"
          }
        ]
      }
    }
  ]
};
