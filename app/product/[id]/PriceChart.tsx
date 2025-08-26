"use client";

import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useMemo } from "react";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Filler,
  Legend
);

type Props = {
  labels: string[];
  values: number[];
  currency?: "BRL" | "USD" | "EUR";
};

export default function PriceChart({ labels, values, currency = "BRL" }: Props) {
  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "Preço",
          data: values,
          // não definimos cores fixas pra manter neutro (pode ajustar se quiser)
          borderWidth: 2,
          fill: true,
          tension: 0.25,
          pointRadius: 2,
        },
      ],
    }),
    [labels, values]
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index" as const, intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: any) => {
              const v = Number(ctx.parsed.y ?? 0);
              return v.toLocaleString("pt-BR", {
                style: "currency",
                currency,
              });
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { maxRotation: 0, autoSkip: true },
          grid: { display: false },
        },
        y: {
          beginAtZero: false,
          grid: { display: true },
          ticks: {
            callback: (v: any) =>
              Number(v).toLocaleString("pt-BR", {
                style: "currency",
                currency,
              }),
          },
        },
      },
    }),
    [currency]
  );

  return (
    <div style={{ height: 320 }}>
      <Line data={data} options={options as any} />
    </div>
  );
}
