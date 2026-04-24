import { DAYS_SHORT } from '../data';

const TAB_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function DayNav({ viewDay, setViewDay, todayJs }) {
  return (
    <nav className="day-nav">
      {TAB_ORDER.map(d => (
        <button
          key={d}
          className={[
            'day-btn',
            d === viewDay  ? 'active'    : '',
            d === todayJs  ? 'today-tab' : '',
          ].join(' ').trim()}
          onClick={() => setViewDay(d)}
        >
          {DAYS_SHORT[d]}
        </button>
      ))}
    </nav>
  );
}
