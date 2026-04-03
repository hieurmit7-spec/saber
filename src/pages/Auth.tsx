import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function Auth() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already logged in via local storage
    if (localStorage.getItem('fern_user_id')) {
      navigate('/');
    }
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return toast.error('Vui lòng nhập tên đăng nhập và mật khẩu');
    
    setLoading(true);

    if (isLogin) {
      // Đăng nhập: Tìm trong bảng players
      const { data, error } = await supabase
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
        // Refresh page to trigger App.tsx logic
        window.location.href = '/';
      }
    } else {
      // Đăng ký: Tạo mới trong bảng players
      // Lưu ý: pass plaintext chỉ để demo, thực tế nên dùng backend hash.
      const { data: existingUser } = await supabase
        .from('players')
        .select('id')
        .eq('username', username)
        .single();

      if (existingUser) {
        toast.error('Tên đăng nhập đã tồn tại!');
      } else {
        const { data: newUser, error: insertError } = await supabase
          .from('players')
          .insert([{ username, password }])
          .select()
          .single();

        if (insertError) {
          toast.error('Lỗi khi tạo tài khoản');
        } else if (newUser) {
          localStorage.setItem('fern_user_id', newUser.id);
          toast.success('Đăng ký thành công!');
          window.location.href = '/';
        }
      }
    }
    setLoading(false);
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-sm p-8 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl">
        <h1 className="text-2xl font-bold text-center text-white mb-6">
          DỰ ÁN FERN
        </h1>
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Tên Đăng Nhập</label>
            <Input 
              autoFocus
              className="bg-zinc-800 border-zinc-700 text-white" 
              placeholder="VD: saber123" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
            />
          </div>
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Mật Khẩu</label>
            <Input 
              type="password" 
              className="bg-zinc-800 border-zinc-700 text-white" 
              placeholder="********" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
          </div>
          <Button disabled={loading} type="submit" className="w-full font-bold">
            {loading ? 'Đang xử lý...' : isLogin ? 'Đăng Nhập' : 'Tạo Tài Khoản'}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <button 
            type="button" 
            className="text-sm text-zinc-500 hover:text-white transition-colors"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
}
