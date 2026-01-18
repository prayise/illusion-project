# PRD: Interactive RGB Glitch Mirror (Cyber-Pixel Ver.)

## 1. 프로젝트 개요 (Project Overview)
* **프로젝트명:** Cyber-Pixel Glitch Mirror
* **프로젝트 목표:** 웹캠으로 입력받은 사용자 영상을 실시간으로 픽셀화하고, 마우스 움직임이나 상호작용에 따라 RGB 채널을 분리(Chromatic Aberration)하여 사이버펑크 스타일의 디지털 아트 경험을 제공한다.
* **핵심 컨셉:** "현실의 해체와 디지털 재조합"
* **타겟 플랫폼:** 웹 브라우저 (Chrome, Safari, Firefox 등 / PC 및 모바일)

---

## 2. 사용자 경험 시나리오 (User Stories)

### 2.1. 초기 진입 (Onboarding)
1.  사용자가 웹페이지에 접속하면 "카메라 권한을 허용해주세요"라는 안내 문구와 함께 심플한 버튼이 나타난다.
2.  사용자가 권한을 허용하면 검은 배경이 나타나고, 곧이어 저해상도의 픽셀화된 자신의 모습이 화면에 뜬다.

### 2.2. 상호작용 및 시각 경험 (Interaction)
1.  **기본 상태 (Static):** 사용자가 마우스를 움직이지 않거나 중앙에 두면, 픽셀들이 비교적 온전한 색상(White/Natural)으로 합쳐져 선명한(하지만 픽셀화된) 이미지를 보여준다.
2.  **글리치 효과 (Dynamic):** 사용자가 마우스를 좌우로 움직이거나 화면을 클릭하면 '디지털 노이즈' 소리(선택사항)와 함께 이미지가 붉은색(Red)과 푸른색(Blue)으로 찢어진다.
3.  마우스가 화면 가장자리로 갈수록 RGB 분리(Offset) 간격이 커져 형체를 알아볼 수 없는 추상적인 패턴이 된다.

---

## 3. 상세 기능 요구사항 (Functional Requirements)

### 3.1. 비디오 캡처 및 전처리 (Input Processing)
* **Webcam Feed:** `p5.js`의 `createCapture(VIDEO)` 함수를 사용하여 비디오 스트림을 가져온다.
* **Mirroring:** 사용자가 거울을 보는 것과 같은 경험을 위해 비디오 좌우 반전 처리를 한다 (`translate(width, 0); scale(-1, 1);`).
* **Grid System (Pixelation):**
    * 원본 비디오 픽셀을 1:1로 사용하지 않는다.
    * `pixelSize` 변수(예: 10px ~ 20px)를 설정하여 해당 크기만큼 건너뛰며(Step) 픽셀 데이터를 샘플링한다.

### 3.2. RGB 채널 분리 알고리즘 (Core Logic)
* **채널 매핑:** 하나의 픽셀(Rect 또는 Circle)을 그릴 때, R, G, B 값을 각각 다른 위치에서 샘플링하여 합성한다.
    * **Red Source:** 현재 픽셀 좌표 `(x - offset, y)`
    * **Green Source:** 현재 픽셀 좌표 `(x, y)` (중심)
    * **Blue Source:** 현재 픽셀 좌표 `(x + offset, y)`
* **Offset 계산:**
    * `offset` 변수는 마우스의 X축 위치(`mouseX`)와 캔버스 중앙의 거리 차이에 비례하여 실시간으로 변동된다.
    * `offset = map(mouseX, 0, width, -maxOffset, maxOffset)`

### 3.3. 렌더링 및 시각 효과 (Rendering)
* **Blend Mode:** 색상이 겹칠 때 빛나는 효과를 주기 위해 `blendMode(ADD)` 또는 `blendMode(SCREEN)`을 적용한다.
* **Shape:** 픽셀의 형태는 정사각형(`rect`)을 기본으로 하되, 약간의 투명도(`alpha`)를 주어 잔상 효과를 유도한다.
* **Background:** 매 프레임마다 배경을 완전히 지우지 않고, 아주 옅은 검은색(`background(0, 50)`)을 덮어씌워 움직임의 궤적(Trail)이 남도록 한다.

---

## 4. 기술 스택 및 제약 조건 (Tech Stack & Constraints)

* **Front-end:** HTML5, CSS3
* **Library:** p5.js (필수 - 비디오 픽셀 조작 용이성 때문)
* **Performance:**
    * 모바일 환경을 고려하여 `pixelSize`는 최소 10px 이상으로 설정하여 연산 부하를 줄인다.
    * 픽셀 루프 내에서 무거운 연산(복잡한 수학 함수 등)은 지양한다.
* **Privacy:**
    * 카메라 영상은 오직 사용자의 브라우저(Client-side)에서만 처리되며, 절대 서버로 전송되거나 저장되지 않음을 명시해야 한다.

---

## 5. UI/UX 디자인 가이드 (Design Guidelines)

* **Color Palette:**
    * Background: #000000 (Pure Black)
    * Glitch Colors: #FF0000 (Red), #00FF00 (Green), #0000FF (Blue), #00FFFF (Cyan), #FF00FF (Magenta)
* **Typography:** 터미널 느낌의 Monospace 폰트 (예: 'Courier New', 'Roboto Mono')
* **Vibe:** Retro-Futurism, Cyberpunk, Glitch Art

---

## 6. 개발 마일스톤 (Milestones)

1.  **Phase 1 (기본 구조):** 웹캠 연동, 캔버스 생성, 좌우 반전, 기본 모자이크(픽셀화) 출력.
2.  **Phase 2 (알고리즘 구현):** 픽셀 루프 내에서 RGB 값 개별 추출 및 `mouseX`에 따른 Offset 적용 로직 구현.
3.  **Phase 3 (비주얼 폴리싱):** 블렌딩 모드 적용, 투명도 조절, 잔상 효과 튜닝.
4.  **Phase 4 (최적화):** 모바일 반응형 대응 및 프레임 드랍 방지 최적화.