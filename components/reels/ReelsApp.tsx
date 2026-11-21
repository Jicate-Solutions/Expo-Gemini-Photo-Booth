'use client';

/**
 * Reels Contest — public phone page opened from the QR code.
 * Welcome → Details (Section A) → Survey (Sections B–D) → Your code → Submit reel.
 * The code + mobile are remembered on the phone, so a returning visitor goes straight to their code.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  AGE_GROUPS, AREAS, GENDERS, HELPLINES, PARTICIPANT_TYPES,
  PLEDGE_TEXT, captionFor, normalizeMobile, surveyFor, type Lang, type Label, type Option, type SurveyAnswers,
} from '@/lib/reels';
import { PRIZE_CATEGORIES } from '@/lib/reelsScore';

type Step = 'welcome' | 'details' | 'survey' | 'code' | 'submit' | 'done' | 'lookup' | 'results';

interface PublicEntry { rank: number; name: string; code: string; score: number; prize: string | null }
interface MyResult { name: string; code: string; eligible: boolean; rank: number | null; score: number | null; prize: string | null }

interface Saved { code: string; mobile: string; firstName: string; name?: string; pledged?: boolean }

const t = {
  title: { en: 'Impact Reel Challenge', ta: 'இம்பாக்ட் ரீல் சவால்' },
  tagline: { en: 'Running for a Drug-Free Tamil Nadu', ta: 'போதையில்லா தமிழ்நாட்டுக்காக ஓடுவோம்' },
  intro: {
    en: 'Post an Instagram reel about the marathon and its message. The reels with the biggest impact win prizes!',
    ta: 'மாரத்தான் மற்றும் அதன் செய்தி பற்றி ஒரு இன்ஸ்டாகிராம் ரீல் பதிவிடுங்கள். அதிக தாக்கம் ஏற்படுத்தும் ரீல்களுக்கு பரிசுகள்!',
  },
  register: { en: 'Register', ta: 'பதிவு செய்க' },
  heyRunner: { en: 'Hey runner!', ta: 'வணக்கம் ரன்னர்!' },
  tellUs: { en: "Tell us a little about you — it's quick!", ta: 'உங்களைப் பற்றி கொஞ்சம் சொல்லுங்கள் — சீக்கிரம் முடியும்!' },
  allSet: { en: 'All set!', ta: 'தயார்!' },
  namePh: { en: 'e.g. Priya Kumar', ta: 'எ.கா. பிரியா குமார்' },
  niceToMeet: { en: 'Nice to meet you', ta: 'உங்களைச் சந்தித்ததில் மகிழ்ச்சி' },
  liveNow: { en: 'Contest is live', ta: 'போட்டி நடைபெறுகிறது' },
  step1: { en: 'Register & get your code', ta: 'பதிவு செய்து குறியீடு பெறுக' },
  step2: { en: 'Post a 15–60s reel', ta: '15–60 விநாடி ரீல் பதிவிடுக' },
  step3: { en: 'Submit & win prizes', ta: 'சமர்ப்பித்து பரிசு வெல்க' },
  prizesTitle: { en: 'Win exciting prizes', ta: 'அசத்தலான பரிசுகள்' },
  prizeFamily: { en: 'Best Family Reel', ta: 'சிறந்த குடும்ப ரீல்' },
  prizeStudent: { en: 'Best Student Reel', ta: 'சிறந்த மாணவர் ரீல்' },
  prizeMessage: { en: 'Most Impactful Message', ta: 'தாக்கமுள்ள செய்தி' },
  certificates: { en: 'Certificate for every valid entry', ta: 'சரியான ஒவ்வொரு பதிவுக்கும் சான்றிதழ்' },
  join: { en: 'Join the Challenge', ta: 'சவாலில் இணையுங்கள்' },
  free: { en: 'Free to join · takes 1 minute', ta: 'இலவசம் · 1 நிமிடம் போதும்' },
  already: { en: 'Already registered? Get my code', ta: 'ஏற்கனவே பதிவு செய்தீர்களா? என் குறியீடு' },
  next: { en: 'Next', ta: 'அடுத்து' },
  back: { en: 'Back', ta: 'பின்செல்' },
  yourDetails: { en: 'Your details', ta: 'உங்கள் விவரங்கள்' },
  fullName: { en: 'Full name', ta: 'முழு பெயர்' },
  mobile: { en: 'Mobile number', ta: 'கைபேசி எண்' },
  ageGroup: { en: 'Age group', ta: 'வயது' },
  gender: { en: 'Gender (optional)', ta: 'பாலினம் (விருப்பம்)' },
  area: { en: 'Area', ta: 'பகுதி' },
  type: { en: 'I am a', ta: 'நான் ஒரு' },
  instagram: { en: 'Instagram handle (needed for the contest)', ta: 'இன்ஸ்டாகிராம் பெயர் (போட்டிக்கு தேவை)' },
  privacy: {
    en: 'Privacy: your details are used only to run this contest and plan awareness programmes, are seen only by the organisers (Yi & JKKN), are not shared, and you can ask for them to be deleted.',
    ta: 'தனியுரிமை: உங்கள் விவரங்கள் இந்தப் போட்டி மற்றும் விழிப்புணர்வு திட்டங்களுக்கு மட்டுமே; ஏற்பாட்டாளர்கள் (Yi & JKKN) மட்டுமே பார்ப்பார்கள்; பகிரப்படாது; நீக்கக் கோரலாம்.',
  },
  required: { en: 'Please fill this', ta: 'இதை நிரப்பவும்' },
  survey: { en: 'Quick survey (optional)', ta: 'சிறு கணக்கெடுப்பு (விருப்பம்)' },
  surveyNote: {
    en: 'Your answers help us plan awareness programmes. We do not share individual answers. You may skip any question.',
    ta: 'உங்கள் பதில்கள் விழிப்புணர்வு திட்டங்களுக்கு உதவும். தனிப்பட்ட பதில்கள் பகிரப்படாது. எந்தக் கேள்வியையும் தவிர்க்கலாம்.',
  },
  shortAnswer: { en: 'Your answer', ta: 'உங்கள் பதில்' },
  resultsOut: { en: '🏆 Results are out! See results & certificate', ta: '🏆 முடிவுகள் வெளியானது! முடிவுகள் & சான்றிதழ்' },
  resultsTitle: { en: '🏆 Contest results', ta: '🏆 போட்டி முடிவுகள்' },
  winnersTitle: { en: 'Prize winners', ta: 'பரிசு வென்றவர்கள்' },
  topTen: { en: 'Top 10', ta: 'முதல் 10' },
  points: { en: 'pts', ta: 'புள்ளிகள்' },
  myResult: { en: 'Your result & certificate', ta: 'உங்கள் முடிவு & சான்றிதழ்' },
  myResultNote: { en: 'Enter the mobile number and contest code you registered with.', ta: 'பதிவு செய்த மொபைல் எண் மற்றும் போட்டிக் குறியீட்டை உள்ளிடுங்கள்.' },
  checkResult: { en: 'Show my result', ta: 'என் முடிவைக் காட்டு' },
  yourRank: { en: 'Your rank', ta: 'உங்கள் இடம்' },
  wonPrize: { en: 'You won', ta: 'நீங்கள் வென்றது' },
  downloadCert: { en: 'Download my certificate', ta: 'என் சான்றிதழைப் பதிவிறக்கு' },
  notEligible: { en: 'We could not find a reel marked valid for this code. Certificates are given for reels the jury accepted as valid.', ta: 'இந்தக் குறியீட்டுக்கு செல்லுபடியான ரீல் கிடைக்கவில்லை. நடுவர்கள் ஏற்ற ரீல்களுக்கு மட்டுமே சான்றிதழ்.' },
  noMatch: { en: 'Mobile number and code do not match. Please check and try again.', ta: 'மொபைல் எண்ணும் குறியீடும் பொருந்தவில்லை. சரிபார்த்து மீண்டும் முயலவும்.' },
  noResultsYet: { en: 'No valid reels yet.', ta: 'இன்னும் செல்லுபடியான ரீல்கள் இல்லை.' },
  secB: { en: '🧠 Awareness', ta: '🧠 விழிப்புணர்வு' },
  secC: { en: '👨‍👩‍👧 For parents & guardians', ta: '👨‍👩‍👧 பெற்றோர் & பாதுகாவலர்களுக்கு' },
  secD: { en: '🎓 For students & youth', ta: '🎓 மாணவர்கள் & இளைஞர்களுக்கு' },
  secE: { en: '🤝 Your contribution', ta: '🤝 உங்கள் பங்களிப்பு' },
  pledgeTick: { en: 'I take this pledge', ta: 'நான் இந்த உறுதிமொழியை எடுக்கிறேன்' },
  pledgeDone: { en: '🎖️ You took the Drug-Free TN pledge!', ta: '🎖️ போதையில்லா தமிழ்நாடு உறுதிமொழி எடுத்தீர்கள்!' },
  certificate: { en: 'Download my pledge certificate', ta: 'என் உறுதிமொழிச் சான்றிதழைப் பதிவிறக்கு' },
  getCode: { en: 'Get my contest code', ta: 'என் போட்டிக் குறியீட்டைப் பெறு' },
  help: { en: 'Need help? Free helplines', ta: 'உதவி தேவையா? இலவச உதவி எண்கள்' },
  hi: { en: 'You are in', ta: 'நீங்கள் பதிவு செய்துவிட்டீர்கள்' },
  yourCode: { en: 'Your contest code', ta: 'உங்கள் போட்டிக் குறியீடு' },
  welcomeBack: { en: 'Welcome back! This is your code.', ta: 'மீண்டும் வருக! இது உங்கள் குறியீடு.' },
  caption: { en: 'Copy this into your reel caption', ta: 'இதை உங்கள் ரீல் தலைப்பில் ஒட்டவும்' },
  copy: { en: 'Copy caption', ta: 'தலைப்பை நகலெடு' },
  copied: { en: 'Copied ✓', ta: 'நகலெடுக்கப்பட்டது ✓' },
  how: { en: 'How to take part', ta: 'பங்கேற்பது எப்படி' },
  rules: {
    en: [
      'Make a 15–60 second reel: the marathon, why you run, or a message against drugs (Tamil or English).',
      'Paste the caption above — your code and both hashtags must be in it.',
      'Tag the official accounts. Keep your account PUBLIC until judging is over.',
      'Film it yourself, or with a friend, family or an influencer (you pay any influencer).',
      'Then come back here and submit your reel link with an Insights screenshot.',
    ],
    ta: [
      '15–60 விநாடி ரீல்: மாரத்தான், நீங்கள் ஏன் ஓடுகிறீர்கள், அல்லது போதைக்கு எதிரான செய்தி (தமிழ் அல்லது ஆங்கிலம்).',
      'மேலே உள்ள தலைப்பை ஒட்டவும் — உங்கள் குறியீடும் இரண்டு ஹேஷ்டேக்குகளும் இருக்க வேண்டும்.',
      'அதிகாரப்பூர்வ கணக்குகளை டேக் செய்யவும். முடிவுகள் வரும் வரை கணக்கு PUBLIC ஆக இருக்கட்டும்.',
      'நீங்களோ, நண்பர், குடும்பத்தினர் அல்லது இன்ஃப்ளூயன்சர் படம்பிடிக்கலாம் (இன்ஃப்ளூயன்சர் கட்டணம் உங்கள் பொறுப்பு).',
      'பிறகு இங்கு வந்து ரீல் இணைப்பையும் Insights திரைப்பிடிப்பையும் சமர்ப்பிக்கவும்.',
    ],
  },
  dont: { en: "Don'ts", ta: 'செய்யக்கூடாதவை' },
  donts: {
    en: [
      'No showing, joking about or glorifying drugs or any substance.',
      'No naming or shaming any person or family.',
      'No hate speech, politics or unrelated brand promotion.',
      'Do not film while running in an unsafe way.',
      'No fake engagement (bought likes, bots, engagement groups).',
    ],
    ta: [
      'போதைப்பொருளைக் காட்டுவது, கேலி செய்வது, புகழ்வது கூடாது.',
      'யாரையும், எந்தக் குடும்பத்தையும் பெயர் சொல்லி அவமானப்படுத்தக் கூடாது.',
      'வெறுப்புப் பேச்சு, அரசியல், தொடர்பில்லாத விளம்பரம் கூடாது.',
      'ஓடும்போது ஆபத்தான முறையில் படம்பிடிக்க வேண்டாம்.',
      'போலி ஈடுபாடு கூடாது (வாங்கிய லைக்குகள், பாட்கள், குழுக்கள்).',
    ],
  },
  prizes: {
    en: 'Prizes: 1st, 2nd, 3rd · Best Family Reel · Best Student Reel · Most Impactful Message. Certificates for all valid entries.',
    ta: 'பரிசுகள்: 1, 2, 3 · சிறந்த குடும்ப ரீல் · சிறந்த மாணவர் ரீல் · மிகத் தாக்கமுள்ள செய்தி. அனைத்து சரியான பதிவுகளுக்கும் சான்றிதழ்.',
  },
  scoringTitle: { en: 'How scoring works (100 points)', ta: 'மதிப்பெண் எப்படி? (100 புள்ளிகள்)' },
  scoring: {
    en: [
      'Reach — 30: how many people saw your reel, compared with other entries and with your follower count (small accounts are not at a disadvantage)',
      'Engagement — 25: likes, comments, shares and saves',
      'Message — 25 (jury): a clear, positive drug-free message',
      'Creativity — 15 (jury): original idea, storytelling, music and editing',
      'Rules — 5: correct hashtags, tags and guidelines followed',
      'Only your best reel counts. Numbers are checked with your Insights screenshot.',
    ],
    ta: [
      'சென்றடைவு — 30: உங்கள் ரீலை எத்தனை பேர் பார்த்தார்கள் (மற்ற பதிவுகளுடனும் உங்கள் பின்தொடர்பவர் எண்ணிக்கையுடனும் ஒப்பிட்டு — சிறிய கணக்குகளுக்கு பாதிப்பு இல்லை)',
      'ஈடுபாடு — 25: லைக், கமெண்ட், ஷேர், சேவ்',
      'செய்தி — 25 (நடுவர்கள்): தெளிவான, நேர்மறையான போதையில்லா செய்தி',
      'படைப்பாற்றல் — 15 (நடுவர்கள்): புதிய யோசனை, கதை சொல்லல், இசை, எடிட்டிங்',
      'விதிமுறைகள் — 5: சரியான ஹேஷ்டேக், டேக், வழிகாட்டுதல்கள்',
      'உங்கள் சிறந்த ஒரு ரீல் மட்டுமே கணக்கில். எண்ணிக்கைகள் உங்கள் Insights ஸ்கிரீன்ஷாட் மூலம் சரிபார்க்கப்படும்.',
    ],
  },
  deadline: {
    en: 'Post your reel on 22 Nov between 6:59 AM and 10:30 PM. Reels posted outside this time are not counted. Results will be announced by the organisers.',
    ta: 'உங்கள் ரீலை நவம்பர் 22 அன்று காலை 6:59 முதல் இரவு 10:30 வரை பதிவிடுங்கள். இந்த நேரத்திற்கு வெளியே பதிவிடப்படும் ரீல்கள் கணக்கில் எடுக்கப்படாது. முடிவுகள் ஏற்பாட்டாளர்களால் அறிவிக்கப்படும்.',
  },
  submitReel: { en: 'I posted my reel — submit it', ta: 'ரீல் பதிவிட்டேன் — சமர்ப்பி' },
  submitTitle: { en: 'Submit your reel', ta: 'உங்கள் ரீலைச் சமர்ப்பிக்கவும்' },
  code: { en: 'Contest code', ta: 'போட்டிக் குறியீடு' },
  reelUrl: { en: 'Instagram reel link', ta: 'இன்ஸ்டாகிராம் ரீல் இணைப்பு' },
  reelUrlHint: { en: 'On the reel tap ⋯ / Share → Copy link', ta: 'ரீலில் ⋯ / Share → Copy link அழுத்தவும்' },
  screenshot: { en: 'Insights screenshot', ta: 'Insights திரைப்பிடிப்பு' },
  screenshotHint: {
    en: 'On your reel tap "View insights", take a screenshot, and upload it here.',
    ta: 'உங்கள் ரீலில் "View insights" அழுத்தி, திரைப்பிடிப்பு எடுத்து இங்கே பதிவேற்றவும்.',
  },
  numbers: { en: 'Numbers from Insights (optional)', ta: 'Insights எண்கள் (விருப்பம்)' },
  submit: { en: 'Submit entry', ta: 'சமர்ப்பி' },
  doneTitle: { en: 'Entry received! 🎉', ta: 'பதிவு பெறப்பட்டது! 🎉' },
  doneText: {
    en: 'Our team will check your reel. Keep your account public until results are announced. You can submit a better reel later — only your best one counts.',
    ta: 'எங்கள் குழு உங்கள் ரீலைச் சரிபார்க்கும். முடிவுகள் வரும் வரை கணக்கை public ஆக வைத்திருங்கள். பின்னர் சிறந்த ரீலைச் சமர்ப்பிக்கலாம் — சிறந்தது மட்டுமே கணக்கிடப்படும்.',
  },
  backToCode: { en: 'Back to my code', ta: 'என் குறியீட்டுக்குத் திரும்பு' },
  lookupTitle: { en: 'Find my code', ta: 'என் குறியீட்டைக் கண்டறி' },
  find: { en: 'Find', ta: 'கண்டறி' },
  notFound: { en: 'No registration found for this number.', ta: 'இந்த எண்ணுக்கு பதிவு இல்லை.' },
  notMe: { en: 'Not you? Register another person', ta: 'நீங்கள் இல்லையா? வேறு நபரைப் பதிவு செய்' },
  error: { en: 'Something went wrong. Please try again.', ta: 'ஏதோ தவறு. மீண்டும் முயற்சிக்கவும்.' },
  inactive: { en: 'This contest link is not active.', ta: 'இந்தப் போட்டி இணைப்பு செயலில் இல்லை.' },
} satisfies Record<string, Label | { en: string[]; ta: string[] }>;

/** Animations for the fun welcome screen (injected raw so server and browser HTML match) */
const REELS_CSS = `        @keyframes reels-float { 0%,100% { transform: translateY(0) rotate(0deg) } 50% { transform: translateY(-12px) rotate(8deg) } }
        .reels-float { animation: reels-float 3.5s ease-in-out infinite; }
        @keyframes reels-pick { 0% { transform: scale(1) } 40% { transform: scale(1.08) } 100% { transform: scale(1) } }
        .reels-pick { animation: reels-pick .35s ease-out; }
        @keyframes reels-wave { 0%,100% { transform: rotate(0) } 25% { transform: rotate(18deg) } 75% { transform: rotate(-10deg) } }
        .reels-wave { display: inline-block; transform-origin: 70% 70%; animation: reels-wave 1.4s ease-in-out infinite; }
        @keyframes reels-run { 0%,100% { transform: translateX(-50%) translateY(0) } 50% { transform: translateX(-50%) translateY(-6px) } }
        .reels-run { animation: reels-run .45s ease-in-out infinite; }
        @keyframes reels-road { from { transform: translateX(0) } to { transform: translateX(-28px) } }
        .reels-road { animation: reels-road .35s linear infinite; }
        @keyframes reels-pop { 0% { transform: translateY(0) scale(.6); opacity: 0 } 20% { opacity: 1 } 100% { transform: translateY(-70px) scale(1.2); opacity: 0 } }
        .reels-pop { animation: reels-pop 1.8s ease-out infinite; }
        @keyframes reels-heart { 0%,100% { transform: scale(1) } 50% { transform: scale(1.3) } }
        .reels-heart { animation: reels-heart .9s ease-in-out infinite; }
        @keyframes reels-bounce { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
        .reels-bounce { display: inline-block; animation: reels-bounce 1.6s ease-in-out infinite; }
        @keyframes reels-shine { 0% { left: -60% } 60%,100% { left: 130% } }
        .reels-shine::after { content: ''; position: absolute; top: 0; bottom: 0; width: 40%; left: -60%;
          background: linear-gradient(100deg, transparent, rgba(255,255,255,.45), transparent); animation: reels-shine 2.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .reels-float, .reels-pick, .reels-wave, .reels-run, .reels-road, .reels-pop, .reels-heart, .reels-bounce, .reels-shine::after { animation: none; }
        }
`;

