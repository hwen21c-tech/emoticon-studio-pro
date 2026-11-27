# 🎨 이모티콘 스튜디오 AI Pro (emoticon-studio-pro)

사물 사진 한 장으로 **상업용 24종 이모티콘**을 만드는 독립 웹앱입니다.
관제탑(`stock-dashboard-live-6frm.vercel.app`)의 `/api/content-ai` 서버 함수를 크로스 오리진으로 사용하므로 **Gemini 키를 브라우저에 두지 않습니다.**

- 라이브: https://emoticon-studio-pro.vercel.app
- 가족 PIN: `0623` (첫 진입 시 1회, 이 기기에서 유지 선택 가능)
- 홈 화면 설치(PWA): Android 크롬 [설치] 버튼 / iOS 공유 → 홈 화면에 추가

## 구성

| 파일 | 역할 |
|---|---|
| `index.html` | 5탭 + 3-2 검수 보드 앱 전체 (Tailwind CDN · Lucide · JSZip) |
| `manifest.json` | PWA 매니페스트 (`id/start_url/scope: "/"`, standalone) |
| `sw.js` | 오프라인 셸 서비스워커 (화면은 네트워크 우선, 외부 API는 가로채지 않음) |
| `vercel.json` | 캐시·매니페스트·서비스워커 헤더 |
| `icons/` | 192 / 512 / maskable 512 / apple 180 |

## 서버 액션 (sd_live/api/content-ai.js)

- `emoticon_plan` — 테마·컨셉·사진 → 캐릭터 이름·세계관·비주얼 DNA + **24종 문구/표정/영문 포즈 프롬프트** + OGQ 제목·태그 (명사 위주 10개)
  - `mode: 'seo'` → 한국어·영어·일본어·대만어 등록 문구
- `emoticon_image` — 기준 캐릭터 이미지(`reference`)를 함께 넘겨 24장 얼굴·비율·색감을 잠그고,
  프롬프트에 `NO text, NO letters, NO speech bubbles, pure solid white background (#FFFFFF)` 를 강제
  - `mode`: `sticker` / `sheet` / `edit`(빨간 마스크 부분 수정)

## 기능 요약

1. 사진 → 사물 의인화, 상표 클린업, 캐릭터 시트 생성·DNA 고정
2. **기준 캐릭터 1장 → 24종 자동 레퍼런스 고정** (시트 고정 > 1번 컷 원본 > 업로드 사진)
3. **그림 속 글씨 금지** + 한글 폰트 효과 프리셋(외곽선·스티커·그림자·배지·네온·아치, 기울기)
4. **라이트(#111)·다크(#fff) 일괄 검수판** + 실제 채팅 크기(96px) 보기
5. 실전 기획 프리셋 4종 — 사물 의인화 / 블로거 리뷰(내돈내산·강추·솔직후기·구분선) / 주식·직장인 / 가족·연인
6. **움직이는 스티커 내보내기** — GIF · APNG(투명) · WebM
7. OGQ(740×640) · LINE(370×320) · 카카오 · SNS · 굿즈 칼선 ZIP, 다국어 SEO, 1080 홍보 카드
8. 밝게/어둡게 테마, PWA 설치, 가족 PIN 잠금
