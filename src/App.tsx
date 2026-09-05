import React, { useState, useEffect, useRef } from 'react';
import { BlossomHeroVideo } from './components/BlossomHeroVideo';
import { Nug3DViewer } from './components/Nug3DViewer';
import { HeroLoadUpScreen } from './components/HeroLoadUpScreen';
import { NotMe209Logo } from './components/NotMe209Logo';
import { DEFAULT_STRAINS } from './utils/strains';
import { Strain } from './types';
import { isMuted, toggleMute, playSoftClick, playWaterDrop, playTrichomeChime } from './utils/audio';

// High-resolution cured nug preset photos matching the user's uploaded nug aesthetic
const PRESET_NUG_PHOTOS = [
  {
    name: 'Sunset Sherbert · Frosty Purple & Amber Pistils (User Uploaded)',
    url: '/sunset-sherbert.jpg',
  },
  {
    name: 'Harlequin · Frosty Floral Spear on Black (User Uploaded)',
    url: '/harlequin.jpg',
  },
  {
    name: 'Sour Space Candy · Frosty Purple & Amber Pistils (User Uploaded)',
    url: '/sour-space-candy.jpg',
  },
  {
    name: 'Diamond Trichome Sinsemilla with Amber Pistils',
    url: 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?auto=format&fit=crop&w=1000&q=85',
  },
];

const WHATSAPP_NUMBER = '12095550192';

