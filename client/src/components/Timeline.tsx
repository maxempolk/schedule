import { FC, useState, useEffect, useRef } from 'react';
import { C, ScheduleEvent } from '../data';
import { PX, START, END, toTop, toH, fmt, evtStartMin, evtEndMin } from '../utils';
import { bulkUpdateEvents } from '../api';

interface TimelineProps {
  viewDay: number;
  todayJs: number;
  now: Date;
  nowMin: number;
  events: ScheduleEvent[];
  onUpdateEvents: (events: ScheduleEvent[]) => void;
}

interface DragState {
  handle: 'top' | 'bottom';
  idx: number;
  neighborIdx: number; // -1 = no adjacent neighbour
  startY: number;
  origEvents: ScheduleEvent[];
}

const SNAP    = 15;  // minutes
const MIN_DUR = 15;  // minutes
const HOUR_LINES = Array.from({ length: END - START }, (_, i) => START + i);

const Timeline: FC<TimelineProps> = ({ viewDay, todayJs, now, nowMin, events, onUpdateEvents }) => {
  const [draft, setDraft] = useState<ScheduleEvent[]>(events);
  const [drag, setDrag]   = useState<DragState | null>(null);
  const draftRef          = useRef<ScheduleEvent[]>(events);
  draftRef.current        = draft; // always up-to-date, no stale-closure risk

  // Sync draft from prop when not dragging (day change, API refresh, etc.)
  useEffect(() => {
    if (!drag) { setDraft(events); }
  }, [events]); // eslint-disable-line react-hooks/exhaustive-deps

  // Global cursor + selection lock while dragging
  useEffect(() => {
    if (!drag) return;
    document.body.style.cursor     = 'ns-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.body.style.cursor     = '';
      document.body.style.userSelect = '';
    };
  }, [!!drag]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mouse move / up listeners — recreated each time drag state changes
  useEffect(() => {
    if (!drag) return;

    const onMove = (e: MouseEvent) => {
      const deltaMin = Math.round((e.clientY - drag.startY) / PX * 60 / SNAP) * SNAP;
      const next     = drag.origEvents.map(ev => ({ ...ev }));
      const ev       = next[drag.idx];

      if (drag.handle === 'bottom') {
        const evStartMin  = evtStartMin(drag.origEvents[drag.idx]);
        const origEndMin  = evStartMin + drag.origEvents[drag.idx].dur * 60;
        let   newEndMin   = origEndMin + deltaMin;

        // Can't eat the whole neighbour
        if (drag.neighborIdx >= 0) {
          const nb          = drag.origEvents[drag.neighborIdx];
          const nbEndMin    = evtStartMin(nb) + nb.dur * 60;
          newEndMin = Math.min(newEndMin, nbEndMin - MIN_DUR);
        }
        newEndMin = Math.max(evStartMin + MIN_DUR, Math.min(END * 60, newEndMin));
        ev.dur    = (newEndMin - evStartMin) / 60;

        if (drag.neighborIdx >= 0) {
          const nb       = next[drag.neighborIdx];
          const origNb   = drag.origEvents[drag.neighborIdx];
          const nbEndMin = evtStartMin(origNb) + origNb.dur * 60;
          nb.h   = Math.floor(newEndMin / 60);
          nb.m   = newEndMin % 60;
          nb.dur = (nbEndMin - newEndMin) / 60;
        }
      } else {
        // top handle
        const origStartMin = evtStartMin(drag.origEvents[drag.idx]);
        const origEndMin   = origStartMin + drag.origEvents[drag.idx].dur * 60;
        let   newStartMin  = origStartMin + deltaMin;

        // Can't eat the whole neighbour above
        if (drag.neighborIdx >= 0) {
          const nb         = drag.origEvents[drag.neighborIdx];
          const nbStartMin = evtStartMin(nb);
          newStartMin = Math.max(newStartMin, nbStartMin + MIN_DUR);
        }
        newStartMin = Math.max(START * 60, Math.min(origEndMin - MIN_DUR, newStartMin));
        ev.h   = Math.floor(newStartMin / 60);
        ev.m   = newStartMin % 60;
        ev.dur = (origEndMin - newStartMin) / 60;

        if (drag.neighborIdx >= 0) {
          const nb         = next[drag.neighborIdx];
          const origNb     = drag.origEvents[drag.neighborIdx];
          const nbStartMin = evtStartMin(origNb);
          nb.dur = (newStartMin - nbStartMin) / 60;
        }
      }

      draftRef.current = next;
      setDraft(next);
    };

    const onUp = async () => {
      const final   = draftRef.current;
      const origEvs = drag.origEvents;
      setDrag(null);

      const changed = final.filter((ev, i) =>
        ev.h !== origEvs[i].h || ev.m !== origEvs[i].m || ev.dur !== origEvs[i].dur
      );
      if (changed.length === 0) return;

      try {
        await bulkUpdateEvents(changed.map(({ id, h, m, dur }) => ({ id, h, m, dur })));
        onUpdateEvents(final);
      } catch {
        // Revert optimistic update on error
        setDraft(origEvs);
        draftRef.current = origEvs;
      }
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [drag]); // eslint-disable-line react-hooks/exhaustive-deps

  const startDrag = (e: React.MouseEvent, handle: 'top' | 'bottom', idx: number) => {
    e.preventDefault();
    e.stopPropagation();

    const curr         = draftRef.current[idx];
    let   neighborIdx  = -1;

    if (handle === 'bottom' && idx < draftRef.current.length - 1) {
      const next = draftRef.current[idx + 1];
      if (Math.abs(evtStartMin(next) - evtEndMin(curr)) <= 1) neighborIdx = idx + 1;
    } else if (handle === 'top' && idx > 0) {
      const prev = draftRef.current[idx - 1];
      if (Math.abs(evtEndMin(prev) - evtStartMin(curr)) <= 1) neighborIdx = idx - 1;
    }

    setDrag({
      handle,
      idx,
      neighborIdx,
      startY: e.clientY,
      origEvents: draftRef.current.map(ev => ({ ...ev })),
    });
  };

  const isToday    = viewDay === todayJs;
  const showNeedle = isToday && now.getHours() >= START && now.getHours() < END;
  const needleTop  = showNeedle
    ? toTop(now.getHours(), now.getMinutes() + now.getSeconds() / 60)
    : null;

  return (
    <div className="tl-rel" style={{ height: (END - START) * PX }}>

      {HOUR_LINES.map(h => (
        <div key={h} style={{ position:'absolute', top:(h-START)*PX, left:'-3rem', right:0, pointerEvents:'none' }}>
          <span style={{ position:'absolute', left:0, top:1, fontSize:12, color:'rgba(240,237,232,0.2)', letterSpacing:'0.04em', whiteSpace:'nowrap' }}>
            {h}:00
          </span>
          <div style={{ position:'absolute', left:'3rem', right:0, top:0, height:1, background:'rgba(255,255,255,0.05)' }} />
        </div>
      ))}

      {draft.map((e, i) => {
        const col        = C[e.type];
        const isActive   = isToday && nowMin >= evtStartMin(e) && nowMin < evtEndMin(e);
        const isResizing = drag !== null && (drag.idx === i || drag.neighborIdx === i);
        return (
          <div
            key={e.id ?? i}
            className={`evt-block${isActive ? ' active-block' : ''}${isResizing ? ' is-resizing' : ''}`}
            style={{
              top:             toTop(e.h, e.m),
              height:          Math.max(toH(e.dur) - 3, 20),
              background:      col.bg,
              borderLeftColor: col.border,
            }}
          >
            <div
              className="resize-handle resize-handle-top"
              onMouseDown={ev => startDrag(ev, 'top', i)}
            />
            <div className="evt-name" style={{ color: col.text }}>{e.label}</div>
            <div className="evt-time" style={{ color: col.text }}>{fmt(e.h, e.m, e.dur)}</div>
            <div
              className="resize-handle resize-handle-bottom"
              onMouseDown={ev => startDrag(ev, 'bottom', i)}
            />
          </div>
        );
      })}

      {showNeedle && needleTop !== null && (
        <div className="needle" style={{ top: needleTop }} />
      )}
    </div>
  );
};

export default Timeline;
