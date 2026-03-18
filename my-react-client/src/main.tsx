import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './index.css'
import Game1 from './game1.tsx'
import Game2 from './game2.tsx'
import Game3 from './game3.tsx'

function MainPage() {
  return (
    <div className="relative w-screen h-screen bg-slate-900 overflow-hidden text-white">
      <p> Hello, World! </p>
      <p> <Link to="/game1"> GAME 1 </Link> </p>
      <p> <Link to="/game2"> CHAT </Link> </p>
      <p> <Link to="/game3"> TIER BATTLE </Link> </p>
    </div>
  )
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path = "/" element = {
          <MainPage />
        }/>
        <Route path = "/game1" element = {
          <Game1 />
        }/>
        <Route path = "/game2" element = {
          <Game2 />
        }/>
        <Route path = "/game3" element = {
          <Game3 />
        }/>
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>
)
