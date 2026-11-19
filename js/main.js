/* ==========================================================
   Find My Cat - main.js

   구조
   1. 게임 데이터   : 방과 오브젝트 정보 (화면과 분리된 "내용")
   2. 게임 상태     : 현재 화면, 현재 방 등 "지금 게임이 어떤 상태인지"
   3. DOM 요소      : 자주 사용하는 HTML 요소를 미리 찾아 둠
   4. 화면 전환     : 메인 화면 <-> 게임 화면
   5. 방 & 대화창   : 오브젝트 조사, 대화창 출력
   6. 인벤토리      : 아이템 획득·선택·사용·삭제
   7. 퍼즐          : 비밀번호 자물쇠
   8. 이벤트 연결   : addEventListener 로 클릭 이벤트 등록
   9. 초기화
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
          '책상 서랍은 잠겨 있다.\n열쇠 구멍 옆에 작은 고양이 무늬가 새겨져 있다.',
          '고양이 무늬 열쇠 구멍... 맞는 열쇠가 있으면 열 수 있을 것 같다.',
        ],
        // itemUses : 이 오브젝트에 사용할 수 있는 아이템 (key = ITEMS 의 key)
        //   flag        : 사용에 성공하면 켜지는 플래그 (gameState.flags)
        //   consumeItem : true 면 사용한 아이템이 인벤토리에서 사라짐
        //   rewardItem  : 사용 결과로 얻는 아이템 (생략 가능)
        itemUses: {
          key: {
            flag: 'deskDrawerOpened',
            consumeItem: true,
            rewardItem: 'diary',
            text: '고양이 무늬 열쇠를 꽂고 돌리자 "딸깍" 하고 서랍이 열렸다.\n안에 낡은 일기장이 들어 있다.',
          },
        },
        // afterFlag : 해당 플래그가 켜진 뒤에는 descriptions 대신 이 대사를 보여줌
        afterFlag: {
          flag: 'deskDrawerOpened',
          text: '열린 책상 서랍. 이제 안에는 아무것도 없다.',
        },
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
          '사진 아래 구석에 작은 글씨가 적혀 있다.\n"3월 14일, 보리 & 콩이 우리 집에 온 날"',
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
        // puzzle : 조사하면 비밀번호 입력창이 열림
        puzzle: {
          answer: '0314',
          flag: 'doorUnlocked',
          successText: '철컥! 자물쇠가 풀렸다.\n문틈 너머로 작게 방울 소리가 들린다... 보리 목걸이 소리다!',
          failText: '삑- 비밀번호가 틀렸다.',
        },
        afterFlag: {
          flag: 'doorUnlocked',
          text: '문이 열려 있다. 복도 쪽에서 방울 소리가 들린다.\n(다음 방은 준비 중입니다)',
        },
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
  diary: {
    name: '낡은 일기장',
    description: '"방문 비밀번호를 바꿨다. 보리랑 콩이가 우리 집에 온 날로. 잊지 말 것!"',
    icon: 'item-diary',
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
  inventory: [],            // 지금 가지고 있는 아이템 ID 목록 (예: ['note', 'key'])
  obtainedItems: [],        // 한 번이라도 얻은 아이템 (사용해서 사라져도 다시 줍지 않도록)
  selectedItemId: null,     // 인벤토리에서 선택한 아이템 (사용 대기 중)
  flags: {},                // 진행 플래그 (예: { deskDrawerOpened: true })
  activePuzzleObjectId: null, // 비밀번호 창이 열려 있는 오브젝트 ID
  codeInput: '',            // 비밀번호 창에 입력 중인 숫자
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

const codeLock = document.querySelector('#code-lock');
const codeLockPanel = codeLock.querySelector('.code-lock-panel');
const codeLockDigits = codeLock.querySelectorAll('.code-digit');
const codeLockMessage = document.querySelector('#code-lock-message');
const codeLockKeys = document.querySelector('#code-lock-keys');
const codeLockCloseButton = document.querySelector('#code-lock-close');

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
  gameState.obtainedItems = [];
  gameState.selectedItemId = null;
  gameState.flags = {};
  closeCodeLock();
  renderInventory();
  renderObjectStates();

  showScreen('game');
  enterRoom(gameState.currentRoomId);
}

/** 메뉴 버튼: 메인 화면으로 돌아갑니다. */
function returnToTitle() {
  closeCodeLock();
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
 * 인벤토리에서 아이템을 선택한 상태라면 조사 대신 아이템을 사용합니다.
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

  // 0) 아이템을 들고 있다면 → 아이템 사용
  if (gameState.selectedItemId) {
    useItemOnObject(gameState.selectedItemId, objectId);
    return;
  }

  // 1) 지금까지 이 오브젝트를 몇 번 조사했는지 가져오기 (처음이면 기록이 없으므로 0)
  const inspectCount = getInspectCount(objectId);

  // 2) 이미 해결한 오브젝트(플래그가 켜짐)라면 afterFlag 대사,
  //    아니면 조사 횟수를 대사 번호로 사용하되, 대사 개수를 넘어가면 마지막 대사에 고정
  //    예) 대사 3개 → 조사 0,1,2회차는 0,1,2번 대사 / 3회차 이후는 계속 2번 대사
  const isSolved = roomObject.afterFlag && hasFlag(roomObject.afterFlag.flag);
  let dialogue;

  if (isSolved) {
    dialogue = roomObject.afterFlag.text;
  } else {
    const lastIndex = roomObject.descriptions.length - 1;
    const descriptionIndex = Math.min(inspectCount, lastIndex);
    dialogue = roomObject.descriptions[descriptionIndex];
  }

  // 3) 아이템이 있는 오브젝트라면 획득 시도 (한 번 얻은 아이템은 다시 얻지 않음)
  if (roomObject.item && !hasObtainedItem(roomObject.item) && addItem(roomObject.item)) {
    dialogue += `\n▶ [${ITEMS[roomObject.item].name}] 을(를) 획득했다!`;
  }

  // 4) 화면에 출력
  showDialogue(roomObject.name, dialogue);

  // 5) 조사 횟수 1 증가 → 다음 클릭 때 다음 대사가 나옴
  gameState.inspectCounts[objectId] = inspectCount + 1;

  // 6) 아직 풀지 않은 퍼즐이 달린 오브젝트면 비밀번호 창 열기
  if (roomObject.puzzle && !isSolved) {
    openCodeLock(objectId);
  }
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

/** 플래그가 켜져 있는지 확인합니다. */
function hasFlag(flagName) {
  return gameState.flags[flagName] === true;
}

/** 플래그를 켜고, 오브젝트 겉모습을 갱신합니다. */
function setFlag(flagName) {
  gameState.flags[flagName] = true;
  renderObjectStates();
}

/**
 * afterFlag 가 켜진(= 해결된) 오브젝트에 .is-solved 클래스를 붙입니다.
 * CSS 에서 이 클래스로 "열린 문", "풀린 자물쇠" 같은 모습을 표현합니다.
 */
function renderObjectStates() {
  const room = ROOMS[gameState.currentRoomId];

  roomScene.querySelectorAll('.room-object').forEach((objectElement) => {
    const roomObject = room.objects[objectElement.dataset.objectId];
    const isSolved = Boolean(roomObject?.afterFlag && hasFlag(roomObject.afterFlag.flag));
    objectElement.classList.toggle('is-solved', isSolved);
  });
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

/** 한 번이라도 얻은 적이 있는 아이템인지 확인합니다. */
function hasObtainedItem(itemId) {
  return gameState.obtainedItems.includes(itemId);
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
  gameState.obtainedItems.push(itemId);
  renderInventory(itemId);
  return true;
}

/**
 * 인벤토리에서 아이템을 제거합니다.
 * @param {string} itemId
 */
function removeItem(itemId) {
  gameState.inventory = gameState.inventory.filter((ownedItemId) => ownedItemId !== itemId);

  if (gameState.selectedItemId === itemId) {
    gameState.selectedItemId = null;
  }

  renderInventory();
}

/**
 * 아이템을 선택합니다. 같은 아이템을 다시 누르면 선택이 해제됩니다.
 * @param {string} itemId
 */
function selectItem(itemId) {
  const item = ITEMS[itemId];

  if (gameState.selectedItemId === itemId) {
    clearSelectedItem();
    showDialogue(item.name, `${item.description}\n(선택 해제)`);
    return;
  }

  gameState.selectedItemId = itemId;
  renderInventory();
  showDialogue(item.name, `${item.description}\n▶ 사용할 곳을 클릭해 보자.`);
}

/** 아이템 선택을 해제합니다. */
function clearSelectedItem() {
  gameState.selectedItemId = null;
  renderInventory();
}

/**
 * 선택한 아이템을 오브젝트에 사용합니다.
 * 사용 규칙은 ROOMS 데이터의 itemUses 에 적어 둡니다.
 * @param {string} itemId
 * @param {string} objectId
 */
function useItemOnObject(itemId, objectId) {
  const roomObject = ROOMS[gameState.currentRoomId].objects[objectId];
  const item = ITEMS[itemId];
  const itemUse = roomObject.itemUses?.[itemId];

  // 사용 시도가 끝나면 성공·실패와 상관없이 선택 해제
  clearSelectedItem();

  // 쓸 수 없는 조합이거나 이미 사용한 경우
  if (!itemUse || hasFlag(itemUse.flag)) {
    showDialogue('나', `[${item.name}] 은(는) ${roomObject.name}에 쓸 수 없을 것 같다.`);
    return;
  }

  let dialogue = itemUse.text;

  if (itemUse.consumeItem) {
    removeItem(itemId);
  }

  if (itemUse.rewardItem && addItem(itemUse.rewardItem)) {
    dialogue += `\n▶ [${ITEMS[itemUse.rewardItem].name}] 을(를) 획득했다!`;
  }

  setFlag(itemUse.flag);
  showDialogue(roomObject.name, dialogue);
}

/**
 * gameState.inventory 를 기준으로 인벤토리 슬롯 전체를 다시 그립니다.
 * @param {string} [newItemId] - 방금 얻은 아이템 ID (강조 애니메이션용, 생략 가능)
 */
function renderInventory(newItemId) {
  inventorySlotList.innerHTML = '';

  // 아이템을 들고 있는 동안 방 안의 커서 모양을 바꾸기 위한 클래스
  roomScene.classList.toggle('is-using-item', Boolean(gameState.selectedItemId));

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

      if (itemId === gameState.selectedItemId) {
        slotElement.classList.add('is-selected');
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

  selectItem(slotElement.dataset.itemId);
}

/* ---------- 7. 퍼즐: 비밀번호 자물쇠 ---------- */
// 입력 중인 숫자는 gameState.codeInput 에 저장하고, renderCodeLock() 으로 화면에 반영합니다.

/**
 * 비밀번호 입력창을 엽니다.
 * @param {string} objectId - puzzle 데이터가 있는 오브젝트 ID
 */
function openCodeLock(objectId) {
  gameState.activePuzzleObjectId = objectId;
  gameState.codeInput = '';
  codeLockMessage.textContent = '숫자 4자리를 입력하세요.';
  renderCodeLock();
  codeLock.hidden = false;
}

/** 비밀번호 입력창을 닫습니다. */
function closeCodeLock() {
  gameState.activePuzzleObjectId = null;
  gameState.codeInput = '';
  codeLock.hidden = true;
}

/** 입력창이 열려 있는지 확인합니다. */
function isCodeLockOpen() {
  return gameState.activePuzzleObjectId !== null;
}

/** 현재 입력값을 4칸 표시창에 그립니다. */
function renderCodeLock() {
  codeLockDigits.forEach((digitElement, index) => {
    digitElement.textContent = gameState.codeInput[index] ?? '';
    digitElement.classList.toggle('is-filled', index < gameState.codeInput.length);
  });
}

/**
 * 키패드 입력을 처리합니다.
 * @param {string} key - '0'~'9', 'delete', 'enter'
 */
function pressCodeKey(key) {
  const { answer } = getActivePuzzle();

  if (key === 'delete') {
    gameState.codeInput = gameState.codeInput.slice(0, -1);
  } else if (key === 'enter') {
    submitCode();
    return;
  } else if (gameState.codeInput.length < answer.length) {
    gameState.codeInput += key;
  }

  renderCodeLock();
}

/** 지금 열려 있는 퍼즐 데이터를 가져옵니다. */
function getActivePuzzle() {
  const room = ROOMS[gameState.currentRoomId];
  return room.objects[gameState.activePuzzleObjectId].puzzle;
}

/** 입력한 비밀번호가 맞는지 판정합니다. */
function submitCode() {
  const objectId = gameState.activePuzzleObjectId;
  const roomObject = ROOMS[gameState.currentRoomId].objects[objectId];
  const puzzle = roomObject.puzzle;

  if (gameState.codeInput.length < puzzle.answer.length) {
    codeLockMessage.textContent = `숫자 ${puzzle.answer.length}자리를 모두 입력하세요.`;
    return;
  }

  // 정답
  if (gameState.codeInput === puzzle.answer) {
    closeCodeLock();
    setFlag(puzzle.flag);
    showDialogue(roomObject.name, puzzle.successText);
    return;
  }

  // 오답: 패널을 흔들고 입력 초기화
  codeLockMessage.textContent = puzzle.failText;
  gameState.codeInput = '';
  renderCodeLock();

  codeLockPanel.classList.remove('is-wrong');
  void codeLockPanel.offsetWidth; // 애니메이션을 처음부터 다시 재생하기 위한 트릭 (reflow)
  codeLockPanel.classList.add('is-wrong');
}

/** 키패드 버튼 클릭 (이벤트 위임) */
function handleCodeKeyClick(event) {
  const keyButton = event.target.closest('[data-key]');

  if (keyButton) {
    pressCodeKey(keyButton.dataset.key);
  }
}

/** 키보드로도 입력할 수 있게 합니다. (숫자, Backspace, Enter, Esc) */
function handleKeydown(event) {
  if (!isCodeLockOpen()) {
    return;
  }

  if (/^[0-9]$/.test(event.key)) {
    pressCodeKey(event.key);
  } else if (event.key === 'Backspace') {
    pressCodeKey('delete');
  } else if (event.key === 'Enter') {
    event.preventDefault(); // 포커스된 버튼이 한 번 더 눌리는 것 방지
    pressCodeKey('enter');
  } else if (event.key === 'Escape') {
    closeCodeLock();
  }
}

/* ---------- 8. 이벤트 연결 ---------- */
function bindEvents() {
  startButton.addEventListener('click', startGame);
  menuButton.addEventListener('click', returnToTitle);
  inventorySlotList.addEventListener('click', handleInventoryClick);
  codeLockKeys.addEventListener('click', handleCodeKeyClick);
  codeLockCloseButton.addEventListener('click', closeCodeLock);
  document.addEventListener('keydown', handleKeydown);

  // 방 안의 모든 오브젝트에 같은 클릭 핸들러를 등록
  const roomObjects = roomScene.querySelectorAll('.room-object');
  roomObjects.forEach((objectElement) => {
    objectElement.addEventListener('click', handleObjectClick);
  });
}

/* ---------- 9. 초기화 ---------- */
function init() {
  renderInventory();
  bindEvents();
  showScreen('title');
}

init();
