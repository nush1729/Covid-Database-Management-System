import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Activity, Users, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  name: string;
  role: "admin" | "user" | "manager";
  created_at: string;
}

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userRole = sessionStorage.getItem("userRole");
    if (userRole !== "manager") {
      navigate("/");
      return;
    }

    loadUsers();
  }, [navigate]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/users`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("jwt") || ""}` },
      });
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: "admin" | "user" | "manager") => {
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}/promote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("jwt") || ""}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update role");
      }

      const result = await res.json();
      toast.success(result.message || "User role updated successfully");
      loadUsers(); // Reload users list
    } catch (error: any) {
      toast.error(error.message || "Failed to update user role");
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
    toast.success("Logged out successfully");
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default";
      case "manager":
        return "secondary";
      case "user":
        return "outline";
      default:
        return "outline";
    }
  };

  const getRoleCounts = () => {
    const counts = { admin: 0, manager: 0, user: 0 };
    users.forEach((user) => {
      counts[user.role as keyof typeof counts]++;
    });
    return counts;
  };

  const roleCounts = getRoleCounts();

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
              <p className="text-sm text-muted-foreground">Manager Dashboard</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate("/admin")}>
              View Admin Portal
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{users.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Admins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{roleCounts.admin}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-secondary" />
                Managers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{roleCounts.manager}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                Patients/Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{roleCounts.user}</div>
            </CardContent>
          </Card>
        </div>

        {/* Users Management */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              View all users and manage their roles. You can promote users to admin or demote admins to user.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading users...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Select
                            value={user.role}
                            onValueChange={(value) =>
                              handleRoleChange(user.id, value as "admin" | "user" | "manager")
                            }
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ManagerDashboard;

