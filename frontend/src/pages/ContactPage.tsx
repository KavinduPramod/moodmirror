/**
 * Contact Page
 * Contact form that submits to backend (Resend)
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { Logo, Button, Card, Footer } from '../components';
import { API_BASE_URL } from '../config/api';

type Status = 'idle' | 'sending' | 'success' | 'error';

export function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to send message.');
      }

      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err: Error | unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="bg-animated flex flex-col min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/50 backdrop-blur-lg border-b border-white/5">
        <div className="container-narrow flex justify-between items-center h-16">
          <Logo size="sm" />
          <Link to="/">
            <Button variant="secondary" size="sm">Back to Home</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 pt-24 pb-16">
        <div className="container-narrow">
          <motion.div className="text-center py-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Mail size={48} className="text-purple-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Contact Us</h1>
            <p className="text-slate-400 max-w-lg mx-auto">
              Have a question, found a bug, or want to learn more about the research?
              We'd love to hear from you.
            </p>
          </motion.div>

          <div className="max-w-2xl mx-auto">
            {status === 'success' ? (
              <motion.div
                className="glass-card p-10 text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <CheckCircle size={64} className="text-green-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Message Sent!</h2>
                <p className="text-slate-400 mb-6">Thank you for reaching out. We'll get back to you as soon as possible.</p>
                <Button onClick={() => setStatus('idle')} variant="secondary">Send Another</Button>
              </motion.div>
            ) : (
              <Card padding="lg">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name + Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1" htmlFor="name">Your Name</label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Jane Doe"
                        className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1" htmlFor="email">Email Address</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="jane@example.com"
                        className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-1" htmlFor="subject">Subject</label>
                    <select
                      id="subject"
                      name="subject"
                      required
                      value={form.subject}
                      onChange={handleChange}
                      className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="">Select a subject...</option>
                      <option value="General Enquiry">General Enquiry</option>
                      <option value="Bug Report">Bug Report</option>
                      <option value="Research Collaboration">Research Collaboration</option>
                      <option value="Privacy Concern">Privacy Concern</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-1" htmlFor="message">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Write your message here..."
                      className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                    />
                  </div>

                  {/* Error */}
                  {status === 'error' && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                      <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                      <p className="text-sm text-red-400">{errorMsg}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    fullWidth
                    isLoading={status === 'sending'}
                    icon={<Send size={16} />}
                  >
                    {status === 'sending' ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </Card>
            )}

            {/* Crisis note */}
            <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
              <p className="text-sm text-slate-400">
                🆘 If you are in crisis, do not use this form. Call{' '}
                <a href="tel:988" className="text-red-400 font-semibold hover:underline">988</a>{' '}
                or visit our{' '}
                <Link to="/resources" className="text-purple-400 hover:underline">Resources page</Link>.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
