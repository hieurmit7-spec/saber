import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Auth() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('fern_user_id')) navigate('/');
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return toast.error('Vui lòng điền đầy đủ thông tin');
    setLoading(true);

    if (isLogin) {
      const { data, error } = await (supabase as any)
        .from('players')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !data) {
        toast.error('Sai tài khoản hoặc mật khẩu');
      } else {
        localStorage.setItem('fern_user_id', data.id);
        toast.success('Đăng nhập thành công!');
        window.location.href = '/';
      }
    } else {
      const { data: existingUser } = await (supabase as any)
        .from('players')
        .select('id')
        .eq('username', username)
        .single();

      if (existingUser) {
        toast.error('Tên đăng nhập đã tồn tại!');
      } else {
        const { data: newUserId, error: insertError } = await (supabase as any).rpc('rpc_register_player', {
          p_username: username,
          p_password: password,
        });

        if (insertError) {
          toast.error('Lỗi khi tạo tài khoản: ' + insertError.message);
        } else if (newUserId) {
          localStorage.setItem('fern_user_id', newUserId as string);
          toast.success('Tài khoản đã được tạo! Saber đã được mở khoá.');
          window.location.href = '/';
        }
      }
    }
    setLoading(false);
  };

  return (
    <div className="w-full h-screen bg-black text-white font-sans flex overflow-hidden">

      {/* Left panel — decorative */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-end p-16 overflow-hidden">
        <video
          autoPlay loop muted playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale"
          style={{ transform: 'scaleX(-1)' }}
        >
          <source src="/videos/spring-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />

        <div className="relative z-20">
          <h1 className="text-8xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-amber-200 to-amber-600 leading-none">
            FERN
          </h1>
          <p className="text-zinc-500 uppercase tracking-[0.4em] text-sm mt-3">Saber's Legacy · Turn-Based RPG</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 relative border-l border-white/5">

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="w-full max-w-sm relative z-10">

          {/* Mobile title */}
          <div className="lg:hidden mb-10">
            <h1 className="text-5xl font-black uppercase tracking-tight text-white">FERN</h1>
            <p className="text-zinc-600 text-xs uppercase tracking-widest mt-1">Saber's Legacy</p>
          </div>

          {/* Mode switcher */}
          <div className="flex mb-10 border-b border-white/10">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 pb-3 text-xs font-black uppercase tracking-[0.3em] transition-colors border-b-2 -mb-px ${
                isLogin ? 'border-amber-500 text-amber-400' : 'border-transparent text-zinc-600 hover:text-zinc-400'
              }`}
            >
              Đăng Nhập
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 pb-3 text-xs font-black uppercase tracking-[0.3em] transition-colors border-b-2 -mb-px ${
                !isLogin ? 'border-amber-500 text-amber-400' : 'border-transparent text-zinc-600 hover:text-zinc-400'
              }`}
            >
              Tạo Tài Khoản
            </button>
          </div>

          <form onSubmit={handleAuth} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold">
                Tên Đăng Nhập
              </label>
              <input
                autoFocus
                autoComplete="username"
                className="bg-transparent border border-white/10 focus:border-amber-500/60 outline-none px-4 py-3 text-white text-sm tracking-wide transition-colors placeholder:text-zinc-700"
                placeholder="VD: saber123"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold">
                Mật Khẩu
              </label>
              <input
                type="password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                className="bg-transparent border border-white/10 focus:border-amber-500/60 outline-none px-4 py-3 text-white text-sm tracking-wide transition-colors placeholder:text-zinc-700"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-[0.3em] py-4 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang Xử Lý...' : isLogin ? 'Đăng Nhập' : 'Tạo Tài Khoản'}
            </button>
          </form>

          {!isLogin && (
            <p className="mt-6 text-[11px] text-zinc-600 leading-relaxed text-center">
              Tài khoản mới sẽ tự động mở khoá nhân vật <span className="text-amber-500 font-bold">Saber</span> và nhận <span className="text-amber-500 font-bold">999,999,999 KC</span> để trải nghiệm.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
