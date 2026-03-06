/**
 * App Component
 * Main application with routing
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {
  HomePage, CallbackPage, DashboardPage, ResultsPage,
  AboutPage, ResourcesPage, PrivacyPage, TermsPage,
  ContactPage, NotFoundPage
} from './pages';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth/callback" element={<CallbackPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
