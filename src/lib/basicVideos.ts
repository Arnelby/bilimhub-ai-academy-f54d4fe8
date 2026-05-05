// Basic video lessons mapped by Russian topic name (canonical keys lowercase).
// Source: user-provided list. Each entry maps to a YouTube short URL.
// Used by Practice mistake review + /video/:videoId route to redirect users
// directly to the foundation lesson for a topic where they failed.

export interface BasicVideo {
  id: string;        // stable slug, used in /video/:videoId
  title: string;     // Russian display title
  url: string;       // YouTube URL (any youtu.be / watch?v= form is fine)
  topicKeys: string[]; // possible topic names (case-insensitive) that map here
}

export const BASIC_VIDEOS: BasicVideo[] = [
  { id: 'basic-quadratic-equations', title: 'Квадратные уравнения', url: 'https://youtu.be/UciJkU2Ngb8', topicKeys: ['квадратные уравнения', 'quadratic equations'] },
  { id: 'basic-linear-equations',    title: 'Линейные уравнения',   url: 'https://youtu.be/asOUdTALdUw', topicKeys: ['линейные уравнения', 'linear equations'] },
  { id: 'basic-systems-equations',   title: 'Системы уравнений',    url: 'https://youtu.be/Zc9nK7chxQs', topicKeys: ['системы уравнений', 'systems of equations'] },
  { id: 'basic-inequalities',        title: 'Неравенства',          url: 'https://youtu.be/IMeg4mZ0DN0', topicKeys: ['неравенства', 'inequalities'] },
  { id: 'basic-functions',           title: 'Функция',              url: 'https://youtu.be/29oLLo-k32E', topicKeys: ['функция', 'функции', 'functions'] },
  { id: 'basic-linear-graph',        title: 'График линейной функции', url: 'https://youtu.be/rh6OZd6W_sc', topicKeys: ['график линейной функции', 'linear function graph'] },
  { id: 'basic-quadratic-function',  title: 'Квадратичная функция', url: 'https://youtu.be/9swDrZMW2e8', topicKeys: ['квадратичная функция', 'quadratic function'] },
  { id: 'basic-statistics',          title: 'Статистика',           url: 'https://youtu.be/7r4MD75GkEA', topicKeys: ['статистика', 'statistics'] },
  { id: 'basic-probability',         title: 'Вероятность',          url: 'https://youtu.be/WQ76qemCn5g', topicKeys: ['вероятность', 'probability'] },
  { id: 'basic-planimetry',          title: 'Основные понятия планиметрии', url: 'https://youtu.be/k86f4w_ECGw', topicKeys: ['основные понятия планиметрии', 'планиметрия', 'геометрия', 'geometry'] },
  { id: 'basic-triangles',           title: 'Треугольники',         url: 'https://youtu.be/pDk78__TOgw', topicKeys: ['треугольники', 'triangles'] },
  { id: 'basic-quadrilaterals',      title: 'Четырёхугольники',     url: 'https://youtu.be/xwSEcNI_T-U', topicKeys: ['четырёхугольники', 'четырехугольники', 'quadrilaterals'] },
  { id: 'basic-polygons',            title: 'Многоугольники',       url: 'https://youtu.be/OKIl9OkEkms', topicKeys: ['многоугольники', 'polygons'] },
  { id: 'basic-circles',             title: 'Окружность и круг',    url: 'https://youtu.be/R6_ArCsPsy0', topicKeys: ['окружность и круг', 'окружность', 'круг', 'circles'] },
  { id: 'basic-stereometry',         title: 'Стереометрия',         url: 'https://youtu.be/fWjF2kjGT-4', topicKeys: ['стереометрия', 'solid geometry'] },
  { id: 'basic-motion',              title: 'Задачи на движение',   url: 'https://youtu.be/SwxvE_QcLlc', topicKeys: ['задачи на движение', 'motion problems'] },
  { id: 'basic-work',                title: 'Задачи на работу',     url: 'https://youtu.be/t80hODntJ8I', topicKeys: ['задачи на работу', 'work problems'] },
  { id: 'basic-percentages-tasks',   title: 'Задачи на проценты',   url: 'https://youtu.be/kyfDlv0lAwg', topicKeys: ['задачи на проценты'] },
  { id: 'basic-mixtures',            title: 'Задачи на смеси и сплавы', url: 'https://youtu.be/eaX3dNt4ACA', topicKeys: ['задачи на смеси и сплавы', 'смеси и сплавы'] },
  { id: 'basic-age',                 title: 'Задачи на возраст',    url: 'https://youtu.be/JTHGU1Z8ze4', topicKeys: ['задачи на возраст'] },
  { id: 'basic-logic',               title: 'Логические задачи',    url: 'https://youtu.be/VzMSmYwEz6c', topicKeys: ['логические задачи', 'логика', 'logic'] },
  { id: 'basic-sequences',           title: 'Последовательности',   url: 'https://youtu.be/kl4RhyZGroQ', topicKeys: ['последовательности', 'sequences'] },
  { id: 'basic-series',              title: 'Числовые ряды',        url: 'https://youtu.be/burnenc5xY4', topicKeys: ['числовые ряды'] },
  { id: 'basic-puzzle',              title: 'Задачи на сообразительность', url: 'https://youtu.be/3FQ4FTD0DWU', topicKeys: ['задачи на сообразительность'] },
  { id: 'basic-natural-numbers',     title: 'Натуральные числа',    url: 'https://youtu.be/hCE4T8rYFp0', topicKeys: ['натуральные числа', 'natural numbers'] },
  { id: 'basic-fractions',           title: 'Дроби',                url: 'https://youtu.be/oQbi7zsUGSY', topicKeys: ['дроби', 'fractions'] },
  { id: 'basic-decimals',            title: 'Десятичные дроби',     url: 'https://youtu.be/mgFJZFTeql0', topicKeys: ['десятичные дроби', 'decimals'] },
  { id: 'basic-algebraic',           title: 'Алгебраические выражения', url: 'https://youtu.be/af14KS8TzeU', topicKeys: ['алгебраические выражения', 'algebraic expressions'] },
  { id: 'basic-monomials',           title: 'Одночлены и многочлены', url: 'https://youtu.be/8rMSv8JwPCo', topicKeys: ['одночлены и многочлены', 'многочлены', 'polynomials'] },
  { id: 'basic-fsu',                 title: 'Формулы сокращённого умножения', url: 'https://youtu.be/dsu-qvRj1L0', topicKeys: ['фсу', 'формулы сокращенного умножения', 'формулы сокращённого умножения'] },
  { id: 'basic-monomials',           title: 'Одночлены и многочлены', url: 'https://youtu.be/8rMSv8JwPCo', topicKeys: ['одночлены и многочлены', 'многочлены', 'polynomials'] },
  { id: 'basic-fsu',                 title: 'Формулы сокращённого умножения', url: 'https://youtu.be/dsu-qvRj1L0', topicKeys: ['фсу', 'формулы сокращенного умножения', 'формулы сокращённого умножения'] },
  { id: 'basic-rational',            title: 'Рациональные выражения', url: 'https://youtu.be/e3hWliu1IHs', topicKeys: ['рациональные выражения'] },
  { id: 'basic-ratios',              title: 'Отношения и пропорции', url: 'https://youtu.be/N1q2YKHCKic', topicKeys: ['отношения и пропорции', 'пропорции', 'ratios', 'proportions', 'ratio'] },
  { id: 'basic-percentages',         title: 'Проценты',             url: 'https://youtu.be/3zhKBuugdi4', topicKeys: ['проценты', 'percentages', 'percent', 'percentage'] },
];

const norm = (s: string | null | undefined) => (s || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();

const TOPIC_INDEX: Record<string, BasicVideo> = (() => {
  const idx: Record<string, BasicVideo> = {};
  for (const v of BASIC_VIDEOS) {
    for (const k of v.topicKeys) idx[norm(k)] = v;
  }
  return idx;
})();

const ID_INDEX: Record<string, BasicVideo> = Object.fromEntries(BASIC_VIDEOS.map(v => [v.id, v]));

/** Resolve a basic video by topic name (RU or EN). Returns null when none exists. */
export function basicVideoForTopic(topic: string | null | undefined): BasicVideo | null {
  if (!topic) return null;
  return TOPIC_INDEX[norm(topic)] ?? null;
}

/** Resolve a basic video by stable id (used in /video/:videoId route). */
export function basicVideoById(id: string | null | undefined): BasicVideo | null {
  if (!id) return null;
  return ID_INDEX[id] ?? null;
}

/** Convert any youtu.be / watch?v= URL into a privacy-friendly embed URL. */
export function toYouTubeEmbed(url: string): string {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/]+)/);
  const id = m?.[1];
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : url;
}
