export const DAYS_RU = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
export const DAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

export type ColorType = 'courses' | 'eng' | 'student' | 'code' | 'sport' | 'home' | 'diploma' | 'rest';

interface ColorScheme {
  bg: string;
  border: string;
  text: string;
}

export const C: Record<ColorType, ColorScheme> = {
  courses: { bg: 'rgba(93,202,165,0.13)',  border: '#5DCAA5', text: '#9FE1CB' },
  eng:     { bg: 'rgba(239,159,39,0.13)',  border: '#EF9F27', text: '#FAC775' },
  student: { bg: 'rgba(133,183,235,0.13)', border: '#85B7EB', text: '#B5D4F4' },
  code:    { bg: 'rgba(175,169,236,0.15)', border: '#AFA9EC', text: '#CECBF6' },
  sport:   { bg: 'rgba(151,196,89,0.13)',  border: '#97C459', text: '#C0DD97' },
  home:    { bg: 'rgba(136,135,128,0.13)', border: '#888780', text: '#B4B2A9' },
  diploma: { bg: 'rgba(240,153,123,0.13)', border: '#F0997B', text: '#F5C4B3' },
  rest:    { bg: 'rgba(50,50,48,0.55)',    border: '#3a3a38', text: '#888780' },
};

export interface ScheduleEvent {
  id: number;
  day: number;
  h: number;
  m: number;
  dur: number;
  label: string;
  type: ColorType;
}
