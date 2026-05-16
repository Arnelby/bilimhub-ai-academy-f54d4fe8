import type { TFunction } from 'i18next';
import { translateTopic } from '@/lib/topicTranslations';
import type { PlanTask } from '@/lib/taskEngine';

type Lang = 'en' | 'ru' | 'kg';

/**
 * Localized label for a PlanTask.
 * Replaces the hardcoded Russian `task.label` produced by taskEngine.labelFor().
 */
export function formatTaskLabel(t: TFunction, task: PlanTask, language: Lang): string {
  const rawTopic = task.topic ?? '';
  const topic = rawTopic
    ? translateTopic(rawTopic, language)
    : t('v2.tasks.generalTopic');
  const questions = t('v2.tasks.questions');

  switch (task.type) {
    case 'lesson':
      return t('v2.tasks.lesson', { topic });
    case 'practice': {
      const key =
        task.difficulty === 'medium'
          ? 'v2.tasks.practiceMedium'
          : 'v2.tasks.practiceEasy';
      return t(key, { count: task.count, questions, topic });
    }
    case 'repeat':
      return t('v2.tasks.repeat', { count: task.count, questions });
    case 'test':
      return t('v2.tasks.test', { count: task.count, questions });
  }
}
