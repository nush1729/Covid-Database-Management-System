import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const StateStatsManagement = () => {
  const [stateStats, setStateStats] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingStats, setEditingStats] = useState<any>(null);

  useEffect(() => {
    loadStateStats();
  }, []);

  const loadStateStats = async () => {
    const { data, error } = await supabase
      .from("state_stats")
      .select("*")
      .order("state");

    if (error) {
      toast.error("Failed to load state statistics");
      return;
    }

    setStateStats(data || []);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const statsData = {
      state: formData.get("state") as string,
      confirmed: parseInt(formData.get("confirmed") as string),
      recovered: parseInt(formData.get("recovered") as string),
      active: parseInt(formData.get("active") as string),
      deaths: parseInt(formData.get("deaths") as string),
    };

    if (editingStats) {
      const { error } = await supabase
        .from("state_stats")
        .update(statsData)
        .eq("id", editingStats.id);

      if (error) {
        toast.error("Failed to update state stats");
        return;
      }

      toast.success("State stats updated successfully");
    } else {
      const { error } = await supabase.from("state_stats").insert([statsData]);

      if (error) {
        toast.error("Failed to create state stats");
        return;
      }

      toast.success("State stats created successfully");
    }

    setIsOpen(false);
    setEditingStats(null);
    loadStateStats();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete these state statistics?")) return;

    const { error } = await supabase.from("state_stats").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete state stats");
      return;
    }

    toast.success("State stats deleted successfully");
    loadStateStats();
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split("\n");
        const headers = lines[0].split(",").map(h => h.trim());

        const records = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(",");
          records.push({
            state: values[0]?.trim(),
            confirmed: parseInt(values[1]?.trim()) || 0,
            recovered: parseInt(values[2]?.trim()) || 0,
            active: parseInt(values[3]?.trim()) || 0,
            deaths: parseInt(values[4]?.trim()) || 0,
          });
        }

        if (records.length > 0) {
          const { error } = await supabase.from("state_stats").insert(records);

          if (error) {
            toast.error("Failed to upload CSV data");
            return;
          }

          toast.success(`Successfully imported ${records.length} records`);
          loadStateStats();
        }
      } catch (error) {
        toast.error("Failed to parse CSV file");
      }
    };

    reader.readAsText(file);
    e.target.value = "";
  };

  const openDialog = (stats: any = null) => {
    setEditingStats(stats);
    setIsOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">State Statistics</h3>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <label>
              <Upload className="w-4 h-4 mr-2" />
              Upload CSV
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleCSVUpload}
              />
            </label>
          </Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add State Stats
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingStats ? "Edit State Stats" : "Add State Statistics"}
                </DialogTitle>
                <DialogDescription>
                  Enter the state-wise COVID statistics
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    defaultValue={editingStats?.state}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="confirmed">Confirmed</Label>
                    <Input
                      id="confirmed"
                      name="confirmed"
                      type="number"
                      defaultValue={editingStats?.confirmed || 0}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recovered">Recovered</Label>
                    <Input
                      id="recovered"
                      name="recovered"
                      type="number"
                      defaultValue={editingStats?.recovered || 0}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="active">Active</Label>
                    <Input
                      id="active"
                      name="active"
                      type="number"
                      defaultValue={editingStats?.active || 0}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deaths">Deaths</Label>
                    <Input
                      id="deaths"
                      name="deaths"
                      type="number"
                      defaultValue={editingStats?.deaths || 0}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  {editingStats ? "Update" : "Create"} Stats
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>State</TableHead>
              <TableHead>Confirmed</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Recovered</TableHead>
              <TableHead>Deaths</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stateStats.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No state statistics found
                </TableCell>
              </TableRow>
            ) : (
              stateStats.map((stats) => (
                <TableRow key={stats.id}>
                  <TableCell className="font-semibold">{stats.state}</TableCell>
                  <TableCell>{stats.confirmed.toLocaleString()}</TableCell>
                  <TableCell className="text-warning">{stats.active.toLocaleString()}</TableCell>
                  <TableCell className="text-secondary">{stats.recovered.toLocaleString()}</TableCell>
                  <TableCell className="text-destructive">{stats.deaths.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog(stats)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(stats.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        CSV Format: state, confirmed, recovered, active, deaths
      </p>
    </div>
  );
};

export default StateStatsManagement;
