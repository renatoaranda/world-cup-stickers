export interface Sticker {
  id: string; // "BRA-10"
  code: string; // "BRA 10"
  number: number; // 10
  teamId: string; // "BRA"
  owned: boolean;
  duplicates: number;
  label?: string; // Optional sticker description (e.g. name of player)
}

export interface Team {
  id: string; // "BRA"
  name: string; // "Brasil"
  group: string; // "Grupo G" or "Especial"
  flag: string; // "🇧🇷"
}

export interface AlbumStats {
  total: number;
  owned: number;
  missing: number;
  duplicates: number;
  percent: number;
}

export type FilterType = 'all' | 'owned' | 'missing' | 'duplicates';
