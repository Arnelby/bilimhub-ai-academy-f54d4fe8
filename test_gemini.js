// Тест AI функции с прямым API Gemini
// Запуск: node test_gemini.js

const GEMINI_API_KEY = "AIzaSyCuFo7sBQp58KMy59npHhGuKdNtGIPMkEg";

// Системный промпт из ai-chat-tutor
const systemPrompt = `### РОЛЬ
Ты — Элитный ИИ-методист BilimHub, сертифицированный по стандартам ОРТ (Общереспубликанское тестирование) Министерства образования Кыргызстана. Твоя специализация: Математика, Аналогии и Чтение/Понимание.

### ДАННЫЕ СТУДЕНТА (АДАПТИВНОСТЬ)
- Стиль обучения: balanced
- Уровень математики: 1/5
- Пробелы в знаниях: ["линейные уравнения", "проценты"]
- Мотивация: balanced
- Уровень внимания: 50/100
- Предпочитает короткие уроки: true
- Предпочитает примеры: true
ТЕКУЩИЙ КОНТЕКСТ: {}

### ТВОИ ПРАВИЛА (ГЕНЕРАЦИЯ И ОБУЧЕНИЕ)
1. **Никакого Плагиата:** Не копируй вопросы ЦООМО дословно. Генерируй АНАЛОГИЧНЫЕ задачи, используя ту же логическую структуру (шаблоны министерства), но с другими числами и сюжетами.

2. **Адаптивный Трек:** Если в пробелах знаний указаны темы ["линейные уравнения", "проценты"], делай упор на эти темы. Начинай с простых концепций (уровень 1), постепенно усложняя до уровня ОРТ.

3. **Метод Сократа:** Не давай правильный ответ сразу. Если студент ошибся, спроси: "Посмотри на этот шаг, какой знак должен быть при переносе?". Помогай ему самому найти решение.

4. **Формат ответа (Math):** Используй LaTeX для формул (например, $x^2 + y = 10$). Используй Markdown для списков и жирного шрифта.

### ПОДХОД К ОБУЧЕНИЮ
Mix different explanation styles for comprehensive understanding.

### СТИЛЬ МОТИВАЦИИ
Комбинируй празднование достижений с внутренней мотивацией

### ТОН И ЯЗЫК
- Язык: Русский
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

Respond entirely in Russian. Be friendly and supportive.`;

// Тестовые сценарии
const testScenarios = [
  {
    name: "Тест 1: Метод Сократа (неправильный ответ)",
    messages: [
      { role: "user", content: "Как решить уравнение x + 5 = 10?" },
      { role: "assistant", content: "Давай разберемся вместе! Что нужно сделать с числом 5, чтобы оставить x одного слева от знака равенства?" },
      { role: "user", content: "x = 10 + 5 = 15" }
    ],
    expectedBehavior: "ИИ НЕ должен сказать 'правильно'. Должен спросить про знак при переносе (Метод Сократа)"
  },
  {
    name: "Тест 2: Простое объяснение",
    messages: [
      { role: "user", content: "Объясни что такое проценты простыми словами" }
    ],
    expectedBehavior: "Должен дать простое объяснение, использовать локальные примеры (сомы), учитывать уровень 1/5"
  },
  {
    name: "Тест 3: Генерация задачи (не плагиат)",
    messages: [
      { role: "user", content: "Дай мне задачу на проценты для тренировки" }
    ],
    expectedBehavior: "Должен создать ОРИГИНАЛЬНУЮ задачу (не из ЦООМО), использовать контекст КР (сомы, города)"
  }
];

