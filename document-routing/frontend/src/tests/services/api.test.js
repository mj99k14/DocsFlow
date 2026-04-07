// api.test.js
// 목적: services/api.js의 각 함수가 올바른 URL과 HTTP 메서드로 axios를 호출하는지 검증한다.
// axios를 mock으로 대체하여 실제 네트워크 요청 없이 호출 인자만 확인한다.

import axios from 'axios'
import {
  getDocuments,
  getDocument,
  getDepartments,
  uploadDocument,
  updateDepartment,
  createDepartment,
  retryDocument,
} from '../../services/api.js'

vi.mock('axios')

const API_URL = 'http://localhost:8000'

describe('api.js', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getDocuments — GET /documents/ 호출 확인', async () => {
    axios.get.mockResolvedValue({ data: [] })

    await getDocuments()

    expect(axios.get).toHaveBeenCalledTimes(1)
    expect(axios.get).toHaveBeenCalledWith(`${API_URL}/documents/`)
  })

  it('getDocument(5) — GET /documents/5 호출 확인', async () => {
    axios.get.mockResolvedValue({ data: [] })

    await getDocument(5)

    expect(axios.get).toHaveBeenCalledTimes(1)
    expect(axios.get).toHaveBeenCalledWith(`${API_URL}/documents/5`)
  })

  it('getDepartments — GET /departments/ 호출 확인', async () => {
    axios.get.mockResolvedValue({ data: [] })

    await getDepartments()

    expect(axios.get).toHaveBeenCalledTimes(1)
    expect(axios.get).toHaveBeenCalledWith(`${API_URL}/departments/`)
  })

  it('uploadDocument(file) — POST /documents/upload FormData multipart 헤더 호출 확인', async () => {
    axios.post.mockResolvedValue({ data: {} })

    const fakeFile = new File(['내용'], 'test.pdf', { type: 'application/pdf' })
    await uploadDocument(fakeFile)

    expect(axios.post).toHaveBeenCalledTimes(1)

    const [url, body, config] = axios.post.mock.calls[0]
    expect(url).toBe(`${API_URL}/documents/upload`)
    expect(body).toBeInstanceOf(FormData)
    expect(config.headers['Content-Type']).toBe('multipart/form-data')
  })

  it('retryDocument(7) — POST /documents/7/retry 호출 확인', async () => {
    axios.post.mockResolvedValue({ data: {} })

    await retryDocument(7)

    expect(axios.post).toHaveBeenCalledTimes(1)
    expect(axios.post).toHaveBeenCalledWith(`${API_URL}/documents/7/retry`)
  })

  it('updateDepartment(2, data, pin) — PUT /departments/2 + x-admin-pin 헤더 호출 확인', async () => {
    axios.put.mockResolvedValue({ data: {} })

    const updateData = { name: '법무팀', slack_webhook: 'https://hooks.slack.com/xxx' }
    const pin = '1234'
    await updateDepartment(2, updateData, pin)

    expect(axios.put).toHaveBeenCalledTimes(1)
    expect(axios.put).toHaveBeenCalledWith(
      `${API_URL}/departments/2`,
      updateData,
      { headers: { 'x-admin-pin': pin } }
    )
  })

  it('createDepartment(data, pin) — POST /departments/ + x-admin-pin 헤더 호출 확인', async () => {
    axios.post.mockResolvedValue({ data: {} })

    const deptData = { name: '신규팀', slack_channel: '#new' }
    const pin = '1234'
    await createDepartment(deptData, pin)

    expect(axios.post).toHaveBeenCalledTimes(1)
    expect(axios.post).toHaveBeenCalledWith(
      `${API_URL}/departments/`,
      deptData,
      { headers: { 'x-admin-pin': pin } }
    )
  })
})
