'use client';

type Props = {
  stores: string[];
  selected: string;
  onChange: (store: string) => void;
};

export default function StoreSelector({ stores, selected, onChange }: Props) {
  return (
    <select
      value={selected}
      onChange={(e) => onChange(e.target.value)}
      className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white min-w-[12rem]"
    >
      {stores.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
