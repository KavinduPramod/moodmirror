/**
 * Footer Component
 * Shared footer with navigation links
 */

import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-slate-900/50 backdrop-blur-lg mt-auto">
      <div className="container-narrow py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Logo size="sm" />
            <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-xs">
              AI-powered mental health risk assessment through Reddit activity analysis.
              A research prototype — not a medical tool.
            </p>
          </div>

          {/* App Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">App</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-slate-400 hover:text-purple-400 transition-colors">Home</Link></li>
              <li><Link to="/about" className="text-slate-400 hover:text-purple-400 transition-colors">About</Link></li>
              <li><Link to="/resources" className="text-slate-400 hover:text-purple-400 transition-colors">Resources</Link></li>
              <li><Link to="/contact" className="text-slate-400 hover:text-purple-400 transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy" className="text-slate-400 hover:text-purple-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-slate-400 hover:text-purple-400 transition-colors">Terms of Use</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} MoodMirror. Research prototype. Not for clinical use.
          </p>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            Built with <Heart size={12} className="text-red-400" /> for mental health awareness
          </p>
        </div>
      </div>
    </footer>
  );
}
