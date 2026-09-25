import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogHeader, DialogBody, DialogTitle, DialogDescription, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';

const EMPTY = { name: '', description: '', secret: '' };

const CreateWebhookModal = ({ open, onOpenChange, onSubmit, loading }) => {
  const [form, setForm] = useState(EMPTY);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      await onSubmit(form);
      setForm(EMPTY);
      onOpenChange(false);
    } catch {
      // Error handling is managed by the caller (App.jsx)
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>New webhook</DialogTitle>
          <DialogDescription>Create an endpoint to start capturing incoming requests.</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wh-name">Name</Label>
            <Input id="wh-name" required autoComplete="off" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Stripe integration" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wh-description">
              Description <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="wh-description"
              rows={3}
              autoComplete="off"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What is this webhook for?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wh-secret">
              Secret <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input id="wh-secret" type="password" autoComplete="new-password" value={form.secret} onChange={(e) => setForm({ ...form, secret: e.target.value })} placeholder="••••••••" />
            <p className="text-xs text-muted-foreground">Requests must send it as a Bearer token.</p>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !form.name.trim()} className="min-w-28">
            {loading ? <Loader2 className="animate-spin" /> : 'Create webhook'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
};

export { CreateWebhookModal };
