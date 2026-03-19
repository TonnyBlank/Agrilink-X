import DashboardShell from "@/components/dashboard/DashboardShell";
import { motion } from "framer-motion";
import { AlertCircle, CalendarDays, CheckCircle2, Clock3, CloudSun, Filter, Plus, Sprout, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { CropEvent, CropType } from "@/types/crop";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { CropEventForm } from "@/components/dashboard/CropEventForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const cropIcons: Record<CropType, string> = {
  planting: "🌱",
  fertilizing: "💧",
  spraying: "🐛",
  harvesting: "✂",
  irrigation: "💦",
  pruning: "🌿",
};

const cropColors: Record<CropType, string> = {
  planting: "from-emerald-500 to-green-600",
  fertilizing: "from-sky-500 to-blue-600",
  spraying: "from-amber-500 to-orange-600",
  harvesting: "from-violet-500 to-fuchsia-600",
  irrigation: "from-cyan-500 to-sky-600",
  pruning: "from-lime-500 to-emerald-600",
};

const initialEvents: CropEvent[] = [
  { id: 1, title: "Plant sukuma wiki seedlings", type: "planting", date: new Date(), crop: "Sukuma Wiki", done: false, notes: "Prepare raised beds before transplanting." },
  { id: 2, title: "Apply NPK fertilizer - Field A", type: "fertilizing", date: new Date(Date.now() + 86400000), crop: "Tomatoes", done: false, notes: "Target the eastern rows after irrigation." },
  { id: 3, title: "Spray for aphids", type: "spraying", date: new Date(Date.now() + 3 * 86400000), crop: "Maize", done: false },
];

const weatherAlerts = [
  { condition: "Heavy rain expected", recommendation: "Delay spraying until leaf surfaces are dry.", icon: "🌧" },
  { condition: "Clear and sunny", recommendation: "Good window for planting and harvesting activity.", icon: "☀" },
  { condition: "Mild temperatures", recommendation: "Strong conditions for fertilizing and pruning.", icon: "⛅" },
];

