// 실시간 멀티플레이어 Presence 서버 (WebSocket - Pure JS)
import { WebSocketServer, WebSocket } from 'ws';

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: Number(PORT) });

const players = new Map();

// 기본 닉네임 목록 (퇴근한 직장인 감성)
const NICKNAMES = [
  '퇴근길 김대리', '칼퇴 실패한 박과장', '새벽 퇴근러', '오늘도 버텼다',
  '퇴근 후 소주한잔', '조용한 혼술러', '소소한 위로', '내일도 출근',
  '야근 뒤 힐링', '달빛 아래 잔', '지친 하루 끝', '마지막 잔'
];

const SHIRT_COLORS = ['#ecf0f1', '#dff9fb', '#c7ecee', '#dcdde1', '#f5f6fa', '#dfe6e9'];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

console.log(`[혼술포차] 멀티플레이어 서버가 포트 ${PORT}에서 정상 시작되었습니다.`);

wss.on('connection', (ws) => {
  const playerId = 'user_' + Math.random().toString(36).substring(2, 9);
  ws.playerId = playerId;
  const nickname = getRandomItem(NICKNAMES) + ' #' + Math.floor(Math.random() * 900 + 100);
  const color = getRandomItem(SHIRT_COLORS);
  const characterType = 'salaryman';

  const initialPlayer = {
    id: playerId,
    nickname,
    color,
    characterType,
    position: [0, 0, 4.6],
    rotation: Math.PI,
    action: 'idle',
    seatedChairId: null,
    lastUpdate: Date.now()
  };

  players.set(playerId, initialPlayer);

  // 접속자에게 초기 상태 전달
  ws.send(JSON.stringify({
    type: 'init',
    player: initialPlayer,
    allPlayers: Array.from(players.values())
  }));

  // 다른 유저들에게 접속 알림
  broadcast({
    type: 'player_joined',
    player: initialPlayer
  }, playerId);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'update') {
        const player = players.get(playerId);
        if (player) {
          player.position = data.position || player.position;
          player.rotation = data.rotation !== undefined ? data.rotation : player.rotation;
          player.action = data.action || player.action;
          player.seatedChairId = data.seatedChairId !== undefined ? data.seatedChairId : player.seatedChairId;
          player.lastUpdate = Date.now();

          broadcast({
            type: 'player_updated',
            player
          }, playerId);
        }
      }
    } catch (e) {
      console.error('메시지 처리 오류:', e);
    }
  });

  ws.on('close', () => {
    players.delete(playerId);
    broadcast({
      type: 'player_left',
      id: playerId
    }, playerId);
  });
});

function broadcast(data, excludeId) {
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && (!excludeId || client.playerId !== excludeId)) {
      client.send(payload);
    }
  });
}

// 10초 주기 타임아웃 정리 (유령 플레이어 즉시 정리)
setInterval(() => {
  const now = Date.now();
  for (const [id, player] of players.entries()) {
    if (now - player.lastUpdate > 20000) {
      players.delete(id);
      broadcast({ type: 'player_left', id });
    }
  }
}, 10000);
