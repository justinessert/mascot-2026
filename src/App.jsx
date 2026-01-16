import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

// Page imports
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Leaderboard from './pages/Leaderboard';
import Info from './pages/Info';
import WinnerSelection from './pages/WinnerSelection';
import BracketDisplay from './pages/BracketDisplay';
import FullBracket from './pages/FullBracket';
import BracketView from './pages/BracketView';

import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Main routes */}
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="info" element={<Info />} />

          {/* Bracket routes */}
          <Route path="bracket" element={<Navigate to="/bracket/pick" replace />} />
          <Route path="bracket/pick" element={<WinnerSelection />} />
          <Route path="bracket/view/full" element={<FullBracket />} />
          <Route path="bracket/view/:region" element={<BracketDisplay />} />
          <Route path="bracket/:year/:uuid" element={<BracketView />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
