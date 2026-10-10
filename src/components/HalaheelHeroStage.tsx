import React, { useEffect, useState } from 'react';
import { BabInvitationConfig } from '../types';

interface HalaheelHeroStageProps {
  config: BabInvitationConfig;
}

interface PetalItem {
  id: number;
  glyph: string;
  color: string;
  left: number;
  fontSize: number;
  duration: number;
  delay: number;
}

interface SparkItem {
  id: number;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
}

export const HalaheelHeroStage: React.FC<HalaheelHeroStageProps> = ({ config }) => {
  const [petals, setPetals] = useState<PetalItem[]>([]);
  const [sparks, setSparks] = useState<SparkItem[]>([]);

  useEffect(() => {
    // Generate flower petals
    const glyphs = ['❀', '✿', '❁', '✽', '❀'];
    const colors = ['#c3a1d6', '#b48fc9', '#d8c2e6', '#f0e0b4', '#c3a1d6'];
    const pArr: PetalItem[] = [];
    for (let i = 0; i < 16; i++) {
      pArr.push({
        id: i,
        glyph: glyphs[i % glyphs.length],
        color: colors[i % colors.length],
        left: Math.random() * 100,
        fontSize: 10 + Math.random() * 15,
        duration: 8 + Math.random() * 7,
        delay: Math.random() * 8,
      });
    }
    setPetals(pArr);

    // Generate gold sparkles
    const sArr: SparkItem[] = [];
    for (let i = 0; i < 22; i++) {
      sArr.push({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 2 + Math.random() * 4,
        duration: 2 + Math.random() * 3,
        delay: Math.random() * 4,
      });
    }
    setSparks(sArr);
  }, []);

  const handleScrollDown = () => {
    const cardEl = document.querySelector('.card');
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Floating flower petals and gold sparks */}
      <div className="fx" id="petals" aria-hidden="true">
        {petals.map((p) => (
          <span
            key={p.id}
            className="petal"
            style={{
              left: `${p.left}%`,
              color: p.color,
              fontSize: `${p.fontSize}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          >
            {p.glyph}
          </span>
        ))}
      </div>

      <div className="fx" id="sparkles" aria-hidden="true">
        {sparks.map((s) => (
          <span
            key={s.id}
            className="spark"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animationDuration: `${s.duration}s`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Hero Stage Section */}
      <section className="stage" id="stage">
        {/* Background garden dove video */}
        <video
          className="stage__vid is-ready"
          poster="/templates/bab/assets/hero-poster.jpg"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/templates/bab/assets/hero.mp4" type="video/mp4" />
        </video>

        <div className="stage__veil" aria-hidden="true" />

        <div className="stage__inner">
          <p className="stage__kicker">{config.occasionKicker}</p>
          <span className="stage__orn" aria-hidden="true">
            ✿
          </span>

          <h1 className="couple">
            {config.isSingleName ? (
              <span className="couple__name">{config.groom}</span>
            ) : (
              <>
                <span className="couple__name" id="heroGroom">
                  {config.groom}
                </span>
                <span className="couple__amp" aria-hidden="true">
                  &amp;
                </span>
                <span className="couple__name" id="heroBride">
                  {config.bride}
                </span>
              </>
            )}
          </h1>

          <p className="stage__date" id="heroDate">
            {config.dateText}
          </p>
          <p className="stage__time" id="heroTime">
            {config.timeText}
          </p>

          <p className="stage__sub" id="heroInvite">
            {config.heroSub}
          </p>

          <button
            type="button"
            onClick={handleScrollDown}
            className="scroll-cue cursor-pointer"
            aria-hidden="true"
          >
            <em>&#10087;</em>
            مرّر للأسفل
            <em>&#10087;</em>
            <b>&#8595;</b>
          </button>
        </div>
      </section>
    </>
  );
};
