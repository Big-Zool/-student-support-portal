import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getUsers } from '../../lib/apiClient';

interface ReassignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAssignee: string | null;
  onConfirm: (agentId: string) => void;
}

export function ReassignDialog({ open, onOpenChange, currentAssignee, onConfirm }: ReassignDialogProps) {
  const [selectedId, setSelectedId] = useState('');

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    enabled: open,
  });

  const teamMembers = users.filter((u) => u.role === 'sales');

  const handleConfirm = () => {
    if (selectedId) {
      onConfirm(selectedId);
      setSelectedId('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{currentAssignee ? 'Reassign Conversation' : 'Assign Conversation'}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-slate-500">Current owner</p>
            <p className="text-sm font-medium text-slate-900">
              {currentAssignee ?? 'Unassigned'}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Assign to</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a team member…" />
              </SelectTrigger>
              <SelectContent>
                {isLoading && <SelectItem value="loading" disabled>Loading team...</SelectItem>}
                {teamMembers
                  .filter((member) => member.full_name !== currentAssignee) // Exclude current
                  .map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name} ({member.role})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {error instanceof Error && (
              <p className="text-xs text-rose-500">{error.message}</p>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedId}>
            {currentAssignee ? 'Confirm Reassign' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
