import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, PauseCircle, Download, Building2, Calendar, TrendingUp, Sparkles, Clock, RefreshCw, Trash2 } from 'lucide-react'
import { getDocument, getDocumentHistory, getDepartments, getFileUrl, retryDocument, deleteDocument } from '../services/api.js'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const STATUS_BADGE = {
  PENDING:   { label: '대기중',    className: 'bg-gray-100 text-gray-600 hover:bg-gray-100' },
  ANALYZING: { label: '분석중',    className: 'bg-blue-50 text-blue-600 hover:bg-blue-50' },
  COMPLETED: { label: '완료',      className: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-50' },
  APPROVED:  { label: '승인됨',    className: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-50' },
  REJECTED:  { label: '반려',      className: 'bg-red-50 text-red-600 hover:bg-red-50' },
  HELD:      { label: '보류',      className: 'bg-purple-50 text-purple-600 hover:bg-purple-50' },
  FAILED:    { label: '분석 실패', className: 'bg-red-50 text-red-600 hover:bg-red-50' },
}

const ACTION_CONFIG = {
  APPROVED: { text: '승인', icon: CheckCircle, color: '#059669', bg: '#ECFDF5' },
  REJECTED: { text: '반려', icon: XCircle,     color: '#DC2626', bg: '#FEF2F2' },
  HELD:     { text: '보류', icon: PauseCircle, color: '#7C3AED', bg: '#F5F3FF' },
}

export default function DocumentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [doc, setDoc] = useState(null)
  const [history, setHistory] = useState([])
  const [deptMap, setDeptMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState(false)
  const [deletePin, setDeletePin] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    Promise.all([getDocument(id), getDocumentHistory(id), getDepartments()])
      .then(([d, h, depts]) => {
        setDoc(d); setHistory(h)
        const map = {}
        depts.forEach(dept => { map[dept.id] = dept.name })
        setDeptMap(map)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteDocument(id, deletePin)
      toast.success('문서가 삭제되었습니다')
      navigate('/')
    } catch (e) {
      const msg = e.response?.data?.detail || '삭제에 실패했습니다'
      toast.error(msg)
      setDeleting(false)
    }
  }

  const handleRetry = async () => {
    setRetrying(true)
    try {
      await retryDocument(id)
      const d = await getDocument(id)
      setDoc(d)
      toast.success('재분석을 시작했습니다')
    } catch (e) {
      const msg = e.response?.data?.detail || '재시도에 실패했습니다'
      toast.error(msg)
    } finally {
      setRetrying(false)
    }
  }

  if (loading) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" />
        <p style={{ fontSize: 14, color: '#9CA3AF' }}>불러오는 중...</p>
      </div>
    </div>
  )

  if (!doc) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 15, color: '#6B7280', marginBottom: 16 }}>문서를 찾을 수 없습니다.</p>
        <Button variant="outline" onClick={() => navigate('/')}>대시보드로 돌아가기</Button>
      </div>
    </div>
  )

  const conf = doc.analysis?.departments?.[0]?.confidence || 0
  const deptId = doc.analysis?.departments?.[0]?.department_id
  const deptName = deptMap[deptId] || '미확인'
  const badge = STATUS_BADGE[doc.status] || STATUS_BADGE.PENDING
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* 상단 헤더 바 */}
      <div style={{
        padding: '16px 32px',
        borderBottom: '1px solid #F3F4F6',
        background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button variant="ghost" size="sm" style={{ gap: 6, color: '#6B7280' }} onClick={() => navigate('/')}>
            <ArrowLeft size={15} />
            뒤로
          </Button>
          <Separator orientation="vertical" style={{ height: 20 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EEF0FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#5E6AD2' }}>PDF</span>
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {doc.file_name}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <Calendar size={11} color="#9CA3AF" />
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                  {new Date(doc.created_at).toLocaleDateString('ko-KR')}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Badge className={badge.className}>{badge.label}</Badge>
          {doc.status === 'FAILED' && (
            doc.retry_count >= 3 ? (
              <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 500 }}>
                최대 재시도 횟수 초과 (3/3)
              </span>
            ) : (
              <Button
                size="sm"
                onClick={handleRetry}
                disabled={retrying}
                style={{ gap: 6, background: '#5E6AD2', color: '#fff', border: 'none' }}
              >
                <RefreshCw size={14} />
                {retrying ? '재시도 중...' : `재시도 (${doc.retry_count}/3)`}
              </Button>
            )
          )}
          <a href={getFileUrl(doc.id)} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" style={{ gap: 6 }}>
              <Download size={14} />
              다운로드
            </Button>
          </a>
          <Button
            variant="outline"
            size="sm"
            style={{ gap: 6, color: '#DC2626', borderColor: '#FECACA' }}
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 size={14} />
            삭제
          </Button>
        </div>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={18} color="#DC2626" />
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>문서 삭제</p>
            </div>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20, lineHeight: 1.6 }}>
              이 문서를 삭제하면 복구할 수 없습니다.<br />관리자 PIN을 입력해 확인하세요.
            </p>
            <input
              type="password"
              placeholder="관리자 PIN"
              value={deletePin}
              onChange={e => setDeletePin(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && deletePin && handleDelete()}
              style={{ width: '100%', boxSizing: 'border-box', height: 38, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, marginBottom: 16, outline: 'none' }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                variant="outline"
                style={{ flex: 1 }}
                onClick={() => { setShowDeleteConfirm(false); setDeletePin('') }}
              >
                취소
              </Button>
              <Button
                disabled={!deletePin || deleting}
                onClick={handleDelete}
                style={{ flex: 1, background: '#DC2626', color: '#fff', border: 'none' }}
              >
                {deleting ? '삭제 중...' : '삭제'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 본문 */}
      <div style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, height: '100%' }}>

          {/* 왼쪽 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* AI 요약 */}
            <Card style={{ padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #5E6AD2, #818CF8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Sparkles size={17} color="#fff" />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>AI 분석 요약</p>
                  <p style={{ fontSize: 12, color: '#9CA3AF' }}>Claude AI가 자동 생성한 요약입니다</p>
                </div>
              </div>

              {doc.analysis ? (
                <>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8 }}>{doc.analysis.summary}</p>

                  {doc.analysis.keywords?.length > 0 && (
                    <div style={{ marginTop: 20 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                        키워드
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {doc.analysis.keywords.map(kw => (
                          <span key={kw} style={{
                            padding: '4px 12px', borderRadius: 99,
                            background: '#EEF0FF', color: '#5E6AD2',
                            fontSize: 12, fontWeight: 500,
                          }}>{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: '32px 0', textAlign: 'center' }}>
                  <div className="spinner" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 13, color: '#9CA3AF' }}>분석이 진행중입니다...</p>
                </div>
              )}
            </Card>

            {/* 판단 근거 */}
            {doc.analysis?.reasoning && (
              <Card style={{ padding: 28 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 }}>AI 판단 근거</p>
                <div style={{
                  background: '#F9FAFB', border: '1px solid #F3F4F6',
                  borderRadius: 12, padding: 20,
                  borderLeft: '3px solid #5E6AD2',
                }}>
                  <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.8 }}>{doc.analysis.reasoning}</p>
                </div>
              </Card>
            )}

            {/* 승인 이력 */}
            <Card style={{ padding: 28 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 20 }}>승인 이력</p>
              {history.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center' }}>
                  <Clock size={28} color="#E5E7EB" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 13, color: '#D1D5DB' }}>아직 승인 이력이 없습니다</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {history.map(item => {
                    const cfg = ACTION_CONFIG[item.action] || ACTION_CONFIG.HELD
                    const Icon = cfg.icon
                    return (
                      <div key={item.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 16px', borderRadius: 10,
                        background: '#FAFAFA', border: '1px solid #F3F4F6',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon size={14} color={cfg.color} />
                          </div>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{cfg.text}</span>
                            <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 8 }}>by {item.approved_by}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                          {new Date(item.created_at).toLocaleString('ko-KR')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* 오른쪽 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* 부서 추천 */}
            {doc.analysis?.departments?.length > 0 && (
              <Card style={{ padding: 28 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 20 }}>추천 부서</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: '#EEF0FF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Building2 size={22} color="#5E6AD2" />
                  </div>
                  <div>
                    <p style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>{deptName}</p>
                    <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{doc.analysis.document_type}</p>
                  </div>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <TrendingUp size={13} color="#9CA3AF" />
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>신뢰도</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{Math.round(conf * 100)}%</span>
                  </div>
                  <div style={{ height: 6, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.round(conf * 100)}%`,
                      height: '100%',
                      background: conf >= 0.8 ? '#059669' : conf >= 0.5 ? '#5E6AD2' : '#F59E0B',
                      borderRadius: 99,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>

                {conf >= 0.9 && (
                  <div style={{ marginTop: 16, padding: '10px 14px', background: '#ECFDF5', borderRadius: 8 }}>
                    <p style={{ fontSize: 12, color: '#059669', fontWeight: 500 }}>✓ 높은 신뢰도로 정확한 분류입니다</p>
                  </div>
                )}
              </Card>
            )}

          </div>
        </div>
      </div>
    </div>

  )
}
