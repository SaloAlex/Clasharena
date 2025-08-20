'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/supabase';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Settings, LogOut, Shield, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';

export function Navigation() {
  const { user, loading, mounted } = useAuth();
  const isAdmin = useIsAdmin();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  // Renderizar un placeholder durante la hidratación
  if (!mounted) {
    return (
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Image 
                src="/Logo.png" 
                alt="ClashArenaGG Logo"
                width={32}
                height={32}
                className="rounded-full"
              />
              <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-cyan-400 to-purple-500">
                ClashArenaGG
              </span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <div className="text-cyan-400 flex items-center hover:text-cyan-300 transition-colors">
                <Trophy className="w-4 h-4 mr-1" />
                Torneos
              </div>
              <div className="text-purple-400 flex items-center hover:text-purple-300 transition-colors">
                <Shield className="w-4 h-4 mr-1" />
                Clasificación
              </div>
            </div>
            <div className="w-8 h-8 bg-slate-700 rounded-full animate-pulse" />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
                          <Image 
                src="/Logo.png" 
                alt="ClashArenaGG Logo"
                width={32}
                height={32}
                className="rounded-full"
              />
            <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-cyan-400 to-purple-500">ClashArenaGG</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <DropdownMenu>
              <DropdownMenuTrigger className="text-cyan-400 hover:text-cyan-300 transition-colors">
                <span className="flex items-center">
                  <Trophy className="w-4 h-4 mr-1" />
                  Torneos
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link href="/tournaments" className="flex items-center">
                    <Trophy className="mr-2 h-4 w-4" />
                    Ver Torneos
                  </Link>
                </DropdownMenuItem>
                {/* Solo TheFLAKOO puede crear torneos */}
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/tournaments/create" className="flex items-center">
                      <Trophy className="mr-2 h-4 w-4" />
                      Crear Torneo
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/tournaments/my" className="flex items-center">
                    <Trophy className="mr-2 h-4 w-4" />
                    Mis Torneos
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Link 
              href="/leaderboard" 
              className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center"
            >
              <Shield className="w-4 h-4 mr-1" />
              Clasificación
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="w-8 h-8 bg-slate-700 rounded-full animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-blue-600">
                        {getInitials(user.email || 'U')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {user.email}
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Mi Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost">
                  <Link href="/auth">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}