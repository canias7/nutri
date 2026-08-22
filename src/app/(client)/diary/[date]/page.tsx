import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import {
  ComplaintsSection,
  DaytimeSection,
  EveningSection,
  ExtraSupplementsSection,
  MorningSection,
} from "@/components/diary/sections";
import { DayDiscussion } from "@/components/diary/day-discussion";
import { DiarySectionsProvider } from "@/components/diary/diary-sections";
import { PostDay } from "@/components/diary/post-day";
import { FoodSection } from "@/components/diary/food-section";
import { SupplementsChecklist } from "@/components/diary/supplements-checklist";
import { WaterSection } from "@/components/diary/water-section";
import { WeekStrip } from "@/components/diary/week-strip";
import { requireClient } from "@/lib/auth/session";
import { WeightText } from "@/components/units/readouts";
import { describeDay, type SectionKey } from "@/lib/diary/completeness";
import { isValidDateParam } from "@/lib/diary/date";
import { resolveToday } from "@/lib/diary/today";
import { getDayComments, getDiaryDay, type DiaryDay } from "@/lib/diary/queries";
import { formatNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Diary · nutri" };

export default async function DiaryPage({
  params,
}: PageProps<"/diary/[date]">) {
  const { date } = await params;

  // Rendered inline rather than through notFound(). This segment streams behind
  // its loading skeleton, so by the time notFound() could fire the response has
  // already gone out as a 200 — the reader gets a broken suspense boundary
  // instead of an answer. A mistyped or stale date is best answered with a way
  // back, not an error.
  if (!isValidDateParam(date)) {
    return <InvalidDate value={date} />;
  }

  const { viewer, client } = await requireClient();
  const [day, today] = await Promise.all([
    getDiaryDay(viewer.id, date),
    resolveToday(),
  ]);

  const [comments, coachName, photoUrls] = await Promise.all([
    day.log ? getDayComments(day.log.id, viewer.id) : Promise.resolve([]),
    getCoachName(client.nutritionist_id),
    signPhotos(day.meals.flatMap((meal) => meal.photo_paths)),
  ]);
  const hasUnread = comments.some((comment) => !comment.mine);

  // One reading of the day, shared by every row's pill and by Post. Two copies
  // of "a day is finished when…" is how a row comes to say Done under a Post
  // that refuses.
  const need = describeDay({
    wakeTime: day.log?.wake_time ?? null,
    weightKg: day.log?.weight_kg === null || day.log?.weight_kg === undefined
      ? null
      : Number(day.log.weight_kg),
    energyLevel: day.log?.energy_level ?? null,
    bedTime: day.log?.bed_time ?? null,
    drinkCount: day.drinks.length,
    meals: day.meals.map((meal) => ({ eaten: meal.eaten, eatenAt: meal.eaten_at })),
    activeSupplements: day.supplements.length,
    takenSupplements: day.takenSupplementIds.length,
  });

  const summary = daySummaries(day, client.water_target_ml, comments.length);

  return (
    <DiarySectionsProvider>
      <div className="flex flex-col gap-5">
        {/* The strip reaches a week back; the dashboard's All history link
          is the way to anything older. */}
        <WeekStrip date={date} today={today} />

        <MorningSection date={date} log={day.log}
          need={need.morning}
          summary={summary.morning}
        />

        <WaterSection
          need={need.water}
          summary={summary.water}
          date={date}
          drinks={day.drinks}
          totalMl={day.log?.water_total_ml ?? 0}
          targetMl={client.water_target_ml}
        />

        <FoodSection
          need={need.food}
          summary={summary.food}
          date={date}
          meals={day.meals}
          clientId={viewer.id}
          photoUrls={photoUrls}
        />

        <DaytimeSection date={date} log={day.log}
          need={need.daytime}
          summary={summary.daytime}
        />

        <SupplementsChecklist
          need={need.supplements}
          summary={summary.supplements}
          date={date}
          supplements={day.supplements}
          takenIds={day.takenSupplementIds}
        />
        <ExtraSupplementsSection date={date} log={day.log}
          need={need.extras}
          summary={summary.extras}
        />

        <EveningSection date={date} log={day.log}
          need={need.evening}
          summary={summary.evening}
        />

        <ComplaintsSection date={date} log={day.log}
          need={need.complaints}
          summary={summary.complaints}
        />

        <DayDiscussion
          need={need.discussion}
          summary={summary.discussion}
          date={date}
          dailyLogId={day.log?.id ?? null}
          comments={comments}
          coachName={coachName}
          hasUnread={hasUnread}
        />

        <PostDay date={date} postedAt={day.log?.posted_at ?? null} />
      </div>
    </DiarySectionsProvider>
  );
}

/**
 * Short-lived links to the day's photos.
 *
 * The bucket is private, so nothing is readable without one of these — and they
 * are minted per request rather than stored, so a link that leaks stops working
 * within the hour.
 */
async function signPhotos(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};

  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("meal-photos")
    .createSignedUrls(paths, 60 * 60);

  const urls: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.path && row.signedUrl) urls[row.path] = row.signedUrl;
  }
  return urls;
}

