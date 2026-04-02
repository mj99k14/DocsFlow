// Dashboard.test.jsx
// 목적: Dashboard.jsx의 문서 필터링 로직을 순수 함수로 추출하여 검증한다.
// useNavigate, shadcn 컴포넌트 등 복잡한 의존성 없이 필터링 로직 자체의 정확성만 테스트한다.

// Dashboard.jsx의 filteredDocuments 로직과 동일한 순수 함수
function filterDocuments(documents, deptMap, searchText, filterStatus, filterDept) {
  return documents.filter(doc => {
    const deptName = deptMap[doc.analysis?.departments?.[0]?.department_id] || ''
    const matchSearch = doc.file_name.toLowerCase().includes(searchText.toLowerCase())
    const matchStatus = filterStatus === 'ALL' || doc.status === filterStatus
    const matchDept = filterDept === 'ALL' || deptName === filterDept
    return matchSearch && matchStatus && matchDept
  })
}

// 테스트용 공통 데이터
const sampleDocs = [
  { id: 1, file_name: 'contract.pdf', status: 'APPROVED', analysis: { departments: [{ department_id: 1 }] } },
  { id: 2, file_name: 'report.pdf',   status: 'COMPLETED', analysis: { departments: [{ department_id: 2 }] } },
  { id: 3, file_name: 'plan.pdf',     status: 'PENDING',   analysis: null },
]
const deptMap = { 1: '법무팀', 2: '재무팀' }

describe('Dashboard 필터링 로직', () => {
  it('검색어 "contract" → id:1 문서만 반환', () => {
    const result = filterDocuments(sampleDocs, deptMap, 'contract', 'ALL', 'ALL')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
  })

  it('검색어 대소문자 무관 "CONTRACT" → id:1 문서 반환', () => {
    const result = filterDocuments(sampleDocs, deptMap, 'CONTRACT', 'ALL', 'ALL')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
  })

  it('검색어 빈 문자열 → 전체 3개 문서 반환', () => {
    const result = filterDocuments(sampleDocs, deptMap, '', 'ALL', 'ALL')
    expect(result).toHaveLength(3)
  })

  it('filterStatus "APPROVED" → id:1 문서만 반환', () => {
    const result = filterDocuments(sampleDocs, deptMap, '', 'APPROVED', 'ALL')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
  })

  it('filterStatus "ALL" → 전체 3개 문서 반환', () => {
    const result = filterDocuments(sampleDocs, deptMap, '', 'ALL', 'ALL')
    expect(result).toHaveLength(3)
  })

  it('filterDept "법무팀" → id:1 문서만 반환', () => {
    const result = filterDocuments(sampleDocs, deptMap, '', 'ALL', '법무팀')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
  })

  it('filterDept "ALL" → 전체 3개 문서 반환', () => {
    const result = filterDocuments(sampleDocs, deptMap, '', 'ALL', 'ALL')
    expect(result).toHaveLength(3)
  })

  it('analysis가 null인 문서(id:3)는 deptName이 빈 문자열로 처리됨', () => {
    // deptName이 빈 문자열이므로, 특정 부서 필터 적용 시 제외된다
    const resultExcluded = filterDocuments(sampleDocs, deptMap, '', 'ALL', '법무팀')
    const ids = resultExcluded.map(d => d.id)
    expect(ids).not.toContain(3)

    // ALL 필터 적용 시에는 포함된다
    const resultAll = filterDocuments(sampleDocs, deptMap, '', 'ALL', 'ALL')
    const idsAll = resultAll.map(d => d.id)
    expect(idsAll).toContain(3)
  })

  it('복합 필터 searchText="report" + filterStatus="COMPLETED" → id:2만 반환', () => {
    const result = filterDocuments(sampleDocs, deptMap, 'report', 'COMPLETED', 'ALL')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(2)
  })
})
