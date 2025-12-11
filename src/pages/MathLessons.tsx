import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { mathTopics, MathTopic } from '@/data/mathLessonsData';
import { LessonTree, ContentType } from '@/components/lessons/LessonTree';
import { BasicLessonContent } from '@/components/lessons/BasicLessonContent';
import { MiniLessonsContent } from '@/components/lessons/MiniLessonsContent';
import { DiagramsContent } from '@/components/lessons/DiagramsContent';
import { CommonMistakesContent } from '@/components/lessons/CommonMistakesContent';
import { AdaptiveMiniTestContent } from '@/components/lessons/AdaptiveMiniTestContent';
import { FullTestContent } from '@/components/lessons/FullTestContent';
import { DynamicLessonContent } from '@/components/lessons/DynamicLessonContent';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calculator, Divide, X } from 'lucide-react';

const topicIcons: Record<string, React.ReactNode> = {
  'fractions': <Divide className="h-5 w-5" />,
  'exponents': <X className="h-5 w-5" />,
  'quadratic-equations': <Calculator className="h-5 w-5" />,
};

export default function MathLessons() {
  const { language } = useLanguage();
  const [selectedTopic, setSelectedTopic] = useState<MathTopic>(mathTopics[0]);
  const [selectedContentType, setSelectedContentType] = useState<ContentType>('basicLesson');

  const t = {
    title: language === 'ru' ? 'Уроки математики' : language === 'kg' ? 'Математика сабактары' : 'Math Lessons',
    subtitle: language === 'ru' ? 'Выберите тему и тип контента' : language === 'kg' ? 'Теманы жана мазмун түрүн тандаңыз' : 'Select a topic and content type',
  };

  const getTopicTitle = (topic: MathTopic) => {
    return language === 'kg' ? topic.titleKg : language === 'ru' ? topic.titleRu : topic.title;
  };

  const renderContent = () => {
    const topicTitle = getTopicTitle(selectedTopic);

    switch (selectedContentType) {
      case 'basicLesson':
        return <BasicLessonContent content={selectedTopic.basicLesson} topicTitle={topicTitle} />;
      case 'miniLessons':
        return <MiniLessonsContent lessons={selectedTopic.miniLessons} topicTitle={topicTitle} />;
      case 'diagrams':
        return <DiagramsContent diagrams={selectedTopic.diagrams} topicTitle={topicTitle} />;
      case 'commonMistakes':
        return <CommonMistakesContent mistakes={selectedTopic.commonMistakes} topicTitle={topicTitle} />;
      case 'miniTests':
        return <AdaptiveMiniTestContent questions={selectedTopic.miniTestQuestions} topicTitle={topicTitle} />;
      case 'fullTests':
        return <FullTestContent questions={selectedTopic.fullTestQuestions} topicTitle={topicTitle} />;
      case 'dynamicLessons':
        return <DynamicLessonContent templates={selectedTopic.dynamicLessonTemplates} topic={selectedTopic} />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t.title}</h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>

        {/* Topic Selection */}
        <Tabs 
          value={selectedTopic.id} 
          onValueChange={(id) => setSelectedTopic(mathTopics.find(t => t.id === id) || mathTopics[0])}
          className="mb-8"
        >
          <TabsList className="grid w-full grid-cols-3 h-auto">
            {mathTopics.map((topic) => (
              <TabsTrigger 
                key={topic.id} 
                value={topic.id}
                className="flex items-center gap-2 py-3"
              >
                {topicIcons[topic.id]}
                <span className="hidden sm:inline">{getTopicTitle(topic)}</span>
                <span className="sm:hidden">{topic.title.split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Content Display (3/4 width on large screens) */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            {renderContent()}
          </div>

          {/* Right: Lesson Tree Navigation (1/4 width on large screens) */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="sticky top-4">
              <LessonTree
                selectedType={selectedContentType}
                onSelectType={setSelectedContentType}
              />
              
              {/* Topic Info Card */}
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    {topicIcons[selectedTopic.id]}
                    {getTopicTitle(selectedTopic)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{selectedTopic.description}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="outline">{selectedTopic.miniLessons.length} mini-lessons</Badge>
                    <Badge variant="outline">{selectedTopic.miniTestQuestions.length} questions</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
