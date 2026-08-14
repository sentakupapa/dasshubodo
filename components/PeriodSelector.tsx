'use client';

type Props = {
  periods: number[];
  selected: number;
  onChange: (period: number) => void;
};

export default function PeriodSelector({ periods, selected, onChange }: Props) {
  return (
    <select
      value={selected}
      onChange={(e) => onChange(Number(e.target.value))}
      className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white min-w-[8rem]"
    >
      {periods.map((p) => (
        <option key={p} value={p}>
          第{p}期
        </option>
      ))}
    </select>
  );
}
