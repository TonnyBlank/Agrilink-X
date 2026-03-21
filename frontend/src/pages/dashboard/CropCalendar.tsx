import DashboardShell from "@/components/dashboard/DashboardShell";
import { CropEventForm } from "@/components/dashboard/CropEventForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CropEvent, CropType } from "@/types/crop";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CloudSun,
  Filter,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

const cropIcons: Record<string, string> = {
  planting: "Plant",
  fertilizing: "Feed",
  spraying: "Spray",
  harvesting: "Harvest",
  irrigation: "Water",
  pruning: "Prune",
};

const cropColors: Record<string, string> = {
  planting: "from-emerald-500 to-green-600",
  fertilizing: "from-sky-500 to-blue-600",
  spraying: "from-amber-500 to-orange-600",
  harvesting: "from-violet-500 to-fuchsia-600",
  irrigation: "from-cyan-500 to-sky-600",
  pruning: "from-lime-500 to-emerald-600",
};

const weatherAlerts = [
  { condition: "Heavy rain expected", recommendation: "Delay spraying until leaf surfaces are dry.", icon: "Rain" },
  { condition: "Clear and sunny", recommendation: "Good window for planting and harvesting activity.", icon: "Sun" },
  { condition: "Mild temperatures", recommendation: "Strong conditions for fertilizing and pruning.", icon: "Cloud" },
];

type CropEventApiRow = {
  id: string;
  title: string | null;
  crop: string | null;
  type: CropType | null;
  event_date: string | null;
  notes: string | null;
  done: boolean | null;
};

type CropEventInput = {
  title: string;
  type: CropType;
  date: string;
  crop: string;
  notes?: string;
};

function toCropEvent(row: CropEventApiRow): CropEvent {
  const parsedDate = row.event_date ? new Date(`${row.event_date}T00:00:00`) : new Date();
  const safeDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

  return {
    id: row.id,
    title: row.title?.trim() || "Untitled event",
    crop: row.crop?.trim() || "Unknown crop",
    type: row.type?.trim() || "General",
    date: safeDate,
    done: Boolean(row.done),
    notes: row.notes || undefined,
  };
}

function getActivityBadge(type: string) {
  const normalized = type.trim().toLowerCase();
  return {
    label: cropIcons[normalized] || type.slice(0, 6).toUpperCase() || "TASK",
    tone: cropColors[normalized] || "from-emerald-600 to-teal-700",
  };
}

