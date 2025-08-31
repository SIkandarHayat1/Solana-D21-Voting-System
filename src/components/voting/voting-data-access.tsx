'use client'

import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, PublicKey, SystemProgram } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../use-transaction-toast'
import { toast } from 'sonner'
import { getBasicProgram, getBasicProgramId } from '@project/anchor'
import { BN } from '@coral-xyz/anchor'

export function useVotingProgram(electionPubkey?: PublicKey) {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  
  const programId = useMemo(() => {
    const id = getBasicProgramId(cluster.network as Cluster)
    console.log(`Using program ID: ${id.toString()} for cluster: ${cluster.network || cluster.name}`)
    return id
  }, [cluster])
  
  const program = useMemo(() => {
    try {
      return getBasicProgram(provider, programId)
    } catch (error) {
      console.error('Error creating program instance:', error)
      return getBasicProgram(provider, programId)
    }
  }, [provider, programId])

  // FIXED: Get all elections with proper fetching
  const getElections = useQuery({
    queryKey: ['elections', { cluster }],
    queryFn: async () => {
      if (!provider.publicKey) return []
      
      console.log(`Fetching elections for program: ${programId.toString()}`)
      console.log(`Cluster: ${cluster.network || cluster.name}`)
      
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('RPC request timed out after 15 seconds')), 15000)
        )
        
        const allAccountsPromise = connection.getProgramAccounts(programId, {
          commitment: 'confirmed'
        })
        
        const allAccounts = await Promise.race([allAccountsPromise, timeoutPromise]) as Awaited<typeof allAccountsPromise>
        
        console.log(`Found ${allAccounts.length} total program accounts`)
        
        if (allAccounts.length === 0) {
          console.log('No program accounts found')
          return []
        }

        // FIXED: Use program.account.election.fetch instead of coder.decode
        const elections = []
        
        for (const account of allAccounts) {
          try {
            // Check if this is an Election account by trying to fetch it
            const electionData = await program.account.election.fetch(account.pubkey)
            
            elections.push({
              pubkey: account.pubkey,
              account: electionData,
            })
            
            console.log(`Successfully fetched election: ${electionData.name}`)
          } catch (decodeError) {
            // This account is not an Election, skip it (could be Candidate or VoterRecord)
            console.log(`Skipping account ${account.pubkey.toString()}: not an Election account`)
            continue
          }
        }
        
        console.log(`Found ${elections.length} election accounts`)
        return elections
        
      } catch (error) {
        console.error('Error fetching elections:', error)
        
        if (error.message.includes('timed out')) {
          throw new Error('Request timed out - RPC endpoint may be slow or unresponsive')
        } else if (error.message.includes('Invalid program id')) {
          throw new Error('Invalid program ID - make sure the program is deployed to this cluster')
        } else if (error.message.includes('Failed to deserialize')) {
          throw new Error('Failed to decode account data - program version mismatch?')
        } else {
          throw new Error(`Failed to fetch elections: ${error.message}`)
        }
      }
    },
    enabled: !!provider.publicKey,
    refetchInterval: 30000,
    retry: 2,
    retryDelay: 2000
  })

  // FIXED: Get candidates for a specific election
  const getCandidates = (electionPubkey: PublicKey) => 
    useQuery({
      queryKey: ['candidates', { cluster, electionPubkey: electionPubkey?.toString() }],
      queryFn: async () => {
        try {
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('RPC request timed out')), 10000)
          )
          
          const fetchPromise = connection.getProgramAccounts(programId, {
            filters: [
              { dataSize: 8 + 32 + 1 + 4 + 50 + 4 + 200 + 8 + 8 + 100 }, // Candidate account size
              {
                memcmp: {
                  offset: 8, // After the discriminator
                  bytes: electionPubkey.toBase58(),
                },
              },
            ],
            commitment: 'confirmed'
          })
          
          const candidateAccounts = await Promise.race([fetchPromise, timeoutPromise]) as Awaited<typeof fetchPromise>
          
          console.log(`Found ${candidateAccounts.length} candidate accounts for election ${electionPubkey.toString()}`)
          
          const candidates = []
          for (const account of candidateAccounts) {
            try {
              const candidateData = await program.account.candidate.fetch(account.pubkey)
              candidates.push({
                publicKey: account.pubkey,
                account: candidateData,
              })
            } catch (error) {
              console.error(`Failed to fetch candidate ${account.pubkey.toString()}:`, error)
            }
          }
          
          return candidates.sort((a, b) => a.account.id - b.account.id) // Sort by ID
        } catch (error) {
          console.error('Error fetching candidates:', error)
          throw new Error(`Failed to fetch candidates: ${error.message}`)
        }
      },
      refetchInterval: 5000,
      enabled: !!electionPubkey,
      retry: 1,
    })

  // Initialize a new election
  const initializeElection = useMutation({
    mutationKey: ['initialize-election', { cluster }],
    mutationFn: async ({
      name,
      description,
      startTime,
      endTime,
      numWinners,
      allowMinusVotes,
    }: {
      name: string
      description: string
      startTime: number
      endTime: number
      numWinners: number
      allowMinusVotes: boolean
    }) => {
      console.log('Creating election with program:', programId.toString())
      console.log('Election data:', { name, description, startTime, endTime, numWinners, allowMinusVotes })
      
      return program.methods
        .initializeElection(
          name,
          description,
          new BN(startTime),
          new BN(endTime),
          numWinners,
          allowMinusVotes
        )
        .accounts({
          election: PublicKey.findProgramAddressSync(
            [Buffer.from('election'), provider.publicKey.toBuffer(), Buffer.from(name)],
            programId
          )[0],
          authority: provider.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      toast.success('Election created successfully')
      getElections.refetch()
    },
    onError: (error) => {
      console.error('Error creating election:', error)
      toast.error(`Failed to create election: ${error.message}`)
    },
  })

  // FIXED: Add a candidate to an election with better error handling
  const addCandidate = useMutation({
    mutationKey: ['add-candidate', { cluster }],
    mutationFn: async ({
      election,
      name,
      description,
    }: {
      election: PublicKey
      name: string
      description: string
    }) => {
      try {
        console.log(`Adding candidate "${name}" to election ${election.toString()}`)
        
        // Fetch election account to get candidate count
        const electionAccount = await program.account.election.fetch(election)
        console.log(`Election found: ${electionAccount.name}, current candidates: ${electionAccount.candidateCount}`)
        
        const candidatePDA = PublicKey.findProgramAddressSync(
          [Buffer.from('candidate'), election.toBuffer(), Buffer.from([electionAccount.candidateCount])],
          programId
        )[0]
        
        console.log(`Candidate PDA: ${candidatePDA.toString()}`)
        
        const signature = await program.methods
          .addCandidate(name, description)
          .accounts({
            election,
            candidate: candidatePDA,
            authority: provider.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc()
          
        console.log(`Candidate added successfully, signature: ${signature}`)
        return signature
        
      } catch (error) {
        console.error('Error adding candidate:', error)
        
        // Provide more specific error messages
        if (error.message.includes('Election has started')) {
          throw new Error('Cannot add candidates - election has already started')
        } else if (error.message.includes('Election is finalized')) {
          throw new Error('Cannot add candidates - election is finalized')
        } else if (error.message.includes('has_one = authority')) {
          throw new Error('You are not the authority for this election')
        } else if (error.message.includes('Account does not exist')) {
          throw new Error('Election account not found')
        } else {
          throw new Error(`Failed to add candidate: ${error.message}`)
        }
      }
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      toast.success('Candidate added successfully')
      // Refetch both elections and candidates
      getElections.refetch()
    },
    onError: (error) => {
      console.error('Error adding candidate:', error)
      toast.error(error.message)
    },
  })

  // Cast a vote in an election
  const castVote = useMutation({
    mutationKey: ['cast-vote', { cluster }],
    mutationFn: async ({
      election,
      plusVotes,
      minusVotes,
    }: {
      election: PublicKey
      plusVotes: (number | null)[]
      minusVotes: (number | null)[]
    }) => {
      try {
        await program.account.election.fetch(election)
        
        return program.methods
          .castVote(
            plusVotes[0] !== null ? plusVotes[0] : null,
            plusVotes[1] !== null ? plusVotes[1] : null,
            plusVotes[2] !== null ? plusVotes[2] : null,
            plusVotes[3] !== null ? plusVotes[3] : null,
            minusVotes[0] !== null ? minusVotes[0] : null,
            minusVotes[1] !== null ? minusVotes[1] : null
          )
          .accounts({
            election,
            voterRecord: PublicKey.findProgramAddressSync(
              [Buffer.from('voter'), election.toBuffer(), provider.publicKey.toBuffer()],
              programId
            )[0],
            voter: provider.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc()
      } catch (error) {
        console.error('Error with election account:', error)
        throw new Error(`Failed to process vote: ${error.message}`)
      }
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      toast.success('Vote cast successfully')
    },
    onError: (error) => {
      console.error('Error casting vote:', error)
      toast.error(`Failed to cast vote: ${error.message}`)
    },
  })

  // Finalize an election
  const finalizeElection = useMutation({
    mutationKey: ['finalize-election', { cluster }],
    mutationFn: async ({ election }: { election: PublicKey }) => {
      try {
        await program.account.election.fetch(election)
        
        return program.methods
          .finalizeElection()
          .accounts({
            election,
            authority: provider.publicKey,
          })
          .rpc()
      } catch (error) {
        console.error('Error with election account:', error)
        throw new Error(`Failed to finalize election: ${error.message}`)
      }
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      toast.success('Election finalized successfully')
      getElections.refetch()
    },
    onError: (error) => {
      console.error('Error finalizing election:', error)
      toast.error(`Failed to finalize election: ${error.message}`)
    },
  })

  return {
    program,
    programId,
    getElections,
    getCandidates,
    initializeElection,
    addCandidate,
    castVote,
    finalizeElection,
  }
}