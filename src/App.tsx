import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BlossomHeroVideo } from './components/BlossomHeroVideo';
import { Nug3DViewer } from './components/Nug3DViewer';
import { HeroLoadUpScreen } from './components/HeroLoadUpScreen';
import { NotMe209Logo } from './components/NotMe209Logo';
import { DEFAULT_STRAINS, inferCategory } from './utils/strains';
import { Strain, StrainCategory } from './types';
import { isMuted, toggleMute, playSoftClick, playWaterDrop } from './utils/audio';

const PRESET_NUG_PHOTOS = [
  { name: 'Sunset Sherbert · Frosty Purple & Amber Pistils (User Uploaded)', url: '/sunset-sherbert.jpg' },
  { name: 'Harlequin · Frosty Floral Spear on Black (User Uploaded)', url: '/harlequin.jpg' },
  { name: 'Sour Space Candy · Frosty Purple & Amber Pistils (User Uploaded)', url: '/sour-space-candy.jpg' },
  { name: 'Sour Space Candy · Collectible Bag Art (User Uploaded)', url: '/sour-space-candy-2.jpg' },
  { name: 'Cupcake · Frosty Dessert Nug', url: '/cupcake.jpg' },
  { name: 'CakeBoss · Pale Frost Cake', url: '/cakeboss.jpg' },
  { name: 'CakeBoss · Collectible Bag Art (User Uploaded)', url: '/cakeboss-2.jpg' },
  { name: 'Gelatti · Purple Gelato Cross', url: '/gelatti.jpg' },
  { name: 'Chicken & Waffles · Purple Frosted Hybrid', url: '/chicken-waffles-1.jpg' },
  { name: 'Chicken & Waffles · Collectible Bag Art', url: '/chicken-waffles-2.jpg' },
  { name: 'Venom Runtz · Frosty Hybrid', url: '/venom-runtz.jpg' },
  { name: 'L.A. 99 · Premium Frosted Hybrid', url: '/la-99-2.jpg' },
  { name: 'L.A. 99 · Collectible Bag Art', url: '/la-99-1.jpg' },
  { name: 'Diamond Trichome Sinsemilla with Amber Pistils', url: 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?auto=format&fit=crop&w=1000&q=85' },
];

const WHATSAPP_NUMBER = '12095550192';
const SESSION_KEY = 'notme209_return';
type FilterChip = 'All' | StrainCategory | 'New';

const BrandMark: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = '' }) => {
  const [usePng, setUsePng] = useState(true);
  if (usePng) {
    return (
      <img
        src="/logo.png"
        alt="Not Me 209"
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        onError={() => setUsePng(false)}
      />
    );
  }
  return <NotMe209Logo size={size} showGlow={false} className={className} />;
};

function strainPhotos(s: Strain): string[] {
  const list = (s.imgs && s.imgs.length > 0 ? s.imgs : [s.img || PRESET_NUG_PHOTOS[0].url]).filter(Boolean) as string[];
  return list.length ? list : [PRESET_NUG_PHOTOS[0].url];
}