async function testGemini(testCase) {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`🧪 ${testCase.name}`);
  console.log(`${"=".repeat(80)}`);
  console.log(`📋 Ожидаемое поведение: ${testCase.expectedBehavior}\n`);

  // Формируем запрос к Gemini API
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  // Собираем все сообщения
  let conversationText = systemPrompt + "\n\n";
  testCase.messages.forEach(msg => {
    conversationText += `${msg.role === 'user' ? 'Студент' : 'Репетитор'}: ${msg.content}\n\n`;
  });
  
  const requestBody = {
    contents: [{
      parts: [{
        text: conversationText + "Репетитор:"
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
    console.log("🔄 Отправка запроса к Gemini API...\n");
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Ошибка API:", response.status, errorText);
      return;
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      const aiResponse = data.candidates[0].content.parts[0].text;
      console.log("✅ ОТВЕТ ИИ:");
      console.log("-".repeat(80));
      console.log(aiResponse);
      console.log("-".repeat(80));
      
      // Проверка критериев
      console.log("\n🔍 ПРОВЕРКА КРИТЕРИЕВ:");
      checkCriteria(testCase.name, aiResponse);
    } else {
      console.error("❌ Неожиданный формат ответа:", JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error("❌ Ошибка при тестировании:", error.message);
  }
}

function checkCriteria(testName, response) {
  const checks = [];
  
  if (testName.includes("Метод Сократа")) {
    // Проверяем, что НЕ дает прямой ответ
    const hasDirectAnswer = /правильно|верно|молодец|x\s*=\s*5/i.test(response);
    const hasQuestion = /\?/.test(response);
    const hasSocraticHints = /посмотри|подумай|что будет|какой знак|как изменится/i.test(response);
    
    checks.push({
      name: "НЕ дает прямой ответ 'правильно'",
      passed: !hasDirectAnswer,
      icon: !hasDirectAnswer ? "✅" : "❌"
    });
    checks.push({
      name: "Задает вопросы (Метод Сократа)",
      passed: hasQuestion,
      icon: hasQuestion ? "✅" : "❌"
    });
    checks.push({
      name: "Использует наводящие фразы",
      passed: hasSocraticHints,
      icon: hasSocraticHints ? "✅" : "❌"
    });
  }
  
  if (testName.includes("Простое объяснение")) {
    const hasLocalContext = /сом|кыргыз|бишкек|ош/i.test(response);
    const isShort = response.length < 500; // Короткий урок
    
    checks.push({
      name: "Использует локальный контекст (сомы, КР)",
      passed: hasLocalContext,
      icon: hasLocalContext ? "✅" : "⚠️"
    });
    checks.push({
      name: "Короткое объяснение (< 500 символов)",
      passed: isShort,
      icon: isShort ? "✅" : "⚠️"
    });
  }
  
  if (testName.includes("Генерация задачи")) {
    const hasLocalContext = /сом|кыргыз|бишкек|ош|магазин|базар/i.test(response);
    const hasMath = /\d+/.test(response);
    
    checks.push({
      name: "Создает задачу с числами",
      passed: hasMath,
      icon: hasMath ? "✅" : "❌"
    });
    checks.push({
      name: "Использует контекст КР",
      passed: hasLocalContext,
      icon: hasLocalContext ? "✅" : "⚠️"
    });
  }
  
  // Общие проверки для всех
  const inRussian = /[а-яА-Я]/.test(response);
  const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(response);
  
  checks.push({
    name: "Отвечает на русском языке",
    passed: inRussian,
    icon: inRussian ? "✅" : "❌"
  });
  checks.push({
    name: "Использует эмодзи умеренно",
    passed: hasEmoji,
    icon: hasEmoji ? "✅" : "⚠️"
  });
  
  checks.forEach(check => {
    console.log(`${check.icon} ${check.name}`);
  });
  
  const passedCount = checks.filter(c => c.passed).length;
  const totalCount = checks.length;
  const percentage = Math.round((passedCount / totalCount) * 100);
  
  console.log(`\n📊 РЕЗУЛЬТАТ: ${passedCount}/${totalCount} (${percentage}%)`);
}

// Запуск всех тестов
async function runAllTests() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                    ТЕСТИРОВАНИЕ AI ПРОМПТОВ BILIMHUB                       ║
║                         Google Gemini 2.0 Flash                            ║
╚════════════════════════════════════════════════════════════════════════════╝
  `);
  
  for (const testCase of testScenarios) {
    await testGemini(testCase);
    // Пауза между запросами
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\n${"=".repeat(80)}`);
  console.log("🎉 ВСЕ ТЕСТЫ ЗАВЕРШЕНЫ");
  console.log(`${"=".repeat(80)}\n`);
}

// Запуск
runAllTests().catch(console.error);
