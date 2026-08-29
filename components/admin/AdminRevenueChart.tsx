"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  data: {
    month: string;
    revenue: number;
  }[];
};

export default function AdminRevenueChart({
  data,
}: Props) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">
          Revenue
        </h2>

        <p className="mt-1 text-sm text-white/40">
          Monthly recurring revenue
        </p>
      </div>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient
                id="colorRevenue"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#10B981"
                  stopOpacity={0.4}
                />

                <stop
                  offset="100%"
                  stopColor="#10B981"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="month"
              stroke="#ffffff50"
            />

            <YAxis stroke="#ffffff50" />

            <Tooltip />

            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#10B981"
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}