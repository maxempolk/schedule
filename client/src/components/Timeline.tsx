import { FC } from 'react';
import { C, ScheduleEvent } from '../data';
import { PX, START, END, toTop, toH, fmt, evtStartMin, evtEndMin } from '../utils';

interface TimelineProps {
  viewDay: number;
  todayJs: number;
  now: Date;
  nowMin: number;
  events: ScheduleEvent[];
}

const HOUR_LINES = Array.from({ length: END - START }, (_, i) => START + i);

const Timeline: FC<TimelineProps> = ({ viewDay, todayJs, now, nowMin, events }) => {
  const totalH     = END - START;
  const isToday    = viewDay === todayJs;
  const showNeedle = isToday && now.getHours() >= START && now.getHours() < END;
  const needleTop  = showNeedle ? toTop(now.getHours(), now.getMinutes() + now.getSeconds() / 60) : null;

  return (
    <div className="tl-rel" style={{ height: totalH * PX }}>
      {HOUR_LINES.map(h => (
        <div
          key={h}
          style={{ position: 'absolute', top: (h - START) * PX, left: '-3rem', right: 0, pointerEvents: 'none' }}
        >
          <span style={{ position: 'absolute', left: 0, top: 1, fontSize: 12, color: 'rgba(240,237,232,0.2)', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
            {h}:00
          </span>
          <div style={{ position: 'absolute', left: '3rem', right: 0, top: 0, height: 1, background: 'rgba(255,255,255,0.05)' }} />
        </div>
      ))}

      {events.map((e, i) => {
        const col      = C[e.type];
        const isActive = isToday && nowMin >= evtStartMin(e) && nowMin < evtEndMin(e);
        return (
          <div
            key={e.id ?? i}
            className={`evt-block${isActive ? ' active-block' : ''}`}
            style={{ top: toTop(e.h, e.m), height: Math.max(toH(e.dur) - 3, 34), background: col.bg, borderLeftColor: col.border }}
          >
            <div className="evt-name" style={{ color: col.text }}>{e.label}</div>
            <div className="evt-time" style={{ color: col.text }}>{fmt(e.h, e.m, e.dur)}</div>
          </div>
        );
      })}

      {showNeedle && needleTop !== null && <div className="needle" style={{ top: needleTop }} />}
    </div>
  );
};

export default Timeline;
