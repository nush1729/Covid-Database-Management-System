import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Simple admin authentication - in production, implement proper auth
    if (email === "admin@covid.com" && password === "admin123") {
      sessionStorage.setItem("userRole", "admin");
      sessionStorage.setItem("userEmail", email);
      toast.success("Admin login successful");
      navigate("/admin");
    } else {
      toast.error("Invalid admin credentials");
    }
    
    setIsLoading(false);
  };

  const handlePatientLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const contact = formData.get("contact") as string;

    // For patient login, we'll verify against the patients table
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("contact", contact)
      .maybeSingle();

    if (error) {
      toast.error("Error logging in");
      setIsLoading(false);
      return;
    }

    if (data) {
      sessionStorage.setItem("userRole", "patient");
      sessionStorage.setItem("patientId", data.id);
      sessionStorage.setItem("patientName", data.name);
      toast.success("Patient login successful");
      navigate("/patient");
    } else {
      toast.error("Patient not found. Please contact administrator.");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="w-full max-w-md p-6">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <Activity className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">COVID-19 DBMS</h1>
          <p className="text-muted-foreground mt-2">Database Management System</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Choose your portal to access the system</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="admin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="admin">Admin Portal</TabsTrigger>
                <TabsTrigger value="patient">Patient Portal</TabsTrigger>
              </TabsList>
              
              <TabsContent value="admin">
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Email</Label>
                    <Input
                      id="admin-email"
                      name="email"
                      type="email"
                      placeholder="admin@covid.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <Input
                      id="admin-password"
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In as Admin"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Demo: admin@covid.com / admin123
                  </p>
                </form>
              </TabsContent>
              
              <TabsContent value="patient">
                <form onSubmit={handlePatientLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="patient-contact">Contact Number</Label>
                    <Input
                      id="patient-contact"
                      name="contact"
                      type="text"
                      placeholder="Enter your registered contact number"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In as Patient"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Enter your registered contact number to access your records
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
