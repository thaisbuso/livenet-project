export type Session = {
  id: string;
  title: string;
  is_live: boolean;
  created_at: string;
  ended_at: string | null;
};

export type Position = {
  id: string;
  session_id: string;
  lat: number;
  lng: number;
  speed_knots: number | null;
  heading: number | null;
  source: string | null;
  created_at: string;
};