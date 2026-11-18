/* ==========================================================
   Find My Cat - main.js

   구조
   1. 게임 데이터   : 방과 오브젝트 정보 (화면과 분리된 "내용")
   2. 게임 상태     : 현재 화면, 현재 방 등 "지금 게임이 어떤 상태인지"
   3. DOM 요소      : 자주 사용하는 HTML 요소를 미리 찾아 둠
   4. 화면 전환     : 메인 화면 <-> 게임 화면
   5. 방 & 대화창   : 오브젝트 조사, 대화창 출력
   6. 인벤토리 UI   : 빈 슬롯 그리기 (기능은 추후 구현)
   7. 이벤트 연결   : addEventListener 로 클릭 이벤트 등록
   8. 초기화
   ========================================================== */

/* ---------- 1. 게임 데이터 ---------- */
// 방 데이터는 ROOMS 객체에 "방 ID" 를 key 로 저장합니다.
// 오브젝트의 key(bed, desk ...)는 index.html 의 data-object-id 값과 같아야 합니다.
// 나중에 방이 늘어나면 ROOMS 에 새 방을 추가하거나, 별도 파일(js/data/rooms.js)·JSON·Django API 로 분리할 수 있습니다.
const ROOMS = {
  bedroom: {
    id: 'bedroom',
    name: '침실',
    // 방에 처음 들어왔을 때 보여줄 대사
    intro: {
      speaker: '나',
      text: '...이상하다. 평소라면 보리랑 콩이가 얼굴을 밟으며 깨웠을 텐데.\n집 안이 너무 조용하다. 방 안을 조사해 보자.',
    },
    objects: {
      bed: {
        name: '침대',
        description: '이불이 반쯤 걷혀 있다.\n베개 위에 까만 털과 주황색 털이 뒤섞여 있다. 어젯밤까지는 분명 여기서 같이 잤는데...',
      },
      desk: {
        name: '책상',
        description: '스탠드 불이 켜져 있다. 어젯밤에 분명 끄고 잤는데...\n책상 위에 처음 보는 쪽지 한 장이 놓여 있다.',
      },
      drawer: {
        name: '서랍',
        description: '3단 서랍장이다. 맨 아래 칸이 살짝 열려 있다.\n틈 사이로 무언가 반짝이는 것이 보인다.',
      },
      frame: {
        name: '액자',
        description: '보리, 콩이와 함께 찍은 사진이다.\n액자가 비스듬히 기울어져 있다. 누가 건드린 걸까?',
      },
      plant: {
        name: '화분',
        description: '창가에 둔 몬스테라 화분이다.\n흙 위에 작은 발자국이 찍혀 있다. 고양이들은 이 화분을 싫어했는데...',
      },
      door: {
        name: '방문',
        description: '문이 잠겨 있다. 안쪽에서 잠근 기억은 없는데...\n손잡이 아래에 숫자 4자리를 입력하는 자물쇠가 달려 있다.',
      },
    },
  },
};

// 인벤토리 슬롯 개수 (UI 용)
const INVENTORY_SLOT_COUNT = 8;

/* ---------- 2. 게임 상태 ---------- */
// 게임이 진행되면서 바뀌는 값은 모두 여기에 모아 둡니다.
// 추후 Save / Load 기능을 만들 때 이 객체를 통째로 저장/불러오면 됩니다.
const gameState = {
  currentScreen: 'title',   // 'title' | 'game'
  currentRoomId: 'bedroom', // 현재 있는 방의 ID
  selectedObjectId: null,   // 마지막으로 조사한 오브젝트의 ID
  inventory: [],            // TODO(Inventory System): 획득한 아이템 목록
};

/* ---------- 3. DOM 요소 ---------- */
const titleScreen = document.querySelector('#title-screen');
const gameScreen = document.querySelector('#game-screen');

const startButton = document.querySelector('#start-button');
const menuButton = document.querySelector('#menu-button');

const currentLocationText = document.querySelector('#current-location');
const roomScene = document.querySelector('#room-scene');

const dialogueSpeaker = document.querySelector('#dialogue-speaker');
const dialogueText = document.querySelector('#dialogue-text');

const inventorySlotList = document.querySelector('#inventory-slots');

// 화면 이름과 실제 요소를 연결해 두면 showScreen('game') 처럼 이름으로 전환할 수 있습니다.
const screens = {
  title: titleScreen,
  game: gameScreen,
};

/* ---------- 4. 화면 전환 ---------- */

/**
 * 지정한 화면만 보이게 합니다.
 * CSS 에서 .screen.is-active 만 display 되도록 해 두었기 때문에
 * JS 는 클래스만 붙였다 떼면 됩니다.
 * @param {string} screenName - 'title' 또는 'game'
 */
