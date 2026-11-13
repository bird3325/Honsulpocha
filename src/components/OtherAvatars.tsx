import React from 'react';
import { Player } from '../types';
import { Avatar } from './Avatar';

interface OtherAvatarsProps {
  players: Map<string, Player>;
}

export const OtherAvatars: React.FC<OtherAvatarsProps> = ({ players }) => {
  return (
    <group>
      {Array.from(players.values()).map((player) => (
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