const METRIC_FIELDS: { id: string; label: Label }[] = [
  { id: 'followers', label: { en: 'Followers', ta: 'பின்தொடர்பவர்கள்' } },
  { id: 'reach', label: { en: 'Accounts reached', ta: 'சென்றடைந்த கணக்குகள்' } },
  { id: 'views', label: { en: 'Views', ta: 'பார்வைகள்' } },
  { id: 'likes', label: { en: 'Likes', ta: 'லைக்குகள்' } },
  { id: 'comments', label: { en: 'Comments', ta: 'கருத்துகள்' } },
  { id: 'shares', label: { en: 'Shares', ta: 'பகிர்வுகள்' } },
  { id: 'saves', label: { en: 'Saves', ta: 'சேமிப்புகள்' } },
];

interface Form {
  fullName: string;
  mobile: string;
  ageGroup: string;
  gender: string;
  area: string;
  participantType: string;
  instagram: string;
}

const EMPTY_FORM: Form = {
  fullName: '', mobile: '', ageGroup: '', gender: '', area: '', participantType: '',
  instagram: '',
};

const inputCls =
  'w-full h-12 rounded-2xl border-2 border-slate-200 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 transition focus:border-pink-400 focus:outline-none focus:ring-4 focus:ring-pink-100';
const labelCls = 'block text-sm font-semibold text-slate-700 mb-1.5';
const primaryBtn =
  'reels-shine relative overflow-hidden w-full py-3.5 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-400 text-white text-base font-black shadow-lg shadow-pink-500/30 active:scale-[0.98] disabled:opacity-60 transition';
