import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Activity } from "lucide-react";
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const Signup = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const first_name = (formData.get("first_name") as string).trim();
    const last_name = (formData.get("last_name") as string).trim();
    const name = `${first_name} ${last_name}`.trim();
    const email = (formData.get("email") as string).trim();
    const password = (formData.get("password") as string).trim();
    const contact = (formData.get("contact") as string).trim();
    const dob = (formData.get("dob") as string).trim();

    // Client-side validation
    if (password.length <= 5) {
      toast.error("Password must be longer than 5 characters");
      setIsLoading(false);
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      toast.error("Password must contain at least one special character");
      setIsLoading(false);
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.(in|com)$/.test(email)) {
      toast.error("Email must contain @ and end with .in or .com");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name, last_name, name, email, password, role: "user", contact, dob }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || errorText);
        } catch {
          throw new Error(errorText);
        }
      }
      const json = await res.json();
      sessionStorage.setItem("jwt", json.token);
      sessionStorage.setItem("userRole", json.user.role);
      sessionStorage.setItem("patientId", json.user.id);
      sessionStorage.setItem("userId", json.user.id);
      toast.success("Account created. Welcome!");
      navigate("/patient");
    } catch (err: any) {
      toast.error(err.message || "Sign up failed. Try another email.");
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
          <p className="text-muted-foreground mt-2">Patient Sign Up</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>Register to access your patient portal</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First name</Label>
                  <Input id="first_name" name="first_name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last name</Label>
                  <Input id="last_name" name="last_name" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="your.name@mail.in or your.name@mail.com"
                  required 
                />
                <p className="text-xs text-muted-foreground">Must end with .in or .com</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  minLength={6}
                  required 
                />
                <p className="text-xs text-muted-foreground">
                  Must be longer than 5 characters and contain at least one special character (!@#$%^&*...)
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact</Label>
                  <Input id="contact" name="contact" placeholder="98xxxxxxxx" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of birth</Label>
                  <Input id="dob" name="dob" type="date" required />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Already have an account? <Link to="/login" className="underline">Sign in</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;


