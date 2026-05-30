import { useState } from 'react';
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
import { SALES_AGENTS, CURRENT_SALES_USER, MANAGER_USER } from './types';

interface ReassignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAssignee: string | null;
  onConfirm: (agent: string) => void;
}

export function ReassignDialog({ open, onOpenChange, currentAssignee, onConfirm }: ReassignDialogProps) {
  const [selected, setSelected] = useState('');

  const handleConfirm = () => {
    if (selected) {
      onConfirm(selected);
      setSelected('');
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
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a sales agent…" />
              </SelectTrigger>
              <SelectContent>
                {[MANAGER_USER, CURRENT_SALES_USER, ...SALES_AGENTS.filter((a) => a !== CURRENT_SALES_USER)]
                  .filter((a) => a !== currentAssignee)
                  .map((agent) => (
                    <SelectItem key={agent} value={agent}>
                      {agent === MANAGER_USER
                        ? `${agent} (admin)`
                        : agent === CURRENT_SALES_USER
                        ? `${agent} (you)`
                        : agent}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selected}>
            {currentAssignee ? 'Confirm Reassign' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
