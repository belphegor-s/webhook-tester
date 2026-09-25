import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogHeader, DialogBody, DialogTitle, DialogDescription, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';

// Mount with key={webhook.id} so the fields reset to the current values each time it opens.
const EditWebhookModal = ({ webhook, onOpenChange, onSubmit, loading }) => {
  const [form, setForm] = useState({ name: webhook?.name ?? '', description: webhook?.description ?? '' });
  const name = form.name.trim();
  const description = form.description.trim();
  const unchanged = name === webhook?.name && description === (webhook?.description ?? '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || unchanged) return;

    try {
      await onSubmit({ name, description: description || null });
      onOpenChange(false);
    } catch {
      // Error handling is managed by the caller (App.jsx)
    }
  };

  return (
    <Dialog open={!!webhook} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Edit webhook</DialogTitle>
          <DialogDescription>The endpoint URL stays the same.</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wh-edit-name">Name</Label>
            <Input id="wh-edit-name" required autoFocus autoComplete="off" maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wh-edit-description">
              Description <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="wh-edit-description"
              rows={3}
              autoComplete="off"
              maxLength={500}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What is this webhook for?"
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !name || unchanged} className="min-w-28">
            {loading ? <Loader2 className="animate-spin" /> : 'Save'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
};

export { EditWebhookModal };
