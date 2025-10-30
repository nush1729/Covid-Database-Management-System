import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const AdminPatientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any | null>(null);

  useEffect(() => {
    const role = sessionStorage.getItem("userRole");
    if (role !== "admin") { navigate("/"); return; }
    load();
  }, [id, navigate]);

  const load = async () => {
    const res = await fetch(`${API_BASE}/api/patients/${id}`, { headers: { Authorization: `Bearer ${sessionStorage.getItem("jwt") || ""}` } });
    if (res.ok) setPatient(await res.json());
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Patient Profile</CardTitle>
          </CardHeader>
          <CardContent>
            {!patient ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Name</span><div className="font-semibold">{patient.name}</div></div>
                <div><span className="text-muted-foreground">Contact</span><div className="font-semibold">{patient.contact}</div></div>
                <div><span className="text-muted-foreground">DOB</span><div className="font-semibold">{new Date(patient.dob).toLocaleDateString()}</div></div>
                <div><span className="text-muted-foreground">ID</span><div className="font-mono text-xs">{patient.id}</div></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPatientProfile;


