import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Edit2, Check, X, Camera, Footprints, HardHat, Shield, Disc, GripHorizontal, Sparkles, LogOut, Star } from 'lucide-react';
import { usePlayer, useHydratedCharacters, useUpdateProfile } from '@/hooks/usePlayerData';
import { calculateCP, Equipment, getStarTier, getRealmTitle, getRealmStage } from '@/stores/gameStore';
import { EquipmentIcon } from '@/components/game/EquipmentIcon';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ─── CONSTANTS ──────────────────────────────────────────────────────────

const AVATAR_OPTIONS = [
  { id: 'default', url: 'default', type: 'text' },
  { id: 'av_1', url: '/Avt/19de17c09737a59c5684e14cbaccdfc1.jpg', type: 'image' },
  { id: 'av_2', url: '/Avt/43d81c067a07909cc974bd6c022d6322.jpg', type: 'image' },
  { id: 'av_3', url: '/Avt/693efabf3dba322093786917c259ec37.jpg', type: 'image' },
  { id: 'av_4', url: '/Avt/71f927f18e5eb66f7def141f98a9825a.jpg', type: 'image' },
  { id: 'av_5', url: '/Avt/7db746917849ae61438eaeddfd8c52c7.jpg', type: 'image' },
  { id: 'av_6', url: '/Avt/b9dcd62241c0ed183ed879db2a0cb8fd.jpg', type: 'image' },
  { id: 'av_7', url: '/Avt/f1970a8b5bdf920a2e1977a28e2e8c77.jpg', type: 'image' },
  { id: 'av_8', url: '/Avt/fe614419e2a238cf82863d770c618290.jpg', type: 'image' },
];

const FRAME_OPTIONS = [
  { id: 'none',        label: 'Không có',      style: 'border-white/20' },
  { id: 'gold',        label: 'Vàng Hoàng Gia', style: 'border-[#FFD700] shadow-[0_0_18px_rgba(255,215,0,0.6)]' },
  { id: 'red_fire',    label: 'Ngọn Lửa Đỏ',   style: 'border-red-500 shadow-[0_0_18px_rgba(239,68,68,0.7)]' },
  { id: 'blue_ice',    label: 'Băng Tuyết',     style: 'border-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.7)]' },
  { id: 'purple_void', label: 'Ma Vương Tím',   style: 'border-purple-500 shadow-[0_0_18px_rgba(168,85,247,0.7)]' },
];

const SLOT_META: { key: string; label: string; icon: React.ReactNode }[] = [
  { key: 'shoes',    label: 'Giày',    icon: <Footprints   className="w-4 h-4" /> },
  { key: 'hat',      label: 'Mũ',      icon: <HardHat      className="w-4 h-4" /> },
  { key: 'armor',    label: 'Giáp',    icon: <Shield       className="w-4 h-4" /> },
  { key: 'ring',     label: 'Nhẫn',    icon: <Disc         className="w-4 h-4" /> },
  { key: 'belt',     label: 'Đai',     icon: <GripHorizontal className="w-4 h-4" /> },
  { key: 'artifact', label: 'Bảo Vật', icon: <Sparkles     className="w-4 h-4" /> },
];

const RARITY_STYLES: Record<string, string> = {
  white:   'border-zinc-400  text-zinc-400',
  blue:    'border-blue-400  text-blue-400',
  purple:  'border-purple-400 text-purple-400',
  gold:    'border-yellow-400 text-yellow-400',
  red:     'border-red-500   text-red-500',
  rainbow: 'border-pink-400  text-pink-400',
};

// ─── COMPONENT ──────────────────────────────────────────────────────────

