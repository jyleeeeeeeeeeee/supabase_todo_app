# Todo 앱 (Supabase 연동)

이 프로젝트는 Supabase를 기반으로 한 개인용 할 일 관리 웹 앱입니다. 
사용자는 로그인 후 카테고리별로 할 일을 추가하고, 완료 처리 및 삭제를 할 수 있으며, 건강 루틴을 추천받아 바로 할 일로 등록할 수도 있습니다.

## 주요 기능

- 로그인 / 회원가입
- 할 일 생성, 완료 처리, 삭제
- 카테고리 생성 및 관리
- 카테고리별 할 일 필터링
- 할 일 내용과 카테고리 수정
- 건강 관련 추천 항목 제공
  - 산책 10분
  - 물 3잔 마시기
  - 30분 러닝
- 추천 항목은 원하는 것만 선택해서 할 일로 추가 가능

## 기술 스택

- React + TypeScript
- Vite
- Tailwind CSS
- Supabase Auth
- Supabase Database
- lucide-react

## 프로젝트 구조

- src/components: 화면 컴포넌트
  - AuthScreen.tsx: 로그인/회원가입 화면
  - TodoApp.tsx: 할 일 관리 메인 화면
- src/context: 인증 상태 관리
- src/lib: Supabase 클라이언트 설정
- supabase/migrations: 데이터베이스 마이그레이션 파일

## 실행 방법

1. 의존성 설치
   ```bash
   npm install
   ```

2. 환경 변수 설정
   프로젝트 루트에 `.env` 파일을 만들고 아래 값을 설정합니다.
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. 개발 서버 실행
   ```bash
   npm run dev
   ```

4. 브라우저에서 접속
   ```text
   http://localhost:5173
   ```

## 빌드

```bash
npm run build
```

## 참고

이 프로젝트는 Supabase의 인증 및 데이터베이스를 활용해 실시간으로 할 일을 관리하는 데 중점을 둔 예제 앱입니다.
