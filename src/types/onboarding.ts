export interface OnboardingData {
  name: string;
  profiles: string[];
  customReason: string;
  zone: string | null;
  location: string;
  // Personality sliders (0-100)
  plannerScore: number; // 0 = spontan, 100 = planerare
  timeScore: number; // 0 = minimal tid, 100 = mycket tid
  resultVsJoyScore: number; // 0 = glädjen i processen, 100 = resultatet
}

export const DEFAULT_ONBOARDING: OnboardingData = {
  name: "",
  profiles: [],
  customReason: "",
  zone: null,
  location: "",
  plannerScore: 50,
  timeScore: 50,
  resultVsJoyScore: 50,
};
