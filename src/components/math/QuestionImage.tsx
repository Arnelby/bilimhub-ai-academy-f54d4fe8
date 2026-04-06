import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface QuestionImageProps {
  variantId: number;
  questionNumber: number;
  className?: string;
}

/**
 * Dynamically loads a question image from ortmathtests storage bucket.
 * Path format: variant{variantId}/q{questionNumber}.png
 * If the image doesn't exist, renders nothing.
 */
export function QuestionImage({ variantId, questionNumber, className }: QuestionImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const path = `variant${variantId}/q${questionNumber}.png`;
    const { data } = supabase.storage.from('ortmathtests').getPublicUrl(path);
    
    if (data?.publicUrl) {
      // Check if image actually exists by trying to load it
      const img = new Image();
      img.onload = () => setImageUrl(data.publicUrl);
      img.onerror = () => setImageUrl(null);
      img.src = data.publicUrl;
    }

    return () => setImageUrl(null);
  }, [variantId, questionNumber]);

  if (!imageUrl) return null;

  return (
    <div className={`my-4 flex justify-center ${className || ''}`}>
      <img
        src={imageUrl}
        alt={`Иллюстрация к задаче ${questionNumber}`}
        className="max-w-full rounded-lg border border-border shadow-sm"
        style={{ maxHeight: 400 }}
      />
    </div>
  );
}
