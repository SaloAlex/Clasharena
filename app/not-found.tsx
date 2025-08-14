import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Card className="tournament-card">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-500/20">
              <Search className="h-6 w-6 text-slate-500" />
            </div>
            <CardTitle className="text-xl">Page not found</CardTitle>
            <CardDescription>
              The page you're looking for doesn't exist or has been moved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-slate-400 bg-slate-800/50 p-3 rounded-md">
              <strong>Error 404:</strong> The requested resource could not be found.
            </div>
            
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Go home
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full">
                <Link href="/tournaments">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  View tournaments
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
