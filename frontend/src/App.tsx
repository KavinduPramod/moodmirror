/**
 * App Component
 * Main application with routing
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage, CallbackPage, DashboardPage, ResultsPage } from './pages';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth/callback" element={<CallbackPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
