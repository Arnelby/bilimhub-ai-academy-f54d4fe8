import { cn } from '@/lib/utils';
import { contentTypeLabels } from '@/data/mathLessonsData';
import { useLanguage } from '@/contexts/LanguageContext';

export type ContentType = 'basicLesson' | 'miniLessons' | 'diagrams' | 'commonMistakes' | 'miniTests' | 'fullTests' | 'dynamicLessons';

interface LessonTreeProps {
  selectedType: ContentType;
  onSelectType: (type: ContentType) => void;
}

const contentTypes: ContentType[] = [
  'basicLesson',
  'miniLessons',
  'diagrams',
  'commonMistakes',
  'miniTests',
  'fullTests',
  'dynamicLessons'
];

export function LessonTree({ selectedType, onSelectType }: LessonTreeProps) {
  const { language } = useLanguage();

  const getLabel = (type: ContentType) => {
    const labels = contentTypeLabels[type];
    return language === 'kg' ? labels.kg : language === 'ru' ? labels.ru : labels.en;
  };

  return (
    <div className="bg-card rounded-lg border p-4">
      <h3 className="font-semibold text-lg mb-4 text-card-foreground">
        {language === 'ru' ? 'Содержание' : language === 'kg' ? 'Мазмуну' : 'Contents'}
      </h3>
      <nav className="space-y-1">
        {contentTypes.map((type) => (
          <button
            key={type}
            onClick={() => onSelectType(type)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-all',
              'hover:bg-accent/50',
              selectedType === type
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="text-lg">{contentTypeLabels[type].icon}</span>
            <span className="text-sm font-medium">{getLabel(type)}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
