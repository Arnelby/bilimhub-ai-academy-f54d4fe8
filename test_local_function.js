// Локальное тестирование Edge Function ai-chat-tutor
// Эмулирует реальный запрос как с фронтенда

const GEMINI_API_KEY = "AIzaSyCuFo7sBQp58KMy59npHhGuKdNtGIPMkEg";

// Имитация окружения Deno для тестирования
const Deno = {
  env: {
    get: (key) => {
      if (key === "LOVABLE_API_KEY") {
        // Используем прямой Gemini API для теста
        return GEMINI_API_KEY;
      }
      return null;
    }
  }
};

// Копия системного промпта из ai-chat-tutor/index.ts
function generateSystemPrompt(diagnosticProfile, weakTopics, language, action) {
  const languageInstructions = {
    ru: "Respond entirely in Russian. Be friendly and supportive.",
    kg: "Respond entirely in Kyrgyz language. Be friendly and supportive.",
    en: "Respond entirely in English. Be friendly and supportive."
  };

  const learningStyleInstructions = {
    visual: "Use diagrams, visual descriptions, and spatial explanations.",
    auditory: "Use conversational tone, rhythmic explanations, and verbal cues.",
    'text-based': "Provide detailed written explanations with clear structure.",
    'example-based': "Always start with concrete examples before theory.",
    'problem-driven': "Present concepts through problem-solving scenarios.",
    'step-by-step': "Break down everything into small, numbered steps.",
    balanced: "Mix different explanation styles for comprehensive understanding."
  };

  const learningStyle = diagnosticProfile?.learning_style || 'balanced';
  const motivationType = diagnosticProfile?.motivation_type || 'balanced';
  const mathLevel = diagnosticProfile?.math_level || 1;

  let actionInstruction = "";
  if (action === 'explain_simpler') {
    actionInstruction = "The student wants a simpler explanation. Break it down into the most basic terms possible, use everyday analogies, and avoid any complex terminology.";
  } else if (action === 'show_example') {
    actionInstruction = "The student wants a concrete example. Provide a clear, step-by-step example that illustrates the concept using numbers or real-world scenarios.";
  } else if (action === 'mini_test') {
    actionInstruction = "The student wants to test their understanding. Create a simple practice problem similar to what we discussed.";
  }

  const systemPrompt = `### РОЛЬ
Ты — Элитный ИИ-методист BilimHub, сертифицированный по стандартам ОРТ (Общереспубликанское тестирование) Министерства образования Кыргызстана. Твоя специализация: Математика, Аналогии и Чтение/Понимание.

### ДАННЫЕ СТУДЕНТА (АДАПТИВНОСТЬ)
- Стиль обучения: ${learningStyle}
- Уровень математики: ${mathLevel}/5
- Пробелы в знаниях: ${JSON.stringify(weakTopics || [])}
- Мотивация: ${motivationType}
- Уровень внимания: ${diagnosticProfile?.attention_level || 50}/100
- Предпочитает короткие уроки: ${diagnosticProfile?.prefers_short_lessons ?? true}
- Предпочитает примеры: ${diagnosticProfile?.prefers_examples ?? true}
ТЕКУЩИЙ КОНТЕКСТ: ${JSON.stringify({} || {})}

### ТВОИ ПРАВИЛА (ГЕНЕРАЦИЯ И ОБУЧЕНИЕ)
1. **Никакого Плагиата:** Не копируй вопросы ЦООМО дословно. Генерируй АНАЛОГИЧНЫЕ задачи, используя ту же логическую структуру (шаблоны министерства), но с другими числами и сюжетами.

2. **Адаптивный Трек:** Если в пробелах знаний указаны темы ${JSON.stringify(weakTopics || [])}, делай упор на эти темы. Начинай с простых концепций (уровень ${mathLevel}), постепенно усложняя до уровня ОРТ.

3. **Метод Сократа:** Не давай правильный ответ сразу. Если студент ошибся, спроси: "Посмотри на этот шаг, какой знак должен быть при переносе?". Помогай ему самому найти решение.

4. **Формат ответа (Math):** Используй LaTeX для формул (например, $x^2 + y = 10$). Используй Markdown для списков и жирного шрифта.

### ПОДХОД К ОБУЧЕНИЮ
${learningStyleInstructions[learningStyle] || learningStyleInstructions.balanced}

### СТИЛЬ МОТИВАЦИИ
${motivationType === 'achievement' ? 'Отмечай прогресс, используй язык достижений' : ''}
${motivationType === 'social' ? 'Используй совместный язык, упоминай как другие добиваются успеха' : ''}
${motivationType === 'intrinsic' ? 'Фокусируйся на радости понимания и мастерства' : ''}
${motivationType === 'balanced' ? 'Комбинируй празднование достижений с внутренней мотивацией' : ''}

${actionInstruction}

### ТОН И ЯЗЫК
- Язык: ${language === 'ru' ? 'Русский' : language === 'kg' ? 'Кыргызский' : 'English'}
- Тон: Дружелюбный, поддерживающий, профессиональный
- Используй локальные примеры (цены в сомах, города Кыргызстана), чтобы задачи были ближе к реальности студента
- Будь терпеливым и ободряющим
- Если не знаешь чего-то, признай это честно

### ДОПОЛНИТЕЛЬНЫЕ ПРИНЦИПЫ
1. Адаптируй объяснения под стиль обучения студента
2. При объяснении математики показывай пошаговые решения
3. Если студент испытывает трудности, предложи упростить или дать примеры
4. Проактивно предлагай релевантные уроки или мини-тесты когда уместно
5. Держи ответы краткими, но полными
6. Используй эмодзи умеренно, чтобы сохранить дружелюбный тон

${languageInstructions[language] || languageInstructions.ru}`;

  return systemPrompt;
}

