export type CharacterType = 'salaryman' | 'cat' | 'bear' | 'rabbit' | 'dog';
export type PlayerAction = 'idle' | 'walking' | 'sitting' | 'cheers' | 'pouring';
export type WeatherMood = 'rainy' | 'snowy' | 'sunset' | 'starry';

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

export interface PochaMenuItem {
  id: string;
  name: string;
  category: 'drink' | 'food';
  price: string;
  desc: string;
  icon: string;
  hanja?: string;
  section?: 'drink' | 'beverage' | 'meal' | 'stew' | 'snack';
}

export interface ServingOrder {
  item: PochaMenuItem;
  targetPos: [number, number, number];
  tableName?: string;
  tableId?: string;
}
