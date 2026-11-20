/**
 * Reels Contest ("Impact Reel Challenge") — shared by the public QR page (browser) and the API (server).
 * Questions come from the Erode Marathon plan, Sections 5–7 (highlighted items left out).
 * No server-only imports here.
 */

export type Lang = 'en' | 'ta';
export type Label = { en: string; ta: string };
export type Option = { id: string; label: Label };

/** Code prefix → '#ERDMRTHN001'. An expo can override it with metadata.reels_code_prefix. */
export const DEFAULT_CODE_PREFIX = 'ERDMRTHN';

/** Hashtags every reel caption must carry (besides the personal code). */
export const CONTEST_HASHTAGS = ['#ERODEMARATHON2026', '#DrugFreeTN'];

/**
 * Official accounts to tag. Placeholders in the plan — fill in before launch
 * (or set expo metadata.reels_handles = ["@yi_handle", "@jkkn_handle"]).
 */
export const DEFAULT_TAG_HANDLES = ['@YoungIndians', '@JKKN'];

export const AGE_GROUPS: Option[] = [
  { id: 'under_18', label: { en: 'Under 18', ta: '18 வயதுக்குக் கீழ்' } },
  { id: '18_25', label: { en: '18–25', ta: '18–25' } },
  { id: '26_40', label: { en: '26–40', ta: '26–40' } },
  { id: '41_60', label: { en: '41–60', ta: '41–60' } },
  { id: '60_plus', label: { en: '60+', ta: '60+' } },
];

export const GENDERS: Option[] = [
  { id: 'male', label: { en: 'Male', ta: 'ஆண்' } },
  { id: 'female', label: { en: 'Female', ta: 'பெண்' } },
  { id: 'other', label: { en: 'Other', ta: 'மற்றவை' } },
];

export const AREAS: Option[] = [
  { id: 'erode_town', label: { en: 'Erode town', ta: 'ஈரோடு நகரம்' } },
  { id: 'nearby_town', label: { en: 'Nearby town', ta: 'அருகிலுள்ள ஊர்' } },
  { id: 'outside_district', label: { en: 'Outside district', ta: 'மாவட்டத்திற்கு வெளியே' } },
];

export const PARTICIPANT_TYPES: Option[] = [
  { id: 'student', label: { en: 'Student', ta: 'மாணவர்' } },
  { id: 'working_professional', label: { en: 'Working professional', ta: 'பணியாளர்' } },
  { id: 'parent', label: { en: 'Parent', ta: 'பெற்றோர்' } },
  { id: 'teacher', label: { en: 'Teacher', ta: 'ஆசிரியர்' } },
  { id: 'others', label: { en: 'Others', ta: 'மற்றவர்' } },
];

/** One survey question. `showFor` limits it to a participant type (Sections C and D). */
export interface SurveyQuestion {
  id: string;
  section: 'B' | 'C' | 'D' | 'E';
  showFor?: 'parent' | 'student';
  text: Label;
  /** No options = short free-text answer */
  options?: Option[];
  /** Several answers allowed (stored as a list) */
  multi?: boolean;
  /** Shown as a single pledge tick box (answer 'yes') */
  pledge?: boolean;
}

const YES = { id: 'yes', label: { en: 'Yes', ta: 'ஆம்' } };
const NO = { id: 'no', label: { en: 'No', ta: 'இல்லை' } };

/** Pledge text from the plan (Section E). */
export const PLEDGE_TEXT = {
  ta: 'நான் போதையில்லா தமிழ்நாட்டுக்காக உறுதி எடுக்கிறேன்.',
  en: 'I pledge for a Drug-Free Tamil Nadu.',
};

