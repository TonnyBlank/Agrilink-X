import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CropType } from "@/types/crop";
import { toast } from "sonner";

interface CropEventFormProps {
  onSubmit: (event: { title: string; type: CropType; date: string; crop: string; notes?: string }) => void;
  onCancel: () => void;
  defaultValues?: Partial<{ title: string; type: CropType; date: string; crop: string; notes: string }>;
}

const CROPS = ["Maize", "Tomatoes", "Avocado", "Coffee", "Sukuma Wiki", "Sugarcane", "Wheat"];
const ACTIVITY_TYPES = ["Planting", "Fertilizing", "Spraying", "Harvesting", "Irrigation", "Pruning"];

export function CropEventForm({ onSubmit, onCancel, defaultValues = {} }: CropEventFormProps) {
  const [formData, setFormData] = useState({
    title: defaultValues.title || "",
    type: defaultValues.type || "",
    date: defaultValues.date || "",
    crop: defaultValues.crop || "",
    notes: defaultValues.notes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanedType = formData.type.trim();
    const cleanedCrop = formData.crop.trim();

    if (!cleanedType) {
      toast.error("Activity type is required.");
      return;
    }

    if (cleanedType.length > 20) {
      toast.error("Activity type must be 20 characters or less.");
      return;
    }

    if (!cleanedCrop) {
      toast.error("Crop is required.");
      return;
    }

    onSubmit({
      ...formData,
      crop: cleanedCrop,
      type: cleanedType as CropType,
      notes: formData.notes.trim() || undefined,
    });
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
          <Input
            id="crop"
            list="crop-options"
            value={formData.crop}
            onChange={(e) => setFormData({ ...formData, crop: e.target.value })}
            placeholder="Type or choose crop"
            required
            className="rounded-xl"
          />
          <datalist id="crop-options">
            {CROPS.map((crop) => (
              <option key={crop} value={crop} />
            ))}
          </datalist>
        </div>

        <div>
          <Label htmlFor="type">Activity Type</Label>
          <Input
            id="type"
            list="activity-type-options"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as CropType })}
            placeholder="Type activity type"
            maxLength={20}
            required
            className="rounded-xl"
          />
          <datalist id="activity-type-options">
            {ACTIVITY_TYPES.map((activity) => (
              <option key={activity} value={activity} />
            ))}
          </datalist>
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
