import { FC } from 'react';
import { pad2 } from '../utils';

interface HeaderProps {
  now: Date;
}

const Header: FC<HeaderProps> = ({ now }) => {
  const dateStr = now.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <header>
      <div className="header-left">
        <h1>Моё расписание</h1>
        <div className="sub">{dateStr}</div>
      </div>
      <div className="clock">
        {pad2(now.getHours())}:{pad2(now.getMinutes())}:{pad2(now.getSeconds())}
      </div>
    </header>
  );
};

export default Header;