export default function App() {
  const [strains, setStrains] = useState<Strain[]>(() => {
    try {
      const saved = localStorage.getItem('verdant_strains');
      if (saved) {
        const list: Strain[] = JSON.parse(saved);
        const defaultMap = new Map(DEFAULT_STRAINS.map((d) => [d.id, d]));
        const mapped = list.map((s) => {
          const sid = s.id === 'cake-boss' ? 'cakeboss' : s.id;
          const def = defaultMap.get(sid);
          if (def) {
            return {
              ...def,
              ...s,
              id: sid,
              name: s.name || def.name,
              desc: def.desc,
              vibe: s.vibe || def.vibe,
              effects: s.effects || def.effects,
              category: s.category || def.category,
              featured: s.featured ?? def.featured,
              isNew: s.isNew ?? def.isNew,
              soldOut: s.soldOut ?? def.soldOut,
              img: def.img,
              imgs: def.imgs && def.imgs.length > 0 ? def.imgs : s.imgs && s.imgs.length > 0 ? s.imgs : [def.img!],
              phenotypeAppearance: def.phenotypeAppearance,
            };
          }
          return s;
        });
        const have = new Set(mapped.map((x) => x.id));
        const merged = [...mapped, ...DEFAULT_STRAINS.filter((d) => !have.has(d.id))];
        try {
          localStorage.setItem('verdant_strains', JSON.stringify(merged));
        } catch {
          /* ignore */
        }
        return merged;
      }
    } catch {
      /* fallback */
    }
    try {
      localStorage.setItem('verdant_strains', JSON.stringify(DEFAULT_STRAINS));
    } catch {
      /* ignore */
    }
    return DEFAULT_STRAINS;
  });

  const [selectedStrain, setSelectedStrain] = useState<Strain>(() => strains[0] || DEFAULT_STRAINS[0]);
  const [audioMuted, setAudioMuted] = useState(isMuted());
  const [activeNav, setActiveNav] = useState('home');
  const [showIntro, setShowIntro] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStrain, setEditingStrain] = useState<Strain | null>(null);
  const [editFormName, setEditFormName] = useState('');
  const [editFormPhotos, setEditFormPhotos] = useState<string[]>([]);
  const [editPhotoSlot, setEditPhotoSlot] = useState(0);
  const [hasUploadedNewPhoto, setHasUploadedNewPhoto] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lightboxStrain, setLightboxStrain] = useState<Strain | null>(null);
  const [photoIndexes, setPhotoIndexes] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<FilterChip>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBackToMenu, setShowBackToMenu] = useState(false);

  // Cheap prefetch of a few menu images after paint
  useEffect(() => {
    const id = window.setTimeout(() => {
      strains.slice(0, 4).forEach((s) => {
        const src = strainPhotos(s)[0];
        if (src) {
          const img = new Image();
          img.src = src;
        }
      });
    }, 400);
    return () => window.clearTimeout(id);
  }, [strains]);

  useEffect(() => {
    fetch('/api/strains')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.strains) && data.strains.length > 0) {
          setStrains(data.strains);
          try {
            localStorage.setItem('verdant_strains', JSON.stringify(data.strains));
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {
        /* local cache ok */
      });
  }, []);

  const persistReturn = useCallback(() => {
    try {
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          scrollY: window.scrollY,
          strainId: selectedStrain?.id,
          nav: activeNav,
        })
      );
    } catch {
      /* ignore */
    }
  }, [selectedStrain, activeNav]);

  const restoreReturn = useCallback(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (typeof data.scrollY === 'number') {
        window.scrollTo(0, data.scrollY);
      }
      if (data.strainId) {
        const found = strains.find((s) => s.id === data.strainId);
        if (found) setSelectedStrain(found);
      }
    } catch {
      /* ignore */
    }
  }, [strains]);

  useEffect(() => {
    const onPageShow = () => restoreReturn();
    const onVis = () => {
      if (document.visibilityState === 'visible') restoreReturn();
      else persistReturn();
    };
    const onScroll = () => {
      persistReturn();
      setShowBackToMenu(window.scrollY > 600 && activeNav !== 'menu');
    };
    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('scroll', onScroll, { passive: true });
    restoreReturn();
    return () => {
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('scroll', onScroll);
    };
  }, [restoreReturn, persistReturn, activeNav]);

  const openEditModal = (strain: Strain) => {
    setEditingStrain(strain);
    setEditFormName(strain.name);
    setEditFormPhotos(strainPhotos(strain));
    setEditPhotoSlot(0);
    setHasUploadedNewPhoto(false);
    setIsUploadingPhoto(false);
  };

  const saveStrains = (newStrains: Strain[]) => {
    setStrains(newStrains);
    try {
      localStorage.setItem('verdant_strains', JSON.stringify(newStrains));
    } catch {
      /* ignore */
    }
    fetch('/api/strains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strains: newStrains }),
    }).catch(() => {
      /* local ok */
    });
  };

  const handleToggleSound = () => {
    setAudioMuted(toggleMute());
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 250;
      const contactEl = document.getElementById('contact');
      const menuEl = document.getElementById('menu');
      if (contactEl && scrollPos >= contactEl.offsetTop) setActiveNav('contact');
      else if (menuEl && scrollPos >= menuEl.offsetTop) setActiveNav('menu');
      else setActiveNav('home');
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    playSoftClick();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openLightbox = (strain: Strain) => {
    playWaterDrop();
    setSelectedStrain(strain);
    setLightboxStrain(strain);
    persistReturn();
  };

  const closeLightbox = () => setLightboxStrain(null);

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    playWaterDrop();
    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max = 1200;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsUploadingPhoto(false);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Data: dataUrl,
            strainId: editingStrain?.id || 'strain',
            slot: editPhotoSlot,
            extension: 'jpg',
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            setIsUploadingPhoto(false);
            const url = data?.success && data.url ? data.url : dataUrl;
            setEditFormPhotos((prev) => {
              const next = prev.length > 0 ? [...prev] : [url];
              next[editPhotoSlot] = url;
              return next;
            });
            setHasUploadedNewPhoto(true);
            setToastMessage('Photo uploaded!');
            setTimeout(() => setToastMessage(null), 3000);
          })
          .catch(() => {
            setIsUploadingPhoto(false);
            setEditFormPhotos((prev) => {
              const next = prev.length > 0 ? [...prev] : [dataUrl];
              next[editPhotoSlot] = dataUrl;
              return next;
            });
            setHasUploadedNewPhoto(true);
          });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (url: string) => {
    playSoftClick();
    setEditFormPhotos((prev) => {
      const next = prev.length > 0 ? [...prev] : [url];
      next[editPhotoSlot] = url;
      return next;
    });
    setHasUploadedNewPhoto(true);
  };

  const handleSaveAndMoveOn = () => {
    if (!editingStrain) return;
    playWaterDrop();
    const cleanedPhotos = editFormPhotos.filter(Boolean);
    const finalPrimaryImg = cleanedPhotos[0] || editingStrain.img || PRESET_NUG_PHOTOS[0].url;
    const finalName = editFormName.trim() || editingStrain.name;
    const updated = strains.map((s) =>
      s.id === editingStrain.id
        ? {
            ...s,
            name: finalName,
            img: finalPrimaryImg,
            imgs: cleanedPhotos.length > 0 ? cleanedPhotos : [finalPrimaryImg],
          }
        : s
    );
    saveStrains(updated);
    setEditingStrain(null);
    setHasUploadedNewPhoto(false);
    setToastMessage(`Saved ${finalName}!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteStrain = () => {
    if (!editingStrain) return;
    if (strains.length <= 1) {
      alert('You must keep at least one strain in the menu.');
      return;
    }
    if (window.confirm(`Delete ${editingStrain.name}?`)) {
      saveStrains(strains.filter((s) => s.id !== editingStrain.id));
      setEditingStrain(null);
    }
  };

  const sendWhatsApp = (text?: string) => {
    const message = text || "Hello Not Me 209! I'm interested in your living-soil flower.";
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const wantStrain = (name: string) => sendWhatsApp(`I want ${name}`);

  const filteredStrains = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return strains.filter((s) => {
      if (filter === 'New' && !s.isNew && !s.featured) return false;
      if (filter === 'Indica' || filter === 'Hybrid' || filter === 'Sativa') {
        if (inferCategory(s) !== filter) return false;
      }
      if (q && !s.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [strains, filter, searchQuery]);

  const chips: FilterChip[] = ['All', 'Indica', 'Hybrid', 'Sativa', 'New'];

  return (
    <div className="min-h-screen bg-[#141218] text-[#e8dfc8] flex flex-col select-none font-sans overflow-x-hidden pb-[calc(72px+env(safe-area-inset-bottom,0px))]">
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-[#1a1820] border border-[#c9a66b] text-[#e8dfc8] px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-mono pointer-events-none">
          <span className="w-5 h-5 rounded-full bg-[#c9a66b] text-[#141218] flex items-center justify-center font-bold text-xs">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {showIntro && <HeroLoadUpScreen onComplete={() => setShowIntro(false)} />}

      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-3 sm:px-8 py-2.5 sm:py-3 bg-[#141218]/90 backdrop-blur-md border-b border-[#e8dfc8]/10 pt-[max(0.6rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => scrollToSection('home')}
          className="flex items-center gap-2 sm:gap-2.5 hover:opacity-90 cursor-pointer bg-transparent border-none group text-left flex-shrink-0 tap-target"
          title="Not Me 209"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden flex items-center justify-center bg-[#170c24] border border-purple-500/40 group-hover:border-purple-400/80 shadow-[0_0_12px_rgba(192,132,252,0.28)] transition-all">
            <BrandMark size={32} />
          </div>
          <div className="flex items-baseline gap-0.5 sm:gap-1 text-lg sm:text-2xl font-bold tracking-tight text-[#f3ead7]">
            <span>Not Me</span>
            <span className="text-[#c084fc]">209</span>
          </div>
        </button>

        <div className="hidden sm:flex items-center gap-6">
          {(['home', 'menu', 'contact'] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollToSection(id)}
              className={`text-sm font-medium tracking-wide transition-colors cursor-pointer bg-transparent border-none relative py-1 capitalize ${
                activeNav === id ? 'text-[#f3ead7]' : 'text-[#9a9180] hover:text-[#f3ead7]'
              }`}
            >
              {id}
              {activeNav === id && <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#c9a66b]" />}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => { playSoftClick(); setShowIntro(true); }}
            title="Replay logo intro"
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono rounded-full border border-purple-500/30 text-[#c084fc] hover:border-purple-400 transition-all cursor-pointer tap-target"
          >
            Intro
          </button>
          <button
            type="button"
            onClick={handleToggleSound}
            title={audioMuted ? 'Unmute' : 'Mute'}
            className="p-2 rounded-full text-[#9a9180] hover:text-[#e8dfc8] border border-[#e8dfc8]/10 hover:border-[#e8dfc8]/25 transition-colors cursor-pointer tap-target"
          >
            {audioMuted ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
            )}
          </button>
          <button
            type="button"
            onClick={() => sendWhatsApp()}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono bg-[#25d366]/15 hover:bg-[#25d366] text-[#25d366] hover:text-[#0b140e] border border-[#25d366]/40 transition-all cursor-pointer font-medium"
          >
            WhatsApp
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section id="home" className="relative min-h-[85vh] flex flex-col items-center justify-center pt-20 pb-12 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_80%_50%_at_50%_108%,#2a1838_0%,transparent_60%)]" />
        <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(ellipse_at_50%_40%,#1c1824_0%,transparent_70%)]" />

        <div className="relative z-10 mb-4 flex flex-col items-center gap-2">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-purple-400/40 shadow-[0_0_24px_rgba(168,85,247,0.35)] bg-[#170c24]">
            <BrandMark size={80} />
          </div>
          <div className="text-[#c084fc] text-xs font-mono tracking-[0.18em] uppercase">Not Me 209</div>
        </div>

        <div className="relative z-10 w-full max-w-sm flex flex-col items-center mb-6">
          <BlossomHeroVideo
            onOpenMenu={() => scrollToSection('menu')}
            onOpenContact={() => scrollToSection('contact')}
          />
        </div>

        <div className="relative z-10 text-center max-w-xl mx-auto px-4 flex flex-col items-center">
          <div className="text-[#c9a66b] text-xs font-mono tracking-[0.18em] uppercase mb-2">Central Valley grown</div>
          <h1 className="type-brand leading-tight">
            From clone.<br />
            <em className="text-[#c084fc] italic">To frosted flower.</em>
          </h1>
          <p className="type-body mt-3 max-w-md">
            Small-batch seedless CBD flower from verified mother clones. Honest photos, direct WhatsApp.
          </p>
          <button
            type="button"
            onClick={() => scrollToSection('menu')}
            className="mt-6 px-8 py-3 rounded-full text-sm font-medium bg-[#c9a66b] text-[#141218] hover:bg-[#e0c056] transition-all cursor-pointer shadow-lg active:scale-[0.98] tap-target"
          >
            See menu
          </button>
        </div>
      </section>

      {/* Review quote — purple accent, no trust strip */}
      <section className="px-4 sm:px-8 max-w-3xl mx-auto w-full -mt-2 mb-4">
        <blockquote className="quote-accent bg-[#1a1820] rounded-r-xl px-5 py-4 border border-[#e8dfc8]/8">
          <p className="text-sm sm:text-base text-[#e8dfc8] leading-relaxed italic">
            “Frost looks exactly like the photos — quiet, honest shop. Ordered on WhatsApp same evening.”
          </p>
          <footer className="mt-2 text-[11px] font-mono text-[#c084fc]">— Local regular · Not Me 209</footer>
        </blockquote>
      </section>

      {/* How to order */}
      <section className="px-4 sm:px-8 max-w-6xl mx-auto w-full mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { n: '1', t: 'Browse', d: 'Skim vibes, photos, and tags' },
            { n: '2', t: 'Pick a strain', d: 'Tap a card you like' },
            { n: '3', t: 'WhatsApp us', d: 'We usually reply evenings' },
          ].map((step) => (
            <div key={step.n} className="flex items-start gap-3 bg-[#1a1820] border border-[#e8dfc8]/8 rounded-xl px-4 py-3">
              <span className="w-7 h-7 rounded-full bg-purple-600/30 text-[#c084fc] text-xs font-mono flex items-center justify-center border border-purple-400/40">{step.n}</span>
              <div>
                <div className="text-sm font-medium text-[#f3ead7]">{step.t}</div>
                <div className="text-xs text-[#9a9180]">{step.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MENU */}
      <section id="menu" className="py-14 px-4 sm:px-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col gap-4 mb-6 border-b border-[#e8dfc8]/10 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-[#c9a66b] text-xs font-mono tracking-[0.16em] uppercase mb-1.5">The flower</div>
              <h2 className="font-serif text-2xl sm:text-4xl text-[#f3ead7] font-medium">Menu this week</h2>
              <p className="type-body mt-1.5">Tap a photo to inspect. Ask on WhatsApp when ready.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    const newId = `strain-${Date.now()}`;
                    const newStrain: Strain = {
                      id: newId,
                      name: 'New Artisanal Phenotype',
                      category: 'Hybrid',
                      vibe: 'Fresh drop · tell us the vibe',
                      img: PRESET_NUG_PHOTOS[0].url,
                      imgs: [PRESET_NUG_PHOTOS[0].url],
                      isNew: true,
                    };
                    saveStrains([...strains, newStrain]);
                    openEditModal(newStrain);
                  }}
                  className="px-3.5 py-2 rounded-full text-xs font-mono bg-[#1a1820] hover:bg-[#221f2a] border border-[#e8dfc8]/20 hover:border-[#c9a66b] text-[#e8dfc8] transition-all cursor-pointer tap-target"
                >
                  + Add Strain
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reset menu back to starter artisanal strains?')) {
                    saveStrains(DEFAULT_STRAINS);
                    setSelectedStrain(DEFAULT_STRAINS[0]);
                    setToastMessage('Defaults restored');
                    setTimeout(() => setToastMessage(null), 2500);
                  }
                }}
                className="px-4 py-2 rounded-full text-xs font-mono font-semibold bg-[#2a1838] hover:bg-[#3b1d52] border-2 border-[#c084fc]/70 text-[#e9d5ff] shadow-[0_0_16px_rgba(168,85,247,0.25)] transition-all cursor-pointer tap-target"
                title="Reset local menu to default strains (localStorage)"
              >
                Reset defaults
              </button>
              <button
                type="button"
                onClick={() => {
                  playSoftClick();
                  setIsEditing(!isEditing);
                  if (isEditing) setEditingStrain(null);
                }}
                className={`px-4 py-2 rounded-full text-xs font-mono font-medium transition-all cursor-pointer tap-target ${
                  isEditing
                    ? 'bg-[#c9a66b] text-[#141218]'
                    : 'bg-[#1a1820] hover:bg-[#221f2a] border border-[#e8dfc8]/20 text-[#e8dfc8]'
                }`}
              >
                {isEditing ? 'Done editing' : 'Edit menu'}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex flex-wrap gap-2">
              {chips.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { playSoftClick(); setFilter(c); }}
                  className={`filter-chip px-3.5 py-2 rounded-full text-xs font-mono border tap-target cursor-pointer ${
                    filter === c
                      ? 'bg-purple-600/35 border-purple-400/60 text-[#f3ead7]'
                      : 'bg-[#1a1820] border-[#e8dfc8]/12 text-[#9a9180] hover:border-[#c084fc]/40 hover:text-[#e8dfc8]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <label className="flex-1 relative">
              <span className="sr-only">Search strains</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by strain name…"
                className="w-full bg-[#1a1820] border border-[#e8dfc8]/12 focus:border-[#c084fc]/50 rounded-full px-4 py-2.5 text-sm text-[#e8dfc8] placeholder:text-[#9a9180]/70 focus:outline-none tap-target"
              />
            </label>
          </div>
        </div>

        {filteredStrains.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#e8dfc8]/15 bg-[#1a1820] px-6 py-14 text-center">
            <div className="text-[#c084fc] text-xs font-mono uppercase tracking-wider mb-2">Nothing matches</div>
            <p className="type-body max-w-sm mx-auto mb-4">
              Try another filter, clear search, or WhatsApp us — we usually reply evenings.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => { setFilter('All'); setSearchQuery(''); }} className="px-4 py-2 rounded-full text-xs font-mono border border-[#e8dfc8]/20 text-[#e8dfc8] cursor-pointer tap-target">
                Clear filters
              </button>
              <button type="button" onClick={() => sendWhatsApp()} className="px-4 py-2 rounded-full text-xs font-mono bg-[#25d366] text-[#0b140e] cursor-pointer tap-target">
                WhatsApp us
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredStrains.map((s) => {
              const photos = strainPhotos(s);
              const photoIndex = Math.min(Math.max(0, photoIndexes[s.id] ?? 0), Math.max(0, photos.length - 1));
              const displayImg = photos[photoIndex];
              const cat = inferCategory(s);
              const sold = !!s.soldOut;

              return (
                <article
                  key={s.id}
                  className={`strain-card group bg-[#1a1820] border border-[#e8dfc8]/10 rounded-xl overflow-hidden flex flex-col ${sold ? 'opacity-75' : ''}`}
                >
                  <div
                    className="aspect-[4/3] relative overflow-hidden cursor-zoom-in photo-frame flex items-center justify-center p-3"
                    onClick={() => {
                      if (!sold) {
                        setSelectedStrain(s);
                        openLightbox({ ...s, img: displayImg });
                      }
                    }}
                    title={sold ? 'Sold out' : 'Inspect trichomes'}
                  >
                    <img
                      key={`${s.id}-${photoIndex}`}
                      src={displayImg}
                      alt={`${s.name} - Photo ${photoIndex + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain filter contrast-[1.06] saturate-[1.05] drop-shadow-[0_12px_18px_rgba(0,0,0,0.55)] group-hover:scale-[1.03] transition-transform duration-400 ease-out pointer-events-none"
                    />

                    <div className="absolute top-2.5 left-2.5 z-20 flex flex-wrap gap-1.5 max-w-[70%]">
                      {s.featured && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#c9a66b]/90 text-[#141218]">Featured</span>
                      )}
                      {s.isNew && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-600/90 text-white">New</span>
                      )}
                      {sold && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#3a2020]/95 text-[#f5c2c2] border border-[#c46a52]/40">Sold out</span>
                      )}
                    </div>

                    {photos.length > 1 && (
                      <>
                        <button
                          type="button"
                          aria-label="Previous photo"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            playSoftClick();
                            setPhotoIndexes((prev) => {
                              const cur = prev[s.id] ?? 0;
                              return { ...prev, [s.id]: (cur - 1 + photos.length) % photos.length };
                            });
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-[#141218]/88 border border-[#e8dfc8]/40 text-[#e8dfc8] text-2xl leading-none hover:bg-[#c9a66b] hover:text-[#141218] transition-all cursor-pointer flex items-center justify-center shadow-xl active:scale-95"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          aria-label="Next photo"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            playSoftClick();
                            setPhotoIndexes((prev) => {
                              const cur = prev[s.id] ?? 0;
                              return { ...prev, [s.id]: (cur + 1) % photos.length };
                            });
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-[#141218]/88 border border-[#e8dfc8]/40 text-[#e8dfc8] text-2xl leading-none hover:bg-[#c9a66b] hover:text-[#141218] transition-all cursor-pointer flex items-center justify-center shadow-xl active:scale-95"
                        >
                          ›
                        </button>
                        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141218]/88 border border-[#e8dfc8]/20">
                          {photos.map((_, pIdx) => (
                            <button
                              key={pIdx}
                              type="button"
                              aria-label={`Photo ${pIdx + 1}`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setPhotoIndexes((prev) => ({ ...prev, [s.id]: pIdx }));
                              }}
                              className={`rounded-full cursor-pointer transition-all ${
                                pIdx === photoIndex ? 'w-3.5 h-1.5 bg-[#c084fc]' : 'w-1.5 h-1.5 bg-white/35'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="p-4 flex flex-col gap-2.5 flex-1 justify-between bg-[#16141c]">
                    <div className="flex flex-col gap-1.5">
                      {isEditing ? (
                        <input
                          type="text"
                          value={s.name}
                          onChange={(e) => {
                            saveStrains(strains.map((item) => (item.id === s.id ? { ...item, name: e.target.value } : item)));
                          }}
                          className="w-full bg-[#141218] border border-[#c9a66b]/50 rounded px-2.5 py-1 text-sm font-serif text-[#e8dfc8] focus:outline-none"
                          placeholder="Strain Name"
                        />
                      ) : (
                        <h3 className="type-strain group-hover:text-[#c084fc] transition-colors">{s.name}</h3>
                      )}
                      <p className="text-[12px] text-[#c9a66b]/95 leading-snug">{s.vibe || s.tag || 'Living-soil flower'}</p>
                      <div className="flex flex-wrap gap-1.5 mt-0.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-purple-900/35 text-[#d8b4fe] border border-purple-500/25">{cat}</span>
                        {s.lineage && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#141218] text-[#9a9180] border border-[#e8dfc8]/10">{s.lineage}</span>
                        )}
                        {(s.effects || []).slice(0, 3).map((fx) => (
                          <span key={fx} className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#1f1c28] text-[#e8dfc8]/85 border border-[#e8dfc8]/08">{fx}</span>
                        ))}
                      </div>
                      {s.desc && (
                        <p className="type-body text-[12px] line-clamp-2 mt-1">{s.desc}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#e8dfc8]/6">
                      <button
                        type="button"
                        disabled={sold}
                        onClick={() => {
                          setSelectedStrain(s);
                          wantStrain(s.name);
                        }}
                        className={`text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer bg-transparent border-none py-2 tap-target ${
                          sold ? 'text-[#6b6458] cursor-not-allowed' : 'text-[#9a9180] hover:text-[#25d366]'
                        }`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z" /></svg>
                        <span>{sold ? 'Unavailable' : 'I want this'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { playSoftClick(); openEditModal(s); }}
                        className="px-3 py-2 rounded-full text-[11px] font-mono bg-[#1f1c28] hover:bg-[#2a2732] text-[#e8dfc8] border border-[#e8dfc8]/15 hover:border-[#c9a66b] transition-all cursor-pointer tap-target"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-16 px-4 sm:px-8 max-w-3xl mx-auto w-full">
        <div className="bg-[#1a1820] border border-[#e8dfc8]/10 rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center shadow-xl">
          <div className="w-12 h-12 rounded-full overflow-hidden mb-3 border border-purple-400/40">
            <BrandMark size={48} />
          </div>
          <div className="text-[#c9a66b] text-xs font-mono tracking-[0.16em] uppercase mb-2">Reach out</div>
          <h2 className="font-serif text-2xl sm:text-4xl font-medium text-[#f3ead7] mb-3">Ready to order?</h2>
          <p className="type-body mb-2 max-w-lg">
            WhatsApp connects directly to Not Me 209. No forms — ask about cure, trichomes, and what is on hand.
          </p>
          <p className="text-[12px] font-mono text-[#c084fc]/90 mb-6">Usually replies evenings · Central Valley time</p>
          <button
            type="button"
            onClick={() => sendWhatsApp()}
            className="inline-flex items-center gap-2.5 px-7 py-3 rounded-full text-sm font-medium bg-[#25d366] text-[#0b140e] hover:bg-[#2be06e] transition-all cursor-pointer shadow-lg active:scale-[0.98] tap-target"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z" /></svg>
            <span>Message on WhatsApp</span>
          </button>
        </div>
      </section>

      <footer className="py-8 text-center border-t border-[#e8dfc8]/10 text-xs text-[#9a9180] flex flex-col items-center gap-2 mb-2">
        <div className="flex items-center gap-2 text-sm text-[#e8dfc8]">
          <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center bg-[#170c24] border border-purple-500/40">
            <BrandMark size={20} />
          </div>
          <span className="font-bold text-[#f3ead7] tracking-tight">Not Me <span className="text-[#c084fc]">209</span></span>
          <span>·</span>
          <span>Artisanal Botanical Cultivation</span>
        </div>
        <button
          type="button"
          onClick={() => { playSoftClick(); setShowIntro(true); }}
          className="text-[11px] text-[#c084fc] hover:text-[#d8b4fe] underline underline-offset-2 transition-colors cursor-pointer"
        >
          Replay Logo Intro
        </button>
        <div className="text-[10px] text-[#9a9180]/70">Hemp-derived CBD flower & clones. 21+. This site does not sell intoxicating cannabis.</div>
      </footer>

      {showBackToMenu && (
        <button
          type="button"
          onClick={() => scrollToSection('menu')}
          className="back-to-menu-chip px-3.5 py-2 rounded-full text-[11px] font-mono bg-[#1a1820]/95 border border-purple-400/40 text-[#c084fc] shadow-lg cursor-pointer tap-target"
        >
          ↑ Menu
        </button>
      )}

      {/* Sticky bottom chrome */}
      <div className="sticky-bottom-bar">
        <div className="max-w-lg mx-auto flex items-stretch gap-2 px-3 py-2">
          <button
            type="button"
            onClick={() => scrollToSection('menu')}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-[11px] font-mono transition-colors cursor-pointer tap-target ${
              activeNav === 'menu' ? 'text-[#c084fc] bg-purple-900/25' : 'text-[#9a9180] hover:text-[#e8dfc8]'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
            Menu
          </button>
          <button
            type="button"
            onClick={() => sendWhatsApp(selectedStrain ? `I want ${selectedStrain.name}` : undefined)}
            className="flex-[1.3] flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-mono font-semibold bg-[#25d366] text-[#0b140e] hover:bg-[#2be06e] transition-colors cursor-pointer tap-target"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z" /></svg>
            WhatsApp
          </button>
        </div>
      </div>

      {editingStrain && (
        <div
          className="fixed inset-0 z-[70] bg-[#000000]/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setEditingStrain(null)}
        >
          <div
            className="bg-[#16141c] border border-[#e8dfc8]/20 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#e8dfc8]/10 pb-3">
              <div>
                <h3 className="font-serif text-xl text-[#f3ead7]">Edit Strain</h3>
                <p className="text-[11px] font-mono text-[#9a9180] mt-0.5">Photo, baggie art, or strain name</p>
              </div>
              <button type="button" onClick={() => setEditingStrain(null)} className="w-8 h-8 rounded-full bg-[#1a1820] border border-[#e8dfc8]/15 text-[#9a9180] hover:text-[#e8dfc8] flex items-center justify-center cursor-pointer" aria-label="Close">✕</button>
            </div>

            <div className="flex items-center gap-2 bg-[#141218] p-1 rounded-xl border border-[#e8dfc8]/10">
              <button type="button" onClick={() => setEditPhotoSlot(0)} className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono cursor-pointer ${editPhotoSlot === 0 ? 'bg-[#c9a66b] text-[#141218] font-bold' : 'text-[#9a9180]'}`}>Slot 1: Flower</button>
              <button type="button" onClick={() => { setEditPhotoSlot(1); if (!editFormPhotos[1]) setEditFormPhotos((prev) => [...prev, '/cakeboss-2.jpg']); }} className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono cursor-pointer ${editPhotoSlot === 1 ? 'bg-[#c9a66b] text-[#141218] font-bold' : 'text-[#9a9180]'}`}>Slot 2: Bag</button>
            </div>

            <div className="aspect-[16/9] relative rounded-xl overflow-hidden photo-frame flex items-center justify-center p-3">
              <img src={editFormPhotos[editPhotoSlot] || PRESET_NUG_PHOTOS[0].url} alt={editFormName || 'Preview'} className="w-full h-full object-contain" />
              {hasUploadedNewPhoto && (
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#1a1820]/95 border border-[#c9a66b] text-[10px] font-mono font-bold text-[#c9a66b]">New photo loaded</div>
              )}
            </div>

            {hasUploadedNewPhoto && (
              <button type="button" onClick={handleSaveAndMoveOn} className="w-full px-5 py-2.5 rounded-lg text-xs font-mono font-bold bg-[#c9a66b] hover:bg-[#e0c056] text-[#141218] cursor-pointer">Save & Move On</button>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-[#9a9180]">Strain Name</label>
              <input type="text" value={editFormName} onChange={(e) => setEditFormName(e.target.value)} className="bg-[#141218] border border-[#e8dfc8]/20 focus:border-[#c9a66b] rounded-lg px-3.5 py-2 text-sm text-[#e8dfc8] focus:outline-none" />
            </div>

            <label className={`flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs font-mono font-semibold bg-[#1a1820] border border-[#e8dfc8]/25 hover:border-[#c9a66b] text-[#e8dfc8] cursor-pointer ${isUploadingPhoto ? 'opacity-70 pointer-events-none' : ''}`}>
              <span>{isUploadingPhoto ? 'Uploading…' : 'Upload Photo from Device'}</span>
              <input type="file" accept="image/*" disabled={isUploadingPhoto} onClick={(e) => { (e.target as HTMLInputElement).value = ''; }} onChange={handleImageFileUpload} className="hidden" />
            </label>

            <div className="grid grid-cols-4 gap-2">
              {PRESET_NUG_PHOTOS.map((p, idx) => (
                <button key={idx} type="button" onClick={() => handleSelectPreset(p.url)} className={`aspect-square rounded-lg overflow-hidden border p-0.5 bg-[#141218] cursor-pointer ${editFormPhotos[editPhotoSlot] === p.url ? 'border-[#c9a66b]' : 'border-[#e8dfc8]/15'}`} title={p.name}>
                  <img src={p.url} alt={p.name} loading="lazy" className="w-full h-full object-cover rounded-md" />
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#e8dfc8]/10">
              <button type="button" onClick={handleDeleteStrain} className="text-xs font-mono text-[#c46a52] hover:underline cursor-pointer bg-transparent border-none">Delete Strain</button>
              <div className="flex items-center gap-2.5">
                <button type="button" onClick={() => setEditingStrain(null)} className="px-4 py-2 rounded-full text-xs font-mono text-[#9a9180] border border-[#e8dfc8]/15 cursor-pointer bg-transparent">Cancel</button>
                <button type="button" onClick={handleSaveAndMoveOn} className="px-6 py-2 rounded-full text-xs font-mono font-bold bg-[#c9a66b] text-[#141218] hover:bg-[#e0c056] cursor-pointer">Save & Move On</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {lightboxStrain && (
        <Nug3DViewer
          strain={lightboxStrain}
          onClose={closeLightbox}
          onAskWhatsApp={(strainName) => {
            closeLightbox();
            wantStrain(strainName);
          }}
        />
      )}
    </div>
  );
}
