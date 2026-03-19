import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CropType } from "@/types/crop";

interface CropEventFormProps {
  onSubmit: (event: { title: string; type: CropType; date: string; crop: string; notes?: string }) => void;
  onCancel: () => void;
  defaultValues?: Partial<{ title: string; type: CropType; date: string; crop: string; notes: string }>;
}

const CROPS = ["Maize", "Tomatoes", "Avocado", "Coffee", "Sukuma Wiki", "Sugarcane", "Wheat"];

export function CropEventForm({ onSubmit, onCancel, defaultValues = {} }: CropEventFormProps) {
  const [formData, setFormData] = useState({
    title: defaultValues.title || "",
    type: defaultValues.type || ("planting" as CropType),
    date: defaultValues.date || "",
    crop: defaultValues.crop || "",
    notes: defaultValues.notes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-1">
      <div>
        <Label htmlFor="title">Event Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g. Plant maize seedlings"
          required
          className="rounded-xl"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="crop">Crop</Label>
          <Select value={formData.crop} onValueChange={(value) => setFormData({ ...formData, crop: value })}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select crop" />
            </SelectTrigger>
            <SelectContent>
              {CROPS.map((crop) => (
                <SelectItem key={crop} value={crop}>
                  {crop}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="type">Activity Type</Label>
          <Select value={formData.type} onValueChange={(value: CropType) => setFormData({ ...formData, type: value })}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planting">🌱 Planting</SelectItem>
              <SelectItem value="fertilizing">💧 Fertilizing</SelectItem>
              <SelectItem value="spraying">🐛 Spraying</SelectItem>
              <SelectItem value="harvesting">✂ Harvesting</SelectItem>
              <SelectItem value="irrigation">💦 Irrigation</SelectItem>
              <SelectItem value="pruning">🌿 Pruning</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="date">Scheduled Date</Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
          className="rounded-xl"
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Weather notes, field location, reminders..."
          className="resize-none rounded-xl"
        />
      </div>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} className="h-10 rounded-xl">
          Cancel
        </Button>
        <Button type="submit" className="h-10 rounded-xl">
          {defaultValues.title ? "Update" : "Add Event"}
        </Button>
      </div>
    </form>
  );
}