export default function App() {
  // Strains state persisted in localStorage
  const [strains, setStrains] = useState<Strain[]>(() => {
    try {
      const saved = localStorage.getItem('verdant_strains');
      if (saved) {
        const list: Strain[] = JSON.parse(saved);
        return list.map((s) => {
          if (s.id === 'sunset-sherbert' && (!s.img || s.img.includes('1568644396922'))) {
            return {
              ...s,
              img: '/sunset-sherbert.jpg',
              desc: 'Dense, royal purple and deep violet calyxes blanketed in crystalline milky resin trichomes, accented by vibrant curly copper-orange pistils and sweet dessert terpenes.',
              phenotypeAppearance: 'Rich royal purple calyx clusters encrusted with frosty white diamond trichomes and twisting amber-orange stigmas.',
            };
          }
          if (s.id === 'sour-space-candy' && (!s.img || s.img.includes('unsplash'))) {
            return {
              ...s,
              img: '/sour-space-candy.jpg',
              desc: 'Exquisite seedless buds boasting vivid deep violet calyxes blanketed in frosty crystalline trichomes, accented with twisting copper-orange stigmas and pungent candied diesel terpenes.',
              phenotypeAppearance: 'Dense conical nugs with deep purple calyx clusters encrusted with frosty white diamond trichomes and amber-orange pistils.',
            };
          }
          if (s.id === 'harlequin' && (!s.img || s.img.includes('unsplash'))) {
            return {
              ...s,
              img: '/harlequin.jpg',
              desc: 'Iconic sativa-dominant floral spear with frosty crystalline sugar leaves and stacked calyxes blanketed in glistening glandular trichomes, accented by delicate golden-amber stigmas.',
              phenotypeAppearance: 'Towering conical floral spear heavily encrusted in crystalline trichomes with vibrant botanical green calyxes and frosty serrated sugar leaves.',
            };
          }
          return s;
        });
      }
    } catch {
      // fallback
    }
    return DEFAULT_STRAINS;
  });

  const [selectedStrain, setSelectedStrain] = useState<Strain>(() => strains[0] || DEFAULT_STRAINS[0]);

  const [audioMuted, setAudioMuted] = useState(isMuted());
  const [activeNav, setActiveNav] = useState('home');
  const [showIntro, setShowIntro] = useState(true);

  // Edit Mode state ("the menu shows edit utton fro image n the name of it n tyhats it. more visual then info")
  const [isEditing, setIsEditing] = useState(false);
  const [editingStrain, setEditingStrain] = useState<Strain | null>(null);

  // 3D Nug Turntable & Macro Inspection viewer state
  const [lightboxStrain, setLightboxStrain] = useState<Strain | null>(null);

  // Save strains to local storage
  const saveStrains = (newStrains: Strain[]) => {
    setStrains(newStrains);
    try {
      localStorage.setItem('verdant_strains', JSON.stringify(newStrains));
    } catch {
      // ignore
    }
  };

  const handleToggleSound = () => {
    const muted = toggleMute();
    setAudioMuted(muted);
  };

  // Scroll spy
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 250;
      const contactEl = document.getElementById('contact');
      const menuEl = document.getElementById('menu');
      if (contactEl && scrollPos >= contactEl.offsetTop) {
        setActiveNav('contact');
      } else if (menuEl && scrollPos >= menuEl.offsetTop) {
        setActiveNav('menu');
      } else {
        setActiveNav('home');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    playSoftClick();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 3D Turntable / Macro inspection handlers
  const openLightbox = (strain: Strain) => {
    playWaterDrop();
    setLightboxStrain(strain);
  };

  const closeLightbox = () => {
    setLightboxStrain(null);
  };

  // Compress & save uploaded photo
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, strainId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playWaterDrop();
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
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          const updated = strains.map((s) => (s.id === strainId ? { ...s, img: dataUrl } : s));
          saveStrains(updated);
          if (editingStrain?.id === strainId) {
            setEditingStrain({ ...editingStrain, img: dataUrl });
          }
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Launch WhatsApp
  const sendWhatsApp = (text?: string) => {
    const message = text || "Hello notme 209! I'm interested in your living-soil flower reserve jars and rooted clones.";
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0f120d] text-[#ece4d3] flex flex-col select-none font-sans overflow-x-hidden">
      {/* Hero Load-Up Page with the purple notme 209 emblem */}
      {showIntro && <HeroLoadUpScreen onComplete={() => setShowIntro(false)} />}

      {/* ========================================================================= */}
      {/* 1. TOP STICKY NAVIGATION                                                  */}
      {/* ========================================================================= */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 sm:px-8 py-3 bg-[#0f120d]/85 backdrop-blur-md border-b border-[#ece4d3]/10 transition-all">
        {/* Brand: notme 209 Logo Emblem & Typography */}
        <button
          type="button"
          onClick={() => scrollToSection('home')}
          className="flex items-center gap-2.5 hover:opacity-90 cursor-pointer bg-transparent border-none group text-left"
          title="notme 209 Artisanal CBD"
        >
          <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center bg-[#170c24] border border-purple-500/40 group-hover:border-purple-400/80 shadow-[0_0_12px_rgba(192,132,252,0.3)] transition-all">
            <NotMe209Logo size={32} showGlow={false} />
          </div>
          <div className="flex items-baseline gap-1 text-xl sm:text-2xl font-bold tracking-tight text-[#ece4d3]">
            <span>notme</span>
            <span className="text-[#c084fc]">209</span>
          </div>
        </button>

        {/* Center Nav Links */}
        <div className="flex items-center gap-5 sm:gap-8">
          <button
            type="button"
            onClick={() => scrollToSection('home')}
            className={`text-xs sm:text-sm font-medium tracking-wide transition-colors cursor-pointer bg-transparent border-none relative py-1 ${
              activeNav === 'home' ? 'text-[#ece4d3]' : 'text-[#8b9584] hover:text-[#ece4d3]'
            }`}
          >
            <span>Home</span>
            {activeNav === 'home' && (
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#c9a227]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('menu')}
            className={`text-xs sm:text-sm font-medium tracking-wide transition-colors cursor-pointer bg-transparent border-none relative py-1 ${
              activeNav === 'menu' ? 'text-[#ece4d3]' : 'text-[#8b9584] hover:text-[#ece4d3]'
            }`}
          >
            <span>Menu</span>
            {activeNav === 'menu' && (
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#c9a227]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('contact')}
            className={`text-xs sm:text-sm font-medium tracking-wide transition-colors cursor-pointer bg-transparent border-none relative py-1 ${
              activeNav === 'contact' ? 'text-[#ece4d3]' : 'text-[#8b9584] hover:text-[#ece4d3]'
            }`}
          >
            <span>Contact</span>
            {activeNav === 'contact' && (
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#c9a227]" />
            )}
          </button>
        </div>

        {/* Right Nav Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Replay Intro Hero Screen */}
          <button
            type="button"
            onClick={() => {
              playSoftClick();
              setShowIntro(true);
            }}
            title="Replay notme 209 logo hero intro"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-full border border-purple-500/30 text-[#c084fc] hover:border-purple-400 hover:text-white hover:bg-purple-900/30 transition-all cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc] animate-pulse" />
            <span className="hidden xs:inline">Hero Intro</span>
            <span className="xs:hidden">Intro</span>
          </button>
          {/* Sound Mute/Unmute */}
          <button
            type="button"
            onClick={handleToggleSound}
            title={audioMuted ? 'Unmute botanical sound FX' : 'Mute sound FX'}
            className="p-2 rounded-full text-[#8b9584] hover:text-[#ece4d3] border border-[#ece4d3]/10 hover:border-[#ece4d3]/25 transition-colors cursor-pointer"
          >
            {audioMuted ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>

          {/* WhatsApp Direct Action Button */}
          <button
            type="button"
            onClick={() => sendWhatsApp()}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono bg-[#25d366]/15 hover:bg-[#25d366] text-[#25d366] hover:text-[#0b140e] border border-[#25d366]/40 transition-all cursor-pointer font-medium"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z" />
            </svg>
            <span>WhatsApp</span>
          </button>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION — AUTOMATIC 9:16 BLOSSOM TIME-LAPSE                        */}
      {/* ========================================================================= */}
      <section id="home" className="relative min-h-[85vh] flex flex-col items-center justify-center pt-20 pb-12 px-4 overflow-hidden">
        {/* Ambient atmospheric backdrop */}
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_80%_50%_at_50%_108%,#2a2414_0%,transparent_60%)]" />
        <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(ellipse_at_50%_40%,#1c2418_0%,transparent_70%)]" />

        {/* Hero 9:16 Blossom Video (Auto-plays on loop, click navigates to menu & contact) */}
        <div className="relative z-10 w-full max-w-sm flex flex-col items-center mb-6">
          <BlossomHeroVideo
            onOpenMenu={() => scrollToSection('menu')}
            onOpenContact={() => scrollToSection('contact')}
          />
        </div>

        {/* Hero Headline & Direct CTAs */}
        <div className="relative z-10 text-center max-w-xl mx-auto px-4 flex flex-col items-center">
          <div className="text-[#c9a227] text-xs font-mono tracking-[0.18em] uppercase mb-2">
            Central Valley grown
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight leading-tight text-[#ece4d3]">
            From clone.<br />
            <em className="text-[#b4cd96] italic">To frosted flower.</em>
          </h1>
          <p className="text-[#8b9584] text-sm sm:text-base mt-3 max-w-md leading-relaxed">
            Small-batch seedless CBD flower grown directly from verified mother clones. Described honestly, sold direct.
          </p>

          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={() => scrollToSection('menu')}
              className="px-6 py-2.5 rounded-full text-xs sm:text-sm font-medium bg-[#c9a227] text-[#12160f] hover:bg-[#e0c056] transition-all cursor-pointer shadow-lg hover:-translate-y-0.5 font-medium"
            >
              See this week’s flower
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="px-6 py-2.5 rounded-full text-xs sm:text-sm font-medium bg-transparent border border-[#ece4d3]/25 text-[#ece4d3] hover:border-[#c9a227] hover:text-[#c9a227] transition-all cursor-pointer hover:-translate-y-0.5 font-medium"
            >
              Contact Us on WhatsApp
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. MENU SECTION — "MORE VISUAL THEN INFO" (Photo, Name, Edit Button)      */}
      {/* ========================================================================= */}
      <section id="menu" className="py-20 px-4 sm:px-8 max-w-6xl mx-auto w-full">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 border-b border-[#ece4d3]/10 pb-6">
          <div>
            <div className="text-[#c9a227] text-xs font-mono tracking-[0.16em] uppercase mb-1.5">
              The flower
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl text-[#ece4d3] font-medium">
              Strains on hand this week
            </h2>
            <p className="text-[#8b9584] text-xs sm:text-sm mt-1.5">
              Tap a nug photo to inspect frost, pistils, and trichomes in close-up.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  const newId = `strain-${Date.now()}`;
                  const newStrain: Strain = {
                    id: newId,
                    name: 'New Artisanal Phenotype',
                    img: PRESET_NUG_PHOTOS[0].url,
                  };
                  saveStrains([...strains, newStrain]);
                  setEditingStrain(newStrain);
                }}
                className="px-3.5 py-1.5 rounded-full text-xs font-mono bg-[#1c2418] hover:bg-[#2a3322] border border-[#ece4d3]/20 hover:border-[#c9a227] text-[#ece4d3] transition-all cursor-pointer"
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
                }
              }}
              className="px-3.5 py-1.5 rounded-full text-xs font-mono bg-[#1c2418] hover:bg-[#2a3322] border border-[#ece4d3]/20 hover:border-[#c9a227] text-[#8b9584] hover:text-[#ece4d3] transition-all cursor-pointer"
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
              className={`px-4 py-1.5 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
                isEditing
                  ? 'bg-[#c9a227] text-[#12160f] shadow-[0_0_15px_rgba(201,162,39,0.4)]'
                  : 'bg-[#1c2418] hover:bg-[#2a3322] border border-[#ece4d3]/20 text-[#ece4d3]'
              }`}
            >
              {isEditing ? 'Done editing' : 'Edit menu'}
            </button>
          </div>
        </div>

        {/* Strain Card Grid: PURE VISUALS (Photo + Name + Edit + WhatsApp) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {strains.map((s) => {
            const displayImg = s.img || PRESET_NUG_PHOTOS[0].url;

            return (
              <article
                key={s.id}
                className="group bg-[#1c2418] border border-[#ece4d3]/10 hover:border-[#c9a227]/40 rounded-lg overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 shadow-md"
              >
                {/* 1. Visual Nug Photo Container */}
                <div
                  className="aspect-[4/3] relative overflow-hidden cursor-zoom-in bg-gradient-to-b from-[#3a3f36] via-[#1a2017] to-[#0f120d] flex items-center justify-center p-3"
                  onClick={() => openLightbox(s)}
                  title="Click to zoom and inspect trichomes"
                >
                  <img
                    src={displayImg}
                    alt={s.name}
                    className="w-full h-full object-contain filter contrast-[1.08] saturate-[1.08] drop-shadow-[0_15px_20px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform duration-500 ease-out"
                  />

                  {/* 3D Turn & Zoom badge hint */}
                  <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-[#0f120d]/85 backdrop-blur-md border border-[#c9a227]/30 text-[10px] font-mono text-[#c9a227] opacity-90 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 shadow-md">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    </svg>
                    <span>3D Turn & Zoom</span>
                  </div>
                </div>

                {/* 2. Visual Card Body: Strain Name & Edit Controls ("more visual then info") */}
                <div className="p-4 flex flex-col gap-3 flex-1 justify-between bg-[#151b13]">
                  {/* Strain Name */}
                  <div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={s.name}
                        onChange={(e) => {
                          const updated = strains.map((item) =>
                            item.id === s.id ? { ...item, name: e.target.value } : item
                          );
                          saveStrains(updated);
                        }}
                        className="w-full bg-[#0f120d] border border-[#c9a227]/50 rounded px-2.5 py-1 text-sm font-serif text-[#ece4d3] focus:outline-none focus:border-[#c9a227]"
                        placeholder="Strain Name"
                      />
                    ) : (
                      <h3 className="font-serif text-lg text-[#ece4d3] group-hover:text-[#b4cd96] transition-colors">
                        {s.name}
                      </h3>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#ece4d3]/5">
                    {/* Ask on WhatsApp */}
                    <button
                      type="button"
                      onClick={() => {
                        const msg = `Hello, I'd like to ask about your ${s.name} flower. What is currently in stock?`;
                        sendWhatsApp(msg);
                      }}
                      className="text-xs font-mono text-[#8b9584] hover:text-[#25d366] flex items-center gap-1.5 transition-colors cursor-pointer bg-transparent border-none py-1"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z" />
                      </svg>
                      <span>Ask on WhatsApp</span>
                    </button>

                    {/* Edit button (Opens Image & Name Editor modal for this strain) */}
                    <button
                      type="button"
                      onClick={() => {
                        playSoftClick();
                        setEditingStrain(s);
                      }}
                      className="px-3 py-1 rounded-full text-[11px] font-mono bg-[#1f2a1a] hover:bg-[#2c3d25] text-[#ece4d3] border border-[#ece4d3]/15 hover:border-[#c9a227] transition-all cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. CONTACT SECTION — WHATSAPP DIRECT                                      */}
      {/* ========================================================================= */}
      <section id="contact" className="py-20 px-4 sm:px-8 max-w-3xl mx-auto w-full">
        <div className="bg-[#1c2418] border border-[#ece4d3]/10 rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center shadow-xl">
          <div className="text-[#c9a227] text-xs font-mono tracking-[0.16em] uppercase mb-2">
            Reach out
          </div>
          <h2 className="font-serif text-2xl sm:text-4xl font-medium text-[#ece4d3] mb-3">
            Ready to order, or have questions?
          </h2>
          <p className="text-[#8b9584] text-sm sm:text-base leading-relaxed mb-6 max-w-lg">
            WhatsApp connects directly to our cultivation team. No forms, no sales queue — direct answers on current cure, trichomes, and terpenes.
          </p>
          <button
            type="button"
            onClick={() => sendWhatsApp()}
            className="inline-flex items-center gap-2.5 px-7 py-3 rounded-full text-xs sm:text-sm font-medium bg-[#25d366] text-[#0b140e] hover:bg-[#2be06e] transition-all cursor-pointer shadow-lg hover:-translate-y-0.5"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z" />
            </svg>
            <span>Message on WhatsApp</span>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="py-8 text-center border-t border-[#ece4d3]/10 text-xs text-[#8b9584] flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 text-sm text-[#ece4d3]">
          <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center bg-[#170c24] border border-purple-500/40 shadow-sm">
            <NotMe209Logo size={18} showGlow={false} />
          </div>
          <span className="font-bold text-white tracking-tight">notme <span className="text-[#c084fc]">209</span></span>
          <span className="text-[#8b9584]">·</span>
          <span className="text-[#8b9584]">Artisanal Botanical Cultivation</span>
        </div>
        <button
          type="button"
          onClick={() => {
            playSoftClick();
            setShowIntro(true);
          }}
          className="text-[11px] text-[#c084fc] hover:text-[#d8b4fe] underline underline-offset-2 transition-colors cursor-pointer"
        >
          Replay Logo Intro
        </button>
        <div className="text-[10px] text-[#8b9584]/70">
          Hemp-derived CBD flower & clones. 21+. This site does not sell intoxicating cannabis.
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 6. MODAL: EDIT IMAGE & NAME ("more visual then info")                     */}
      {/* ========================================================================= */}
      {editingStrain && (
        <div
          className="fixed inset-0 z-50 bg-[#000000]/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setEditingStrain(null)}
        >
          <div
            className="bg-[#151b13] border border-[#ece4d3]/20 rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#ece4d3]/10 pb-3">
              <h3 className="font-serif text-xl text-[#ece4d3]">Edit Strain</h3>
              <button
                type="button"
                onClick={() => setEditingStrain(null)}
                className="text-[#8b9584] hover:text-[#ece4d3] p-1 cursor-pointer bg-transparent border-none"
              >
                ✕
              </button>
            </div>

            {/* Current Image Preview */}
            <div className="aspect-[16/9] rounded-lg overflow-hidden bg-[#0f120d] border border-[#ece4d3]/15 flex items-center justify-center p-3">
              <img
                src={editingStrain.img || PRESET_NUG_PHOTOS[0].url}
                alt={editingStrain.name}
                className="w-full h-full object-contain filter contrast-[1.08] saturate-[1.08]"
              />
            </div>

            {/* Strain Name Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-[#8b9584]">Strain Name</label>
              <input
                type="text"
                value={editingStrain.name}
                onChange={(e) => {
                  const updatedName = e.target.value;
                  setEditingStrain({ ...editingStrain, name: updatedName });
                  const updated = strains.map((s) =>
                    s.id === editingStrain.id ? { ...s, name: updatedName } : s
                  );
                  saveStrains(updated);
                }}
                className="bg-[#0f120d] border border-[#c9a227]/50 rounded-lg px-3.5 py-2 text-sm text-[#ece4d3] focus:outline-none focus:border-[#c9a227]"
              />
            </div>

            {/* Change Image Options */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-[#8b9584]">Change Image</label>

              {/* 1. Upload from Device */}
              <label className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-mono bg-[#1c2418] hover:bg-[#2a3322] border border-[#ece4d3]/20 hover:border-[#c9a227] text-[#ece4d3] transition-colors cursor-pointer text-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span>Upload Photo from Device</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageFileUpload(e, editingStrain.id)}
                  className="hidden"
                />
              </label>

              {/* 2. Choose from Frosty Cured Nug Presets */}
              <div className="grid grid-cols-4 gap-2 mt-1">
                {PRESET_NUG_PHOTOS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setEditingStrain({ ...editingStrain, img: p.url });
                      const updated = strains.map((s) =>
                        s.id === editingStrain.id ? { ...s, img: p.url } : s
                      );
                      saveStrains(updated);
                    }}
                    className={`aspect-square rounded-md overflow-hidden border p-0.5 bg-[#0f120d] transition-all cursor-pointer ${
                      editingStrain.img === p.url
                        ? 'border-[#c9a227] shadow-[0_0_8px_rgba(201,162,39,0.5)]'
                        : 'border-[#ece4d3]/15 hover:border-[#ece4d3]/40'
                    }`}
                    title={p.name}
                  >
                    <img src={p.url} alt={p.name} className="w-full h-full object-cover rounded" />
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#ece4d3]/10">
              <button
                type="button"
                onClick={() => {
                  if (strains.length <= 1) {
                    alert('You must keep at least one strain in the menu.');
                    return;
                  }
                  if (window.confirm(`Delete ${editingStrain.name}?`)) {
                    const updated = strains.filter((s) => s.id !== editingStrain.id);
                    saveStrains(updated);
                    setEditingStrain(null);
                  }
                }}
                className="text-xs font-mono text-[#c46a52] hover:underline cursor-pointer bg-transparent border-none"
              >
                Delete Strain
              </button>

              <button
                type="button"
                onClick={() => setEditingStrain(null)}
                className="px-5 py-1.5 rounded-full text-xs font-mono font-medium bg-[#c9a227] text-[#12160f] hover:bg-[#e0c056] cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. 3D NUG TURNTABLE & HIGH-RES MACRO INSPECTION VIEWER                    */}
      {/* ========================================================================= */}
      {lightboxStrain && (
        <Nug3DViewer
          strain={lightboxStrain}
          onClose={closeLightbox}
          onAskWhatsApp={(strainName) => {
            closeLightbox();
            const msg = `Hello, I was inspecting your ${strainName} flower in the 3D Turntable viewer and want to inquire about placing an order.`;
            sendWhatsApp(msg);
          }}
        />
      )}
    </div>
  );
}