export default function CropCalendar() {
  const [events, setEvents] = useState<CropEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());

  const editingEvent = events.find((event) => event.id === editingId);

  const loadEvents = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const data = await apiFetch<CropEventApiRow[]>("/crop-events");
      setEvents(data.map(toCropEvent));
      setLastUpdated(new Date());
    } catch (error) {
      toast.error(`Failed to load crop events: ${(error as Error).message}`);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  useEffect(() => {
    const liveInterval = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(liveInterval);
  }, []);

  useEffect(() => {
    const refreshInterval = window.setInterval(() => {
      void loadEvents({ silent: true });
    }, 60000);

    return () => window.clearInterval(refreshInterval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadEvents({ silent: true });
      toast.success("Crop calendar refreshed.");
    } finally {
      setRefreshing(false);
    }
  };

  const addEvent = async (data: CropEventInput) => {
    try {
      const created = await apiFetch<CropEventApiRow>("/crop-events", {
        method: "POST",
        body: {
          title: data.title,
          crop: data.crop,
          type: data.type,
          event_date: data.date,
          notes: data.notes?.trim() || null,
        } as unknown as BodyInit,
      });

      setEvents((current) =>
        [...current, toCropEvent(created)].sort((a, b) => a.date.getTime() - b.date.getTime()),
      );
      setShowForm(false);
      setEditingId(null);
      setLastUpdated(new Date());
      toast.success("Crop event added.");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const editEvent = async (data: CropEventInput) => {
    if (!editingId) return;

    try {
      const updated = await apiFetch<CropEventApiRow>(`/crop-events/${editingId}`, {
        method: "PATCH",
        body: {
          title: data.title,
          crop: data.crop,
          type: data.type,
          event_date: data.date,
          notes: data.notes?.trim() || null,
        } as unknown as BodyInit,
      });

      setEvents((current) =>
        current
          .map((event) => (event.id === editingId ? toCropEvent(updated) : event))
          .sort((a, b) => a.date.getTime() - b.date.getTime()),
      );
      setShowForm(false);
      setEditingId(null);
      setLastUpdated(new Date());
      toast.success("Crop event updated.");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const toggleDone = async (id: string, done: boolean) => {
    try {
      const updated = await apiFetch<CropEventApiRow>(`/crop-events/${id}`, {
        method: "PATCH",
        body: { done: !done } as unknown as BodyInit,
      });

      setEvents((current) => current.map((event) => (event.id === id ? toCropEvent(updated) : event)));
      setLastUpdated(new Date());
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await apiFetch<{ success: boolean }>(`/crop-events/${id}`, {
        method: "DELETE",
      });

      setEvents((current) => current.filter((event) => event.id !== id));
      setLastUpdated(new Date());
      toast.success("Crop event deleted.");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const filteredEvents = events
    .filter((event) => (showDone ? event.done : !event.done))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfWeek = new Date(startOfToday.getTime() + 6 * 86400000);
  const overdue = events.filter((event) => !event.done && event.date < startOfToday);
  const dueToday = events.filter((event) => !event.done && event.date.toDateString() === startOfToday.toDateString());
  const dueThisWeek = events.filter((event) => !event.done && event.date >= startOfToday && event.date <= endOfWeek);
  const completed = events.filter((event) => event.done);
  const nextUpcoming =
    events
      .filter((event) => !event.done && event.date >= startOfToday)
      .sort((a, b) => a.date.getTime() - b.date.getTime())[0] || null;
  const recentCompleted = [...completed]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 3);

  const weather = useMemo(() => weatherAlerts[today.getDate() % weatherAlerts.length], [today]);

  const formatDate = (date: Date) => {
    if (Number.isNaN(date.getTime())) return "Date unavailable";
    return new Intl.DateTimeFormat("en-GB", { weekday: "short", month: "short", day: "numeric" }).format(date);
  };

  const formatRelativeTime = (value: Date | null) => {
    if (!value) return "just now";

    const diffMs = Math.max(0, nowTick - value.getTime());
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getEventDayLabel = (date: Date) => {
    if (Number.isNaN(date.getTime())) return "Date unavailable";

    const eventDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((eventDay.getTime() - startOfToday.getTime()) / 86400000);

    if (diffDays < 0) return `${Math.abs(diffDays)}d late`;
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return `In ${diffDays}d`;
    return formatDate(date);
  };

  return (
    <DashboardShell title="Crop Calendar">
      <div className="space-y-6">
        <section className="px-1 py-2">
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="font-display text-sm font-semibold uppercase tracking-[0.32em] text-emerald-700 dark:text-emerald-300">
                Farm Rhythm
              </p>
              <div>
                <h2 className="font-display text-4xl font-black leading-[1.05] text-foreground sm:text-5xl">
                  Plan every crop task with a clearer calendar
                </h2>
                <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
                  Track what is due now, what is at risk, and what is already complete with a cleaner daily view of farm work.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 backdrop-blur dark:border-white/10 dark:bg-background/60">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Today</p>
                <p className="mt-2 font-display text-3xl font-bold text-foreground">{dueToday.length}</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 backdrop-blur dark:border-white/10 dark:bg-background/60">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">This Week</p>
                <p className="mt-2 font-display text-3xl font-bold text-foreground">{dueThisWeek.length}</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 backdrop-blur dark:border-white/10 dark:bg-background/60">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Completed</p>
                <p className="mt-2 font-display text-3xl font-bold text-foreground">{completed.length}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="space-y-6">
            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[2rem] border border-border/70 bg-white/85 p-5 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)] dark:bg-card/90 dark:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.55)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Next Up</p>
                {nextUpcoming ? (
                  <>
                    <p className="mt-3 font-display text-2xl font-bold text-foreground">{nextUpcoming.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {nextUpcoming.crop} | {getEventDayLabel(nextUpcoming.date)}
                    </p>
                    <p className="mt-4 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                      {nextUpcoming.type}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-3 font-display text-2xl font-bold text-foreground">All clear</p>
                    <p className="mt-1 text-sm text-muted-foreground">No upcoming active crop task is scheduled right now.</p>
                  </>
                )}
              </div>

              <div className="rounded-[2rem] border border-border/70 bg-white/85 p-5 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)] dark:bg-card/90 dark:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.55)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Recent Activity</p>
                <div className="mt-3 space-y-3">
                  {recentCompleted.length ? (
                    recentCompleted.map((event) => (
                      <div key={event.id} className="flex items-center justify-between rounded-[1.25rem] bg-muted/35 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{event.title}</p>
                          <p className="text-xs text-muted-foreground">{event.crop}</p>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                          Done
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[1.25rem] border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                      Completed tasks will appear here.
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-border/70 bg-white/85 p-6 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)] dark:bg-card/90 dark:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.55)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-primary">
                    <CalendarDays className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground">Activity Planner</h3>
                    <p className="text-sm text-muted-foreground">Manage field work, care cycles, and harvest timing.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => setShowForm(true)} className="rounded-xl">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Event
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void handleRefresh()}
                    disabled={refreshing}
                    className="rounded-xl"
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                  <Button variant="outline" onClick={() => setShowDone((current) => !current)} className="rounded-xl">
                    <Filter className="mr-2 h-4 w-4" />
                    {showDone ? "Show Active" : "Show Completed"}
                  </Button>
                </div>
              </div>

              {showForm && (
                <div className="mt-6 rounded-[1.5rem] border border-border bg-muted/30 p-4">
                  <h4 className="mb-4 font-display text-lg font-bold text-foreground">
                    {editingId ? "Edit Event" : "New Crop Event"}
                  </h4>
                  <CropEventForm
                    onSubmit={editingId ? editEvent : addEvent}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingId(null);
                    }}
                    defaultValues={
                      editingId
                        ? {
                            title: editingEvent?.title,
                            type: editingEvent?.type,
                            date:
                              editingEvent && !Number.isNaN(editingEvent.date.getTime())
                                ? editingEvent.date.toISOString().split("T")[0]
                                : "",
                            crop: editingEvent?.crop,
                            notes: editingEvent?.notes || "",
                          }
                        : {}
                    }
                  />
                </div>
              )}

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                    <p className="font-semibold text-amber-950 dark:text-amber-100">Overdue tasks</p>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-amber-900 dark:text-amber-100">{overdue.length}</p>
                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-200/85">
                    Review these first so they do not affect yield quality.
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-sky-200 bg-sky-50/80 p-4 dark:border-sky-500/30 dark:bg-sky-500/10">
                  <div className="flex items-center gap-2">
                    <CloudSun className="h-5 w-5 text-sky-600 dark:text-sky-300" />
                    <p className="font-semibold text-sky-950 dark:text-sky-100">Weather note</p>
                  </div>
                  <p className="mt-2 text-lg font-bold text-sky-950 dark:text-sky-100">
                    {weather.icon} {weather.condition}
                  </p>
                  <p className="mt-1 text-sm text-sky-700 dark:text-sky-200/85">{weather.recommendation}</p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-border/70 bg-white/85 p-6 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)] dark:bg-card/90 dark:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.55)]">
              <h3 className="font-display text-xl font-bold text-foreground">This Week at a Glance</h3>
              <div className="mt-4 space-y-3">
                {loading ? (
                  <div className="rounded-[1.25rem] border border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                    Loading live tasks...
                  </div>
                ) : dueThisWeek.length ? (
                  dueThisWeek.map((event) => (
                    <div key={event.id} className="flex items-center justify-between rounded-[1.25rem] bg-muted/40 px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">{event.title}</p>
                        <p className="text-sm text-muted-foreground">{event.crop} | {formatDate(event.date)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-muted-foreground capitalize dark:bg-background/70">
                          {event.type}
                        </span>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          {getEventDayLabel(event.date)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.25rem] border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                    Nothing scheduled this week yet.
                  </div>
                )}
              </div>
            </section>
          </div>

          <section className="space-y-4">
            {loading ? (
              <div className="rounded-[2rem] border border-border bg-white/75 py-16 text-center text-sm text-muted-foreground shadow-sm dark:bg-card/80">
                Loading your live crop calendar...
              </div>
            ) : (
              filteredEvents.map((event, index) => (
                (() => {
                  const activityBadge = getActivityBadge(event.type);

                  return (
                    <motion.article
                      key={event.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="group rounded-[1.6rem] border border-border/70 bg-white/85 p-4 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)] dark:bg-card/90 dark:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.55)]"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                        <button
                          onClick={() => void toggleDone(event.id, event.done)}
                          className={`mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[1.15rem] border-2 transition-all ${
                            event.done
                              ? "border-emerald-500 bg-emerald-500 text-white shadow-lg"
                              : "border-border bg-white text-muted-foreground hover:border-emerald-400 hover:text-emerald-700 dark:bg-background/70 dark:hover:text-emerald-300"
                          }`}
                        >
                          {event.done ? <CheckCircle2 className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
                        </button>

                        <div
                          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[1.1rem] bg-gradient-to-br ${activityBadge.tone} px-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white shadow-md`}
                        >
                          {activityBadge.label}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 flex-1">
                              <h4 className={`font-display text-lg font-bold leading-tight ${event.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                                {event.title}
                              </h4>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {event.crop} | {formatDate(event.date)}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 lg:max-w-[45%] lg:justify-end">
                              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold capitalize text-muted-foreground">
                                {event.type}
                              </span>
                              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                {getEventDayLabel(event.date)}
                              </span>
                              {event.date < startOfToday && !event.done && (
                                <Badge className="border-orange-200 bg-orange-100 text-orange-800">Overdue</Badge>
                              )}
                            </div>
                          </div>

                          {event.notes && (
                            <div className="mt-3 rounded-[1rem] border border-border/60 bg-muted/25 px-3 py-2.5">
                              <p className="text-sm leading-5 text-muted-foreground">
                                {event.notes}
                              </p>
                            </div>
                          )}

                          <div className="mt-3 flex flex-col gap-3 border-t border-border/60 pt-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-xs font-medium text-muted-foreground">
                              {event.done ? "Marked complete" : "Active task"}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                className="h-9 rounded-xl px-4"
                                onClick={() => {
                                  setEditingId(event.id);
                                  setShowForm(true);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                className="h-9 rounded-xl px-4 text-destructive"
                                onClick={() => void deleteEvent(event.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })()
              ))
            )}

            {!loading && !filteredEvents.length && (
              <div className="rounded-[2rem] border border-dashed border-border bg-white/75 py-16 text-center shadow-sm dark:bg-card/80">
                <CalendarDays className="mx-auto mb-4 h-14 w-14 text-muted-foreground" />
                <h3 className="font-display text-xl font-bold text-foreground">No events in this view</h3>
                <p className="mt-2 text-sm text-muted-foreground">Switch filters or create a new crop activity to get started.</p>
                <Button onClick={() => setShowForm(true)} className="mt-4 rounded-xl">
                  Create Event
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
