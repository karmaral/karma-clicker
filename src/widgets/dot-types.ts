export type DotType = 'normal' | 'big';

export interface DotTypeDef {
  label: string;
  scaleFactor: number;
}

export const DOT_TYPES: Record<DotType, DotTypeDef> = {
  normal: { label: 'Normal', scaleFactor: 1 },
  big: { label: 'Big', scaleFactor: 1.5 },
};

export const DOT_TYPE_KEYS = Object.keys(DOT_TYPES) as DotType[];
