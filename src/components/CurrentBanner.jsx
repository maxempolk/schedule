import { C } from '../data';
import { evtEndMin } from '../utils';

export default function CurrentBanner({ curEvt, nowMin }) {
  let taskText  = 'Вне расписания';
  let taskColor = 'var(--muted)';
  let untilText = '';

  if (curEvt) {
    const rem = evtEndMin(curEvt) - nowMin;
    const rh  = Math.floor(rem / 60);
    const rm  = rem % 60;
    untilText = rh > 0 ? `ещё ${rh}ч ${rm}мин` : `ещё ${rm} мин`;
    taskText  = curEvt.label;
    taskColor = C[curEvt.type].text;
  }

  return (
    <div className="current-banner">
      <div className="now-dot" />
      <span className="now-label">Сейчас</span>
      <span className="now-task" style={{ color: taskColor }}>{taskText}</span>
      <span className="now-until">{untilText}</span>
    </div>
  );
}
