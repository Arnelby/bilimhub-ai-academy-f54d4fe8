import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AdminTopic {
  id: string;
  title: string;
  title_ru: string | null;
  title_kg: string | null;
  description: string | null;
  description_ru: string | null;
  description_kg: string | null;
  subject: string;
  level_grade: number;
  content_blocks: any[];
  ai_labels: string[];
  ai_categories: string[];
  ai_metadata: Record<string, any>;
  learning_styles: Record<string, any>;
  is_published: boolean;
  order_index: number;
  parent_topic_id: string | null;
  created_at: string;
  updated_at: string;
}

const SUBJECTS = ['math', 'russian', 'kyrgyz', 'chemistry', 'biology', 'physics', 'english'];

const emptyTopic: Partial<AdminTopic> = {
  title: '',
  title_ru: '',
  title_kg: '',
  description: '',
  description_ru: '',
  description_kg: '',
  subject: 'math',
  level_grade: 1,
  content_blocks: [],
  ai_labels: [],
  ai_categories: [],
  ai_metadata: {},
  learning_styles: { visual: null, auditory: null, reading_writing: null, problem_solver: null },
  is_published: false,
  order_index: 0,
  parent_topic_id: null,
};

export default function TopicsManager() {
  const [topics, setTopics] = useState<AdminTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Partial<AdminTopic> | null>(null);
  const [labelsInput, setLabelsInput] = useState('');
  const [categoriesInput, setCategoriesInput] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchTopics();
  }, []);

  async function fetchTopics() {
    try {
      const { data, error } = await supabase
        .from('admin_topics')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setTopics((data as AdminTopic[]) || []);
    } catch (error) {
      console.error('Error fetching topics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load topics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingTopic({ ...emptyTopic });
    setLabelsInput('');
    setCategoriesInput('');
    setDialogOpen(true);
  }

  function openEditDialog(topic: AdminTopic) {
    setEditingTopic({ ...topic });
    setLabelsInput(topic.ai_labels?.join(', ') || '');
    setCategoriesInput(topic.ai_categories?.join(', ') || '');
    setDialogOpen(true);
  }

  async function saveTopic() {
    if (!editingTopic?.title || !editingTopic?.subject) {
      toast({
        title: 'Validation Error',
        description: 'Title and subject are required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const topicData = {
        title: editingTopic.title,
        title_ru: editingTopic.title_ru || null,
        title_kg: editingTopic.title_kg || null,
        description: editingTopic.description || null,
        description_ru: editingTopic.description_ru || null,
        description_kg: editingTopic.description_kg || null,
        subject: editingTopic.subject,
        level_grade: editingTopic.level_grade || 1,
        content_blocks: editingTopic.content_blocks || [],
        ai_labels: labelsInput.split(',').map((s) => s.trim()).filter(Boolean),
        ai_categories: categoriesInput.split(',').map((s) => s.trim()).filter(Boolean),
        ai_metadata: editingTopic.ai_metadata || {},
        learning_styles: editingTopic.learning_styles || {},
        is_published: editingTopic.is_published || false,
        order_index: editingTopic.order_index || 0,
        parent_topic_id: editingTopic.parent_topic_id || null,
        created_by: user?.id || null,
      };

      if (editingTopic.id) {
        const { error } = await supabase
          .from('admin_topics')
          .update(topicData)
          .eq('id', editingTopic.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Topic updated successfully' });
      } else {
        const { error } = await supabase.from('admin_topics').insert([topicData]);
        if (error) throw error;
        toast({ title: 'Success', description: 'Topic created successfully' });
      }

      setDialogOpen(false);
      fetchTopics();
    } catch (error: any) {
      console.error('Error saving topic:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save topic',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  async function deleteTopic(id: string) {
    if (!confirm('Are you sure you want to delete this topic?')) return;

    try {
      const { error } = await supabase.from('admin_topics').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Topic deleted successfully' });
      fetchTopics();
    } catch (error: any) {
      console.error('Error deleting topic:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete topic',
        variant: 'destructive',
      });
    }
  }

  const filteredTopics = topics.filter((topic) => {
    const matchesSearch =
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = subjectFilter === 'all' || topic.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Topics Manager</h2>
          <p className="text-muted-foreground">Create and manage learning topics for AI training</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Topic
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTopic?.id ? 'Edit Topic' : 'Create New Topic'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title (English) *</Label>
                  <Input
                    id="title"
                    value={editingTopic?.title || ''}
                    onChange={(e) => setEditingTopic({ ...editingTopic, title: e.target.value })}
                    placeholder="Topic title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Select
                    value={editingTopic?.subject || 'math'}
                    onValueChange={(value) => setEditingTopic({ ...editingTopic, subject: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title_ru">Title (Russian)</Label>
                  <Input
                    id="title_ru"
                    value={editingTopic?.title_ru || ''}
                    onChange={(e) => setEditingTopic({ ...editingTopic, title_ru: e.target.value })}
                    placeholder="Название темы"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title_kg">Title (Kyrgyz)</Label>
                  <Input
                    id="title_kg"
                    value={editingTopic?.title_kg || ''}
                    onChange={(e) => setEditingTopic({ ...editingTopic, title_kg: e.target.value })}
                    placeholder="Теманын аталышы"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (English)</Label>
                <Textarea
                  id="description"
                  value={editingTopic?.description || ''}
                  onChange={(e) => setEditingTopic({ ...editingTopic, description: e.target.value })}
                  placeholder="Topic description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="level_grade">Level/Grade</Label>
                  <Select
                    value={String(editingTopic?.level_grade || 1)}
                    onValueChange={(value) =>
                      setEditingTopic({ ...editingTopic, level_grade: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((level) => (
                        <SelectItem key={level} value={String(level)}>
                          Grade {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order_index">Order Index</Label>
                  <Input
                    id="order_index"
                    type="number"
                    value={editingTopic?.order_index || 0}
                    onChange={(e) =>
                      setEditingTopic({ ...editingTopic, order_index: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai_labels">AI Labels (comma-separated)</Label>
                <Input
                  id="ai_labels"
                  value={labelsInput}
                  onChange={(e) => setLabelsInput(e.target.value)}
                  placeholder="algebra, equations, linear"
                />
                <p className="text-xs text-muted-foreground">
                  Tags used for AI training and content categorization
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai_categories">AI Categories (comma-separated)</Label>
                <Input
                  id="ai_categories"
                  value={categoriesInput}
                  onChange={(e) => setCategoriesInput(e.target.value)}
                  placeholder="fundamentals, problem-solving"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_published"
                  checked={editingTopic?.is_published || false}
                  onCheckedChange={(checked) =>
                    setEditingTopic({ ...editingTopic, is_published: checked })
                  }
                />
                <Label htmlFor="is_published">Published (visible to students)</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveTopic} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingTopic?.id ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {SUBJECTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredTopics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {topics.length === 0
                ? 'No topics yet. Create your first topic!'
                : 'No topics match your search.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Labels</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTopics.map((topic) => (
                  <TableRow key={topic.id}>
                    <TableCell className="font-medium">{topic.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{topic.subject}</Badge>
                    </TableCell>
                    <TableCell>{topic.level_grade}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {topic.ai_labels?.slice(0, 3).map((label) => (
                          <Badge key={label} variant="secondary" className="text-xs">
                            {label}
                          </Badge>
                        ))}
                        {topic.ai_labels?.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{topic.ai_labels.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={topic.is_published ? 'default' : 'secondary'}>
                        {topic.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(topic)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTopic(topic.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
