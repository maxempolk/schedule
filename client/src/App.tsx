import { useState, useEffect, useRef, FC } from 'react';
import { SCH } from './data';
import { evtStartMin, evtEndMin, playBell, Event } from './utils';
import Header from './components/Header';
import CurrentBanner from './components/CurrentBanner';
import DayNav from './components/DayNav';
import Sidebar from './components/Sidebar';
import Timeline from './components/Timeline';

const App: FC = () => {
  const [viewDay, setViewDay] = useState<number>(() => new Date().getDay());
  const [now, setNow] = useState<Date>(() => new Date());
  const lastLabelRef = useRef<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.addEventListener(
      'click',
      () => {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          new AudioContextClass();
        } catch (e) {
          // Ignore
        }
      },
      { once: true }
    );
  }, []);

  const todayJs = now.getDay();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const curEvt = (SCH[todayJs] || []).find(
    e => nowMin >= evtStartMin(e) && nowMin < evtEndMin(e)
  ) ?? null;

  useEffect(() => {
    if (!curEvt) {
      lastLabelRef.current = null;
      return;
    }
    if (lastLabelRef.current !== null && lastLabelRef.current !== curEvt.label) playBell();
    lastLabelRef.current = curEvt.label;
  }, [curEvt?.label]);

  return (
    <>
      <Header now={now} />
      <CurrentBanner curEvt={curEvt} nowMin={nowMin} />
      <DayNav viewDay={viewDay} setViewDay={setViewDay} todayJs={todayJs} />
      <div className="main">
        <Sidebar viewDay={viewDay} />
        <section className="timeline">
          <Timeline viewDay={viewDay} todayJs={todayJs} now={now} nowMin={nowMin} />
        </section>
      </div>
    </>
  );
};

export default App;
