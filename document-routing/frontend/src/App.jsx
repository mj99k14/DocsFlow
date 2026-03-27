import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import DocumentList from './pages/DocumentList'
import DocumentDetail from './pages/DocumentDetail'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">
            <span className="brand-icon">📄</span>
            <span className="brand-name">DocsFlow</span>
          </div>
          <div className="nav-links">
            <Link to="/">문서 목록</Link>
          </div>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<DocumentList />} />
            <Route path="/documents/:id" element={<DocumentDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
