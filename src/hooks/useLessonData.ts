import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Flexible lesson data interface that matches actual JSON structures
export interface MultiLangText {
  en: string;
  ru: string;
  kg: string;
}

export interface LessonData {
  topic: string;
  title?: MultiLangText;
  topic_ru?: string;
  topic_kg?: string;
  
  basic_lesson: {
    title: MultiLangText;
    video?: string;
    content?: MultiLangText;
    theory?: MultiLangText;
    // Rules can be array of multilang strings OR multilang object with arrays
    rules?: MultiLangText[] | { en: string[]; ru: string[]; kg: string[] };
    definitions?: Array<{
      term: MultiLangText;
      definition: MultiLangText;
    }>;
    // Examples / worked_examples
    examples?: Array<{
      title: MultiLangText;
      problem: MultiLangText | string;
      solution: MultiLangText | string;
      image?: string;
    }>;
    worked_examples?: Array<{
      title: MultiLangText;
      problem: string;
      solution: string;
    }>;
  };
  
  mini_lessons?: Array<{
    id: string;
    title: MultiLangText;
    summary: MultiLangText;
    duration?: string;
    duration_min?: number;
    video?: string;
    content?: MultiLangText;
    image?: string;
  }>;
  
  diagrams?: Array<{
    id: string;
    title: MultiLangText;
    description: MultiLangText;
    image: string;
  }>;
  
  common_mistakes?: Array<{
    id?: string;
    mistake: MultiLangText;
    why: MultiLangText;
    fix: MultiLangText;
    example?: MultiLangText;
    image?: string;
  }>;
  
  // Mini tests can have flexible structure
  mini_tests?: Array<{
    id?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    question: MultiLangText;
    options: string[] | {
      A: MultiLangText;
      B: MultiLangText;
      C: MultiLangText;
      D: MultiLangText;
    };
    correct: string;
    explanation: MultiLangText;
  }>;
  
  full_test?: Array<{
    id?: string;
    question: MultiLangText;
    options: string[] | {
      A: MultiLangText;
      B: MultiLangText;
      C: MultiLangText;
      D: MultiLangText;
    };
    correct: string;
    explanation: MultiLangText;
  }>;
  
  // Dynamic lessons with flexible keys
  dynamic_lessons?: {
    [key: string]: {
      title?: MultiLangText;
      summary?: MultiLangText;
      content?: MultiLangText;
      examples?: Array<MultiLangText | string>;
    };
  };
}

export function useLessonData(bucketPath: string) {
  const [data, setData] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLessonData() {
      if (!bucketPath) {
        setLoading(false);
        setError('No bucket path provided');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('[useLessonData] Fetching lesson from path:', bucketPath);
        
        // Clean bucket path - remove any 'storage/lessons/' prefix
        const cleanPath = bucketPath
          .replace(/^storage\/lessons\//, '')
          .replace(/^\//, '');

        console.log('[useLessonData] Clean path:', cleanPath);

        const { data: publicUrlData } = supabase.storage
          .from('lessons')
          .getPublicUrl(cleanPath);

        if (!publicUrlData?.publicUrl) {
          throw new Error('No public URL returned from Supabase');
        }

        console.log('[useLessonData] Fetching from URL:', publicUrlData.publicUrl);

        // Fetch the JSON content with cache busting
        const response = await fetch(`${publicUrlData.publicUrl}?t=${Date.now()}`);
        
        if (!response.ok) {
          const text = await response.text();
          console.error('[useLessonData] Fetch failed:', response.status, text);
          throw new Error(`Failed to fetch lesson: ${response.status}`);
        }

        const jsonData = await response.json();
        console.log('[useLessonData] Lesson data loaded successfully:', jsonData?.topic);
        setData(jsonData);
      } catch (err) {
        console.error('[useLessonData] Error loading lesson:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchLessonData();
  }, [bucketPath]);

  return { data, loading, error };
}

export function useStorageImage(bucketPath: string) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!bucketPath) return;
    
    // Clean the path - remove 'storage/lessons/' prefix if present
    let cleanPath = bucketPath
      .replace(/^storage\/lessons\//, '')
      .replace(/^\//, '');

    // Use public URL since bucket is public
    const { data } = supabase.storage
      .from('lessons')
      .getPublicUrl(cleanPath);

    if (data?.publicUrl) {
      setUrl(data.publicUrl);
    }
  }, [bucketPath]);

  return url;
}
