import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, CheckCircle, Clock, TrendingUp, ArrowUpRight, Search, X } from 'lucide-react'
import { getDocuments, getDepartments, getDocumentsCount } from '../services/api.js'
import { useIsMobile } from '../hooks/useIsMobile'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

const STATUS_BADGE = {
  PENDING:   { label: '대기중',    className: 'bg-gray-100 text-gray-600 hover:bg-gray-100' },
  ANALYZING: { label: '분석중',    className: 'bg-blue-50 text-blue-600 hover:bg-blue-50' },
  COMPLETED: { label: '승인 대기',  className: 'bg-amber-50 text-amber-600 hover:bg-amber-50' },
  APPROVED:  { label: '승인됨',    className: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-50' },
  REJECTED:  { label: '반려',      className: 'bg-red-50 text-red-600 hover:bg-red-50' },
  HELD:      { label: '보류',      className: 'bg-purple-50 text-purple-600 hover:bg-purple-50' },
  FAILED:    { label: '분석 실패', className: 'bg-red-50 text-red-600 hover:bg-red-50' },
}

export default function Dashboard() {
  const isMobile = useIsMobile()
  const [documents, setDocuments] = useState([])
  const [deptMap, setDeptMap] = useState({})
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterDept, setFilterDept] = useState('ALL')
  const [filterType, setFilterType] = useState('ALL')
  const [hideApproved, setHideApproved] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const PAGE_SIZE = 20
  const navigate = useNavigate()
  const pollingRef = useRef(null)

  // 검색어 입력 후 300ms 뒤에 실제 API 검색 실행
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchText])

  const load = async () => {
    try {
      const [docs, countData] = await Promise.all([
        getDocuments(page, PAGE_SIZE, debouncedSearch),
        getDocumentsCount(debouncedSearch),
      ])
      setDocuments(docs)
      setTotal(countData.total)
      setError(null)
    } catch (e) {
      setError('서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인하세요.')
    }
  }

  useEffect(() => {
    load()
    getDepartments().then(depts => {
      const map = {}
      depts.forEach(d => { map[d.id] = d.name })
      setDeptMap(map)
    }).catch(console.error)
    pollingRef.current = setInterval(load, 5000)
    return () => clearInterval(pollingRef.current)
  }, [page, debouncedSearch])

  const filteredDocuments = documents.filter(doc => {
    const deptName = deptMap[doc.analysis?.departments?.[0]?.department_id] || ''
    const matchStatus = filterStatus === 'ALL' || doc.status === filterStatus
    const matchDept = filterDept === 'ALL' || deptName === filterDept
    const matchType = filterType === 'ALL' || doc.file_name.toLowerCase().endsWith(filterType.toLowerCase())
    const matchHide = !hideApproved || doc.status !== 'APPROVED'
    return matchStatus && matchDept && matchType && matchHide
  })

  const analyzed = documents.filter(d => d.analysis?.departments?.[0]?.confidence)
  const avgConf = analyzed.length > 0
    ? Math.round(analyzed.reduce((s, d) => s + (d.analysis.departments[0].confidence * 100), 0) / analyzed.length)
    : 0

  const stats = [
    {
      label: '총 문서',
      value: documents.length,
      icon: FileText,
      iconBg: '#EEF0FF',
      iconColor: '#5E6AD2',
      sub: '전체 업로드된 문서',
    },
    {
      label: '처리 완료',
      value: documents.filter(d => ['APPROVED', 'COMPLETED'].includes(d.status)).length,
      icon: CheckCircle,
      iconBg: '#ECFDF5',
      iconColor: '#059669',
      sub: '승인 또는 완료 상태',
    },
    {
      label: '분석중',
      value: documents.filter(d => d.status === 'ANALYZING').length,
      icon: Clock,
      iconBg: '#FEF3C7',
      iconColor: '#D97706',
      sub: 'AI 처리 진행 중',
    },
    {
      label: '평균 정확도',
      value: `${avgConf}%`,
      icon: TrendingUp,
      iconBg: '#F5F3FF',
      iconColor: '#7C3AED',
      sub: 'AI 분류 신뢰도',
    },
  ]

  return (
    <div style={{ padding: isMobile ? 16 : 32, height: '100%', display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 24 }}>

      {/* 에러 배너 */}
      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#DC2626' }}>
          {error}
        </div>
      )}

      {/* 페이지 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 4 }}>대시보드</h1>
          <p style={{ fontSize: 14, color: '#6B7280' }}>업로드된 문서의 AI 분류 현황을 확인하세요</p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 16 }}>
        {stats.map(({ label, value, icon: Icon, iconBg, iconColor, sub }) => (
          <Card key={label} style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={22} color={iconColor} />
              </div>
            </div>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginTop: 6 }}>{label}</p>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>{sub}</p>
          </Card>
        ))}
      </div>

      {/* 문서 테이블 */}
      <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>업로드된 문서</h3>
              <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>AI가 자동으로 분류한 문서 목록</p>
            </div>
            <span style={{ fontSize: 13, color: '#9CA3AF' }}>{filteredDocuments.length}/{documents.length}건</span>
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: isMobile ? 'auto' : 'visible', flexWrap: isMobile ? 'nowrap' : 'wrap', paddingBottom: isMobile ? 4 : 0 }}>
            {/* 검색 */}
            <div style={{ position: 'relative', flex: 1, minWidth: 160, maxWidth: isMobile ? 200 : 260 }}>
              <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder="파일명 검색..."
                style={{ width: '100%', boxSizing: 'border-box', height: 34, paddingLeft: 32, paddingRight: searchText ? 28 : 12, border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#111827', outline: 'none', background: '#FAFAFA' }}
              />
              {searchText && (
                <button onClick={() => setSearchText('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                  <X size={13} color="#9CA3AF" />
                </button>
              )}
            </div>
            {/* 상태 필터 */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{ height: 34, padding: '0 10px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#374151', background: '#FAFAFA', cursor: 'pointer', outline: 'none' }}
            >
              <option value="ALL">전체 상태</option>
              <option value="PENDING">대기중</option>
              <option value="ANALYZING">분석중</option>
              <option value="COMPLETED">완료</option>
              <option value="APPROVED">승인됨</option>
              <option value="REJECTED">반려</option>
              <option value="HELD">보류</option>
            </select>
            {/* 파일 형식 필터 */}
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              style={{ height: 34, padding: '0 10px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#374151', background: '#FAFAFA', cursor: 'pointer', outline: 'none' }}
            >
              <option value="ALL">전체 형식</option>
              <option value=".pdf">PDF</option>
              <option value=".docx">DOCX</option>
              <option value=".pptx">PPTX</option>
              <option value=".txt">TXT</option>
            </select>
            {/* 부서 필터 */}
            <select
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
              style={{ height: 34, padding: '0 10px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#374151', background: '#FAFAFA', cursor: 'pointer', outline: 'none' }}
            >
              <option value="ALL">전체 부서</option>
              {Object.values(deptMap).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            {/* 승인 완료 숨김 토글 */}
            <button
              onClick={() => setHideApproved(v => !v)}
              style={{
                height: 34, padding: '0 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                border: `1px solid ${hideApproved ? '#5E6AD2' : '#E5E7EB'}`,
                background: hideApproved ? '#EEF0FF' : '#FAFAFA',
                color: hideApproved ? '#5E6AD2' : '#6B7280',
                fontWeight: hideApproved ? 600 : 400,
                whiteSpace: 'nowrap',
              }}
            >
              {hideApproved ? '✓ 승인 완료 숨김' : '승인 완료 숨김'}
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <Table>
            <TableHeader>
              <TableRow style={{ background: '#FAFAFA' }}>
                <TableHead style={{ color: '#6B7280', fontSize: 12, fontWeight: 600, paddingLeft: isMobile ? 12 : 24 }}>파일명</TableHead>
                {!isMobile && <TableHead style={{ color: '#6B7280', fontSize: 12, fontWeight: 600 }}>업로드 날짜</TableHead>}
                {!isMobile && <TableHead style={{ color: '#6B7280', fontSize: 12, fontWeight: 600 }}>AI 추천 부서</TableHead>}
                <TableHead style={{ color: '#6B7280', fontSize: 12, fontWeight: 600 }}>처리 상태</TableHead>
                {!isMobile && <TableHead style={{ color: '#6B7280', fontSize: 12, fontWeight: 600, textAlign: 'right', paddingRight: 24 }}>작업</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} style={{ textAlign: 'center', padding: '64px 0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={24} color="#D1D5DB" />
                      </div>
                      <p style={{ fontSize: 14, color: '#9CA3AF', fontWeight: 500 }}>업로드된 문서가 없습니다</p>
                      <p style={{ fontSize: 13, color: '#D1D5DB' }}>PDF 파일을 업로드하면 AI가 자동으로 분류합니다</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocuments.map(doc => {
                  const badge = STATUS_BADGE[doc.status] || STATUS_BADGE.PENDING
                  const deptName = deptMap[doc.analysis?.departments?.[0]?.department_id]
                  return (
                    <TableRow
                      key={doc.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/document/${doc.id}`)}
                    >
                      <TableCell style={{ paddingLeft: isMobile ? 12 : 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EEF0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FileText size={15} color="#5E6AD2" />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#111827', maxWidth: isMobile ? 140 : 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {doc.file_name}
                          </span>
                        </div>
                      </TableCell>
                      {!isMobile && (
                        <TableCell style={{ fontSize: 13, color: '#6B7280' }}>
                          {new Date(doc.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
                        </TableCell>
                      )}
                      {!isMobile && (
                        <TableCell>
                          {deptName ? (
                            <Badge variant="outline" style={{ background: '#F0F4FF', border: '1px solid #C7D2FE', color: '#4F46E5', fontSize: 12 }}>
                              {deptName}
                            </Badge>
                          ) : (
                            <span style={{ fontSize: 13, color: '#D1D5DB' }}>분석 중</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge className={badge.className} style={{ fontSize: 12 }}>{badge.label}</Badge>
                      </TableCell>
                      {!isMobile && (
                        <TableCell style={{ textAlign: 'right', paddingRight: 24 }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-gray-500 hover:text-gray-900"
                            onClick={e => { e.stopPropagation(); navigate(`/document/${doc.id}`) }}
                          >
                            상세 보기
                            <ArrowUpRight size={13} />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
          {/* 페이지네이션 */}
          {total > PAGE_SIZE && (
            <div style={{ padding: '12px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontSize: 13, color: '#9CA3AF' }}>
                총 {total}건 중 {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)}건
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  이전
                </Button>
                <span style={{ fontSize: 13, color: '#374151', padding: '0 8px', lineHeight: '32px' }}>
                  {page} / {Math.ceil(total / PAGE_SIZE)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= Math.ceil(total / PAGE_SIZE)}
                  onClick={() => setPage(p => p + 1)}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