async function getCoachName(
  nutritionistId: string | null,
): Promise<string | null> {
  if (!nutritionistId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", nutritionistId)
    .maybeSingle();
  return data?.full_name || null;
}

/**
 * The line each closed row shows: what is already in that section.
 *
 * Written from the day rather than from the form, so a row reports what was
 * saved and not what is sitting unsent in an input. Empty sections return
 * undefined and the row shows its title alone — "Nothing yet" on eight rows is
 * eight lines of nothing.
 */
function daySummaries(
  day: DiaryDay,
  waterTargetMl: number,
  commentCount: number,
): Partial<Record<SectionKey, ReactNode>> {
  const log = day.log;
  const time = (value: string | null | undefined) => (value ? value.slice(0, 5) : null);
  const join = (parts: (ReactNode | null)[]) => {
    const kept = parts.filter((part) => part !== null && part !== "");
    if (kept.length === 0) return undefined;
    return kept.map((part, index) => (
      <span key={index}>
        {index > 0 ? " · " : ""}
        {part}
      </span>
    ));
  };

  const eaten = day.meals.map((meal) => meal.eaten.trim()).filter(Boolean);
  const ticked = day.takenSupplementIds.length;

  return {
    morning: join([
      time(log?.wake_time),
      log?.weight_kg === null || log?.weight_kg === undefined ? null : (
        <WeightText kg={Number(log.weight_kg)} />
      ),
      log?.energy_level === null || log?.energy_level === undefined
        ? null
        : `energy ${log.energy_level}`,
    ]),

    water: day.drinks.length
      ? `${formatNumber(log?.water_total_ml ?? 0)} of ${formatNumber(waterTargetMl)} ml`
      : undefined,

    // The food itself, not a count — "2 entries" tells you nothing you wanted.
    food: eaten.length ? eaten.join(", ") : undefined,

    daytime: join([log?.activity_type || null, log?.stress_level ? `stress ${log.stress_level}` : null]),

    supplements: day.supplements.length
      ? `${ticked} of ${day.supplements.length} ticked`
      : undefined,

    extras: log?.extra_supplements || undefined,

    evening: join([
      time(log?.bed_time) ? `asleep ${time(log?.bed_time)}` : null,
      log?.evening_ritual || null,
    ]),

    complaints: join([
      log?.complaint_emotional || null,
      log?.complaint_digestion || null,
      log?.complaint_skin || null,
      log?.complaint_other || null,
    ]),

    discussion: commentCount
      ? `${commentCount} ${commentCount === 1 ? "message" : "messages"}`
      : undefined,
  };
}

function InvalidDate({ value }: { value: string }) {
  return (
    <div className="flex flex-col items-start gap-3 py-8">
      <h1 className="text-xl font-semibold tracking-tight">
        That isn&apos;t a date
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        <span className="font-mono">{value.slice(0, 40)}</span> is not a day we
        can open. Dates look like 2026-08-22.
      </p>
      <div className="flex gap-2">
        <Link
          href="/diary"
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Today&apos;s diary
        </Link>
        <Link
          href="/history"
          className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 dark:border-white/15 dark:hover:bg-white/5"
        >
          Pick from history
        </Link>
      </div>
    </div>
  );
}
