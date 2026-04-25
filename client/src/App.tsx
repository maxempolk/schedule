import { useState, useEffect, useRef, FC } from 'react';
import { tryRefresh } from './auth';
import { fetchSchedule, type Schedule } from './api';
import { evtStartMin, evtEndMin, playBell } from './utils';
import Header from './components/Header';
import CurrentBanner from './components/CurrentBanner';
import DayNav from './components/DayNav';
import Sidebar from './components/Sidebar';
import Timeline from './components/Timeline';
import Login from './components/Login';

type AuthState = 'checking' | 'login' | 'app';

const App: FC = () => {
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [viewDay, setViewDay]     = useState<number>(() => new Date().getDay());
  const [now, setNow]             = useState<Date>(() => new Date());
  const [schedule, setSchedule]   = useState<Schedule>({});
  const [loading, setLoading]     = useState(true);
  const lastLabelRef              = useRef<string | null>(null);

  // Restore session silently on startup
  useEffect(() => {
    tryRefresh().then(ok => setAuthState(ok ? 'app' : 'login'));
  }, []);

  // Session expired mid-use
  useEffect(() => {
    const handler = () => setAuthState('login');
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, []);

  // Fetch schedule once authenticated
  useEffect(() => {
    if (authState !== 'app') return;
    setLoading(true);
    fetchSchedule()
      .then(setSchedule)
      .catch(() => setAuthState('login'))
      .finally(() => setLoading(false));
  }, [authState]);

  // Clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Unlock AudioContext on first click
  useEffect(() => {
    document.addEventListener(
      'click',
      () => { try { new (window.AudioContext || (window as any).webkitAudioContext)(); } catch {} },
      { once: true }
    );
  }, []);

  const todayJs   = now.getDay();
  const nowMin    = now.getHours() * 60 + now.getMinutes();
  const todayEvts = schedule[todayJs] ?? [];
  const curEvt    = todayEvts.find(e => nowMin >= evtStartMin(e) && nowMin < evtEndMin(e)) ?? null;

  // Bell on event transition (must be before early returns)
  useEffect(() => {
    if (!curEvt) { lastLabelRef.current = null; return; }
    if (lastLabelRef.current !== null && lastLabelRef.current !== curEvt.label) playBell();
    lastLabelRef.current = curEvt.label;
  }, [curEvt?.label]);

  // ─── Render gates ─────────────────────────────────────────────────────────

  if (authState === 'checking' || (authState === 'app' && loading)) {
    return <div className="app-loading">Загрузка…</div>;
  }

  if (authState === 'login') {
    return <Login onSuccess={() => setAuthState('app')} />;
  }

  const viewEvents = schedule[viewDay] ?? [];

  return (
    <>
      <Header now={now} />
      <CurrentBanner curEvt={curEvt} nowMin={nowMin} />
      <DayNav viewDay={viewDay} setViewDay={setViewDay} todayJs={todayJs} />
      <div className="main">
        <Sidebar viewDay={viewDay} events={viewEvents} />
        <section className="timeline">
          <Timeline viewDay={viewDay} todayJs={todayJs} now={now} nowMin={nowMin} events={viewEvents} />
        </section>
      </div>
    </>
  );
};

export default App;
