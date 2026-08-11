'use client';

type Props = {
  allSeries: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
};

export default function SeriesSelector({ allSeries, selected, onChange }: Props) {
  function toggle(series: string) {
    if (selected.includes(series)) {
      onChange(selected.filter((s) => s !== series));
    } else {
      onChange([...selected, series]);
    }
  }

  if (allSeries.length === 0) {
    return <p className="text-sm text-slate-500">データがまだありません。</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {allSeries.map((series) => {
        const active = selected.includes(series);
        return (
          <button
            key={series}
            type="button"
            onClick={() => toggle(series)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              active
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
            }`}
          >
            {series}
          </button>
        );
      })}
    </div>
  );
}
