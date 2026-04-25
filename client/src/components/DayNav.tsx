import { FC } from 'react';
import { DAYS_SHORT } from '../data';

interface DayNavProps {
  viewDay: number;
  setViewDay: (day: number) => void;
  todayJs: number;
}

const TAB_ORDER = [1, 2, 3, 4, 5, 6, 0];

const DayNav: FC<DayNavProps> = ({ viewDay, setViewDay, todayJs }) => {
  return (
    <nav className="day-nav">
      {TAB_ORDER.map(d => (
        <button
          key={d}
          className={[
            'day-btn',
            d === viewDay ? 'active' : '',
            d === todayJs ? 'today-tab' : '',
          ]
            .join(' ')
            .trim()}
          onClick={() => setViewDay(d)}
        >
          {DAYS_SHORT[d]}
        </button>
      ))}
    </nav>
  );
};

export default DayNav;
