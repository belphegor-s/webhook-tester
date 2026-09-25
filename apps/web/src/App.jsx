import { lazy, Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, Plus, Loader2, ArrowLeft, Webhook, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { useWebhooks } from './hooks/useWebhooks';
import { useRequests } from './hooks/useRequests';
import { useAuth } from './hooks/useAuth';
import { useRealtime } from './hooks/useRealtime';
import { coalesce } from './utils/coalesce';
import { webhookUrl } from './lib/config';
import { cn } from './lib/utils';

import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Container } from './components/layout/Container';
import { WebhookList } from './components/webhook/WebhookList';
import { WebhookAvatar } from './components/webhook/WebhookAvatar';
import { RequestList, RequestListSkeleton } from './components/webhook/RequestList';
import { CreateWebhookModal } from './components/webhook/CreateWebhookModal';
import { EditWebhookModal } from './components/webhook/EditWebhookModal';
import { LoginPage } from './components/LoginPage';
import { ApiKeysModal } from './components/account/ApiKeysModal';
import { Button } from './components/ui/Button';
import { Badge } from './components/ui/Badge';
import { CopyButton } from './components/ui/CopyButton';
import { Pagination } from './components/ui/Pagination';
import { Switch } from './components/ui/Switch';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './components/ui/Dialog';

// Admin-only screen: kept out of the main bundle.
const AdminView = lazy(() => import('./components/admin/AdminView').then((m) => ({ default: m.AdminView })));

const pageTransition = { duration: 0.25, ease: [0.16, 1, 0.3, 1] };

