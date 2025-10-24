import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Users, Syringe, MapPin, FileText, BarChart3, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PatientsManagement from "@/components/admin/PatientsManagement";
import CaseRecordsManagement from "@/components/admin/CaseRecordsManagement";
import VaccinationsManagement from "@/components/admin/VaccinationsManagement";
import LocationsManagement from "@/components/admin/LocationsManagement";
import StateStatsManagement from "@/components/admin/StateStatsManagement";
import PredictionsView from "@/components/admin/PredictionsView";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeCases: 0,
    recovered: 0,
    deaths: 0,
    vaccinations: 0,
  });

  useEffect(() => {
    const userRole = sessionStorage.getItem("userRole");
    if (userRole !== "admin") {
      navigate("/");
      return;
    }

    loadStats();
  }, [navigate]);

  const loadStats = async () => {
    try {
      // Get total patients
      const { count: patientsCount } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true });

      // Get case statistics
      const { data: caseRecords } = await supabase
        .from("case_records")
        .select("status");

      const activeCases = caseRecords?.filter(r => r.status === "active").length || 0;
      const recovered = caseRecords?.filter(r => r.status === "recovered").length || 0;
      const deaths = caseRecords?.filter(r => r.status === "death").length || 0;

      // Get total vaccinations
      const { count: vaccinationsCount } = await supabase
        .from("vaccinations")
        .select("*", { count: "exact", head: true });

      setStats({
        totalPatients: patientsCount || 0,
        activeCases,
        recovered,
        deaths,
        vaccinations: vaccinationsCount || 0,
      });
    } catch (error) {
      toast.error("Failed to load statistics");
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
    toast.success("Logged out successfully");
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
              <p className="text-sm text-muted-foreground">Admin Dashboard</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Total Patients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalPatients}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-warning" />
                Active Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{stats.activeCases}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-secondary" />
                Recovered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{stats.recovered}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-destructive" />
                Deaths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{stats.deaths}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Syringe className="w-4 h-4 text-primary" />
                Vaccinations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.vaccinations}</div>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Manage all entities in the COVID-19 database</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="patients" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="patients">
                  <Users className="w-4 h-4 mr-2" />
                  Patients
                </TabsTrigger>
                <TabsTrigger value="cases">
                  <FileText className="w-4 h-4 mr-2" />
                  Cases
                </TabsTrigger>
                <TabsTrigger value="vaccinations">
                  <Syringe className="w-4 h-4 mr-2" />
                  Vaccinations
                </TabsTrigger>
                <TabsTrigger value="locations">
                  <MapPin className="w-4 h-4 mr-2" />
                  Locations
                </TabsTrigger>
                <TabsTrigger value="stats">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  State Stats
                </TabsTrigger>
                <TabsTrigger value="predictions">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Predictions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="patients" className="mt-6">
                <PatientsManagement onUpdate={loadStats} />
              </TabsContent>

              <TabsContent value="cases" className="mt-6">
                <CaseRecordsManagement onUpdate={loadStats} />
              </TabsContent>

              <TabsContent value="vaccinations" className="mt-6">
                <VaccinationsManagement onUpdate={loadStats} />
              </TabsContent>

              <TabsContent value="locations" className="mt-6">
                <LocationsManagement />
              </TabsContent>

              <TabsContent value="stats" className="mt-6">
                <StateStatsManagement />
              </TabsContent>

              <TabsContent value="predictions" className="mt-6">
                <PredictionsView />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;
