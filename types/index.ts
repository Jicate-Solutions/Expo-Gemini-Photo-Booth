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
