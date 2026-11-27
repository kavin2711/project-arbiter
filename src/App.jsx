import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, ChevronUp, ArrowRight, Camera, FolderOpen, 
  Sparkles, Leaf, X, Check, Edit2, ExternalLink, HeartHandshake, 
  Layers, Star, ShieldCheck, RefreshCw, ZoomIn, MapPin, Phone, 
  Building, Users, Baby, CheckCircle2, Shield, Compass, AlertTriangle, Wrench,
  Cloud, CloudOff, LogIn, LogOut, Loader2, Key, Eye, EyeOff, RotateCcw
} from 'lucide-react';
import { 
  analyzeProductImage, 
  fetchDonationDestinations, 
  fetchExternalPortalGuide,
  getEngineConfig,
  updateEngineConfig
} from './services/analyzer';
import {
  signInWithGoogle,
  logOut,
  subscribeToAuth,
  saveSpecimenToCloud,
  saveSpecimenAnalysisToCloud,
  loadUserSpecimensFromCloud,
  deleteSpecimenFromCloud,
  updateSpecimenNameInCloud,
  createCompressedThumbnail
} from './services/firebase';

/* 1. Cinematic Morphing Year Component */
function MorphingYear({ targetYear, isActive, onComplete }) {
  const [displayDigits, setDisplayDigits] = useState(['▢', '▢', '▢', '▢']);

  useEffect(() => {
    if (!isActive) {
      setDisplayDigits(['▢', '▢', '▢', '▢']);
      return;
    }

    const target = targetYear.split('');
    setDisplayDigits(['▢', '▢', '▢', '▢']);

    target.forEach((digit, index) => {
      const startDelay = 250 + index * 180;
      
      setTimeout(() => {
        let flickerCount = 0;
        const interval = setInterval(() => {
          setDisplayDigits(curr => {
            const next = [...curr];
            next[index] = Math.floor(Math.random() * 10).toString();
            return next;
          });
          flickerCount++;

          if (flickerCount > 4) {
            clearInterval(interval);
            setDisplayDigits(curr => {
              const next = [...curr];
              next[index] = digit;
              return next;
            });

            if (index === target.length - 1 && onComplete) {
              setTimeout(() => {
                onComplete();
              }, 120);
            }
          }
        }, 40);
      }, startDelay);
    });
  }, [isActive, targetYear]);

  return (
    <div 
      className="font-['Orbitron'] font-black text-6xl sm:text-8xl md:text-9xl tracking-widest flex items-center justify-center gap-1.5 sm:gap-4 select-none"
      style={{ color: '#789575' }}
    >
      {displayDigits.map((char, i) => (
        <span 
          key={i} 
          className={`inline-block transition-transform duration-200 ${
            char === '▢' ? 'opacity-35 scale-90' : 'opacity-90 scale-100 font-bold'
          }`}
          style={{ minWidth: '0.7em', textAlign: 'center' }}
        >
          {char}
        </span>
      ))}
    </div>
  );
}

/* 2. Zero-Resistance Feather-Light Circular Linked List Carousel */
function CircularRouletteFeed({ 
  items, 
  activeSpecimenId,
  onSelectSpecimen,
  renamingId, 
  renameInput, 
  setRenameInput, 
  saveRename, 
  handleContextMenu, 
  deleteImage 
}) {
  const [headIndex, setHeadIndex] = useState(0);
  const touchStartY = useRef(null);
  const dragStartY = useRef(null);
  const isDragging = useRef(false);
  const lastScrollTime = useRef(0);
  const containerRef = useRef(null);

  useEffect(() => {
    if (headIndex >= items.length && items.length > 0) {
      setHeadIndex(0);
    }
  }, [items.length, headIndex]);

  // Instant zero-latency circular advance
  const stepNext = () => {
    if (items.length <= 1) return;
    setHeadIndex(curr => (curr + 1) % items.length);
  };

  const stepPrev = () => {
    if (items.length <= 1) return;
    setHeadIndex(curr => (curr - 1 + items.length) % items.length);
  };

  // Zero-resistance wheel listener: triggers instantly on the slightest wheel move
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e) => {
      if (items.length <= 1) return;
      e.preventDefault();
      const now = performance.now();
      if (now - lastScrollTime.current < 35) return;

      if (e.deltaY > 1) {
        stepNext();
        lastScrollTime.current = now;
      } else if (e.deltaY < -1) {
        stepPrev();
        lastScrollTime.current = now;
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [items.length]);

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (!touchStartY.current || items.length <= 1) return;
    const now = performance.now();
    if (now - lastScrollTime.current < 35) return;

    const deltaY = touchStartY.current - e.touches[0].clientY;
    if (deltaY > 5) {
      stepNext();
      touchStartY.current = e.touches[0].clientY;
      lastScrollTime.current = now;
    } else if (deltaY < -5) {
      stepPrev();
      touchStartY.current = e.touches[0].clientY;
      lastScrollTime.current = now;
    }
  };

  // Effortless mouse drag-to-scroll
  const handlePointerDown = (e) => {
    dragStartY.current = e.clientY;
    isDragging.current = true;
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current || dragStartY.current === null || items.length <= 1) return;
    const now = performance.now();
    if (now - lastScrollTime.current < 35) return;

    const deltaY = dragStartY.current - e.clientY;
    if (deltaY > 8) {
      stepNext();
      dragStartY.current = e.clientY;
      lastScrollTime.current = now;
    } else if (deltaY < -8) {
      stepPrev();
      dragStartY.current = e.clientY;
      lastScrollTime.current = now;
    }
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    dragStartY.current = null;
  };

  const n = items.length;

  if (n === 1) {
    const single = items[0];
    return (
      <div className="relative flex-1 my-2 flex flex-col justify-center select-none px-1">
        <div className="text-[10px] font-mono font-semibold mb-2 px-1" style={{ color: '#789575' }}>
          Specimen 1 of 1
        </div>
        <SingleCardView 
          item={single} 
          index={0}
          isSelected={activeSpecimenId === single.id}
          isHighlighted={true}
          onSelect={() => onSelectSpecimen(single)}
          renamingId={renamingId}
          renameInput={renameInput}
          setRenameInput={setRenameInput}
          saveRename={saveRename}
          handleContextMenu={handleContextMenu}
          deleteImage={deleteImage}
        />
      </div>
    );
  }

  // Window up to 4 circular slots
  const slotsCount = Math.min(n, 4);
  const visibleSlots = [];
  for (let i = 0; i < slotsCount; i++) {
    const circularIdx = (headIndex + i) % n;
    // The middle 2 (Slot 1 and Slot 2) are highlighted focus cards
    const isMiddleHighlighted = slotsCount >= 4 
      ? (i === 1 || i === 2) 
      : (i === 0 || i === 1);

    visibleSlots.push({
      item: items[circularIdx],
      slotIndex: i,
      originalIndex: circularIdx,
      isHighlighted: isMiddleHighlighted
    });
  }

  return (
    <div 
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative flex-1 my-1 flex flex-col justify-between select-none overflow-hidden cursor-grab active:cursor-grabbing"
    >
      
      {/* Top Header & Steppers (No extra count or (Circular)) */}
      <div className="relative z-20 flex items-center justify-between px-2 pt-0.5">
        <span className="text-[10px] font-mono font-semibold" style={{ color: '#789575' }}>
          Specimen {headIndex + 1} of {items.length}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={stepPrev}
            title="Roll up"
            className="p-1 rounded-full hover:bg-sage/15 text-sage transition-all active:scale-90 cursor-pointer"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={stepNext}
            title="Roll down"
            className="p-1 rounded-full hover:bg-sage/15 text-sage transition-all active:scale-90 cursor-pointer"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Soft Gradient Fade Mask */}
      <div 
        className="absolute top-6 left-0 right-0 h-10 pointer-events-none z-10"
        style={{ 
          background: 'linear-gradient(to bottom, #E5E8CE 10%, rgba(229,232,206,0.85) 50%, transparent 100%)' 
        }}
      />

      {/* CARDS FEED */}
      <div className="relative flex-1 flex flex-col justify-center gap-2 py-4 px-1 overflow-hidden">
        {visibleSlots.map(({ item, slotIndex, originalIndex, isHighlighted }) => (
          <div
            key={`${item.id}-${slotIndex}`}
            className="transition-all duration-150 ease-out"
            style={{
              opacity: isHighlighted ? 1 : 0.45,
              transform: isHighlighted ? 'scale(1.02)' : 'scale(0.96)',
              zIndex: isHighlighted ? 5 : 1
            }}
          >
            <SingleCardView 
              item={item} 
              index={originalIndex}
              isSelected={activeSpecimenId === item.id}
              isHighlighted={isHighlighted}
              onSelect={() => onSelectSpecimen(item)}
              renamingId={renamingId}
              renameInput={renameInput}
              setRenameInput={setRenameInput}
              saveRename={saveRename}
              handleContextMenu={handleContextMenu}
              deleteImage={deleteImage}
            />
          </div>
        ))}
      </div>

      {/* Bottom Soft Gradient Fade Mask */}
      <div 
        className="absolute bottom-5 left-0 right-0 h-10 pointer-events-none z-10"
        style={{ 
          background: 'linear-gradient(to top, #E5E8CE 10%, rgba(229,232,206,0.85) 50%, transparent 100%)' 
        }}
      />

      {/* Status hint */}
      <div className="text-center text-[10px] font-mono opacity-60 pb-0.5 z-20" style={{ color: '#789575' }}>
        Click any card to analyze • Wheel or drag to roll
      </div>

    </div>
  );
}

