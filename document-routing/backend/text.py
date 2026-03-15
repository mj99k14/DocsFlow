# backend/test.py
from services.ai import analyze_document

try:
    result = analyze_document('이 문서는 2024년 법무팀과의 소프트웨어 라이선스 갱신 계약서입니다.')
    print(result)
except Exception as e:
    print(f"에러 발생: {e}")