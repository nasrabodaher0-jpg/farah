import React, { useState, useEffect } from 'react';
import { HalaheelDoorCover } from './components/HalaheelDoorCover';
import { HalaheelHeroStage } from './components/HalaheelHeroStage';
import { HalaheelInvitationCard } from './components/HalaheelInvitationCard';
import { HalaheelCustomizeDrawer, DrawerTabType } from './components/HalaheelCustomizeDrawer';
import { HalaheelFloatingNav } from './components/HalaheelFloatingNav';
import { BabInvitationConfig, RSVPResponse, GuestWish } from './types';
import { DEFAULT_DEMO_BAB, INITIAL_WISHES } from './data/defaultConfig';
import { decodeInvitationFromUrl, isGuestModeUrl } from './utils/invitationCodec';

export default function App() {
  const [config, setConfig] = useState<BabInvitationConfig>(() => {
    // 1. Try decoding from URL query (if user opened a shared link)
    const fromUrl = decodeInvitationFromUrl();
    if (fromUrl) return fromUrl;

    // 2. Try loading from localStorage
    try {
      const saved = localStorage.getItem('halaheel_demo_bab_config');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }

    // 3. Fallback to default demo-bab (محمد & زينب)
    return DEFAULT_DEMO_BAB;
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTabType>('datetime');

  // Viewer / Guest protection mode
  const [isGuestView, setIsGuestView] = useState<boolean>(() => {
    return isGuestModeUrl();
  });

  // Track if current browser is owner/creator of the card
  const [isOwner, setIsOwner] = useState<boolean>(() => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('mode') === 'edit' || url.searchParams.get('mode') === 'owner') {
        return true;
      }
      if (!url.searchParams.has('inv')) {
        return true;
      }
      const fromUrl = decodeInvitationFromUrl();
      if (fromUrl && localStorage.getItem(`halaheel_is_owner_${fromUrl.id}`) === 'true') {
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  });

  // Automatically register creator as owner if creating/editing
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (!url.searchParams.has('inv') || url.searchParams.get('mode') === 'edit') {
        localStorage.setItem(`halaheel_is_owner_${config.id}`, 'true');
        setIsOwner(true);
      }
    } catch {
      // ignore
    }
  }, [config.id]);

  const [rsvps, setRsvps] = useState<RSVPResponse[]>(() => {
    try {
      const saved = localStorage.getItem(`rsvps_${config.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishes, setWishes] = useState<GuestWish[]>(() => {
    try {
      const saved = localStorage.getItem(`wishes_${config.id}`);
      return saved ? JSON.parse(saved) : INITIAL_WISHES;
    } catch {
      return INITIAL_WISHES;
    }
  });

  // Keep title updated with celebrant names
  useEffect(() => {
    const coupleName = config.isSingleName
      ? config.groom
      : `${config.groom} & ${config.bride}`;
    document.title = `${config.occasionKicker} ${coupleName}`;
  }, [config]);

  // Lock body when door is closed
  useEffect(() => {
    if (!isOpen) {
      document.body.classList.add('locked');
    } else {
      document.body.classList.remove('locked');
    }
    return () => {
      document.body.classList.remove('locked');
    };
  }, [isOpen]);

  const handleSaveConfig = (updated: BabInvitationConfig) => {
    setConfig(updated);
    try {
      localStorage.setItem('halaheel_demo_bab_config', JSON.stringify(updated));
      localStorage.setItem(`halaheel_is_owner_${updated.id}`, 'true');
      setIsOwner(true);
    } catch {
      // ignore
    }
  };

  const handleAddRSVP = (newRSVP: RSVPResponse) => {
    const updated = [newRSVP, ...rsvps];
    setRsvps(updated);
    try {
      localStorage.setItem(`rsvps_${config.id}`, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleAddWish = (newWish: GuestWish) => {
    const updated = [newWish, ...wishes];
    setWishes(updated);
    try {
      localStorage.setItem(`wishes_${config.id}`, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleRelockDoor = () => {
    setIsOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen">
      {/* Floating Host Tools & Guest Music Button */}
      <HalaheelFloatingNav
        config={config}
        isOpen={isOpen}
        isGuestView={isGuestView}
        isOwner={isOwner}
        onOpenDrawer={(tab) => {
          if (isGuestView) return;
          setDrawerTab(tab || 'share');
          setIsDrawerOpen(true);
        }}
        onOpenDoor={() => setIsOpen(true)}
        onRelockDoor={handleRelockDoor}
        onToggleGuestView={(val) => setIsGuestView(val)}
      />

      {/* The Authentic Door Cover (3 knocks -> video plays -> sound -> opens) */}
      <HalaheelDoorCover
        config={config}
        isOpen={isOpen}
        onOpen={() => setIsOpen(true)}
      />

      {/* Main Authentic Invitation Content */}
      <main className={`invite ${isOpen ? 'visible' : ''}`} id="invite" aria-hidden={!isOpen}>
        {/* Doves Garden Hero Stage */}
        <HalaheelHeroStage config={config} />

        {/* Content Card (Edit buttons hidden completely when in guest/viewer mode) */}
        <HalaheelInvitationCard
          config={config}
          rsvps={rsvps}
          onAddRSVP={handleAddRSVP}
          wishes={wishes}
          onAddWish={handleAddWish}
          onOpenEdit={
            !isGuestView
              ? (tab) => {
                  setDrawerTab(tab || 'datetime');
                  setIsDrawerOpen(true);
                }
              : undefined
          }
        />
      </main>

      {/* Customize & Share Drawer - ONLY accessible for host/owner */}
      {!isGuestView && (
        <HalaheelCustomizeDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          config={config}
          onSaveConfig={handleSaveConfig}
          onRelockDoor={handleRelockDoor}
          rsvps={rsvps}
          initialTab={drawerTab}
          onPreviewAsGuest={() => {
            setIsDrawerOpen(false);
            setIsGuestView(true);
          }}
        />
      )}
    </div>
  );
}
