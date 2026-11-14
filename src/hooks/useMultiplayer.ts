import { useEffect, useRef, useState } from 'react';
import { Player, PlayerAction } from '../types';

interface UseMultiplayerProps {
  onMyPlayerCreated?: (player: Player) => void;
}

// 로컬 더미 닉네임 목록 (퇴근한 직장인 감성)
const DUMMY_NAMES = ['퇴근길 김대리', '칼퇴 꿈나무', '야근 끝난 이주임', '퇴근 후 소주한잔'];

// 기본 내 캐릭터 생성 함수 (모바일/오프라인에서도 0초 즉시 생성)
const createInitialPlayer = (): Player => ({
  id: 'me_offline',
  nickname: DUMMY_NAMES[Math.floor(Math.random() * DUMMY_NAMES.length)],
  color: '#ecf0f1',
  characterType: 'salaryman' as any,
  position: [0, 0, 4.6],
  rotation: Math.PI,
  action: 'idle',
  seatedChairId: null,
});

// 기본 포차 손님 NPC들 (10개 테이블에서 혼술하는 정겨운 샘플 손님들)
const createInitialNPCs = (): Map<string, Player> => {
  const npcs = new Map<string, Player>();

  const npc1: Player = {
    id: 'npc_1',
    nickname: '야근 뒤 박과장',
    color: '#dff9fb',
    characterType: 'salaryman' as any,
    position: [-2.95, 0, -1.7],
    rotation: -Math.PI / 2,
    action: 'sitting',
    seatedChairId: 't7_c4',
    isNpc: true,
  };
  const npc2: Player = {
    id: 'npc_2',
    nickname: '오늘도 버텼다',
    color: '#dcdde1',
    characterType: 'salaryman' as any,
    position: [2.95, 0, -1.7],
    rotation: Math.PI / 2,
    action: 'sitting',
    seatedChairId: 't8_c2',
    isNpc: true,
  };
  const npc3: Player = {
    id: 'npc_3',
    nickname: '외로운 김대리',
    color: '#f5cd79',
    characterType: 'salaryman' as any,
    position: [4.65, 0, 1.7],
    rotation: -Math.PI / 2,
    action: 'sitting',
    seatedChairId: 't4_c4',
    isNpc: true,
  };
  const npc4: Player = {
    id: 'npc_4',
    nickname: '칼퇴 꿈나무',
    color: '#e8bcb9',
    characterType: 'salaryman' as any,
    position: [2.95, 0, 0.0],
    rotation: Math.PI / 2,
    action: 'sitting',
    seatedChairId: 't6_c2',
    isNpc: true,
  };
  const npc5: Player = {
    id: 'npc_5',
    nickname: '새벽 감성 송주임',
    color: '#b8e994',
    characterType: 'salaryman' as any,
    position: [-4.65, 0, -3.2],
    rotation: Math.PI / 2,
    action: 'sitting',
    seatedChairId: 't9_c2',
    isNpc: true,
  };

  npcs.set(npc1.id, npc1);
  npcs.set(npc2.id, npc2);
  npcs.set(npc3.id, npc3);
  npcs.set(npc4.id, npc4);
  npcs.set(npc5.id, npc5);
  return npcs;
};

