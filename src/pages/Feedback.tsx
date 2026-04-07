import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { MessageSquare, Plus, Bug, Lightbulb, TrendingUp, ThumbsUp, Hash, Loader2 } from 'lucide-react';
import { useFeedback } from '@/hooks/useFeedback';

const typeConfig: Record<string, { icon: typeof Bug; color: string }> = {
  bug: { icon: Bug, color: 'bg-destructive/10 text-destructive' },
  request: { icon: Lightbulb, color: 'bg-warning/10 text-warning' },
  improvement: { icon: TrendingUp, color: 'bg-info/10 text-info' },
  praise: { icon: ThumbsUp, color: 'bg-success/10 text-success' },
};

export default function FeedbackPage() {
  const { feedback, isLoading, createFeedback, isCreating } = useFeedback();
  const [createOpen, setCreateOpen] = useState(false);
  const [type, setType] = useState('request');
  const [content, setContent] = useState('');
  const [customer, setCustomer] = useState('');

  const handleCreate = async () => {
    if (!content.trim()) return;
    await createFeedback({ type, content, customer: customer || undefined });
    setContent('');
    setCustomer('');
    setType('request');
    setCreateOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customer Feedback</h1>
          <p className="text-muted-foreground">Capture and track feedback from customers</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Log Feedback
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(typeConfig).map(([t, config]) => {
          const count = feedback.filter(f => f.type === t).length;
          const Icon = config.icon;
          return (
            <Card key={t}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${config.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground capitalize">{t}s</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty state */}
      {feedback.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No feedback yet</h3>
            <p className="text-muted-foreground mb-4">Start logging customer feedback to track insights</p>
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Log Feedback
            </Button>
          </div>
        </Card>
      )}

      {/* List */}
      <div className="space-y-4">
        {feedback.map(fb => {
          const cfg = typeConfig[fb.type] || typeConfig.request;
          const TypeIcon = cfg.icon;
          return (
            <Card key={fb.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${cfg.color}`}>
                    <TypeIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge className={cfg.color} variant="secondary">{fb.type}</Badge>
                      {fb.customer && <Badge variant="outline">{fb.customer}</Badge>}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                        <Hash className="h-3 w-3" />
                        {fb.frequency_count}x reported
                      </div>
                    </div>
                    <p className="text-foreground">{fb.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(fb.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Log Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="request">Feature Request</SelectItem>
                  <SelectItem value="improvement">Improvement</SelectItem>
                  <SelectItem value="praise">Praise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Customer (optional)</Label>
              <Input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Customer name" />
            </div>
            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Describe the feedback..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!content.trim() || isCreating}>
              {isCreating ? 'Saving...' : 'Log Feedback'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
