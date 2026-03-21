export interface CropEvent {
  id: string;
  title: string;
  type: string;
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