export default function PlayerProfileScreen() {
  const navigate = useNavigate();
  const { targetId } = useParams<{ targetId?: string }>();
  const myUserId = localStorage.getItem('fern_user_id') || '';
  const viewingId = targetId || myUserId;
  const isOwn = viewingId === myUserId;

  // Data hooks
  const { data: player, isLoading } = usePlayer(viewingId);
  const { characters: rawCharacters } = useHydratedCharacters(viewingId);
  const updateProfile = useUpdateProfile(myUserId);

  // Edit states (only used in own-profile mode)
  const [isEditingBio, setIsEditingBio]         = useState(false);
  const [isEditingName, setIsEditingName]        = useState(false);
  const [bioInput, setBioInput]                  = useState('');
  const [nameInput, setNameInput]                = useState('');
  const [isSelectorOpen, setIsSelectorOpen]      = useState(false);
  const [selectedAvatar, setSelectedAvatar]      = useState('default');
  const [selectedFrame, setSelectedFrame]        = useState('none');

  // Equipment inspection state
  const [inspectChar, setInspectChar] = useState<any>(null);

  useEffect(() => {
    if (player) {
      setBioInput(player.bio || 'Sinh mạng này ta hiến tế cho chiến trường.');
      setNameInput(player.username || '');
      setSelectedAvatar(player.avatar_url || 'default');
      setSelectedFrame(player.frame_url || 'none');
    }
  }, [player]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (_) { /* ignore */ }
    localStorage.removeItem('fern_user_id');
    toast.success('Bạn đã đăng xuất thành công!');
    window.location.href = '/auth';
  };

  if (isLoading) return (
    <div className="w-full h-screen bg-black flex items-center justify-center text-white">
      <div className="animate-pulse text-zinc-500 uppercase tracking-widest text-sm">Loading Profile...</div>
    </div>
  );

  // ── handlers ──

  const handleSaveBio = () => {
    const wordCount = bioInput.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 200) { toast.error('Tiểu sử không được vượt quá 200 từ!'); return; }
    updateProfile.mutate({ username: nameInput, bio: bioInput, avatarUrl: selectedAvatar, frameUrl: selectedFrame });
    setIsEditingBio(false);
  };

  const handleSaveName = () => {
    if (!nameInput.trim()) { toast.error('Tên không được để trống!'); return; }
    updateProfile.mutate({ username: nameInput.trim(), bio: bioInput, avatarUrl: selectedAvatar, frameUrl: selectedFrame });
    setIsEditingName(false);
  };

  const handleSaveVisuals = () => {
    updateProfile.mutate({ username: nameInput, bio: bioInput, avatarUrl: selectedAvatar, frameUrl: selectedFrame });
    setIsSelectorOpen(false);
  };

  const handleCancelVisuals = () => {
    setSelectedAvatar(player?.avatar_url || 'default');
    setSelectedFrame(player?.frame_url || 'none');
    setIsSelectorOpen(false);
  };

  // ── computed ──

  const currentFrameStyle = FRAME_OPTIONS.find(f => f.id === (player?.frame_url || 'none'))?.style || 'border-white/10';
  const displayAvatarUrl  = player?.avatar_url && player.avatar_url !== 'default' ? player.avatar_url : null;
  const usernameInitials  = player?.username?.substring(0, 2).toUpperCase() || '??';

  // Decode team_setup from DB into hydrated character list
  const teamSlots: (any | null)[] = [null, null, null, null, null];
  if (player?.team_setup && Array.isArray(player.team_setup)) {
    player.team_setup.forEach((charId: string | null, idx: number) => {
      if (charId && idx < 5) teamSlots[idx] = rawCharacters.find(c => c.id === charId) || null;
    });
  }

  // ── sub-components ──

  const AvatarDisplay = () => (
    <div
      className={`relative w-36 h-36 bg-zinc-900 border-4 rounded-full flex items-center justify-center overflow-hidden mb-6 transition-transform ${isOwn ? 'cursor-pointer hover:scale-105 group' : ''} ${currentFrameStyle}`}
      onClick={() => isOwn && setIsSelectorOpen(true)}
    >
      {displayAvatarUrl
        ? <img src={displayAvatarUrl} className="w-full h-full object-cover" />
        : <span className="font-black text-5xl text-amber-500/50">{usernameInitials}</span>
      }
      {isOwn && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
          <Camera className="w-8 h-8 text-white" />
        </div>
      )}
    </div>
  );

  const TeamSlot = ({ char, idx }: { char: any | null; idx: number }) => {
    if (!char) return (
      <div key={`slot-${idx}`} className="w-28 h-28 border-2 border-zinc-800 bg-zinc-900/50 flex items-center justify-center rounded-lg">
        <span className="text-zinc-700 font-bold text-[10px] tracking-widest uppercase">Trống</span>
      </div>
    );

    const cp = calculateCP(char);
    const currentTier = getStarTier(char.stars);
    const minStar = currentTier.range[0];
    const tierStarCount = char.stars - minStar + 1;
    const tierColor = currentTier.color || currentTier.colors?.[0] || '#fff';

    return (
      <div
        key={`slot-${idx}`}
        onClick={() => setInspectChar(char)}
        className="w-28 h-28 border-2 flex items-center justify-center relative overflow-hidden rounded-lg transition-all border-amber-500/80 bg-black cursor-pointer hover:scale-105 hover:border-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]"
      >
        <img
          src={char.id === 'sasuke' ? '/videos/sasuke.gif' : char.id === 'saber' ? '/videos/saber-avatar.gif' : ''}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        <div className="absolute bottom-1 left-0 w-full text-center">
          <div className="text-[10px] font-black uppercase drop-shadow-md truncate px-1 text-white">{char.name}</div>
          <div className="text-[8px] text-amber-500 font-bold">CP {cp.toLocaleString()}</div>
        </div>

        {/* Tiered Star Display */}
        <div className="absolute top-1 right-1 flex gap-0.5">
          {Array.from({ length: Math.min(5, tierStarCount) }).map((_, i) => (
             <Star 
                key={i} 
                className="w-2 h-2" 
                style={{ fill: tierColor, color: tierColor, filter: `drop-shadow(0 0 2px ${tierColor})` }} 
             />
          ))}
        </div>

        <div className="absolute top-1 left-1 text-[8px] font-bold text-zinc-100 bg-black/60 px-1 border border-white/10 rounded">Lv{char.level}</div>
      </div>
    );
  };

  // ── render ──

  return (
    <div className="w-full h-screen bg-zinc-950 font-sans text-white overflow-hidden flex flex-col relative">
      {/* Background */}
      <div className="absolute inset-0 z-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-amber-950/10 via-zinc-950 to-zinc-950" />

      {/* Header */}
      <div className="p-6 pb-4 flex justify-between items-center z-10 border-b border-white/5">
        <button onClick={() => navigate(-1)} className="text-zinc-500 hover:text-white uppercase tracking-widest text-xs font-bold transition-colors flex items-center gap-2">
          <ChevronLeft className="w-4 h-4" /> Trở Về
        </button>
        <div className="text-center">
          <h1 className="text-xl font-black uppercase tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
            {isOwn ? 'Hồ Sơ Của Bạn' : 'Hồ Sơ Chiến Binh'}
          </h1>
        </div>
        {isOwn ? (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Đăng Xuất
          </button>
        ) : (
          <div className="w-24" />
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex justify-center gap-6 px-8 py-6 z-10 w-full max-w-7xl mx-auto overflow-y-auto custom-scrollbar">

        {/* ── Left: Avatar / Name / Bio ── */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-4">
          <div className="bg-black/50 border border-white/10 backdrop-blur-md rounded-xl flex flex-col items-center p-8">

            <AvatarDisplay />

            {/* Username */}
            {isEditingName ? (
              <div className="flex flex-col items-center gap-3 mb-2 w-full">
                <input
                  className="w-full bg-zinc-900 border-2 border-amber-500/60 focus:border-amber-400 text-xl font-bold text-center text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  maxLength={20}
                  autoFocus
                  placeholder="Nhập tên mới..."
                />
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => { setIsEditingName(false); setNameInput(player?.username || ''); }}
                    className="flex-1 py-2 rounded border border-white/20 bg-white/5 hover:bg-white/10 text-red-400 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-3.5 h-3.5" /> Hủy
                  </button>
                  <button
                    onClick={handleSaveName}
                    disabled={updateProfile.isPending}
                    className="flex-1 py-2 rounded border border-amber-500 bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-50 text-amber-400 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-3.5 h-3.5" /> {updateProfile.isPending ? 'Lưu...' : 'Lưu Tên'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1 group">
                <h2 className="text-2xl font-black text-white">{player?.username}</h2>
                {isOwn && (
                  <button onClick={() => setIsEditingName(true)}
                    className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-amber-400">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <div className="text-amber-500 font-bold tracking-widest text-xs uppercase mb-4">
              Rank {player?.pvp_rank_level} · ⭐ {player?.pvp_stars} Sao
            </div>

            {/* Bio */}
            <div className="w-full border-t border-white/10 pt-4 relative">
              {isEditingBio ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    className="w-full bg-zinc-900 border border-amber-500/50 rounded-lg p-3 text-sm text-zinc-300 resize-none h-24 focus:outline-none"
                    value={bioInput}
                    onChange={e => setBioInput(e.target.value)}
                    placeholder="Viết gì đó về bạn..."
                  />
                  <div className="text-[10px] text-zinc-600 text-right">
                    {bioInput.trim().split(/\s+/).filter(Boolean).length} / 200 từ
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setIsEditingBio(false); setBioInput(player?.bio || ''); }}
                      className="p-2 border border-white/20 hover:bg-white/10 rounded text-red-400">
                      <X className="w-4 h-4" />
                    </button>
                    <button onClick={handleSaveBio} disabled={updateProfile.isPending}
                      className="p-2 border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/30 rounded text-amber-500">
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="group relative">
                  <p className="text-sm text-zinc-400 italic text-center px-2 leading-relaxed">
                    "{player?.bio || 'Chưa có tiểu sử.'}"
                  </p>
                  {isOwn && (
                    <button onClick={() => setIsEditingBio(true)}
                      className="absolute -top-1 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-amber-400">
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Team ── */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-black/50 border border-white/10 backdrop-blur-md rounded-xl p-8 flex-1 relative">

            {/* Header row */}
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-black uppercase text-amber-500 tracking-widest border-b border-amber-500/20 pb-1">
                Đội Hình Phòng Thủ
              </h3>
              <div className="text-right">
                <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Tổng Lực Chiến</div>
                <div className="text-3xl font-black text-white tabular-nums">{player?.combat_power?.toLocaleString() || '—'}</div>
              </div>
            </div>

            {/* Team grid */}
            <div className="flex flex-col items-center gap-8 mt-4">
              <div className="grid grid-cols-2 gap-6 w-fit">
                {[0, 1].map(i => <TeamSlot key={i} char={teamSlots[i]} idx={i} />)}
              </div>
              <div className="grid grid-cols-3 gap-6 w-fit">
                {[2, 3, 4].map(i => <TeamSlot key={i} char={teamSlots[i]} idx={i} />)}
              </div>
            </div>

            {isOwn && (
              <div className="absolute bottom-6 right-6">
                <button onClick={() => navigate('/team')}
                  className="px-5 py-2 border border-zinc-600 text-zinc-400 text-xs font-bold uppercase tracking-widest hover:border-amber-500 hover:text-amber-500 transition-colors rounded">
                  ✎ Cấu Hình
                </button>
              </div>
            )}

            <p className="text-center text-zinc-700 text-xs mt-8 uppercase tracking-widest">
              Nhấn vào tướng để xem trang bị
            </p>
          </div>
        </div>
      </div>

      {/* ── MODAL: Avatar/Frame Selector ── */}
      {isSelectorOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center animate-in fade-in duration-200">
          <div className="w-[780px] bg-zinc-950 border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-zinc-900">
              <h2 className="text-lg font-black uppercase text-amber-500 tracking-widest">Tùy Chỉnh Diện Mạo</h2>
              <button onClick={handleCancelVisuals}><X className="text-zinc-500 hover:text-white w-5 h-5" /></button>
            </div>

            <div className="p-8 flex flex-col gap-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
              {/* Avatar Picker */}
              <div>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Hình Đại Diện</h3>
                <div className="flex flex-wrap gap-4">
                  {AVATAR_OPTIONS.map(opt => {
                    const selected = selectedAvatar === opt.url || (selectedAvatar === 'default' && opt.id === 'default');
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedAvatar(opt.url)}
                        className={`w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center cursor-pointer border-[3px] transition-all overflow-hidden ${selected ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-110' : 'border-white/10 hover:border-white/40'}`}
                      >
                        {opt.type === 'image'
                          ? <img src={opt.url} className="w-full h-full object-cover" />
                          : <span className="font-black text-2xl text-amber-500/50">{usernameInitials}</span>
                        }
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Frame Picker */}
              <div>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Khung Viền</h3>
                <div className="flex flex-wrap gap-6">
                  {FRAME_OPTIONS.map(opt => {
                    const isSelected = selectedFrame === opt.id;
                    return (
                      <div key={opt.id} className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => setSelectedFrame(opt.id)}>
                        <div className="relative w-20 h-20">
                          <div className={`absolute inset-0 rounded-full border-[4px] transition-all ${opt.style} ${isSelected ? 'opacity-100 scale-110' : 'opacity-40 hover:opacity-75'}`} />
                          <div className="absolute inset-[6px] rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center">
                            {selectedAvatar !== 'default'
                              ? <img src={selectedAvatar} className="w-full h-full object-cover opacity-60 grayscale" />
                              : <span className="font-black text-lg text-zinc-600">{usernameInitials}</span>}
                          </div>
                          {isSelected && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-black" /></div>}
                        </div>
                        <span className={`text-[10px] uppercase tracking-widest font-bold ${isSelected ? 'text-amber-400' : 'text-zinc-600'}`}>{opt.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-white/5 flex justify-end bg-zinc-900">
              <button onClick={handleSaveVisuals} disabled={updateProfile.isPending}
                className="px-8 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 font-bold uppercase tracking-widest text-sm rounded transition-colors">
                {updateProfile.isPending ? 'Đang Lưu...' : 'Xác Nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Equipment Inspection ── */}
      {inspectChar && (() => {
        const currentTier = getStarTier(inspectChar.stars);
        const realmTitle = getRealmTitle(inspectChar.level);
        const realmStage = getRealmStage(inspectChar.level);
        const minStar = currentTier.range[0];
        const tierStarCount = inspectChar.stars - minStar + 1;
        const totalTierStars = currentTier.range[1] - currentTier.range[0] + 1;

        return (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center animate-in fade-in duration-200" onClick={() => setInspectChar(null)}>
            <div className="w-[520px] bg-zinc-950 border border-white/10 rounded-xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-white/5 bg-zinc-900 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500/50">
                    <img
                      src={inspectChar.id === 'sasuke' ? '/videos/sasuke.gif' : inspectChar.id === 'saber' ? '/videos/saber-avatar.gif' : ''}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-black uppercase tracking-widest text-white">{inspectChar.name}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                       <span className={`text-[9px] font-black uppercase ${realmStage.color}`}>{realmStage.label}</span>
                       <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest">{realmTitle} (Lv.{inspectChar.level})</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setInspectChar(null)}><X className="text-zinc-500 hover:text-white w-5 h-5" /></button>
              </div>

              {/* Star Tier Bar in Inspection */}
              <div className="bg-white/5 px-6 py-3 border-b border-white/5 flex items-center justify-between">
                <div className="flex gap-1.5">
                  {Array.from({ length: totalTierStars }).map((_, i) => {
                    const isActive = i < tierStarCount;
                    let starColor = currentTier.color || (currentTier.colors ? currentTier.colors[i % currentTier.colors.length] : '#fff');
                    return (
                      <Star key={i} className="w-4 h-4" 
                        style={{ color: isActive ? starColor : '#1f2937', fill: isActive ? starColor : 'transparent', filter: isActive ? `drop-shadow(0 0 3px ${starColor})` : 'none' }} 
                      />
                    );
                  })}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: currentTier.color || '#fff' }}>{currentTier.label} {tierStarCount}/{totalTierStars}</span>
              </div>

              {/* Equipment List */}
              <div className="p-6 flex flex-col gap-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Trang Bị Của Tướng</h3>
                {SLOT_META.map(slot => {
                  const eq: Equipment | null = inspectChar.equipment?.[slot.key] || null;
                  return (
                    <div key={slot.key} className={`flex items-center gap-4 p-3 rounded-lg border ${eq ? `bg-black/60 ${RARITY_STYLES[eq.rarity]?.split(' ')[0] || 'border-zinc-700'}` : 'border-zinc-800 bg-zinc-900/30'}`}>
                      <div className="relative">
                        <EquipmentIcon type={eq?.type || slot.key} level={eq?.level || 0} size="sm" className={eq ? '' : 'opacity-20 grayscale'} />
                        {eq && eq.level > 0 && <div className="absolute -top-1 -right-1 bg-amber-500 text-black text-[7px] px-1 font-black rounded-sm z-30">+{eq.level}</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold text-sm uppercase tracking-widest truncate ${eq ? 'text-white' : 'text-zinc-700'}`}>
                          {eq ? eq.name : `─ ${slot.label} trống ─`}
                        </div>
                        {eq && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {Object.entries(eq.stats).map(([k, v]) => v ? (
                              <span key={k} className="text-[10px] text-zinc-400 font-bold uppercase">+{v} {k.toUpperCase()}</span>
                            ) : null)}
                          </div>
                        )}
                      </div>
                      {eq && <div className={`text-[10px] font-black uppercase tracking-widest ${RARITY_STYLES[eq.rarity] || 'text-zinc-400'}`}>{eq.rarity}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
