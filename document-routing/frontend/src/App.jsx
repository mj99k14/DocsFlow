import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { FileText, LayoutDashboard, Upload, Settings, Bell } from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'
import Dashboard from './pages/Dashboard.jsx'
import DocumentDetail from './pages/DocumentDetail.jsx'
import UploadPage from './pages/Upload.jsx'
import SettingsPage from './pages/Settings.jsx'

const NAV = [
  { path: '/',         label: '대시보드',    icon: LayoutDashboard },
  { path: '/upload',   label: '문서 업로드', icon: Upload },
  { path: '/settings', label: '설정',        icon: Settings },
]

const PAGE_TITLES = { '/': '대시보드', '/upload': '문서 업로드', '/settings': '설정' }

function Sidebar() {
  const location = useLocation()

  return (
    <aside style={{
      width: 220, flexShrink: 0, height: '100%',
      background: '#FAFAFA',
      borderRight: '1px solid #EBEBEB',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* 로고 */}
      <div style={{
        padding: '18px 16px 16px',
        borderBottom: '1px solid #EBEBEB',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'linear-gradient(135deg, #5E6AD2, #818CF8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, boxShadow: '0 2px 8px rgba(94,106,210,0.35)',
        }}>
          <FileText size={16} color="#fff" />
        </div>
        <div>
          <div style={{ color: '#111827', fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em' }}>DocsFlow AI</div>
          <div style={{ color: '#9CA3AF', fontSize: 11, marginTop: 1 }}>문서 분류 시스템</div>
        </div>
      </div>

      {/* 섹션 레이블 */}
      <div style={{ padding: '20px 16px 6px' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#C4C4CF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          메뉴
        </span>
      </div>

      {/* 네비게이션 */}
      <nav style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {NAV.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path
          return (
            <NavLink key={path} to={path} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 10px', borderRadius: 8,
                fontSize: 13, fontWeight: active ? 600 : 500,
                cursor: 'pointer',
                background: active ? '#EEF0FF' : 'transparent',
                color: active ? '#5E6AD2' : '#6B7280',
                transition: 'all 0.15s',
                position: 'relative',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: active ? '#fff' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s',
                }}>
                  <Icon size={15} />
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

function Header() {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] || '문서 상세'

  return (
    <header style={{
      background: '#fff',
      borderBottom: '1px solid #EBEBEB',
      padding: '0 24px',
      height: 52,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{title}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={{
          width: 34, height: 34, borderRadius: 8,
          border: '1px solid #EBEBEB', background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', position: 'relative',
        }}>
          <Bell size={15} color="#6B7280" />
          <span style={{
            position: 'absolute', top: 7, right: 7,
            width: 6, height: 6, borderRadius: '50%',
            background: '#5E6AD2', border: '1.5px solid #fff',
          }} />
        </button>
      </div>
    </header>
  )
}

function Layout() {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#F7F8F9' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Header />
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