export const SURVEY: SurveyQuestion[] = [
  // Section B — all participants
  {
    id: 'first_exposure', section: 'B',
    text: { en: 'Where do you think young people first come across drugs?', ta: 'இளைஞர்கள் முதன்முதலில் போதைப்பொருளை எங்கே சந்திக்கிறார்கள் என்று நினைக்கிறீர்கள்?' },
    options: [
      { id: 'friends', label: { en: 'Friends', ta: 'நண்பர்கள்' } },
      { id: 'social_media', label: { en: 'Social media', ta: 'சமூக ஊடகம்' } },
      { id: 'nearby_shops', label: { en: 'Nearby shops', ta: 'அருகிலுள்ள கடைகள்' } },
      { id: 'campus_surroundings', label: { en: 'College or school surroundings', ta: 'கல்லூரி / பள்ளி சுற்றுப்புறம்' } },
      { id: 'not_sure', label: { en: 'Not sure', ta: 'தெரியவில்லை' } },
      { id: 'other', label: { en: 'Other', ta: 'மற்றவை' } },
    ],
  },
  // Section C — parents and guardians only
  {
    id: 'talk_frequency', section: 'C', showFor: 'parent',
    text: { en: 'How often do you talk with your child about their friends and daily activities?', ta: 'உங்கள் குழந்தையின் நண்பர்கள் மற்றும் அன்றாட செயல்பாடுகள் பற்றி எவ்வளவு அடிக்கடி பேசுகிறீர்கள்?' },
    options: [
      { id: 'daily', label: { en: 'Daily', ta: 'தினமும்' } },
      { id: 'weekly', label: { en: 'Weekly', ta: 'வாரந்தோறும்' } },
      { id: 'rarely', label: { en: 'Rarely', ta: 'அரிதாக' } },
      { id: 'never', label: { en: 'Never', ta: 'ஒருபோதும் இல்லை' } },
    ],
  },
  {
    id: 'discussed_risks', section: 'C', showFor: 'parent',
    text: { en: 'Have you ever talked to your child about the risks of drugs and addiction?', ta: 'போதைப்பொருள் மற்றும் அடிமைத்தனத்தின் ஆபத்துகள் பற்றி உங்கள் குழந்தையிடம் பேசியிருக்கிறீர்களா?' },
    options: [
      { id: 'regularly', label: { en: 'Yes, regularly', ta: 'ஆம், தொடர்ந்து' } },
      { id: 'once', label: { en: 'Once', ta: 'ஒருமுறை' } },
      NO,
      { id: 'not_sure_how', label: { en: 'Not sure how to start', ta: 'எப்படி தொடங்குவது தெரியவில்லை' } },
    ],
  },
  {
    id: 'notice_confidence', section: 'C', showFor: 'parent',
    text: { en: 'How confident are you that you would notice if your child was exposed to drugs?', ta: 'உங்கள் குழந்தை போதைப்பொருளுக்கு ஆளானால் அதைக் கவனிப்பீர்கள் என்று எவ்வளவு நம்பிக்கை?' },
    options: [
      { id: 'very', label: { en: 'Very confident', ta: 'மிகுந்த நம்பிக்கை' } },
      { id: 'somewhat', label: { en: 'Somewhat', ta: 'ஓரளவு' } },
      { id: 'not', label: { en: 'Not confident', ta: 'நம்பிக்கை இல்லை' } },
    ],
  },
  // Section D — students and youth only
  {
    id: 'awareness_session', section: 'D', showFor: 'student',
    text: { en: 'Have you received any awareness session on drugs at your school or college?', ta: 'உங்கள் பள்ளி அல்லது கல்லூரியில் போதைப்பொருள் விழிப்புணர்வு அமர்வு நடந்ததா?' },
    options: [YES, NO],
  },
  {
    id: 'stay_away_help', section: 'D', showFor: 'student',
    text: { en: 'What would help you most to stay away from drugs?', ta: 'போதையிலிருந்து விலகியிருக்க உங்களுக்கு எது அதிகம் உதவும்?' },
    options: [
      { id: 'sports', label: { en: 'Sports', ta: 'விளையாட்டு' } },
      { id: 'mentoring', label: { en: 'Mentoring', ta: 'வழிகாட்டுதல்' } },
      { id: 'counselling', label: { en: 'Counselling', ta: 'ஆலோசனை' } },
      { id: 'peer_support', label: { en: 'Peer support group', ta: 'நண்பர் ஆதரவுக் குழு' } },
      { id: 'awareness_events', label: { en: 'Awareness events', ta: 'விழிப்புணர்வு நிகழ்ச்சிகள்' } },
    ],
  },
  // Section E — contribution (all participants)
  {
    id: 'contribute', section: 'E', multi: true,
    text: { en: 'How would you like to contribute to a Drug Free TN? (choose any)', ta: 'போதையில்லா தமிழ்நாட்டுக்கு எப்படி பங்களிக்க விரும்புகிறீர்கள்? (பல தேர்வு)' },
    options: [
      { id: 'volunteer', label: { en: 'Volunteer at future events', ta: 'எதிர்கால நிகழ்வுகளில் தன்னார்வலர்' } },
      { id: 'ambassador', label: { en: 'Become an awareness ambassador in my college/workplace', ta: 'என் கல்லூரி/பணியிடத்தில் விழிப்புணர்வு தூதர்' } },
      { id: 'social_media', label: { en: 'Spread the message on social media', ta: 'சமூக ஊடகத்தில் செய்தியைப் பரப்புவேன்' } },
      { id: 'support_counselling', label: { en: 'Support counselling or rehabilitation initiatives', ta: 'ஆலோசனை / மறுவாழ்வு முயற்சிகளுக்கு ஆதரவு' } },
      { id: 'organise_talk', label: { en: 'Organise a talk in my neighbourhood', ta: 'என் பகுதியில் ஒரு உரை ஏற்பாடு' } },
      { id: 'donate', label: { en: 'Donate to the campaign', ta: 'இயக்கத்திற்கு நன்கொடை' } },
      { id: 'report', label: { en: 'Report suspicious activity responsibly', ta: 'சந்தேகமான செயல்களைப் பொறுப்புடன் தெரிவிப்பேன்' } },
    ],
  },
  {
    id: 'time_per_month', section: 'E',
    text: { en: 'How much time can you give per month?', ta: 'மாதத்திற்கு எவ்வளவு நேரம் கொடுக்க முடியும்?' },
    options: [
      { id: 'none', label: { en: 'None', ta: 'இல்லை' } },
      { id: '1_2', label: { en: '1-2 hours', ta: '1-2 மணி நேரம்' } },
      { id: '3_5', label: { en: '3-5 hours', ta: '3-5 மணி நேரம்' } },
      { id: 'more', label: { en: 'More', ta: 'அதற்கு மேல்' } },
    ],
  },
  {
    id: 'pledge', section: 'E', pledge: true,
    text: { en: 'Take the pledge', ta: 'உறுதிமொழி எடுங்கள்' },
    options: [{ id: 'yes', label: { en: 'Pledged', ta: 'உறுதி எடுத்தேன்' } }],
  },
];

