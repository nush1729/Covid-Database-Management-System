import React from "react";
import StateForecast from "../components/Dashboard/StateForecast";
import PeakCases from "../components/Analytics/PeakCases";

export default function Home() {
  const state = "Kerala"; // Example; can be made dynamic

  return (
    <div>
      <h1>Welcome to COVID Dashboard</h1>
      <StateForecast state={state} />
      <PeakCases state={state} />
    </div>
  );
}
