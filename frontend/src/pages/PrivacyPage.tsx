/**
 * Privacy Policy Page
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { Logo, Button, Footer } from '../components';

const sections = [
  {
    title: '1. Information We Access',
    content: `When you connect your Reddit account, MoodMirror requests temporary OAuth access to read your public posts and comments. This access is used solely to retrieve your recent Reddit activity for analysis. We access only what Reddit makes available through its public API. We do not access private messages, account credentials, or any non-public data.`,
  },
  {
    title: '2. How We Use Your Data',
    content: `Your Reddit posts and comments are fetched in real-time and processed entirely in-memory. This data is used exclusively to generate your mental health risk report. We do not store, share, sell, or retain your Reddit content after your session ends. Aggregated, anonymised statistics may be used for research purposes only.`,
  },
  {
    title: '3. Data Storage',
    content: `MoodMirror does not store your Reddit posts, comments, or personal content. Only a session token (used to maintain your login) is temporarily held in our Redis cache, and this is automatically deleted when your session expires or you log out. Your Reddit username is hashed and never stored in plain text.`,
  },
  {
    title: '4. Third-Party Services',
    content: `MoodMirror uses Reddit's OAuth 2.0 system for authentication. By connecting your Reddit account, you are subject to Reddit's own Privacy Policy and Terms of Service. MoodMirror does not share data with any other third parties.`,
  },
  {
    title: '5. Cookies and Session Storage',
    content: `We use an HTTP-only session cookie to maintain your authenticated session. This cookie is deleted when you log out or when it expires (within 1 hour by default). We do not use advertising cookies, analytics trackers, or fingerprinting technologies.`,
  },
  {
    title: '6. Children\'s Privacy',
    content: `MoodMirror is not intended for use by individuals under the age of 18. We do not knowingly collect or process data from minors.`,
  },
  {
    title: '7. Security',
    content: `All data in transit is protected by HTTPS encryption. Session tokens are stored in server-side Redis cache with automatic expiry. Access tokens are encrypted before any temporary handling.`,
  },
  {
    title: '8. Your Rights',
    content: `Since MoodMirror does not persistently store your personal data, there is no stored record to access, correct, or delete. You can revoke MoodMirror's Reddit access at any time by visiting your Reddit account settings under "Apps" and removing MoodMirror's authorisation.`,
  },
  {
    title: '9. Changes to This Policy',
    content: `This Privacy Policy may be updated from time to time. Changes will be reflected on this page with an updated effective date. Continued use of MoodMirror after changes constitutes acceptance of the revised policy.`,
  },
  {
    title: '10. Contact',
    content: `If you have questions about this Privacy Policy, please use the Contact page to reach the MoodMirror research team.`,
  },
];

export function PrivacyPage() {
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
        <div className="container-narrow max-w-3xl">
          <motion.div className="text-center py-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Shield size={48} className="text-purple-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
            <p className="text-slate-400 text-sm">Effective date: January 2026</p>
          </motion.div>

          <div className="space-y-8">
            {sections.map((section, i) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
              >
                <h2 className="text-lg font-semibold text-white mb-2">{section.title}</h2>
                <p className="text-sm text-slate-400 leading-relaxed">{section.content}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 p-5 glass-card text-center">
            <p className="text-slate-400 text-sm">
              Questions about this policy?{' '}
              <Link to="/contact" className="text-purple-400 hover:text-purple-300 transition-colors">Contact us</Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
