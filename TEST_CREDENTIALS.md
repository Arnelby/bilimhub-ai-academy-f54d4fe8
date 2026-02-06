# 🔐 Учетные данные для тестирования BilimHub

## 1️⃣ SUPABASE CLI (для деплоя)

### Авторизация через браузер:
```bash
supabase login
```
После этого откроется браузер для входа через:
- GitHub
- Google
- Email (который привязан к Supabase проекту)

**Нет пароля - используется OAuth!**

---

## 2️⃣ ТЕСТОВЫЙ АККАУНТ ДЛЯ САЙТА

### Вариант А: Создать через сайт
1. Открой https://bilimhub.com (или твой домен)
2. Нажми "Регистрация"
3. Введи:
   ```
   Email: test@bilimhub.kg
   Пароль: Test123456!
   Имя: Тестовый Студент
   ```
4. Подтверди email (если включена верификация)

### Вариант Б: Создать через Supabase Dashboard
1. Открой https://supabase.com/dashboard/project/lsisqkrzhtpxyhfmwnhq
2. Authentication → Users
3. Нажми "Add user"
4. Введи:
   ```
   Email: test@bilimhub.kg
   Password: Test123456!
   ```
5. Нажми "Create user"

---

## 3️⃣ SUPABASE DATABASE (прямой доступ к БД)

### Connection String:
```
Найди в Supabase Dashboard:
Project Settings → Database → Connection String

Или:
postgresql://postgres:[YOUR-PASSWORD]@db.lsisqkrzhtpxyhfmwnhq.supabase.co:5432/postgres
```

⚠️ **ВНИМАНИЕ:** Пароль БД не храни в репозитории! Это секретная информация.

---

## 4️⃣ LOVABLE AI GATEWAY

### API ключ для функций:
```
Это уже настроено в Supabase:
Environment Variables → LOVABLE_API_KEY

Не нужно вводить вручную!
```

---

## 🧪 ТЕСТ-КЕЙСЫ ДЛЯ ПРОВЕРКИ

### После создания тестового аккаунта:

1. **Логин:**
   ```
   Email: test@bilimhub.kg
   Пароль: Test123456!
   ```

2. **Открой чат с ИИ**
   - Спроси: "Как решить x+5=10?"
   - Дай неправильный ответ: "x = 15"
   - ✅ ИИ должен задать вопрос (Метод Сократа)

3. **Создай тест**
   - Выбери "Математика"
   - Часть 1 или 2
   - Нажми "Сгенерировать"
   - ✅ Вопросы должны быть с локальным контекстом (сомы, города КР)

4. **Проверь профиль**
   - Открой "Мой профиль"
   - ✅ Должен показать статистику

---

## 🔍 ПРОВЕРКА АВТОРИЗАЦИИ SUPABASE CLI

### Команда для проверки:
```bash
# Показать текущего пользователя
supabase status

# Или
supabase projects list
```

Если ты НЕ авторизован, увидишь:
```
Error: Not logged in. Run "supabase login" first.
```

---

## 🆘 ЧАСТЫЕ ПРОБЛЕМЫ

### "Invalid login credentials"
**Причина:** Неправильный email/пароль  
**Решение:** Проверь email, убедись что аккаунт создан в Supabase

### "Email not confirmed"
**Причина:** Email не подтверждён  
**Решение:** 
1. Проверь почту
2. Или в Supabase Dashboard → Authentication → Users → найди пользователя → три точки → "Send Magic Link"

### "User already exists"
**Причина:** Этот email уже зарегистрирован  
**Решение:** Используй другой email или сбрось пароль

---

## 🎯 РЕКОМЕНДАЦИИ

### Для разработки:
```
Email: dev@bilimhub.kg
Пароль: DevTest123!
```

### Для демо на питче:
```
Email: demo@bilimhub.kg
Пароль: Demo123!
Имя: Айгуль Токтомова (типичное кыргызское имя)
```

### Для тестов:
```
Email: test@bilimhub.kg
Пароль: Test123456!
```

---

## ⚠️ БЕЗОПАСНОСТЬ

1. **НЕ используй эти пароли в продакшене!**
2. **НЕ коммить пароли в Git!**
3. **Для питча создай отдельный demo аккаунт**
4. **После питча удали тестовые аккаунты**

---

**Если нужен доступ к панели Supabase - попроси Арнеля добавить тебя в Team (Settings → Team → Invite)**
