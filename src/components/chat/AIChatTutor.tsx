import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatTutorProps {
  isOpen?: boolean;
  onClose?: () => void;
  context?: any;
}

export function AIChatTutor({ isOpen = true, onClose, context }: AIChatTutorProps) {
  const { user, session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history
  useEffect(() => {
    async function loadHistory() {
      if (!user) return;

      const { data } = await supabase
        .from('ai_chat_messages')
        .select('role, content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (data) {
        setMessages(data as Message[]);
      }
    }

    loadHistory();
  }, [user]);

  const sendMessage = async () => {
    if (!input.trim() || !user || !session || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);

    // Save user message
    await supabase.from('ai_chat_messages').insert({
      user_id: user.id,
      role: 'user',
      content: userMessage,
    });

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: newMessages.slice(-10), // Last 10 messages for context
          context,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to get response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let assistantMessage = '';
      // Add empty assistant message
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      // Robust SSE parsing (line-by-line, handles partial JSON)
      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantMessage += content;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: 'assistant', content: assistantMessage };
                return next;
              });
            }
          } catch {
            // Put the line back and wait for more chunks
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush (in case stream ended without trailing newline)
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantMessage += content;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: 'assistant', content: assistantMessage };
                return next;
              });
            }
          } catch {
            // ignore leftover partial
          }
        }
      }

      // Save assistant message
      if (assistantMessage) {
        await supabase.from('ai_chat_messages').insert({
          user_id: user.id,
          role: 'assistant',
          content: assistantMessage,
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'Извините, произошла ошибка. Попробуйте позже.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between border-b p-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-accent" />
          AI Репетитор
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {/* Messages */}
        <div className="h-80 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Sparkles className="mx-auto h-12 w-12 text-accent/50 mb-4" />
              <p className="text-muted-foreground">
                Привет! Я ваш AI репетитор. Задайте любой вопрос по математике!
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-lg px-4 py-2 text-sm',
                  message.role === 'user'
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted'
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-muted rounded-lg px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={!user || !session ? "Войдите, чтобы писать" : "Задайте вопрос..."}
              className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              rows={1}
              disabled={!user || !session || isLoading}
            />
            <Button
              variant="accent"
              size="icon"
              onClick={sendMessage}
              disabled={!user || !session || !input.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Floating button to open chat
export function AIChatButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="accent"
      size="lg"
      className="fixed bottom-4 right-4 z-40 h-14 w-14 rounded-full shadow-lg hover:scale-105 transition-transform"
      onClick={onClick}
    >
      <MessageSquare className="h-6 w-6" />
    </Button>
  );
}
