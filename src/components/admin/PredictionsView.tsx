import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const PredictionsView = () => {
  const [states, setStates] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState("");
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    loadStates();
  }, []);

  useEffect(() => {
    if (selectedState) {
      loadStateData(selectedState);
    }
  }, [selectedState]);

  const loadStates = async () => {
    const { data } = await supabase
      .from("state_stats")
      .select("state")
      .order("state");

    if (data) {
      const uniqueStates = [...new Set(data.map(d => d.state))];
      setStates(uniqueStates);
      if (uniqueStates.length > 0) {
        setSelectedState(uniqueStates[0]);
      }
    }
  };

  const loadStateData = async (state: string) => {
    const { data } = await supabase
      .from("state_stats")
      .select("*")
      .eq("state", state)
      .single();

    if (data) {
      // Generate trend data (simulated prediction for demonstration)
      const trend = [];
      const today = new Date();
      
      // Historical data point (current)
      trend.push({
        date: "Current",
        confirmed: data.confirmed,
        recovered: data.recovered,
        active: data.active,
        deaths: data.deaths,
      });

      // Generate predicted data for next 10-20 days
      // This is a simplified simulation - in production you would use ARIMA or similar models
      const recoveryRate = data.recovered / data.confirmed;
      const deathRate = data.deaths / data.confirmed;
      
      for (let i = 1; i <= 15; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        
        const lastPoint = trend[trend.length - 1];
        const growthRate = 0.02; // 2% daily growth simulation
        
        const newConfirmed = Math.round(lastPoint.confirmed * (1 + growthRate));
        const newRecovered = Math.round(newConfirmed * recoveryRate);
        const newDeaths = Math.round(newConfirmed * deathRate);
        const newActive = newConfirmed - newRecovered - newDeaths;

        trend.push({
          date: `Day ${i}`,
          confirmed: newConfirmed,
          recovered: newRecovered,
          active: newActive,
          deaths: newDeaths,
        });
      }

      setChartData(trend);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>COVID-19 Trend Predictions</CardTitle>
          <CardDescription>
            State-wise predictions for the next 10-20 days (simulated trends)
          </CardDescription>
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

          {chartData.length > 0 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold mb-4">Confirmed Cases Trend</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="confirmed"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      name="Confirmed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-4">Recovery & Death Trend</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="recovered"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      name="Recovered"
                    />
                    <Line
                      type="monotone"
                      dataKey="deaths"
                      stroke="hsl(var(--chart-4))"
                      strokeWidth={2}
                      name="Deaths"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-4">Active Cases Trend</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="active"
                      stroke="hsl(var(--chart-3))"
                      strokeWidth={2}
                      name="Active"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About Predictions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            These predictions use simplified trend modeling based on current state statistics.
            For production use, integrate with Python-based ARIMA models via an external API
            for more accurate forecasting. The trends shown here are for demonstration purposes
            and simulate potential growth patterns based on recovery and death rates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictionsView;
