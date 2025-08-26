'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { HeroBackground } from '../components/HeroBackground';
import { 
  Trophy, 
  Users, 
  Star, 
  Medal,
  TrendingUp,
  Gamepad2,

  Shield,
  ArrowRight,
  Rocket,
  BarChart3,
  Award,
  Users2
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [heroRef, heroInView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const heroAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const featuredTournaments = [
    {
      name: "Copa Neón",
      game: "League of Legends",
      date: "En curso",
      status: "live",
      players: "32/64",
      prize: "50,000 puntos"
    },
    {
      name: "Arena Semanal",
      game: "League of Legends",
      date: "Mañana - 20:00hs",
      status: "open",
      players: "16/32",
      prize: "25,000 puntos"
    },
    {
      name: "Torneo Relámpago",
      game: "League of Legends",
      date: "Hoy - 22:00hs",
      status: "open",
      players: "8/16",
      prize: "10,000 puntos"
    }
  ];

  const benefits = [
    {
      icon: <Rocket className="w-8 h-8 text-cyan-400" />,
      title: "Torneos rápidos y fáciles",
      description: "Unite a torneos en segundos y empezá a competir inmediatamente"
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-purple-400" />,
      title: "Estadísticas avanzadas",
      description: "Seguimiento detallado de tu rendimiento y progreso"
    },
    {
      icon: <Award className="w-8 h-8 text-cyan-400" />,
      title: "Recompensas únicas",
      description: "Ganá premios exclusivos y puntos canjeables"
    },
    {
      icon: <Users2 className="w-8 h-8 text-purple-400" />,
      title: "Comunidad gamer",
      description: "Conectá con otros jugadores y formá parte de algo más grande"
    }
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900 via-slate-900 to-purple-900">
      {/* Hero Section */}
      <motion.div 
        ref={heroRef}
        initial="hidden"
        animate={heroInView ? "visible" : "hidden"}
        variants={heroAnimation}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Hero Background */}
        <HeroBackground />
        
        <div className="relative px-4 sm:px-6 lg:px-8 py-32 w-full max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            {/* Logo y Título */}
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col items-center justify-center gap-6"
            >
              <Image 
                src="/Logo.png" 
                alt="ClashArena Logo" 
                width={150}
                height={150}
                className="rounded-full border-4 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.5)] animate-glow"
              />
              <h1 className="text-5xl sm:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 animate-gradient">
                ClashArena
              </h1>
            </motion.div>

            {/* Subtítulos Principales */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-4"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                Competí. Crecé. Demostrá tu nivel.
              </h2>
              <p className="text-xl text-cyan-200/80 max-w-3xl mx-auto">
                Torneos en vivo, estadísticas avanzadas y recompensas por jugar.
              </p>
            </motion.div>

            {/* Botones CTA */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row justify-center gap-4 pt-8"
            >
              {!user ? (
                <>
                  <Button
                    onClick={() => router.push('/auth')}
                    className="bg-gradient-to-r from-green-400 to-emerald-600 hover:from-green-500 hover:to-emerald-700 text-lg px-8 py-6 shadow-lg shadow-emerald-500/30"
                  >
                    Crear cuenta gratis
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button
                    onClick={() => router.push('/tournaments')}
                    variant="outline"
                    className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-950/50 text-lg px-8 py-6"
                  >
                    <Trophy className="w-5 h-5 mr-2" />
                    Ver torneos activos
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => router.push('/tournaments')}
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-lg px-8 py-6 shadow-lg shadow-cyan-500/30"
                  >
                    <Trophy className="w-5 h-5 mr-2" />
                    Participar en torneos
                  </Button>
                  <Button
                    onClick={() => router.push('/profile')}
                    variant="outline"
                    className="border-purple-500/50 text-purple-400 hover:bg-purple-950/50 text-lg px-8 py-6"
                  >
                    <Medal className="w-5 h-5 mr-2" />
                    Ver mi perfil
                  </Button>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Torneos Destacados */}
      <div className="py-24 px-4 sm:px-6 lg:px-8 relative bg-black/20">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Torneos Destacados
            </h2>
            <p className="text-lg text-slate-400">
              Los mejores torneos de la semana te esperan
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredTournaments.map((tournament, index) => (
              <motion.div
                key={index}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20 hover:border-cyan-500/40 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white group-hover:text-cyan-400 transition-colors">
                      {tournament.name}
                    </h3>
                    <p className="text-slate-400">{tournament.game}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    tournament.status === 'live' 
                      ? 'bg-red-500/20 text-red-400' 
                      : 'bg-green-500/20 text-green-400'
                  }`}>
                    {tournament.status === 'live' ? 'EN VIVO' : 'ABIERTO'}
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      tournament.status === 'live' 
                        ? 'bg-red-500 animate-pulse' 
                        : 'bg-green-500'
                    }`} />
                    <p className="text-slate-300">{tournament.date}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-slate-400">
                      <Users2 className="w-4 h-4 inline-block mr-1" />
                      {tournament.players}
                    </p>
                    <div className="bg-purple-500/20 px-3 py-1 rounded-full">
                      <p className="text-purple-400 font-semibold text-sm">
                        <Trophy className="w-4 h-4 inline-block mr-1" />
                        {tournament.prize}
                      </p>
                    </div>
                  </div>
                </div>
                <Button 
                  className={`w-full ${
                    user 
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600'
                      : 'bg-slate-600 hover:bg-slate-700'
                  }`}
                  onClick={() => user ? router.push('/tournaments') : router.push('/auth')}
                >
                  {user 
                    ? (tournament.status === 'live' ? 'Ver resultados' : 'Unirse')
                    : 'Iniciar sesión para unirte'
                  }
                  {user ? <ArrowRight className="w-4 h-4 ml-2" /> : null}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Estadísticas y Ranking */}
      <div className="py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                Estadísticas que importan
              </h2>
              <p className="text-lg text-slate-400">
                {user 
                  ? "Seguimiento detallado de tu rendimiento, winrate, KDA y más. Compará tus stats con otros jugadores y mejorá tu juego."
                  : "Creá tu cuenta y comenzá a trackear tus estadísticas. Compará tu rendimiento y mejorá tu juego con datos precisos."
                }
              </p>
              <div className="grid grid-cols-2 gap-4">
                {user ? (
                  <>
                    <div className="bg-slate-800/30 rounded-lg p-4">
                      <div className="text-2xl font-bold text-cyan-400">65%</div>
                      <div className="text-slate-400">Winrate Promedio</div>
                    </div>
                    <div className="bg-slate-800/30 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-400">3.5</div>
                      <div className="text-slate-400">KDA Promedio</div>
                    </div>
                    <div className="bg-slate-800/30 rounded-lg p-4">
                      <div className="text-2xl font-bold text-cyan-400">150+</div>
                      <div className="text-slate-400">Partidas Jugadas</div>
                    </div>
                    <div className="bg-slate-800/30 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-400">Top 10%</div>
                      <div className="text-slate-400">Ranking Global</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-slate-800/30 rounded-lg p-4">
                      <div className="text-2xl font-bold text-cyan-400">100%</div>
                      <div className="text-slate-400">Tracking Automático</div>
                    </div>
                    <div className="bg-slate-800/30 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-400">24/7</div>
                      <div className="text-slate-400">Estadísticas en Vivo</div>
                    </div>
                    <div className="bg-slate-800/30 rounded-lg p-4">
                      <div className="text-2xl font-bold text-cyan-400">+10</div>
                      <div className="text-slate-400">Métricas Detalladas</div>
                    </div>
                    <div className="bg-slate-800/30 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-400">1000+</div>
                      <div className="text-slate-400">Jugadores Activos</div>
                    </div>
                  </>
                )}
              </div>
              <Button
                onClick={() => user ? router.push('/profile') : router.push('/auth')}
                className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
              >
                {user ? 'Ver mi perfil completo' : 'Crear cuenta para empezar'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <div className="bg-slate-800/30 rounded-xl p-6 border border-purple-500/20">
              <h3 className="text-xl font-bold text-white mb-4">Leaderboard Semanal</h3>
              <div className="space-y-4">
                {[1, 2, 3].map((position) => (
                  <div key={position} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-cyan-400">#{position}</span>
                      <div className="w-8 h-8 rounded-full bg-purple-500/20" />
                      <span className="text-white">Jugador {position}</span>
                    </div>
                    <span className="text-purple-400 font-semibold">1,{position}00 pts</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Comunidad / Social */}
      <div className="py-24 px-4 sm:px-6 lg:px-8 relative bg-black/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Comunidad en Acción
            </h2>
            <p className="text-lg text-slate-400">
              Mirá lo que está pasando en tiempo real
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                text: "JugadorX ganó 3 partidas seguidas en el torneo Neon Cup",
                icon: <Trophy className="w-5 h-5 text-cyan-400" />,
                time: "Hace 5 minutos",
                type: "victoria"
              },
              {
                text: "Team Void entró al top 3 de Arena League",
                icon: <Medal className="w-5 h-5 text-purple-400" />,
                time: "Hace 15 minutos",
                type: "ranking"
              },
              {
                text: "Nueva racha de victorias: 5 wins consecutivas",
                icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
                time: "Hace 30 minutos",
                type: "racha"
              }
            ].map((activity, index) => (
              <motion.div
                key={index}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="group bg-slate-800/30 backdrop-blur-sm rounded-lg p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-slate-700/50">
                    {activity.icon}
                  </div>
                  <div>
                    <p className="text-slate-300 group-hover:text-white transition-colors">{activity.text}</p>
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        activity.type === 'victoria' ? 'bg-cyan-400' :
                        activity.type === 'ranking' ? 'bg-purple-400' :
                        'bg-emerald-400'
                      }`} />
                      <span className="text-slate-400">{activity.time}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              onClick={() => window.open('https://discord.gg/theflakoo', '_blank')}
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
            >
              Unite a la comunidad
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Integración con Stream */}
      <div className="py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-purple-900/50 to-cyan-900/50 rounded-2xl p-8 sm:p-12 border border-purple-500/20"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Conectá tu cuenta de Kick
                </h2>
                <p className="text-lg text-slate-300 mb-6">
                  Usá tus puntos del stream para inscribirte en torneos y conseguí beneficios exclusivos
                </p>
                <div className="flex gap-4">
                  {user ? (
                    <Button 
                      onClick={() => window.location.href = '/api/auth/kick/start'}
                      className="bg-[#20FF86] hover:bg-[#1AE676] text-black"
                    >
                      <Shield className="w-5 h-5 mr-2" />
                      Conectar Kick
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => router.push('/auth')}
                      className="bg-slate-700 hover:bg-slate-600 text-[#20FF86]"
                    >
                      Crear cuenta para conectar
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/30 rounded-lg p-4 text-center">
                  <Shield className="w-8 h-8 text-[#20FF86] mx-auto mb-2" />
                  <div className="text-white">Kick</div>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-4 text-center">
                  <Trophy className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <div className="text-white">Torneos</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Beneficios */}
      <div className="py-24 px-4 sm:px-6 lg:px-8 relative bg-black/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Beneficios Exclusivos
            </h2>
            <p className="text-lg text-slate-400">
              Todo lo que obtenés al ser parte de ClashArena
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="group bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20 hover:border-cyan-500/40 transition-all"
              >
                <div className="mb-6 transform transition-transform group-hover:scale-110">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg group-hover:shadow-cyan-500/20">
                    {benefit.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-cyan-400 transition-colors">
                  {benefit.title}
                </h3>
                <p className="text-slate-400 group-hover:text-slate-300 transition-colors">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Premium Teaser */}
      <div className="py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="inline-block px-6 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/20 text-purple-400 mb-8">
              Próximamente
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-4">
              ClashArena Premium
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Análisis avanzados, scouting profesional y torneos privados. 
              La experiencia definitiva para jugadores competitivos.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-24 px-4 sm:px-6 lg:px-8 relative bg-gradient-to-r from-violet-600 to-fuchsia-600">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20" />
        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-8">
              El futuro de la competencia gamer empieza acá
            </h2>
            {!user ? (
              <Button
                onClick={() => router.push('/auth')}
                size="lg"
                className="bg-white text-purple-600 hover:bg-purple-50 text-lg px-8 py-6"
              >
                Registrate gratis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={() => router.push('/tournaments')}
                size="lg"
                className="bg-white text-purple-600 hover:bg-purple-50 text-lg px-8 py-6"
              >
                Participar ahora
                <Trophy className="w-5 h-5 ml-2" />
              </Button>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}