import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { 
  Send, Bot, User, Loader2, Lightbulb, HelpCircle, 
  FileQuestion, Trash2, Brain, BookOpen 
} from "lucide-react";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export default function AISmartTutor() {
  const { user, session } = useAuth();
  const { language } = useLanguage();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [diagnosticProfile, setDiagnosticProfile] = useState<any>(null);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchUserData();
      loadChatHistory();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fetchUserData = async () => {
    if (!user) return;

    try {
      const [profileRes, topicsRes] = await Promise.all([
        supabase.from('user_diagnostic_profile').select('*').eq('user_id', user.id).single(),
        supabase.from('user_topic_progress').select('*, topics(title)').eq('user_id', user.id).lt('progress_percentage', 50),
      ]);

      setDiagnosticProfile(profileRes.data);
      setWeakTopics(topicsRes.data?.map((t: any) => t.topics?.title).filter(Boolean) || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const loadChatHistory = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (data && data.length > 0) {
        setMessages(data.map((m: any) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.created_at),
        })));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const saveChatMessage = async (role: 'user' | 'assistant', content: string) => {
    if (!user) return;

    try {
      await supabase.from('ai_chat_messages').insert({
        user_id: user.id,
        role,
        content,
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const sendMessage = async (messageText?: string, action?: string) => {
    const text = messageText || input.trim();
    if (!text || !session) return;

    const userMessage: Message = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    await saveChatMessage('user', text);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat-tutor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          diagnosticProfile,
          weakTopics,
          action,
          language,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(language === 'ru' ? 'Слишком много запросов. Подождите немного.' : 'Too many requests. Please wait.');
        }
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      let assistantContent = '';
      const decoder = new TextDecoder();

      setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date() }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: 'assistant',
                    content: assistantContent,
                    timestamp: new Date(),
                  };
                  return newMessages;
                });
              }
            } catch {}
          }
        }
      }

      await saveChatMessage('assistant', assistantContent);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
    if (!lastAssistantMessage) return;

    const prompts = {
      'explain_simpler': language === 'ru' ? 'Объясни проще, пожалуйста' : 'Please explain simpler',
      'give_example': language === 'ru' ? 'Дай практический пример' : 'Give me a practical example',
      'give_mini_test': language === 'ru' ? 'Дай мне мини-тест по этой теме' : 'Give me a mini-test on this topic',
    };

    sendMessage(prompts[action as keyof typeof prompts], action);
  };

  const clearHistory = async () => {
    if (!user) return;

    try {
      await supabase.from('ai_chat_messages').delete().eq('user_id', user.id);
      setMessages([]);
      toast({
        title: language === 'ru' ? 'История очищена' : 'History Cleared',
      });
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Layout>
      <div className="container py-6 h-[calc(100vh-12rem)]">
        <div className="flex flex-col h-full max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {language === 'ru' ? 'AI Умный Репетитор' : 'AI Smart Tutor'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {language === 'ru' ? 'Персонализированная помощь в обучении' : 'Personalized learning assistance'}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={clearHistory}>
              <Trash2 className="w-4 h-4 mr-2" />
              {language === 'ru' ? 'Очистить' : 'Clear'}
            </Button>
          </div>

          {/* Weak Topics Banner */}
          {weakTopics.length > 0 && (
            <Card className="mb-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200">
              <CardContent className="py-3">
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <span className="font-medium text-amber-800 dark:text-amber-200">
                    {language === 'ru' ? 'Слабые темы:' : 'Weak topics:'}
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {weakTopics.slice(0, 3).map((topic, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">{topic}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chat Area */}
          <Card className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <Bot className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      {language === 'ru' ? 'Привет! Я твой AI репетитор.' : "Hi! I'm your AI tutor."}
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      {language === 'ru' 
                        ? 'Задай мне любой вопрос по математике или попроси объяснить тему. Я адаптируюсь под твой стиль обучения!'
                        : 'Ask me any math question or request an explanation. I adapt to your learning style!'}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center mt-6">
                      {[
                        language === 'ru' ? 'Объясни квадратные уравнения' : 'Explain quadratic equations',
                        language === 'ru' ? 'Как решать проценты?' : 'How to solve percentages?',
                        language === 'ru' ? 'Помоги с геометрией' : 'Help me with geometry',
                      ].map((suggestion, idx) => (
                        <Button 
                          key={idx} 
                          variant="outline" 
                          size="sm"
                          onClick={() => sendMessage(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((message, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary/10">
                          <Bot className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-secondary">
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-3 justify-start">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary/10">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted p-3 rounded-lg">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Quick Actions */}
            {messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && !loading && (
              <div className="px-4 py-2 border-t flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => handleQuickAction('explain_simpler')}>
                  <Lightbulb className="w-4 h-4 mr-1" />
                  {language === 'ru' ? 'Объясни проще' : 'Explain simpler'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickAction('give_example')}>
                  <HelpCircle className="w-4 h-4 mr-1" />
                  {language === 'ru' ? 'Дай пример' : 'Give example'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickAction('give_mini_test')}>
                  <FileQuestion className="w-4 h-4 mr-1" />
                  {language === 'ru' ? 'Мини-тест' : 'Mini-test'}
                </Button>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={language === 'ru' ? 'Задай вопрос...' : 'Ask a question...'}
                  className="min-h-[60px] resize-none"
                  disabled={loading}
                />
                <Button onClick={() => sendMessage()} disabled={loading || !input.trim()}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
