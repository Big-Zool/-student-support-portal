import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Loader2 } from 'lucide-react';

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (subject: string, message: string) => Promise<boolean>;
  isCreating?: boolean;
  error?: string | null;
}

export function NewConversationDialog({
  open,
  onOpenChange,
  onCreate,
  isCreating = false,
  error = null,
}: NewConversationDialogProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleCreate = async () => {
    if (!subject.trim() || !message.trim()) return;
    const created = await onCreate(subject.trim(), message.trim());
    if (created) {
      setSubject('');
      setMessage('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nc-subject">Subject</Label>
            <Input
              id="nc-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Admission requirements"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nc-message">Message</Label>
            <Textarea
              id="nc-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your question in detail…"
              rows={4}
              className="resize-none"
            />
          </div>
          {error && (
            <p className="text-sm text-rose-500">{error}</p>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!subject.trim() || !message.trim() || isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Creating…
              </>
            ) : (
              'Create conversation'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