/* Single Item Card Renderer */
function SingleCardView({ 
  item, 
  index, 
  isSelected,
  isHighlighted,
  onSelect,
  renamingId, 
  renameInput, 
  setRenameInput, 
  saveRename, 
  handleContextMenu, 
  deleteImage 
}) {
  return (
    <div
      onClick={onSelect}
      onContextMenu={(e) => handleContextMenu(e, item)}
      className="group relative p-2.5 h-[64px] rounded-2xl border cursor-pointer flex items-center gap-3 backdrop-blur-sm transition-all duration-150"
      style={{ 
        backgroundColor: isSelected 
          ? 'rgba(255, 255, 255, 1)' 
          : isHighlighted 
            ? 'rgba(255, 255, 255, 0.92)' 
            : 'rgba(255, 255, 255, 0.45)',
        borderColor: isSelected 
          ? '#D97746' 
          : renamingId === item.id 
            ? '#D97746' 
            : isHighlighted 
              ? 'rgba(120, 149, 117, 0.55)' 
              : 'rgba(120, 149, 117, 0.25)',
        boxShadow: isSelected 
          ? '0 0 0 2px #D97746, 0 8px 24px -4px rgba(217, 119, 70, 0.35)' 
          : isHighlighted 
            ? '0 6px 20px -4px rgba(120, 149, 117, 0.25)' 
            : 'none'
      }}
    >
      {/* Thumbnail */}
      <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 border border-sage/20 bg-black/10">
        <img 
          src={item.url} 
          alt={item.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
      </div>

      {/* Info / Inline Rename */}
      <div className="flex-1 min-w-0">
        {renamingId === item.id ? (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              autoFocus
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveRename(item.id);
                if (e.key === 'Escape') setRenamingId(null);
              }}
              className="w-full px-2 py-1 text-xs font-semibold rounded border outline-none bg-white"
              style={{ borderColor: '#D97746', color: '#2b3b29' }}
            />
            <button
              onClick={() => saveRename(item.id)}
              className="p-1 rounded bg-terracotta text-white hover:brightness-110 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <h4 
              className={`font-bold text-xs sm:text-sm truncate tracking-wide transition-colors ${
                isSelected 
                  ? 'text-terracotta font-extrabold' 
                  : isHighlighted 
                    ? 'opacity-100 font-extrabold' 
                    : 'opacity-70 font-medium'
              }`}
              style={{ color: isSelected ? '#D97746' : '#2b3b29' }}
              title="Click to analyze • Right-click to rename"
            >
              {item.name}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span 
                className={`text-[10px] font-mono font-semibold ${
                  isSelected ? 'text-terracotta' : isHighlighted ? 'text-terracotta' : 'text-sage/80'
                }`}
              >
                Specimen #{index + 1}
              </span>
              <span className="text-[10px] font-mono opacity-60" style={{ color: '#789575' }}>
                {item.timestamp}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Action buttons on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          onClick={(e) => { e.stopPropagation(); handleContextMenu(e, item); }}
          title="Rename (or right-click)"
          className="p-1.5 rounded-lg hover:bg-sage/15 text-sage cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); deleteImage(item.id); }}
          title="Remove"
          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* 3. 5-Star Rating Component */
function StarScale({ score = 0, exactStars = null }) {
  const numeric = exactStars != null ? Number(exactStars) : Number(score);
  const clamped = Math.max(0, Math.min(5, Number.isFinite(numeric) ? numeric : 0));
  const displayValue = exactStars != null ? clamped.toFixed(1) : Math.round(clamped);

  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 transition-all ${
            star <= Math.round(clamped)
              ? 'fill-terracotta text-terracotta drop-shadow-[0_1px_3px_rgba(217,119,70,0.5)]' 
              : 'fill-transparent text-sage/35'
          }`}
        />
      ))}
      <span className="ml-2 font-mono text-xs font-bold text-terracotta">
        {displayValue}/5
      </span>
    </div>
  );
}

/* 4. Humanitarian Redistribution Modal (Orphanages, Old-Age Homes, Shelters) */
function DonationRoutingModal({ 
  isOpen, 
  onClose, 
  specimen, 
  analysisData, 
  donationData, 
  isLoading 
}) {
  const [filter, setFilter] = useState('all');

  if (!isOpen) return null;

  const destinations = donationData?.destinations || [];
  const filteredDestinations = filter === 'all' 
    ? destinations 
    : destinations.filter(d => d.type.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] rounded-3xl overflow-hidden border shadow-2xl flex flex-col"
        style={{ 
          backgroundColor: '#E5E8CE', 
          borderColor: '#789575' 
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(120, 149, 117, 0.25)', backgroundColor: 'rgba(255, 255, 255, 0.6)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0" style={{ backgroundColor: '#D97746' }}>
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-['Orbitron'] font-bold text-base sm:text-lg tracking-wider" style={{ color: '#2b3b29' }}>
                  Humanitarian Redistribution Network
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sage/15 text-sage font-bold">
                  Direct Care
                </span>
              </div>
              <p className="text-xs font-medium opacity-75 mt-0.5" style={{ color: '#4a6048' }}>
                Routing <strong className="text-terracotta">{analysisData?.productName || specimen?.name}</strong> to local orphanages, senior sanctuaries, and shelters
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-sage/15 text-sage transition-all active:scale-90 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Summary Quote Box */}
          <div 
            className="p-4 rounded-2xl border flex items-start gap-3 backdrop-blur-sm"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.75)', 
              borderColor: 'rgba(120, 149, 117, 0.3)' 
            }}
          >
            <Sparkles className="w-5 h-5 text-terracotta flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-terracotta">
                Human Impact Assessment
              </span>
              <p className="text-xs sm:text-sm leading-relaxed mt-1" style={{ color: '#2b3b29' }}>
                {donationData?.summary || analysisData?.donateReason || "Donating this specimen extends its useful lifecycle while directly supporting children and senior residents in vulnerable settings."}
              </p>
            </div>
          </div>

          {/* Filter Chips */}
          {!isLoading && destinations.length > 0 && (
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {[
                { id: 'all', label: `All Facilities (${destinations.length})` },
                { id: 'Orphanage', label: 'Orphanages & Youth Homes' },
                { id: 'Old Age Home', label: 'Old Age & Senior Homes' },
                { id: 'Shelter', label: 'Community Shelters' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                    filter === f.id 
                      ? 'bg-terracotta text-white shadow-sm' 
                      : 'bg-white/70 hover:bg-white text-sage border border-sage/25'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* Destinations Grid / Loading State */}
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 rounded-full border-2 border-sage/30 border-t-terracotta animate-spin" />
              <div className="text-center space-y-1">
                <p className="text-xs font-mono font-semibold text-terracotta">
                  Consulting Humanitarian Registries...
                </p>
                <p className="text-[11px] opacity-70" style={{ color: '#4a6048' }}>
                  Locating verified orphanages and senior care centers with urgent need for this item.
                </p>
              </div>
            </div>
          ) : filteredDestinations.length > 0 ? (
            <div className="space-y-3">
              {filteredDestinations.map((dest, idx) => (
                <div 
                  key={idx}
                  className="p-4 rounded-2xl border transition-all hover:bg-white/90 group"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.75)', 
                    borderColor: 'rgba(120, 149, 117, 0.3)' 
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-sage/15">
                    <div className="flex items-center gap-2">
                      <span 
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                          dest.type === 'Orphanage' 
                            ? 'bg-amber-100 text-amber-800' 
                            : dest.type === 'Old Age Home' 
                              ? 'bg-rose-100 text-rose-800' 
                              : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {dest.type === 'Orphanage' && <Baby className="w-3 h-3" />}
                        {dest.type === 'Old Age Home' && <Users className="w-3 h-3" />}
                        {dest.type !== 'Orphanage' && dest.type !== 'Old Age Home' && <Building className="w-3 h-3" />}
                        {dest.type}
                      </span>
                      <h4 className="font-['Orbitron'] font-bold text-sm tracking-wide text-[#2b3b29]">
                        {dest.name}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-terracotta/15 text-terracotta font-semibold">
                        {dest.urgency}
                      </span>
                      <span className="text-[11px] font-mono opacity-70" style={{ color: '#789575' }}>
                        {dest.distance}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2.5 space-y-2">
                    <div className="flex items-start gap-1.5 text-xs" style={{ color: '#3b4e39' }}>
                      <MapPin className="w-3.5 h-3.5 text-terracotta flex-shrink-0 mt-0.5" />
                      <span>{dest.address}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-sage/10 text-xs leading-relaxed" style={{ color: '#2b3b29' }}>
                      <strong className="text-sage font-semibold">Direct Human Impact: </strong>
                      {dest.impact}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px]">
                      <div className="flex items-center gap-1.5 text-sage/80 font-mono">
                        <Phone className="w-3 h-3" />
                        <span>{dest.contact}</span>
                      </div>
                      <button
                        onClick={() => alert(`Drop-off instructions for ${dest.name}:\nAddress: ${dest.address}\nContact: ${dest.contact}\nAccepted: ${dest.acceptedItems}`)}
                        className="self-start sm:self-auto px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        style={{ backgroundColor: '#D97746' }}
                      >
                        Initiate Drop-Off
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs opacity-70 font-mono">
              No recipient centers found for this filter.
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t flex items-center justify-between text-xs" style={{ borderColor: 'rgba(120, 149, 117, 0.25)', backgroundColor: 'rgba(255, 255, 255, 0.6)' }}>
          <span className="font-mono text-[10px] text-sage opacity-75">
            True Cycle Humanitarian Logistics Registry
          </span>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-full font-bold text-sage border border-sage/40 hover:bg-sage/15 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* 5. Certified Recycling & External Takeback Portal Modal */
function ExternalPortalModal({
  isOpen,
  onClose,
  specimen,
  analysisData,
  externalData,
  isLoading
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden border shadow-2xl flex flex-col"
        style={{ 
          backgroundColor: '#E5E8CE', 
          borderColor: '#789575' 
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(120, 149, 117, 0.25)', backgroundColor: 'rgba(255, 255, 255, 0.6)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0" style={{ backgroundColor: '#D97746' }}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-['Orbitron'] font-bold text-base sm:text-lg tracking-wider" style={{ color: '#2b3b29' }}>
                  Recycle Options & Recovery Directive
                </h3>
              </div>
              <p className="text-xs font-medium opacity-75 mt-0.5" style={{ color: '#4a6048' }}>
                Specialized circular routing for <strong className="text-terracotta">{analysisData?.productName || specimen?.name}</strong>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-sage/15 text-sage transition-all active:scale-90 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 rounded-full border-2 border-sage/30 border-t-terracotta animate-spin" />
              <div className="text-center space-y-1">
                <p className="text-xs font-mono font-semibold text-terracotta">
                  Resolving Certified Environmental Directories...
                </p>
                <p className="text-[11px] opacity-70" style={{ color: '#4a6048' }}>
                  Checking R2v3, e-Stewards, and municipal recovery channels.
                </p>
              </div>
            </div>
          ) : externalData ? (
            <>
              {/* Program Header Box */}
              <div 
                className="p-4 rounded-2xl border backdrop-blur-sm space-y-2"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.75)', 
                  borderColor: 'rgba(120, 149, 117, 0.3)' 
                }}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-sage/15 text-sage font-bold">
                    {externalData.programType || "Certified Recovery"}
                  </span>
                  {externalData.certification && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-terracotta/15 text-terracotta font-semibold">
                      {externalData.certification}
                    </span>
                  )}
                </div>
                <h4 className="font-['Orbitron'] font-bold text-lg text-[#2b3b29]">
                  {externalData.portalName}
                </h4>
                <p className="text-xs leading-relaxed opacity-85" style={{ color: '#3b4e39' }}>
                  {externalData.summary}
                </p>
              </div>

              {/* Step-by-Step Preparation Protocol */}
              {externalData.preparationSteps && (
                <div 
                  className="p-4 rounded-2xl border space-y-2"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.75)', 
                    borderColor: 'rgba(120, 149, 117, 0.3)' 
                  }}
                >
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-terracotta flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Preparation & Sorting Checklist
                  </span>
                  <div className="space-y-2 pt-1">
                    {externalData.preparationSteps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs leading-snug" style={{ color: '#2b3b29' }}>
                        <span className="w-5 h-5 rounded-full bg-sage/20 text-sage font-bold font-mono text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Accepted Materials */}
              {externalData.acceptedMaterials && (
                <div className="p-3 rounded-xl bg-sage/10 text-xs" style={{ color: '#2b3b29' }}>
                  <strong className="text-sage font-semibold">Accepted Streams: </strong>
                  {externalData.acceptedMaterials}
                </div>
              )}

              {/* Prominent External Portal Action Button */}
              <div className="pt-2">
                <a
                  href={externalData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider text-white shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  style={{ 
                    backgroundColor: '#D97746',
                    boxShadow: '0 8px 24px -4px rgba(217, 119, 70, 0.45)' 
                  }}
                >
                  <span>Launch Official Portal ({externalData.portalName})</span>
                  <ExternalLink className="w-4 h-4 text-white" />
                </a>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-xs opacity-70 font-mono">
              No certified external portal data available.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t flex items-center justify-between text-xs" style={{ borderColor: 'rgba(120, 149, 117, 0.25)', backgroundColor: 'rgba(255, 255, 255, 0.6)' }}>
          <span className="font-mono text-[10px] text-sage opacity-75">
            True Cycle Certified Partner Link
          </span>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-full font-bold text-sage border border-sage/40 hover:bg-sage/15 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* 6. Secret Engine Configuration Modal (API Key Failover Insurance) */
function EngineConfigModal({
  isOpen,
  onClose,
  engineConfig,
  selectedProvider,
  setSelectedProvider,
  inputGroqKey,
  setInputGroqKey,
  inputGeminiKey,
  setInputGeminiKey,
  showGroqKey,
  setShowGroqKey,
  showGeminiKey,
  setShowGeminiKey,
  onSave,
  onReset,
  isSaving,
  successMsg,
  errorMsg
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden border shadow-2xl flex flex-col"
        style={{
          backgroundColor: '#E5E8CE',
          borderColor: '#789575'
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'rgba(120, 149, 117, 0.25)', backgroundColor: 'rgba(255, 255, 255, 0.6)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0"
              style={{ backgroundColor: '#D97746' }}
            >
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-['Orbitron'] font-bold text-base sm:text-lg tracking-wider" style={{ color: '#2b3b29' }}>
                  Engine Configuration
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-terracotta/15 text-terracotta font-bold">
                  Failover Insurance
                </span>
              </div>
              <p className="text-xs font-medium opacity-75 mt-0.5" style={{ color: '#4a6048' }}>
                Switch active AI models, update API keys, and configure emergency failover.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-sage/15 text-sage transition-all active:scale-90 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-left scrollbar-thin">
          
          {/* Success / Error Banners */}
          {successMsg && (
            <div className="p-3 rounded-2xl border flex items-center gap-2 text-xs bg-emerald-500/10 border-emerald-500/40 text-emerald-900 font-semibold">
              <Check className="w-4 h-4 text-emerald-700" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="p-3 rounded-2xl border flex items-center gap-2 text-xs bg-red-500/10 border-red-500/40 text-red-900 font-semibold">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Choose Active Provider */}
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider font-bold block mb-2" style={{ color: '#789575' }}>
              Select Active AI Inference Engine
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Groq LPU */}
              <div
                onClick={() => setSelectedProvider('groq')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedProvider === 'groq'
                    ? 'bg-white border-terracotta shadow-md scale-[1.01]'
                    : 'bg-white/60 border-sage/30 hover:bg-white/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-['Orbitron'] font-bold text-xs uppercase tracking-wide" style={{ color: '#2b3b29' }}>
                    Groq LPU Vision
                  </span>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    selectedProvider === 'groq' ? 'bg-terracotta text-white' : 'bg-sage/15 text-sage'
                  }`}>
                    {selectedProvider === 'groq' ? 'Active Engine' : 'Primary'}
                  </span>
                </div>
                <div className="text-[11px] font-mono opacity-80" style={{ color: '#4a6048' }}>
                  Model: <strong className="text-sage font-semibold">qwen/qwen3.8-27b</strong>
                </div>
                <p className="text-[10px] leading-tight mt-1 opacity-70" style={{ color: '#4a6048' }}>
                  High-throughput LPU chip architecture. Near-instant inference, highly resistant to 429 quota exhaustion.
                </p>
              </div>

              {/* Option B: Google Gemini */}
              <div
                onClick={() => setSelectedProvider('gemini')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedProvider === 'gemini'
                    ? 'bg-white border-terracotta shadow-md scale-[1.01]'
                    : 'bg-white/60 border-sage/30 hover:bg-white/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-['Orbitron'] font-bold text-xs uppercase tracking-wide" style={{ color: '#2b3b29' }}>
                    Google Gemini
                  </span>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    selectedProvider === 'gemini' ? 'bg-terracotta text-white' : 'bg-sage/15 text-sage'
                  }`}>
                    {selectedProvider === 'gemini' ? 'Active Engine' : 'Failover Insurance'}
                  </span>
                </div>
                <div className="text-[11px] font-mono opacity-80" style={{ color: '#4a6048' }}>
                  Model: <strong className="text-sage font-semibold">gemini-1.5-flash</strong>
                </div>
                <p className="text-[10px] leading-tight mt-1 opacity-70" style={{ color: '#4a6048' }}>
                  Google multimodal foundation model. Seamless secondary insurance when switching API providers.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Key Management Inputs */}
          <div className="space-y-4 pt-1">
            {/* Groq Key Input */}
            <div className="p-3.5 rounded-2xl border bg-white/70" style={{ borderColor: 'rgba(120, 149, 117, 0.3)' }}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider font-bold" style={{ color: '#2b3b29' }}>
                  Groq API Key
                </label>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-sage/10 text-sage font-bold">
                  {engineConfig.groq_masked ? `Current: ${engineConfig.groq_masked}` : 'Not Configured'}
                </span>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showGroqKey ? 'text' : 'password'}
                  value={inputGroqKey}
                  onChange={(e) => setInputGroqKey(e.target.value)}
                  placeholder={engineConfig.groq_masked ? "Enter new key to override (starts with gsk_)" : "gsk_..."}
                  className="w-full pr-10 pl-3.5 py-2 rounded-xl text-xs font-mono bg-white border outline-none focus:border-terracotta"
                  style={{ borderColor: 'rgba(120, 149, 117, 0.35)', color: '#2b3b29' }}
                />
                <button
                  type="button"
                  onClick={() => setShowGroqKey(!showGroqKey)}
                  className="absolute right-2.5 p-1 text-sage hover:text-terracotta transition-colors cursor-pointer"
                >
                  {showGroqKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Gemini Key Input */}
            <div className="p-3.5 rounded-2xl border bg-white/70" style={{ borderColor: 'rgba(120, 149, 117, 0.3)' }}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider font-bold" style={{ color: '#2b3b29' }}>
                  Gemini API Key
                </label>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-sage/10 text-sage font-bold">
                  {engineConfig.gemini_masked ? `Current: ${engineConfig.gemini_masked}` : 'Not Configured'}
                </span>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={inputGeminiKey}
                  onChange={(e) => setInputGeminiKey(e.target.value)}
                  placeholder={engineConfig.gemini_masked ? "Enter new key to override (starts with AIza)" : "AIzaSy..."}
                  className="w-full pr-10 pl-3.5 py-2 rounded-xl text-xs font-mono bg-white border outline-none focus:border-terracotta"
                  style={{ borderColor: 'rgba(120, 149, 117, 0.35)', color: '#2b3b29' }}
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-2.5 p-1 text-sage hover:text-terracotta transition-colors cursor-pointer"
                >
                  {showGeminiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div 
          className="px-6 py-3.5 border-t flex items-center justify-between gap-3"
          style={{ borderColor: 'rgba(120, 149, 117, 0.25)', backgroundColor: 'rgba(255, 255, 255, 0.6)' }}
        >
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider border hover:bg-sage/10 transition-all cursor-pointer"
            style={{ borderColor: '#789575', color: '#789575' }}
            title="Clear manual overrides and reset to original .env defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider border hover:bg-sage/10 transition-all cursor-pointer"
              style={{ borderColor: '#789575', color: '#789575' }}
            >
              Cancel
            </button>

            <button
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: '#D97746' }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Apply</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [activeSlide, setActiveSlide] = useState(0);
  const [loadedYears, setLoadedYears] = useState({});

  const [showOptions, setShowOptions] = useState(false);
  const [fluidFlowing, setFluidFlowing] = useState(false);
  const [buttonsVisible, setButtonsVisible] = useState(false);
  
  // Persistent Analysis Data Cache (In-Memory & LocalStorage for Instant Access)
  const analysisCacheRef = useRef(new Map());

  const getCachedAnalysis = (specimenId) => {
    if (!specimenId) return null;
    const idStr = String(specimenId);
    if (analysisCacheRef.current.has(idStr)) {
      return analysisCacheRef.current.get(idStr);
    }
    try {
      const stored = localStorage.getItem(`tc_analysis_${idStr}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.composition || parsed.productName)) {
          analysisCacheRef.current.set(idStr, parsed);
          return parsed;
        }
      }
    } catch (e) {}
    return null;
  };

  const setCachedAnalysis = (specimenId, data) => {
    if (!specimenId || !data) return;
    const idStr = String(specimenId);
    analysisCacheRef.current.set(idStr, data);
    try {
      localStorage.setItem(`tc_analysis_${idStr}`, JSON.stringify(data));
    } catch (e) {}
  };

  // Input Station Images State (with Instant Local Persistence)
  const [stationImages, setStationImages] = useState(() => {
    try {
      const saved = localStorage.getItem('tc_station_images');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return [];
  });
  const [renamingId, setRenamingId] = useState(null);
  const [renameInput, setRenameInput] = useState('');

  // Active Selected Specimen & Forensic Analysis State (with Instant Hydration)
  const [selectedSpecimen, setSelectedSpecimen] = useState(() => {
    try {
      const saved = localStorage.getItem('tc_station_images');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0];
        }
      }
    } catch (e) {}
    return null;
  });

  const [analysisData, setAnalysisData] = useState(() => {
    try {
      const saved = localStorage.getItem('tc_station_images');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const first = parsed[0];
          if (first.analysisData) return first.analysisData;
          const stored = localStorage.getItem(`tc_analysis_${first.id}`);
          if (stored) return JSON.parse(stored);
        }
      }
    } catch (e) {}
    return null;
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  // Sync stationImages to localStorage whenever updated
  useEffect(() => {
    if (stationImages.length > 0) {
      try {
        const trimmed = stationImages.slice(0, 25);
        localStorage.setItem('tc_station_images', JSON.stringify(trimmed));
      } catch (e) {
        console.warn('LocalStorage save warning:', e);
      }
    }
  }, [stationImages]);

  // Secondary Background Pipeline States (Donations & External Portals)
  const [donationData, setDonationData] = useState(null);
  const [isFetchingDonations, setIsFetchingDonations] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);

  const [externalData, setExternalData] = useState(null);
  const [isFetchingExternal, setIsFetchingExternal] = useState(false);
  const [showExternalModal, setShowExternalModal] = useState(false);

  // Live Camera Viewfinder State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [capturedSnapshot, setCapturedSnapshot] = useState(null);
  const [photoNameInput, setPhotoNameInput] = useState('');

  // Firebase Authentication & Cloud Sync States
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [cloudSyncStatus, setCloudSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'
  const [cloudMessage, setCloudMessage] = useState('');

  // Secret Engine Configuration Modal States (API Failover Insurance)
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [engineConfig, setEngineConfig] = useState({
    active_provider: 'groq',
    groq_masked: '',
    gemini_masked: '',
    groq_configured: false,
    gemini_configured: false
  });
  const [inputGroqKey, setInputGroqKey] = useState('');
  const [inputGeminiKey, setInputGeminiKey] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('groq');
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configSuccessMsg, setConfigSuccessMsg] = useState('');
  const [configErrorMsg, setConfigErrorMsg] = useState('');

  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const slides = [
    {
      id: 'hero',
      type: 'hero',
      title: 'TRUE CYCLE',
      subtitle: 'a sincere effort to make an change',
    },
    {
      id: '2020',
      year: '2020',
      title: 'The Management Gap',
      body: '30% to 38% of global waste is mismanaged—either dumped openly or illegally burned.',
      highlight: '30% to 38%'
    },
    {
      id: '2030',
      year: '2030',
      title: 'Landfill Exhaustion',
      body: 'Hundreds of major cities will run out of landfill space. Simultaneously, methane from decomposing waste will act as a primary driver of rapid, short-term climate acceleration.',
      highlight: 'Landfill space exhaustion'
    },
    {
      id: '2050',
      year: '2050',
      title: 'The Breaking Point',
      body: 'Annual waste volume will surge by over 50%. Ocean plastics are projected to outweigh fish, pushing the annual global cost of waste management and environmental damage past $640 billion.',
      highlight: '$640 billion'
    },
    {
      id: 'action',
      type: 'cta',
      quote: "it's not about what might happen in the far future, it's about what's already underway and likely you or your sons or daughters might see and live through.",
      prompt: 'ready to start making a change?',
      buttonText: 'Enter True Cycle'
    }
  ];

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    const index = Math.round(scrollTop / clientHeight);
    if (index !== activeSlide) {
      setActiveSlide(index);
      setLoadedYears(prev => ({ ...prev, [index]: false }));
    }
  };

  const scrollToSlide = (index) => {
    if (!containerRef.current) return;
    containerRef.current.scrollTo({
      top: index * containerRef.current.clientHeight,
      behavior: 'smooth'
    });
  };

  const handleYearComplete = (slideIdx) => {
    setLoadedYears(prev => ({ ...prev, [slideIdx]: true }));
  };

  const handleCameraToggle = () => {
    if (!showOptions) {
      setShowOptions(true);
      setFluidFlowing(true);
      setButtonsVisible(false);

      setTimeout(() => {
        setButtonsVisible(true);
      }, 240);
    } else {
      setButtonsVisible(false);
      setFluidFlowing(false);
      setTimeout(() => {
        setShowOptions(false);
      }, 140);
    }
  };

  // Firebase Auth Listener & Auto-sync Cloud Specimens
  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      if (user) {
        setCloudSyncStatus('syncing');
        setCloudMessage('Syncing specimens...');
        try {
          const cloudItems = await loadUserSpecimensFromCloud(user.uid);
          if (cloudItems && cloudItems.length > 0) {
            // Index every cloud item's analysis into cache
            cloudItems.forEach((ci) => {
              if (ci.analysisData) {
                setCachedAnalysis(ci.id, ci.analysisData);
              }
            });

            // Merge cloud items with local state (ensuring analysisData is retained)
            setStationImages((prev) => {
              const prevMap = new Map(prev.map((p) => [String(p.id), p]));
              const merged = cloudItems.map((ci) => {
                const local = prevMap.get(String(ci.id));
                prevMap.delete(String(ci.id));
                const resolvedAnalysis = ci.analysisData || local?.analysisData || getCachedAnalysis(ci.id);
                return {
                  ...ci,
                  url: local?.url || ci.url,
                  analysisData: resolvedAnalysis,
                  hasCloudDoc: true
                };
              });
              const remainingLocal = Array.from(prevMap.values()).map(item => ({
                ...item,
                analysisData: item.analysisData || getCachedAnalysis(item.id)
              }));
              return [...merged, ...remainingLocal];
            });

            // Automatically select active specimen with immediate cached analysis
            setSelectedSpecimen((current) => {
              const active = current 
                ? { ...current, analysisData: current.analysisData || getCachedAnalysis(current.id) }
                : cloudItems[0];
              
              if (active) {
                const cached = active.analysisData || getCachedAnalysis(active.id);
                if (cached) {
                  setAnalysisData(cached);
                  setDonationData(cached.donationData || null);
                  setExternalData(cached.externalData || null);
                  setIsAnalyzing(false);
                }
                return { ...active, analysisData: cached || active.analysisData };
              }
              return current;
            });
          }
          setCloudSyncStatus('synced');
          setCloudMessage('Cloud Synced');
        } catch (err) {
          console.error('[Firebase] Failed to load cloud specimens:', err);
          setCloudSyncStatus('error');
          setCloudMessage('Sync failed');
        }
      } else {
        setCloudSyncStatus('idle');
        setCloudMessage('');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsAuthLoading(true);
    const { user, error } = await signInWithGoogle();
    setIsAuthLoading(false);
    if (error) {
      console.warn('Google Sign-In notice:', error);
    }
  };

  const handleSignOut = async () => {
    await logOut();
  };

  // On-Demand Handlers: Guarantee fresh data when opening modals
  const handleOpenDonationModal = async () => {
    setShowDonationModal(true);
    if (!donationData && !isFetchingDonations && analysisData) {
      setIsFetchingDonations(true);
      try {
        const data = await fetchDonationDestinations(
          analysisData.productName || selectedSpecimen?.name,
          analysisData.category || 'General Goods',
          analysisData.donateReason || 'Donation candidate'
        );
        setDonationData(data);
        if (selectedSpecimen?.id) {
          const currentCached = getCachedAnalysis(selectedSpecimen.id) || analysisData;
          const enriched = { ...currentCached, donationData: data };
          setCachedAnalysis(selectedSpecimen.id, enriched);
          setStationImages(prev => prev.map(img =>
            String(img.id) === String(selectedSpecimen.id) ? { ...img, analysisData: enriched } : img
          ));
        }
      } catch (err) {
        console.error('Donation on-demand fetch error:', err);
      } finally {
        setIsFetchingDonations(false);
      }
    }
  };

  const handleOpenExternalModal = async () => {
    setShowExternalModal(true);
    if (!externalData && !isFetchingExternal && analysisData) {
      setIsFetchingExternal(true);
      try {
        const data = await fetchExternalPortalGuide(
          analysisData.productName || selectedSpecimen?.name,
          analysisData.category || 'General Goods',
          'Recycle Options'
        );
        setExternalData(data);
        if (selectedSpecimen?.id) {
          const currentCached = getCachedAnalysis(selectedSpecimen.id) || analysisData;
          const enriched = { ...currentCached, externalData: data };
          setCachedAnalysis(selectedSpecimen.id, enriched);
          setStationImages(prev => prev.map(img =>
            String(img.id) === String(selectedSpecimen.id) ? { ...img, analysisData: enriched } : img
          ));
        }
      } catch (err) {
        console.error('External guide on-demand fetch error:', err);
      } finally {
        setIsFetchingExternal(false);
      }
    }
  };

  // Secret Engine Configuration Handlers (API Failover Insurance)
  const openConfigModal = async () => {
    setShowConfigModal(true);
    setConfigSuccessMsg('');
    setConfigErrorMsg('');
    try {
      const cfg = await getEngineConfig();
      setEngineConfig(cfg);
      const active = localStorage.getItem('ACTIVE_PROVIDER') || cfg.active_provider || 'groq';
      setSelectedProvider(active);
      setInputGroqKey(localStorage.getItem('GROQ_API_KEY') || '');
      setInputGeminiKey(localStorage.getItem('GEMINI_API_KEY') || '');
    } catch (e) {
      console.warn("Could not load engine config from server, using local fallbacks:", e);
      const active = localStorage.getItem('ACTIVE_PROVIDER') || 'groq';
      setSelectedProvider(active);
      setInputGroqKey(localStorage.getItem('GROQ_API_KEY') || '');
      setInputGeminiKey(localStorage.getItem('GEMINI_API_KEY') || '');
    }
  };

  const handleSaveConfig = async () => {
    setConfigSaving(true);
    setConfigSuccessMsg('');
    setConfigErrorMsg('');
    try {
      const payload = {
        active_provider: selectedProvider
      };
      if (inputGroqKey.trim()) payload.groq_api_key = inputGroqKey.trim();
      if (inputGeminiKey.trim()) payload.gemini_api_key = inputGeminiKey.trim();

      await updateEngineConfig(payload);

      localStorage.setItem('ACTIVE_PROVIDER', selectedProvider);
      if (inputGroqKey.trim()) localStorage.setItem('GROQ_API_KEY', inputGroqKey.trim());
      if (inputGeminiKey.trim()) localStorage.setItem('GEMINI_API_KEY', inputGeminiKey.trim());

      setConfigSuccessMsg(`Engine updated! Active provider: ${selectedProvider.toUpperCase()}`);
      const updated = await getEngineConfig();
      setEngineConfig(updated);
      setTimeout(() => setConfigSuccessMsg(''), 3000);
    } catch (err) {
      console.error("Config save error:", err);
      localStorage.setItem('ACTIVE_PROVIDER', selectedProvider);
      if (inputGroqKey.trim()) localStorage.setItem('GROQ_API_KEY', inputGroqKey.trim());
      if (inputGeminiKey.trim()) localStorage.setItem('GEMINI_API_KEY', inputGeminiKey.trim());
      setConfigSuccessMsg(`Client settings saved! Active provider: ${selectedProvider.toUpperCase()}`);
      setTimeout(() => setConfigSuccessMsg(''), 3000);
    } finally {
      setConfigSaving(false);
    }
  };

  const handleResetConfig = async () => {
    localStorage.removeItem('ACTIVE_PROVIDER');
    localStorage.removeItem('GROQ_API_KEY');
    localStorage.removeItem('GEMINI_API_KEY');
    setInputGroqKey('');
    setInputGeminiKey('');
    setSelectedProvider('groq');
    try {
      await updateEngineConfig({ active_provider: 'groq' });
      const updated = await getEngineConfig();
      setEngineConfig(updated);
    } catch (e) {}
    setConfigSuccessMsg('Reset to system defaults (Groq LPU active).');
    setTimeout(() => setConfigSuccessMsg(''), 2500);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      const reader = new FileReader();
      reader.onload = async (uploadEvent) => {
        const rawDataUrl = uploadEvent.target?.result;
        const compressedUrl = await createCompressedThumbnail(rawDataUrl);
        const newImage = {
          id: Date.now() + Math.random(),
          url: compressedUrl || rawDataUrl,
          name: cleanName || file.name,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setStationImages(prev => [newImage, ...prev]);
        // Auto-save initial item to cloud if logged in
        if (currentUser) {
          saveSpecimenToCloud(currentUser.uid, newImage, null);
        }
        handleSelectSpecimen(newImage);
        setShowOptions(false);
        setButtonsVisible(false);
        setIsCameraActive(false);
        stopCamera();
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  // Select a specimen from the Input Station and trigger forensic analysis
  const handleSelectSpecimen = async (specimen, forceRefresh = false) => {
    if (!specimen) return;
    setSelectedSpecimen(specimen);
    setAnalysisError(null);

    // 1. FAST PATH: Instant access from memory cache, specimen object, or localStorage
    const cachedData = !forceRefresh ? (specimen.analysisData || getCachedAnalysis(specimen.id)) : null;

    if (cachedData) {
      setAnalysisData(cachedData);
      setDonationData(cachedData.donationData || null);
      setExternalData(cachedData.externalData || null);
      setIsAnalyzing(false);
      setIsFetchingDonations(false);
      setIsFetchingExternal(false);

      // Keep specimen in stationImages synchronized with cached data
      if (!specimen.analysisData) {
        setStationImages(prev => prev.map(img => 
          String(img.id) === String(specimen.id) ? { ...img, analysisData: cachedData } : img
        ));
      }
      return;
    }

    // 2. SLOW PATH: Run full EcoLens AI forensic analysis
    setIsAnalyzing(true);
    setAnalysisData(null);
    setDonationData(null);
    setExternalData(null);
    setIsFetchingDonations(false);
    setIsFetchingExternal(false);

    try {
      // PRIMARY API CALL: Main page values ONLY via EcoLens Module
      const result = await analyzeProductImage(specimen.url, specimen.name);

      // Cache immediately in-memory and in localStorage
      setCachedAnalysis(specimen.id, result);
      setAnalysisData(result);
      setIsAnalyzing(false);

      // Update stationImages & selectedSpecimen so clicking any item is 0ms
      setStationImages(prev => prev.map(img => 
        String(img.id) === String(specimen.id) ? { ...img, analysisData: result } : img
      ));
      setSelectedSpecimen(prev => 
        prev && String(prev.id) === String(specimen.id) ? { ...prev, analysisData: result } : prev
      );

      // Auto-save specimen with analysis to Cloud Firestore if logged in
      if (currentUser) {
        setCloudSyncStatus('syncing');
        saveSpecimenToCloud(currentUser.uid, specimen, result)
          .then(() => setCloudSyncStatus('synced'))
          .catch((err) => {
            console.error('Cloud save failed:', err);
            setCloudSyncStatus('error');
          });
      }

      // SECONDARY BACKGROUND PROCESSING: Runs asynchronously ONLY when flagged true
      if (result.donate) {
        setIsFetchingDonations(true);
        fetchDonationDestinations(result.productName, result.category, result.donateReason)
          .then(data => {
            setDonationData(data);
            const currentCached = getCachedAnalysis(specimen.id) || result;
            const enriched = { ...currentCached, donationData: data };
            setCachedAnalysis(specimen.id, enriched);
            setStationImages(prev => prev.map(img => 
              String(img.id) === String(specimen.id) ? { ...img, analysisData: enriched } : img
            ));
            if (currentUser) {
              saveSpecimenAnalysisToCloud(currentUser.uid, specimen.id, enriched);
            }
          })
          .catch(err => console.error('Donation background fetch error:', err))
          .finally(() => setIsFetchingDonations(false));
      }

      if (result.external) {
        setIsFetchingExternal(true);
        fetchExternalPortalGuide(result.productName, result.category, result.externalTitle)
          .then(data => {
            setExternalData(data);
            const currentCached = getCachedAnalysis(specimen.id) || result;
            const enriched = { ...currentCached, externalData: data };
            setCachedAnalysis(specimen.id, enriched);
            setStationImages(prev => prev.map(img => 
              String(img.id) === String(specimen.id) ? { ...img, analysisData: enriched } : img
            ));
            if (currentUser) {
              saveSpecimenAnalysisToCloud(currentUser.uid, specimen.id, enriched);
            }
          })
          .catch(err => console.error('External portal background fetch error:', err))
          .finally(() => setIsFetchingExternal(false));
      }
    } catch (err) {
      console.error('Forensic analysis error:', err);
      setAnalysisError(err?.message || 'Forensic analysis failed. Check that the EcoLens server is running on port 8000.');
      setIsAnalyzing(false);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setCapturedSnapshot(null);
    setPhotoNameInput(`Item #${stationImages.length + 1}`);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access system camera. Please check camera permissions.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
    setCapturedSnapshot(null);
  };

  const snapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedSnapshot(dataUrl);
  };

  const confirmPhoto = async () => {
    if (!capturedSnapshot) return;
    const compressed = await createCompressedThumbnail(capturedSnapshot);
    const newImage = {
      id: Date.now() + Math.random(),
      url: compressed || capturedSnapshot,
      name: photoNameInput.trim() || `Item #${stationImages.length + 1}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setStationImages(prev => [newImage, ...prev]);
    if (currentUser) {
      saveSpecimenToCloud(currentUser.uid, newImage, null);
    }
    handleSelectSpecimen(newImage);
    stopCamera();
    setShowOptions(false);
    setButtonsVisible(false);
  };

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    setRenamingId(item.id);
    setRenameInput(item.name);
  };

  const saveRename = (id) => {
    if (!renameInput.trim()) return;
    const trimmed = renameInput.trim();
    setStationImages(prev => prev.map(img => img.id === id ? { ...img, name: trimmed } : img));
    if (selectedSpecimen?.id === id) {
      setSelectedSpecimen(prev => ({ ...prev, name: trimmed }));
    }
    if (currentUser) {
      updateSpecimenNameInCloud(currentUser.uid, id, trimmed);
    }
    setRenamingId(null);
    setRenameInput('');
  };

  const deleteImage = (id) => {
    if (currentUser) {
      deleteSpecimenFromCloud(currentUser.uid, id);
    }
    analysisCacheRef.current.delete(String(id));
    try {
      localStorage.removeItem(`tc_analysis_${id}`);
    } catch (e) {}
    setStationImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      if (selectedSpecimen?.id === id) {
        if (filtered.length > 0) {
          handleSelectSpecimen(filtered[0]);
        } else {
          setSelectedSpecimen(null);
          setAnalysisData(null);
          setDonationData(null);
          setExternalData(null);
        }
      }
      return filtered;
    });
  };

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  return (
    <div 
      className="relative w-full h-screen max-h-screen font-sans overflow-hidden select-none flex flex-col justify-between"
      style={{ backgroundColor: '#E5E8CE', color: '#789575' }}
    >
      
      {/* Hidden File Picker */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Persistent Header */}
      <header 
        className="relative z-50 flex-shrink-0 flex items-center justify-between px-6 md:px-12 py-4 transition-all"
        style={{ 
          backgroundColor: 'rgba(229, 232, 206, 0.92)', 
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(120, 149, 117, 0.2)' 
        }}
      >
        <div 
          className="flex items-center gap-3 cursor-pointer group select-none"
          onClick={() => {
            if (currentPage === 'main') {
              openConfigModal();
            } else {
              setCurrentPage('landing');
              scrollToSlide(0);
            }
          }}
          title={currentPage === 'main' ? "System Configuration & Engine Redundancy" : "True Cycle"}
        >
          <img 
            src="/assets/logo-sage.png" 
            alt="True Cycle Logo" 
            className="w-9 h-9 object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
          />
          <span 
            className="font-['Orbitron'] font-extrabold text-xl md:text-2xl tracking-[0.2em]"
            style={{ color: '#789575' }}
          >
            TRUE CYCLE
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* GOOGLE CLOUD SYNC & LOGIN BUTTON */}
          {isAuthLoading ? (
            <div className="h-8 px-3 rounded-full bg-sage/10 animate-pulse flex items-center justify-center text-[10px] font-mono text-sage">
              Connecting...
            </div>
          ) : currentUser ? (
            <div 
              className="flex items-center gap-2 px-3 py-1 rounded-full border shadow-xs transition-all backdrop-blur-sm"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                borderColor: 'rgba(120, 149, 117, 0.4)'
              }}
            >
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt={currentUser.displayName || "User"} 
                  className="w-6 h-6 rounded-full object-cover border border-sage/40"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-sage text-white flex items-center justify-center text-[10px] font-bold">
                  {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                </div>
              )}

              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-[11px] font-semibold truncate max-w-[120px]" style={{ color: '#2b3b29' }}>
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
                <span className="text-[9px] font-mono flex items-center gap-1 font-medium" style={{ color: '#789575' }}>
                  {cloudSyncStatus === 'syncing' ? (
                    <>
                      <Loader2 className="w-2.5 h-2.5 animate-spin text-terracotta" />
                      Syncing...
                    </>
                  ) : cloudSyncStatus === 'error' ? (
                    <span className="text-terracotta">Sync error</span>
                  ) : (
                    <>
                      <Cloud className="w-2.5 h-2.5 text-sage" />
                      Cloud Active
                    </>
                  )}
                </span>
              </div>

              <button
                onClick={handleSignOut}
                title="Sign out of Google"
                className="p-1 rounded-full hover:bg-sage/15 text-sage transition-all active:scale-90 ml-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-terracotta" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all border hover:bg-white/90 active:scale-95 cursor-pointer shadow-xs"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.75)',
                borderColor: 'rgba(120, 149, 117, 0.4)',
                color: '#2b3b29'
              }}
              title="Sign in with Google to auto-sync your scans to cloud"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Login</span>
            </button>
          )}

          {/* VIEW SWITCHER: Enter App / Storyline */}
          {currentPage === 'landing' ? (
            <button
              onClick={() => setCurrentPage('main')}
              className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase border transition-all hover:bg-sage/10 cursor-pointer"
              style={{ borderColor: '#789575', color: '#789575' }}
            >
              Enter App
            </button>
          ) : (
            <button
              onClick={() => setCurrentPage('landing')}
              className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase border transition-all hover:bg-sage/10 cursor-pointer"
              style={{ borderColor: '#789575', color: '#789575' }}
            >
              Storyline
            </button>
          )}
        </div>
      </header>

      {/* VIEW 1: STORYLINE SLIDES */}
      {currentPage === 'landing' ? (
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          className="w-full flex-1 overflow-y-auto snap-y snap-mandatory scroll-smooth"
        >
          <div className="fixed right-6 md:right-10 top-1/2 -translate-y-1/2 z-40 hidden sm:flex flex-col gap-3">
            {slides.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => scrollToSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className="group flex items-center justify-end gap-2 cursor-pointer"
              >
                <span 
                  className={`text-[10px] font-mono tracking-wider transition-opacity ${
                    activeSlide === idx ? 'opacity-100 font-bold' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  style={{ color: '#789575' }}
                >
                  {slide.year || (idx === 0 ? 'INTRO' : 'ACT')}
                </span>
                <div 
                  className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                  style={{ 
                    backgroundColor: activeSlide === idx ? '#D97746' : 'rgba(120, 149, 117, 0.35)',
                    transform: activeSlide === idx ? 'scale(1.4)' : 'scale(1)',
                    boxShadow: activeSlide === idx ? '0 0 10px rgba(217, 119, 70, 0.6)' : 'none'
                  }}
                />
              </button>
            ))}
          </div>

          {/* SLIDE 1: HERO */}
          <section className="w-full h-full snap-start relative flex flex-col justify-center items-center px-6 md:px-16 text-center">
            <div 
              className={`max-w-4xl space-y-6 transition-all duration-1000 ease-out transform ${
                activeSlide === 0 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
              }`}
            >
              <div 
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
                style={{ 
                  backgroundColor: 'rgba(120, 149, 117, 0.12)', 
                  color: '#789575',
                  border: '1px solid rgba(120, 149, 117, 0.25)' 
                }}
              >
                <Leaf className="w-3.5 h-3.5" style={{ color: '#789575' }} />
                Circular Reality Initiative
              </div>

              <h1 
                className="font-['Orbitron'] font-black text-5xl sm:text-7xl md:text-8xl tracking-[0.12em] leading-tight"
                style={{ color: '#789575' }}
              >
                TRUE CYCLE
              </h1>

              <p 
                className="text-lg sm:text-2xl md:text-3xl font-light tracking-wide italic max-w-2xl mx-auto"
                style={{ color: '#556d53' }}
              >
                a sincere effort to make an change
              </p>
            </div>

            <button 
              onClick={() => scrollToSlide(1)}
              className="absolute bottom-10 flex flex-col items-center gap-2 cursor-pointer transition-transform hover:translate-y-1"
              style={{ color: '#789575' }}
            >
              <span className="text-[11px] font-mono tracking-widest uppercase opacity-75">Scroll to explore</span>
              <ChevronDown className="w-5 h-5 animate-bounce" />
            </button>
          </section>

          {/* SLIDE 2: 2020 */}
          <section className="w-full h-full snap-start relative flex flex-col justify-center items-center px-6 md:px-16 text-center">
            <div className="max-w-3xl space-y-8">
              <div className="-mb-4 sm:-mb-6">
                <MorphingYear 
                  targetYear="2020" 
                  isActive={activeSlide === 1} 
                  onComplete={() => handleYearComplete(1)}
                />
              </div>

              <div 
                className={`space-y-6 transition-all duration-700 ease-out transform ${
                  loadedYears[1] 
                    ? 'opacity-100 translate-y-0 scale-100' 
                    : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
                }`}
              >
                <h2 
                  className="font-['Orbitron'] font-bold text-3xl sm:text-5xl md:text-6xl tracking-wide"
                  style={{ color: '#789575' }}
                >
                  The Management Gap
                </h2>

                <p 
                  className="text-xl sm:text-2xl md:text-3xl font-normal leading-relaxed max-w-2xl mx-auto"
                  style={{ color: '#3b4e39' }}
                >
                  <span className="font-semibold underline decoration-2 underline-offset-4" style={{ color: '#D97746' }}>
                    30% to 38%
                  </span>{' '}
                  of global waste is mismanaged—either dumped openly or illegally burned.
                </p>
              </div>
            </div>

            <button 
              onClick={() => scrollToSlide(2)}
              className="absolute bottom-10 flex flex-col items-center gap-2 cursor-pointer hover:translate-y-1 transition-transform"
              style={{ color: '#789575' }}
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </section>

          {/* SLIDE 3: 2030 */}
          <section className="w-full h-full snap-start relative flex flex-col justify-center items-center px-6 md:px-16 text-center">
            <div className="max-w-3xl space-y-8">
              <div className="-mb-4 sm:-mb-6">
                <MorphingYear 
                  targetYear="2030" 
                  isActive={activeSlide === 2} 
                  onComplete={() => handleYearComplete(2)}
                />
              </div>

              <div 
                className={`space-y-6 transition-all duration-700 ease-out transform ${
                  loadedYears[2] 
                    ? 'opacity-100 translate-y-0 scale-100' 
                    : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
                }`}
              >
                <h2 
                  className="font-['Orbitron'] font-bold text-3xl sm:text-5xl md:text-6xl tracking-wide"
                  style={{ color: '#789575' }}
                >
                  Landfill Exhaustion
                </h2>

                <p 
                  className="text-xl sm:text-2xl md:text-3xl font-normal leading-relaxed max-w-2xl mx-auto"
                  style={{ color: '#3b4e39' }}
                >
                  Hundreds of major cities will run out of landfill space. Simultaneously,{' '}
                  <span className="font-semibold" style={{ color: '#D97746' }}>
                    methane from decomposing waste
                  </span>{' '}
                  will act as a primary driver of rapid, short-term climate acceleration.
                </p>
              </div>
            </div>

            <button 
              onClick={() => scrollToSlide(3)}
              className="absolute bottom-10 flex flex-col items-center gap-2 cursor-pointer hover:translate-y-1 transition-transform"
              style={{ color: '#789575' }}
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </section>

          {/* SLIDE 4: 2050 */}
          <section className="w-full h-full snap-start relative flex flex-col justify-center items-center px-6 md:px-16 text-center">
            <div className="max-w-3xl space-y-8">
              <div className="-mb-4 sm:-mb-6">
                <MorphingYear 
                  targetYear="2050" 
                  isActive={activeSlide === 3} 
                  onComplete={() => handleYearComplete(3)}
                />
              </div>

              <div 
                className={`space-y-6 transition-all duration-700 ease-out transform ${
                  loadedYears[3] 
                    ? 'opacity-100 translate-y-0 scale-100' 
                    : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
                }`}
              >
                <h2 
                  className="font-['Orbitron'] font-bold text-3xl sm:text-5xl md:text-6xl tracking-wide"
                  style={{ color: '#789575' }}
                >
                  The Breaking Point
                </h2>

                <p 
                  className="text-xl sm:text-2xl md:text-3xl font-normal leading-relaxed max-w-2xl mx-auto"
                  style={{ color: '#3b4e39' }}
                >
                  Annual waste volume will surge by over{' '}
                  <span className="font-semibold" style={{ color: '#D97746' }}>50%</span>. 
                  Ocean plastics are projected to outweigh fish, pushing the annual global cost of waste management and environmental damage past{' '}
                  <span className="font-semibold" style={{ color: '#D97746' }}>$640 billion</span>.
                </p>
              </div>
            </div>

            <button 
              onClick={() => scrollToSlide(4)}
              className="absolute bottom-10 flex flex-col items-center gap-2 cursor-pointer hover:translate-y-1 transition-transform"
              style={{ color: '#789575' }}
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </section>

          {/* SLIDE 5: CLIMAX & CTA */}
          <section className="w-full h-full snap-start relative flex flex-col justify-center items-center px-6 md:px-16 text-center">
            <div 
              className={`max-w-4xl space-y-10 transition-all duration-1000 ease-out transform ${
                activeSlide === 4 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
              }`}
            >
              <blockquote 
                className="text-2xl sm:text-3xl md:text-4xl font-light leading-relaxed tracking-wide italic max-w-3xl mx-auto"
                style={{ color: '#2b3b29' }}
              >
                "it’s not about what might happen in the far future, it’s about what’s already underway and likely you or your sons or daughters might see and live through."
              </blockquote>

              <div className="pt-4 space-y-6">
                <h3 
                  className="font-['Orbitron'] font-bold text-2xl sm:text-4xl tracking-wider"
                  style={{ color: '#789575' }}
                >
                  ready to start making a change?
                </h3>

                <button
                  onClick={() => setCurrentPage('main')}
                  className="group inline-flex items-center gap-3 px-8 py-4 rounded-full text-base sm:text-lg font-bold tracking-wider uppercase shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                  style={{ 
                    backgroundColor: '#D97746', 
                    color: '#ffffff',
                    boxShadow: '0 12px 30px -5px rgba(217, 119, 70, 0.45)' 
                  }}
                >
                  <span>Enter True Cycle</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                </button>
              </div>
            </div>

            <div 
              className="absolute bottom-6 text-[11px] font-mono tracking-widest uppercase opacity-60 pointer-events-none"
              style={{ color: '#789575' }}
            >
              True Cycle • Circular Forensic Intelligence
            </div>
          </section>

        </div>
      ) : (
        /* VIEW 2: THE MAIN PAGE (Cemented to screen, NO vertical wiggle) */
        <main className="flex-1 w-full max-w-[1700px] mx-auto px-4 md:px-8 lg:px-12 py-3 flex items-center overflow-hidden">
          
          <div className="w-full h-full grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch max-h-[calc(100vh-125px)]">
            
            {/* LEFT 1/3 PORTION: INPUT STATION */}
            <div 
              className="md:col-span-4 xl:col-span-4 flex flex-col justify-between p-5 rounded-3xl relative overflow-hidden"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.35)',
                border: '1px dashed rgba(120, 149, 117, 0.35)'
              }}
            >
              
              {/* Top Header: Clean INPUT STATION Title */}
              {stationImages.length === 0 ? (
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-sage/10 text-sage">
                    <Sparkles className="w-3 h-3 text-terracotta" />
                    Input Station
                  </div>
                  <h2 
                    className="font-['Orbitron'] font-bold text-2xl sm:text-3xl leading-snug tracking-wide"
                    style={{ color: '#789575' }}
                  >
                    insert photo to continue
                  </h2>
                </div>
              ) : (
                <div className="flex items-center justify-between pb-2 border-b border-sage/20">
                  <span className="font-['Orbitron'] font-extrabold text-xs tracking-wider" style={{ color: '#789575' }}>
                    INPUT STATION
                  </span>
                  <span className="text-[10px] font-mono opacity-70" style={{ color: '#789575' }}>
                    Right-click rename
                  </span>
                </div>
              )}

              {/* Zero-Resistance Feather-Light Circular Roulette Carousel */}
              {stationImages.length > 0 && (
                <CircularRouletteFeed
                  items={stationImages}
                  activeSpecimenId={selectedSpecimen?.id}
                  onSelectSpecimen={handleSelectSpecimen}
                  renamingId={renamingId}
                  renameInput={renameInput}
                  setRenameInput={setRenameInput}
                  saveRename={saveRename}
                  handleContextMenu={handleContextMenu}
                  deleteImage={deleteImage}
                />
              )}

              {/* Bottom Trigger: Camera + Fluid Pipe + Accurately Aligned Buttons */}
              <div className="relative pt-2 min-h-[110px] flex items-center">
                <div className="relative flex items-center h-[110px]">
                  
                  {/* Primary Solid Orange Camera Button */}
                  <div className="relative z-20 flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center">
                    <button
                      onClick={handleCameraToggle}
                      aria-label="Toggle camera options"
                      className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 group"
                      style={{ 
                        backgroundColor: '#D97746', 
                        boxShadow: '0 8px 20px -3px rgba(217, 119, 70, 0.45)' 
                      }}
                    >
                      <Camera className="w-6 h-6 text-white group-hover:rotate-6 transition-transform" />
                    </button>
                  </div>

                  {/* Liquid Pipe SVG */}
                  {showOptions && (
                    <svg 
                      className="absolute left-[56px] top-0 pointer-events-none z-10"
                      width="54" 
                      height="110" 
                      viewBox="0 0 54 110"
                    >
                      <path 
                        d="M 0 55 C 22 55, 32 28, 54 28" 
                        fill="none" 
                        stroke="rgba(217, 119, 70, 0.2)" 
                        strokeWidth="3" 
                        strokeLinecap="round"
                      />
                      <path 
                        d="M 0 55 C 22 55, 32 82, 54 82" 
                        fill="none" 
                        stroke="rgba(217, 119, 70, 0.2)" 
                        strokeWidth="3" 
                        strokeLinecap="round"
                      />

                      {fluidFlowing && (
                        <>
                          <path 
                            d="M 0 55 C 22 55, 32 28, 54 28" 
                            fill="none" 
                            stroke="#D97746" 
                            strokeWidth="3" 
                            strokeLinecap="round"
                            strokeDasharray="90"
                            strokeDashoffset="90"
                            style={{
                              animation: 'liquidFlow 0.24s cubic-bezier(0.25, 1, 0.5, 1) forwards'
                            }}
                          />
                          <path 
                            d="M 0 55 C 22 55, 32 82, 54 82" 
                            fill="none" 
                            stroke="#D97746" 
                            strokeWidth="3" 
                            strokeLinecap="round"
                            strokeDasharray="90"
                            strokeDashoffset="90"
                            style={{
                              animation: 'liquidFlow 0.24s cubic-bezier(0.25, 1, 0.5, 1) forwards'
                            }}
                          />
                        </>
                      )}
                    </svg>
                  )}

                  {/* Two Branched Buttons */}
                  {showOptions && (
                    <div 
                      className={`absolute left-[110px] top-0 h-[110px] flex flex-col justify-between py-[10px] z-20 transition-all duration-200 transform ${
                        buttonsVisible 
                          ? 'opacity-100 translate-x-0 scale-100' 
                          : 'opacity-0 -translate-x-2 scale-90 pointer-events-none'
                      }`}
                    >
                      <button
                        onClick={startCamera}
                        className="h-[34px] flex items-center gap-2 px-4 rounded-full text-xs font-bold tracking-wider uppercase text-white shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                        style={{ backgroundColor: '#D97746' }}
                      >
                        <Camera className="w-3.5 h-3.5 text-white" />
                        <span>CAMERA</span>
                      </button>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="h-[34px] flex items-center gap-2 px-4 rounded-full text-xs font-bold tracking-wider uppercase text-white shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                        style={{ backgroundColor: '#D97746' }}
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-white" />
                        <span>FILES</span>
                      </button>
                    </div>
                  )}

                </div>
              </div>

            </div>

            {/* RIGHT 2/3 PORTION: FORENSIC SPECIMEN ANALYSIS CANVAS */}
            <div 
              className="md:col-span-8 xl:col-span-8 flex flex-col justify-between p-6 rounded-3xl relative overflow-hidden backdrop-blur-sm"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.45)',
                border: '1px solid rgba(120, 149, 117, 0.35)',
                boxShadow: '0 10px 30px -10px rgba(120, 149, 117, 0.15)'
              }}
            >
              
              {selectedSpecimen && analysisData ? (
                /* ACTIVE FORENSIC BREAKDOWN VIEW */
                <div className="flex-1 flex flex-col justify-start space-y-3.5 overflow-y-auto pr-1 scrollbar-thin">

                  {/* GUARDRAIL ALERT BANNER (when image fails physical object verification) */}
                  {analysisData.guardrail && analysisData.guardrail.is_valid_physical_object === false && (
                    <div
                      className="p-3 rounded-2xl border flex items-start gap-2.5 text-xs"
                      style={{
                        backgroundColor: 'rgba(217, 119, 70, 0.14)',
                        borderColor: 'rgba(217, 119, 70, 0.45)',
                        color: '#2b3b29'
                      }}
                    >
                      <AlertTriangle className="w-4 h-4 text-terracotta flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-['Orbitron'] font-bold uppercase text-[10px] tracking-wider text-terracotta">
                          Guardrail Notice • {analysisData.guardrail.guardrail_status || 'UNVERIFIED OBJECT'}
                        </span>
                        <p className="text-[11px] leading-snug mt-0.5 opacity-90">
                          {analysisData.guardrail.guardrail_notes || 'Please capture a clearer, well-lit image centered on a physical product.'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* TOP SECTION: 2 Side-by-Side Boxes (Summary on Left, Natural Aspect Image on Right) */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                    
                    {/* Top Left Box: Product Summary & Composition */}
                    <div 
                      className="md:col-span-7 p-3.5 sm:p-4 rounded-2xl border flex flex-col justify-between gap-2.5 backdrop-blur-sm"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.75)',
                        borderColor: 'rgba(120, 149, 117, 0.35)' 
                      }}
                    >
                      <div className="space-y-1.5">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-terracotta block truncate">
                            {analysisData.category || "Forensic Identification"}
                          </span>
                          <button
                            onClick={() => handleSelectSpecimen(selectedSpecimen, true)}
                            title="Re-run Forensic Analysis on this specimen"
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-sage/20 text-sage-900 transition-colors text-[10px] font-mono cursor-pointer"
                            style={{ color: '#4a6048' }}
                          >
                            <RefreshCw className="w-3 h-3 text-terracotta hover:rotate-180 transition-transform duration-500" />
                            <span className="opacity-75">Re-analyze</span>
                          </button>
                        </div>

                        <h3 
                          className="font-['Orbitron'] font-bold text-lg sm:text-xl tracking-wide leading-tight"
                          style={{ color: '#2b3b29' }}
                        >
                          {analysisData.productName || selectedSpecimen.name}
                        </h3>

                        <p className="text-xs font-normal leading-relaxed" style={{ color: '#4a6048' }}>
                          <span className="font-semibold text-sage-900">Composition: </span>
                          {analysisData.composition}
                        </p>

                        {/* Micro Layer Tags */}
                        {analysisData.layers && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {analysisData.layers.map((layer, idx) => (
                              <span 
                                key={idx} 
                                className="text-[9px] font-mono px-2 py-0.5 rounded-md border flex items-center gap-1"
                                style={{ 
                                  backgroundColor: 'rgba(229, 232, 206, 0.65)',
                                  borderColor: 'rgba(120, 149, 117, 0.3)',
                                  color: '#2b3b29'
                                }}
                              >
                                <Layers className="w-2.5 h-2.5 text-terracotta" />
                                <strong className="font-semibold">{layer.name}:</strong> {layer.material}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Top Right Box: Uploaded Image in Exact Natural Aspect Ratio */}
                    <div 
                      className="md:col-span-5 p-2 rounded-2xl border flex items-center justify-center relative overflow-hidden group min-h-[150px]"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.75)',
                        borderColor: 'rgba(120, 149, 117, 0.35)' 
                      }}
                    >
                      <img 
                        src={selectedSpecimen.url} 
                        alt={selectedSpecimen.name} 
                        className="max-h-[175px] w-auto max-w-full object-contain rounded-xl shadow-sm transition-transform duration-300 ease-out group-hover:scale-115 cursor-zoom-in"
                      />
                      
                    </div>

                  </div>

                  {/* MIDDLE SECTION: 3 Horizontal Rows for Recycle, Reduce, Reuse with 5-Star Scales */}
                  <div className="space-y-2.5 pt-1">
                    
                    {/* Row 1: RECYCLE */}
                    <div 
                      className="p-3 sm:p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all hover:bg-white/80"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.65)',
                        borderColor: 'rgba(120, 149, 117, 0.3)' 
                      }}
                    >
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-['Orbitron'] font-bold text-xs uppercase tracking-wider" style={{ color: '#2b3b29' }}>
                            Recycle
                          </span>
                        </div>
                        <p className="text-[11px] leading-snug mt-0.5 opacity-80" style={{ color: '#3b4e39' }}>
                          {analysisData.recycle?.details}
                        </p>
                      </div>
                      <div className="flex-shrink-0 sm:border-l sm:pl-5 border-sage/20">
                        <StarScale
                          score={analysisData.recycle?.score || 3}
                          exactStars={analysisData.recycle?.exactStars}
                        />
                      </div>
                    </div>

                    {/* Row 2: REDUCE */}
                    <div 
                      className="p-3 sm:p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all hover:bg-white/80"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.65)',
                        borderColor: 'rgba(120, 149, 117, 0.3)' 
                      }}
                    >
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-['Orbitron'] font-bold text-xs uppercase tracking-wider" style={{ color: '#2b3b29' }}>
                            Reduce
                          </span>
                        </div>
                        <p className="text-[11px] leading-snug mt-0.5 opacity-80" style={{ color: '#3b4e39' }}>
                          {analysisData.reduce?.details}
                        </p>
                      </div>
                      <div className="flex-shrink-0 sm:border-l sm:pl-5 border-sage/20">
                        <StarScale
                          score={analysisData.reduce?.score || 4}
                          exactStars={analysisData.reduce?.exactStars}
                        />
                      </div>
                    </div>

                    {/* Row 3: REUSE (+ DIY Project Worthy insights from EcoLens) */}
                    <div 
                      className="p-3 sm:p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all hover:bg-white/80"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.65)',
                        borderColor: 'rgba(120, 149, 117, 0.3)' 
                      }}
                    >
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-['Orbitron'] font-bold text-xs uppercase tracking-wider" style={{ color: '#2b3b29' }}>
                            Reuse
                          </span>
                          {analysisData.isDiyWorthy && (
                            <span
                              className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: 'rgba(120, 149, 117, 0.16)',
                                color: '#2b3b29'
                              }}
                              title={analysisData.diyReason || 'Suitable for safe DIY upcycling'}
                            >
                              <Wrench className="w-2.5 h-2.5 text-terracotta" />
                              DIY Worthy
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] leading-snug mt-0.5 opacity-80" style={{ color: '#3b4e39' }}>
                          {analysisData.reuse?.details}
                        </p>
                        {analysisData.isDiyWorthy && analysisData.suggestedDiyIdeas && analysisData.suggestedDiyIdeas.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {analysisData.suggestedDiyIdeas.slice(0, 2).map((idea, iIdx) => (
                              <span
                                key={iIdx}
                                className="text-[9px] font-mono px-2 py-0.5 rounded-md border"
                                style={{
                                  backgroundColor: 'rgba(229, 232, 206, 0.55)',
                                  borderColor: 'rgba(120, 149, 117, 0.3)',
                                  color: '#2b3b29'
                                }}
                              >
                                DIY: {idea}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0 sm:border-l sm:pl-5 border-sage/20">
                        <StarScale
                          score={analysisData.reuse?.score || 3}
                          exactStars={analysisData.reuse?.exactStars}
                        />
                      </div>
                    </div>

                  </div>

                  {/* BOTTOM ROW: CONDITIONAL BUTTONS (Donate on Left, External Guide on Right) */}
                  <div className="flex items-center justify-between gap-4 pt-2">
                    
                    {/* Left Button: DONATE (Conditional) */}
                    <div>
                      {analysisData.donate && (
                        <button
                          onClick={handleOpenDonationModal}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer group"
                          style={{ 
                            backgroundColor: '#789575',
                            boxShadow: '0 6px 16px -3px rgba(120, 149, 117, 0.4)' 
                          }}
                        >
                          <HeartHandshake className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                          <span>Donate Specimen</span>
                          {isFetchingDonations && !donationData && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Right Button: EXTERNAL SOURCE / PORTAL (Conditional) */}
                    <div>
                      {analysisData.external && (
                        <button
                          onClick={handleOpenExternalModal}
                          className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer group"
                          style={{ 
                            backgroundColor: '#D97746',
                            boxShadow: '0 6px 18px -3px rgba(217, 119, 70, 0.45)' 
                          }}
                        >
                          <span>Recycle Options</span>
                          <ExternalLink className="w-3.5 h-3.5 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          {isFetchingExternal && !externalData && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          )}
                        </button>
                      )}
                    </div>

                  </div>

                </div>
              ) : isAnalyzing ? (
                /* LOADING FORENSIC ANALYSIS STATE */
                <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-12">
                  <div className="w-14 h-14 rounded-full border-2 border-sage/30 border-t-terracotta animate-spin flex items-center justify-center" />
                  <div className="text-center">
                    <h3 className="font-['Orbitron'] font-bold text-lg tracking-wider" style={{ color: '#789575' }}>
                      Decomposing Material Layers...
                    </h3>
                    <p className="text-xs font-mono opacity-70 mt-1" style={{ color: '#4a6048' }}>
                      Analyzing forensic polymer resins via EcoLens Vision Module
                    </p>
                  </div>
                </div>
              ) : analysisError && selectedSpecimen ? (
                /* ERROR STATE WITH RETRY */
                <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-12 text-center px-6">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center border"
                    style={{
                      borderColor: 'rgba(217, 119, 70, 0.45)',
                      backgroundColor: 'rgba(217, 119, 70, 0.12)'
                    }}
                  >
                    <AlertTriangle className="w-7 h-7 text-terracotta" />
                  </div>
                  <div className="max-w-md space-y-1.5">
                    <h3 className="font-['Orbitron'] font-bold text-lg tracking-wider" style={{ color: '#2b3b29' }}>
                      Analysis Request Failed
                    </h3>
                    <p className="text-xs font-mono leading-relaxed opacity-85" style={{ color: '#4a6048' }}>
                      {analysisError}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSelectSpecimen(selectedSpecimen, true)}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    style={{ backgroundColor: '#D97746' }}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Analysis</span>
                  </button>
                </div>
              ) : (
                /* IDLE WAITING STATE */
                <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-12 text-center">
                  <div 
                    className="w-16 h-16 rounded-3xl flex items-center justify-center border-2 shadow-sm"
                    style={{ 
                      borderColor: 'rgba(120, 149, 117, 0.4)', 
                      backgroundColor: 'rgba(255, 255, 255, 0.5)' 
                    }}
                  >
                    <Sparkles className="w-8 h-8 text-terracotta" />
                  </div>
                  <div className="max-w-md space-y-1.5">
                    <h3 className="font-['Orbitron'] font-bold text-xl tracking-wider" style={{ color: '#789575' }}>
                      Select a Specimen to Inspect
                    </h3>
                    <p className="text-xs sm:text-sm font-normal leading-relaxed opacity-75" style={{ color: '#4a6048' }}>
                      Click on any card in the <strong className="font-semibold text-sage">Input Station</strong> on the left to reveal its forensic material summary, 3R ratings, and recycling routing.
                    </p>
                  </div>
                </div>
              )}

            </div>

          </div>

        </main>
      )}

      {/* Clean Minimal Footer */}
      <footer 
        className="relative z-20 flex-shrink-0 px-6 md:px-12 py-2 flex items-center justify-between text-[11px] border-t backdrop-blur-sm"
        style={{ 
          borderColor: 'rgba(120, 149, 117, 0.2)', 
          color: '#789575',
          backgroundColor: 'rgba(229, 232, 206, 0.95)'
        }}
      >
        <span>True Cycle © 2026</span>
        <span className="font-mono tracking-wider font-semibold">
          {selectedSpecimen ? `Active: ${selectedSpecimen.name}` : 'Awaiting Specimen Selection'}
        </span>
      </footer>

      {/* SYSTEM CAMERA VIEWFINDER MODAL */}
      {isCameraActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div 
            className="relative w-full max-w-lg rounded-3xl overflow-hidden p-6 border shadow-2xl flex flex-col items-center space-y-4"
            style={{ 
              backgroundColor: '#E5E8CE', 
              borderColor: '#789575',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)' 
            }}
          >
            <div className="w-full flex items-center justify-between border-b pb-3" style={{ borderColor: 'rgba(120, 149, 117, 0.3)' }}>
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5" style={{ color: '#D97746' }} />
                <span className="font-['Orbitron'] font-bold text-sm tracking-wider" style={{ color: '#789575' }}>
                  {capturedSnapshot ? 'Name Your Photo' : 'System Camera'}
                </span>
              </div>
              <button 
                onClick={stopCamera}
                className="p-1 rounded-full hover:bg-sage/10 text-sage cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black relative flex items-center justify-center">
              {!capturedSnapshot ? (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover"
                />
              ) : (
                <img 
                  src={capturedSnapshot} 
                  alt="Captured" 
                  className="w-full h-full object-cover"
                />
              )}
              
              {cameraError && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center text-white text-xs space-y-3">
                  <p className="text-red-400 font-medium">{cameraError}</p>
                  <button
                    onClick={() => { stopCamera(); fileInputRef.current?.click(); }}
                    className="px-4 py-2 rounded-full text-xs font-bold uppercase bg-terracotta text-white cursor-pointer"
                  >
                    Use File Explorer Instead
                  </button>
                </div>
              )}
            </div>

            {!cameraError && (
              <div className="w-full flex flex-col items-center gap-3 pt-1">
                {capturedSnapshot ? (
                  <div className="w-full space-y-3">
                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-sage">
                        Give this image a name:
                      </label>
                      <input
                        type="text"
                        autoFocus
                        value={photoNameInput}
                        onChange={(e) => setPhotoNameInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') confirmPhoto(); }}
                        placeholder="e.g. Noodle Cup, Plastic Bottle..."
                        className="w-full px-4 py-2.5 rounded-xl border outline-none font-semibold text-sm bg-white"
                        style={{ borderColor: '#789575', color: '#2b3b29' }}
                      />
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-1">
                      <button
                        onClick={() => setCapturedSnapshot(null)}
                        className="px-4 py-2 rounded-full font-semibold uppercase text-xs tracking-wider border hover:bg-sage/10 transition-all cursor-pointer"
                        style={{ borderColor: '#789575', color: '#789575' }}
                      >
                        Retake
                      </button>
                      <button
                        onClick={confirmPhoto}
                        className="flex items-center gap-2 px-6 py-2 rounded-full font-bold uppercase text-xs tracking-wider text-white shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        style={{ backgroundColor: '#D97746' }}
                      >
                        <Check className="w-4 h-4" />
                        <span>Add to Station</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={snapPhoto}
                      className="flex items-center gap-2 px-6 py-3 rounded-full font-bold uppercase text-xs tracking-wider text-white shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      style={{ 
                        backgroundColor: '#D97746',
                        boxShadow: '0 8px 20px -3px rgba(217, 119, 70, 0.5)' 
                      }}
                    >
                      <Camera className="w-4 h-4" />
                      <span>Snap Photo</span>
                    </button>
                    
                    <button
                      onClick={stopCamera}
                      className="px-5 py-3 rounded-full font-semibold uppercase text-xs tracking-wider border hover:bg-sage/10 transition-all cursor-pointer"
                      style={{ borderColor: '#789575', color: '#789575' }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* HUMANITARIAN REDISTRIBUTION MODAL */}
      <DonationRoutingModal
        isOpen={showDonationModal}
        onClose={() => setShowDonationModal(false)}
        specimen={selectedSpecimen}
        analysisData={analysisData}
        donationData={donationData}
        isLoading={isFetchingDonations}
      />

      {/* CERTIFIED RECYCLING & EXTERNAL TAKEBACK PORTAL MODAL */}
      <ExternalPortalModal
        isOpen={showExternalModal}
        onClose={() => setShowExternalModal(false)}
        specimen={selectedSpecimen}
        analysisData={analysisData}
        externalData={externalData}
        isLoading={isFetchingExternal}
      />

      {/* SECRET ENGINE CONFIGURATION & API FAILOVER MODAL */}
      <EngineConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        engineConfig={engineConfig}
        selectedProvider={selectedProvider}
        setSelectedProvider={setSelectedProvider}
        inputGroqKey={inputGroqKey}
        setInputGroqKey={setInputGroqKey}
        inputGeminiKey={inputGeminiKey}
        setInputGeminiKey={setInputGeminiKey}
        showGroqKey={showGroqKey}
        setShowGroqKey={setShowGroqKey}
        showGeminiKey={showGeminiKey}
        setShowGeminiKey={setShowGeminiKey}
        onSave={handleSaveConfig}
        onReset={handleResetConfig}
        isSaving={configSaving}
        successMsg={configSuccessMsg}
        errorMsg={configErrorMsg}
      />

    </div>
  );
}
