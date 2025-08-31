'use client'

import { useVotingProgram } from './voting-data-access'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { Checkbox } from '@/components/ui/checkbox'
import { ExplorerLink } from '../cluster/cluster-ui'
import { ellipsify } from '@/lib/utils'
import { useCluster } from '../cluster/cluster-data-access'
import { toast } from 'sonner'

// Simple Badge component (inline replacement)
function Badge({ 
  children, 
  variant = 'default', 
  className = '' 
}: { 
  children: React.ReactNode
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  className?: string 
}) {
  const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold"
  const variantClasses = {
    default: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800", 
    destructive: "bg-red-100 text-red-800",
    outline: "border border-gray-300 bg-white text-gray-700"
  }
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  )
}

// Create Election Form
export function CreateElectionForm() {
  const { initializeElection } = useVotingProgram()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [numWinners, setNumWinners] = useState(1)
  const [allowMinusVotes, setAllowMinusVotes] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const startTime = new Date(startDate).getTime() / 1000
    const endTime = new Date(endDate).getTime() / 1000

    initializeElection.mutate({
      name,
      description,
      startTime,
      endTime,
      numWinners,
      allowMinusVotes,
    })
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create New Election</CardTitle>
        <CardDescription>Set up a new voting election</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Election Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={50}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="numWinners">Number of Winners</Label>
            <Input
              id="numWinners"
              type="number"
              min={1}
              max={255}
              value={numWinners}
              onChange={(e) => setNumWinners(parseInt(e.target.value))}
              required
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="allowMinusVotes"
              checked={allowMinusVotes}
              onCheckedChange={(checked) => setAllowMinusVotes(checked === true)}
            />
            <Label htmlFor="allowMinusVotes">Allow Negative Votes</Label>
          </div>
          <Button type="submit" className="w-full" disabled={initializeElection.isPending}>
            Create Election {initializeElection.isPending && '...'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// ENHANCED Election List
export function ElectionList() {
  const { getElections, programId } = useVotingProgram()
  const { publicKey } = useWallet()
  const { cluster } = useCluster()
  const [selectedElection, setSelectedElection] = useState<PublicKey | null>(null)
  const [showCandidateForm, setShowCandidateForm] = useState(false)
  const [showVotingForm, setShowVotingForm] = useState(false)
  const [showResultsFor, setShowResultsFor] = useState<PublicKey | null>(null)

  if (!publicKey) {
    return <div className="text-center">Please connect your wallet to view elections</div>
  }

  if (getElections.isLoading) {
    return (
      <div className="text-center">
        <div>Loading elections...</div>
        <div className="text-sm text-gray-500 mt-2">
          Searching for elections on {cluster.network || cluster.name}
        </div>
      </div>
    )
  }

  if (getElections.isError) {
    return (
      <div className="text-center space-y-4">
        <div className="text-red-500 text-lg">Error loading elections</div>
        <div className="p-4 text-sm border border-red-200 bg-red-50 text-red-600 rounded max-w-2xl mx-auto">
          <div className="font-semibold mb-2">Error Details:</div>
          <div>{getElections.error?.message || 'Failed to fetch elections'}</div>
        </div>
        <Button onClick={() => getElections.refetch()} variant="outline">
          Retry
        </Button>
      </div>
    )
  }

  if (getElections.data?.length === 0) {
    return (
      <div className="text-center space-y-4">
        <div className="text-lg">No elections found</div>
        <div>Create your first election to get started!</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="space-y-1">
          <div className="text-sm text-gray-500">
            Found {getElections.data?.length} elections on {cluster.network || cluster.name}
          </div>
        </div>
        <Button onClick={() => getElections.refetch()} variant="ghost" size="sm">
          Refresh
        </Button>
      </div>

      {/* Show candidate form if selected */}
      {selectedElection && showCandidateForm && (
        <div className="mb-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Add Candidate</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setShowCandidateForm(false)
                    setSelectedElection(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <AddCandidateForm 
                electionPubkey={selectedElection} 
                onSuccess={() => {
                  setShowCandidateForm(false)
                  setSelectedElection(null)
                  getElections.refetch()
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Show voting form if selected */}
      {selectedElection && showVotingForm && (
        <div className="mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Cast Your Vote</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setShowVotingForm(false)
                  setSelectedElection(null)
                }}
              >
                Cancel
              </Button>
            </CardHeader>
            <CardContent>
              <VotingForm 
                electionPubkey={selectedElection} 
                onSuccess={() => {
                  setShowVotingForm(false)
                  setSelectedElection(null)
                  getElections.refetch()
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Show results if selected */}
      {showResultsFor && (
        <div className="mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Election Results</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowResultsFor(null)}
              >
                Close
              </Button>
            </CardHeader>
            <CardContent>
              <ElectionResults electionPubkey={showResultsFor} />
            </CardContent>
          </Card>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {getElections.data?.map((election) => (
          <ElectionCard 
            key={election.pubkey.toString()} 
            election={election}
            onAddCandidate={(pubkey) => {
              setSelectedElection(pubkey)
              setShowCandidateForm(true)
              setShowVotingForm(false)
              setShowResultsFor(null)
            }}
            onVote={(pubkey) => {
              setSelectedElection(pubkey)
              setShowVotingForm(true)
              setShowCandidateForm(false)
              setShowResultsFor(null)
            }}
            onViewResults={(pubkey) => {
              setShowResultsFor(pubkey)
              setSelectedElection(null)
              setShowCandidateForm(false)
              setShowVotingForm(false)
            }}
          />
        ))}
      </div>
    </div>
  )
}

// FIXED Election Card with Complete Finalize Feature
function ElectionCard({ 
  election, 
  onAddCandidate,
  onVote,
  onViewResults
}: { 
  election: { pubkey: PublicKey; account: any }
  onAddCandidate: (pubkey: PublicKey) => void
  onVote: (pubkey: PublicKey) => void
  onViewResults: (pubkey: PublicKey) => void
}) {
  const { finalizeElection } = useVotingProgram()
  const { publicKey } = useWallet()
  const now = Math.floor(Date.now() / 1000)
  const isActive = now >= election.account.startTime && now <= election.account.endTime
  const isUpcoming = now < election.account.startTime
  const isEnded = now > election.account.endTime
  
  const canAddCandidates = isUpcoming && !election.account.isFinalized
  const hasCandidates = election.account.candidateCount > 0
  const canVote = isActive && hasCandidates
  const isAuthority = election.account.authority.equals(publicKey)
  const canFinalize = isEnded && !election.account.isFinalized && isAuthority

  const handleFinalize = async () => {
    if (!window.confirm(
      `Are you sure you want to finalize the election "${election.account.name}"?\n\n` +
      `This will:\n` +
      `• Make the results official and permanent\n` +
      `• Prevent any further changes to the election\n` +
      `• This action cannot be undone\n\n` +
      `Continue?`
    )) {
      return
    }
    
    try {
      await finalizeElection.mutateAsync({ election: election.pubkey })
      toast.success(`Election "${election.account.name}" has been finalized!`)
    } catch (error) {
      console.error('Failed to finalize election:', error)
      toast.error(`Failed to finalize election: ${error.message}`)
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{election.account.name}</CardTitle>
          <div className="flex flex-col items-end space-y-1">
            <Badge variant={isActive ? 'default' : isUpcoming ? 'secondary' : 'destructive'}>
              {isActive ? 'Active' : isUpcoming ? 'Upcoming' : 'Ended'}
            </Badge>
            {election.account.isFinalized && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                Finalized
              </Badge>
            )}
            {isAuthority && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                Owner
              </Badge>
            )}
            {!hasCandidates && (
              <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                No Candidates
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>{election.account.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-grow">
        <div className="space-y-3">
          {/* Critical Status Alert */}
          {!hasCandidates && canAddCandidates && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm">
              <div className="font-semibold text-yellow-800">Action Required</div>
              <div className="text-yellow-700">
                This election has no candidates. Add candidates before the start time.
              </div>
            </div>
          )}

          {/* Finalization Alert */}
          {canFinalize && (
            <div className="bg-orange-50 border border-orange-200 p-3 rounded text-sm">
              <div className="font-semibold text-orange-800">Ready to Finalize</div>
              <div className="text-orange-700">
                This election has ended and can be finalized to make results official.
              </div>
            </div>
          )}

          {/* Finalized Alert */}
          {election.account.isFinalized && (
            <div className="bg-green-50 border border-green-200 p-3 rounded text-sm">
              <div className="font-semibold text-green-800">Election Complete</div>
              <div className="text-green-700">
                This election has been finalized. Results are now official.
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-semibold">Start:</span>
              <div className="text-xs">
                {new Date(election.account.startTime * 1000).toLocaleString()}
              </div>
            </div>
            <div>
              <span className="font-semibold">End:</span>
              <div className="text-xs">
                {new Date(election.account.endTime * 1000).toLocaleString()}
              </div>
            </div>
            <div>
              <span className="font-semibold">Winners:</span> {election.account.numWinners}
            </div>
            <div>
              <span className="font-semibold">Candidates:</span> 
              <span className={election.account.candidateCount === 0 ? 'text-red-600 font-semibold' : ''}>
                {election.account.candidateCount}
              </span>
            </div>
            <div>
              <span className="font-semibold">Voters:</span> {election.account.voterCount.toString()}
            </div>
            <div>
              <span className="font-semibold">Minus Votes:</span> 
              <span className="text-xs">{election.account.allowMinusVotes ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex-shrink-0 flex justify-between items-center pt-4">
        <ExplorerLink
          path={`account/${election.pubkey.toString()}`}
          label={ellipsify(election.pubkey.toString())}
          className="text-xs"
        />
        <div className="space-x-2 flex flex-wrap gap-1">
          {canAddCandidates && (
            <Button 
              size="sm" 
              onClick={() => onAddCandidate(election.pubkey)}
              variant={hasCandidates ? "outline" : "default"}
            >
              Add Candidate
            </Button>
          )}
          {canVote && (
            <Button size="sm" onClick={() => onVote(election.pubkey)}>
              Vote
            </Button>
          )}
          {isActive && !hasCandidates && (
            <Button size="sm" disabled>
              No Candidates
            </Button>
          )}
          {canFinalize && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleFinalize}
              disabled={finalizeElection.isPending}
              className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-300"
            >
              {finalizeElection.isPending ? 'Finalizing...' : 'Finalize'}
            </Button>
          )}
          {(election.account.isFinalized || (isEnded && hasCandidates)) && (
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-green-50 text-green-700 hover:bg-green-100 border-green-300"
              onClick={() => onViewResults(election.pubkey)}
            >
              View Results
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

// ENHANCED Add Candidate Form
export function AddCandidateForm({ 
  electionPubkey, 
  onSuccess 
}: { 
  electionPubkey: PublicKey
  onSuccess?: () => void
}) {
  const { addCandidate } = useVotingProgram()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    try {
      await addCandidate.mutateAsync({
        election: electionPubkey,
        name,
        description,
      })
      
      setName('')
      setDescription('')
      toast.success(`Candidate "${name}" added successfully!`)
      onSuccess?.()
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to add candidate'
      console.error('Add candidate error:', err)
      setError(errorMessage)
      toast.error(`Failed to add candidate: ${errorMessage}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm border border-red-200 bg-red-50 text-red-600 rounded">
          <div className="font-semibold">Error adding candidate:</div>
          <div>{error}</div>
          <div className="mt-2 text-xs">
            <div>Possible causes:</div>
            <ul className="list-disc list-inside ml-2">
              <li>Election may have already started</li>
              <li>You may not be the election authority</li>
              <li>Network connection issues</li>
              <li>Insufficient SOL for transaction fees</li>
            </ul>
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="candidate-name">Candidate Name</Label>
        <Input
          id="candidate-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={50}
          placeholder="Enter candidate name"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="candidate-description">Description</Label>
        <Textarea
          id="candidate-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          maxLength={200}
          placeholder="Describe the candidate"
          rows={3}
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={addCandidate.isPending}
      >
        {addCandidate.isPending ? 'Adding Candidate...' : 'Add Candidate'}
      </Button>
    </form>
  )
}

// COMPLETE Voting Form Implementation
export function VotingForm({ 
  electionPubkey, 
  onSuccess 
}: { 
  electionPubkey: PublicKey
  onSuccess?: () => void
}) {
  const { getCandidates, castVote, getElections } = useVotingProgram()
  const candidatesQuery = getCandidates(electionPubkey)
  const [selectedPlusVotes, setSelectedPlusVotes] = useState<Set<number>>(new Set())
  const [selectedMinusVotes, setSelectedMinusVotes] = useState<Set<number>>(new Set())
  const [error, setError] = useState('')

  // Get election data
  const election = getElections.data?.find(e => e.pubkey.equals(electionPubkey))
  
  if (!election) {
    return <div className="text-center text-red-500">Election not found</div>
  }

  if (candidatesQuery.isLoading) {
    return <div className="text-center">Loading candidates...</div>
  }

  if (candidatesQuery.isError) {
    return <div className="text-center text-red-500">Error loading candidates</div>
  }

  const candidates = candidatesQuery.data || []

  if (candidates.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">No candidates available for this election.</div>
        <div className="text-sm text-gray-400">
          Candidates must be added before voting can begin.
        </div>
      </div>
    )
  }

  // Calculate max votes based on D21 rules - but allow at least 1 vote
  const basePlusVotes = election.account.numWinners === 1 ? 2 : election.account.numWinners + 1
  const maxPlusVotes = Math.min(basePlusVotes, Math.max(1, candidates.length))
  const maxMinusVotes = election.account.allowMinusVotes ? Math.floor(maxPlusVotes / 3) : 0

  const handlePlusVoteToggle = (candidateId: number) => {
    const newSelected = new Set(selectedPlusVotes)
    if (newSelected.has(candidateId)) {
      newSelected.delete(candidateId)
    } else {
      if (newSelected.size < maxPlusVotes && !selectedMinusVotes.has(candidateId)) {
        newSelected.add(candidateId)
      }
    }
    setSelectedPlusVotes(newSelected)
  }

  const handleMinusVoteToggle = (candidateId: number) => {
    if (!election.account.allowMinusVotes) return
    
    const newSelected = new Set(selectedMinusVotes)
    if (newSelected.has(candidateId)) {
      newSelected.delete(candidateId)
    } else {
      if (newSelected.size < maxMinusVotes && !selectedPlusVotes.has(candidateId)) {
        newSelected.add(candidateId)
      }
    }
    setSelectedMinusVotes(newSelected)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate votes
    if (selectedPlusVotes.size === 0) {
      setError('You must select at least one positive vote')
      return
    }

    if (selectedMinusVotes.size > 0 && selectedPlusVotes.size < 2) {
      setError('You must select at least 2 positive votes to cast negative votes')
      return
    }

    try {
      // Convert to arrays with proper padding
      const plusVotesArray = Array.from(selectedPlusVotes).slice(0, 4)
      const minusVotesArray = Array.from(selectedMinusVotes).slice(0, 2)
      
      // Pad arrays to expected length
      while (plusVotesArray.length < 4) plusVotesArray.push(null)
      while (minusVotesArray.length < 2) minusVotesArray.push(null)

      await castVote.mutateAsync({
        election: electionPubkey,
        plusVotes: plusVotesArray,
        minusVotes: minusVotesArray,
      })

      toast.success('Vote cast successfully!')
      onSuccess?.()
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to cast vote'
      console.error('Vote casting error:', err)
      setError(errorMessage)
      toast.error(`Failed to cast vote: ${errorMessage}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm border border-red-200 bg-red-50 text-red-600 rounded">
          <div className="font-semibold">Error casting vote:</div>
          <div>{error}</div>
        </div>
      )}

      {/* Voting Instructions */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded">
        <h4 className="font-semibold text-blue-800 mb-2">Voting Instructions</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <div>• Select up to {maxPlusVotes} candidates for positive votes</div>
          {election.account.allowMinusVotes && (
            <div>• Optional: Select up to {maxMinusVotes} candidates for negative votes (requires at least 2 positive votes)</div>
          )}
          <div>• You cannot vote both positively and negatively for the same candidate</div>
        </div>
      </div>

      {/* Vote Summary */}
      <div className="flex justify-between text-sm text-gray-600">
        <div>Plus votes: {selectedPlusVotes.size}/{maxPlusVotes}</div>
        {election.account.allowMinusVotes && (
          <div>Minus votes: {selectedMinusVotes.size}/{maxMinusVotes}</div>
        )}
      </div>

      {/* Candidates List */}
      <div className="space-y-3">
        <h4 className="font-semibold">Candidates</h4>
        {candidates.map((candidate) => (
          <div key={candidate.account.id} className="border rounded p-3">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h5 className="font-medium">{candidate.account.name}</h5>
                <p className="text-sm text-gray-600">{candidate.account.description}</p>
              </div>
              <div className="text-xs text-gray-500">
                ID: {candidate.account.id}
              </div>
            </div>
            
            <div className="flex space-x-4 mt-3">
              {/* Plus Vote Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`plus-${candidate.account.id}`}
                  checked={selectedPlusVotes.has(candidate.account.id)}
                  onCheckedChange={() => handlePlusVoteToggle(candidate.account.id)}
                  disabled={
                    !selectedPlusVotes.has(candidate.account.id) && 
                    (selectedPlusVotes.size >= maxPlusVotes || selectedMinusVotes.has(candidate.account.id))
                  }
                />
                <Label htmlFor={`plus-${candidate.account.id}`} className="text-green-600">
                  Positive Vote
                </Label>
              </div>

              {/* Minus Vote Checkbox */}
              {election.account.allowMinusVotes && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`minus-${candidate.account.id}`}
                    checked={selectedMinusVotes.has(candidate.account.id)}
                    onCheckedChange={() => handleMinusVoteToggle(candidate.account.id)}
                    disabled={
                      !selectedMinusVotes.has(candidate.account.id) && 
                      (selectedMinusVotes.size >= maxMinusVotes || selectedPlusVotes.has(candidate.account.id))
                    }
                  />
                  <Label htmlFor={`minus-${candidate.account.id}`} className="text-red-600">
                    Negative Vote
                  </Label>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={castVote.isPending || selectedPlusVotes.size === 0}
      >
        {castVote.isPending ? 'Casting Vote...' : `Cast Vote (${selectedPlusVotes.size} positive${selectedMinusVotes.size > 0 ? `, ${selectedMinusVotes.size} negative` : ''})`}
      </Button>
    </form>
  )
}

// NEW: Election Results Component
export function ElectionResults({ electionPubkey }: { electionPubkey: PublicKey }) {
  const { getCandidates, getElections } = useVotingProgram()
  const candidatesQuery = getCandidates(electionPubkey)
  
  const election = getElections.data?.find(e => e.pubkey.equals(electionPubkey))

  if (!election) {
    return <div className="text-center text-red-500">Election not found</div>
  }

  if (candidatesQuery.isLoading) {
    return <div className="text-center">Loading results...</div>
  }

  if (candidatesQuery.isError) {
    return <div className="text-center text-red-500">Error loading results</div>
  }

  const candidates = candidatesQuery.data || []

  if (candidates.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">No candidates in this election</div>
      </div>
    )
  }

  // Calculate results
  const candidatesWithScores = candidates.map(candidate => {
    const plusVotes = parseInt(candidate.account.plusVotes?.toString() || '0')
    const minusVotes = parseInt(candidate.account.minusVotes?.toString() || '0')
    const netScore = plusVotes - minusVotes
    
    return {
      ...candidate,
      plusVotes,
      minusVotes,
      netScore
    }
  })

  // Sort by net score (highest first)
  const sortedCandidates = candidatesWithScores.sort((a, b) => b.netScore - a.netScore)
  
  // Determine winners
  const winners = sortedCandidates.slice(0, election.account.numWinners)
  const totalVotes = election.account.voterCount.toString()

  return (
    <div className="space-y-6">
      {/* Election Summary */}
      <div className="bg-gray-50 border border-gray-200 p-4 rounded">
        <h3 className="font-semibold text-gray-800 mb-2">Election Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Election:</span> {election.account.name}
          </div>
          <div>
            <span className="font-medium">Total Voters:</span> {totalVotes}
          </div>
          <div>
            <span className="font-medium">Winners Selected:</span> {election.account.numWinners}
          </div>
          <div>
            <span className="font-medium">Status:</span> 
            <span className={`ml-1 ${election.account.isFinalized ? 'text-green-600' : 'text-orange-600'}`}>
              {election.account.isFinalized ? 'Finalized' : 'Preliminary'}
            </span>
          </div>
        </div>
      </div>

      {/* Winners Section */}
      {winners.length > 0 && (
        <div className="bg-green-50 border border-green-200 p-4 rounded">
          <h3 className="font-semibold text-green-800 mb-3">
            🏆 Winners ({winners.length})
          </h3>
          <div className="space-y-2">
            {winners.map((winner, index) => (
              <div key={winner.account.id} className="flex justify-between items-center bg-white p-3 rounded border border-green-300">
                <div>
                  <div className="font-medium text-green-800">
                    #{index + 1} {winner.account.name}
                  </div>
                  <div className="text-sm text-green-600">
                    {winner.account.description}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-800">
                    Net: {winner.netScore}
                  </div>
                  <div className="text-xs text-green-600">
                    +{winner.plusVotes} -{winner.minusVotes}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Results Table */}
      <div>
        <h3 className="font-semibold mb-3">Complete Results</h3>
        <div className="overflow-hidden border border-gray-200 rounded">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Plus Votes</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Minus Votes</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Net Score</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedCandidates.map((candidate, index) => {
                const isWinner = index < election.account.numWinners
                return (
                  <tr key={candidate.account.id} className={isWinner ? 'bg-green-50' : 'bg-white'}>
                    <td className="px-4 py-4 text-sm font-medium">
                      {index + 1}
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{candidate.account.name}</div>
                        <div className="text-sm text-gray-500">{candidate.account.description}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-green-600 font-medium">
                      {candidate.plusVotes}
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-red-600 font-medium">
                      {candidate.minusVotes}
                    </td>
                    <td className="px-4 py-4 text-center text-sm font-bold">
                      {candidate.netScore}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {isWinner ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Winner
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Not Selected
                        </Badge>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Voting Statistics */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded">
        <h3 className="font-semibold text-blue-800 mb-3">Voting Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white p-3 rounded border border-blue-200">
            <div className="font-medium text-blue-800">Total Plus Votes</div>
            <div className="text-xl font-bold text-blue-600">
              {sortedCandidates.reduce((sum, c) => sum + c.plusVotes, 0)}
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-blue-200">
            <div className="font-medium text-blue-800">Total Minus Votes</div>
            <div className="text-xl font-bold text-red-600">
              {sortedCandidates.reduce((sum, c) => sum + c.minusVotes, 0)}
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-blue-200">
            <div className="font-medium text-blue-800">Participation Rate</div>
            <div className="text-xl font-bold text-blue-600">
              {totalVotes === '0' ? '0%' : '100%'}
            </div>
            <div className="text-xs text-blue-500">
              {totalVotes} voters participated
            </div>
          </div>
        </div>
      </div>

      {/* Methodology Note */}
      <div className="bg-gray-50 border border-gray-200 p-4 rounded text-sm">
        <h4 className="font-semibold text-gray-800 mb-2">Methodology</h4>
        <div className="text-gray-600 space-y-1">
          <div>• Results are calculated using net score (Plus Votes - Minus Votes)</div>
          <div>• Candidates are ranked from highest to lowest net score</div>
          <div>• Top {election.account.numWinners} candidate(s) are declared winners</div>
          {election.account.allowMinusVotes && (
            <div>• Negative voting was allowed in this election</div>
          )}
          {election.account.isFinalized ? (
            <div className="text-green-600 font-medium">• These are final, official results</div>
          ) : (
            <div className="text-orange-600 font-medium">• These are preliminary results - election not yet finalized</div>
          )}
        </div>
      </div>
    </div>
  )
}