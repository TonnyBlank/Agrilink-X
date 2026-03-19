import { CalendarDays, CloudSun, Bell, Check } from 'lucide-react';

const CALENDAR_DATA = [
  { month: 'March', crop: 'Maize', activity: 'Planting Season', emoji: '🌽', color: 'bg-green-50 border-green-200', textColor: 'text-green-700' },
  { month: 'June', crop: 'Avocado', activity: 'First Harvest', emoji: '🥑', color: 'bg-purple-50 border-purple-200', textColor: 'text-purple-700' },
  { month: 'July', crop: 'Coffee', activity: 'Picking Season', emoji: '☕', color: 'bg-amber-50 border-amber-200', textColor: 'text-amber-700' },
  { month: 'October', crop: 'Tomatoes', activity: 'Planting Season', emoji: '🍅', color: 'bg-red-50 border-red-200', textColor: 'text-red-700' },
  { month: 'December', crop: 'Sugarcane', activity: 'Cutting Season', emoji: '🌿', color: 'bg-emerald-50 border-emerald-200', textColor: 'text-emerald-700' },
];

const WEATHER = [
  { day: 'Mon', icon: '☀️', temp: '28°C', rain: '5%' },
  { day: 'Tue', icon: '⛅', temp: '24°C', rain: '20%' },
  { day: 'Wed', icon: '🌧️', temp: '19°C', rain: '85%' },
  { day: 'Thu', icon: '🌦️', temp: '22°C', rain: '40%' },
  { day: 'Fri', icon: '☀️', temp: '27°C', rain: '8%' },
  { day: 'Sat', icon: '☀️', temp: '29°C', rain: '3%' },
  { day: 'Sun', icon: '⛅', temp: '25°C', rain: '15%' },
];

const REMINDERS = [
  { text: 'Apply fertilizer to maize', due: 'Today', done: false },
  { text: 'Check irrigation system', due: 'Tomorrow', done: true },
  { text: 'Avocado spray for pests', due: 'March 20', done: false },
  { text: 'Submit coffee to cooperative', due: 'March 25', done: false },
];

export const CropCalendar = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 rounded-xl"><CalendarDays className="text-green-600" size={24} /></div>
        <div><h2 className="text-2xl font-bold text-gray-900">Crop Calendar & Weather</h2><p className="text-sm text-gray-500">Planting/harvest reminders + local weather alerts</p></div>
      </div>

      <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 mb-4">
          <CloudSun size={22} /><h3 className="font-bold text-lg">Nakuru – This Week</h3>
          <span className="ml-auto text-sky-200 text-sm">Updated hourly</span>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {WEATHER.map(w => (
            <div key={w.day} className="text-center bg-white/10 rounded-xl py-3 px-1">
              <p className="text-sky-200 text-xs font-semibold">{w.day}</p>
              <p className="text-2xl my-1">{w.icon}</p>
              <p className="text-sm font-bold">{w.temp}</p>
              <p className="text-sky-200 text-xs">💧{w.rain}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sky-100 text-sm">⚠️ Heavy rains Wednesday – delay spraying Tuesday.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-4">2025 Crop Calendar – Kenya</h3>
          <div className="space-y-3">
            {CALENDAR_DATA.map(c => (
              <div key={c.month} className={`flex items-center gap-3 p-3 rounded-xl border ${c.color}`}>
                <span className="text-2xl">{c.emoji}</span>
                <div>
                  <p className={`font-bold text-sm ${c.textColor}`}>{c.month} – {c.crop}</p>
                  <p className="text-xs text-gray-500">{c.activity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={18} className="text-orange-500" />
            <h3 className="font-bold text-gray-900">Upcoming Reminders</h3>
          </div>
          <div className="space-y-3">
            {REMINDERS.map((r, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${r.done ? 'bg-gray-50 opacity-60' : 'bg-orange-50 border border-orange-100'}`}>
                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${r.done ? 'bg-green-500 border-green-500' : 'border-orange-300'}`}>
                  {r.done && <Check size={12} className="text-white" />}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${r.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{r.text}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Due: {r.due}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
