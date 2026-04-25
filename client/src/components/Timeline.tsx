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

// ─── Discriminated drag union ─────────────────────────────────────────────────

type DragState =
  | {
      kind: 'resize';
      handle: 'top' | 'bottom';
      idx: number;
      neighborIdx: number;
      startY: number;
      origEvents: ScheduleEvent[];
    }
  | {
      kind: 'order';
      idx: number;
      dragOffset: number;   // mouse Y from top of the grabbed event
      origEvents: ScheduleEvent[];
    };

// ─── Constants ────────────────────────────────────────────────────────────────

const SNAP       = 15;
const MIN_DUR    = 15;
const HOUR_LINES = Array.from({ length: END - START }, (_, i) => START + i);

// ─────────────────────────────────────────────────────────────────────────────

const Timeline: FC<TimelineProps> = ({ viewDay, todayJs, now, nowMin, events, onUpdateEvents }) => {
  const [draft,  setDraft]  = useState<ScheduleEvent[]>(events);
  const [drag,   setDrag]   = useState<DragState | null>(null);
  const [ghostY, setGhostY] = useState(0);

  const draftRef     = useRef<ScheduleEvent[]>(events);
  const ghostYRef    = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  draftRef.current   = draft;

  // Sync from prop when idle
  useEffect(() => {
    if (!drag) setDraft(events);
  }, [events]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cursor / user-select
  useEffect(() => {
    if (!drag) return;
    document.body.style.cursor     = 'grabbing';
    document.body.style.userSelect = 'none';
    return () => { document.body.style.cursor = ''; document.body.style.userSelect = ''; };
  }, [!!drag]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Mouse listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!drag) return;

    const onMove = (e: MouseEvent) => {
      // ── Order drag: ghost follows cursor ──────────────────────────────
      if (drag.kind === 'order') {
        const rect   = containerRef.current!.getBoundingClientRect();
        const mouseY = e.clientY - rect.top;
        const maxY   = (END - START) * PX - toH(drag.origEvents[drag.idx].dur);
        const newY   = Math.max(0, Math.min(maxY, mouseY - drag.dragOffset));
        ghostYRef.current = newY;
        setGhostY(newY);
        return;
      }

      // ── Resize drag ───────────────────────────────────────────────────
      const deltaMin = Math.round((e.clientY - drag.startY) / PX * 60 / SNAP) * SNAP;
      const next     = drag.origEvents.map(ev => ({ ...ev }));
      const ev       = next[drag.idx];

      if (drag.handle === 'bottom') {
        const evStart = evtStartMin(drag.origEvents[drag.idx]);
        const origEnd = evStart + drag.origEvents[drag.idx].dur * 60;
        let   newEnd  = origEnd + deltaMin;
        if (drag.neighborIdx >= 0) {
          const nb = drag.origEvents[drag.neighborIdx];
          newEnd   = Math.min(newEnd, evtStartMin(nb) + nb.dur * 60 - MIN_DUR);
        }
        newEnd  = Math.max(evStart + MIN_DUR, Math.min(END * 60, newEnd));
        ev.dur  = (newEnd - evStart) / 60;
        if (drag.neighborIdx >= 0) {
          const nb        = next[drag.neighborIdx];
          const nbOrigEnd = evtStartMin(drag.origEvents[drag.neighborIdx]) + drag.origEvents[drag.neighborIdx].dur * 60;
          nb.h = Math.floor(newEnd / 60); nb.m = newEnd % 60;
          nb.dur = (nbOrigEnd - newEnd) / 60;
        }
      } else {
        const origStart = evtStartMin(drag.origEvents[drag.idx]);
        const origEnd   = origStart + drag.origEvents[drag.idx].dur * 60;
        let   newStart  = origStart + deltaMin;
        if (drag.neighborIdx >= 0) {
          const nb = drag.origEvents[drag.neighborIdx];
          newStart = Math.max(newStart, evtStartMin(nb) + MIN_DUR);
        }
        newStart = Math.max(START * 60, Math.min(origEnd - MIN_DUR, newStart));
        ev.h = Math.floor(newStart / 60); ev.m = newStart % 60;
        ev.dur = (origEnd - newStart) / 60;
        if (drag.neighborIdx >= 0) {
          const nb = next[drag.neighborIdx];
          nb.dur   = (newStart - evtStartMin(drag.origEvents[drag.neighborIdx])) / 60;
        }
      }
      draftRef.current = next;
      setDraft(next);
    };

    const onUp = async () => {
      // ── Order drop: reorder + recalc times ───────────────────────────
      if (drag.kind === 'order') {
        const origEvs = drag.origEvents;
        const others  = origEvs.filter((_, i) => i !== drag.idx);

        // Find insert position from ghost center
        const ghostCenter = ghostYRef.current + toH(origEvs[drag.idx].dur) / 2;
        let insertIdx = others.length;
        for (let i = 0; i < others.length; i++) {
          if (ghostCenter < toTop(others[i].h, others[i].m) + toH(others[i].dur) / 2) {
            insertIdx = i; break;
          }
        }

        // Build new ordered array
        const newOrder = [...others];
        newOrder.splice(insertIdx, 0, origEvs[drag.idx]);

        // Recalculate start times sequentially (durations preserved)
        let cur = evtStartMin(origEvs[0]);
        const newEvents = newOrder.map(ev => {
          const h = Math.floor(cur / 60);
          const m = cur % 60;
          cur += ev.dur * 60;
          return { ...ev, h, m };
        });

        setDrag(null);
        setDraft(newEvents);
        draftRef.current = newEvents;

        const changed = newEvents.filter(ev => {
          const orig = origEvs.find(o => o.id === ev.id);
          return orig && (ev.h !== orig.h || ev.m !== orig.m);
        });

        if (changed.length === 0) { onUpdateEvents(newEvents); return; }

        try {
          await bulkUpdateEvents(changed.map(({ id, h, m, dur }) => ({ id, h, m, dur })));
          onUpdateEvents(newEvents);
        } catch {
          setDraft(origEvs);
          draftRef.current = origEvs;
        }
        return;
      }

      // ── Resize drop ───────────────────────────────────────────────────
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
        setDraft(origEvs);
        draftRef.current = origEvs;
      }
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    };
  }, [drag]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Drag initiators ──────────────────────────────────────────────────────

  const startResize = (e: React.MouseEvent, handle: 'top' | 'bottom', idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    const curr        = draftRef.current[idx];
    let   neighborIdx = -1;
    if (handle === 'bottom' && idx < draftRef.current.length - 1) {
      const next = draftRef.current[idx + 1];
      if (Math.abs(evtStartMin(next) - evtEndMin(curr)) <= 1) neighborIdx = idx + 1;
    } else if (handle === 'top' && idx > 0) {
      const prev = draftRef.current[idx - 1];
      if (Math.abs(evtEndMin(prev) - evtStartMin(curr)) <= 1) neighborIdx = idx - 1;
    }
    setDrag({ kind: 'resize', handle, idx, neighborIdx, startY: e.clientY,
              origEvents: draftRef.current.map(ev => ({ ...ev })) });
  };

  const startOrder = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    const rect   = containerRef.current!.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const evTop  = toTop(draftRef.current[idx].h, draftRef.current[idx].m);
    ghostYRef.current = evTop;
    setGhostY(evTop);
    setDrag({ kind: 'order', idx, dragOffset: mouseY - evTop,
              origEvents: draftRef.current.map(ev => ({ ...ev })) });
  };

  // ─── Drop indicator Y (computed inline during order drag) ─────────────────

  let indicatorY = -1;
  if (drag?.kind === 'order') {
    const others      = drag.origEvents.filter((_, i) => i !== drag.idx);
    const ghostCenter = ghostY + toH(drag.origEvents[drag.idx].dur) / 2;
    let insertIdx     = others.length;
    for (let i = 0; i < others.length; i++) {
      if (ghostCenter < toTop(others[i].h, others[i].m) + toH(others[i].dur) / 2) {
        insertIdx = i; break;
      }
    }
    if (others.length > 0) {
      if (insertIdx === 0)
        indicatorY = toTop(others[0].h, others[0].m);
      else if (insertIdx >= others.length)
        indicatorY = toTop(others[others.length - 1].h, others[others.length - 1].m)
                   + toH(others[others.length - 1].dur);
      else
        indicatorY = toTop(others[insertIdx].h, others[insertIdx].m);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const isToday    = viewDay === todayJs;
  const showNeedle = isToday && now.getHours() >= START && now.getHours() < END;
  const needleTop  = showNeedle
    ? toTop(now.getHours(), now.getMinutes() + now.getSeconds() / 60)
    : null;

  return (
    <div ref={containerRef} className="tl-rel" style={{ height: (END - START) * PX }}>

      {HOUR_LINES.map(h => (
        <div key={h} style={{ position:'absolute', top:(h-START)*PX, left:'-3rem', right:0, pointerEvents:'none' }}>
          <span style={{ position:'absolute', left:0, top:1, fontSize:12, color:'rgba(240,237,232,0.2)', letterSpacing:'0.04em', whiteSpace:'nowrap' }}>
            {h}:00
          </span>
          <div style={{ position:'absolute', left:'3rem', right:0, top:0, height:1, background:'rgba(255,255,255,0.05)' }} />
        </div>
      ))}

      {draft.map((e, i) => {
        const col      = C[e.type];
        const isActive = isToday && nowMin >= evtStartMin(e) && nowMin < evtEndMin(e);

        const isGhost    = drag?.kind === 'order' && drag.idx === i;
        const isResizing = drag?.kind === 'resize' && (drag.idx === i || drag.neighborIdx === i);
        const isDimmed   = drag?.kind === 'order' && drag.idx !== i;

        return (
          <div
            key={e.id ?? i}
            className={[
              'evt-block',
              isActive   ? 'active-block' : '',
              isGhost    ? 'is-ghost'     : '',
              isResizing ? 'is-resizing'  : '',
              isDimmed   ? 'is-dimmed'    : '',
            ].join(' ').trim()}
            style={{
              top:             isGhost ? ghostY : toTop(e.h, e.m),
              height:          Math.max(toH(e.dur) - 3, 20),
              background:      col.bg,
              borderLeftColor: col.border,
            }}
            onMouseDown={ev => startOrder(ev, i)}
          >
            <div className="resize-handle resize-handle-top"
                 onMouseDown={ev => startResize(ev, 'top', i)} />
            <div className="evt-name" style={{ color: col.text }}>{e.label}</div>
            <div className="evt-time" style={{ color: col.text }}>{fmt(e.h, e.m, e.dur)}</div>
            <div className="resize-handle resize-handle-bottom"
                 onMouseDown={ev => startResize(ev, 'bottom', i)} />
          </div>
        );
      })}

      {drag?.kind === 'order' && indicatorY >= 0 && (
        <div className="drop-indicator" style={{ top: indicatorY }} />
      )}

      {showNeedle && needleTop !== null && (
        <div className="needle" style={{ top: needleTop }} />
      )}
    </div>
  );
};

export default Timeline;
