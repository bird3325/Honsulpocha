import React from 'react';
import { Player } from '../types';
import { Avatar } from './Avatar';

interface OtherAvatarsProps {
  players: Map<string, Player>;
  myPlayerId?: string;
  myNickname?: string;
}

export const OtherAvatars: React.FC<OtherAvatarsProps> = ({ players, myPlayerId, myNickname }) => {
  return (
    <group>
      {Array.from(players.values())
        .filter((player) => {
          if (!player) return false;
          // 오프라인 더미 플레이어 제외
          if (player.id === 'me_offline') return false;
          // 본인 ID와 일치하는 플레이어 제외 (중복 방지)
          if (myPlayerId && player.id === myPlayerId) return false;
          // 본인 닉네임과 일치하는 플레이어 제외 (유령 세션/재접속 중복 닉네임 원천 차단)
          if (myNickname && player.nickname === myNickname) return false;
          return true;
        })
        .map((player) => (
          <Avatar
            key={player.id}
            nickname={player.nickname}
            color={player.color}
            characterType={player.characterType}
            position={player.position}
            rotation={player.rotation}
            action={player.action}
            isSeated={!!player.seatedChairId}
            isMe={false}
          />
        ))}
    </group>
  );
};
