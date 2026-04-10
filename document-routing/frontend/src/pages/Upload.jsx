import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, X, CheckCircle } from 'lucide-react'
import { uploadDocument } from '../services/api.js'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

export default function UploadPage() {
  const [files, setFiles] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const navigate = useNavigate()

  const MAX_SIZE = 10 * 1024 * 1024 // 10MB

  const addFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter(f => f.name.endsWith('.pdf') || f.name.endsWith('.docx'))
    if (valid.length < Array.from(newFiles).length) {
      toast.error('PDF, DOCX 파일만 업로드 가능합니다')
    }
    const oversized = valid.filter(f => f.size > MAX_SIZE)
    if (oversized.length > 0) {
      toast.error(`10MB를 초과한 파일은 업로드할 수 없습니다: ${oversized.map(f => f.name).join(', ')}`)
    }
    const validFiles = valid.filter(f => f.size <= MAX_SIZE)
    setFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name))
      const duplicates = validFiles.filter(f => existingNames.has(f.name))
      if (duplicates.length > 0) {
        toast.error(`이미 추가된 파일입니다: ${duplicates.map(f => f.name).join(', ')}`)
      }
      return [...prev, ...validFiles.filter(f => !existingNames.has(f.name))]
    })
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const handleUpload = async () => {
    if (files.length === 0) { toast.error('업로드할 파일을 선택해주세요'); return }
    setUploading(true)
    try {
      for (const file of files) { await uploadDocument(file) }
      toast.success(`${files.length}개 파일 업로드 완료! AI가 문서를 분석 중입니다.`)
      setFiles([])
      navigate('/')
    } catch (e) {
      toast.error('업로드 실패: ' + (e.response?.data?.detail || e.message))
    } finally {
      setUploading(false)
    }
  }

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i]
  }

  return (
    <div style={{ padding: 32, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#111827' }}>문서 업로드</h2>
        <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
          AI가 자동으로 문서를 분석하고 적절한 부서로 분류합니다
        </p>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: 24, minHeight: 0 }}>
        {/* 왼쪽 - 업로드 영역 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 드래그 영역 */}
          <label
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px dashed ${isDragging ? '#5E6AD2' : '#D1D5DB'}`,
              borderRadius: 16,
              background: isDragging ? '#EEF0FF' : '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s',
              gap: 16,
              padding: 40,
            }}
          >
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: '#EEF0FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Upload size={32} color="#5E6AD2" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 6 }}>
                파일을 드래그하거나 클릭하여 업로드
              </p>
              <p style={{ fontSize: 13, color: '#9CA3AF' }}>
                PDF, DOCX 파일 지원 · 최대 10MB
              </p>
            </div>
            <div style={{
              padding: '8px 20px',
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              color: '#374151',
              background: '#fff',
            }}>
              파일 선택
            </div>
            <input type="file" multiple accept=".pdf,.docx" onChange={e => addFiles(e.target.files)} style={{ display: 'none' }} />
          </label>

          {/* 파일 목록 */}
          {files.length > 0 && (
            <Card style={{ padding: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
                선택된 파일 ({files.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {files.map((file, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 8,
                    background: '#F9FAFB', border: '1px solid #E5E7EB',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      <FileText size={16} color="#5E6AD2" style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {file.name}
                        </p>
                        <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{formatSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4, display: 'flex' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  size="lg"
                  className="gap-2"
                  style={{ background: '#5E6AD2' }}
                >
                  {uploading ? (
                    <>
                      <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      업로드 중...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      {files.length}개 파일 업로드
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* 오른쪽 - 안내 */}
        <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card style={{ padding: 24, background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#5E6AD2', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              AI 자동 분류 프로세스
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { step: '1', text: '업로드된 문서를 자동으로 분석합니다' },
                { step: '2', text: '내용을 기반으로 적절한 부서를 추천합니다' },
                { step: '3', text: '승인 후 슬랙으로 해당 부서에 알림을 전송합니다' },
              ].map(({ step, text }) => (
                <div key={step} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: '#5E6AD2', color: '#fff',
                    fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 1,
                  }}>{step}</div>
                  <p style={{ fontSize: 13, color: '#4C1D95', lineHeight: 1.5 }}>{text}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ padding: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              지원 형식
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ padding: '4px 12px', background: '#EEF0FF', color: '#5E6AD2', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>
                PDF
              </span>
              <span style={{ padding: '4px 12px', background: '#EEF0FF', color: '#5E6AD2', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>
                DOCX
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 12 }}>최대 파일 크기: 10MB</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
