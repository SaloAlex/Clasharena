import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Trophy, Users, Zap, Target } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10" />
        
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/20 text-blue-300 text-sm font-medium mb-6">
            <Zap className="w-4 h-4 mr-2" />
            Real-time match tracking powered by Riot API
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-6">
            League of Legends
            <br />
            Tournament Organizer
          </h1>
          
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
            Create and participate in competitive League of Legends tournaments with automatic match tracking, 
            live leaderboards, and configurable scoring systems.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link href="/auth">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-slate-600">
              <Link href="/tournaments">View Tournaments</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Our Platform?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="tournament-card">
              <CardHeader>
                <Trophy className="w-12 h-12 text-yellow-500 mb-4" />
                <CardTitle>Automated Tournaments</CardTitle>
                <CardDescription>
                  Set up tournaments with custom scoring rules and let our system automatically track matches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>• Configurable point systems</li>
                  <li>• Multiple queue support</li>
                  <li>• Automatic match detection</li>
                  <li>• Anti-abuse measures</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="tournament-card">
              <CardHeader>
                <Users className="w-12 h-12 text-blue-500 mb-4" />
                <CardTitle>Live Leaderboards</CardTitle>
                <CardDescription>
                  Real-time rankings update as players complete matches during tournament windows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>• Real-time updates</li>
                  <li>• Detailed statistics</li>
                  <li>• Historical performance</li>
                  <li>• Player profiles</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="tournament-card">
              <CardHeader>
                <Target className="w-12 h-12 text-purple-500 mb-4" />
                <CardTitle>Riot Integration</CardTitle>
                <CardDescription>
                  Official Riot Games API integration ensures accurate and up-to-date match data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>• RSO OAuth authentication</li>
                  <li>• Match-V5 API integration</li>
                  <li>• Rate limiting protection</li>
                  <li>• Data accuracy guarantee</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="tournament-card p-8">
            <CardHeader>
              <CardTitle className="text-2xl mb-4">Ready to Start Competing?</CardTitle>
              <CardDescription className="text-lg">
                Join thousands of players in exciting League of Legends tournaments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center gap-2 flex-wrap">
                <Badge variant="secondary">Ranked Solo/Duo</Badge>
                <Badge variant="secondary">Ranked Flex</Badge>
                <Badge variant="secondary">Normal Draft</Badge>
              </div>
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Link href="/auth">Connect Your LoL Account</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}