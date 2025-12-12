import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ImageIcon } from 'lucide-react';

// Import local assets for exponents diagrams
import exponentRulesCheatsheet from '@/assets/lessons/exponent-rules-cheatsheet.png';
import exponentSimplificationFlowchart from '@/assets/lessons/exponent-simplification-flowchart.png';
import exponentNegativeZeroDiagram from '@/assets/lessons/exponent-negative-zero-diagram.png';

// Map of local asset paths
const localAssets: Record<string, string> = {
  'exponents/exponent-rules-cheatsheet.png': exponentRulesCheatsheet,
  'exponents/exponent-simplification-flowchart.png': exponentSimplificationFlowchart,
  'exponents/exponent-negative-zero-diagram.png': exponentNegativeZeroDiagram,
};

interface StorageImageProps {
  path: string;
  alt: string;
  className?: string;
}

export function StorageImage({ path, alt, className = '' }: StorageImageProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function getImageUrl() {
      if (!path) {
        setLoading(false);
        return;
      }

      try {
        // Clean the path - remove 'storage/lessons/' prefix if present
        let cleanPath = path
          .replace(/^storage\/lessons\//, '')
          .replace(/^\//, '');

        // Check if this is a local asset first
        if (localAssets[cleanPath]) {
          setUrl(localAssets[cleanPath]);
          setLoading(false);
          return;
        }

        // Use public URL since bucket is public
        const { data } = supabase.storage
          .from('lessons')
          .getPublicUrl(cleanPath);

        if (data?.publicUrl) {
          setUrl(data.publicUrl);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error loading image:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    getImageUrl();
  }, [path]);

  if (loading) {
    return (
      <div className={`bg-muted animate-pulse rounded-lg flex items-center justify-center ${className}`} style={{ minHeight: '200px' }}>
        <ImageIcon className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  if (error || !url) {
    return (
      <div className={`bg-muted/50 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center ${className}`} style={{ minHeight: '200px' }}>
        <div className="text-center text-muted-foreground p-4">
          <ImageIcon className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">Image: {path}</p>
        </div>
      </div>
    );
  }

  return (
    <img 
      src={url} 
      alt={alt} 
      className={`rounded-lg ${className}`}
      onError={() => setError(true)}
    />
  );
}
