// components/PriceChart.tsx
"use client";

import React from "react";

type Point = { t: number; v: number };
type Props = { points: Point[] };

/**
 * Gráfico simples em SVG (linha) sem libs.
 * Recebe pontos [{ t: timestamp(ms), v: number }] e desenha.
 */
export default function PriceChart({ points }: Props) {
  if (!points || points.length === 0) {
    return (
      <div className="text-sm text-neutral-500">
        Sem dados suficientes para exibir o gráfico.
      </div>
    );
  }

  // Normaliza dados para caber no SVG
  const width = 640;
  const height = 220;
  const padding = 24;

  const xs = points.map((p) => p.t);
  const ys = points.map((p) => p.v);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const xScale = (x: number) =>
    padding +
    ((x - minX) / Math.max(1, maxX - minX)) * (width - padding * 2);

  const yScale = (y: number) =>
    height - padding - ((y - minY) / Math.max(1, maxY - minY)) * (height - padding * 2);

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.t)} ${yScale(p.v)}`)
    .join(" ");

  const first = points[0];
  const last = points[points.length - 1];

  return (
    <figure className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Histórico de preços"
        className="w-full"
      >
        {/* fundo */}
        <rect x={0} y={0} width={width} height={height} fill="#fff" rx="8" />
        {/* eixos simples */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#ddd"
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#ddd"
        />
        {/* linha do preço */}
        <path d={path} fill="none" stroke="#2563eb" strokeWidth={2} />
        {/* ponto inicial/final */}
        <circle cx={xScale(first.t)} cy={yScale(first.v)} r={3} fill="#2563eb" />
        <circle cx={xScale(last.t)} cy={yScale(last.v)} r={3} fill="#2563eb" />
      </svg>
      <figcaption className="mt-2 text-xs text-neutral-500">
        {new Date(first.t).toLocaleDateString("pt-BR")} →{" "}
        {new Date(last.t).toLocaleDateString("pt-BR")}
      </figcaption>
    </figure>
  );
}
