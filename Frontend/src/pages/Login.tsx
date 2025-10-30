import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Activity } from "lucide-react";
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      sessionStorage.setItem("jwt", json.token);
      sessionStorage.setItem("userRole", json.user.role);
      sessionStorage.setItem("userId", json.user.id);
      toast.success("Admin login successful");
      navigate("/admin");
    } catch {
      toast.error("Invalid admin credentials");
    }
    setIsLoading(false);
  };

  const handlePatientLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      sessionStorage.setItem("jwt", json.token);
      sessionStorage.setItem("userRole", json.user.role);
      sessionStorage.setItem("patientId", json.user.id);
      sessionStorage.setItem("userId", json.user.id);
      toast.success("Patient login successful");
      navigate("/patient");
    } catch {
      toast.error("Invalid patient credentials");
    }
    setIsLoading(false);
  };

  return (
    // Main container with your background image
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center bg-cover bg-center p-4"
      style={{ backgroundImage: 'url(/login-background.jpg)' }}
    >
      {/* Semi-transparent overlay for better text readability */}
      <div className="absolute inset-0 bg-black/50 z-0" />

      {/* Content container */}
      <div className="z-10 text-center mb-8">
        {/* New large, bold title with an icon */}
        <h1 className="text-5xl font-bold text-white shadow-md flex items-center justify-center gap-4">
          <Activity className="h-12 w-12" />
          <span>Covid 19 Portal</span>
        </h1>
      </div>

      {/* Login Card with a fade-in-up animation */}
      <Card className="w-full max-w-md z-10 animate-fade-in-up">
        <CardHeader>
          {/* Bigger "Sign In" text */}
          <CardTitle className="text-3xl">Sign In</CardTitle>
          <CardDescription>Choose your portal to access the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="admin">Admin Portal</TabsTrigger>
              <TabsTrigger value="patient">Patient Portal</TabsTrigger>
            </TabsList>
            <TabsContent value="admin">
              <form onSubmit={handleAdminLogin} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    name="email"
                    type="email"
                    placeholder="admin@covid.com"
                    required
                    className="transition-all duration-300 ease-in-out focus:scale-105"
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
                    className="transition-all duration-300 ease-in-out focus:scale-105"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full transition-all duration-300 ease-in-out hover:scale-105"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In as Admin"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="patient">
              <form onSubmit={handlePatientLogin} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="patient-email">Email</Label>
                  <Input
                    id="patient-email"
                    name="email"
                    type="email"
                    placeholder="your.name@mail.in"
                    required
                    className="transition-all duration-300 ease-in-out focus:scale-105"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patient-password">Password</Label>
                  <Input
                    id="patient-password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                    className="transition-all duration-300 ease-in-out focus:scale-105"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full transition-all duration-300 ease-in-out hover:scale-105"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In as Patient"}
                </Button>
                <div className="mt-4 text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <Link to="/signup" className="underline">
                    Sign up
                  </Link>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;