function showScreen(screenName) {
  Object.entries(screens).forEach(([name, screenElement]) => {
    screenElement.classList.toggle('is-active', name === screenName);
  });

  gameState.currentScreen = screenName;
}

/** 게임 시작: 침실로 이동하고 첫 대사를 보여줍니다. */
function startGame() {
  gameState.currentRoomId = 'bedroom';
  gameState.selectedObjectId = null;

  showScreen('game');
  enterRoom(gameState.currentRoomId);
}

/** 메뉴 버튼: 메인 화면으로 돌아갑니다. */
function returnToTitle() {
  clearSelectedObject();
  showScreen('title');
}

/* ---------- 5. 방 & 대화창 ---------- */

/**
 * 방에 들어갑니다. (현재는 침실 하나뿐)
 * TODO(Room System): 방 이동을 구현할 때 roomScene 의 오브젝트를 이 함수에서 다시 그리면 됩니다.
 * @param {string} roomId
 */
function enterRoom(roomId) {
  const room = ROOMS[roomId];

  // 존재하지 않는 방 ID 가 들어오면 콘솔에 경고만 남기고 종료
  if (!room) {
    console.warn(`[enterRoom] 존재하지 않는 방입니다: ${roomId}`);
    return;
  }

  roomScene.dataset.roomId = room.id;
  currentLocationText.textContent = room.name;

  showDialogue(room.intro.speaker, room.intro.text);
}

/**
 * 대화창에 화자와 내용을 표시합니다.
 * @param {string} speaker - 이름표에 표시할 이름
 * @param {string} text - 본문 (\n 으로 줄바꿈 가능)
 */
function showDialogue(speaker, text) {
  dialogueSpeaker.textContent = speaker;
  dialogueText.textContent = text;
}

/**
 * 오브젝트를 조사합니다. (클릭 시 호출)
 * TODO(Interaction / Puzzle System): 아이템 획득, 잠금 확인 등은 이 함수에서 분기하면 됩니다.
 * @param {string} objectId - data-object-id 값
 */
function inspectObject(objectId) {
  const room = ROOMS[gameState.currentRoomId];
  const roomObject = room.objects[objectId];

  // HTML 에는 있는데 데이터가 없는 경우를 대비
  if (!roomObject) {
    console.warn(`[inspectObject] 데이터가 없는 오브젝트입니다: ${objectId}`);
    return;
  }

  gameState.selectedObjectId = objectId;
  highlightSelectedObject(objectId);
  showDialogue(roomObject.name, roomObject.description);
}

/** 선택한 오브젝트에만 .is-selected 클래스를 붙입니다. */
function highlightSelectedObject(objectId) {
  const roomObjects = roomScene.querySelectorAll('.room-object');

  roomObjects.forEach((objectElement) => {
    const isTarget = objectElement.dataset.objectId === objectId;
    objectElement.classList.toggle('is-selected', isTarget);
  });
}

/** 선택 표시를 모두 지웁니다. */
function clearSelectedObject() {
  gameState.selectedObjectId = null;
  highlightSelectedObject(null);
}

/**
 * 오브젝트 클릭 이벤트 핸들러
 * event.currentTarget 은 "이벤트를 등록한 요소" (= 클릭된 .room-object 버튼) 입니다.
 * 버튼 안의 <span> 을 클릭해도 currentTarget 은 항상 버튼이므로 안전합니다.
 */
function handleObjectClick(event) {
  const objectId = event.currentTarget.dataset.objectId;
  inspectObject(objectId);
}

/* ---------- 6. 인벤토리 UI ---------- */

/**
 * 빈 인벤토리 슬롯을 그립니다.
 * TODO(Inventory System): gameState.inventory 의 아이템을 슬롯 안에 그려 넣는 기능을 추가하세요.
 */
function renderInventorySlots() {
  inventorySlotList.innerHTML = '';

  for (let slotIndex = 0; slotIndex < INVENTORY_SLOT_COUNT; slotIndex += 1) {
    const slotElement = document.createElement('li');
    slotElement.className = 'inventory-slot';
    slotElement.dataset.slotIndex = slotIndex;
    slotElement.setAttribute('aria-label', `빈 슬롯 ${slotIndex + 1}`);
    inventorySlotList.appendChild(slotElement);
  }
}

/* ---------- 7. 이벤트 연결 ---------- */
function bindEvents() {
  startButton.addEventListener('click', startGame);
  menuButton.addEventListener('click', returnToTitle);

  // 방 안의 모든 오브젝트에 같은 클릭 핸들러를 등록
  const roomObjects = roomScene.querySelectorAll('.room-object');
  roomObjects.forEach((objectElement) => {
    objectElement.addEventListener('click', handleObjectClick);
  });
}

/* ---------- 8. 초기화 ---------- */
function init() {
  renderInventorySlots();
  bindEvents();
  showScreen('title');
}

init();
