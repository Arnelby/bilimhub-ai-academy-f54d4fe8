# 🧪 Команды для тестирования AI функций

## Быстрый тест через Supabase Dashboard

### 1. Открой Supabase Dashboard
```
https://supabase.com/dashboard/project/lsisqkrzhtpxyhfmwnhq
```

### 2. Перейди в Functions → ai-chat-tutor → Invoke

### 3. Вставь тестовый запрос:

#### Тест 1: Минимальный (проверка Метода Сократа)
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Как решить уравнение x+5=10?"
    }
  ],
  "diagnosticProfile": null,
  "weakTopics": [],
  "context": {},
  "language": "ru"
}
```

**Ожидаемый результат:**
- ИИ НЕ должен дать прямой ответ "x=5"
- ИИ ДОЛЖЕН задать наводящий вопрос типа:
  > "Какое число мешает нам найти x? Что с ним нужно сделать?"

---

#### Тест 2: С профилем студента (проверка адаптивности)
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Объясни проценты"
    }
  ],
  "diagnosticProfile": {
    "math_level": 2,
    "learning_style": "visual",
    "motivation_type": "achievement"
  },
  "weakTopics": ["percentages", "fractions"],
  "context": {},
  "language": "ru"
}
```

**Ожидаемый результат:**
- ИИ должен упомянуть слабые темы: "Я вижу, что проценты и дроби иногда вызывают сложности"
- Ответ должен быть визуальным (описания диаграмм, схем)
- Должна быть мотивация через достижения: "Когда ты поймешь это, сможешь решать..."

---

#### Тест 3: Диалог (проверка контекста)
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Как решить x+5=10?"
    },
    {
      "role": "assistant",
      "content": "Давай подумаем: какое число нужно вычесть из 10, чтобы получить x?"
    },
    {
      "role": "user",
      "content": "5?"
    }
  ],
  "diagnosticProfile": {
    "math_level": 1
  },
  "weakTopics": [],
  "context": {
    "topic": "linear_equations",
    "current_lesson": "basic_algebra"
  },
  "language": "ru"
}
```

**Ожидаемый результат:**
- ИИ должен продолжить Сократовский диалог
- Должен похвалить: "Отлично! Теперь подумай, если вычесть 5..."

---

## Тест генерации тестов (ai-generate-ort-test)

### Открой Functions → ai-generate-ort-test → Invoke

### Вставь запрос:
```json
{
  "part": 1,
  "variant": 1,
  "language": "ru"
}
```

**Ожидаемый результат:**
```json
{
  "success": true,
  "questions": [
    {
      "question_text": "Колонка А: 2x+3 при x=5\nКолонка Б: 15",
      "trap_check": "Ловушка: забыть умножить 2 на x перед сложением",
      "options": [
        "А) Величина в колонке А больше",
        "Б) Величина в колонке Б больше",
        "В) Величины равны",
        "Г) Невозможно определить"
      ],
      "correct_option": 1,
      "explanation": "2x+3 = 2*5+3 = 10+3 = 13. Колонка Б (15) больше."
    }
  ],
  "part": 1,
  "questionCount": 30
}
```

**Что проверить:**
- ✅ Есть поле `trap_check` (новое!)
- ✅ Вопросы НЕ копируют ЦООМО напрямую
- ✅ Есть локальные примеры (сомы, города КР)
- ✅ Объяснение педагогическое ("Почему так?")

---

## Тест через curl (из терминала)

### PowerShell (Windows):

#### ai-chat-tutor:
```powershell
$headers = @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzaXNxa3J6aHRweHloZm13bmhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNTEyOTMsImV4cCI6MjA3OTkyNzI5M30.8aM-IiMA7sBgH7LU-A8dNcGsrKoOqdNCFg-vimjQNLQ"
    "Content-Type" = "application/json"
}

$body = @{
    messages = @(
        @{
            role = "user"
            content = "Как решить уравнение x+5=10?"
        }
    )
    diagnosticProfile = $null
    weakTopics = @()
    context = @{}
    language = "ru"
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "https://lsisqkrzhtpxyhfmwnhq.supabase.co/functions/v1/ai-chat-tutor" -Method Post -Headers $headers -Body $body
```

---

## 📊 Интерпретация результатов

### ✅ УСПЕХ - Метод Сократа работает:
```
Ответ содержит:
- Вопросы: "Какое число..?", "Что нужно сделать..?"
- Подсказки: "Вспомни правило...", "Подумай о..."
- НЕТ прямого ответа "x=5"
```

### ❌ ПРОВАЛ - Прямой ответ:
```
Ответ содержит:
- "x = 10 - 5 = 5"
- "Ответ: x равен пяти"
- Готовое решение без вопросов
```

**Решение:** Усилить промпт (см. `test_ai_chat_tutor.md`)

---

### ✅ УСПЕХ - Адаптивность работает:
```
В ответе упоминаются:
- "Я вижу, что у тебя сложности с дробями..."
- "Начнем с простого уровня..."
- Ссылка на слабые темы из weakTopics
```

### ❌ ПРОВАЛ - Нет адаптивности:
```
Ответ НЕ упоминает:
- Слабые темы студента
- Его уровень математики
- Стиль обучения
```

**Решение:** Проверь, что передается `diagnosticProfile` и `weakTopics`

---

## 🔧 Быстрые фиксы

### Если ошибка 500:
1. Открой Edge Function logs в Supabase
2. Найди строку с ошибкой
3. Скорее всего: `Cannot read property of undefined`
4. Добавь дефолтное значение для этой переменной

### Если ИИ молчит (timeout):
1. Проверь LOVABLE_API_KEY в Environment Variables
2. Попробуй уменьшить длину промпта
3. Проверь лимиты API (возможно закончились токены)

### Если ИИ не на русском:
1. Проверь, что `language: "ru"` передается
2. Проверь, что в промпте есть инструкция по языку
3. Добавь в начало промпта: "Отвечай ТОЛЬКО на русском языке"

---

## 🎯 Финальный чек перед питчем

Протестируй последовательно:

1. [ ] Минимальный запрос → Метод Сократа работает
2. [ ] Запрос с профилем → Адаптивность работает
3. [ ] Генерация теста → Есть `trap_check`, нет плагиата
4. [ ] Скорость ответа < 5 секунд
5. [ ] Нет ошибок 500
6. [ ] Ответы на русском языке

**Если все 6 пунктов ✅ — готов к питчу!** 🚀