export const useMultiplayer = ({ onMyPlayerCreated }: UseMultiplayerProps) => {
  // ★ 핵심: 초기 상태부터 null이 아닌 즉각적인 기본 플레이어 및 손님 NPC를 세팅하여 모바일 로딩 지연/실종 완전 차단
  const [myPlayer, setMyPlayer] = useState<Player>(createInitialPlayer);
  const [otherPlayers, setOtherPlayers] = useState<Map<string, Player>>(createInitialNPCs);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);
  const myPlayerRef = useRef<Player>(myPlayer);
  myPlayerRef.current = myPlayer;

  useEffect(() => {
    // 0초 즉시 초기 플레이어 콜백 전달
    if (onMyPlayerCreated && myPlayer) {
      onMyPlayerCreated(myPlayer);
    }

    // 웹소켓 연결 시도 (모바일 환경 등에서 8080 포트 차단/대기 상태여도 위 기본 캐릭터로 즉각 플레이 가능)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:8080`;

    let ws: WebSocket | null = null;
    let connectTimeout: any = null;

    try {
      ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      // 1.5초 이상 응답 없으면 타임아웃하여 모바일 브라우저 소켓 블로킹 방지
      connectTimeout = setTimeout(() => {
        if (ws && ws.readyState !== WebSocket.OPEN) {
          try {
            ws.close();
          } catch (err) {}
        }
      }, 1500);

      ws.onopen = () => {
        if (connectTimeout) clearTimeout(connectTimeout);
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'init') {
            setMyPlayer(msg.player);
            myPlayerRef.current = msg.player;
            if (onMyPlayerCreated) onMyPlayerCreated(msg.player);

            const map = new Map<string, Player>();
            // 본인 아이디 및 본인 닉네임은 절대 otherPlayers에 포함하지 않음 (중복 및 유령 캐릭터 원천 차단)
            const realUsers = (msg.allPlayers as Player[]).filter(
              (p) =>
                p.id !== msg.player.id &&
                p.id !== 'me_offline' &&
                (!msg.player.nickname || p.nickname !== msg.player.nickname)
            );
            realUsers.forEach((p) => {
              map.set(p.id, p);
            });

            // ★ 접속자 수에 따른 샘플 NPC 자동 퇴장 로직:
            // 실제 유저 접속자(나 포함) 수만큼 샘플 NPC를 하나씩 포차 밖으로 귀가(제거)시킴
            const totalRealUsers = realUsers.length + 1; // 나 포함
            const allNpcList = Array.from(createInitialNPCs().values());
            // 실제 유저가 늘어날 때마다 샘플 NPC가 자리를 양보하며 퇴장
            const remainingNpcs = allNpcList.slice(Math.max(0, totalRealUsers - 1));

            remainingNpcs.forEach((npc) => {
              if (!map.has(npc.id)) {
                map.set(npc.id, npc);
              }
            });

            setOtherPlayers(map);
          } else if (msg.type === 'player_joined') {
            // 본인 캐릭터(ID 또는 닉네임 일치)가 브로드캐스트로 돌아와 중복 렌더링되는 현상 차단
            if (
              !msg.player ||
              msg.player.id === myPlayerRef.current?.id ||
              msg.player.id === 'me_offline' ||
              (myPlayerRef.current?.nickname && msg.player.nickname === myPlayerRef.current.nickname)
            ) {
              return;
            }

            setOtherPlayers((prev) => {
              const next = new Map(prev);
              next.set(msg.player.id, msg.player);

              // 실제 유저가 새로 접속하면 기존에 앉아있던 샘플 NPC를 1명씩 포차에서 자동으로 퇴장(자리 양보)
              for (const [key, p] of next.entries()) {
                if (p.isNpc) {
                  next.delete(key);
                  break; // 1명 퇴장
                }
              }

              return next;
            });
          } else if (msg.type === 'player_updated') {
            // 본인 캐릭터(ID 또는 닉네임 일치)의 위치 업데이트가 otherPlayers에 반영되어 겹치는 현상 차단
            if (
              !msg.player ||
              msg.player.id === myPlayerRef.current?.id ||
              msg.player.id === 'me_offline' ||
              (myPlayerRef.current?.nickname && msg.player.nickname === myPlayerRef.current.nickname)
            ) {
              return;
            }

            setOtherPlayers((prev) => {
              const next = new Map(prev);
              next.set(msg.player.id, msg.player);
              return next;
            });
          } else if (msg.type === 'player_left') {
            setOtherPlayers((prev) => {
              const next = new Map(prev);
              next.delete(msg.id);
              return next;
            });
          }
        } catch (e) {
          console.error('웹소켓 메시지 파싱 에러:', e);
        }
      };

      ws.onerror = () => {
        if (connectTimeout) clearTimeout(connectTimeout);
      };

      ws.onclose = () => {
        if (connectTimeout) clearTimeout(connectTimeout);
        setIsConnected(false);
      };
    } catch (e) {
      // 오프라인 모드 유지
    }

    return () => {
      if (connectTimeout) clearTimeout(connectTimeout);
      if (ws) {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          try {
            ws.close();
          } catch (e) {}
        }
      }
    };
  }, []);

  const sendUpdate = (
    position: [number, number, number],
    rotation: number,
    action: PlayerAction,
    seatedChairId: string | null
  ) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'update',
          position,
          rotation,
          action,
          seatedChairId,
        })
      );
    }
  };

  return {
    myPlayer,
    setMyPlayer,
    otherPlayers,
    isConnected,
    sendUpdate,
  };
};
