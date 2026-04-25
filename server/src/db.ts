import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(__dirname, '..', 'schedule.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    day   INTEGER NOT NULL,
    h     INTEGER NOT NULL,
    m     INTEGER NOT NULL,
    dur   REAL    NOT NULL,
    label TEXT    NOT NULL,
    type  TEXT    NOT NULL
  )
`);

interface SeedRow {
  day: number; h: number; m: number; dur: number; label: string; type: string;
}

const { count } = db.prepare('SELECT COUNT(*) as count FROM events').get() as { count: number };

if (count === 0) {
  const ins = db.prepare('INSERT INTO events (day,h,m,dur,label,type) VALUES (@day,@h,@m,@dur,@label,@type)');
  const seedAll = db.transaction((rows: SeedRow[]) => { for (const r of rows) ins.run(r); });

  seedAll([
    // Пн (1)
    { day:1, h:7,  m:30, dur:1,   label:'Подъём + утро',          type:'rest'    },
    { day:1, h:8,  m:30, dur:5.5, label:'Курсы (норвежский)',      type:'courses' },
    { day:1, h:14, m:0,  dur:0.5, label:'Обед / пауза',            type:'rest'    },
    { day:1, h:14, m:30, dur:1,   label:'Быт / готовка',           type:'home'    },
    { day:1, h:15, m:30, dur:1.5, label:'Спорт',                   type:'sport'   },
    { day:1, h:17, m:0,  dur:2,   label:'Буфер / отдых',           type:'rest'    },
    { day:1, h:19, m:0,  dur:1,   label:'Английский (репетитор)',  type:'eng'     },
    { day:1, h:20, m:0,  dur:2,   label:'Программирование',        type:'code'    },
    { day:1, h:22, m:0,  dur:1,   label:'Завершение дня',          type:'rest'    },
    // Вт (2)
    { day:2, h:7,  m:30, dur:1,   label:'Подъём + утро',          type:'rest'    },
    { day:2, h:8,  m:30, dur:5.5, label:'Курсы (норвежский)',      type:'courses' },
    { day:2, h:14, m:0,  dur:0.5, label:'Обед / пауза',            type:'rest'    },
    { day:2, h:14, m:30, dur:1,   label:'Английский (самост.)',    type:'eng'     },
    { day:2, h:15, m:30, dur:1,   label:'Быт / готовка',           type:'home'    },
    { day:2, h:16, m:30, dur:1.5, label:'Буфер / отдых',           type:'rest'    },
    { day:2, h:18, m:0,  dur:1,   label:'Дима (ученик)',           type:'student' },
    { day:2, h:19, m:0,  dur:2.5, label:'Программирование',        type:'code'    },
    { day:2, h:21, m:30, dur:1.5, label:'Завершение дня',          type:'rest'    },
    // Ср (3)
    { day:3, h:7,  m:30, dur:1,   label:'Подъём + утро',          type:'rest'    },
    { day:3, h:8,  m:30, dur:5.5, label:'Курсы (норвежский)',      type:'courses' },
    { day:3, h:14, m:0,  dur:0.5, label:'Обед / пауза',            type:'rest'    },
    { day:3, h:14, m:30, dur:1,   label:'Быт / готовка',           type:'home'    },
    { day:3, h:15, m:30, dur:1.5, label:'Буфер / отдых',           type:'rest'    },
    { day:3, h:17, m:0,  dur:2,   label:'Программирование',        type:'code'    },
    { day:3, h:19, m:0,  dur:1,   label:'Английский (репетитор)',  type:'eng'     },
    { day:3, h:20, m:0,  dur:2,   label:'Программирование',        type:'code'    },
    { day:3, h:22, m:0,  dur:1,   label:'Завершение дня',          type:'rest'    },
    // Чт (4)
    { day:4, h:7,  m:30, dur:1,   label:'Подъём + утро',          type:'rest'    },
    { day:4, h:8,  m:30, dur:5.5, label:'Курсы (норвежский)',      type:'courses' },
    { day:4, h:14, m:0,  dur:0.5, label:'Обед / пауза',            type:'rest'    },
    { day:4, h:14, m:30, dur:1,   label:'Английский (самост.)',    type:'eng'     },
    { day:4, h:15, m:30, dur:1,   label:'Быт / готовка',           type:'home'    },
    { day:4, h:16, m:30, dur:2.5, label:'Буфер / отдых',           type:'rest'    },
    { day:4, h:19, m:0,  dur:1,   label:'Таня (ученица)',          type:'student' },
    { day:4, h:20, m:0,  dur:2,   label:'Программирование',        type:'code'    },
    { day:4, h:22, m:0,  dur:1,   label:'Завершение дня',          type:'rest'    },
    // Пт (5)
    { day:5, h:7,  m:30, dur:1,   label:'Подъём + утро',          type:'rest'    },
    { day:5, h:8,  m:30, dur:5.5, label:'Курсы (норвежский)',      type:'courses' },
    { day:5, h:14, m:0,  dur:0.5, label:'Обед / пауза',            type:'rest'    },
    { day:5, h:14, m:30, dur:1,   label:'Английский (самост.)',    type:'eng'     },
    { day:5, h:15, m:30, dur:1,   label:'Быт / готовка',           type:'home'    },
    { day:5, h:16, m:30, dur:1.5, label:'Спорт',                   type:'sport'   },
    { day:5, h:18, m:0,  dur:2,   label:'Программирование',        type:'code'    },
    { day:5, h:20, m:0,  dur:1,   label:'Анастасия (ученица)',     type:'student' },
    { day:5, h:21, m:0,  dur:1,   label:'Буфер / отдых',           type:'rest'    },
    { day:5, h:22, m:0,  dur:1,   label:'Завершение дня',          type:'rest'    },
    // Сб (6)
    { day:6, h:9,  m:0,  dur:1,   label:'Подъём + утро',          type:'rest'    },
    { day:6, h:10, m:0,  dur:3,   label:'Диплом / универ',         type:'diploma' },
    { day:6, h:13, m:0,  dur:1,   label:'Обед / отдых',            type:'rest'    },
    { day:6, h:14, m:0,  dur:3.5, label:'Программирование',        type:'code'    },
    { day:6, h:17, m:30, dur:1,   label:'Быт / готовка',           type:'home'    },
    { day:6, h:18, m:30, dur:2,   label:'Свободное время',         type:'rest'    },
    { day:6, h:20, m:30, dur:1.5, label:'Программирование',        type:'code'    },
    { day:6, h:22, m:0,  dur:1,   label:'Завершение дня',          type:'rest'    },
    // Вс (0)
    { day:0, h:9,  m:0,  dur:1.5, label:'Подъём + утро',          type:'rest'    },
    { day:0, h:10, m:30, dur:2.5, label:'Диплом / универ',         type:'diploma' },
    { day:0, h:13, m:0,  dur:1,   label:'Обед / отдых',            type:'rest'    },
    { day:0, h:14, m:0,  dur:3,   label:'Программирование',        type:'code'    },
    { day:0, h:17, m:0,  dur:2,   label:'Свободное время',         type:'rest'    },
    { day:0, h:19, m:0,  dur:1.5, label:'Диплом / универ',         type:'diploma' },
    { day:0, h:20, m:30, dur:1.5, label:'Программирование',        type:'code'    },
    { day:0, h:22, m:0,  dur:1,   label:'Подготовка к неделе',     type:'home'    },
  ]);
}

export default db;
