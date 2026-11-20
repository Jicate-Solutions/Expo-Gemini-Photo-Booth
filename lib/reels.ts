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
  section: 'B' | 'C' | 'D';
  showFor?: 'parent' | 'student';
  text: Label;
  /** No options = short free-text answer */
  options?: Option[];
}

const YES = { id: 'yes', label: { en: 'Yes', ta: 'ஆம்' } };
const NO = { id: 'no', label: { en: 'No', ta: 'இல்லை' } };
const PREFER_NOT = { id: 'prefer_not', label: { en: 'Prefer not to say', ta: 'சொல்ல விரும்பவில்லை' } };

export const SURVEY: SurveyQuestion[] = [
  // Section B — everyone
  {
    id: 'problem_seriousness', section: 'B',
    text: { en: 'How serious do you think the drug problem is in your area?', ta: 'உங்கள் பகுதியில் போதைப்பொருள் பிரச்சினை எவ்வளவு தீவிரமானது என்று நினைக்கிறீர்கள்?' },
    options: [
      { id: 'not_issue', label: { en: 'Not an issue', ta: 'பிரச்சினை இல்லை' } },
      { id: 'somewhat', label: { en: 'Somewhat', ta: 'ஓரளவு' } },
      { id: 'serious', label: { en: 'Serious', ta: 'தீவிரம்' } },
      { id: 'very_serious', label: { en: 'Very serious', ta: 'மிகவும் தீவிரம்' } },
      { id: 'not_sure', label: { en: 'Not sure', ta: 'தெரியவில்லை' } },
    ],
  },
  {
    id: 'know_warning_signs', section: 'B',
    text: { en: 'Do you know the warning signs of drug use in a young person?', ta: 'இளைஞர்களிடம் போதைப்பழக்கத்தின் எச்சரிக்கை அறிகுறிகள் உங்களுக்குத் தெரியுமா?' },
    options: [
      { id: 'yes_well', label: { en: 'Yes, well', ta: 'ஆம், நன்றாக' } },
      { id: 'a_little', label: { en: 'A little', ta: 'கொஞ்சம்' } },
      NO,
    ],
  },
  // Section C — parents only
  {
    id: 'children', section: 'C', showFor: 'parent',
    text: { en: 'How many children do you have, and what are their age groups?', ta: 'உங்களுக்கு எத்தனை குழந்தைகள், அவர்களின் வயது என்ன?' },
  },
  {
    id: 'know_child_friends', section: 'C', showFor: 'parent',
    text: { en: "Do you know your child's close friends and where they spend their time?", ta: 'உங்கள் குழந்தையின் நெருங்கிய நண்பர்களையும், அவர்கள் நேரம் செலவிடும் இடங்களையும் உங்களுக்குத் தெரியுமா?' },
    options: [
      { id: 'mostly', label: { en: 'Yes, mostly', ta: 'ஆம், பெரும்பாலும்' } },
      { id: 'partly', label: { en: 'Partly', ta: 'ஓரளவு' } },
      NO,
    ],
  },
  {
    id: 'worrying_changes', section: 'C', showFor: 'parent',
    text: { en: 'Have you noticed any worrying changes lately (mood, money, friends, grades, sleep)?', ta: 'சமீபத்தில் கவலைக்குரிய மாற்றங்களைக் கவனித்தீர்களா (மனநிலை, பணம், நண்பர்கள், மதிப்பெண், தூக்கம்)?' },
    options: [YES, NO, PREFER_NOT],
  },
  {
    id: 'wants_parent_guide', section: 'C', showFor: 'parent',
    text: { en: 'Would you like a free guide on how to talk with your child about drugs? (collect it at the JKKN counsellor desk on 22 Nov)', ta: 'போதைப்பொருள் பற்றி உங்கள் குழந்தையிடம் பேசுவது எப்படி என்ற இலவச வழிகாட்டி வேண்டுமா? (நவம்பர் 22 அன்று JKKN ஆலோசகர் மேசையில் பெறலாம்)' },
    options: [YES, NO],
  },
  // Section D — students only
  {
    id: 'comfortable_trusted_adult', section: 'D', showFor: 'student',
    text: { en: 'Do you feel comfortable talking to a trusted adult about peer pressure?', ta: 'நண்பர்களின் அழுத்தம் பற்றி நம்பிக்கையான பெரியவரிடம் பேச உங்களுக்குத் தயக்கமில்லையா?' },
    options: [YES, { id: 'sometimes', label: { en: 'Sometimes', ta: 'சில நேரம்' } }, NO],
  },
  {
    id: 'know_someone_offered', section: 'D', showFor: 'student',
    text: { en: 'Do you know someone who has been offered drugs?', ta: 'போதைப்பொருள் கொடுக்கப்பட்ட யாரையாவது உங்களுக்குத் தெரியுமா?' },
    options: [YES, NO, PREFER_NOT],
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
export function sanitizeSurvey(input: unknown, participantType: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!input || typeof input !== 'object') return out;
  const answers = input as Record<string, unknown>;
  for (const q of surveyFor(participantType)) {
    const a = answers[q.id];
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
