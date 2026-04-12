import { useState, useEffect } from 'react'
import { MessageSquare, Building2, Edit2, Check, X, Plus, ShieldCheck, Sparkles, BarChart2, Trash2 } from 'lucide-react'
import { getDepartments, updateDepartment, createDepartment, deleteDepartment, verifyAdminPin, getAdminSettings, updateAdminSettings, getAdminStats, exportApprovals } from '../services/api.js'
import { toast } from 'sonner'

const SECTION_ICONS = {
  slack: { bg: '#EEF0FF', color: '#5E6AD2', Icon: MessageSquare },
  dept:  { bg: '#EFF6FF', color: '#3B82F6', Icon: Building2 },
  ai:    { bg: '#FDF4FF', color: '#9333EA', Icon: Sparkles },
  stats: { bg: '#FFF7ED', color: '#EA580C', Icon: BarChart2 },
}

function SectionHeader({ type, title, desc }) {
  const { bg, color, Icon } = SECTION_ICONS[type]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={18} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{title}</div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{desc}</div>
      </div>
    </div>
  )
}

function Card({ children, style }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #EBEBEB',
      borderRadius: 12,
      padding: '20px 24px',
      ...style,
    }}>
      {children}
    </div>
  )
}


function StyledInput({ value, onChange, placeholder, style, autoFocus, onKeyDown }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      onKeyDown={onKeyDown}
      style={{
        height: 36, padding: '0 12px',
        border: '1px solid #EBEBEB', borderRadius: 8,
        fontSize: 13, color: '#111827', outline: 'none',
        width: '100%', boxSizing: 'border-box',
        background: '#FAFAFA',
        transition: 'border-color 0.15s',
        ...style,
      }}
      onFocus={e => e.target.style.borderColor = '#5E6AD2'}
      onBlur={e => e.target.style.borderColor = '#EBEBEB'}
    />
  )
}


