'use client';

/**
 * Admin → Expo → "Reels Contest" tab.
 * QR code · live counts · survey totals (aggregate only) · leaderboard · jury scoring · registrations + CSV.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';
import {
  Clapperboard, Copy, Download, ExternalLink, Image as ImageIcon, MessageCircle, QrCode, RefreshCw,
  Save, Search, ShieldAlert, Trophy, Users, CheckCircle2, Baby, Eye, Megaphone,
} from 'lucide-react';
import { AGE_GROUPS, AREAS, GENDERS, PARTICIPANT_TYPES, type Option } from '@/lib/reels';
import { PRIZE_CATEGORIES, scoreSubmissions, engagementsOf, type ScoreBreakdown } from '@/lib/reelsScore';

interface Participant {
  id: string;
  created_at: string;
  code: string;
  code_number: number;
  full_name: string;
  mobile: string;
  age_group: string;
  gender: string | null;
  area: string;
  participant_type: string;
  instagram_handle: string | null;
  guardian_consent: boolean | null;
  submissionCount: number;
}

interface Submission {
  id: string;
  created_at: string;
  participant_id: string;
  reel_url: string;
  insights_url: string | null;
  followers: number | null;
  reach: number | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  message_score: number | null;
  creativity_score: number | null;
  compliance_score: number | null;
  prize_category: string | null;
  status: string;
  admin_notes: string | null;
  participant: { code: string; full_name: string; mobile: string; instagram_handle: string | null; participant_type: string } | null;
}

interface SurveyStat {
  id: string;
  section: string;
  showFor: string | null;
  text: string;
  eligible: number;
  answered: number;
  options: { id: string; label: string; count: number }[] | null;
}

interface Data {
  expo: { id: string; name: string; enabled: boolean; isPrintedQrExpo: boolean };
  participants: Participant[];
  submissions: Submission[];
  survey: SurveyStat[];
}

const labelOf = (opts: Option[], id: string | null) => opts.find(o => o.id === id)?.label.en ?? '—';
const card = 'bg-white border border-slate-200/80 rounded-2xl shadow-sm';
const numInput =
  'w-full h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm tabular-nums text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15';

const EDIT_FIELDS = [
  'followers', 'reach', 'views', 'likes', 'comments', 'shares', 'saves',
  'message_score', 'creativity_score', 'compliance_score', 'status', 'prize_category', 'admin_notes',
] as const;
type Draft = Partial<Record<(typeof EDIT_FIELDS)[number], string>>;

const toDraft = (s: Submission): Draft =>
  Object.fromEntries(EDIT_FIELDS.map(f => [f, s[f] === null || s[f] === undefined ? '' : String(s[f])])) as Draft;

function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReelsContest({ expoId, adminToken }: { expoId: string; adminToken: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');

  useEffect(() => setOrigin(window.location.origin), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/reels/${expoId}`, { headers: { 'x-admin-token': adminToken }, cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setData(json);
      setDrafts(Object.fromEntries((json.submissions as Submission[]).map(s => [s.id, toDraft(s)])));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [expoId, adminToken]);

  useEffect(() => { load(); }, [load]);

  // Live scores from the CURRENT drafts, so the jury sees the total change as they type
  const scores = useMemo(() => {
    if (!data) return new Map<string, ScoreBreakdown>();
    const num = (v?: string) => (v === undefined || v === '' ? null : Number(v));
    return scoreSubmissions(
      data.submissions.map(s => {
        const d = drafts[s.id] ?? {};
        return {
          id: s.id,
          status: d.status ?? s.status,
          followers: num(d.followers), reach: num(d.reach), likes: num(d.likes), comments: num(d.comments),
          shares: num(d.shares), saves: num(d.saves),
          message_score: num(d.message_score), creativity_score: num(d.creativity_score), compliance_score: num(d.compliance_score),
        };
      }),
    );
  }, [data, drafts]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-slate-500 text-sm">
        <span className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /> Loading reels contest...
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-600 font-medium">{error || 'Failed to load'}</p>
        <button onClick={load} className="mt-3 text-sm font-semibold text-emerald-700 hover:underline">Try again</button>
      </div>
    );
  }

  const { participants, submissions, survey, expo } = data;
  const qrUrl = origin ? (expo.isPrintedQrExpo ? `${origin}/reels` : `${origin}/reels/${expo.id}`) : '';

  // ── Leaderboard: best non-disqualified reel per participant ──
  const bestByParticipant = new Map<string, { sub: Submission; score: ScoreBreakdown }>();
  for (const s of submissions) {
    const st = drafts[s.id]?.status ?? s.status;
    const sc = scores.get(s.id);
    if (!sc || st === 'disqualified') continue;
    const cur = bestByParticipant.get(s.participant_id);
    if (!cur || sc.total > cur.score.total) bestByParticipant.set(s.participant_id, { sub: s, score: sc });
  }
  const leaderboard = Array.from(bestByParticipant.values()).sort((a, b) => b.score.total - a.score.total).slice(0, 10);

  const q = search.trim().toLowerCase();
  const filteredParticipants = q
    ? participants.filter(p =>
        [p.full_name, p.mobile, p.code, p.instagram_handle ?? ''].some(v => v.toLowerCase().includes(q)))
    : participants;
  const filteredSubs = q
    ? submissions.filter(s =>
        [s.participant?.full_name ?? '', s.participant?.code ?? '', s.participant?.mobile ?? '', s.participant?.instagram_handle ?? '']
          .some(v => v.toLowerCase().includes(q)))
    : submissions;

  // ── Impact totals for the final report (saved numbers; disqualified reels left out) ──
  const counted = submissions.filter(s => s.status !== 'disqualified');
  const sum = (k: 'views' | 'reach') => counted.reduce((t, s) => t + (s[k] ?? 0), 0);
  const impact = {
    reels: counted.length,
    verified: counted.filter(s => s.status === 'valid').length,
    views: sum('views'),
    reach: sum('reach'),
    engagements: counted.reduce((t, s) => t + engagementsOf(s), 0),
  };
  const fmt = (v: number) => v.toLocaleString('en-IN');
  const impactText =
    `${expo.name} Impact Reel Challenge: ${fmt(impact.reels)} reels created ${fmt(impact.views)} views (impressions), ` +
    `reached ${fmt(impact.reach)} accounts and got ${fmt(impact.engagements)} likes, comments, shares and saves.`;

  const validCount = submissions.filter(s => (drafts[s.id]?.status ?? s.status) === 'valid').length;
  const statCards = [
    { icon: Users, value: participants.length, label: 'Registrations', bg: 'bg-sky-50 border-sky-100', color: 'text-sky-600' },
    { icon: Clapperboard, value: submissions.length, label: 'Reels submitted', bg: 'bg-pink-50 border-pink-100', color: 'text-pink-600' },
    { icon: CheckCircle2, value: validCount, label: 'Valid entries', bg: 'bg-emerald-50 border-emerald-100', color: 'text-emerald-600' },
    { icon: Baby, value: participants.filter(p => p.age_group === 'under_18').length, label: 'Under 18', bg: 'bg-amber-50 border-amber-100', color: 'text-amber-600' },
  ];

  const breakdown = (title: string, opts: Option[], key: 'participant_type' | 'area' | 'age_group' | 'gender') => {
    const total = participants.length || 1;
    return (
      <div className={`${card} p-4`}>
        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">{title}</h4>
        <ul className="space-y-2">
          {opts.map(o => {
            const c = participants.filter(p => p[key] === o.id).length;
            return (
              <li key={o.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-700 font-medium">{o.label.en}</span>
                  <span className="tabular-nums text-slate-500">{c}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(c / total) * 100}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const setDraft = (id: string, f: keyof Draft, v: string) => setDrafts(d => ({ ...d, [id]: { ...d[id], [f]: v } }));
  const isDirty = (s: Submission) => {
    const d = drafts[s.id];
    const o = toDraft(s);
    return !!d && EDIT_FIELDS.some(f => (d[f] ?? '') !== (o[f] ?? ''));
  };

  const save = async (s: Submission) => {
    const d = drafts[s.id];
    const o = toDraft(s);
    const fields = Object.fromEntries(EDIT_FIELDS.filter(f => (d[f] ?? '') !== (o[f] ?? '')).map(f => [f, d[f] ?? '']));
    setSaving(s.id);
    try {
      const res = await fetch(`/api/admin/reels/${expoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify({ id: s.id, fields }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Save failed');
      // Reflect the saved values locally so the row is no longer "dirty"
      setData(prev => prev && ({
        ...prev,
        submissions: prev.submissions.map(x => {
          if (x.id !== s.id) return x;
          const next = { ...x } as Record<string, unknown>;
          for (const [f, v] of Object.entries(fields)) {
            next[f] = v === '' ? null : ['status', 'prize_category', 'admin_notes'].includes(f) ? v : Number(v);
          }
          return next as unknown as Submission;
        }),
      }));
      toast.success(`Saved ${s.participant?.code ?? ''}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(null);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(qrUrl).catch(() => undefined);
    toast.success('Link copied');
  };
  const downloadQr = () => {
    const canvas = document.getElementById('reels-admin-qr') as HTMLCanvasElement | null;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `${expo.name.replace(/\s+/g, '-')}-reels-qr.png`;
    a.click();
  };

  const exportRegistrations = () =>
    downloadCsv(`${expo.name.replace(/\s+/g, '-')}-reels-registrations.csv`, [
      ['#', 'Registered', 'Code', 'Name', 'Mobile', 'Instagram', 'Age group', 'Gender', 'Area', 'Type', 'Reels submitted'],
      ...participants.slice().reverse().map((p, i) => [
        i + 1, new Date(p.created_at).toLocaleString('en-IN'), p.code, p.full_name, p.mobile, p.instagram_handle ? `@${p.instagram_handle}` : '',
        labelOf(AGE_GROUPS, p.age_group), labelOf(GENDERS, p.gender), labelOf(AREAS, p.area), labelOf(PARTICIPANT_TYPES, p.participant_type),
        p.submissionCount,
      ]),
    ]);

  const exportScores = () =>
    downloadCsv(`${expo.name.replace(/\s+/g, '-')}-reels-scores.csv`, [
      ['Code', 'Name', 'Mobile', 'Instagram', 'Reel link', 'Status', 'Followers', 'Reach', 'Views', 'Likes', 'Comments', 'Shares', 'Saves',
        'Engagements', 'Reach pts (30)', 'Engagement pts (25)', 'Message (25)', 'Creativity (15)', 'Compliance (5)', 'Total (100)', 'Prize', 'Notes', 'Submitted'],
      ...submissions.map(s => {
        const sc = scores.get(s.id);
        return [
          s.participant?.code ?? '', s.participant?.full_name ?? '', s.participant?.mobile ?? '',
          s.participant?.instagram_handle ? `@${s.participant.instagram_handle}` : '', s.reel_url, s.status,
          s.followers ?? '', s.reach ?? '', s.views ?? '', s.likes ?? '', s.comments ?? '', s.shares ?? '', s.saves ?? '',
          engagementsOf(s), sc?.reach ?? '', sc?.engagement ?? '', sc?.message ?? '', sc?.creativity ?? '', sc?.compliance ?? '', sc?.total ?? '',
          PRIZE_CATEGORIES.find(p => p.id === s.prize_category)?.label ?? '', s.admin_notes ?? '', new Date(s.created_at).toLocaleString('en-IN'),
        ];
      }),
    ]);

  return (
    <div className="space-y-5 py-5">
      {!expo.enabled && (
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm font-medium">
          The reels contest is not switched on for this expo (only marathon expos have it).
        </div>
      )}

      {/* QR + counts */}
      <div className="grid gap-4 lg:grid-cols-[auto,1fr]">
        <div className={`${card} p-5 flex gap-5 items-center`}>
          <div className="rounded-xl border border-slate-200 p-2 bg-white">
            {qrUrl ? <QRCodeCanvas id="reels-admin-qr" value={qrUrl} size={132} level="H" marginSize={2} /> : <div className="w-[132px] h-[132px]" />}
          </div>
          <div className="min-w-0 space-y-2">
            <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900"><QrCode className="w-4 h-4 text-emerald-600" /> Contest QR</p>
            <p className="text-xs text-slate-500 break-all max-w-[16rem]">{qrUrl}</p>
            {expo.isPrintedQrExpo && (
              <p className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-2 py-0.5 inline-block">
                ✓ Same as the printed QR
              </p>
            )}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button onClick={copyLink} className="flex items-center gap-1 text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50"><Copy className="w-3.5 h-3.5" /> Copy</button>
              <button onClick={downloadQr} className="flex items-center gap-1 text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50"><Download className="w-3.5 h-3.5" /> PNG</button>
              <a href={qrUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50"><ExternalLink className="w-3.5 h-3.5" /> Open</a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {statCards.map(s => (
            <div key={s.label} className={`${card} p-4 flex items-center gap-4`}>
              <div className={`w-11 h-11 ${s.bg} border rounded-xl flex items-center justify-center shrink-0`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-extrabold text-slate-900 tracking-tight tabular-nums">{s.value}</div>
                <div className="text-slate-500 text-xs font-medium">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total impressions — the "how many impressions did we create" figure for the final report */}
      <section className="rounded-2xl border border-pink-200 bg-gradient-to-r from-pink-50 to-orange-50 p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mr-auto">
            <Megaphone className="w-4 h-4 text-pink-600" /> Total impressions <span className="text-slate-400 font-medium">(for the final report)</span>
          </h3>
          <button onClick={async () => { await navigator.clipboard.writeText(impactText).catch(() => undefined); toast.success('Copied'); }}
            className="flex items-center gap-1 text-xs font-semibold border border-pink-200 bg-white rounded-lg px-2.5 py-1.5 hover:bg-pink-50">
            <Copy className="w-3.5 h-3.5" /> Copy summary
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Views (impressions)', value: impact.views, big: true },
            { label: 'Accounts reached', value: impact.reach },
            { label: 'Likes, comments, shares, saves', value: impact.engagements },
            { label: 'Reels counted', value: impact.reels },
          ].map(c => (
            <div key={c.label} className="rounded-xl bg-white/80 border border-white p-4">
              <div className={`font-extrabold tabular-nums tracking-tight ${c.big ? 'text-3xl text-pink-600' : 'text-2xl text-slate-900'}`}>
                {c.big && <Eye className="inline w-6 h-6 mr-1.5 -mt-1" />}{fmt(c.value)}
              </div>
              <div className="text-xs font-medium text-slate-500 mt-0.5">{c.label}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-slate-500">
          Adds up the numbers from every reel except disqualified ones ({impact.verified} of {impact.reels} verified as valid).
          Correct a reel&apos;s numbers below and press Save, and these totals update.
        </p>
      </section>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, mobile, code, @handle..."
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:border-emerald-500" />
        </div>
        <button onClick={load} className="ml-auto flex items-center gap-1.5 text-sm font-semibold border border-slate-200 bg-white rounded-xl px-3 py-2 hover:bg-slate-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Leaderboard */}
      <section className={`${card} p-5`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Leaderboard <span className="text-slate-400 font-medium">(top 10 · best reel per person)</span></h3>
          <button onClick={exportScores} disabled={!submissions.length}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
            <Download className="w-3.5 h-3.5" /> Scores CSV
          </button>
        </div>
        {leaderboard.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No reels submitted yet</p>
        ) : (
          <ol className="divide-y divide-slate-100">
            {leaderboard.map(({ sub, score }, i) => (
              <li key={sub.id} className="flex items-center gap-3 py-2.5">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500'}`}>{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{sub.participant?.full_name} <span className="text-slate-400 font-medium">{sub.participant?.code}</span></p>
                  <p className="text-[11px] text-slate-500">
                    Reach {score.reach} · Engagement {score.engagement} · Message {score.message} · Creativity {score.creativity} · Rules {score.compliance}
                    {(drafts[sub.id]?.status ?? sub.status) === 'pending' && <span className="ml-1.5 text-amber-600 font-semibold">(not verified yet)</span>}
                  </p>
                </div>
                <span className="text-lg font-extrabold tabular-nums text-slate-900">{score.total}</span>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-3 text-[11px] text-slate-400">
          Reach 30 + Engagement 25 are compared with the other entries (half absolute, half relative to followers so small accounts are fair).
          Message 25, Creativity 15 and Rules 5 are typed by the jury below. Formula is provisional until published.
        </p>
      </section>

      {/* Submissions — jury scoring */}
      <section className={`${card} overflow-hidden`}>
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Reel submissions <span className="text-slate-400 font-medium">({filteredSubs.length})</span></h3>
          <p className="text-xs text-slate-500 mt-0.5">Check each reel and its Insights screenshot, correct the numbers if needed, add jury marks, set the status, then Save.</p>
        </div>
        {filteredSubs.length === 0 && <p className="px-5 py-10 text-center text-sm text-slate-400">No submissions yet</p>}
        <div className="divide-y divide-slate-100">
          {filteredSubs.map(s => {
            const d = drafts[s.id] ?? {};
            const sc = scores.get(s.id);
            const dirty = isDirty(s);
            const status = d.status ?? s.status;
            const phone = (s.participant?.mobile ?? '').replace(/\D/g, '');
            return (
              <div key={s.id} className={`p-5 ${status === 'disqualified' ? 'bg-red-50/40' : ''}`}>
                <div className="flex flex-wrap items-start gap-4">
                  {/* Screenshot */}
                  {s.insights_url ? (
                    <a href={s.insights_url} target="_blank" rel="noopener noreferrer" className="shrink-0" title="Open Insights screenshot">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.insights_url} alt="Insights" className="w-20 h-28 object-cover rounded-lg border border-slate-200 hover:ring-2 hover:ring-emerald-400" />
                    </a>
                  ) : (
                    <div className="w-20 h-28 rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-slate-300"><ImageIcon className="w-6 h-6" /></div>
                  )}

                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-bold text-slate-900">{s.participant?.full_name}</span>
                      <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-100 rounded-md px-1.5 py-0.5">{s.participant?.code}</span>
                      {s.participant?.instagram_handle && (
                        <a href={`https://instagram.com/${s.participant.instagram_handle}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-pink-600 hover:underline">@{s.participant.instagram_handle}</a>
                      )}
                      {phone && (
                        <a href={`https://wa.me/91${phone}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><MessageCircle className="w-3 h-3" />{s.participant?.mobile}</a>
                      )}
                      <a href={s.reel_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:underline"><ExternalLink className="w-3 h-3" />Open reel</a>
                      <span className="text-[11px] text-slate-400">{new Date(s.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>

                    {/* Insights numbers */}
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {(['followers', 'reach', 'views', 'likes', 'comments', 'shares', 'saves'] as const).map(f => (
                        <label key={f} className="block">
                          <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">{f}</span>
                          <input className={numInput} inputMode="numeric" value={d[f] ?? ''}
                            onChange={e => setDraft(s.id, f, e.target.value.replace(/[^\d]/g, ''))} />
                        </label>
                      ))}
                    </div>

                    {/* Jury marks + status */}
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-end">
                      {([['message_score', 'Message /25', 25], ['creativity_score', 'Creativity /15', 15], ['compliance_score', 'Rules /5', 5]] as const).map(([f, label, max]) => (
                        <label key={f} className="block">
                          <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">{label}</span>
                          <input className={numInput} type="number" min={0} max={max} step={0.5} value={d[f] ?? ''}
                            onChange={e => setDraft(s.id, f, e.target.value)} />
                        </label>
                      ))}
                      <label className="block">
                        <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Status</span>
                        <select className={numInput} value={status} onChange={e => setDraft(s.id, 'status', e.target.value)}>
                          <option value="pending">Pending</option>
                          <option value="valid">Valid</option>
                          <option value="disqualified">Disqualified</option>
                        </select>
                      </label>
                      <label className="block col-span-2">
                        <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Prize</span>
                        <select className={numInput} value={d.prize_category ?? ''} onChange={e => setDraft(s.id, 'prize_category', e.target.value)}>
                          <option value="">—</option>
                          {PRIZE_CATEGORIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                        </select>
                      </label>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <input className={`${numInput} flex-1 min-w-[12rem]`} placeholder="Notes (e.g. hashtag missing, spike checked)" maxLength={500}
                        value={d.admin_notes ?? ''} onChange={e => setDraft(s.id, 'admin_notes', e.target.value)} />
                      <span className="text-sm text-slate-500">Score <b className="text-lg text-slate-900 tabular-nums">{sc?.total ?? 0}</b>/100</span>
                      <button onClick={() => save(s)} disabled={!dirty || saving === s.id}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold px-3.5 py-2 rounded-lg">
                        <Save className="w-4 h-4" /> {saving === s.id ? 'Saving…' : dirty ? 'Save' : 'Saved'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Who registered */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {breakdown('Participant type', PARTICIPANT_TYPES, 'participant_type')}
        {breakdown('Area', AREAS, 'area')}
        {breakdown('Age group', AGE_GROUPS, 'age_group')}
        {breakdown('Gender', GENDERS, 'gender')}
      </div>

      {/* Survey totals */}
      <section className={`${card} p-5`}>
        <h3 className="text-sm font-bold text-slate-900">Awareness survey <span className="text-slate-400 font-medium">(totals only)</span></h3>
        <p className="text-xs text-slate-500 mt-0.5 mb-4 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          Individual answers are never shown. Follow up families only through trained JKKN counsellors.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {survey.map(sq => (
            <div key={sq.id} className="rounded-xl border border-slate-100 p-4">
              <p className="text-sm font-semibold text-slate-800">{sq.text}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 mb-3">
                {sq.showFor ? `${sq.showFor === 'parent' ? 'Parents' : 'Students'} only · ` : ''}{sq.answered} of {sq.eligible} answered
              </p>
              {sq.options ? (
                <ul className="space-y-1.5">
                  {sq.options.map(o => (
                    <li key={o.id}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{o.label}</span>
                        <span className="tabular-nums text-slate-500">
                          {o.count}{sq.answered ? ` · ${Math.round((o.count / sq.answered) * 100)}%` : ''}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-sky-500" style={{ width: `${sq.answered ? (o.count / sq.answered) * 100 : 0}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">Free-text answers: {sq.answered} (not displayed)</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Registrations */}
      <section className={`${card} overflow-hidden`}>
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <h3 className="text-sm font-bold text-slate-900 mr-auto">Registrations <span className="text-slate-400 font-medium">({filteredParticipants.length})</span></h3>
          <button onClick={exportRegistrations} disabled={!participants.length}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-lg">
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Code', 'Registered', 'Name', 'WhatsApp', 'Instagram', 'Age', 'Type', 'Area', 'Reels'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParticipants.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400">No registrations yet</td></tr>
              )}
              {filteredParticipants.map(p => (
                <tr key={p.id} className="hover:bg-emerald-50/40">
                  <td className="px-4 py-3"><span className="font-bold text-xs text-orange-700 bg-orange-50 border border-orange-100 rounded-md px-1.5 py-0.5 whitespace-nowrap">{p.code}</span></td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(p.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{p.full_name}</td>
                  <td className="px-4 py-3">
                    <a href={`https://wa.me/91${p.mobile}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-emerald-700 font-medium whitespace-nowrap">
                      <MessageCircle className="w-3.5 h-3.5" />{p.mobile}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    {p.instagram_handle
                      ? <a href={`https://instagram.com/${p.instagram_handle}`} target="_blank" rel="noopener noreferrer" className="text-pink-600 font-medium hover:underline">@{p.instagram_handle}</a>
                      : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {labelOf(AGE_GROUPS, p.age_group)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{labelOf(PARTICIPANT_TYPES, p.participant_type)}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{labelOf(AREAS, p.area)}</td>
                  <td className="px-4 py-3 tabular-nums text-center">{p.submissionCount || <span className="text-slate-400">0</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
