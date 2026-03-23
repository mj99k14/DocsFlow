<template>
  <div class="document-detail">
    <!-- 뒤로가기 -->
    <button class="btn-back" @click="$router.push('/')">
      ← 목록으로
    </button>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>불러오는 중...</p>
    </div>

    <div v-else-if="!document" class="empty">
      <p>문서를 찾을 수 없습니다</p>
    </div>

    <div v-else>
      <!-- 문서 기본 정보 -->
      <div class="detail-header">
        <div class="doc-info">
          <span class="doc-icon">📄</span>
          <div>
            <h1 class="doc-name">{{ document.file_name }}</h1>
            <p class="doc-date">업로드: {{ formatDate(document.created_at) }}</p>
          </div>
        </div>
        <span :class="['status-badge', getStatusClass(document.status)]">
          {{ getStatusText(document.status) }}
        </span>
      </div>

      <!-- AI 분석 결과 -->
    <div v-if="document.analysis" class="analysis-section">
     <h2 class="section-title">🤖 AI 분석 결과</h2>
        <div class="analysis-grid">
            <div class="analysis-card">
            <div class="card-label">문서 유형</div>
            <div class="card-value">{{ document.analysis.document_type }}</div>
            </div>
            <div class="analysis-card">
            <div class="card-label">AI 신뢰도</div>
            <div class="card-value">
                <span :class="getConfidenceClass(getDepartmentConfidence())">
                {{ getConfidenceEmoji(getDepartmentConfidence()) }}
                {{ Math.round(getDepartmentConfidence() * 100) }}%
                </span>
            </div>
            </div>
            <div class="analysis-card full-width">
            <div class="card-label">문서 요약</div>
            <div class="card-value summary">{{ document.analysis.summary }}</div>
            </div>
            <div class="analysis-card full-width">
            <div class="card-label">키워드</div>
            <div class="keywords">
                <span
                v-for="kw in document.analysis.keywords"
                :key="kw"
                class="keyword-tag"
                >
                {{ kw }}
                </span>
            </div>
            </div>
            <div class="analysis-card full-width">
            <div class="card-label">🤖 AI 판단 근거</div>
            <div class="card-value reasoning">{{ document.analysis.reasoning }}</div>
            </div>
        </div>
    </div>

      <!-- 추천 부서 -->
      <div v-if="document.departments && document.departments.length > 0" class="dept-section">
        <h2 class="section-title">🏢 AI 추천 부서</h2>
        <div class="dept-card">
          <div class="dept-name">{{ getDepartmentName() }}</div>
          <div class="dept-confidence">
            신뢰도: {{ Math.round(getDepartmentConfidence() * 100) }}%
          </div>
        </div>
      </div>

      <!-- 승인 이력 -->
      <div class="history-section">
        <h2 class="section-title">📋 승인 이력</h2>
        <div v-if="history.length === 0" class="empty-history">
          아직 승인 이력이 없습니다
        </div>
        <div v-else class="history-list">
          <div
            v-for="item in history"
            :key="item.id"
            :class="['history-item', getActionClass(item.action)]"
          >
            <div class="history-action">{{ getActionText(item.action) }}</div>
            <div class="history-info">
              <span class="history-user">👤 {{ item.approved_by }}</span>
              <span class="history-date">{{ formatDate(item.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

const API_URL = 'http://localhost:8000'

export default {
  name: 'DocumentDetail',
  data() {
    return {
      document: null,
      history:  [],
      loading:  false,
      deptMap:  {},
    }
  },
  mounted() {
    this.loadDocument()
    this.loadDepartments()
    this.loadHistory()
  },
  methods: {
    async loadDocument() {
      this.loading = true
      try {
        const id = this.$route.params.id
        const res = await axios.get(`${API_URL}/documents/${id}`)
        this.document = res.data
      } catch (e) {
        console.error('문서 로드 실패:', e)
      } finally {
        this.loading = false
      }
    },

    async loadDepartments() {
      try {
        const res = await axios.get(`${API_URL}/departments/`)
        this.deptMap = Object.fromEntries(res.data.map(d => [d.id, d.name]))
      } catch (e) {
        console.error('부서 로드 실패:', e)
      }
    },

    async loadHistory() {
      try {
        const id = this.$route.params.id
        const res = await axios.get(`${API_URL}/documents/${id}/history`)
        this.history = res.data
      } catch (e) {
        console.error('이력 로드 실패:', e)
      }
    },

    getDepartmentName() {
      if (!this.document?.departments?.length) return '미확인'
      const deptId = this.document.departments[0].department_id
      return this.deptMap[deptId] || '미확인'
    },

    getDepartmentConfidence() {
      if (!this.document?.departments?.length) return 0
      return this.document.departments[0].confidence || 0
    },

    getConfidenceClass(conf) {
      if (conf >= 0.9) return 'conf-high'
      if (conf >= 0.7) return 'conf-mid'
      return 'conf-low'
    },

    getConfidenceEmoji(conf) {
      if (conf >= 0.9) return '🟢'
      if (conf >= 0.7) return '🟡'
      return '🔴'
    },

    getStatusClass(status) {
      const map = {
        'PENDING':   'status-pending',
        'ANALYZING': 'status-analyzing',
        'COMPLETED': 'status-completed',
        'FAILED':    'status-failed',
        'HELD':      'status-held',
      }
      return map[status] || 'status-pending'
    },

    getStatusText(status) {
      const map = {
        'PENDING':   '⏳ 대기 중',
        'ANALYZING': '🔍 분석 중',
        'COMPLETED': '✅ 완료',
        'FAILED':    '❌ 반려/실패',
        'HELD':      '⏸ 보류',
      }
      return map[status] || status
    },

    getActionClass(action) {
      const map = {
        'APPROVED': 'action-approved',
        'REJECTED': 'action-rejected',
        'HELD':     'action-held',
      }
      return map[action] || ''
    },

    getActionText(action) {
      const map = {
        'APPROVED': '✅ 승인',
        'REJECTED': '❌ 반려',
        'HELD':     '⏸ 보류',
      }
      return map[action] || action
    },

    formatDate(dateStr) {
      const date = new Date(dateStr)
      return date.toLocaleString('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      })
    }
  }
}
</script>

<style scoped>
.btn-back {
  background: none;
  border: none;
  color: #4f8ef7;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 6px;
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

/* 헤더 */
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

.doc-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.doc-icon { font-size: 40px; }

.doc-name {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
}

.doc-date { font-size: 13px; color: #718096; margin-top: 4px; }

.status-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.status-pending   { background: #fef3c7; color: #d97706; }
.status-analyzing { background: #dbeafe; color: #2563eb; }
.status-completed { background: #dcfce7; color: #16a34a; }
.status-failed    { background: #fee2e2; color: #dc2626; }
.status-held      { background: #ede9fe; color: #7c3aed; }

/* 분석 섹션 */
.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 16px;
}

.analysis-section, .dept-section, .history-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
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

.card-value {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
}

.card-value.summary, .card-value.reasoning {
  font-weight: 400;
  line-height: 1.6;
  color: #4a5568;
}

.conf-high { color: #16a34a; }
.conf-mid  { color: #d97706; }
.conf-low  { color: #dc2626; }

.keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.keyword-tag {
  background: #ebf4ff;
  color: #2563eb;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

/* 부서 섹션 */
.dept-card {
  background: #f0fff4;
  border: 1px solid #c6f6d5;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dept-name {
  font-size: 18px;
  font-weight: 700;
  color: #16a34a;
}

.dept-confidence {
  font-size: 14px;
  color: #4a5568;
}

/* 이력 섹션 */
.empty-history {
  color: #a0aec0;
  font-size: 14px;
  padding: 20px 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

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

.history-action {
  font-weight: 600;
  font-size: 14px;
}

.history-info {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #718096;
}
</style>
