import { MasteryNode, MasteryLevel } from './MasteryNode';

interface Topic {
  id: string;
  title: string;
  level: MasteryLevel;
  progress?: number;
}

interface LearningTreeProps {
  topics: Topic[];
  onTopicClick?: (topicId: string) => void;
}

export function LearningTree({ topics, onTopicClick }: LearningTreeProps) {
  return (
    <div className="flex flex-wrap justify-center gap-6 p-4">
      {topics.map((topic, index) => (
        <div key={topic.id} className="relative">
          <MasteryNode
            title={topic.title}
            level={topic.level}
            progress={topic.progress}
            onClick={() => onTopicClick?.(topic.id)}
          />
          {/* Connector line to next topic */}
          {index < topics.length - 1 && (
            <div className="absolute left-full top-1/2 h-0.5 w-6 -translate-y-1/2 bg-border hidden md:block" />
          )}
        </div>
      ))}
    </div>
  );
}
