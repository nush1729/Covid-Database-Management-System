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

interface CaseRecordsManagementProps {
  onUpdate: () => void;
}

const CaseRecordsManagement = ({ onUpdate }: CaseRecordsManagementProps) => {
  const [caseRecords, setCaseRecords] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [formData, setFormData] = useState({
    patient_id: "",
    location_id: "",
    diag_date: "",
    status: "active",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: records } = await supabase
      .from("case_records")
      .select(`
        *,
        patients (name),
        locations (name, state)
      `)
      .order("diag_date", { ascending: false });

    setCaseRecords(records || []);

    const { data: patientsData } = await supabase
      .from("patients")
      .select("id, name")
      .order("name");
    setPatients(patientsData || []);

    const { data: locationsData } = await supabase
      .from("locations")
      .select("id, name, state")
      .order("name");
    setLocations(locationsData || []);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (editingRecord) {
      const { error } = await supabase
        .from("case_records")
        .update(formData)
        .eq("id", editingRecord.id);

      if (error) {
        toast.error("Failed to update case record");
        return;
      }

      toast.success("Case record updated successfully");
    } else {
      const { error } = await supabase.from("case_records").insert([formData]);

      if (error) {
        toast.error("Failed to create case record");
        return;
      }

      toast.success("Case record created successfully");
    }

    setIsOpen(false);
    setEditingRecord(null);
    resetForm();
    loadData();
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this case record?")) return;

    const { error } = await supabase.from("case_records").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete case record");
      return;
    }

    toast.success("Case record deleted successfully");
    loadData();
    onUpdate();
  };

  const resetForm = () => {
    setFormData({
      patient_id: "",
      location_id: "",
      diag_date: "",
      status: "active",
    });
  };

  const openDialog = (record: any = null) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        patient_id: record.patient_id,
        location_id: record.location_id,
        diag_date: record.diag_date,
        status: record.status,
      });
    } else {
      setEditingRecord(null);
      resetForm();
    }
    setIsOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-warning";
      case "recovered":
        return "text-secondary";
      case "death":
        return "text-destructive";
      default:
        return "";
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Case Records</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Case Record
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRecord ? "Edit Case Record" : "Add New Case Record"}
              </DialogTitle>
              <DialogDescription>
                Enter the case record details
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
                <Label>Location</Label>
                <Select
                  value={formData.location_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, location_id: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}, {location.state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="diag_date">Diagnosis Date</Label>
                <Input
                  id="diag_date"
                  type="date"
                  value={formData.diag_date}
                  onChange={(e) =>
                    setFormData({ ...formData, diag_date: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="recovered">Recovered</SelectItem>
                    <SelectItem value="death">Death</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full">
                {editingRecord ? "Update" : "Create"} Case Record
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
              <TableHead>Location</TableHead>
              <TableHead>Diagnosis Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {caseRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No case records found
                </TableCell>
              </TableRow>
            ) : (
              caseRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.patients?.name}</TableCell>
                  <TableCell>
                    {record.locations?.name}, {record.locations?.state}
                  </TableCell>
                  <TableCell>
                    {new Date(record.diag_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className={getStatusColor(record.status)}>
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog(record)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(record.id)}
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

export default CaseRecordsManagement;
