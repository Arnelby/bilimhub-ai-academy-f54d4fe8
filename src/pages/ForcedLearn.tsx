import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useForcedLearning } from '@/hooks/useForcedLearning';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, XCircle, Sparkles, Target, ArrowRight, Trophy } from 'lucide-react';
import MathRenderer from '@/components/math/MathRenderer';
import { translateTopic } from '@/lib/topicTranslations';
import {
  pickNextQuestion,
  setCurrentQuestion,
  recordAnswer,
  advanceStep,
  evaluateAnswer,
  applyAnswerSideEffects,
  extendSession,
  letterOptionsForQuestion,
  LATIN_TO_CYRILLIC,
  type PickedQuestion,
  type EvaluatedAnswer,
  type LearningSession,
} from '@/lib/forcedLearning';

/**
 * Forced Learning Mode — единый экран замкнутого обучающего цикла.
 * Состояния: question → explanation → (next question | result).
 * Никакого Layout/Navbar — навигация скрыта целиком.
 */
export default function ForcedLearn() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { session, loading, refresh, complete, start } = useForcedLearning();

  const [picked, setPicked] = useState<PickedQuestion | null>(null);
  const [evaluated, setEvaluated] = useState<EvaluatedAnswer | null>(null);
  const [busy, setBusy] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);

  // Auto-start a session if user landed on /learn without one (e.g. direct CTA).
  useEffect(() => {
    if (loading || !user?.id) return;
    if (!session) {
      void start(null);
    }
  }, [loading, user?.id, session, start]);

  // When session is on 'question' step and we don't yet have a picked question, pick one.
  useEffect(() => {
    if (!user?.id || !session) return;
    if (session.status !== 'active') return;
    if (session.step !== 'question') return;

    if (session.current_question_payload && session.current_question_id) {
      setPicked({
        question_id: session.current_question_id,
        source: (session.current_question_source as any) || 'pool',
        topic: session.current_question_payload?.topic ?? session.topic ?? '',
        payload: session.current_question_payload,
      });
      setEvaluated(null);
      return;
    }

    let cancel = false;
    (async () => {
      setBusy(true);
      setPickError(null);
      const q = await pickNextQuestion({ userId: user.id, session });
      if (cancel) return;
      if (!q) {
        setPickError('Не удалось подобрать задачу. Попробуй позже.');
        setBusy(false);
        return;
      }
      const updated = await setCurrentQuestion(q);
      if (cancel) return;
      setPicked(q);
      setEvaluated(null);
      if (updated) await refresh();
      setBusy(false);
    })();
    return () => { cancel = true; };
  }, [user?.id, session, refresh]);

  // ----- Handlers -----

  const onAnswer = async (letter: string) => {
    if (!picked || !user?.id || !session || busy) return;
    setBusy(true);
    const evalRes = evaluateAnswer(picked, letter);
    setEvaluated(evalRes);
    await recordAnswer({
      isCorrect: evalRes.isCorrect,
      userAnswer: evalRes.userAnswer,
      correctAnswer: evalRes.correctAnswer,
      explanation: evalRes.explanation,
    });
    await applyAnswerSideEffects({ userId: user.id, session, picked, evaluated: evalRes });
    await refresh();
    setBusy(false);
  };

  const onNext = async () => {
    if (busy) return;
    setBusy(true);
    const updated = await advanceStep();
    setPicked(null);
    setEvaluated(null);
    await refresh();
    setBusy(false);
    if (!updated) return;
    if (updated.step === 'result') {
      console.log('[SESSION_RESULT_SHOWN]', { answered: updated.questions_answered, correct: updated.correct_count });
    }
  };

  const onContinueMore = async () => {
    if (busy) return;
    setBusy(true);
    await extendSession(5);
    setPicked(null);
    setEvaluated(null);
    await refresh();
    setBusy(false);
  };

  const onFinish = async () => {
    if (busy) return;
    setBusy(true);
    await complete();
    navigate('/dashboard', { replace: true });
  };

  // ----- Render -----

  if (loading || !session) {
    return <FullScreen><Loader2 className="h-8 w-8 animate-spin text-primary" /></FullScreen>;
  }

  if (pickError) {
    return (
      <FullScreen>
        <Card className="p-8 max-w-md text-center space-y-4">
          <p className="text-lg">{pickError}</p>
          <Button onClick={onFinish}>Завершить</Button>
        </Card>
      </FullScreen>
    );
  }

  const totalTarget = session.max_questions;
  const done = session.questions_answered;
  const progressPct = Math.min(100, Math.round((done / totalTarget) * 100));
  const accuracyPct = done > 0 ? Math.round((session.correct_count / done) * 100) : 0;
  const topicLabel = picked?.topic
    ? translateTopic(picked.topic, 'ru')
    : session.topic ? translateTopic(session.topic, 'ru') : 'Обучение';

  // RESULT screen
  if (session.step === 'result') {
    return (
      <FullScreen>
        <Card className="w-full max-w-md p-8 text-center space-y-6 shadow-lg border-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Trophy className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Отличная работа!</h1>
            <p className="text-muted-foreground mt-1">
              {session.topic ? `Ты улучшился в теме «${translateTopic(session.topic, 'ru')}»` : 'Ты сделал шаг вперёд'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Stat label="Правильных" value={`${session.correct_count} / ${done}`} />
            <Stat label="Точность" value={`${accuracyPct}%`} />
          </div>
          {session.max_questions < 10 && (
            <Button size="lg" className="w-full h-14" onClick={onContinueMore} disabled={busy}>
              Продолжить ещё 5 задач <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          )}
          <Button variant={session.max_questions < 10 ? 'outline' : 'default'} size="lg" className="w-full h-12" onClick={onFinish} disabled={busy}>
            Завершить
          </Button>
        </Card>
      </FullScreen>
    );
  }

  // QUESTION / EXPLANATION
  const showExplanation = session.step === 'explanation' && evaluated;
  const opts = picked ? letterOptionsForQuestion(picked) : ['A','B','C','D'];

  return (
    <FullScreen>
      <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Top progress + topic */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Target className="h-3.5 w-3.5" /> {topicLabel}
            </span>
            <span>{done} / {totalTarget}</span>
          </div>
          <Progress value={progressPct} className="h-1.5" />
        </div>

        {/* Question */}
        {picked && (
          <Card className="p-5 space-y-4">
            {picked.payload.question_type === 'comparison' ? (
              <ComparisonView payload={picked.payload} />
            ) : (
              <McqView payload={picked.payload} />
            )}

            {!showExplanation && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                {opts.map((L) => (
                  <Button
                    key={L}
                    variant="outline"
                    className="h-14 text-lg font-semibold"
                    onClick={() => onAnswer(L)}
                    disabled={busy}
                  >
                    {LATIN_TO_CYRILLIC[L] ?? L}
                  </Button>
                ))}
              </div>
            )}

            {showExplanation && evaluated && (
              <div className="space-y-3 pt-2">
                <div className={`flex items-center gap-2 text-sm font-medium ${evaluated.isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {evaluated.isCorrect ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  {evaluated.isCorrect ? 'Верно!' : 'Неверно'}
                  <span className="ml-auto text-muted-foreground font-normal">
                    Правильный: {LATIN_TO_CYRILLIC[evaluated.correctAnswer] ?? evaluated.correctAnswer}
                  </span>
                </div>
                <div className="rounded-md bg-muted/40 p-3 text-sm leading-relaxed">
                  <MathRenderer text={evaluated.explanation} />
                </div>
                <Button size="lg" className="w-full h-12" onClick={onNext} disabled={busy}>
                  Дальше <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Micro motivation every few questions */}
        {done > 0 && done % 3 === 0 && session.step === 'question' && (
          <p className="text-center text-xs text-muted-foreground inline-flex items-center justify-center gap-1 w-full">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            +1 к теме · точность {accuracyPct}%
          </p>
        )}
      </div>
    </FullScreen>
  );
}

function FullScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

// --- Question views ---
function ComparisonView({ payload }: { payload: PickedQuestion['payload'] }) {
  const qd = payload.question_data || {};
  const colA = qd.column_a ?? qd.columnA ?? '';
  const colB = qd.column_b ?? qd.columnB ?? '';
  const instr = qd.instruction ?? 'Сравни значения и выбери:';
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground"><MathRenderer text={instr} /></p>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border p-4 text-center">
          <div className="text-xs text-muted-foreground mb-1">Колонка A</div>
          <div className="text-base"><MathRenderer text={String(colA)} /></div>
        </div>
        <div className="rounded-md border p-4 text-center">
          <div className="text-xs text-muted-foreground mb-1">Колонка B</div>
          <div className="text-base"><MathRenderer text={String(colB)} /></div>
        </div>
      </div>
      <ul className="text-xs text-muted-foreground grid grid-cols-2 gap-1 pt-1">
        <li>А — A больше</li>
        <li>Б — B больше</li>
        <li>В — равны</li>
        <li>Г — нельзя определить</li>
      </ul>
    </div>
  );
}

function McqView({ payload }: { payload: PickedQuestion['payload'] }) {
  const qd = payload.question_data || {};
  const stem = qd.question ?? qd.stem ?? qd.text ?? '';
  const opts = qd.options || {};
  return (
    <div className="space-y-3">
      <div className="text-base font-medium"><MathRenderer text={String(stem)} /></div>
      <div className="space-y-1.5 text-sm">
        {Object.entries(opts).map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <span className="font-semibold text-primary">{LATIN_TO_CYRILLIC[k.toUpperCase()] ?? k.toUpperCase()}.</span>
            <span><MathRenderer text={String(v)} /></span>
          </div>
        ))}
      </div>
    </div>
  );
}
