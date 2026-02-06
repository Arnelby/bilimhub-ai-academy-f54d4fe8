// Проверка доступных моделей Gemini
const GEMINI_API_KEY = "AIzaSyCuFo7sBQp58KMy59npHhGuKdNtGIPMkEg";

async function listModels() {
  console.log("🔍 Проверка доступных моделей Gemini...\n");
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("❌ Ошибка:", response.status, await response.text());
      return;
    }
    
    const data = await response.json();
    
    if (data.models) {
      console.log(`✅ Найдено моделей: ${data.models.length}\n`);
      
      data.models.forEach((model, index) => {
        console.log(`${index + 1}. ${model.name}`);
        if (model.supportedGenerationMethods) {
          console.log(`   Методы: ${model.supportedGenerationMethods.join(', ')}`);
        }
        if (model.displayName) {
          console.log(`   Название: ${model.displayName}`);
        }
        console.log("");
      });
    } else {
      console.log("❌ Модели не найдены");
    }
    
  } catch (error) {
    console.error("❌ Ошибка:", error.message);
  }
}

listModels();
