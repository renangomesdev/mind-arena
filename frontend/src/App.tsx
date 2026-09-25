import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CreateQuiz from './pages/CreateQuiz';
import GameHost from './pages/GameHost';
import GamePlayer from './pages/GamePlayer';
import logo from './assets/logo.jpg';
import bgImage from './assets/bg-colosseum.jpg';
import './index.css';

function App() {
  return (
    <Router>
      <div className="fixed inset-0 z-[-1] overflow-hidden">
        <div className="absolute inset-0 bg-[#0f0e0c]/70 z-10" />
        <img src={bgImage} alt="" className="w-full h-full object-cover blur-sm opacity-50 scale-105" />
      </div>

      <div className="min-h-screen flex flex-col relative z-0">
        <header className="p-3 flex justify-center items-center bg-[#1a1816]/60 backdrop-blur-lg sticky top-0 z-50 border-b border-[#33302b]/50">
          <a href="/" className="flex items-center gap-3 group">
            <img
              src={logo}
              alt="Mind Arena Logo"
              className="h-12 rounded-xl object-contain shadow-lg border border-arena-700/30 group-hover:shadow-arena-500/20 transition-shadow duration-300"
            />
            <span className="text-xl font-black tracking-wider text-gradient-gold hidden sm:block">
              MIND ARENA
            </span>
          </a>
        </header>
        <main className="flex-1 w-full p-4 max-w-5xl mx-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create-quiz" element={<CreateQuiz />} />
            <Route path="/host/:code" element={<GameHost />} />
            <Route path="/play/:code" element={<GamePlayer />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
