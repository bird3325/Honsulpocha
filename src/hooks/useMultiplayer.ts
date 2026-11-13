import { useEffect, useRef, useState } from 'react';
import { Player, PlayerAction } from '../types';

interface UseMultiplayerProps {
  onMyPlayerCreated?: (player: Player) => void;
}

export const useMultiplayer = ({ onMyPlayerCreated }: UseMultiplayerProps) => {
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [otherPlayers, setOtherPlayers] = useState<Map<string, Player>>(new Map());
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);

  // 로컬 더미 닉네임 목록 (퇴근한 직장인 감성)
  const DUMMY_NAMES = ['퇴근길 김대리', '칼퇴 꿈나무', '야근 끝난 이주임', '퇴근 후 소주한잔'];

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:8080`;

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'init') {
            setMyPlayer(msg.player);
            if (onMyPlayerCreated) onMyPlayerCreated(msg.player);

            const map = new Map<string, Player>();
            (msg.allPlayers as Player[]).forEach((p) => {
              if (p.id !== msg.player.id) {
                map.set(p.id, p);
              }
            });
            setOtherPlayers(map);
          } else if (msg.type === 'player_joined') {
            setOtherPlayers((prev) => {
              const next = new Map(prev);
              next.set(msg.player.id, msg.player);
              return next;
            });
          } else if (msg.type === 'player_updated') {
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
        console.warn('웹소켓 서버 미실행 -> 로컬 감성 싱글플레이어 모드로 실행');
        setupOfflinePlayer();
      };

      ws.onclose = () => {
        setIsConnected(false);
      };
    } catch (e) {
      setupOfflinePlayer();
    }

    function setupOfflinePlayer() {
      if (myPlayer) return;
      const initial: Player = {
        id: 'me_offline',
        nickname: DUMMY_NAMES[Math.floor(Math.random() * DUMMY_NAMES.length)],
        color: '#ecf0f1',
        characterType: 'salaryman' as any,
        position: [0, 0, 4.6],
        rotation: Math.PI,
        action: 'idle',
        seatedChairId: null,
      };
      setMyPlayer(initial);
      if (onMyPlayerCreated) onMyPlayerCreated(initial);

      // 외롭지 않게 조용히 포차 자리에 앉아 혼술하는 다른 직장인들 (10개 테이블 합석 인터랙션용)
      const npc1: Player = {
        id: 'npc_1',
        nickname: '야근 뒤 박과장',
        color: '#dff9fb',
        characterType: 'salaryman' as any,
        position: [-2.95, 0, -1.7],
        rotation: -Math.PI / 2,
        action: 'sitting',
        seatedChairId: 't7_c4',
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
      };
      const npcs = new Map<string, Player>();
      npcs.set(npc1.id, npc1);
      npcs.set(npc2.id, npc2);
      npcs.set(npc3.id, npc3);
      npcs.set(npc4.id, npc4);
      npcs.set(npc5.id, npc5);
      setOtherPlayers(npcs);
    }

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
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
