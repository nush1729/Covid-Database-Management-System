import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import API from "../../utils/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function StateForecast({ state }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    API.get(`/analytics/dashboard/cases-time-series?state=${state}`)
      .then((res) => {
        setData({
          labels: res.data.dates,
          datasets: [{
            label: `Confirmed Cases in ${state}`,
            data: res.data.confirmed,
            borderColor: "rgba(75,192,192,1)",
            fill: false,
          }],
        });
      })
      .catch(console.error);
  }, [state]);

  if (!data) return <div>Loading forecast...</div>;

  return <Line data={data} />;
}
