// Upload.test.jsx
// 목적: Upload.jsx의 파일 추가(addFiles) 로직을 순수 함수로 추출하여 검증한다.
// PDF 확장자 필터링과 중복 파일 방지 동작을 렌더링 없이 단위 테스트한다.

// Upload.jsx의 addFiles 로직과 동일한 순수 함수
// currentFiles: 현재 목록, newFiles: 새로 추가하려는 파일 목록
// 반환값: 실제로 추가될 파일 배열 (중복·비PDF 제외)
function addFiles(currentFiles, newFiles) {
  const existingNames = new Set(currentFiles.map(f => f.name))
  return newFiles.filter(f => f.name.endsWith('.pdf') && !existingNames.has(f.name))
}

describe('Upload addFiles 로직', () => {
  it('PDF 파일 추가 시 반환 배열에 포함됨', () => {
    const currentFiles = []
    const newFiles = [{ name: 'document.pdf' }]

    const result = addFiles(currentFiles, newFiles)

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('document.pdf')
  })

  it('.docx 파일은 반환 배열에 포함되지 않음', () => {
    const currentFiles = []
    const newFiles = [{ name: 'report.docx' }]

    const result = addFiles(currentFiles, newFiles)

    expect(result).toHaveLength(0)
  })

  it('이미 있는 파일명은 추가되지 않음', () => {
    const currentFiles = [{ name: 'existing.pdf' }]
    const newFiles = [{ name: 'existing.pdf' }]

    const result = addFiles(currentFiles, newFiles)

    expect(result).toHaveLength(0)
  })
})