export default function Settings() {
  const [adminVerified, setAdminVerified] = useState(false)
  const [pin, setPin] = useState('')
  const [verifiedPin, setVerifiedPin] = useState('')
  const [pinLoading, setPinLoading] = useState(false)
  const [departments, setDepartments] = useState([])
  const [editingIndex, setEditingIndex] = useState(null)
  const [addingDept, setAddingDept] = useState(false)
  const [newDept, setNewDept] = useState({ name: '', slack_channel: '', webhook_url: '' })
  const [threshold, setThreshold] = useState(0)
  const [thresholdSaving, setThresholdSaving] = useState(false)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getDepartments().then(setDepartments).catch(console.error)
  }, [])

  useEffect(() => {
    if (!adminVerified || !verifiedPin) return
    getAdminSettings(verifiedPin).then(s => setThreshold(Math.round(s.confidence_threshold * 100))).catch(console.error)
    getAdminStats(verifiedPin).then(setStats).catch(console.error)
  }, [adminVerified, verifiedPin])

  const handleSaveThreshold = async () => {
    setThresholdSaving(true)
    try {
      await updateAdminSettings({ confidence_threshold: threshold / 100 }, verifiedPin)
      toast.success('신뢰도 임계값이 저장되었습니다!')
    } catch {
      toast.error('저장 실패')
    } finally {
      setThresholdSaving(false)
    }
  }

  const handleVerifyPin = async () => {
    if (!pin.trim()) return
    setPinLoading(true)
    try {
      await verifyAdminPin(pin)
      setVerifiedPin(pin)
      setAdminVerified(true)
      toast.success('관리자 인증 완료!')
    } catch {
      toast.error('PIN이 올바르지 않습니다')
    } finally {
      setPinLoading(false)
    }
  }

  if (!adminVerified) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          background: '#fff', borderRadius: 16, padding: 36, width: 340,
          border: '1px solid #EBEBEB', boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          textAlign: 'center',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: '#EEF0FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <ShieldCheck size={22} color="#5E6AD2" />
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 6 }}>관리자 인증</p>
          <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 24 }}>설정 페이지는 관리자만 접근할 수 있습니다</p>
          <input
            autoFocus
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleVerifyPin()}
            placeholder="PIN 입력"
            style={{
              width: '100%', height: 40, padding: '0 12px',
              border: '1px solid #EBEBEB', borderRadius: 8,
              fontSize: 14, color: '#111827', outline: 'none',
              boxSizing: 'border-box', marginBottom: 12, textAlign: 'center',
              letterSpacing: '0.2em',
            }}
          />
          <button
            onClick={handleVerifyPin}
            disabled={!pin.trim() || pinLoading}
            style={{
              width: '100%', height: 40, border: 'none', borderRadius: 8,
              background: pin.trim() ? '#5E6AD2' : '#E5E7EB',
              color: pin.trim() ? '#fff' : '#9CA3AF',
              cursor: pin.trim() ? 'pointer' : 'not-allowed',
              fontSize: 14, fontWeight: 600,
            }}
          >
            {pinLoading ? '확인 중...' : '확인'}
          </button>
        </div>
      </div>
    )
  }

  const handleFieldChange = (index, field, value) => {
    const updated = [...departments]
    updated[index][field] = value
    setDepartments(updated)
  }

  const handleSaveEdit = async (dept) => {
    try {
      const updated = await updateDepartment(dept.id, {
        slack_channel: dept.slack_channel,
        webhook_url: dept.webhook_url,
      }, verifiedPin)
      setDepartments(prev => prev.map(d => d.id === updated.id ? updated : d))
      setEditingIndex(null)
      toast.success('부서 정보가 업데이트되었습니다!')
    } catch (e) {
      toast.error('저장 실패: ' + e.message)
    }
  }

  const handleDeleteDept = async (dept) => {
    if (!window.confirm(`"${dept.name}" 부서를 삭제하시겠습니까?`)) return
    try {
      await deleteDepartment(dept.id, verifiedPin)
      setDepartments(prev => prev.filter(d => d.id !== dept.id))
      toast.success('부서가 삭제되었습니다.')
    } catch (e) {
      toast.error('삭제 실패: ' + e.message)
    }
  }

  const handleAddDept = async () => {
    if (!newDept.name.trim()) return
    try {
      const created = await createDepartment(newDept, verifiedPin)
      setDepartments(prev => [...prev, created])
      setNewDept({ name: '', slack_channel: '', webhook_url: '' })
      setAddingDept(false)
      toast.success('부서가 추가되었습니다!')
    } catch (e) {
      toast.error('추가 실패: ' + e.message)
    }
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* 페이지 헤더 */}
      <div style={{ marginBottom: 4 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>설정</h1>
        <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>Slack 연동 및 부서 채널을 관리하세요</p>
      </div>

      {/* Slack 연동 */}
      <Card>
        <SectionHeader type="slack" title="Slack 연동" desc="워크스페이스와 연결하여 알림을 받으세요" />
        <div style={{ padding: '12px 16px', background: '#F0F4FF', borderRadius: 8, border: '1px solid #E0E7FF' }}>
          <p style={{ fontSize: 13, color: '#4338CA' }}>
            각 부서의 Webhook URL은 아래 <strong>부서 관리</strong> 테이블에서 부서별로 설정하세요.
          </p>
        </div>
      </Card>

      {/* 부서 관리 */}
      <Card>
        <SectionHeader type="dept" title="부서 관리" desc="각 부서의 Slack 채널을 설정하세요" />

        <div style={{ border: '1px solid #F3F4F6', borderRadius: 8, overflow: 'hidden' }}>
          {/* 테이블 헤더 */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 110px',
            background: '#FAFAFA', padding: '8px 16px',
            borderBottom: '1px solid #F3F4F6',
          }}>
            {['부서명', 'Slack 채널', 'Webhook URL', ''].map((h, i) => (
              <span key={i} style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
            ))}
          </div>

          {/* 부서 행 */}
          {departments.map((dept, index) => (
            <div
              key={dept.id}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 110px',
                alignItems: 'center', padding: '10px 16px',
                borderBottom: index < departments.length - 1 ? '1px solid #F9FAFB' : 'none',
                background: editingIndex === index ? '#FAFBFF' : '#fff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#5E6AD2', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{dept.name}</span>
              </div>

              <div>
                {editingIndex === index ? (
                  <StyledInput
                    value={dept.slack_channel || ''}
                    onChange={e => handleFieldChange(index, 'slack_channel', e.target.value)}
                    placeholder="#channel-name"
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveEdit(dept)
                      if (e.key === 'Escape') setEditingIndex(null)
                    }}
                  />
                ) : (
                  <span style={{
                    fontSize: 12, fontFamily: 'monospace',
                    background: dept.slack_channel ? '#EEF0FF' : '#F3F4F6',
                    color: dept.slack_channel ? '#5E6AD2' : '#9CA3AF',
                    padding: '3px 8px', borderRadius: 5,
                  }}>
                    {dept.slack_channel || '미설정'}
                  </span>
                )}
              </div>

              <div>
                {editingIndex === index ? (
                  <StyledInput
                    value={dept.webhook_url || ''}
                    onChange={e => handleFieldChange(index, 'webhook_url', e.target.value)}
                    placeholder="https://hooks.slack.com/..."
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveEdit(dept)
                      if (e.key === 'Escape') setEditingIndex(null)
                    }}
                  />
                ) : (
                  <span style={{
                    fontSize: 12, fontFamily: 'monospace',
                    background: dept.webhook_url ? '#ECFDF5' : '#F3F4F6',
                    color: dept.webhook_url ? '#059669' : '#9CA3AF',
                    padding: '3px 8px', borderRadius: 5,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    display: 'block', maxWidth: '90%',
                  }}>
                    {dept.webhook_url ? '설정됨' : '미설정'}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                {editingIndex === index ? (
                  <>
                    <button
                      onClick={() => handleSaveEdit(dept)}
                      style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: '#5E6AD2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Check size={13} color="#fff" />
                    </button>
                    <button
                      onClick={() => setEditingIndex(null)}
                      style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #EBEBEB', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <X size={13} color="#6B7280" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setEditingIndex(index)}
                      style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #EBEBEB', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Edit2 size={13} color="#6B7280" />
                    </button>
                    <button
                      onClick={() => handleDeleteDept(dept)}
                      style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #FECACA', background: '#FFF5F5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Trash2 size={13} color="#DC2626" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}

          {/* 새 부서 추가 행 */}
          {addingDept && (
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 80px',
              alignItems: 'center', padding: '10px 16px',
              borderTop: '1px solid #EEF0FF', background: '#FAFBFF',
            }}>
              <StyledInput
                value={newDept.name}
                onChange={e => setNewDept(prev => ({ ...prev, name: e.target.value }))}
                placeholder="부서명"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleAddDept(); if (e.key === 'Escape') setAddingDept(false) }}
              />
              <div style={{ paddingLeft: 8 }}>
                <StyledInput
                  value={newDept.slack_channel}
                  onChange={e => setNewDept(prev => ({ ...prev, slack_channel: e.target.value }))}
                  placeholder="#channel-name"
                  onKeyDown={e => { if (e.key === 'Enter') handleAddDept(); if (e.key === 'Escape') setAddingDept(false) }}
                />
              </div>
              <div style={{ paddingLeft: 8 }}>
                <StyledInput
                  value={newDept.webhook_url}
                  onChange={e => setNewDept(prev => ({ ...prev, webhook_url: e.target.value }))}
                  placeholder="https://hooks.slack.com/..."
                  onKeyDown={e => { if (e.key === 'Enter') handleAddDept(); if (e.key === 'Escape') setAddingDept(false) }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                <button
                  onClick={handleAddDept}
                  style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: '#5E6AD2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Check size={13} color="#fff" />
                </button>
                <button
                  onClick={() => { setAddingDept(false); setNewDept({ name: '', slack_channel: '' }) }}
                  style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #EBEBEB', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={13} color="#6B7280" />
                </button>
              </div>
            </div>
          )}
        </div>

        {!addingDept && (
          <button
            onClick={() => setAddingDept(true)}
            style={{
              marginTop: 10, width: '100%', height: 34,
              border: '1px dashed #D1D5DB', borderRadius: 8,
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontSize: 13, color: '#6B7280', fontWeight: 500,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#5E6AD2'; e.currentTarget.style.color = '#5E6AD2' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.color = '#6B7280' }}
          >
            <Plus size={14} />
            새 부서 추가
          </button>
        )}
      </Card>

      {/* AI 설정 */}
      <Card>
        <SectionHeader type="ai" title="AI 설정" desc="신뢰도 임계값 미만이면 관리자 채널로 전송됩니다" />
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>신뢰도 임계값</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: threshold === 0 ? '#9CA3AF' : '#9333EA' }}>
              {threshold === 0 ? '비활성' : `${threshold}%`}
            </span>
          </div>
          <input
            type="range" min={0} max={100} step={5}
            value={threshold}
            onChange={e => setThreshold(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#9333EA' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>0% (비활성)</span>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>100%</span>
          </div>
        </div>
        {threshold > 0 && (
          <div style={{ padding: '10px 14px', background: '#FDF4FF', borderRadius: 8, marginBottom: 14 }}>
            <p style={{ fontSize: 12, color: '#9333EA' }}>
              신뢰도 <strong>{threshold}%</strong> 미만 문서는 부서 대신 관리자 채널로 전송됩니다
            </p>
          </div>
        )}
        <button
          onClick={handleSaveThreshold}
          disabled={thresholdSaving}
          style={{
            height: 36, padding: '0 20px', border: 'none', borderRadius: 8,
            background: '#9333EA', color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: thresholdSaving ? 'not-allowed' : 'pointer', opacity: thresholdSaving ? 0.7 : 1,
          }}
        >
          {thresholdSaving ? '저장 중...' : '저장'}
        </button>
      </Card>

      {/* 시스템 현황 */}
      <Card>
        <SectionHeader type="stats" title="시스템 현황" desc="문서 처리 통계 (읽기 전용)" />
        {stats ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: '전체 문서', value: stats.total, color: '#111827' },
              { label: '승인', value: stats.approved, color: '#059669' },
              { label: '반려', value: stats.rejected, color: '#DC2626' },
              { label: '보류', value: stats.held, color: '#7C3AED' },
              { label: '처리 대기', value: stats.pending, color: '#5E6AD2' },
              { label: '승인율', value: `${stats.approval_rate}%`, color: '#EA580C' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                padding: '14px 16px', background: '#FAFAFA',
                borderRadius: 10, border: '1px solid #F3F4F6', textAlign: 'center',
              }}>
                <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF', fontSize: 13 }}>
            통계를 불러오는 중...
          </div>
        )}
        <button
          onClick={() => exportApprovals(verifiedPin).catch(() => toast.error('내보내기 실패'))}
          style={{
            marginTop: 16, height: 36, padding: '0 20px', border: '1px solid #E5E7EB',
            borderRadius: 8, background: '#fff', color: '#374151',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}
        >
          ↓ 승인 내역 CSV 다운로드
        </button>
      </Card>

    </div>
  )
}
