import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './index.css'
import Game1 from './game1.tsx'
import Game2 from './game2.tsx'

function MainPage() {
  return (
    <div className="relative w-screen h-screen bg-slate-900 overflow-hidden text-white">
      <p> Hello, World! </p>
      <Link to="/game1"> GAME 1 </Link>
      <Link to="/game2"> CHAT </Link>
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
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>
)
