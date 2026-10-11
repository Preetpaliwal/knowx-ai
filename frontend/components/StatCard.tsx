"use client";

type Props = {
  title: string;
  value: string | number;
  delta?: string;
  icon?: React.ReactElement<{ className?: string }>;
};

export default function StatCard({ title, value, delta, icon }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {delta && (
            <p className="mt-2 text-xs font-medium text-green-600">{delta}</p>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-primary-50 p-3 text-primary-600">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
