export type AppScreen =
  | 'landing'
  | 'camera'
  | 'userInfo'
  | 'themeSelection'
  | 'loading'
  | 'result'
  | 'error';

export type ThemeType = 'fun' | 'career' | 'custom';
export type CareerStyle = 'photorealistic' | 'artistic';

export interface Theme {
  id: string;
  title: string;
  prompt: string;
  type: ThemeType;
  bgImage?: string;
  emoji?: string;
  category?: string;
}

export interface UserInfo {
  name: string;
  mobile: string;
  group: string;
  groupId?: string;
}

export interface AppState {
  screen: AppScreen;
  capturedPhoto: string | null;
  selectedTheme: Theme | null;
  careerStyle: CareerStyle;
  customPrompt: string;
  transformedImageUrl: string | null;
  userInfo: UserInfo | null;
  errorMessage: string;
  referenceImages: string[];
}

// ── Expo Tracking Types ──

export interface Expo {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  venue: string | null;
  start_date: string;
  end_date: string;
  username: string;
  is_active: boolean;
  metadata: Record<string, unknown>;
}

export interface Group {
  id: string;
  created_at: string;
  expo_id: string;
  name: string;
  is_active: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  is_active: boolean;
}

export interface BoothSession {
  type: 'expo' | 'admin';
  expoId: string;
  expoName: string;
  username: string;
  sessionToken: string;
}

export interface ExpoStats {
  expo: Pick<Expo, 'id' | 'name' | 'venue' | 'start_date' | 'end_date'>;
  summary: {
    total_photos: number;
    unique_visitors: number;
    total_groups: number;
    avg_photos_per_visitor: number;
  };
  theme_breakdown: { type: string; count: number }[];
  top_themes: { theme: string; type: string; count: number }[];
  group_breakdown: { id: string; name: string; photo_count: number; visitor_count: number }[];
  daily_activity: { date: string; count: number }[];
}

export interface ExpoOverview {
  id: string;
  name: string;
  venue: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  total_photos: number;
  unique_visitors: number;
  group_count: number;
}
