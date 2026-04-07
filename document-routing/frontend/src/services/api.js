import axios from 'axios'

const API_URL = 'http://localhost:8000'

export const getDocuments = (page = 1, size = 20) =>
  axios.get(`${API_URL}/documents/`, { params: { page, size } }).then(r => r.data)
export const getDocument = (id) => axios.get(`${API_URL}/documents/${id}`).then(r => r.data)
export const getDocumentHistory = (id) => axios.get(`${API_URL}/documents/${id}/history`).then(r => r.data)
export const getDepartments = () => axios.get(`${API_URL}/departments/`).then(r => r.data)

export const verifyAdminPin = (pin) =>
  axios.post(`${API_URL}/admin/verify`, { pin }).then(r => r.data)

export const getAdminSettings = (pin) =>
  axios.get(`${API_URL}/admin/settings`, { headers: { 'x-admin-pin': pin } }).then(r => r.data)

export const updateAdminSettings = (data, pin) =>
  axios.patch(`${API_URL}/admin/settings`, data, { headers: { 'x-admin-pin': pin } }).then(r => r.data)

export const getAdminStats = (pin) =>
  axios.get(`${API_URL}/admin/stats`, { headers: { 'x-admin-pin': pin } }).then(r => r.data)

export const exportApprovals = (pin) =>
  axios.get(`${API_URL}/admin/export/approvals`, {
    headers: { 'x-admin-pin': pin },
    responseType: 'blob',
  }).then(r => {
    const url = URL.createObjectURL(r.data)
    const a = document.createElement('a')
    a.href = url
    a.download = 'approval_history.csv'
    a.click()
    URL.revokeObjectURL(url)
  })

export const updateDepartment = (id, data, pin) => axios.put(`${API_URL}/departments/${id}`, data, { headers: { 'x-admin-pin': pin } }).then(r => r.data)
export const createDepartment = (data, pin) => axios.post(`${API_URL}/departments/`, data, { headers: { 'x-admin-pin': pin } }).then(r => r.data)
export const getFileUrl = (id) => `${API_URL}/documents/${id}/file`

export const retryDocument = (id) =>
  axios.post(`${API_URL}/documents/${id}/retry`).then(r => r.data)

export const deleteDocument = (id, pin) =>
  axios.delete(`${API_URL}/documents/${id}`, { headers: { 'x-admin-pin': pin } }).then(r => r.data)

export const getDocumentsCount = () =>
  axios.get(`${API_URL}/documents/count`).then(r => r.data)

export const uploadDocument = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return axios.post(`${API_URL}/documents/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data)
}

export const STATUS_TEXT = {
  PENDING:   '대기중',
  ANALYZING: '처리중',
  COMPLETED: '완료',
  APPROVED:  '승인됨',
  REJECTED:  '반려',
  HELD:      '보류',
  FAILED:    '분석 실패',
}

export const STATUS_COLOR = {
  PENDING:   { bg: '#F3F4F6', text: '#6B7280' },
  ANALYZING: { bg: '#EEF0FF', text: '#5E6AD2' },
  COMPLETED: { bg: '#ECFDF5', text: '#059669' },
  APPROVED:  { bg: '#ECFDF5', text: '#059669' },
  REJECTED:  { bg: '#FEF2F2', text: '#DC2626' },
  HELD:      { bg: '#F5F3FF', text: '#7C3AED' },
  FAILED:    { bg: '#FEF2F2', text: '#DC2626' },
}
