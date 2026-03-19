import { CalendarDays, CloudSun, Bell } from 'lucide-react';

const CALENDAR_DATA = [
  { month: 'March', crop: 'Maize', activity: 'Planting Season', emoji: '🌽', color: 'bg-green-50 border-green-200', textColor: 'text-green-700' },
  { month: 'June', crop: 'Avocado', activity: 'First Harvest', emoji: '🥑', color: 'bg-purple-50 border-purple-200', textColor: 'text-purple-700' },
  { month: 'July', crop: 'Coffee', activity: 'Picking Season', emoji: '☕', color: 'bg-amber-50 border-amber-200', textColor: 'text-amber-700' },
  { month: 'October', crop: 'Tomatoes', activity: 'Planting Season', emoji: '🍅', color: 'bg-red-50 border-red-200', textColor: 'text-red-700' },
  { month: 'December', crop: 'Sugarcane', activity: 'Cutting Season', emoji: '🌿', color: 'bg-emerald-50 border-emerald-200', textColor: 'text-emerald-700' },
];

export const CropSchedule = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 rounded-xl">
          <CalendarDays className="text-green-600" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kenya Crop Calendar 2025</h2>
          <p className="text-sm text-gray-500">Regional planting and harvest schedules</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CALENDAR_DATA.map((item) => (
          <div key={item.month} className={`p-6 rounded-2xl border ${item.color} shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex items-start gap-4">
              <span className="text-3xl mt-1">{item.emoji}</span>
              <div className="flex-1">
                <h3 className={`font-bold text-lg ${item.textColor}`}>{item.month}</h3>
                <p className={`text-sm ${item.textColor} mt-1`}>{item.crop}</p>
                <p className="text-gray-600 mt-2">{item.activity}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