export default function CropCalendar() {
  const [storedEvents, setEvents] = useLocalStorage<CropEvent[]>("cropEvents", initialEvents);
  const events = storedEvents.map((event) => ({ ...event, date: new Date(event.date) }));
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showDone, setShowDone] = useState(false);

  const editingEvent = events.find((event) => event.id === editingId);

  const addEvent = (data: { title: string; type: CropType; date: string; crop: string; notes?: string }) => {
    const newEvent: CropEvent = {
      id: Date.now(),
      title: data.title,
      type: data.type,
      date: new Date(data.date),
      crop: data.crop,
      done: false,
      ...(data.notes && { notes: data.notes }),
    };
    setEvents([...events, newEvent]);
    setShowForm(false);
    setEditingId(null);
  };

  const editEvent = (data: { title: string; type: CropType; date: string; crop: string; notes?: string }) => {
    setEvents(events.map((event) => (event.id === editingId ? { ...event, ...data, date: new Date(data.date) } : event)));
    setShowForm(false);
    setEditingId(null);
  };

  const toggleDone = (id: number) => {
    setEvents(events.map((event) => (event.id === id ? { ...event, done: !event.done } : event)));
  };

  const deleteEvent = (id: number) => {
    setEvents(events.filter((event) => event.id !== id));
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

  const weather = useMemo(() => weatherAlerts[today.getDate() % weatherAlerts.length], [today]);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-GB", { weekday: "short", month: "short", day: "numeric" }).format(date);

  return (
    <DashboardShell title="Crop Calendar">
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-emerald-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),_transparent_25%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,253,250,0.88))] p-6 shadow-[0_20px_60px_-28px_rgba(5,150,105,0.35)]">
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                <Sprout className="h-3.5 w-3.5" />
                Farm Rhythm
              </span>
              <div>
                <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">Plan every crop task with a clearer calendar</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Track what is due now, what is at risk, and what is already complete without losing the day-to-day rhythm of the farm.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Today</p>
                <p className="mt-2 font-display text-3xl font-bold text-foreground">{dueToday.length}</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">This Week</p>
                <p className="mt-2 font-display text-3xl font-bold text-foreground">{dueThisWeek.length}</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Completed</p>
                <p className="mt-2 font-display text-3xl font-bold text-foreground">{completed.length}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-border/70 bg-white/85 p-6 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)]">
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
                  <Button variant="outline" onClick={() => setShowDone((current) => !current)} className="rounded-xl">
                    <Filter className="mr-2 h-4 w-4" />
                    {showDone ? "Show Active" : "Show Completed"}
                  </Button>
                </div>
              </div>

              {showForm && (
                <div className="mt-6 rounded-[1.5rem] border border-border bg-muted/30 p-4">
                  <h4 className="mb-4 font-display text-lg font-bold text-foreground">{editingId ? "Edit Event" : "New Crop Event"}</h4>
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
                            date: editingEvent?.date.toISOString().split("T")[0],
                            crop: editingEvent?.crop,
                            notes: editingEvent?.notes || "",
                          }
                        : {}
                    }
                  />
                </div>
              )}

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/80 p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <p className="font-semibold text-amber-950">Overdue tasks</p>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-amber-900">{overdue.length}</p>
                  <p className="mt-1 text-sm text-amber-700">Review these first so they do not affect yield quality.</p>
                </div>
                <div className="rounded-[1.5rem] border border-sky-200 bg-sky-50/80 p-4">
                  <div className="flex items-center gap-2">
                    <CloudSun className="h-5 w-5 text-sky-600" />
                    <p className="font-semibold text-sky-950">Weather note</p>
                  </div>
                  <p className="mt-2 text-lg font-bold text-sky-950">{weather.icon} {weather.condition}</p>
                  <p className="mt-1 text-sm text-sky-700">{weather.recommendation}</p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-border/70 bg-white/85 p-6 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)]">
              <h3 className="font-display text-xl font-bold text-foreground">This Week at a Glance</h3>
              <div className="mt-4 space-y-3">
                {dueThisWeek.length ? (
                  dueThisWeek.map((event) => (
                    <div key={event.id} className="flex items-center justify-between rounded-[1.25rem] bg-muted/40 px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">{event.title}</p>
                        <p className="text-sm text-muted-foreground">{event.crop} • {formatDate(event.date)}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-muted-foreground">{event.type}</span>
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
            {filteredEvents.map((event, index) => (
              <motion.article
                key={event.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="group rounded-[2rem] border border-border/70 bg-white/85 p-5 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <button
                    onClick={() => toggleDone(event.id)}
                    className={`mt-1 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border-2 transition-all ${
                      event.done
                        ? "border-emerald-500 bg-emerald-500 text-white shadow-lg"
                        : "border-border bg-white text-muted-foreground hover:border-emerald-400 hover:text-emerald-700"
                    }`}
                  >
                    {event.done ? <CheckCircle2 className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
                  </button>

                  <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[1.25rem] bg-gradient-to-br ${cropColors[event.type]} text-2xl text-white shadow-md`}>
                    {cropIcons[event.type]}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h4 className={`font-display text-xl font-bold ${event.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                          {event.title}
                        </h4>
                        <p className="mt-1 text-sm text-muted-foreground">{event.crop} • {formatDate(event.date)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold capitalize text-muted-foreground">{event.type}</span>
                        {event.date < startOfToday && !event.done && (
                          <Badge className="border-orange-200 bg-orange-100 text-orange-800">Overdue</Badge>
                        )}
                      </div>
                    </div>

                    {event.notes && (
                      <p className="mt-4 rounded-[1.25rem] bg-muted/40 px-4 py-3 text-sm leading-6 text-muted-foreground">
                        {event.notes}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => {
                          setEditingId(event.id);
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-xl text-destructive"
                        onClick={() => deleteEvent(event.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}

            {!filteredEvents.length && (
              <div className="rounded-[2rem] border border-dashed border-border bg-white/75 py-16 text-center shadow-sm">
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