const ghostBtn = 'w-full py-3 rounded-2xl border-2 border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50';

/** Each question sits in its own card (red outline when it needs fixing) */
const qCard = (hasError?: boolean) =>
  `rounded-3xl border-2 bg-white p-4 shadow-sm transition-colors ${hasError ? 'border-red-300 bg-red-50/40' : 'border-slate-100'}`;
const qTitle = 'mb-3 flex items-center gap-2 text-sm font-black text-slate-800';
const qIcon = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-lg';

/** Fun emoji on each answer button */
const OPTION_EMOJI: Record<string, string> = {
  under_18: '🧒', '18_25': '🧑‍🎓', '26_40': '🧑‍💼', '41_60': '🧔', '60_plus': '👴',
  male: '👨', female: '👩', other: '🙂',
  erode_town: '🏙️', nearby_town: '🏡', outside_district: '🚌',
  student: '🎓', working_professional: '💼', parent: '👨‍👩‍👧', teacher: '👩‍🏫', others: '🙌',
};

/** Tick-many version of Chips (Section E "How would you like to contribute"). */
function MultiChips({ options, value, onChange, lang }: {
  options: Option[]; value: string[]; onChange: (v: string[]) => void; lang: Lang;
}) {
  return (
    <div className="grid gap-2">
      {options.map(o => {
        const on = value.includes(o.id);
        return (
          <button key={o.id} type="button" role="checkbox" aria-checked={on}
            onClick={() => onChange(on ? value.filter(x => x !== o.id) : [...value, o.id])}
            className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-left text-sm font-bold transition-all ${
              on ? 'border-pink-400 bg-gradient-to-br from-fuchsia-50 to-orange-50 text-pink-700 shadow-md shadow-pink-200'
                 : 'border-slate-200 bg-white text-slate-600 hover:border-pink-200 active:scale-[0.98]'
            }`}>
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 text-[11px] ${on ? 'border-pink-500 bg-pink-500 text-white' : 'border-slate-300'}`}>{on ? '✓' : ''}</span>
            {o.label[lang]}
          </button>
        );
      })}
    </div>
  );
}

