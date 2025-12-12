import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const exponentLessonData = {
      topic: "Exponents",
      topic_ru: "Степени",
      topic_kg: "Даражалар",
      basic_lesson: {
        title: {
          en: "Understanding Exponents",
          ru: "Понимание степеней",
          kg: "Даражаларды түшүнүү"
        },
        video: "https://youtu.be/4-j-tKt6gIo?si=mx9oSpJwXaZax1R5",
        theory: {
          en: "An exponent tells us how many times a number (called the base) is multiplied by itself. For example, 2³ means 2 × 2 × 2 = 8.\n\n**Product Rule:** aᵐ × aⁿ = aᵐ⁺ⁿ\n**Quotient Rule:** aᵐ ÷ aⁿ = aᵐ⁻ⁿ\n**Power Rule:** (aᵐ)ⁿ = aᵐˣⁿ\n**Zero Exponent:** a⁰ = 1\n**Negative Exponent:** a⁻ⁿ = 1/aⁿ",
          ru: "Показатель степени говорит нам, сколько раз число умножается само на себя. Например, 2³ означает 2 × 2 × 2 = 8.\n\n**Правило произведения:** aᵐ × aⁿ = aᵐ⁺ⁿ\n**Правило частного:** aᵐ ÷ aⁿ = aᵐ⁻ⁿ\n**Правило степени:** (aᵐ)ⁿ = aᵐˣⁿ\n**Нулевая степень:** a⁰ = 1\n**Отрицательная степень:** a⁻ⁿ = 1/aⁿ",
          kg: "Даража саны бизге бир сан өзүнө канча жолу көбөйтүлгөнүн айтат. Мисалы, 2³ дегени 2 × 2 × 2 = 8.\n\n**Көбөйтүү эрежеси:** aᵐ × aⁿ = aᵐ⁺ⁿ\n**Бөлүү эрежеси:** aᵐ ÷ aⁿ = aᵐ⁻ⁿ\n**Даража эрежеси:** (aᵐ)ⁿ = aᵐˣⁿ\n**Нөлдүк даража:** a⁰ = 1\n**Терс даража:** a⁻ⁿ = 1/aⁿ"
        },
        definitions: [
          {
            term: { en: "Base", ru: "Основание", kg: "Негиз" },
            definition: { en: "The number being multiplied by itself", ru: "Число, которое умножается само на себя", kg: "Өзүнө көбөйтүлгөн сан" }
          },
          {
            term: { en: "Exponent", ru: "Показатель степени", kg: "Даража көрсөткүчү" },
            definition: { en: "The small number that tells how many times to multiply", ru: "Маленькое число, указывающее сколько раз умножить", kg: "Канча жолу көбөйтүүнү көрсөткөн кичине сан" }
          }
        ],
        examples: [
          {
            title: { en: "Basic Exponent", ru: "Основная степень", kg: "Негизги даража" },
            problem: { en: "Calculate 2⁴", ru: "Вычислите 2⁴", kg: "2⁴ эсептеңиз" },
            solution: { en: "2⁴ = 2 × 2 × 2 × 2 = 16", ru: "2⁴ = 2 × 2 × 2 × 2 = 16", kg: "2⁴ = 2 × 2 × 2 × 2 = 16" }
          },
          {
            title: { en: "Product Rule", ru: "Правило произведения", kg: "Көбөйтүү эрежеси" },
            problem: { en: "Simplify 3² × 3³", ru: "Упростите 3² × 3³", kg: "3² × 3³ жөнөкөйлөтүңүз" },
            solution: { en: "3² × 3³ = 3⁵ = 243", ru: "3² × 3³ = 3⁵ = 243", kg: "3² × 3³ = 3⁵ = 243" }
          }
        ],
        rules: [
          {
            name: { en: "Product Rule", ru: "Правило произведения", kg: "Көбөйтүү эрежеси" },
            description: { en: "When multiplying same bases, add exponents", ru: "При умножении одинаковых оснований, складываем показатели", kg: "Бирдей негиздерди көбөйтүүдө даражаларды кошобуз" },
            formula: "aᵐ × aⁿ = aᵐ⁺ⁿ"
          }
        ]
      },
      mini_lessons: [
        {
          id: "ml-1",
          title: {
            en: "Basics of Exponents",
            ru: "Основы степеней",
            kg: "Даражалардын негиздери"
          },
          summary: {
            en: "The teacher explains the basics of exponents with examples",
            ru: "Учитель объясняет основы степеней на примерах",
            kg: "Мугалим мисалдар менен даражалардын негиздерин түшүндүрөт"
          },
          duration: "10 min",
          video: "https://youtu.be/4-j-tKt6gIo?si=mx9oSpJwXaZax1R5",
          content: {
            en: "In this lesson, we cover the fundamental concepts of exponents.",
            ru: "В этом уроке мы рассматриваем основные понятия степеней.",
            kg: "Бул сабакта биз даражалардын негизги түшүнүктөрүн карайбыз."
          }
        }
      ],
      diagrams: [
        {
          id: "diag-1",
          title: {
            en: "Exponent Rules Cheat Sheet",
            ru: "Шпаргалка по правилам степеней",
            kg: "Даража эрежелеринин шпаргалкасы"
          },
          description: {
            en: "Complete reference for all exponent rules",
            ru: "Полный справочник всех правил степеней",
            kg: "Бардык даража эрежелери боюнча толук маалымат"
          },
          image: "exponents/exponent-rules-cheatsheet.png"
        },
        {
          id: "diag-2",
          title: {
            en: "Simplifying Exponents Flowchart",
            ru: "Блок-схема упрощения степеней",
            kg: "Даражаларды жөнөкөйлөтүү схемасы"
          },
          description: {
            en: "Step-by-step decision tree for simplifying expressions",
            ru: "Пошаговое дерево решений для упрощения выражений",
            kg: "Туюнтмаларды жөнөкөйлөтүү үчүн кадамдык чечим дарагы"
          },
          image: "exponents/exponent-simplification-flowchart.png"
        },
        {
          id: "diag-3",
          title: {
            en: "Negative and Zero Exponents",
            ru: "Отрицательные и нулевые степени",
            kg: "Терс жана нөлдүк даражалар"
          },
          description: {
            en: "Visual explanation of why a⁰ = 1 and negative exponents",
            ru: "Визуальное объяснение почему a⁰ = 1 и отрицательных степеней",
            kg: "a⁰ = 1 жана терс даражалар боюнча визуалдык түшүндүрмө"
          },
          image: "exponents/exponent-negative-zero-diagram.png"
        }
      ],
      common_mistakes: [
        {
          id: "cm-1",
          mistake: { en: "Adding exponents when bases differ", ru: "Сложение показателей при разных основаниях", kg: "Ар башка негиздерде даражаларды кошуу" },
          why: { en: "Product rule only works with same bases", ru: "Правило произведения работает только с одинаковыми основаниями", kg: "Көбөйтүү эрежеси бирдей негиздер менен гана иштейт" },
          fix: { en: "Calculate each power separately", ru: "Вычисляйте каждую степень отдельно", kg: "Ар бир даражаны өзүнчө эсептеңиз" },
          example: { en: "2³ × 3² = 8 × 9 = 72 (not 6⁵!)", ru: "2³ × 3² = 8 × 9 = 72 (не 6⁵!)", kg: "2³ × 3² = 8 × 9 = 72 (6⁵ эмес!)" }
        },
        {
          id: "cm-2",
          mistake: { en: "Thinking a⁰ = 0", ru: "Думать что a⁰ = 0", kg: "a⁰ = 0 деп ойлоо" },
          why: { en: "Zero exponent is not zero result", ru: "Нулевая степень не равна нулю", kg: "Нөлдүк даража нөлгө барабар эмес" },
          fix: { en: "Remember: a⁰ = 1 for any a ≠ 0", ru: "Помните: a⁰ = 1 для любого a ≠ 0", kg: "Эстеңиз: a⁰ = 1 ар кандай a ≠ 0 үчүн" },
          example: { en: "5⁰ = 1, 100⁰ = 1", ru: "5⁰ = 1, 100⁰ = 1", kg: "5⁰ = 1, 100⁰ = 1" }
        }
      ],
      mini_tests: [
        {
          id: "mt-1",
          difficulty: "easy",
          question: { en: "What is 5² × 5³?", ru: "Чему равно 5² × 5³?", kg: "5² × 5³ канчага барабар?" },
          options: {
            A: { en: "5⁵", ru: "5⁵", kg: "5⁵" },
            B: { en: "5⁶", ru: "5⁶", kg: "5⁶" },
            C: { en: "25⁵", ru: "25⁵", kg: "25⁵" },
            D: { en: "10⁵", ru: "10⁵", kg: "10⁵" }
          },
          correct: "A",
          explanation: { en: "Product rule: 5²⁺³ = 5⁵", ru: "Правило произведения: 5²⁺³ = 5⁵", kg: "Көбөйтүү эрежеси: 5²⁺³ = 5⁵" }
        },
        {
          id: "mt-2",
          difficulty: "easy",
          question: { en: "Simplify: 10⁰", ru: "Упростите: 10⁰", kg: "Жөнөкөйлөтүңүз: 10⁰" },
          options: {
            A: { en: "1", ru: "1", kg: "1" },
            B: { en: "0", ru: "0", kg: "0" },
            C: { en: "10", ru: "10", kg: "10" },
            D: { en: "undefined", ru: "не определено", kg: "аныкталган эмес" }
          },
          correct: "A",
          explanation: { en: "Any non-zero number^0 = 1", ru: "Любое число^0 = 1", kg: "Ар кандай сан^0 = 1" }
        },
        {
          id: "mt-3",
          difficulty: "medium",
          question: { en: "What is 2⁻³?", ru: "Чему равно 2⁻³?", kg: "2⁻³ канчага барабар?" },
          options: {
            A: { en: "1/8", ru: "1/8", kg: "1/8" },
            B: { en: "-8", ru: "-8", kg: "-8" },
            C: { en: "-6", ru: "-6", kg: "-6" },
            D: { en: "8", ru: "8", kg: "8" }
          },
          correct: "A",
          explanation: { en: "2⁻³ = 1/2³ = 1/8", ru: "2⁻³ = 1/2³ = 1/8", kg: "2⁻³ = 1/2³ = 1/8" }
        }
      ],
      full_test: [
        {
          id: "ft-1",
          question: { en: "What is 2⁴?", ru: "Чему равно 2⁴?", kg: "2⁴ канчага барабар?" },
          options: {
            A: { en: "16", ru: "16", kg: "16" },
            B: { en: "8", ru: "8", kg: "8" },
            C: { en: "32", ru: "32", kg: "32" },
            D: { en: "6", ru: "6", kg: "6" }
          },
          correct: "A",
          explanation: { en: "2⁴ = 16", ru: "2⁴ = 16", kg: "2⁴ = 16" }
        },
        {
          id: "ft-2",
          question: { en: "Simplify: x³ × x⁵", ru: "Упростите: x³ × x⁵", kg: "Жөнөкөйлөтүңүз: x³ × x⁵" },
          options: {
            A: { en: "x⁸", ru: "x⁸", kg: "x⁸" },
            B: { en: "x¹⁵", ru: "x¹⁵", kg: "x¹⁵" },
            C: { en: "2x⁸", ru: "2x⁸", kg: "2x⁸" },
            D: { en: "x²", ru: "x²", kg: "x²" }
          },
          correct: "A",
          explanation: { en: "x³⁺⁵ = x⁸", ru: "x³⁺⁵ = x⁸", kg: "x³⁺⁵ = x⁸" }
        }
      ],
      dynamic_lessons: {
        visual: {
          title: { en: "Exponents - Visual Learning", ru: "Степени - Визуальное обучение", kg: "Даражалар - Визуалдык окуу" },
          content: { en: "Learn through diagrams and visuals", ru: "Учитесь через диаграммы", kg: "Диаграммалар аркылуу үйрөнүңүз" },
          examples: [{ en: "See how 2³ grows visually", ru: "Посмотрите как 2³ растёт", kg: "2³ өсүшүн көрүңүз" }]
        },
        auditory: {
          title: { en: "Exponents - Audio Learning", ru: "Степени - Аудио обучение", kg: "Даражалар - Аудио окуу" },
          content: { en: "Learn through verbal explanations", ru: "Учитесь через объяснения", kg: "Түшүндүрмөлөр аркылуу үйрөнүңүз" },
          examples: [{ en: "Same base? Add exponents!", ru: "Одинаковые основания? Сложи!", kg: "Бирдей негиз? Кош!" }]
        },
        "text-based": {
          title: { en: "Exponents - Reading", ru: "Степени - Чтение", kg: "Даражалар - Окуу" },
          content: { en: "Comprehensive written explanations", ru: "Полные письменные объяснения", kg: "Толук жазуу түшүндүрмөлөрү" },
          examples: [{ en: "Step-by-step solutions", ru: "Пошаговые решения", kg: "Кадамдык чечимдер" }]
        },
        "problem-solver": {
          title: { en: "Exponents - Problem-Based", ru: "Степени - Через задачи", kg: "Даражалар - Маселе аркылуу" },
          content: { en: "Learn by solving problems", ru: "Учитесь решая задачи", kg: "Маселе чечүү менен үйрөнүңүз" },
          examples: [{ en: "Start simple, build up", ru: "Начните с простого", kg: "Жөнөкөйдөн баштаңыз" }]
        },
        "adhd-friendly": {
          title: { en: "Exponents - Quick & Interactive", ru: "Степени - Быстро", kg: "Даражалар - Тез" },
          content: { en: "Short, engaging lessons", ru: "Короткие уроки", kg: "Кыска сабактар" },
          examples: [{ en: "5-minute chunks", ru: "5-минутные блоки", kg: "5 мүнөттүк бөлүктөр" }]
        }
      }
    }

    // Upload the JSON file to storage
    const jsonContent = JSON.stringify(exponentLessonData, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    
    const { data, error } = await supabase.storage
      .from('lessons')
      .upload('exponents/exponents.json', blob, {
        contentType: 'application/json',
        upsert: true
      })

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Exponents lesson updated successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    console.error('Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
