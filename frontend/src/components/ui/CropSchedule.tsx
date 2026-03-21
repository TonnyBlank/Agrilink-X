import { CalendarDays } from "lucide-react";

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

export const CropSchedule = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-green-100 p-2 dark:bg-green-500/15">
          <CalendarDays className="text-green-600 dark:text-green-300" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Kenya Crop Calendar 2025</h2>
          <p className="text-sm text-muted-foreground">Regional planting and harvest schedules</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {CALENDAR_DATA.map((item) => (
          <div key={item.month} className={`rounded-2xl border p-6 shadow-sm transition-shadow hover:shadow-md ${item.color}`}>
            <div className="flex items-start gap-4">
              <div className="mt-2 h-3 w-3 rounded-full bg-current opacity-80" />
              <div className="flex-1">
                <h3 className={`text-lg font-bold ${item.textColor}`}>{item.month}</h3>
                <p className={`mt-1 text-sm ${item.textColor}`}>{item.crop}</p>
                <p className="mt-2 text-muted-foreground">{item.activity}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
