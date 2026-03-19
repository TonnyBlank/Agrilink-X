export interface CropEvent {
  id: number;
  title: string;
  type: 'planting' | 'fertilizing' | 'spraying' | 'harvesting' | 'irrigation' | 'pruning';
  date: Date;
  crop: string;
  done: boolean;
  notes?: string;
}

export type CropType = CropEvent['type'];

export interface WeatherAlert {
  date: string;
  condition: string;
  recommendation: string;
}

