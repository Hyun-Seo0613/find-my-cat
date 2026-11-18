# Find My Cat · 사라진 고양이를 찾아라

> 어느 날 아침, 함께 살던 고양이 두 마리(보리 & 콩이)가 사라졌다.
> 방 안의 단서를 조사해 고양이들이 사라진 이유를 추적하는 2D 클릭형 방탈출 게임.

- 장르: 2D 클릭형 방탈출 / 미스터리 / 추리
- 플랫폼: PC 웹 브라우저
- 기술: HTML5, CSS3, Vanilla JavaScript (ES6) — 프레임워크·빌드 도구 없음
- 현재 버전: **v0.1 프로토타입** (UI + 화면 전환 + 오브젝트 조사)

## 실행 방법

### 방법 1. 파일 바로 열기
`index.html` 을 더블클릭하거나 브라우저(Chrome / Edge 권장)로 드래그해서 엽니다.

### 방법 2. 로컬 서버 (권장)
추후 JSON 데이터나 API 를 불러오려면 로컬 서버가 필요하므로 이 방법에 익숙해지는 것을 권장합니다.

- **VS Code**: `Live Server` 확장 설치 → `index.html` 우클릭 → *Open with Live Server*
- **Python**:
  ```bash
  python -m http.server 5500
  ```
  브라우저에서 http://localhost:5500 접속

> 픽셀 폰트(Press Start 2P, Galmuri)는 CDN 에서 불러옵니다. 오프라인이면 기본 폰트로 표시됩니다.

## 조작 방법

| 동작 | 결과 |
| --- | --- |
| `게임 시작` 클릭 | 침실 화면으로 이동 |
| 방 안의 오브젝트 클릭 | 하단 대화창에 설명 표시 |
| 상단 `메뉴` 클릭 | 메인 화면으로 돌아가기 |

조사 가능한 오브젝트: 침대, 책상, 서랍, 액자, 화분, 방문

## 폴더 구조

```
find-my-cat/
├── index.html        # 화면 구조 (메인 화면 / 게임 화면)
├── css/
│   └── style.css     # 픽셀 아트 스타일, 방 그래픽, 레이아웃
├── js/
│   └── main.js       # 게임 데이터, 상태, 화면 전환, 클릭 이벤트
├── assets/
│   └── images/       # 실제 이미지 리소스 보관 (현재는 비어 있음)
└── README.md
```

## 이미지 리소스로 교체하기

현재 그래픽은 모두 CSS 와 인라인 SVG 로 만든 임시 그래픽입니다.

1. `assets/images/` 에 이미지를 넣습니다. (예: `bed.png`)
2. `index.html` 에서 해당 오브젝트 버튼 안의 `<span>` 들을 지웁니다.
3. `css/style.css` 의 오브젝트 클래스에 배경 이미지를 지정합니다.
   ```css
   .obj-bed {
     background: url("../assets/images/bed.png") center / contain no-repeat;
   }
   ```
4. 배경 전체를 교체하려면 `.room-background` 를 지우고 `.room-scene` 에 배경 이미지를 지정합니다.

오브젝트 위치는 % 단위라 이미지로 바꿔도 화면 크기에 맞게 함께 조절됩니다.

## 개발 로드맵

- [x] 메인 화면 / 침실 화면 UI
- [x] 화면 전환, 오브젝트 클릭 → 설명 출력
- [x] 인벤토리 슬롯 UI
- [ ] Inventory System — 아이템 획득·선택·삭제
- [ ] Interaction System — 조사 횟수/조건에 따른 대사 변화
- [ ] Puzzle System — 서랍·방문 자물쇠 정답 판정
- [ ] Room System — 방 이동 (거실, 주방 ...)
- [ ] Game State / Save·Load — `localStorage` 저장
- [ ] Django Backend — 회원, 진행도 저장 API
