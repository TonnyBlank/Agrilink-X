import { Bell, CalendarDays, Check, CloudSun, Cloudy, Droplets, Sun, Umbrella } from "lucide-react";

const CALENDAR_DATA = [
  {
    month: "March",
    crop: "Maize",
    activity: "Planting Season",
    color: "border-green-200 bg-green-50 dark:border-green-500/30 dark:bg-green-500/10",
    textColor: "text-green-700 dark:text-green-300",
  },
  {
    month: "June",
    crop: "Avocado",
    activity: "First Harvest",
    color: "border-fuchsia-200 bg-fuchsia-50 dark:border-fuchsia-500/30 dark:bg-fuchsia-500/10",
    textColor: "text-fuchsia-700 dark:text-fuchsia-300",
  },
  {
    month: "July",
    crop: "Coffee",
    activity: "Picking Season",
    color: "border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10",
    textColor: "text-amber-700 dark:text-amber-300",
  },
  {
    month: "October",
    crop: "Tomatoes",
    activity: "Planting Season",
    color: "border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10",
    textColor: "text-rose-700 dark:text-rose-300",
  },
  {
    month: "December",
    crop: "Sugarcane",
    activity: "Cutting Season",
    color: "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10",
    textColor: "text-emerald-700 dark:text-emerald-300",
  },
];

const WEATHER = [
  { day: "Mon", icon: Sun, temp: "28C", rain: "5%" },
  { day: "Tue", icon: CloudSun, temp: "24C", rain: "20%" },
  { day: "Wed", icon: Umbrella, temp: "19C", rain: "85%" },
  { day: "Thu", icon: Droplets, temp: "22C", rain: "40%" },
  { day: "Fri", icon: Sun, temp: "27C", rain: "8%" },
  { day: "Sat", icon: Sun, temp: "29C", rain: "3%" },
  { day: "Sun", icon: Cloudy, temp: "25C", rain: "15%" },
];

const REMINDERS = [
  { text: "Apply fertilizer to maize", due: "Today", done: false },
  { text: "Check irrigation system", due: "Tomorrow", done: true },
  { text: "Avocado spray for pests", due: "March 20", done: false },
  { text: "Submit coffee to cooperative", due: "March 25", done: false },
];

export const CropCalendar = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-green-100 p-2 dark:bg-green-500/15">
          <CalendarDays className="text-green-600 dark:text-green-300" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Crop Calendar & Weather</h2>
          <p className="text-sm text-muted-foreground">Planting and harvest reminders with local weather alerts</p>
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 p-5 text-white shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <CloudSun size={22} />
          <h3 className="font-bold text-lg">Nakuru - This Week</h3>
          <span className="ml-auto text-sm text-sky-100/90">Updated hourly</span>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {WEATHER.map((weather) => {
            const Icon = weather.icon;
            return (
              <div key={weather.day} className="rounded-xl bg-white/10 px-1 py-3 text-center backdrop-blur-sm">
                <p className="text-xs font-semibold text-sky-100">{weather.day}</p>
                <Icon className="mx-auto my-2 h-6 w-6" />
                <p className="text-sm font-bold">{weather.temp}</p>
                <p className="text-xs text-sky-100">{weather.rain} rain</p>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-sky-50">Heavy rains expected Wednesday. Delay spraying until conditions improve.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 font-bold text-foreground">2025 Crop Calendar - Kenya</h3>
          <div className="space-y-3">
            {CALENDAR_DATA.map((crop) => (
              <div key={crop.month} className={`flex items-center gap-3 rounded-xl border p-3 ${crop.color}`}>
                <div className="h-3 w-3 rounded-full bg-current opacity-80" />
                <div>
                  <p className={`text-sm font-bold ${crop.textColor}`}>
                    {crop.month} - {crop.crop}
                  </p>
                  <p className="text-xs text-muted-foreground">{crop.activity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Bell size={18} className="text-orange-500 dark:text-orange-300" />
            <h3 className="font-bold text-foreground">Upcoming Reminders</h3>
          </div>
          <div className="space-y-3">
            {REMINDERS.map((reminder, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 rounded-xl p-3 ${
                  reminder.done
                    ? "bg-muted/60 opacity-70"
                    : "border border-orange-100 bg-orange-50 dark:border-orange-500/25 dark:bg-orange-500/10"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                    reminder.done ? "border-green-500 bg-green-500" : "border-orange-300 dark:border-orange-400/60"
                  }`}
                >
                  {reminder.done ? <Check size={12} className="text-white" /> : null}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${reminder.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {reminder.text}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Due: {reminder.due}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
