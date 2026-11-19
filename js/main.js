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
    // descriptions : 조사할 때마다 순서대로 보여줄 대사 목록
    //                마지막 대사까지 본 뒤에는 마지막 대사를 계속 반복합니다.
    objects: {
      bed: {
        name: '침대',
        descriptions: [
          '이불이 반쯤 걷혀 있다.\n베개 위에 까만 털과 주황색 털이 뒤섞여 있다. 어젯밤까지는 분명 여기서 같이 잤는데...',
          '이불을 들춰 보았다. 고양이들이 숨어 있지는 않다.\n침대 밑도 텅 비어 있다.',
          '보리랑 콩이의 온기가 아직 남아 있는 것 같다...',
        ],
      },
      desk: {
        name: '책상',
        item: 'note', // 처음 조사할 때 얻는 아이템 (ITEMS 의 key)
        descriptions: [
          '스탠드 불이 켜져 있다. 어젯밤에 분명 끄고 잤는데...\n책상 위에 처음 보는 쪽지 한 장이 놓여 있어서 챙겼다.',
          '쪽지를 자세히 보니 무언가 적혀 있다.\n"고양이들이 가장 좋아하는 곳을 봐." ...누가 쓴 걸까?',
          '쪽지의 글씨체가 어딘가 낯이 익다.',
        ],
      },
      drawer: {
        name: '서랍',
        item: 'key',
        descriptions: [
          '3단 서랍장이다. 맨 아래 칸이 살짝 열려 있다.\n안쪽을 더듬어 보니 차가운 금속이 손끝에 닿았다.',
          '서랍 안에는 이제 아무것도 없다.',
        ],
      },
      frame: {
        name: '액자',
        descriptions: [
          '보리, 콩이와 함께 찍은 사진이다.\n액자가 비스듬히 기울어져 있다. 누가 건드린 걸까?',
          '사진 아래 구석에 작은 글씨로 날짜가 적혀 있다.\n고양이들을 처음 데려온 날이다.',
        ],
      },
      plant: {
        name: '화분',
        descriptions: [
          '창가에 둔 몬스테라 화분이다.\n흙 위에 작은 발자국이 찍혀 있다. 고양이들은 이 화분을 싫어했는데...',
          '발자국은 화분에서 창문 쪽으로 이어져 있다.',
        ],
      },
      door: {
        name: '방문',
        descriptions: [
          '문이 잠겨 있다. 안쪽에서 잠근 기억은 없는데...\n손잡이 아래에 숫자 4자리를 입력하는 자물쇠가 달려 있다.',
          '문고리를 흔들어 보았지만 꿈쩍도 하지 않는다.\n비밀번호를 알아내야 할 것 같다.',
        ],
      },
    },
  },
};

