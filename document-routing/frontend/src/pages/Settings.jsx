import { useState, useEffect } from 'react'
import { MessageSquare, Bell, Lock, Building2, Edit2, Check, X, Plus } from 'lucide-react'
import { getDepartments, updateDepartment, createDepartment } from '../services/api.js'
import { toast } from 'sonner'

const SECTION_ICONS = {
  slack:    { bg: '#EEF0FF', color: '#5E6AD2', Icon: MessageSquare },
  dept:     { bg: '#EFF6FF', color: '#3B82F6', Icon: Building2 },
  notify:   { bg: '#ECFDF5', color: '#10B981', Icon: Bell },
  security: { bg: '#FEF2F2', color: '#EF4444', Icon: Lock },
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

function ToggleRow({ label, desc, defaultChecked }) {
  const [on, setOn] = useState(defaultChecked ?? false)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{label}</div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{desc}</div>
      </div>
      <button
        onClick={() => setOn(v => !v)}
        style={{
          width: 42, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: on ? '#5E6AD2' : '#E5E7EB',
          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 3,
          left: on ? 21 : 3,
          width: 18, height: 18, borderRadius: '50%',
          background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          transition: 'left 0.2s',
        }} />
      </button>
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: '#F3F4F6', margin: '0 -24px' }} />
}

export default function Settings() {
  const [departments, setDepartments] = useState([])
  const [editingIndex, setEditingIndex] = useState(null)
  const [addingDept, setAddingDept] = useState(false)
  const [newDept, setNewDept] = useState({ name: '', slack_channel: '', webhook_url: '' })

  useEffect(() => {
    getDepartments().then(setDepartments).catch(console.error)
  }, [])

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
      })
      setDepartments(prev => prev.map(d => d.id === updated.id ? updated : d))
      setEditingIndex(null)
      toast.success('부서 정보가 업데이트되었습니다!')
    } catch (e) {
      toast.error('저장 실패: ' + e.message)
    }
  }

  const handleAddDept = async () => {
    if (!newDept.name.trim()) return
    try {
      const created = await createDepartment(newDept)
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
            display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 80px',
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
                display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 80px',
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
                  <button
                    onClick={() => setEditingIndex(index)}
                    style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #EBEBEB', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Edit2 size={13} color="#6B7280" />
                  </button>
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

      {/* 알림 설정 */}
      <Card>
        <SectionHeader type="notify" title="알림 설정" desc="받고 싶은 알림을 선택하세요" />
        <ToggleRow label="문서 업로드 완료" desc="파일 업로드가 완료되면 알림" defaultChecked />
        <Divider />
        <ToggleRow label="AI 분석 완료" desc="문서 분석이 완료되면 알림" defaultChecked />
        <Divider />
        <ToggleRow label="승인 요청" desc="승인이 필요한 문서가 있을 때 알림" />
      </Card>

      {/* 보안 설정 */}
      <Card>
        <SectionHeader type="security" title="보안 설정" desc="데이터 보안 및 접근 제어" />
        <ToggleRow label="2단계 인증" desc="추가 보안 레이어 활성화" />
        <Divider />
        <ToggleRow label="자동 로그아웃" desc="30분 비활성 시 자동 로그아웃" defaultChecked />
      </Card>

    </div>
  )
}
