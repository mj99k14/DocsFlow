import axios from 'axios'

const API_URL = 'http://localhost:8000'

export const getDocuments = () => axios.get(`${API_URL}/documents/`).then(r => r.data)
export const getDocument = (id) => axios.get(`${API_URL}/documents/${id}`).then(r => r.data)
export const getDocumentHistory = (id) => axios.get(`${API_URL}/documents/${id}/history`).then(r => r.data)
export const getDepartments = () => axios.get(`${API_URL}/departments/`).then(r => r.data)

const adminHeaders = () => ({ 'x-admin-pin': sessionStorage.getItem('admin_verified') === 'true' ? sessionStorage.getItem('admin_pin') ?? '' : '' })

export const verifyAdminPin = (pin) =>
  axios.post(`${API_URL}/admin/verify`, { pin }).then(r => {
    sessionStorage.setItem('admin_pin', pin)
    return r.data
  })

export const updateDepartment = (id, data) => axios.put(`${API_URL}/departments/${id}`, data, { headers: adminHeaders() }).then(r => r.data)
export const createDepartment = (data) => axios.post(`${API_URL}/departments/`, data, { headers: adminHeaders() }).then(r => r.data)
export const getFileUrl = (id) => `${API_URL}/documents/${id}/file`
export const approveDocument = (id, data) => axios.post(`${API_URL}/documents/${id}/approve`, data).then(r => r.data)

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
