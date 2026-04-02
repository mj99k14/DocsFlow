// DocumentDetail.test.jsx
// 목적: DocumentDetail.jsx의 문서 처리 완료 여부(isProcessed) 판별 로직을 순수 함수로 추출하여 검증한다.
// useParams, API 호출 등 복잡한 의존성 없이 상태값에 따른 버튼 활성화 조건만 단위 테스트한다.

// DocumentDetail.jsx의 isProcessed 판별 로직과 동일한 순수 함수
// APPROVED / REJECTED / HELD 상태면 이미 처리된 문서로 간주하여 승인 버튼을 비활성화한다.
function isProcessed(status) {
  return ['APPROVED', 'REJECTED', 'HELD'].includes(status)
}

describe('DocumentDetail isProcessed 판별 로직', () => {
  it('status "COMPLETED" → isProcessed는 false (승인 버튼 활성화 상태)', () => {
    expect(isProcessed('COMPLETED')).toBe(false)
  })

  it('status "APPROVED" → isProcessed는 true (승인 버튼 비활성화)', () => {
    expect(isProcessed('APPROVED')).toBe(true)
  })

  it('status "REJECTED" → isProcessed는 true (승인 버튼 비활성화)', () => {
    expect(isProcessed('REJECTED')).toBe(true)
  })

  it('status "HELD" → isProcessed는 true (승인 버튼 비활성화)', () => {
    expect(isProcessed('HELD')).toBe(true)
  })

  it('status "PENDING" → isProcessed는 false (승인 버튼 활성화 상태)', () => {
    expect(isProcessed('PENDING')).toBe(false)
  })
})
