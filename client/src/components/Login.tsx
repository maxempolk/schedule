import { FC, useState, FormEvent } from 'react';
import { login } from '../auth';

interface LoginProps {
  onSuccess: () => void;
}

const Login: FC<LoginProps> = ({ onSuccess }) => {
  const [loginVal, setLoginVal]   = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(loginVal, password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="login-box" onSubmit={handleSubmit}>
        <h2 className="login-title">Расписание</h2>
        <div className="login-fields">
          <input
            className="login-field"
            type="text"
            placeholder="Логин"
            autoComplete="username"
            autoFocus
            value={loginVal}
            onChange={e => setLoginVal(e.target.value)}
            disabled={loading}
          />
          <input
            className="login-field"
            type="password"
            placeholder="Пароль"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>
        {error && <div className="login-error">{error}</div>}
        <button className="login-btn" type="submit" disabled={loading || !loginVal || !password}>
          {loading ? 'Вход…' : 'Войти'}
        </button>
      </form>
    </div>
  );
};

export default Login;
