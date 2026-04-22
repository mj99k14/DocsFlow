import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { FileText, LayoutDashboard, Upload, Settings, Bell } from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'
import { useIsMobile } from './hooks/useIsMobile'
import Dashboard from './pages/Dashboard.jsx'
import DocumentDetail from './pages/DocumentDetail.jsx'
import UploadPage from './pages/Upload.jsx'
import SettingsPage from './pages/Settings.jsx'

const NAV = [
  { path: '/',         label: '대시보드',    icon: LayoutDashboard },
  { path: '/upload',   label: '업로드',      icon: Upload },
  { path: '/settings', label: '설정',        icon: Settings },
]

const PAGE_TITLES = { '/': '대시보드', '/upload': '문서 업로드', '/settings': '설정' }

function Sidebar() {
  const location = useLocation()

  return (
    <aside style={{
      width: 'clamp(220px, 16vw, 260px)', flexShrink: 0, height: '100%',
      background: '#FAFAFA',
      borderRight: '1px solid #EBEBEB',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* 로고 */}
      <div style={{
        padding: '20px 18px 18px',
        borderBottom: '1px solid #EBEBEB',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 'clamp(36px, 2.8vw, 42px)', height: 'clamp(36px, 2.8vw, 42px)', borderRadius: 11,
          background: 'linear-gradient(135deg, #5E6AD2, #818CF8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, boxShadow: '0 2px 8px rgba(94,106,210,0.35)',
        }}>
          <FileText size={18} color="#fff" />
        </div>
        <div>
          <div style={{ color: '#111827', fontWeight: 700, fontSize: 'clamp(15px, 1.2vw, 17px)', letterSpacing: '-0.01em' }}>DocsFlow AI</div>
          <div style={{ color: '#9CA3AF', fontSize: 'clamp(12px, 0.85vw, 13px)', marginTop: 2 }}>문서 분류 시스템</div>
        </div>
      </div>

      <div style={{ padding: '20px 18px 6px' }}>
        <span style={{ fontSize: 'clamp(11px, 0.8vw, 12px)', fontWeight: 700, color: '#C4C4CF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          메뉴
        </span>
      </div>

      <nav style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
        {NAV.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path
          return (
            <NavLink key={path} to={path} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 9,
                fontSize: 'clamp(14px, 1.1vw, 16px)', fontWeight: active ? 600 : 500,
                cursor: 'pointer',
                background: active ? '#EEF0FF' : 'transparent',
                color: active ? '#5E6AD2' : '#6B7280',
                transition: 'all 0.15s',
              }}>
                <div style={{
                  width: 'clamp(30px, 2.2vw, 34px)', height: 'clamp(30px, 2.2vw, 34px)', borderRadius: 8,
                  background: active ? '#fff' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s',
                }}>
                  <Icon size={17} />
                </div>
                {label}
                {active && (
                  <div style={{
                    marginLeft: 'auto',
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#5E6AD2',
                  }} />
                )}
              </div>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}

function BottomNav() {
  const location = useLocation()
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 'clamp(64px, 10vw, 76px)', background: '#fff',
      borderTop: '1px solid #EBEBEB',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {NAV.map(({ path, label, icon: Icon }) => {
        const active = location.pathname === path
        return (
          <NavLink key={path} to={path} style={{ textDecoration: 'none', flex: 1 }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              color: active ? '#5E6AD2' : '#9CA3AF',
            }}>
              <Icon size={26} />
              <span style={{ fontSize: 'clamp(12px, 3.5vw, 14px)', fontWeight: active ? 700 : 500 }}>{label}</span>
            </div>
          </NavLink>
        )
      })}
    </nav>
  )
}

function Header() {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] || '문서 상세'

  return (
    <header style={{
      background: '#fff',
      borderBottom: '1px solid #EBEBEB',
      padding: '0 16px',
      height: 'clamp(56px, 8vw, 64px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 'clamp(30px, 7vw, 36px)', height: 'clamp(30px, 7vw, 36px)', borderRadius: 9,
          background: 'linear-gradient(135deg, #5E6AD2, #818CF8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FileText size={16} color="#fff" />
        </div>
        <span style={{ fontSize: 'clamp(16px, 4.5vw, 20px)', fontWeight: 700, color: '#111827' }}>{title}</span>
      </div>
      <button style={{
        width: 'clamp(36px, 8vw, 42px)', height: 'clamp(36px, 8vw, 42px)', borderRadius: 9,
        border: '1px solid #EBEBEB', background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', position: 'relative',
      }}>
        <Bell size={18} color="#6B7280" />
        <span style={{
          position: 'absolute', top: 8, right: 8,
          width: 7, height: 7, borderRadius: '50%',
          background: '#5E6AD2', border: '1.5px solid #fff',
        }} />
      </button>
    </header>
  )
}

function DesktopHeader() {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] || '문서 상세'

  return (
    <header style={{
      background: '#fff',
      borderBottom: '1px solid #EBEBEB',
      padding: '0 28px',
      height: 'clamp(54px, 4vw, 64px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 'clamp(15px, 1.3vw, 18px)', fontWeight: 700, color: '#111827' }}>{title}</span>
      <button style={{
        width: 'clamp(36px, 2.4vw, 42px)', height: 'clamp(36px, 2.4vw, 42px)', borderRadius: 9,
        border: '1px solid #EBEBEB', background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', position: 'relative',
      }}>
        <Bell size={17} color="#6B7280" />
        <span style={{
          position: 'absolute', top: 8, right: 8,
          width: 7, height: 7, borderRadius: '50%',
          background: '#5E6AD2', border: '1.5px solid #fff',
        }} />
      </button>
    </header>
  )
}

function Layout() {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', width: '100vw', background: '#F7F8F9' }}>
        <Header />
        <main style={{ flex: 1, overflowY: 'auto', background: '#F7F8F9', paddingBottom: 'clamp(64px, 10vw, 76px)' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/document/:id" element={<DocumentDetail />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
        <BottomNav />
        <Toaster />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#F7F8F9' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <DesktopHeader />
        <main style={{ flex: 1, overflowY: 'auto', background: '#F7F8F9' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/document/:id" element={<DocumentDetail />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
        <Toaster />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}
