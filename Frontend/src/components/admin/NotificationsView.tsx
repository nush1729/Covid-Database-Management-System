import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const NotificationsView = () => {
  const [items, setItems] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE}/api/notifications/admin/due`, {
      headers: { Authorization: `Bearer ${sessionStorage.getItem("jwt") || ""}` },
    })
      .then((r) => r.json())
      .then((j) => setItems(j.items || []))
      .catch(() => setItems([]));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notifications due in the next week.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Patient</th>
                  <th className="py-2 pr-4">Due/Retest Date</th>
                  <th className="py-2 pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="py-2 pr-4">{it.type.replace("_"," ")}</td>
                    <td className="py-2 pr-4 font-mono">{it.patient_id.slice(0,8)}...</td>
                    <td className="py-2 pr-4">{it.due_date || it.retest_date}</td>
                    <td className="py-2 pr-4">
                      <button className="underline" onClick={() => navigate(`/admin/patient/${it.patient_id}`)}>View Profile</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationsView;