export function surveyFor(participantType?: string): SurveyQuestion[] {
  return SURVEY.filter(q => !q.showFor || q.showFor === participantType);
}

/** Help lines shown after the survey (verify before the event). */
export const HELPLINES = [
  { number: '10581', label: { en: 'Tamil Nadu Police anti-drug helpline', ta: 'தமிழ்நாடு காவல்துறை போதை ஒழிப்பு உதவி எண்' } },
  { number: '14416', label: { en: 'Tele-MANAS mental health helpline', ta: 'டெலி-மனஸ் மனநல உதவி எண்' } },
  { number: '1933', label: { en: 'NCB MANAS helpline', ta: 'NCB மனஸ் உதவி எண்' } },
];

// ── Validation helpers (used by the API) ──

const ids = (opts: Option[]) => new Set(opts.map(o => o.id));
export const AGE_GROUP_IDS = ids(AGE_GROUPS);
export const GENDER_IDS = ids(GENDERS);
export const AREA_IDS = ids(AREAS);
export const PARTICIPANT_TYPE_IDS = ids(PARTICIPANT_TYPES);

/** Indian mobile: keep digits, drop a leading 91/0, must be 10 digits starting 6–9. */
export function normalizeMobile(input: unknown): string | null {
  let d = String(input ?? '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}

/** '@my.handle' / 'instagram.com/my.handle' → 'my.handle' (Instagram: letters, digits, . and _, max 30). */
export function normalizeInstagram(input: unknown): string | null {
  let h = String(input ?? '').trim();
  const m = h.match(/instagram\.com\/([^/?#\s]+)/i);
  if (m) h = m[1];
  h = h.replace(/^@+/, '').toLowerCase();
  return /^[a-z0-9._]{1,30}$/.test(h) ? h : null;
}

/** Only Instagram reel/post links are accepted. */
export function isInstagramReelUrl(input: unknown): boolean {
  try {
    const u = new URL(String(input ?? '').trim());
    return /(^|\.)instagram\.com$/i.test(u.hostname) && /^\/(reel|reels|p)\/[A-Za-z0-9_-]+/.test(u.pathname);
  } catch {
    return false;
  }
}

/** Keep only known survey questions and allowed answers (free text trimmed to 200 chars). */
export type SurveyAnswers = Record<string, string | string[]>;

export function sanitizeSurvey(input: unknown, participantType: string): SurveyAnswers {
  const out: SurveyAnswers = {};
  if (!input || typeof input !== 'object') return out;
  const answers = input as Record<string, unknown>;
  for (const q of surveyFor(participantType)) {
    const a = answers[q.id];
    if (q.multi && q.options && Array.isArray(a)) {
      const picked = q.options.filter(o => a.includes(o.id)).map(o => o.id);
      if (picked.length) out[q.id] = picked;
      continue;
    }
    if (typeof a !== 'string' || !a.trim()) continue;
    if (q.options) {
      if (q.options.some(o => o.id === a)) out[q.id] = a;
    } else {
      out[q.id] = a.trim().slice(0, 200);
    }
  }
  return out;
}

export function captionFor(code: string, handles: string[] = DEFAULT_TAG_HANDLES): string {
  return [
    'Running for a Drug-Free Tamil Nadu! 🏃‍♂️💪',
    'போதையில்லா தமிழ்நாட்டுக்காக ஓடுகிறேன்!',
    '',
    [code, ...CONTEST_HASHTAGS].join(' '),
    handles.join(' '),
  ].join('\n');
}