const App = () => {
  const { status, user, error, logout } = useAuth();

  if (status === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center" aria-busy="true">
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  if (status !== 'authenticated') {
    return <LoginPage error={error} />;
  }

  // Keyed by user so nothing from a previous account survives a re-login in the same tab.
  return <AuthenticatedApp key={user.id} user={user} logout={logout} />;
};

const showToast = (message, type = 'info') => {
  if (type === 'success') toast.success(message);
  else if (type === 'error') toast.error(message);
  else toast(message);
};

const AuthenticatedApp = ({ user, logout }) => {
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [showApiKeys, setShowApiKeys] = useState(false);
  // 'webhooks' or 'admin' (?view=admin; admins only, and the API enforces it independently).
  const viewFromUrl = useCallback(() => (user.is_admin && new URL(window.location).searchParams.get('view') === 'admin' ? 'admin' : 'webhooks'), [user.is_admin]);
  const [view, setView] = useState(viewFromUrl);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [webhookToDelete, setWebhookToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    webhooks,
    loading: webhooksLoading,
    totalPages: totalWebhookPages,
    page: webhookPage,
    setPage: setWebhookPage,
    createWebhook: apiCreateWebhook,
    deleteWebhook: apiDeleteWebhook,
    fetchWebhooks,
    setWebhookActive,
    updateWebhook,
  } = useWebhooks();

  // Server-Sent Events drive refreshes; the handler lives in a ref so it always sees current state.
  const onRealtimeEvent = useRef(null);
  const live = useRealtime((event) => onRealtimeEvent.current?.(event));

  const [webhookToEdit, setWebhookToEdit] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const { requests, loading: requestsLoading, totalPages: totalRequestPages, page: requestPage, setPage: setRequestPage, fetchRequests } = useRequests(selectedWebhook?.endpoint, { poll: !live });

  const handleCreateWebhook = async (formData) => {
    setIsCreating(true);
    try {
      await apiCreateWebhook(formData);
      showToast('Webhook created', 'success');
      setShowCreateModal(false);
    } catch (error) {
      showToast(error.message || 'Failed to create webhook', 'error');
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteWebhook = (id, name) => {
    setWebhookToDelete({ id, name });
  };

  const confirmDeleteWebhook = async () => {
    if (!webhookToDelete) return;
    setIsDeleting(true);
    try {
      await apiDeleteWebhook(webhookToDelete.id);
      showToast('Webhook deleted', 'success');
      if (selectedWebhook?.id === webhookToDelete.id) {
        setSelectedWebhook(null);
      }
    } catch {
      showToast('Failed to delete webhook', 'error');
    } finally {
      setIsDeleting(false);
      setWebhookToDelete(null);
    }
  };

  const copyWebhookUrl = async (endpoint) => {
    try {
      await navigator.clipboard.writeText(webhookUrl(endpoint));
      showToast('Webhook URL copied');
    } catch {
      showToast('Could not access clipboard', 'error');
    }
  };

  const [togglingId, setTogglingId] = useState(null);

  const handleToggleActive = async (webhook, next) => {
    setTogglingId(webhook.id);
    try {
      await setWebhookActive(webhook.id, next);
      showToast(next ? `${webhook.name} is active` : `${webhook.name} is inactive`, 'success');
    } catch (error) {
      showToast(error.message || 'Failed to update webhook', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleEditWebhook = async (fields) => {
    setIsSaving(true);
    try {
      const updated = await updateWebhook(webhookToEdit.id, fields);
      setSelectedWebhook((prev) => (prev?.id === updated.id ? { ...prev, ...updated } : prev));
      showToast('Webhook updated', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to update webhook', 'error');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchRequests(false);
    } catch {
      showToast('Failed to refresh requests', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSelectWebhook = (webhook) => {
    setSelectedWebhook(webhook);
    setRequestPage(0);
    window.scrollTo({ top: 0 });

    const url = new URL(window.location);
    url.searchParams.set('webhook_endpoint', webhook.endpoint);
    url.searchParams.set('req_page', 1);
    url.searchParams.delete('page');
    window.history.pushState({ wh: webhook.endpoint, rp: 1 }, '', url);
  };

  const openAdmin = () => {
    setSelectedWebhook(null);
    setView('admin');
    window.scrollTo({ top: 0 });
    const url = new URL(window.location.pathname, window.location.origin);
    url.searchParams.set('view', 'admin');
    window.history.pushState({ view: 'admin' }, '', url);
  };

  const handleBackToWebhooks = () => {
    if (view === 'admin') {
      setView('webhooks');
      const url = new URL(window.location);
      url.searchParams.delete('view');
      url.searchParams.set('page', webhookPage + 1);
      window.history.pushState({ p: webhookPage + 1 }, '', url);
      return;
    }
    if (!selectedWebhook) return;
    setSelectedWebhook(null);
    const url = new URL(window.location);
    url.searchParams.delete('webhook_endpoint');
    url.searchParams.delete('req_page');
    url.searchParams.set('page', webhookPage + 1);
    window.history.pushState({ p: webhookPage + 1 }, '', url);
  };

  const handlePageChange = (newPage) => {
    setWebhookPage(newPage);
    const url = new URL(window.location);
    url.searchParams.set('page', newPage + 1);
    window.history.pushState({ p: newPage + 1 }, '', url);
  };

  const handleRequestPageChange = (newPage) => {
    setRequestPage(newPage);
    const url = new URL(window.location);
    url.searchParams.set('req_page', newPage + 1);
    window.history.pushState({ wh: selectedWebhook.endpoint, rp: newPage + 1 }, '', url);
  };

  // Sync state from URL
  const syncFromUrl = useCallback(() => {
    const url = new URL(window.location);
    const whEndpoint = url.searchParams.get('webhook_endpoint');
    const p = parseInt(url.searchParams.get('page')) || 1;
    const rp = parseInt(url.searchParams.get('req_page')) || 1;

    if (webhooks.length > 0) {
      if (whEndpoint) {
        const wh = webhooks.find((w) => w.endpoint === whEndpoint);
        if (wh) {
          setSelectedWebhook(wh);
          setRequestPage(rp - 1);
        }
      } else {
        setSelectedWebhook(null);
        setWebhookPage(p - 1);
      }
    }
  }, [webhooks, setRequestPage, setWebhookPage]);

  // Back/forward between the admin view and the rest of the app.
  useEffect(() => {
    const onPop = () => setView(viewFromUrl());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [viewFromUrl]);

  // Initial load and back/forward buttons
  useEffect(() => {
    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [syncFromUrl]);

  // Bursts of events (a flood of deliveries) collapse into one refetch per window.
  const refetch = useRef({});
  useEffect(() => {
    refetch.current = {
      webhooks: () => fetchWebhooks(false).catch(() => {}),
      requests: () => fetchRequests(false).catch(() => {}),
    };
  });
  const [scheduleWebhooks] = useState(() => coalesce(() => refetch.current.webhooks(), 400));
  const [scheduleRequests] = useState(() => coalesce(() => refetch.current.requests(), 250));

  useEffect(() => {
    onRealtimeEvent.current = (event) => {
      switch (event.type) {
        case 'resync':
          scheduleWebhooks();
          if (selectedWebhook) scheduleRequests();
          break;
        case 'request':
          // Counts and "last request" only show on the list; the open webhook refreshes its first page.
          if (!selectedWebhook) scheduleWebhooks();
          else if (event.endpoint === selectedWebhook.endpoint && requestPage === 0) scheduleRequests();
          break;
        case 'webhook.created':
        case 'webhook.updated':
          scheduleWebhooks();
          break;
        case 'webhook.deleted':
          scheduleWebhooks();
          // Deleted elsewhere (another tab or an API key) while open here. Our own delete is handled by confirmDeleteWebhook.
          if (selectedWebhook?.id === event.webhook_id && webhookToDelete?.id !== event.webhook_id) {
            handleBackToWebhooks();
            showToast(`${selectedWebhook.name} was deleted`);
          }
          break;
      }
    };
  });

  // The selected webhook is a snapshot; prefer the live row so toggles and remote edits are reflected immediately.
  const current = selectedWebhook ? (webhooks.find((w) => w.id === selectedWebhook.id) ?? selectedWebhook) : null;
  const isActive = Boolean(current?.is_active);
  const isLive = current && isActive && requestPage === 0;

  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-x-clip">
      <Navbar
        crumb={view === 'admin' ? 'Admin' : current?.name}
        onHome={handleBackToWebhooks}
        user={user}
        onOpenApiKeys={() => setShowApiKeys(true)}
        onOpenAdmin={openAdmin}
        adminActive={view === 'admin'}
        onLogout={logout}
      />

      <main className="flex-1 pt-8 sm:pt-12">
        <Container>
          <AnimatePresence mode="wait" initial={false}>
            {view === 'admin' ? (
              <motion.section key="admin-view" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={pageTransition} className="w-full min-w-0">
                <Suspense
                  fallback={
                    <div className="flex justify-center py-24">
                      <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading" />
                    </div>
                  }
                >
                  <AdminView currentUserId={user.id} />
                </Suspense>
              </motion.section>
            ) : !selectedWebhook ? (
              <motion.section key="webhooks-view" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={pageTransition} className="w-full">
                <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
                  <div className="min-w-0">
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Webhooks</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Capture, inspect and debug incoming HTTP requests.</p>
                  </div>
                  <Button onClick={() => setShowCreateModal(true)} className="shrink-0" aria-label="New webhook">
                    <Plus />
                    <span className="hidden sm:inline">New webhook</span>
                  </Button>
                </div>

                {webhooks.length === 0 && !webhooksLoading ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-background/50 px-6 py-20 text-center backdrop-blur-sm">
                    <span className="mb-4 flex size-11 items-center justify-center rounded-full border bg-card shadow-xs">
                      <Webhook className="size-5 text-muted-foreground" />
                    </span>
                    <h3 className="font-medium">No webhooks yet</h3>
                    <p className="mt-1 max-w-xs text-sm text-muted-foreground">Create your first endpoint to start receiving and inspecting requests.</p>
                    <Button onClick={() => setShowCreateModal(true)} className="mt-6">
                      <Plus />
                      Create webhook
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <WebhookList
                      webhooks={webhooks}
                      loading={webhooksLoading}
                      onSelect={handleSelectWebhook}
                      onDelete={handleDeleteWebhook}
                      onCopy={copyWebhookUrl}
                      onToggleActive={handleToggleActive}
                      onEdit={setWebhookToEdit}
                    />
                    <Pagination page={webhookPage} totalPages={totalWebhookPages} onChange={handlePageChange} />
                  </div>
                )}
              </motion.section>
            ) : (
              <motion.section key="requests-view" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={pageTransition} className="w-full min-w-0">
                <button
                  type="button"
                  onClick={handleBackToWebhooks}
                  className="mb-5 inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <ArrowLeft className="size-4" />
                  Webhooks
                </button>

                <div className="mb-6 flex flex-col gap-5 sm:mb-8 md:flex-row md:items-start md:justify-between">
                  <div className="flex min-w-0 items-start gap-3.5">
                    <WebhookAvatar
                      seed={selectedWebhook.endpoint || selectedWebhook.name}
                      className={cn('mt-0.5 size-10 transition-[filter,opacity] sm:size-11', !isActive && 'opacity-60 grayscale')}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">{current.name}</h1>
                        {isLive && (
                          <Badge variant="outline" className="gap-1.5" title={live ? 'Receiving requests in real time' : 'Auto-refreshing every 5 seconds'}>
                            <span className="relative flex size-1.5">
                              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
                              <span className="relative inline-flex size-1.5 rounded-full bg-success" />
                            </span>
                            Live
                          </Badge>
                        )}
                      </div>
                      {current.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{current.description}</p>}
                    </div>
                  </div>

                  <div className="flex w-full min-w-0 items-center gap-2 md:w-auto md:max-w-md">
                    <div className="flex h-9 min-w-0 flex-1 items-center gap-1 rounded-md border bg-background/80 pr-0.5 pl-3 shadow-xs backdrop-blur-sm">
                      <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground" title={webhookUrl(selectedWebhook.endpoint)}>
                        {webhookUrl(selectedWebhook.endpoint)}
                      </span>
                      <CopyButton value={webhookUrl(selectedWebhook.endpoint)} label="Copy URL" className="size-7" />
                    </div>
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing || requestsLoading} aria-label="Refresh requests" title="Refresh">
                      <RotateCcw className={cn(isRefreshing && 'animate-spin [animation-direction:reverse]')} />
                    </Button>
                    <div className="flex h-9 shrink-0 items-center gap-2 rounded-md border bg-background/80 px-2.5 shadow-xs backdrop-blur-sm">
                      <Switch
                        id="webhook-active"
                        checked={isActive}
                        disabled={togglingId === current.id}
                        onCheckedChange={(next) => handleToggleActive(current, next)}
                        aria-label={isActive ? 'Deactivate webhook' : 'Activate webhook'}
                      />
                      <label htmlFor="webhook-active" className="w-[3.25rem] cursor-pointer text-xs font-medium select-none">
                        {isActive ? 'Active' : 'Inactive'}
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <AnimatePresence initial={false}>
                    {!isActive && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={pageTransition} className="overflow-hidden">
                        <div role="status" className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border bg-muted">
                              <Pause className="size-3.5 text-muted-foreground" />
                            </span>
                            <div className="text-sm">
                              <p className="font-medium">This webhook is inactive</p>
                              <p className="mt-0.5 text-muted-foreground">Incoming requests are rejected with 403 until you activate it.</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleToggleActive(current, true)} disabled={togglingId === current.id} className="self-start sm:self-auto">
                            Activate
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {requestsLoading ? <RequestListSkeleton /> : <RequestList key={selectedWebhook.endpoint} requests={requests} url={webhookUrl(selectedWebhook.endpoint)} />}
                  <Pagination page={requestPage} totalPages={totalRequestPages} onChange={handleRequestPageChange} />
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </Container>
      </main>

      <Footer />

      <ApiKeysModal open={showApiKeys} onOpenChange={setShowApiKeys} />

      <CreateWebhookModal open={showCreateModal} onOpenChange={setShowCreateModal} onSubmit={handleCreateWebhook} loading={isCreating} />

      <EditWebhookModal
        key={webhookToEdit?.id}
        webhook={webhookToEdit}
        onOpenChange={(open) => {
          if (!open && !isSaving) setWebhookToEdit(null);
        }}
        onSubmit={handleEditWebhook}
        loading={isSaving}
      />

      <Dialog
        open={!!webhookToDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setWebhookToDelete(null);
        }}
      >
        <DialogHeader className="pb-5 sm:pb-6">
          <DialogTitle>Delete webhook</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{webhookToDelete?.name}</span> and all of its recorded requests will be permanently removed. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setWebhookToDelete(null)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDeleteWebhook} disabled={isDeleting} className="min-w-28">
            {isDeleting ? <Loader2 className="animate-spin" /> : 'Delete'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default App;