function Chips({ options, value, onChange, lang, cols = 2, emoji = false }: {
  options: Option[]; value: string; onChange: (v: string) => void; lang: Lang; cols?: 2 | 3; emoji?: boolean;
}) {
  return (
    <div className={`grid gap-2 ${cols === 3 ? 'grid-cols-3' : 'grid-cols-2'}`} role="radiogroup">
      {options.map(o => {
        const on = value === o.id;
        const icon = emoji ? OPTION_EMOJI[o.id] : undefined;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(on ? '' : o.id)}
            className={`relative min-h-11 px-2 py-2 rounded-2xl border-2 text-sm font-bold transition-all ${
              on
                ? 'reels-pick border-pink-400 bg-gradient-to-br from-fuchsia-50 to-orange-50 text-pink-700 shadow-md shadow-pink-200'
                : 'border-slate-200 bg-white text-slate-600 hover:border-pink-200 active:scale-95'
            }`}
          >
            {on && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-[11px] text-white shadow">✓</span>
            )}
            {icon && <span className="block text-2xl leading-none mb-1">{icon}</span>}
            {o.label[lang]}
          </button>
        );
      })}
    </div>
  );
}

/** Runner moving along a track: You → Survey → Your code */
function JourneyBar({ stage, lang }: { stage: 0 | 1 | 2; lang: Lang }) {
  const stops: Label[] = [
    { en: 'You', ta: 'நீங்கள்' },
    { en: 'Survey', ta: 'கணக்கெடுப்பு' },
    { en: 'Your code', ta: 'குறியீடு' },
  ];
  const pct = [8, 50, 92][stage];
  return (
    <div className="mb-5">
      <div className="relative h-9">
        <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-slate-100" />
        <div
          className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-orange-400 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
        <span className="reels-run absolute top-0 text-2xl transition-all duration-700" style={{ left: `${pct}%` }} aria-hidden>
          🏃
        </span>
        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xl" aria-hidden>🏁</span>
      </div>
      <div className="mt-1 flex justify-between text-[11px] font-bold">
        {stops.map((s, i) => (
          <span key={i} className={i <= stage ? 'text-pink-600' : 'text-slate-400'}>{s[lang]}</span>
        ))}
      </div>
    </div>
  );
}

