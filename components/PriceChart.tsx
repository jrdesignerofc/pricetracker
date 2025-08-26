"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

type Point = { t: string; y: number };

export default function PriceChart({ points }: { points: Point[] }) {
  const data = {
    labels: points.map((p) => p.t),
    datasets: [
      {
        label: "Preço (R$)",
        data: points.map((p) => p.y),
        borderWidth: 2,
        tension: 0.25,
        pointRadius: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { display: true } },
    scales: { y: { beginAtZero: false } },
  } as const;

  return <Line data={data} options={options} />;
}
