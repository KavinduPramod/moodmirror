/**
 * About Page
 * Explains MoodMirror, the model, and the mission
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Shield, ArrowRight } from 'lucide-react';
import { Logo, Card, Button, Footer } from '../components';

const team = [
  {
    role: 'Research & Development',
    description: 'MoodMirror was developed as a Final Year Project exploring the intersection of natural language processing and mental health detection using social media data.',
  },
  {
    role: 'AI Model',
    description: 'The core model is a hybrid BERT + BiLSTM architecture trained on 1,500+ real Reddit users, combining deep contextual language understanding with temporal behavioural analysis.',
  },
  {
    role: 'Privacy by Design',
    description: 'From the ground up, MoodMirror was designed to never store personal data. All Reddit content is processed in-memory and discarded immediately after analysis.',
  },
];

const modelFacts = [
  { label: 'Architecture', value: 'BERT + BiLSTM' },
  { label: 'Training Users', value: '1,500+' },
  { label: 'Subreddits Monitored', value: '35+' },
  { label: 'Behavioural Features', value: '8 signals' },
  { label: 'Max Sequence Length', value: '256 tokens' },
  { label: 'Optimiser', value: 'AdamW + Focal Loss' },
];

export function AboutPage() {
  return (
    <div className="bg-animated flex flex-col min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/50 backdrop-blur-lg border-b border-white/5">
        <div className="container-narrow flex justify-between items-center h-16">
          <Logo size="sm" />
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <Link to="/resources" className="hover:text-white transition-colors">Resources</Link>
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
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              About <span className="gradient-text">MoodMirror</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              A research prototype that uses artificial intelligence to surface potential
              mental health indicators from a user's Reddit activity — built responsibly,
              with privacy at its core.
            </p>
          </motion.div>

          {/* Mission Cards */}
          <section className="py-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {team.map((item, index) => (
              <Card key={item.role} hover delay={0.1 * index}>
                <h3 className="text-lg font-semibold text-white mb-3">{item.role}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
              </Card>
            ))}
          </section>

          {/* How the Model Works */}
          <section className="py-10">
            <div className="glass-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <Brain size={28} className="text-purple-400" />
                <h2 className="text-2xl font-bold text-white">How the AI Model Works</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-white mb-3">The Pipeline</h3>
                  <ol className="space-y-3 text-sm text-slate-400">
                    {[
                      'Your Reddit posts and comments are fetched via the Reddit API.',
                      'Text is cleaned, combined, and tokenised using the BERT tokenizer (max 256 tokens).',
                      '8 behavioural signals are extracted: posting frequency, late-night activity, sentiment, pronoun use, and more.',
                      'BERT generates contextual embeddings; a BiLSTM captures temporal patterns with an attention mechanism.',
                      'Text features are fused with behavioural signals and classified by a 3-layer neural network.',
                      'A probability score and confidence level are returned as your risk report.',
                    ].map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-purple-400 font-bold flex-shrink-0">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-3">Model Specifications</h3>
                  <div className="space-y-2">
                    {modelFacts.map((fact) => (
                      <div key={fact.label} className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-sm text-slate-400">{fact.label}</span>
                        <span className="text-sm text-white font-semibold">{fact.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Limitations */}
          <section className="py-10">
            <Card>
              <div className="flex items-start gap-4">
                <Shield size={24} className="text-amber-400 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-xl font-bold text-white mb-3">Important Limitations</h2>
                  <ul className="space-y-2 text-sm text-slate-400">
                    {[
                      'MoodMirror is a research tool, not a clinical diagnostic instrument.',
                      'Reddit activity may not fully represent a person\'s mental state.',
                      'The model was trained on a specific subset of Reddit users and may not generalise universally.',
                      'Results should never replace professional mental health assessment.',
                      'If you are experiencing a crisis, please contact a mental health professional immediately.',
                    ].map((item, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-amber-400 mt-1">⚠</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </section>

          {/* CTA */}
          <div className="text-center py-8">
            <Link to="/">
              <Button size="lg" icon={<ArrowRight size={18} />}>
                Try MoodMirror
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
