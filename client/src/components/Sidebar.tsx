import { FC } from 'react';
import { DAYS_RU, DAYS_SHORT, C, ScheduleEvent, ColorType } from '../data';

interface LegendItem {
  type: ColorType;
  label: string;
}

const LEGEND: LegendItem[] = [
  { type: 'courses', label: 'курсы (норв.)' },
  { type: 'eng',     label: 'английский' },
  { type: 'student', label: 'ученики' },
  { type: 'code',    label: 'программирование' },
  { type: 'sport',   label: 'спорт' },
  { type: 'home',    label: 'быт' },
  { type: 'diploma', label: 'диплом / универ' },
  { type: 'rest',    label: 'отдых' },
];

function sumMin(evts: ScheduleEvent[], type: ColorType): number {
  return evts.filter(e => e.type === type).reduce((a, e) => a + e.dur * 60, 0);
}

interface SidebarProps {
  viewDay: number;
  events: ScheduleEvent[];
}

const Sidebar: FC<SidebarProps> = ({ viewDay, events }) => {
  const codeMin    = sumMin(events, 'code');
  const engMin     = sumMin(events, 'eng');
  const diplomaMin = sumMin(events, 'diploma');

  return (
    <aside className="sidebar">
      <div>
        <div className="day-big">{DAYS_SHORT[viewDay]}</div>
        <div className="day-name-full">{DAYS_RU[viewDay]}</div>
      </div>

      <div className="stats">
        <div className="stat-item">
          <div className="stat-label">Код</div>
          <div className="stat-value">{codeMin > 0 ? Math.round(codeMin) + ' мин' : '—'}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Английский</div>
          <div className="stat-value">{engMin > 0 ? Math.round(engMin) + ' мин' : '—'}</div>
        </div>
        {diplomaMin > 0 && (
          <div className="stat-item">
            <div className="stat-label">Диплом</div>
            <div className="stat-value">{Math.round(diplomaMin)} мин</div>
          </div>
        )}
      </div>

      <div className="legend">
        {LEGEND.map(({ type, label }) => (
          <div key={type} className="leg-item">
            <div className="leg-dot" style={{ background: C[type].border }} />
            {label}
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
