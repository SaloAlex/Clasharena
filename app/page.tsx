'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { 
  Trophy, 
  Users, 
  Star, 
  Medal,
  TrendingUp,
  Gamepad2,
  Twitch,
  Shield,
  ArrowRight
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();

  const features = [
    {
      icon: <Trophy className="w-6 h-6 text-red-500" />,
      title: "Batallas en la Arena",
      description: "Demuestra tu valía en torneos épicos organizados por TheFLAKOO con mecánicas únicas y premios exclusivos."
    },
    {
      icon: <Twitch className="w-6 h-6 text-red-500" />,
      title: "Rewards por Ver Stream",
      description: "Gana puntos extra y beneficios especiales por ver el stream mientras juegas torneos."
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-red-500" />,
      title: "Ranking de Gladiadores",
      description: "Asciende en la clasificación de la arena y conviértete en una leyenda con nuestro sistema de puntos."
    },
    {
      icon: <Medal className="w-6 h-6 text-red-500" />,
      title: "Perfil de Campeón",
      description: "Exhibe tus victorias, títulos y medallas ganadas en la arena con tu perfil personalizado."
    },
    {
      icon: <Users className="w-6 h-6 text-red-500" />,
      title: "Forma tu Legión",
      description: "Recluta guerreros, forma tu equipo de élite y domina juntos la arena."
    },
    {
      icon: <Star className="w-6 h-6 text-red-500" />,
      title: "Privilegios de Campeón",
      description: "Desbloquea poderes especiales y acceso VIP siendo un guerrero activo en la arena."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-red-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        
        <div className="relative pt-20 pb-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center gap-4 mb-6">
                <img 
                  src="/Logo.png" 
                  alt="ClashArenaGG Logo" 
                  className="w-24 h-24 rounded-full border-4 border-red-600 shadow-lg shadow-red-600/50"
                />
                <h1 className="text-4xl sm:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-800">
                  ClashArenaGG
                </h1>
              </div>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Twitch className="w-8 h-8 text-red-500" />
                <p className="text-2xl sm:text-3xl font-medium text-white">
                  Comunidad Oficial de TheFLAKOO
                </p>
              </div>
              <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
                Entra a la arena, demuestra tu valor en torneos exclusivos,
                compite por la gloria y conviértete en una leyenda en la
                comunidad más competitiva de League of Legends en LATAM.
              </p>
              <div className="flex justify-center gap-4">
                <Button
                  onClick={() => window.open('https://www.twitch.tv/theflakoo', '_blank')}
                  className="bg-red-600 hover:bg-red-700 text-lg px-8 py-6"
                >
                  <Twitch className="w-5 h-5 mr-2" />
                  Seguir en Twitch
                </Button>
                {user ? (
                  <Button
                    onClick={() => router.push('/tournaments')}
                    className="bg-neutral-800 hover:bg-neutral-700 text-lg px-8 py-6"
                  >
                    <Trophy className="w-5 h-5 mr-2" />
                    Ver Torneos
                  </Button>
                ) : (
                  <Button
                    onClick={() => router.push('/auth')}
                    className="bg-neutral-800 hover:bg-neutral-700 text-lg px-8 py-6"
                  >
                    Empezar Ahora
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              La Arena Oficial de TheFLAKOO
            </h2>
            <p className="text-lg text-slate-400">
              El hogar de los torneos más épicos de nuestra comunidad
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-slate-800/50 rounded-lg p-6 hover:bg-slate-800/70 transition-colors"
              >
                <div className="bg-slate-700/50 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-blue-600/20 rounded-2xl p-8 sm:p-12 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
            
            <div className="relative">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                    ¿Listo para entrar a la arena?
                  </h2>
                  <p className="text-lg text-blue-200 mb-0 lg:mb-0">
                    Únete a la comunidad de TheFLAKOO y demuestra tu valor en nuestros torneos
                  </p>
                </div>
                <div className="flex gap-4">
                  {user ? (
                    <Button
                      onClick={() => router.push('/tournaments')}
                      className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-6"
                    >
                      <Trophy className="w-5 h-5 mr-2" />
                      Ver Próximos Torneos
                    </Button>
                  ) : (
                    <Button
                      onClick={() => router.push('/auth')}
                      className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-6"
                    >
                      Empezar Ahora
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-red-500 mb-2">50+</div>
              <div className="text-slate-400">Gladiadores Legendarios</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600 mb-2">1,000+</div>
              <div className="text-slate-400">Guerreros en la Arena</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-700 mb-2">5,000+</div>
              <div className="text-slate-400">Batallas Épicas</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-800 mb-2">100+</div>
              <div className="text-slate-400">Campeones Coronados</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}