import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// states are loaded from Flask backend now
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const PredictionsView = () => {
  const [states, setStates] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState("");
  const [recoveredData, setRecoveredData] = useState<any[]>([]);
  const [activeData, setActiveData] = useState<any[]>([]);
  const [deathsData, setDeathsData] = useState<any[]>([]);
  const [confirmedData, setConfirmedData] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState("");

  useEffect(() => {
    loadStates();
  }, []);

  useEffect(() => {
    if (selectedState) {
      loadStateData(selectedState);
    }
  }, [selectedState]);

  const loadStates = async () => {
    const res = await fetch(`${API_BASE}/api/predict/states`);
    const json = await res.json();
    const uniqueStates: string[] = json.states || [];
    setStates(uniqueStates);
    if (uniqueStates.length > 0) {
      setSelectedState(uniqueStates[0]);
    }
  };

  const loadStateData = async (state: string) => {
    // Fetch ARIMA-based forecast from Flask backend
    const res = await fetch(`${API_BASE}/api/predict/state/${encodeURIComponent(state)}?days=15`);
    if (!res.ok) {
      setRecoveredData([]); setActiveData([]); setDeathsData([]); setConfirmedData([]); setAnalysis("");
      return;
    }
    const json = await res.json();
    const s = json.series || {};
    setRecoveredData((s.recovered || []).map((x: any) => ({ date: x.date, value: x.recovered })));
    setActiveData((s.active || []).map((x: any) => ({ date: x.date, value: x.active })));
    setDeathsData((s.deaths || []).map((x: any) => ({ date: x.date, value: x.deaths })));
    setConfirmedData((s.confirmed || []).map((x: any) => ({ date: x.date, value: x.confirmed })));
    setAnalysis(json.analysis || "");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>COVID-19 Trend Predictions</CardTitle>
          <CardDescription>State-wise ARIMA predictions for next 10–20 days (recovered)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(recoveredData.length+activeData.length+deathsData.length+confirmedData.length) > 0 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold mb-4">Recovered Forecast</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={recoveredData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      name="Recovered"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {activeData.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-4">Active Cases Forecast</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={activeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Active" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              )}
              {deathsData.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-4">Deaths Forecast</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={deathsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Deaths" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              )}
              {confirmedData.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-4">Confirmed/Infected Forecast</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={confirmedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--chart-4))" strokeWidth={2} name="Confirmed" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About Predictions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            <strong>About the ARIMA Forecast:</strong><br/>
            These COVID-19 trend predictions use the ARIMA (AutoRegressive Integrated Moving Average) statistical model, leveraging past case, recovery, and vaccination data to forecast daily counts for each state. ARIMA is well-suited for pandemic time series as it accounts for changing patterns, seasonality, and the influence of earlier values. The charts above display estimated trends for confirmed cases, recoveries, active cases, and deaths for the next two weeks. <br/><br/>
            <strong>How to Interpret:</strong> The prediction curves show where the outbreak appears to be trending—helping identify surges, peaks, or improvement. Please note: Real-world events (policy, new variants, vaccination drives) can impact actual numbers. Forecasts provide valuable planning guidance, but should not be taken as absolute.
          </p>
          {analysis ? (
            <div className="space-y-1">
              {analysis.split(".").filter(Boolean).map((line, i) => (
                <p key={i}>• {line.trim()}.</p>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Select a state to view the forecast and analysis.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictionsView;
