import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VaccinationsManagementProps {
  onUpdate: () => void;
}

const VaccinationsManagement = ({ onUpdate }: VaccinationsManagementProps) => {
  const [vaccinations, setVaccinations] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingVaccination, setEditingVaccination] = useState<any>(null);
  const [formData, setFormData] = useState({
    patient_id: "",
    date: "",
    vaccine_type: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: vaxData } = await supabase
      .from("vaccinations")
      .select(`
        *,
        patients (name)
      `)
      .order("date", { ascending: false });

    setVaccinations(vaxData || []);

    const { data: patientsData } = await supabase
      .from("patients")
      .select("id, name")
      .order("name");
    setPatients(patientsData || []);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (editingVaccination) {
      const { error } = await supabase
        .from("vaccinations")
        .update(formData)
        .eq("id", editingVaccination.id);

      if (error) {
        toast.error("Failed to update vaccination");
        return;
      }

      toast.success("Vaccination updated successfully");
    } else {
      const { error } = await supabase.from("vaccinations").insert([formData]);

      if (error) {
        toast.error("Failed to create vaccination");
        return;
      }

      toast.success("Vaccination created successfully");
    }

    setIsOpen(false);
    setEditingVaccination(null);
    resetForm();
    loadData();
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vaccination record?")) return;

    const { error } = await supabase.from("vaccinations").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete vaccination");
      return;
    }

    toast.success("Vaccination deleted successfully");
    loadData();
    onUpdate();
  };

  const resetForm = () => {
    setFormData({
      patient_id: "",
      date: "",
      vaccine_type: "",
    });
  };

  const openDialog = (vaccination: any = null) => {
    if (vaccination) {
      setEditingVaccination(vaccination);
      setFormData({
        patient_id: vaccination.patient_id,
        date: vaccination.date,
        vaccine_type: vaccination.vaccine_type,
      });
    } else {
      setEditingVaccination(null);
      resetForm();
    }
    setIsOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Vaccination Records</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Vaccination
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingVaccination ? "Edit Vaccination" : "Add New Vaccination"}
              </DialogTitle>
              <DialogDescription>
                Enter the vaccination details
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Patient</Label>
                <Select
                  value={formData.patient_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, patient_id: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Vaccination Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vaccine_type">Vaccine Type</Label>
                <Input
                  id="vaccine_type"
                  value={formData.vaccine_type}
                  onChange={(e) =>
                    setFormData({ ...formData, vaccine_type: e.target.value })
                  }
                  placeholder="e.g., Covishield, Covaxin, Pfizer"
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                {editingVaccination ? "Update" : "Create"} Vaccination
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Vaccine Type</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vaccinations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No vaccination records found
                </TableCell>
              </TableRow>
            ) : (
              vaccinations.map((vax) => (
                <TableRow key={vax.id}>
                  <TableCell>{vax.patients?.name}</TableCell>
                  <TableCell>
                    {new Date(vax.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{vax.vaccine_type}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog(vax)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(vax.id)}
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
    </div>
  );
};

export default VaccinationsManagement;
