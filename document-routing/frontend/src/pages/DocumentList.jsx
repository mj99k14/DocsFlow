import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
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

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function DocumentList() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const navigate = useNavigate()
  const pollingRef = useRef(null)

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_URL}/documents/`)
      setDocuments(res.data)
    } catch (e) {
      console.error('문서 목록 로드 실패:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
    pollingRef.current = setInterval(loadDocuments, 5000)
    return () => clearInterval(pollingRef.current)
  }, [])

  const uploadDocument = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)
    try {
      await axios.post(`${API_URL}/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      await loadDocuments()
      alert('✅ 업로드 완료! AI가 분석 중입니다.')
    } catch (e) {
      alert('❌ 업로드 실패: ' + (e.response?.data?.detail || e.message))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const stats = {
    total:     documents.length,
    completed: documents.filter(d => d.status === 'APPROVED').length,
    pending:   documents.filter(d => ['PENDING', 'ANALYZING', 'COMPLETED', 'HELD'].includes(d.status)).length,
    failed:    documents.filter(d => d.status === 'REJECTED' || d.status === 'FAILED').length,
  }

  return (
    <div className="document-list">
      {/* 헤더 */}
      <div className="page-header">
        <div>
          <h1 className="page-title">문서 목록</h1>
          <p className="page-subtitle">AI가 분석한 문서 현황을 확인하세요</p>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={loadDocuments}>
            🔄 새로고침
          </button>
          <label className="btn-upload">
            📤 PDF 업로드
            <input type="file" accept=".pdf" onChange={uploadDocument} hidden />
          </label>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-info">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">전체 문서</div>
          </div>
        </div>
        <div className="stat-card completed">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">승인 완료</div>
          </div>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">처리 중</div>
          </div>
        </div>
        <div className="stat-card failed">
          <div className="stat-icon">❌</div>
          <div className="stat-info">
            <div className="stat-value">{stats.failed}</div>
            <div className="stat-label">반려/실패</div>
          </div>
        </div>
      </div>

      {/* 업로드 중 */}
      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
          <p>📤 업로드 중... AI가 문서를 분석하고 있습니다</p>
        </div>
      )}

      {/* 테이블 */}
      <div className="table-card">
        <div className="table-header">
          <h2>전체 문서</h2>
          <span className="doc-count">{documents.length}건</span>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>불러오는 중...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="empty">
            <p>📭 업로드된 문서가 없습니다</p>
            <p className="empty-sub">PDF 파일을 업로드해보세요</p>
          </div>
        ) : (
          <table className="doc-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>파일명</th>
                <th>상태</th>
                <th>업로드 시간</th>
                <th>상세보기</th>
              </tr>
            </thead>
            <tbody>
              {documents.map(doc => (
                <tr key={doc.id}>
                  <td className="id-cell">#{doc.id}</td>
                  <td className="filename-cell">
                    <span className="file-icon">📄</span>
                    {doc.file_name}
                  </td>
                  <td>
                    <span className={`status-badge ${STATUS_CLASS[doc.status] || 'status-pending'}`}>
                      {STATUS_TEXT[doc.status] || doc.status}
                    </span>
                  </td>
                  <td className="date-cell">{formatDate(doc.created_at)}</td>
                  <td>
                    <button
                      className="btn-detail"
                      onClick={() => navigate(`/documents/${doc.id}`)}
                    >
                      상세보기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 28px;
        }
        .page-title { font-size: 28px; font-weight: 700; color: #1a1a2e; }
        .page-subtitle { font-size: 14px; color: #718096; margin-top: 4px; }
        .header-actions { display: flex; gap: 12px; }
        .btn-refresh, .btn-upload {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-refresh { background: white; border: 1px solid #e2e8f0; color: #4a5568; }
        .btn-refresh:hover { background: #f7fafc; }
        .btn-upload { background: #4f8ef7; border: none; color: white; display: inline-block; }
        .btn-upload:hover { background: #3a7de0; }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }
        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          border-left: 4px solid #4f8ef7;
        }
        .stat-card.completed { border-left-color: #48bb78; }
        .stat-card.pending   { border-left-color: #ed8936; }
        .stat-card.failed    { border-left-color: #fc8181; }
        .stat-icon { font-size: 28px; }
        .stat-value { font-size: 28px; font-weight: 700; color: #1a1a2e; }
        .stat-label { font-size: 13px; color: #718096; margin-top: 2px; }
        .upload-progress {
          background: #ebf8ff;
          border: 1px solid #bee3f8;
          border-radius: 8px;
          padding: 16px 20px;
          margin-bottom: 20px;
          text-align: center;
          color: #2b6cb0;
        }
        .progress-bar {
          height: 4px;
          background: #bee3f8;
          border-radius: 2px;
          margin-bottom: 10px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: #4f8ef7;
          animation: progress 1.5s ease-in-out infinite;
        }
        @keyframes progress {
          0%   { width: 0%; }
          50%  { width: 70%; }
          100% { width: 100%; }
        }
        .table-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          overflow: hidden;
        }
        .table-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .table-header h2 { font-size: 16px; font-weight: 600; }
        .doc-count {
          background: #ebf4ff;
          color: #4f8ef7;
          font-size: 12px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 12px;
        }
        .loading, .empty {
          padding: 60px;
          text-align: center;
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
        .empty-sub { font-size: 13px; margin-top: 8px; }
        .doc-table { width: 100%; border-collapse: collapse; }
        .doc-table th {
          padding: 12px 24px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: #f7fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        .doc-table td {
          padding: 16px 24px;
          border-bottom: 1px solid #f0f0f0;
          font-size: 14px;
        }
        .doc-table tr:hover td { background: #f7fafc; }
        .doc-table tr:last-child td { border-bottom: none; }
        .id-cell   { color: #a0aec0; font-size: 12px; }
        .date-cell { color: #718096; font-size: 13px; }
        .filename-cell { display: flex; align-items: center; gap: 8px; font-weight: 500; }
        .file-icon { font-size: 16px; }
        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        .status-pending   { background: #fef3c7; color: #d97706; }
        .status-analyzing { background: #dbeafe; color: #2563eb; }
        .status-completed { background: #e0f2fe; color: #0369a1; }
        .status-approved  { background: #dcfce7; color: #16a34a; }
        .status-rejected  { background: #fee2e2; color: #dc2626; }
        .status-held      { background: #ede9fe; color: #7c3aed; }
        .status-failed    { background: #fce7f3; color: #be185d; }
        .btn-detail {
          padding: 6px 14px;
          background: #4f8ef7;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-detail:hover { background: #3a7de0; }
      `}</style>
    </div>
  )
}
