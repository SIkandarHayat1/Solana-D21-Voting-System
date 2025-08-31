'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '../solana/solana-provider'
import { AppHero } from '../app-hero'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreateElectionForm, ElectionList } from './voting-ui'


export default function VotingFeature() {
  const { publicKey } = useWallet()

  return publicKey ? (
    <div>
      <AppHero title="Voting App" subtitle="Create and participate in decentralized elections">
        <p className="mb-6">Connected as: {publicKey.toString()}</p>
      </AppHero>

      <div className="max-w-6xl mx-auto py-8">
        <Tabs defaultValue="elections" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="elections">My Elections</TabsTrigger>
            <TabsTrigger value="create">Create Election</TabsTrigger>
           
          </TabsList>
          <TabsContent value="elections" className="mt-6">
            <ElectionList />
          </TabsContent>
          <TabsContent value="create" className="mt-6">
            <CreateElectionForm />
          </TabsContent>
         
        </Tabs>
      </div>
    </div>
  ) : (
    <div className="max-w-4xl mx-auto">
      <div className="hero py-[64px]">
        <div className="hero-content text-center">
          <div>
            <h1 className="text-4xl font-bold mb-4">Welcome to the Voting App</h1>
            <p className="mb-6">Connect your wallet to create and participate in elections</p>
            <WalletButton className="btn btn-primary" />
          </div>
        </div>
      </div>
    </div>
  )
}