export default function ReelsApp({ expoId }: { expoId: string }) {
  const storageKey = `reels:${expoId}`;
  const [lang, setLang] = useState<Lang>('en');
  const [step, setStep] = useState<Step>('welcome');
  const [expo, setExpo] = useState<{ name: string; handles: string[]; resultsPublished?: boolean } | null>(null);
  // Results (screen 10)
  const [board, setBoard] = useState<{ leaderboard: PublicEntry[]; winners: { prize: string; title: string; name: string; code: string }[] } | null>(null);
  const [resQ, setResQ] = useState({ mobile: '', code: '' });
  const [myResult, setMyResult] = useState<MyResult | null>(null);
  const [inactive, setInactive] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [survey, setSurvey] = useState<SurveyAnswers>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Saved | null>(null);
  const [welcomeBack, setWelcomeBack] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  // Submit step
  const [sub, setSub] = useState({ mobile: '', code: '', reelUrl: '' });
  const [metrics, setMetrics] = useState<Record<string, string>>({});
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [lookupMobile, setLookupMobile] = useState('');

  const L = (k: keyof typeof t) => (t[k] as Label)[lang];

  // Load the expo + anything remembered on this phone
  useEffect(() => {
    fetch(`/api/reels/${expoId}`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(setExpo)
      .catch(() => setInactive(true));
    try {
      const s = JSON.parse(localStorage.getItem(storageKey) || 'null') as Saved | null;
      if (s?.code) {
        setSaved(s);
        setWelcomeBack(true);
        setStep('code');
      }
      const l = localStorage.getItem('reels:lang');
      if (l === 'ta' || l === 'en') setLang(l);
    } catch { /* storage blocked */ }
  }, [expoId, storageKey]);

  useEffect(() => {
    try { localStorage.setItem('reels:lang', lang); } catch { /* ignore */ }
  }, [lang]);

  useEffect(() => {
    if (step !== 'results' || board) return;
    fetch(`/api/reels/${expoId}/results`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(setBoard)
      .catch(() => setBoard({ leaderboard: [], winners: [] }));
  }, [step, board, expoId]);

  // Live "filled X of 5" meter on the details header (the 5 required answers)
  const filled = [
    form.fullName.trim().length >= 2,
    !!normalizeMobile(form.mobile),
    !!form.ageGroup,
    !!form.area,
    !!form.participantType,
  ].filter(Boolean).length;
  const firstName = form.fullName.trim().split(/\s+/)[0] ?? '';

  // Survey questions depend on participant type (parents / students get extra ones)
  const questions = useMemo(() => surveyFor(form.participantType), [form.participantType]);
  const caption = saved ? captionFor(saved.code, expo?.handles) : '';

  const remember = (s: Saved) => {
    setSaved(s);
    try { localStorage.setItem(storageKey, JSON.stringify(s)); } catch { /* ignore */ }
  };

  const go = (s: Step) => {
    setMessage('');
    setStep(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validateDetails = () => {
    const e: Record<string, boolean> = {};
    if (form.fullName.trim().length < 2) e.fullName = true;
    if (!normalizeMobile(form.mobile)) e.mobile = true;
    if (!form.ageGroup) e.ageGroup = true;
    if (!form.area) e.area = true;
    if (!form.participantType) e.participantType = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const register = async () => {
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch(`/api/reels/${expoId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, survey }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.fields) { setErrors(json.fields); go('details'); }
        setMessage(json.error || L('error'));
        return;
      }
      remember({
        code: json.code, mobile: normalizeMobile(form.mobile)!, firstName: json.firstName,
        name: form.fullName.trim(), pledged: survey.pledge === 'yes',
      });
      setWelcomeBack(!!json.alreadyRegistered);
      go('code');
    } catch {
      setMessage(L('error'));
    } finally {
      setBusy(false);
    }
  };

  const downloadCertificate = async () => {
    if (!saved) return;
    setBusy(true);
    try {
      const { makePledgeCertificate } = await import('@/lib/pledgeCertificate');
      const blob = await makePledgeCertificate(saved.name || saved.firstName, saved.code);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DrugFreeTN-pledge-${saved.code.replace('#', '')}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } finally {
      setBusy(false);
    }
  };

  const openResults = () => {
    setMyResult(null);
    if (saved) setResQ({ mobile: saved.mobile, code: saved.code });
    go('results');
  };

  const checkResult = async () => {
    setBusy(true);
    setMessage('');
    setMyResult(null);
    try {
      const res = await fetch(`/api/reels/${expoId}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resQ),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error === 'not_found' ? L('noMatch') : json.error || L('error'));
        return;
      }
      setMyResult(json);
    } catch {
      setMessage(L('error'));
    } finally {
      setBusy(false);
    }
  };

  const downloadReelCertificate = async () => {
    if (!myResult?.eligible) return;
    setBusy(true);
    try {
      const { makeReelCertificate } = await import('@/lib/pledgeCertificate');
      const title = PRIZE_CATEGORIES.find(p => p.id === myResult.prize)?.title ?? null;
      const blob = await makeReelCertificate(myResult.name, myResult.code, title);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ImpactReel-certificate-${myResult.code.replace('#', '')}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } finally {
      setBusy(false);
    }
  };

  const lookup = async () => {
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch(`/api/reels/${expoId}/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: lookupMobile }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error === 'not_found' ? L('notFound') : json.error || L('error'));
        return;
      }
      remember({ code: json.code, mobile: normalizeMobile(lookupMobile)!, firstName: json.firstName });
      setWelcomeBack(true);
      go('code');
    } catch {
      setMessage(L('error'));
    } finally {
      setBusy(false);
    }
  };

  const openSubmit = () => {
    setSub({ mobile: saved?.mobile ?? '', code: saved?.code ?? '', reelUrl: '' });
    setMetrics({});
    setScreenshot(null);
    go('submit');
  };

  const submitReel = async () => {
    setBusy(true);
    setMessage('');
    try {
      const fd = new FormData();
      fd.append('mobile', sub.mobile);
      fd.append('code', sub.code);
      fd.append('reelUrl', sub.reelUrl);
      Object.entries(metrics).forEach(([k, v]) => v && fd.append(k, v));
      if (screenshot) fd.append('screenshot', screenshot);
      const res = await fetch(`/api/reels/${expoId}/submit`, { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) { setMessage(json.error || L('error')); return; }
      go('done');
    } catch {
      setMessage(L('error'));
    } finally {
      setBusy(false);
    }
  };

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
    } catch {
      // Older phones: fall back to a hidden textarea
      const ta = document.createElement('textarea');
      ta.value = caption;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const err = (k: string) => errors[k] && <p className="mt-1 text-sm text-red-600">{L('required')}</p>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-fuchsia-50 via-white to-amber-50 text-slate-900">
      {/* Animations for the fun welcome screen */}
      <style dangerouslySetInnerHTML={{ __html: REELS_CSS }} />
            <div className="mx-auto max-w-md px-4 pb-10">
        {/* Header: logos + language toggle */}
        <header className="flex items-center justify-between py-4">
          {/* Same 3 partner logos as the poster: Yi | JKKN | Erode Runners */}
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/marathon/yi-logo.png" alt="Yi Young Indians" className="h-7 sm:h-8 w-auto object-contain" />
            <span className="w-px h-5 sm:h-6 bg-slate-300 shrink-0" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/jkkn-logo.png" alt="JKKN" className="h-6 sm:h-7 w-auto object-contain" />
            <span className="w-px h-5 sm:h-6 bg-slate-300 shrink-0" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/marathon/erode-runners-logo.png" alt="Erode Runners" className="h-8 sm:h-9 w-auto object-contain" />
          </div>
          <div className="flex shrink-0 rounded-full border-2 border-slate-200 bg-white p-0.5 text-xs sm:text-sm font-bold">
            {(['ta', 'en'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 sm:px-3 py-1 rounded-full ${lang === l ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}
              >
                {l === 'ta' ? 'தமிழ்' : 'English'}
              </button>
            ))}
          </div>
        </header>

        {inactive ? (
          <div className="mt-20 rounded-3xl bg-white p-8 text-center shadow-xl">
            <p className="text-lg font-bold">{L('inactive')}</p>
          </div>
        ) : (
          <main
            className={
              step === 'welcome'
                ? '' // the welcome screen draws its own colourful cards
                : 'rounded-3xl bg-white/95 p-5 shadow-xl shadow-slate-200/70 border border-slate-100'
            }
          >
            {/* ── 1. Welcome: fun, Instagram-style landing ── */}
            {step === 'welcome' && (
              <div className="space-y-5 text-center">
                {/* Hero */}
                <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-fuchsia-600 via-pink-500 to-orange-400 px-5 pb-6 pt-7 text-white shadow-2xl shadow-pink-500/30">
                  {/* Floating emojis */}
                  {['🏃‍♀️', '❤️', '🔥', '🎬', '🏅', '✨', '📱', '💪'].map((e, i) => (
                    <span
                      key={i}
                      aria-hidden
                      className="reels-float pointer-events-none absolute select-none text-2xl opacity-80"
                      style={{
                        left: `${[6, 82, 14, 88, 4, 70, 46, 92][i]}%`,
                        top: `${[8, 6, 46, 40, 78, 82, 3, 64][i]}%`,
                        animationDelay: `${i * 0.45}s`,
                        animationDuration: `${3.2 + (i % 3) * 0.7}s`,
                      }}
                    >
                      {e}
                    </span>
                  ))}

                  <span className="relative inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" /> {L('liveNow')}
                  </span>
                  <h1 className="relative mt-3 text-[2.1rem] font-black leading-[1.05] drop-shadow-sm">
                    {L('title')}
                  </h1>
                  <p className="relative mt-2 text-base font-semibold text-white/90">{L('tagline')}</p>

                  {/* Phone mock-up playing a "reel" */}
                  <div className="relative mx-auto mt-6 h-64 w-36 rotate-[-4deg] rounded-[1.7rem] border-[5px] border-slate-900 bg-slate-900 shadow-2xl">
                    <div className="absolute left-1/2 top-1.5 z-10 h-1.5 w-10 -translate-x-1/2 rounded-full bg-slate-700" />
                    <div className="relative h-full w-full overflow-hidden rounded-[1.3rem] bg-gradient-to-b from-sky-400 via-emerald-400 to-emerald-600">
                      {/* Road + runner */}
                      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-slate-700/60" />
                      <div className="reels-road absolute bottom-[16%] left-0 h-1 w-[200%] bg-[repeating-linear-gradient(90deg,#fff_0_14px,transparent_14px_28px)]" />
                      <span className="reels-run absolute bottom-[22%] left-1/2 -translate-x-1/2 text-5xl">🏃‍♂️</span>
                      <span className="absolute left-2 top-5 rounded bg-black/40 px-1.5 py-0.5 text-[9px] font-bold">Reels</span>
                      {/* Side actions with popping hearts */}
                      <div className="absolute bottom-10 right-1.5 flex flex-col items-center gap-2 text-sm">
                        <span className="reels-heart">❤️</span>
                        <span>💬</span>
                        <span>📤</span>
                      </div>
                      <span className="reels-pop absolute bottom-24 right-2 text-lg">❤️</span>
                      <span className="reels-pop absolute bottom-24 right-4 text-base" style={{ animationDelay: '0.8s' }}>💖</span>
                      <p className="absolute bottom-2 left-2 right-8 text-left text-[9px] font-bold leading-tight">
                        #ERDMRTHN001
                        <br />#DrugFreeTN
                      </p>
                    </div>
                  </div>
                </section>

                {/* 3 simple steps */}
                <section className="grid grid-cols-3 gap-2">
                  {([
                    ['📝', 'step1', 'from-emerald-400 to-teal-500'],
                    ['🎥', 'step2', 'from-fuchsia-500 to-pink-500'],
                    ['🏆', 'step3', 'from-amber-400 to-orange-500'],
                  ] as const).map(([icon, key, grad], i) => (
                    <div key={key} className="relative rounded-2xl bg-white p-3 shadow-lg shadow-slate-200/80">
                      <span className="absolute -top-2 left-2 rounded-full bg-slate-900 px-1.5 text-[10px] font-black text-white">{i + 1}</span>
                      <div className={`mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${grad} text-2xl shadow`}>
                        {icon}
                      </div>
                      <p className="mt-2 text-xs font-bold leading-snug text-slate-700">{L(key)}</p>
                    </div>
                  ))}
                </section>

                {/* Prizes */}
                <section className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 ring-1 ring-amber-200">
                  <p className="text-sm font-black uppercase tracking-wider text-amber-700">🎁 {L('prizesTitle')}</p>
                  <div className="mt-3 flex items-end justify-center gap-3">
                    <span className="reels-bounce text-3xl" style={{ animationDelay: '0.2s' }}>🥈</span>
                    <span className="reels-bounce text-5xl">🥇</span>
                    <span className="reels-bounce text-3xl" style={{ animationDelay: '0.4s' }}>🥉</span>
                  </div>
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-xs font-bold">
                    <span className="rounded-full bg-white px-2.5 py-1 text-slate-700 shadow-sm">👨‍👩‍👧 {L('prizeFamily')}</span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-slate-700 shadow-sm">🎓 {L('prizeStudent')}</span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-slate-700 shadow-sm">💡 {L('prizeMessage')}</span>
                  </div>
                  <p className="mt-2 text-xs text-amber-800/80">📜 {L('certificates')}</p>
                </section>

                {/* Call to action */}
                <div className="space-y-3 pt-1">
                  {expo?.resultsPublished && (
                    <button onClick={openResults}
                      className="w-full rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-100 to-orange-100 py-4 text-base font-black text-amber-900 shadow-md active:scale-[0.98] transition">
                      {L('resultsOut')}
                    </button>
                  )}
                  <button
                    onClick={() => go('details')}
                    className="reels-shine relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-400 py-4 text-lg font-black text-white shadow-xl shadow-pink-500/30 active:scale-[0.98] transition"
                  >
                    {L('join')} 🚀
                  </button>
                  <button className={ghostBtn} onClick={() => go('lookup')}>🔑 {L('already')}</button>
                  <p className="text-xs text-slate-400">{L('free')}</p>
                </div>
              </div>
            )}

            {/* ── 2. Details (Section A) ── */}
            {step === 'details' && (
              <div>
                <JourneyBar stage={0} lang={lang} />

                {/* Fun header with a live "filled X of 5" meter */}
                <div className="relative mb-5 overflow-hidden rounded-3xl bg-gradient-to-br from-fuchsia-600 via-pink-500 to-orange-400 p-5 text-white shadow-lg shadow-pink-500/25">
                  <span aria-hidden className="reels-float absolute right-3 top-2 text-4xl opacity-90">📝</span>
                  <h2 className="text-2xl font-black leading-tight">
                    {L('heyRunner')} <span className="reels-wave">👋</span>
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-white/90">{L('tellUs')}</p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/25">
                      <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${(filled / 5) * 100}%` }} />
                    </div>
                    <span className="text-xs font-black tabular-nums">
                      {filled === 5 ? `🎉 ${L('allSet')}` : `${filled}/5`}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Name */}
                  <div className={qCard(errors.fullName)}>
                    <p className={qTitle}><span className={qIcon}>😊</span>{L('fullName')} <span className="text-pink-500">*</span></p>
                    <input className={inputCls} value={form.fullName} autoComplete="name" placeholder={L('namePh')}
                      onChange={e => setForm({ ...form, fullName: e.target.value })} />
                    {firstName.length >= 2 && (
                      <p className="mt-2 text-sm font-bold text-pink-600">{L('niceToMeet')}, {firstName}! <span className="reels-wave">👋</span></p>
                    )}
                    {err('fullName')}
                  </div>

                  {/* Mobile */}
                  <div className={qCard(errors.mobile)}>
                    <p className={qTitle}><span className={qIcon}>📱</span>{L('mobile')} <span className="text-pink-500">*</span></p>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">+91</span>
                      <input className={`${inputCls} pl-12`} value={form.mobile} inputMode="numeric" autoComplete="tel" maxLength={14}
                        placeholder="98765 43210" onChange={e => setForm({ ...form, mobile: e.target.value })} />
                      {normalizeMobile(form.mobile) && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg">✅</span>}
                    </div>
                    {err('mobile')}
                  </div>

                  {/* Age */}
                  <div className={qCard(errors.ageGroup)}>
                    <p className={qTitle}><span className={qIcon}>🎂</span>{L('ageGroup')} <span className="text-pink-500">*</span></p>
                    <Chips options={AGE_GROUPS} value={form.ageGroup} lang={lang} cols={3} emoji
                      onChange={v => setForm({ ...form, ageGroup: v })} />
                    {err('ageGroup')}
                  </div>

                  {/* Gender (optional) */}
                  <div className={qCard()}>
                    <p className={qTitle}><span className={qIcon}>🙋</span>{L('gender')}</p>
                    <Chips options={GENDERS} value={form.gender} lang={lang} cols={3} emoji
                      onChange={v => setForm({ ...form, gender: v })} />
                  </div>

                  {/* Area */}
                  <div className={qCard(errors.area)}>
                    <p className={qTitle}><span className={qIcon}>📍</span>{L('area')} <span className="text-pink-500">*</span></p>
                    <Chips options={AREAS} value={form.area} lang={lang} cols={3} emoji
                      onChange={v => setForm({ ...form, area: v })} />
                    {err('area')}
                  </div>

                  {/* Participant type */}
                  <div className={qCard(errors.participantType)}>
                    <p className={qTitle}><span className={qIcon}>✨</span>{L('type')} <span className="text-pink-500">*</span></p>
                    <Chips options={PARTICIPANT_TYPES} value={form.participantType} lang={lang} emoji
                      onChange={v => setForm({ ...form, participantType: v })} />
                    {err('participantType')}
                  </div>

                  {/* Instagram */}
                  <div className={qCard(errors.instagram)}>
                    <p className={qTitle}>
                      <span className={`${qIcon} bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 text-white`}>
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                          <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                        </svg>
                      </span>
                      {L('instagram')}
                    </p>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-pink-500">@</span>
                      <input className={`${inputCls} pl-9`} value={form.instagram} autoCapitalize="none" autoCorrect="off"
                        placeholder="your.handle" onChange={e => setForm({ ...form, instagram: e.target.value })} />
                    </div>
                    {errors.instagram && <p className="mt-1 text-sm text-red-600">@username</p>}
                  </div>

                  {/* Privacy notice (plain text, §6) */}
                  <p className="rounded-3xl border-2 border-slate-200 bg-white p-4 text-xs text-slate-600">🔒 {L('privacy')}</p>
                </div>

                {message && <p className="mt-3 text-sm font-semibold text-red-600">{message}</p>}
                <div className="mt-5 flex gap-3">
                  <button className={`${ghostBtn} !w-1/3`} onClick={() => go('welcome')}>{L('back')}</button>
                  <button className={primaryBtn} onClick={() => validateDetails() && go('survey')}>{L('next')} 🚀</button>
                </div>
              </div>
            )}

            {/* ── 3. Survey (Sections B–E, all optional) ── */}
            {step === 'survey' && (
              <div className="space-y-5">
                <JourneyBar stage={1} lang={lang} />
                <div>
                  <h2 className="text-xl font-black">{L('survey')}</h2>
                  <p className="mt-1 text-sm text-slate-500">{L('surveyNote')}</p>
                </div>
                {(['B', 'C', 'D', 'E'] as const).map(sec => {
                  const qs = questions.filter(q => q.section === sec);
                  if (!qs.length) return null;
                  return (
                    <section key={sec} className="space-y-4 rounded-3xl border-2 border-slate-100 bg-white p-4">
                      <h3 className="text-base font-black text-slate-900">{L(`sec${sec}` as 'secB')}</h3>
                      {qs.map(q => {
                        const v = survey[q.id];
                        if (q.pledge) {
                          const on = v === 'yes';
                          return (
                            <label key={q.id} className={`block cursor-pointer rounded-2xl border-2 p-4 transition-all ${on ? 'border-emerald-400 bg-emerald-50 shadow-md shadow-emerald-100' : 'border-amber-200 bg-amber-50'}`}>
                              <p className="text-sm font-bold text-slate-800">✋ {q.text[lang]}</p>
                              <p className="mt-2 text-lg font-black leading-snug text-emerald-800">“{PLEDGE_TEXT.ta}”</p>
                              <p className="text-xs italic text-slate-500">{PLEDGE_TEXT.en}</p>
                              <span className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                                <input type="checkbox" className="h-5 w-5 accent-emerald-600" checked={on}
                                  onChange={e => setSurvey({ ...survey, [q.id]: e.target.checked ? 'yes' : '' })} />
                                {L('pledgeTick')}
                              </span>
                            </label>
                          );
                        }
                        return (
                          <div key={q.id}>
                            <p className="mb-2 text-sm font-semibold text-slate-800">{q.text[lang]}</p>
                            {q.options && q.multi ? (
                              <MultiChips options={q.options} value={Array.isArray(v) ? v : []} lang={lang}
                                onChange={list => setSurvey({ ...survey, [q.id]: list })} />
                            ) : q.options ? (
                              <Chips options={q.options} value={typeof v === 'string' ? v : ''} lang={lang}
                                onChange={val => setSurvey({ ...survey, [q.id]: val })} />
                            ) : (
                              <input className={inputCls} placeholder={L('shortAnswer')} maxLength={200} value={typeof v === 'string' ? v : ''}
                                onChange={e => setSurvey({ ...survey, [q.id]: e.target.value })} />
                            )}
                          </div>
                        );
                      })}
                    </section>
                  );
                })}
                <div className="rounded-2xl bg-sky-50 border border-sky-100 p-4 text-sm">
                  <p className="font-bold text-sky-900">{L('help')}</p>
                  <ul className="mt-2 space-y-1">
                    {HELPLINES.map(h => (
                      <li key={h.number}>
                        <a href={`tel:${h.number}`} className="font-black text-sky-700">{h.number}</a>
                        <span className="text-sky-900/80"> — {h.label[lang]}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {message && <p className="text-sm font-semibold text-red-600">{message}</p>}
                <div className="flex gap-3">
                  <button className={`${ghostBtn} !w-1/3`} onClick={() => go('details')}>{L('back')}</button>
                  <button className={primaryBtn} disabled={busy} onClick={register}>{busy ? '…' : L('getCode')}</button>
                </div>
              </div>
            )}

            {/* ── 4. Your code + caption + rules ── */}
            {step === 'code' && saved && (
              <div className="space-y-5">
                <div className="text-center">
                  <p className="text-sm font-semibold text-emerald-700">
                    {welcomeBack ? L('welcomeBack') : `🎉 ${L('hi')}, ${saved.firstName}!`}
                  </p>
                  <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">{L('yourCode')}</p>
                  <p className="mt-1 select-all text-4xl font-black tracking-tight text-slate-900">{saved.code}</p>
                </div>

                <div className="rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50 p-4">
                  <p className="mb-2 text-sm font-bold text-orange-800">{L('caption')}</p>
                  <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800">{caption}</pre>
                  <button onClick={copyCaption}
                    className="mt-3 w-full rounded-xl bg-orange-500 py-3 font-bold text-white shadow hover:bg-orange-600">
                    {copied ? L('copied') : `📋 ${L('copy')}`}
                  </button>
                </div>

                <div>
                  <h3 className="font-black">{L('how')}</h3>
                  <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
                    {t.rules[lang].map(r => <li key={r}>{r}</li>)}
                  </ol>
                  <h3 className="mt-4 font-black text-red-700">{L('dont')}</h3>
                  <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                    {t.donts[lang].map(r => <li key={r}>✕ {r}</li>)}
                  </ul>
                  <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">🏆 {L('prizes')}</p>
                  <p className="mt-2 rounded-xl border-2 border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-900">⏰ {L('deadline')}</p>
                  <details className="mt-3 rounded-xl border-2 border-slate-200 bg-white p-3 text-sm">
                    <summary className="cursor-pointer font-black text-slate-800">📊 {L('scoringTitle')}</summary>
                    <ul className="mt-2 space-y-1.5 text-slate-700">
                      {t.scoring[lang].map(r => <li key={r}>• {r}</li>)}
                    </ul>
                  </details>
                </div>

                {saved.pledged && (
                  <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 text-center">
                    <p className="font-black text-emerald-800">{L('pledgeDone')}</p>
                    <button onClick={downloadCertificate} disabled={busy}
                      className="mt-3 w-full rounded-xl bg-emerald-600 py-3 font-bold text-white shadow hover:bg-emerald-700 disabled:opacity-60">
                      📜 {L('certificate')}
                    </button>
                  </div>
                )}

                {expo?.resultsPublished && (
                  <button onClick={openResults}
                    className="w-full rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-100 to-orange-100 py-4 text-base font-black text-amber-900 shadow-md">
                    {L('resultsOut')}
                  </button>
                )}
                <button className={primaryBtn} onClick={openSubmit}>🎬 {L('submitReel')}</button>
                <button className="w-full text-sm text-slate-400 underline"
                  onClick={() => {
                    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
                    setSaved(null); setForm(EMPTY_FORM); setSurvey({}); setErrors({}); go('welcome');
                  }}>
                  {L('notMe')}
                </button>
              </div>
            )}

            {/* ── 5. Submit reel ── */}
            {step === 'submit' && (
              <div className="space-y-4">
                <h2 className="text-xl font-black">{L('submitTitle')}</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>{L('mobile')}</label>
                    <input className={inputCls} inputMode="numeric" value={sub.mobile}
                      onChange={e => setSub({ ...sub, mobile: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>{L('code')}</label>
                    <input className={inputCls} value={sub.code} autoCapitalize="characters"
                      onChange={e => setSub({ ...sub, code: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{L('reelUrl')} *</label>
                  <input className={inputCls} inputMode="url" placeholder="https://www.instagram.com/reel/..."
                    value={sub.reelUrl} onChange={e => setSub({ ...sub, reelUrl: e.target.value })} />
                  <p className="mt-1 text-xs text-slate-500">{L('reelUrlHint')}</p>
                </div>
                <div>
                  <label className={labelCls}>{L('screenshot')} *</label>
                  <p className="mb-2 text-xs text-slate-500">{L('screenshotHint')}</p>
                  <input type="file" accept="image/png,image/jpeg,image/webp"
                    onChange={e => setScreenshot(e.target.files?.[0] ?? null)}
                    className="w-full text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-4 file:py-2.5 file:font-semibold file:text-emerald-700" />
                </div>
                <details className="rounded-xl border-2 border-slate-200 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-700">{L('numbers')}</summary>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {METRIC_FIELDS.map(m => (
                      <div key={m.id}>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">{m.label[lang]}</label>
                        <input className={`${inputCls} h-10`} inputMode="numeric" value={metrics[m.id] ?? ''}
                          onChange={e => setMetrics({ ...metrics, [m.id]: e.target.value.replace(/[^\d]/g, '') })} />
                      </div>
                    ))}
                  </div>
                </details>
                {message && <p className="text-sm font-semibold text-red-600">{message}</p>}
                <div className="flex gap-3">
                  <button className={`${ghostBtn} !w-1/3`} onClick={() => go(saved ? 'code' : 'welcome')}>{L('back')}</button>
                  <button className={primaryBtn} disabled={busy || !sub.reelUrl || !screenshot} onClick={submitReel}>
                    {busy ? '…' : L('submit')}
                  </button>
                </div>
              </div>
            )}

            {/* ── 6. Done ── */}
            {step === 'done' && (
              <div className="text-center">
                <div className="text-6xl">🏅</div>
                <h2 className="mt-3 text-2xl font-black">{L('doneTitle')}</h2>
                <p className="mt-3 text-slate-600">{L('doneText')}</p>
                <button className={`${primaryBtn} mt-6`} onClick={() => go(saved ? 'code' : 'welcome')}>{L('backToCode')}</button>
              </div>
            )}

            {/* ── 10. Results: leaderboard + certificate download (after "Publish results") ── */}
            {step === 'results' && (
              <div className="space-y-5">
                <h2 className="text-2xl font-black">{L('resultsTitle')}</h2>

                {!board ? (
                  <p className="py-6 text-center text-slate-400">…</p>
                ) : (
                  <>
                    {board.winners.length > 0 && (
                      <section className="rounded-3xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
                        <h3 className="mb-3 font-black text-amber-900">🎉 {L('winnersTitle')}</h3>
                        <ul className="space-y-2">
                          {board.winners.map(w => (
                            <li key={w.prize + w.code} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2 shadow-sm">
                              <span className="text-sm font-bold text-amber-800">{PRIZE_CATEGORIES.find(p => p.id === w.prize)?.label ?? w.title}</span>
                              <span className="text-right text-sm font-black text-slate-900">{w.name} <span className="block text-[11px] font-semibold text-slate-400">{w.code}</span></span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    <section className="rounded-3xl border-2 border-slate-100 bg-white p-4">
                      <h3 className="mb-2 font-black">🏅 {L('topTen')}</h3>
                      {board.leaderboard.length === 0 ? (
                        <p className="py-4 text-center text-sm text-slate-400">{L('noResultsYet')}</p>
                      ) : (
                        <ol className="divide-y divide-slate-100">
                          {board.leaderboard.map(e => (
                            <li key={e.code} className="flex items-center gap-3 py-2">
                              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${e.rank === 1 ? 'bg-amber-100 text-amber-700' : e.rank === 2 ? 'bg-slate-200 text-slate-700' : e.rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500'}`}>{e.rank}</span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-bold text-slate-900">{e.name}</span>
                                <span className="block text-[11px] text-slate-400">{e.code}</span>
                              </span>
                              <span className="text-sm font-black tabular-nums text-slate-800">{e.score} <span className="text-[10px] font-semibold text-slate-400">{L('points')}</span></span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </section>
                  </>
                )}

                {/* Own result + certificate */}
                <section className="rounded-3xl border-2 border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
                  <h3 className="font-black text-emerald-900">📜 {L('myResult')}</h3>
                  <p className="text-xs text-emerald-900/70">{L('myResultNote')}</p>
                  <input className={inputCls} inputMode="numeric" placeholder="98765 43210" value={resQ.mobile}
                    onChange={e => setResQ({ ...resQ, mobile: e.target.value })} />
                  <input className={inputCls} placeholder="#ERDMRTHN001" value={resQ.code}
                    onChange={e => setResQ({ ...resQ, code: e.target.value })} />
                  {message && <p className="text-sm font-semibold text-red-600">{message}</p>}
                  <button className={primaryBtn} disabled={busy} onClick={checkResult}>{busy && !myResult ? '…' : L('checkResult')}</button>

                  {myResult && (
                    myResult.eligible ? (
                      <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
                        <p className="text-sm text-slate-500">{myResult.name} · {myResult.code}</p>
                        {myResult.prize ? (
                          <p className="mt-1 text-lg font-black text-amber-700">🏆 {L('wonPrize')}: {PRIZE_CATEGORIES.find(p => p.id === myResult.prize)?.label}</p>
                        ) : null}
                        <p className="mt-1 font-bold text-slate-800">{L('yourRank')}: #{myResult.rank} · {myResult.score} {L('points')}</p>
                        <button onClick={downloadReelCertificate} disabled={busy}
                          className="mt-3 w-full rounded-xl bg-emerald-600 py-3 font-bold text-white shadow hover:bg-emerald-700 disabled:opacity-60">
                          📜 {L('downloadCert')}
                        </button>
                      </div>
                    ) : (
                      <p className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">{L('notEligible')}</p>
                    )
                  )}
                </section>

                <button className={ghostBtn} onClick={() => go(saved ? 'code' : 'welcome')}>{L('back')}</button>
              </div>
            )}

            {/* ── Find my code ── */}
            {step === 'lookup' && (
              <div className="space-y-4">
                <h2 className="text-xl font-black">{L('lookupTitle')}</h2>
                <div>
                  <label className={labelCls}>{L('mobile')}</label>
                  <input className={inputCls} inputMode="numeric" value={lookupMobile} placeholder="98765 43210"
                    onChange={e => setLookupMobile(e.target.value)} />
                </div>
                {message && <p className="text-sm font-semibold text-red-600">{message}</p>}
                <div className="flex gap-3">
                  <button className={`${ghostBtn} !w-1/3`} onClick={() => go('welcome')}>{L('back')}</button>
                  <button className={primaryBtn} disabled={busy} onClick={lookup}>{busy ? '…' : L('find')}</button>
                </div>
              </div>
            )}
          </main>
        )}
      </div>
    </div>
  );
}
