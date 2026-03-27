import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = 'http://localhost:8000'

const STATUS_CLASS = {
  PENDING:   'status-pending',
  ANALYZING: 'status-analyzing',
  COMPLETED: 'status-completed',
  APPROVED:  'status-approved',
  REJECTED:  'status-rejected',
  HELD:      'status-held',
  FAILED:    'status-failed',
}

const STATUS_TEXT = {
  PENDING:   '⏳ 대기 중',
  ANALYZING: '🔍 분석 중',
  COMPLETED: '📋 검토 대기',
  APPROVED:  '✅ 승인',
  REJECTED:  '❌ 반려',
  HELD:      '⏸ 보류',
  FAILED:    '💥 분석 실패',
}

const ACTION_CLASS = {
  APPROVED: 'action-approved',
  REJECTED: 'action-rejected',
  HELD:     'action-held',
}

const ACTION_TEXT = {
  APPROVED: '✅ 승인',
  REJECTED: '❌ 반려',
  HELD:     '⏸ 보류',
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function DocumentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [document, setDocument] = useState(null)
  const [history, setHistory]   = useState([])
  const [deptMap, setDeptMap]   = useState({})
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    loadDocument()
    loadDepartments()
    loadHistory()
  }, [id])

  const loadDocument = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_URL}/documents/${id}`)
      setDocument(res.data)
    } catch (e) {
      console.error('문서 로드 실패:', e)
    } finally {
      setLoading(false)
    }
  }

  const loadDepartments = async () => {
    try {
      const res = await axios.get(`${API_URL}/departments/`)
      const map = Object.fromEntries(res.data.map(d => [d.id, d.name]))
      setDeptMap(map)
    } catch (e) {
      console.error('부서 로드 실패:', e)
    }
  }

  const loadHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/documents/${id}/history`)
      setHistory(res.data)
    } catch (e) {
      console.error('이력 로드 실패:', e)
    }
  }

  const getDepartmentName = () => {
    if (!document?.analysis?.departments?.length) return '미확인'
    const deptId = document.analysis.departments[0].department_id
    return deptMap[deptId] || '미확인'
  }

  const getDepartmentConfidence = () => {
    if (!document?.analysis?.departments?.length) return 0
    return document.analysis.departments[0].confidence || 0
  }

  const getConfidenceEmoji = (conf) => {
    if (conf >= 0.9) return '🟢'
    if (conf >= 0.7) return '🟡'
    return '🔴'
  }

  const getConfidenceClass = (conf) => {
    if (conf >= 0.9) return 'conf-high'
    if (conf >= 0.7) return 'conf-mid'
    return 'conf-low'
  }

  if (loading) return (
    <div className="loading">
      <div className="spinner"></div>
      <p>불러오는 중...</p>
    </div>
  )

  if (!document) return (
    <div className="empty">문서를 찾을 수 없습니다</div>
  )

  const conf = getDepartmentConfidence()

  return (
    <div className="document-detail">
      <button className="btn-back" onClick={() => navigate('/')}>
        ← 목록으로
      </button>

      {/* 문서 기본 정보 */}
      <div className="detail-header">
        <div className="doc-info">
          <span className="doc-icon">📄</span>
          <div>
            <h1 className="doc-name">{document.file_name}</h1>
            <p className="doc-date">업로드: {formatDate(document.created_at)}</p>
          </div>
        </div>
        <span className={`status-badge ${STATUS_CLASS[document.status] || 'status-pending'}`}>
          {STATUS_TEXT[document.status] || document.status}
        </span>
      </div>

      {/* AI 분석 결과 */}
      {document.analysis && (
        <div className="section-card">
          <h2 className="section-title">🤖 AI 분석 결과</h2>
          <div className="analysis-grid">
            <div className="analysis-card">
              <div className="card-label">문서 유형</div>
              <div className="card-value">{document.analysis.document_type}</div>
            </div>
            <div className="analysis-card">
              <div className="card-label">AI 신뢰도</div>
              <div className={`card-value ${getConfidenceClass(conf)}`}>
                {getConfidenceEmoji(conf)} {Math.round(conf * 100)}%
              </div>
            </div>
            <div className="analysis-card full-width">
              <div className="card-label">문서 요약</div>
              <div className="card-value summary">{document.analysis.summary}</div>
            </div>
            <div className="analysis-card full-width">
              <div className="card-label">키워드</div>
              <div className="keywords">
                {document.analysis.keywords?.map(kw => (
                  <span key={kw} className="keyword-tag">{kw}</span>
                ))}
              </div>
            </div>
            <div className="analysis-card full-width">
              <div className="card-label">🤖 AI 판단 근거</div>
              <div className="card-value reasoning">{document.analysis.reasoning}</div>
            </div>
          </div>
        </div>
      )}

      {/* 추천 부서 */}
      {document.analysis?.departments?.length > 0 && (
        <div className="section-card">
          <h2 className="section-title">🏢 AI 추천 부서</h2>
          <div className="dept-card">
            <div className="dept-name">{getDepartmentName()}</div>
            <div className="dept-confidence">
              신뢰도: {Math.round(conf * 100)}%
            </div>
          </div>
        </div>
      )}

      {/* 승인 이력 */}
      <div className="section-card">
        <h2 className="section-title">📋 승인 이력</h2>
        {history.length === 0 ? (
          <div className="empty-history">아직 승인 이력이 없습니다</div>
        ) : (
          <div className="history-list">
            {history.map(item => (
              <div key={item.id} className={`history-item ${ACTION_CLASS[item.action] || ''}`}>
                <div className="history-action">{ACTION_TEXT[item.action] || item.action}</div>
                <div className="history-info">
                  <span className="history-user">👤 {item.approved_by}</span>
                  <span className="history-date">{formatDate(item.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .btn-back {
          background: none;
          border: none;
          color: #4f8ef7;
          font-size: 14px;
          cursor: pointer;
          padding: 0;
          margin-bottom: 24px;
        }
        .btn-back:hover { text-decoration: underline; }
        .loading, .empty {
          text-align: center;
          padding: 60px;
          color: #a0aec0;
        }
        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e2e8f0;
          border-top-color: #4f8ef7;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 12px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .detail-header {
          background: white;
          border-radius: 12px;
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .doc-info { display: flex; align-items: center; gap: 16px; }
        .doc-icon { font-size: 40px; }
        .doc-name { font-size: 20px; font-weight: 700; color: #1a1a2e; }
        .doc-date { font-size: 13px; color: #718096; margin-top: 4px; }
        .status-badge {
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
        }
        .status-pending   { background: #fef3c7; color: #d97706; }
        .status-analyzing { background: #dbeafe; color: #2563eb; }
        .status-completed { background: #e0f2fe; color: #0369a1; }
        .status-approved  { background: #dcfce7; color: #16a34a; }
        .status-rejected  { background: #fee2e2; color: #dc2626; }
        .status-held      { background: #ede9fe; color: #7c3aed; }
        .status-failed    { background: #fce7f3; color: #be185d; }
        .section-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 16px;
        }
        .analysis-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .analysis-card {
          background: #f7fafc;
          border-radius: 8px;
          padding: 16px;
        }
        .analysis-card.full-width { grid-column: 1 / -1; }
        .card-label {
          font-size: 12px;
          font-weight: 600;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        .card-value { font-size: 15px; font-weight: 600; color: #1a1a2e; }
        .card-value.summary, .card-value.reasoning {
          font-weight: 400;
          line-height: 1.6;
          color: #4a5568;
        }
        .conf-high { color: #16a34a; }
        .conf-mid  { color: #d97706; }
        .conf-low  { color: #dc2626; }
        .keywords { display: flex; flex-wrap: wrap; gap: 8px; }
        .keyword-tag {
          background: #ebf4ff;
          color: #2563eb;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
        }
        .dept-card {
          background: #f0fff4;
          border: 1px solid #c6f6d5;
          border-radius: 8px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .dept-name { font-size: 18px; font-weight: 700; color: #16a34a; }
        .dept-confidence { font-size: 14px; color: #4a5568; }
        .empty-history { color: #a0aec0; font-size: 14px; padding: 20px 0; }
        .history-list { display: flex; flex-direction: column; gap: 12px; }
        .history-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
          border-radius: 8px;
          border-left: 4px solid;
        }
        .action-approved { background: #f0fff4; border-left-color: #16a34a; }
        .action-rejected { background: #fff5f5; border-left-color: #dc2626; }
        .action-held     { background: #faf5ff; border-left-color: #7c3aed; }
        .history-action { font-weight: 600; font-size: 14px; }
        .history-info { display: flex; gap: 16px; font-size: 13px; color: #718096; }
      `}</style>
    </div>
  )
}
