export type CharacterType = 'salaryman' | 'cat' | 'bear' | 'rabbit' | 'dog';
export type PlayerAction = 'idle' | 'walking' | 'sitting' | 'cheers' | 'pouring';

export interface Player {
  id: string;
  nickname: string;
  color: string;
  characterType: CharacterType;
  position: [number, number, number];
  rotation: number;
  action: PlayerAction;
  seatedChairId: string | null;
  lastUpdate?: number;
}

export interface ChairSlot {
  id: string;
  tableId: string;
  position: [number, number, number];
  rotation: number;
  isOccupied: boolean;
  occupiedBy?: string;
}
