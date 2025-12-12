import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LessonData {
  topic: string;
  topic_ru?: string;
  topic_kg?: string;
  basic_lesson: {
    title: { en: string; ru: string; kg: string };
    video?: string;
    theory: { en: string; ru: string; kg: string };
    definitions: Array<{
      term: { en: string; ru: string; kg: string };
      definition: { en: string; ru: string; kg: string };
    }>;
    examples: Array<{
      title: { en: string; ru: string; kg: string };
      problem: { en: string; ru: string; kg: string };
      solution: { en: string; ru: string; kg: string };
      image?: string;
    }>;
    rules: Array<{
      name: { en: string; ru: string; kg: string };
      description: { en: string; ru: string; kg: string };
      formula?: string;
      image?: string;
    }>;
  };
  mini_lessons: Array<{
    id: string;
    title: { en: string; ru: string; kg: string };
    summary: { en: string; ru: string; kg: string };
    duration: string;
    video?: string;
    content: { en: string; ru: string; kg: string };
  }>;
  diagrams: Array<{
    id: string;
    title: { en: string; ru: string; kg: string };
    description: { en: string; ru: string; kg: string };
    image: string;
  }>;
  common_mistakes: Array<{
    id: string;
    mistake: { en: string; ru: string; kg: string };
    why: { en: string; ru: string; kg: string };
    fix: { en: string; ru: string; kg: string };
    example: { en: string; ru: string; kg: string };
    image?: string;
  }>;
  mini_tests: Array<{
    id: string;
    difficulty: 'easy' | 'medium' | 'hard';
    question: { en: string; ru: string; kg: string };
    options: {
      A: { en: string; ru: string; kg: string };
      B: { en: string; ru: string; kg: string };
      C: { en: string; ru: string; kg: string };
      D: { en: string; ru: string; kg: string };
    };
    correct: 'A' | 'B' | 'C' | 'D';
    explanation: { en: string; ru: string; kg: string };
  }>;
  full_test: Array<{
    id: string;
    question: { en: string; ru: string; kg: string };
    options: {
      A: { en: string; ru: string; kg: string };
      B: { en: string; ru: string; kg: string };
      C: { en: string; ru: string; kg: string };
      D: { en: string; ru: string; kg: string };
    };
    correct: 'A' | 'B' | 'C' | 'D';
    explanation: { en: string; ru: string; kg: string };
  }>;
  dynamic_lessons: {
    visual: {
      title: { en: string; ru: string; kg: string };
      content: { en: string; ru: string; kg: string };
      examples: Array<{ en: string; ru: string; kg: string }>;
    };
    auditory: {
      title: { en: string; ru: string; kg: string };
      content: { en: string; ru: string; kg: string };
      examples: Array<{ en: string; ru: string; kg: string }>;
    };
    'text-based': {
      title: { en: string; ru: string; kg: string };
      content: { en: string; ru: string; kg: string };
      examples: Array<{ en: string; ru: string; kg: string }>;
    };
    'problem-solver': {
      title: { en: string; ru: string; kg: string };
      content: { en: string; ru: string; kg: string };
      examples: Array<{ en: string; ru: string; kg: string }>;
    };
    'adhd-friendly': {
      title: { en: string; ru: string; kg: string };
      content: { en: string; ru: string; kg: string };
      examples: Array<{ en: string; ru: string; kg: string }>;
    };
  };
}

export function useLessonData(bucketPath: string) {
  const [data, setData] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLessonData() {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching lesson from path:', bucketPath);
        
        // Get signed URL for the JSON file
        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from('lessons')
          .createSignedUrl(bucketPath, 3600);

        if (urlError) {
          console.error('Storage error:', urlError);
          throw new Error(`Failed to get signed URL: ${urlError.message}`);
        }

        if (!signedUrlData?.signedUrl) {
          throw new Error('No signed URL returned');
        }

        // Fetch the JSON content
        const response = await fetch(signedUrlData.signedUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch lesson data: ${response.status} ${response.statusText}`);
        }

        const jsonData = await response.json();
        console.log('Lesson data loaded successfully');
        setData(jsonData);
      } catch (err) {
        console.error('Error loading lesson:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    if (bucketPath) {
      fetchLessonData();
    }
  }, [bucketPath]);

  return { data, loading, error };
}

export function useStorageImage(bucketPath: string) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    async function getImageUrl() {
      if (!bucketPath) return;
      
      // Clean the path - remove 'storage/lessons/' prefix if present
      let cleanPath = bucketPath
        .replace(/^storage\/lessons\//, '')
        .replace(/^\//, '');

      const { data } = await supabase.storage
        .from('lessons')
        .createSignedUrl(cleanPath, 3600);

      if (data?.signedUrl) {
        setUrl(data.signedUrl);
      }
    }

    getImageUrl();
  }, [bucketPath]);

  return url;
}
