import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, FileText, Syringe, LogOut, HelpCircle, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [caseRecords, setCaseRecords] = useState<any[]>([]);
  const [vaccinations, setVaccinations] = useState<any[]>([]);

  useEffect(() => {
    const userRole = sessionStorage.getItem("userRole");
    const patientId = sessionStorage.getItem("patientId");
    
    if (userRole !== "user" || !patientId) {
      navigate("/");
      return;
    }

    loadPatientData(patientId);
    // fetch notifications for patient and toast them
    fetch(`${API_BASE}/api/notifications/me`, {
      headers: { Authorization: `Bearer ${sessionStorage.getItem("jwt") || ""}` },
    })
      .then((r) => r.json())
      .then((json) => {
        (json.notifications || []).forEach((n: any) => {
          toast(n.title + ": " + n.message);
        });
      })
      .catch(() => {});
  }, [navigate]);

  const loadPatientData = async (patientId: string) => {
    try {
      // Load patient info
      const { data: patient } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single();

      setPatientInfo(patient);

      // Load case records with location info
      const { data: cases } = await supabase
        .from("case_records")
        .select(`
          *,
          locations (name, address, state)
        `)
        .eq("patient_id", patientId)
        .order("diag_date", { ascending: false });

      setCaseRecords(cases || []);

      // Load vaccinations
      const { data: vax } = await supabase
        .from("vaccinations")
        .select("*")
        .eq("patient_id", patientId)
        .order("date", { ascending: false });

      setVaccinations(vax || []);
    } catch (error) {
      toast.error("Failed to load patient data");
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
    toast.success("Logged out successfully");
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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">COVID-19 DBMS</h1>
              <p className="text-sm text-muted-foreground">Patient Portal</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="md:col-span-1 space-y-2">
          <Card>
            <CardHeader>
              <CardTitle>Menu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><Bell className="w-4 h-4"/> Notifications appear as popups</div>
              <div className="flex items-center gap-2"><HelpCircle className="w-4 h-4"/> Help: Contact hospital helpline 1075</div>
            </CardContent>
          </Card>
        </aside>
        <section className="md:col-span-3">
        {/* Patient Info Card */}
        {patientInfo && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
              <CardDescription>Your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-semibold">{patientInfo.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact</p>
                  <p className="font-semibold">{patientInfo.contact}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-semibold">{new Date(patientInfo.dob).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Patient ID</p>
                  <p className="font-semibold text-xs">{patientInfo.id.slice(0, 8)}...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Case Records */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Case Records
            </CardTitle>
            <CardDescription>Your COVID-19 case history</CardDescription>
          </CardHeader>
          <CardContent>
            {caseRecords.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No case records found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Diagnosis Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {caseRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{new Date(record.diag_date).toLocaleDateString()}</TableCell>
                      <TableCell className={getStatusColor(record.status)}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </TableCell>
                      <TableCell>{record.locations?.name}</TableCell>
                      <TableCell>{record.locations?.address}, {record.locations?.state}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Vaccinations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Syringe className="w-5 h-5" />
              Vaccination Records
            </CardTitle>
            <CardDescription>Your COVID-19 vaccination history</CardDescription>
          </CardHeader>
          <CardContent>
            {vaccinations.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No vaccination records found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Vaccine Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vaccinations.map((vax) => (
                    <TableRow key={vax.id}>
                      <TableCell>{new Date(vax.date).toLocaleDateString()}</TableCell>
                      <TableCell>{vax.vaccine_type}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        </section>
      </main>
    </div>
  );
};

export default PatientDashboard;
