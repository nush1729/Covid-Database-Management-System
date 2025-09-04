import React, { useEffect, useState } from "react";
import API from "../../utils/api";

export default function PeakCases({ state }) {
  const [peak, setPeak] = useState(null);

  useEffect(() => {
    API.get(`/analytics/peak?state=${state}`)
      .then((res) => setPeak(res.data))
      .catch(console.error);
  }, [state]);

  if (!peak) return <div>Loading peak cases info...</div>;

  return (
    <div>
      <h3>Peak Cases for {state}</h3>
      <p>Date: {peak.peak_date}</p>
      <p>Cases: {peak.peak_cases}</p>
    </div>
  );
}