// 아이템 데이터
// icon : index.html 의 <symbol id="..."> 값. 나중에 PNG 를 쓰려면 이미지 경로로 바꾸고 renderInventory 만 고치면 됩니다.
const ITEMS = {
  key: {
    name: '작은 열쇠',
    description: '서랍 안쪽에서 찾은 작은 열쇠. 손잡이에 고양이 모양이 새겨져 있다.',
    icon: 'item-key',
  },
  note: {
    name: '수상한 쪽지',
    description: '"고양이들이 가장 좋아하는 곳을 봐." 라고 적혀 있다.',
    icon: 'item-note',
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
  inspectCounts: {},        // 오브젝트별 조사 횟수 (예: { bed: 2, desk: 1 })
  inventory: [],            // 획득한 아이템 ID 목록 (예: ['note', 'key'])
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
  gameState.inspectCounts = {}; // 새 게임이므로 조사 기록 초기화
  gameState.inventory = [];     // 인벤토리도 비우기
  renderInventory();

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

  // 1) 지금까지 이 오브젝트를 몇 번 조사했는지 가져오기 (처음이면 기록이 없으므로 0)
  const inspectCount = getInspectCount(objectId);

  // 2) 조사 횟수를 대사 번호로 사용하되, 대사 개수를 넘어가면 마지막 대사에 고정
  //    예) 대사 3개 → 조사 0,1,2회차는 0,1,2번 대사 / 3회차 이후는 계속 2번 대사
  const lastIndex = roomObject.descriptions.length - 1;
  const descriptionIndex = Math.min(inspectCount, lastIndex);

  let dialogue = roomObject.descriptions[descriptionIndex];

  // 3) 아이템이 있는 오브젝트라면 획득 시도 (이미 가지고 있으면 addItem 이 false 를 반환)
  if (roomObject.item && addItem(roomObject.item)) {
    dialogue += `\n▶ [${ITEMS[roomObject.item].name}] 을(를) 획득했다!`;
  }

  // 4) 화면에 출력
  gameState.selectedObjectId = objectId;
  highlightSelectedObject(objectId);
  showDialogue(roomObject.name, dialogue);

  // 5) 조사 횟수 1 증가 → 다음 클릭 때 다음 대사가 나옴
  gameState.inspectCounts[objectId] = inspectCount + 1;
}

/**
 * 오브젝트를 몇 번 조사했는지 반환합니다.
 * TODO(Puzzle System): "쪽지를 두 번 이상 읽었다면" 같은 조건을 만들 때 활용할 수 있습니다.
 * @param {string} objectId
 * @returns {number}
 */
function getInspectCount(objectId) {
  return gameState.inspectCounts[objectId] ?? 0;
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

/* ---------- 6. 인벤토리 ---------- */
// 원칙: 데이터(gameState.inventory)를 먼저 바꾸고 → renderInventory() 로 화면을 다시 그린다.
//       화면(DOM)을 직접 고치지 않기 때문에 데이터와 화면이 어긋날 일이 없습니다.

/**
 * 아이템을 가지고 있는지 확인합니다.
 * @param {string} itemId
 * @returns {boolean}
 */
function hasItem(itemId) {
  return gameState.inventory.includes(itemId);
}

/**
 * 인벤토리에 아이템을 추가합니다.
 * @param {string} itemId - ITEMS 의 key
 * @returns {boolean} 새로 추가했으면 true, 추가하지 못했으면 false
 */
function addItem(itemId) {
  if (!ITEMS[itemId]) {
    console.warn(`[addItem] 존재하지 않는 아이템입니다: ${itemId}`);
    return false;
  }

  // 이미 가지고 있거나 슬롯이 가득 찼으면 추가하지 않음
  if (hasItem(itemId) || gameState.inventory.length >= INVENTORY_SLOT_COUNT) {
    return false;
  }

  gameState.inventory.push(itemId);
  renderInventory(itemId);
  return true;
}

/**
 * 인벤토리에서 아이템을 제거합니다. (3단계: 아이템 사용 시 활용)
 * @param {string} itemId
 */
function removeItem(itemId) {
  gameState.inventory = gameState.inventory.filter((ownedItemId) => ownedItemId !== itemId);
  renderInventory();
}

/**
 * gameState.inventory 를 기준으로 인벤토리 슬롯 전체를 다시 그립니다.
 * @param {string} [newItemId] - 방금 얻은 아이템 ID (강조 애니메이션용, 생략 가능)
 */
function renderInventory(newItemId) {
  inventorySlotList.innerHTML = '';

  for (let slotIndex = 0; slotIndex < INVENTORY_SLOT_COUNT; slotIndex += 1) {
    const slotElement = document.createElement('li');
    slotElement.className = 'inventory-slot';
    slotElement.dataset.slotIndex = slotIndex;

    const itemId = gameState.inventory[slotIndex]; // 이 칸에 들어갈 아이템 (없으면 undefined)

    if (itemId) {
      const item = ITEMS[itemId];
      slotElement.classList.add('has-item');
      slotElement.dataset.itemId = itemId;
      slotElement.title = item.name;
      slotElement.setAttribute('aria-label', item.name);
      slotElement.innerHTML = `<svg class="item-icon" aria-hidden="true"><use href="#${item.icon}" /></svg>`;

      if (itemId === newItemId) {
        slotElement.classList.add('is-new');
      }
    } else {
      slotElement.setAttribute('aria-label', `빈 슬롯 ${slotIndex + 1}`);
    }

    inventorySlotList.appendChild(slotElement);
  }
}

/**
 * 인벤토리 클릭 이벤트 핸들러 (이벤트 위임)
 * 슬롯은 renderInventory 가 매번 새로 만들기 때문에, 슬롯 각각이 아니라
 * 부모(ul)에 이벤트를 한 번만 등록하고 클릭된 슬롯을 closest() 로 찾습니다.
 */
function handleInventoryClick(event) {
  const slotElement = event.target.closest('.inventory-slot');

  // 빈 칸이나 슬롯 바깥을 클릭했다면 무시
  if (!slotElement || !slotElement.dataset.itemId) {
    return;
  }

  const item = ITEMS[slotElement.dataset.itemId];
  showDialogue(item.name, item.description);
  // TODO(3단계): 여기서 아이템을 "선택" 상태로 만들고, 오브젝트에 사용하는 기능으로 확장
}

/* ---------- 7. 이벤트 연결 ---------- */
function bindEvents() {
  startButton.addEventListener('click', startGame);
  menuButton.addEventListener('click', returnToTitle);
  inventorySlotList.addEventListener('click', handleInventoryClick);

  // 방 안의 모든 오브젝트에 같은 클릭 핸들러를 등록
  const roomObjects = roomScene.querySelectorAll('.room-object');
  roomObjects.forEach((objectElement) => {
    objectElement.addEventListener('click', handleObjectClick);
  });
}

/* ---------- 8. 초기화 ---------- */
function init() {
  renderInventory();
  bindEvents();
  showScreen('title');
}

init();
