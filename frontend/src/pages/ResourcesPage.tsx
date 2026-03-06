/**
 * Mental Health Resources Page
 * Curated list of support lines, websites, and tools
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Globe, MessageSquare, Heart, AlertCircle } from 'lucide-react';
import { Logo, Button, Footer } from '../components';

const crisisLines = [
  { name: '988 Suicide & Crisis Lifeline', detail: 'Call or text 988 (US)', type: 'phone', href: 'tel:988' },
  { name: 'Crisis Text Line', detail: 'Text HOME to 741741 (US)', type: 'text', href: 'sms:741741' },
  { name: 'SAMHSA National Helpline', detail: '1-800-662-4357 (24/7, free, confidential)', type: 'phone', href: 'tel:18006624357' },
  { name: 'International Association for Suicide Prevention', detail: 'Find a crisis centre near you', type: 'web', href: 'https://www.iasp.info/resources/Crisis_Centres/' },
];

const onlineResources = [
  { name: 'Mental Health America', description: 'Screening tools, resources, and advocacy', href: 'https://mhanational.org', category: 'Organisation' },
  { name: 'NAMI (National Alliance on Mental Illness)', description: 'Education, support groups, and helpline', href: 'https://nami.org', category: 'Organisation' },
  { name: '7 Cups', description: 'Free online chat with trained listeners', href: 'https://www.7cups.com', category: 'Peer Support' },
  { name: 'Headspace', description: 'Guided meditation and mindfulness', href: 'https://www.headspace.com', category: 'Wellness App' },
  { name: 'BetterHelp', description: 'Online professional therapy platform', href: 'https://www.betterhelp.com', category: 'Therapy' },
  { name: 'Calm', description: 'Sleep, meditation, and relaxation tools', href: 'https://www.calm.com', category: 'Wellness App' },
];

const selfCare = [
  { tip: 'Maintain a consistent sleep schedule of 7–9 hours per night.' },
  { tip: 'Exercise for at least 30 minutes a day — even a walk counts.' },
  { tip: 'Limit social media consumption if it affects your mood negatively.' },
  { tip: 'Stay connected with friends, family, or community groups.' },
  { tip: 'Practice mindfulness or journaling to process emotions.' },
  { tip: 'Seek professional help early — mental health is health.' },
];

export function ResourcesPage() {
  return (
    <div className="bg-animated flex flex-col min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/50 backdrop-blur-lg border-b border-white/5">
        <div className="container-narrow flex justify-between items-center h-16">
          <Logo size="sm" />
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
          </nav>
          <Link to="/">
            <Button variant="secondary" size="sm">Back to Home</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 pt-24 pb-16">
        <div className="container-narrow">
          {/* Hero */}
          <motion.div className="text-center py-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Heart size={48} className="text-red-400 mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Mental Health Resources</h1>
            <p className="text-lg text-slate-400 max-w-xl mx-auto">
              You are not alone. Help is available 24/7. Below is a curated list of trusted
              support lines, organisations, and tools.
            </p>
          </motion.div>

          {/* Crisis Banner */}
          <div className="mb-10 p-5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-4">
            <AlertCircle size={24} className="text-red-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-red-400 mb-1">In immediate crisis?</h3>
              <p className="text-sm text-slate-300">
                Call <a href="tel:988" className="underline text-red-300 hover:text-red-200">988</a> (Suicide & Crisis Lifeline) or go to your nearest emergency room.
                You can also text HOME to <strong>741741</strong>.
              </p>
            </div>
          </div>

          {/* Crisis Lines */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
              <Phone size={20} className="text-purple-400" /> Crisis Support Lines
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {crisisLines.map((line, i) => (
                <motion.a
                  key={line.name}
                  href={line.href}
                  target={line.type === 'web' ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="glass-card glass-card-hover p-5 block"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <div className="flex items-center gap-3 mb-1">
                    {line.type === 'phone' && <Phone size={16} className="text-green-400" />}
                    {line.type === 'text' && <MessageSquare size={16} className="text-blue-400" />}
                    {line.type === 'web' && <Globe size={16} className="text-purple-400" />}
                    <span className="font-semibold text-white">{line.name}</span>
                  </div>
                  <p className="text-sm text-slate-400 ml-7">{line.detail}</p>
                </motion.a>
              ))}
            </div>
          </section>

          {/* Online Resources */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
              <Globe size={20} className="text-purple-400" /> Online Resources & Support
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {onlineResources.map((res, i) => (
                <motion.a
                  key={res.name}
                  href={res.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card glass-card-hover p-5 block"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-white">{res.name}</span>
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">{res.category}</span>
                  </div>
                  <p className="text-sm text-slate-400">{res.description}</p>
                </motion.a>
              ))}
            </div>
          </section>

          {/* Self Care Tips */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
              <Heart size={20} className="text-red-400" /> Self-Care Tips
            </h2>
            <div className="glass-card p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {selfCare.map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="text-green-400 mt-1 flex-shrink-0">✓</span>
                  <p className="text-sm text-slate-300">{item.tip}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
