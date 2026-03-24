<template>
  <div class="document-list">
    <!-- 헤더 -->
    <div class="page-header">
      <div>
        <h1 class="page-title">문서 목록</h1>
        <p class="page-subtitle">AI가 분석한 문서 현황을 확인하세요</p>
      </div>
      <div class="header-actions">
        <button class="btn-refresh" @click="loadDocuments">
          🔄 새로고침
        </button>
        <label class="btn-upload">
          📤 PDF 업로드
          <input type="file" accept=".pdf" @change="uploadDocument" hidden />
        </label>
      </div>
    </div>

    <!-- 통계 카드 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📄</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">전체 문서</div>
        </div>
      </div>
      <div class="stat-card completed">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.completed }}</div>
          <div class="stat-label">분석 완료</div>
        </div>
      </div>
      <div class="stat-card pending">
        <div class="stat-icon">⏳</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.pending }}</div>
          <div class="stat-label">처리 중</div>
        </div>
      </div>
      <div class="stat-card failed">
        <div class="stat-icon">❌</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.failed }}</div>
          <div class="stat-label">반려/실패</div>
        </div>
      </div>
    </div>

    <!-- 업로드 중 표시 -->
    <div v-if="uploading" class="upload-progress">
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
      <p>📤 업로드 중... AI가 문서를 분석하고 있습니다</p>
    </div>

    <!-- 문서 테이블 -->
    <div class="table-card">
      <div class="table-header">
        <h2>전체 문서</h2>
        <span class="doc-count">{{ documents.length }}건</span>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>불러오는 중...</p>
      </div>

      <div v-else-if="documents.length === 0" class="empty">
        <p>📭 업로드된 문서가 없습니다</p>
        <p class="empty-sub">PDF 파일을 업로드해보세요</p>
      </div>

      <table v-else class="doc-table">
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
          <tr v-for="doc in documents" :key="doc.id">
            <td class="id-cell">#{{ doc.id }}</td>
            <td class="filename-cell">
              <span class="file-icon">📄</span>
              {{ doc.file_name }}
            </td>
            <td>
              <span :class="['status-badge', getStatusClass(doc.status)]">
                {{ getStatusText(doc.status) }}
              </span>
            </td>
            <td class="date-cell">{{ formatDate(doc.created_at) }}</td>
            <td>
              <button class="btn-detail" @click="$router.push(`/documents/${doc.id}`)">
                상세보기
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

const API_URL = 'http://localhost:8000'

export default {
  name: 'DocumentList',
  data() {
    return {
      documents: [],
      loading: false,
      uploading: false,
      polling: null,
    }
  },
  computed: {
    stats() {
      return {
        total:     this.documents.length,
        completed: this.documents.filter(d => d.status === 'COMPLETED').length,
        pending:   this.documents.filter(d => ['PENDING', 'ANALYZING', 'HELD'].includes(d.status)).length,
        failed:    this.documents.filter(d => d.status === 'FAILED').length,
      }
    }
  },
  mounted() {
    this.loadDocuments()
    // 5초마다 자동 새로고침
    this.polling = setInterval(this.loadDocuments, 5000)
  },
  beforeUnmount() {
    clearInterval(this.polling)
  },
  methods: {
    async loadDocuments() {
      this.loading = true
      try {
        const res = await axios.get(`${API_URL}/documents/`)
        this.documents = res.data
      } catch (e) {
        console.error('문서 목록 로드 실패:', e)
      } finally {
        this.loading = false
      }
    },

    async uploadDocument(event) {
      const file = event.target.files[0]
      if (!file) return

      const formData = new FormData()
      formData.append('file', file)

      this.uploading = true
      try {
        await axios.post(`${API_URL}/documents/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        await this.loadDocuments()
        alert('✅ 업로드 완료! AI가 분석 중입니다.')
      } catch (e) {
        alert('❌ 업로드 실패: ' + (e.response?.data?.detail || e.message))
      } finally {
        this.uploading = false
        event.target.value = ''
      }
    },

    getStatusClass(status) {
      const map = {
        'PENDING':   'status-pending',
        'ANALYZING': 'status-analyzing',
        'COMPLETED': 'status-completed',
        'APPROVED' : 'status-approvrd',
        'REJECTED' : 'status-rehected',
        'FAILED':    'status-failed',
        'HELD':      'status-held',
      }
      return map[status] || 'status-pending'
    },

    getStatusText(status) {
       const map = {
        'PENDING':   '⏳ 대기 중',
        'ANALYZING': '🔍 분석 중',
        'COMPLETED': '📋 검토 대기',
        'APPROVED':  '✅ 승인',     
        'REJECTED':  '❌ 반려',      
        'HELD':      '⏸ 보류',
        'FAILED':    '💥 분석 실패',
    }
      return map[status] || status
    },

    formatDate(dateStr) {
      const date = new Date(dateStr)
      return date.toLocaleString('ko-KR', {
        year:   'numeric',
        month:  '2-digit',
        day:    '2-digit',
        hour:   '2-digit',
        minute: '2-digit',
      })
    }
  }
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
}

.page-subtitle {
  font-size: 14px;
  color: #718096;
  margin-top: 4px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn-refresh, .btn-upload {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh {
  background: white;
  border: 1px solid #e2e8f0;
  color: #4a5568;
}

.btn-refresh:hover { background: #f7fafc; }

.btn-upload {
  background: #4f8ef7;
  border: none;
  color: white;
}

.btn-upload:hover { background: #3a7de0; }

/* 통계 카드 */
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

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
}

.stat-label {
  font-size: 13px;
  color: #718096;
  margin-top: 2px;
}

/* 업로드 프로그레스 */
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

/* 테이블 */
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

.doc-table {
  width: 100%;
  border-collapse: collapse;
}

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

.id-cell    { color: #a0aec0; font-size: 12px; }
.date-cell  { color: #718096; font-size: 13px; }

.filename-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.file-icon { font-size: 16px; }

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-pending   { background: #fef3c7; color: #d97706; }
.status-analyzing { background: #dbeafe; color: #2563eb; }
.status-completed { background: #dcfce7; color: #16a34a; }
.status-failed    { background: #fee2e2; color: #dc2626; }
.status-held      { background: #ede9fe; color: #7c3aed; }

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
</style>