// Тестовые сценарии
const testCases = [
  {
    name: "Полный сценарий: Метод Сократа",
    request: {
      messages: [
        { role: "user", content: "Как решить уравнение x + 5 = 10?" },
        { role: "assistant", content: "Давай разберемся вместе! Что нужно сделать с числом 5?" },
        { role: "user", content: "x = 10 + 5 = 15" }
      ],
      diagnosticProfile: {
        learning_style: 'step-by-step',
        math_level: 1,
        motivation_type: 'balanced',
        attention_level: 60,
        prefers_short_lessons: true,
        prefers_examples: true
      },
      weakTopics: ["линейные уравнения", "перенос слагаемых"],
      language: 'ru'
    },
    checks: [
      { name: "Использует Метод Сократа", test: (r) => /\?/.test(r) && !/x\s*=\s*5/i.test(r) },
      { name: "Задает наводящий вопрос", test: (r) => /какой знак|посмотри|подумай/i.test(r) },
      { name: "НЕ дает прямой ответ", test: (r) => !/ответ.*5|правильный.*5/i.test(r) },
      { name: "Короткий ответ (< 300 символов)", test: (r) => r.length < 300 }
    ]
  },
  {
    name: "Запрос объяснения с примером",
    request: {
      messages: [
        { role: "user", content: "Объясни проценты на примере" }
      ],
      diagnosticProfile: {
        learning_style: 'example-based',
        math_level: 1,
        motivation_type: 'intrinsic',
        prefers_examples: true
      },
      weakTopics: ["проценты"],
      action: 'show_example',
      language: 'ru'
    },
    checks: [
      { name: "Использует локальный контекст", test: (r) => /сом|бишкек|ош|кыргыз|базар|магазин/i.test(r) },
      { name: "Есть числовой пример", test: (r) => /\d+/.test(r) },
      { name: "Объясняет пошагово", test: (r) => /1\.|2\.|шаг|сначала|затем/i.test(r) },
      { name: "Начинает с примера", test: (r) => /представ|например|пример|допустим/i.test(r) }
    ]
  },
  {
    name: "Генерация мини-теста",
    request: {
      messages: [
        { role: "user", content: "Дай мне задачу для тренировки" }
      ],
      diagnosticProfile: {
        learning_style: 'problem-driven',
        math_level: 2
      },
      weakTopics: ["проценты"],
      action: 'mini_test',
      language: 'ru'
    },
    checks: [
      { name: "Создает задачу с числами", test: (r) => /\d+/.test(r) },
      { name: "Локальный контекст (сомы/КР)", test: (r) => /сом|кыргыз|бишкек|ош/i.test(r) },
      { name: "Четкая формулировка вопроса", test: (r) => /\?/.test(r) },
      { name: "Оригинальная задача", test: (r) => r.length > 50 }
    ]
  }
];

async function testFunction(testCase) {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`🧪 ${testCase.name}`);
  console.log(`${"=".repeat(80)}\n`);

  const { messages, diagnosticProfile, weakTopics, action, language } = testCase.request;

  // Генерируем системный промпт
  const systemPrompt = generateSystemPrompt(diagnosticProfile, weakTopics, language || 'ru', action);

  console.log("📋 Профиль студента:");
  console.log(`   Стиль: ${diagnosticProfile?.learning_style || 'balanced'}`);
  console.log(`   Уровень: ${diagnosticProfile?.math_level || 1}/5`);
  console.log(`   Пробелы: ${JSON.stringify(weakTopics || [])}\n`);

  // Формируем запрос к Gemini
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const requestBody = {
    contents: [{
      parts: [{
        text: systemPrompt + "\n\n" + messages.map(m => 
          `${m.role === 'user' ? 'Студент' : 'Репетитор'}: ${m.content}`
        ).join('\n\n') + "\n\nРепетитор:"
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    }
  };

  try {
    console.log("🔄 Отправка запроса...\n");
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.error("❌ Ошибка:", response.status, await response.text());
      return;
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Нет ответа";

    console.log("✅ ОТВЕТ ИИ:");
    console.log("-".repeat(80));
    console.log(aiResponse);
    console.log("-".repeat(80));

    // Проверка критериев
    console.log("\n🔍 ПРОВЕРКА:");
    let passed = 0;
    testCase.checks.forEach(check => {
      const result = check.test(aiResponse);
      console.log(`${result ? '✅' : '❌'} ${check.name}`);
      if (result) passed++;
    });

    const percentage = Math.round((passed / testCase.checks.length) * 100);
    console.log(`\n📊 РЕЗУЛЬТАТ: ${passed}/${testCase.checks.length} (${percentage}%)`);

  } catch (error) {
    console.error("❌ Ошибка:", error.message);
  }
}

async function runAllTests() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║              ЛОКАЛЬНОЕ ТЕСТИРОВАНИЕ AI-CHAT-TUTOR FUNCTION                 ║
║                    Эмуляция реальных запросов                              ║
╚════════════════════════════════════════════════════════════════════════════╝
  `);

  for (const testCase of testCases) {
    await testFunction(testCase);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log("🎉 ВСЕ ТЕСТЫ ЗАВЕРШЕНЫ");
  console.log(`${"=".repeat(80)}\n`);
  
  console.log("💡 СЛЕДУЮЩИЙ ШАГ:");
  console.log("   1. Если результаты хорошие (>80%) → Деплой на Supabase");
  console.log("   2. См. help/QUICK_DEPLOY.md для инструкций\n");
}

runAllTests().catch(console.error);
