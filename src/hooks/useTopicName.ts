import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { getLocalized } from '@/lib/getLocalized';

type TopicRow = {
  title: string | null;
  title_ru?: string | null;
  title_kg?: string | null;
};

/**
 * Cache for topic rows keyed by canonical English title (case-insensitive).
 * Loaded once per session.
 */
let topicCache: Record<string, TopicRow> | null = null;
let topicCacheLoading: Promise<Record<string, TopicRow>> | null = null;

async function loadTopics(): Promise<Record<string, TopicRow>> {
  if (topicCache) return topicCache;
  if (topicCacheLoading) return topicCacheLoading;
  topicCacheLoading = (async () => {
    const { data } = await supabase.from('topics').select('title, title_ru, title_kg');
    const map: Record<string, TopicRow> = {};
    for (const row of data ?? []) {
      if (row?.title) map[row.title.toLowerCase().trim()] = row;
    }
    topicCache = map;
    return map;
  })();
  return topicCacheLoading;
}

/**
 * Returns the topic name in the user's current language.
 * Resolution order:
 *   1. `topics` row by canonical English title (`title_<lang>` then `title_en` then `title`)
 *   2. i18n key `topics:<slug>` (camelCase)
 *   3. raw input
 */
export function useTopicName(slugOrTitle: string | null | undefined): string {
  const { t, i18n } = useTranslation();
  const [topics, setTopics] = useState<Record<string, TopicRow> | null>(topicCache);

  useEffect(() => {
    if (!topics) {
      void loadTopics().then(setTopics);
    }
  }, [topics]);

  if (!slugOrTitle) return '';

  const key = slugOrTitle.toLowerCase().trim();
  const lang = i18n.language;

  // 1. DB lookup
  if (topics?.[key]) {
    const fromDb = getLocalized(topics[key] as unknown as Record<string, unknown>, 'title', lang);
    if (fromDb) return fromDb;
  }

  // 2. i18n key fallback (camelCase)
  const camel = key
    .replace(/[^a-z0-9 ]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join('');
  if (camel) {
    const translated = t(`topics.${camel}`, { defaultValue: '' });
    if (translated) return translated;
  }

  // 3. raw
  return slugOrTitle;
}
