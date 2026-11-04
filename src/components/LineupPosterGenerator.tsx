'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Download,
  Share2,
  Sparkles,
  Shirt,
  X,
  Check,
  ChevronRight,
  RefreshCw,
  Eye,
  Camera,
  Layers,
  Flame,
  Award,
  Calendar,
  MapPin,
  Clock,
  Shield,
  Upload,
} from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { api } from '@/lib/api';
import TeamCrest from '@/components/TeamCrest';

export interface SquadPlayerItem {
  id: number | string;
  player_id?: number | string;
  player_name: string;
  jersey_number?: number | string;
  is_starter: boolean;
  is_goalkeeper: boolean;
  is_captain?: boolean;
  position?: string;
  avatar_url?: string;
  profile_picture?: string;
  profile_picture_url?: string;
}

/**
 * Formats a player's full name according to Ethiopian tournament convention:
 * First name + Father's first capital letter initial (e.g. "Solomon Tesfaye" -> "SOLOMON T.").
 */
export function formatPlayerDisplayName(fullName: string, uppercase: boolean = true): string {
  if (!fullName) return 'PLAYER';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'PLAYER';

  const firstName = uppercase ? parts[0].toUpperCase() : parts[0];
  if (parts.length === 1) {
    return firstName;
  }

  const fatherName = parts[1];
  const fatherInitial = fatherName[0]?.toUpperCase() || '';
  return fatherInitial ? `${firstName} ${fatherInitial}.` : firstName;
}

export interface LineupPosterMatch {
  id: number | string;
  round_number?: number | string;
  match_date: string;
  kick_off_time?: string;
  venue?: string;
  home_team: {
    id?: number | string;
    name: string;
    batch_code?: string;
    color_hex?: string;
    nickname?: string;
    logo_url?: string;
    photo_url?: string;
  };
  away_team: {
    id?: number | string;
    name: string;
    batch_code?: string;
    color_hex?: string;
    nickname?: string;
    logo_url?: string;
    photo_url?: string;
  };
}

export interface LineupPosterGeneratorProps {
  match: LineupPosterMatch;
  homeSquad: SquadPlayerItem[];
  awaySquad: SquadPlayerItem[];
  isOpen: boolean;
  onClose: () => void;
  onPublished?: (announcement: any) => void;
}

// Tactical Formation coordinates (X%, Y% from top-left of pitch area)
interface FormationPosition {
  role: string;
  x: number; // 0 to 100
  y: number; // 0 to 100
}

const FORMATIONS: Record<string, { name: string; positions: FormationPosition[] }> = {
  '4-3-3': {
    name: '4-3-3 Attack',
    positions: [
      { role: 'GK', x: 50, y: 88 },
      { role: 'LB', x: 16, y: 70 },
      { role: 'CB', x: 38, y: 72 },
      { role: 'CB', x: 62, y: 72 },
      { role: 'RB', x: 84, y: 70 },
      { role: 'LCM', x: 28, y: 50 },
      { role: 'CM', x: 50, y: 53 },
      { role: 'RCM', x: 72, y: 50 },
      { role: 'LW', x: 22, y: 25 },
      { role: 'ST', x: 50, y: 18 },
      { role: 'RW', x: 78, y: 25 },
    ],
  },
  '4-2-3-1': {
    name: '4-2-3-1 Modern',
    positions: [
      { role: 'GK', x: 50, y: 88 },
      { role: 'LB', x: 16, y: 72 },
      { role: 'CB', x: 38, y: 75 },
      { role: 'CB', x: 62, y: 75 },
      { role: 'RB', x: 84, y: 72 },
      { role: 'DM', x: 36, y: 58 },
      { role: 'DM', x: 64, y: 58 },
      { role: 'LAM', x: 22, y: 38 },
      { role: 'CAM', x: 50, y: 36 },
      { role: 'RAM', x: 78, y: 38 },
      { role: 'ST', x: 50, y: 18 },
    ],
  },
  '4-4-2': {
    name: '4-4-2 Classic',
    positions: [
      { role: 'GK', x: 50, y: 88 },
      { role: 'LB', x: 16, y: 72 },
      { role: 'CB', x: 38, y: 75 },
      { role: 'CB', x: 62, y: 75 },
      { role: 'RB', x: 84, y: 72 },
      { role: 'LM', x: 18, y: 48 },
      { role: 'CM', x: 38, y: 50 },
      { role: 'CM', x: 62, y: 50 },
      { role: 'RM', x: 82, y: 48 },
      { role: 'ST', x: 36, y: 22 },
      { role: 'ST', x: 64, y: 22 },
    ],
  },
  '3-5-2': {
    name: '3-5-2 Dynamic',
    positions: [
      { role: 'GK', x: 50, y: 88 },
      { role: 'CB', x: 25, y: 74 },
      { role: 'CB', x: 50, y: 76 },
      { role: 'CB', x: 75, y: 74 },
      { role: 'LWB', x: 14, y: 50 },
      { role: 'CM', x: 36, y: 52 },
      { role: 'CM', x: 50, y: 54 },
      { role: 'CM', x: 64, y: 52 },
      { role: 'RWB', x: 86, y: 50 },
      { role: 'ST', x: 36, y: 22 },
      { role: 'ST', x: 64, y: 22 },
    ],
  },
  '3-4-3': {
    name: '3-4-3 Frontline',
    positions: [
      { role: 'GK', x: 50, y: 88 },
      { role: 'CB', x: 25, y: 74 },
      { role: 'CB', x: 50, y: 76 },
      { role: 'CB', x: 75, y: 74 },
      { role: 'LM', x: 16, y: 50 },
      { role: 'CM', x: 38, y: 52 },
      { role: 'CM', x: 62, y: 52 },
      { role: 'RM', x: 84, y: 50 },
      { role: 'LW', x: 22, y: 25 },
      { role: 'ST', x: 50, y: 19 },
      { role: 'RW', x: 78, y: 25 },
    ],
  },
};

export default function LineupPosterGenerator({
  match,
  homeSquad,
  awaySquad,
  isOpen,
  onClose,
  onPublished,
}: LineupPosterGeneratorProps) {
  const [teamSide, setTeamSide] = useState<'home' | 'away'>('home');
  const [formationKey, setFormationKey] = useState<string>('4-3-3');
  const [posterStyle, setPosterStyle] = useState<'matchday' | 'tactical'>('matchday');
  const [featuredPlayerId, setFeaturedPlayerId] = useState<string>('');
  const [customHeroPhoto, setCustomHeroPhoto] = useState<string | null>(null);
  const [customMotto, setCustomMotto] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Active Team & Squad calculation
  const currentTeam = teamSide === 'home' ? match.home_team : match.away_team;
  const opponentTeam = teamSide === 'home' ? match.away_team : match.home_team;
  const currentSquad = teamSide === 'home' ? homeSquad : awaySquad;

  // Starters (up to 11) and Subs
  const starters = useMemo(() => {
    const s = currentSquad.filter((p) => p.is_starter);
    // Sort so GK is first, then outfield players
    return s.sort((a, b) => (b.is_goalkeeper ? 1 : 0) - (a.is_goalkeeper ? 1 : 0));
  }, [currentSquad]);

  const substitutes = useMemo(() => {
    return currentSquad.filter((p) => !p.is_starter);
  }, [currentSquad]);

  // Featured player default selection (prioritize captain, or player with photo, or 1st starter)
  useEffect(() => {
    if (currentSquad.length > 0 && !featuredPlayerId) {
      const captain = currentSquad.find((p) => p.is_captain);
      const withPhoto = currentSquad.find((p) => Boolean(p.avatar_url || p.profile_picture || p.profile_picture_url));
      const firstStarter = starters[0];
      const best = captain || withPhoto || firstStarter || currentSquad[0];
      if (best) {
        setFeaturedPlayerId(String(best.player_id || best.id));
      }
    }
  }, [currentSquad, starters, featuredPlayerId]);

  // When team changes, reset featured player to suit new team
  const handleTeamChange = (newSide: 'home' | 'away') => {
    setTeamSide(newSide);
    const newSquad = newSide === 'home' ? homeSquad : awaySquad;
    const captain = newSquad.find((p) => p.is_captain);
    const withPhoto = newSquad.find((p) => Boolean(p.avatar_url || p.profile_picture || p.profile_picture_url));
    const best = captain || withPhoto || newSquad[0];
    if (best) {
      setFeaturedPlayerId(String(best.player_id || best.id));
    }
  };

  const featuredPlayer = useMemo(() => {
    return (
      currentSquad.find((p) => String(p.player_id || p.id) === String(featuredPlayerId)) ||
      starters[0] ||
      currentSquad[0] ||
      null
    );
  }, [currentSquad, starters, featuredPlayerId]);

  // Official theme color
  const teamColor = currentTeam.color_hex || (teamSide === 'home' ? '#F59E0B' : '#8B5CF6');

  // Format kick-off display
  const kickOffFormatted = match.kick_off_time ? match.kick_off_time.slice(0, 5) : '06:00';
  const matchDateFormatted = match.match_date || 'Matchday';

  /**
   * Helper to load an image into an HTMLImageElement with CORS enabled.
   */
  const loadImage = (src: string): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      if (!src) return resolve(null);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  };

  /**
   * Handle optional custom matchday action photo upload for the featured player hero.
   */
  const handleHeroImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCustomHeroPhoto(event.target.result as string);
        setFeedbackMsg({ text: '✓ Custom hero action photo loaded for poster!', type: 'success' });
      }
    };
    reader.readAsDataURL(file);
  };

  /**
   * High-Resolution 1080x1440 HTML5 Canvas Renderer
   * Implements the exact professional matchday layout from the user reference:
   * - Dramatic floodlit stadium on left
   * - Hero featured player portrait on left
   * - Dynamic sweeping colored curve in team official color
   * - Crisp bold condensed starting XI list (or tactical pitch board) & Subs on right
   */
  const renderCanvasPoster = async (allowRemoteImages = true): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1440;
    const ctx = canvas.getContext('2d')!;

    const width = 1080;
    const height = 1440;

    // 1. BASE BACKGROUND: Deep space midnight stadium atmosphere
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#060B19');
    bgGradient.addColorStop(0.5, '#0B132B');
    bgGradient.addColorStop(1, '#030712');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 2. STADIUM FLOODLIGHTS & AMBIENCE (Left and Center)
    const floodlight = ctx.createRadialGradient(260, 200, 10, 260, 200, 650);
    floodlight.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
    floodlight.addColorStop(0.3, 'rgba(16, 185, 129, 0.12)');
    floodlight.addColorStop(0.7, 'rgba(11, 19, 43, 0.05)');
    floodlight.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = floodlight;
    ctx.fillRect(0, 0, width, height);

    // 3. PITCH GRASS HINT (Bottom Left Ground)
    const pitchLight = ctx.createRadialGradient(200, 1350, 50, 200, 1350, 450);
    pitchLight.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
    pitchLight.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = pitchLight;
    ctx.fillRect(0, 900, 600, 540);

    // 4. DRAW FEATURED PLAYER HERO (Left Half)
    const playerPhotoUrl =
      customHeroPhoto ||
      featuredPlayer?.avatar_url ||
      featuredPlayer?.profile_picture ||
      featuredPlayer?.profile_picture_url;

    let playerImg: HTMLImageElement | null = null;
    if (playerPhotoUrl && allowRemoteImages) {
      playerImg = await loadImage(playerPhotoUrl);
    }

    ctx.save();
    // Clip left side area for featured player
    ctx.beginPath();
    ctx.rect(0, 0, 650, height);
    ctx.clip();

    if (playerImg) {
      // Calculate scaling to fill hero spot nicely
      const targetW = 540;
      const targetH = 820;
      const imgAspect = playerImg.width / playerImg.height;
      let drawW = targetW;
      let drawH = targetW / imgAspect;
      if (drawH < targetH) {
        drawH = targetH;
        drawW = targetH * imgAspect;
      }
      const drawX = 50;
      const drawY = 280;

      // Subtle player drop shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 45;
      ctx.shadowOffsetX = -10;
      ctx.shadowOffsetY = 15;

      ctx.drawImage(playerImg, drawX, drawY, drawW, drawH);

      // Bottom fade out into dark turf
      const bottomFade = ctx.createLinearGradient(0, 980, 0, height);
      bottomFade.addColorStop(0, 'rgba(11, 19, 43, 0)');
      bottomFade.addColorStop(0.7, 'rgba(6, 11, 25, 0.88)');
      bottomFade.addColorStop(1, '#060B19');
      ctx.fillStyle = bottomFade;
      ctx.fillRect(0, 980, 650, 460);
    } else {
      // Fallback: Elegant stylized vector jersey silhouette
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.arc(280, 560, 160, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = teamColor;
      ctx.font = '900 140px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(featuredPlayer?.jersey_number || '10'), 280, 610);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 28px sans-serif';
      ctx.fillText((featuredPlayer?.player_name || 'FEATURED STAR').toUpperCase(), 280, 670);
    }
    ctx.restore();

    // 5. TOP-LEFT BADGE: Focus Cup Round Emblem
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.ellipse(140, 130, 75, 45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#0B132B';
    ctx.stroke();

    ctx.fillStyle = '#0B132B';
    ctx.font = '900 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`RD ${match.round_number || '1'}`, 140, 142);
    ctx.restore();

    // 6. BOTTOM-LEFT BRANDING: AASTU Focus Fellowship
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '700 16px sans-serif';
    ctx.fillText('PRESENTED BY', 80, 1330);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 28px sans-serif';
    ctx.fillText('FOCUS FOOTBALL CUP', 80, 1365);

    ctx.fillStyle = teamColor;
    ctx.font = '800 16px sans-serif';
    ctx.fillText('AASTU FOCUS FELLOWSHIP • CHRIST ABOVE ALL', 80, 1395);
    ctx.restore();

    // 7. DYNAMIC SWEEPING S-CURVE RIGHT PANEL (Official Team Batch Color)
    ctx.save();
    ctx.beginPath();
    // Start at top-middle
    ctx.moveTo(560, 0);
    // Dynamic sweeping curve down to the left, then back
    ctx.bezierCurveTo(460, 400, 540, 850, 480, height);
    ctx.lineTo(width, height);
    ctx.lineTo(width, 0);
    ctx.closePath();

    // Fill with dynamic team gradient
    const panelGrad = ctx.createLinearGradient(480, 0, width, height);
    panelGrad.addColorStop(0, teamColor);
    panelGrad.addColorStop(1, '#0F172A');
    ctx.fillStyle = panelGrad;
    ctx.fill();

    // Vibrant accent border along curve
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.stroke();
    ctx.restore();

    // 8. TOP RIGHT FIXTURE HEADER & CRESTS
    ctx.save();
    const rightCenterX = 770;

    // Load and draw Team and Opponent logos if present
    const teamLogoUrl = currentTeam.photo_url || currentTeam.logo_url;
    const oppLogoUrl = opponentTeam.photo_url || opponentTeam.logo_url;

    let tLogo: HTMLImageElement | null = null;
    let oLogo: HTMLImageElement | null = null;
    if (allowRemoteImages) {
      [tLogo, oLogo] = await Promise.all([loadImage(teamLogoUrl || ''), loadImage(oppLogoUrl || '')]);
    }

    const crestY = 120;
    if (tLogo) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(rightCenterX - 65, crestY, 40, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(tLogo, rightCenterX - 105, crestY - 40, 80, 80);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(rightCenterX - 65, crestY, 40, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
    }
    if (oLogo) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(rightCenterX + 65, crestY, 40, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(oLogo, rightCenterX + 25, crestY - 40, 80, 80);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(rightCenterX + 65, crestY, 40, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
    }

    // Fixture Date & Kick-off pill
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(rightCenterX - 180, 185, 360, 42, 21);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 17px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${matchDateFormatted} • ${kickOffFormatted}`, rightCenterX, 212);
    ctx.restore();

    // 9. STARTING XI PRESENTATION (MATCHDAY LIST vs TACTICAL PITCH)
    if (posterStyle === 'matchday') {
      // Bold, Uppercase, Condensed Starting Lineup (Matchday Card Style)
      ctx.save();
      const listStartY = 280;
      const rowHeight = 72;
      const displayStarters = starters.slice(0, 11);

      displayStarters.forEach((player, idx) => {
        const y = listStartY + idx * rowHeight;
        const isCaptain = player.is_captain;
        const isGk = player.is_goalkeeper;

        const formattedName = formatPlayerDisplayName(player.player_name, true);
        const number = String(player.jersey_number || idx + 1);

        ctx.font = '900 46px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        const displayName = isCaptain ? `© ${formattedName}` : isGk ? `🧤 ${formattedName}` : formattedName;
        ctx.fillText(displayName, 950, y);

        ctx.font = '900 46px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(number, 975, y);
      });
      ctx.restore();
    } else {
      // Tactical Pitch Board Layout
      ctx.save();
      const pitchX = 540;
      const pitchY = 250;
      const pitchW = 490;
      const pitchH = 820;

      // Formation Header Banner
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.roundRect(pitchX, pitchY - 45, pitchW, 36, 18);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`FORMATION • ${FORMATIONS[formationKey]?.name || formationKey}`, pitchX + pitchW / 2, pitchY - 22);

      // Pitch Grass / Tactical Board Background
      const pitchGrad = ctx.createLinearGradient(pitchX, pitchY, pitchX + pitchW, pitchY + pitchH);
      pitchGrad.addColorStop(0, 'rgba(6, 78, 59, 0.85)');
      pitchGrad.addColorStop(1, 'rgba(4, 47, 46, 0.95)');
      ctx.fillStyle = pitchGrad;
      ctx.beginPath();
      ctx.roundRect(pitchX, pitchY, pitchW, pitchH, 20);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.stroke();

      // Pitch Markings: Halfway line, Center circle, Penalty areas
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(pitchX, pitchY + pitchH / 2);
      ctx.lineTo(pitchX + pitchW, pitchY + pitchH / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(pitchX + pitchW / 2, pitchY + pitchH / 2, 55, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeRect(pitchX + pitchW * 0.22, pitchY, pitchW * 0.56, pitchH * 0.16);
      ctx.strokeRect(pitchX + pitchW * 0.22, pitchY + pitchH * 0.84, pitchW * 0.56, pitchH * 0.16);
      ctx.restore();

      // Place starters according to formation positions
      const positions = FORMATIONS[formationKey]?.positions || FORMATIONS['4-3-3'].positions;
      const displayStarters = starters.slice(0, 11);

      displayStarters.forEach((player, idx) => {
        const pos = positions[idx] || { x: 50, y: 50 };
        const px = pitchX + (pos.x / 100) * pitchW;
        const py = pitchY + (pos.y / 100) * pitchH;

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 3;

        ctx.fillStyle = player.is_goalkeeper ? '#F59E0B' : '#FFFFFF';
        ctx.beginPath();
        ctx.arc(px, py, 22, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineWidth = 3;
        ctx.strokeStyle = teamColor;
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.fillStyle = '#0B132B';
        ctx.font = '900 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(player.jersey_number || idx + 1), px, py);
        ctx.restore();

        ctx.save();
        const formattedName = formatPlayerDisplayName(player.player_name, true);
        const labelText = player.is_captain ? `© ${formattedName}` : formattedName;

        ctx.font = '800 13px sans-serif';
        const labelWidth = ctx.measureText(labelText).width + 12;

        ctx.fillStyle = 'rgba(11, 19, 43, 0.85)';
        ctx.beginPath();
        ctx.roundRect(px - labelWidth / 2, py + 26, labelWidth, 20, 6);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(labelText, px, py + 40);
        ctx.restore();
      });
      ctx.restore();
    }

    // 10. SUBSTITUTES SECTION (Bottom Right)
    ctx.save();
    const subsY = 1110;

    // Subs heading in elegant script / serif
    ctx.font = 'italic 700 38px Georgia, serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText('Subs', rightCenterX, subsY);

    // Substitutes names formatted as First Name + Father Initial (e.g. BEREKET W. 14)
    const subNames = substitutes.map((p) => {
      const formatted = formatPlayerDisplayName(p.player_name, true);
      const num = p.jersey_number ? ` ${p.jersey_number}` : '';
      return `${formatted}${num}`;
    });

    const subsText = subNames.length > 0 ? subNames.join(', ') : 'NONE REPORTED';

    // Multi-line word wrap for subs
    ctx.font = '800 21px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'center';

    const maxSubWidth = 460;
    const words = subsText.split(' ');
    let line = '';
    let currentY = subsY + 45;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxSubWidth && n > 0) {
        ctx.fillText(line.trim(), rightCenterX, currentY);
        line = words[n] + ' ';
        currentY += 30;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), rightCenterX, currentY);
    ctx.restore();

    return canvas;
  };

  /**
   * Helper to retrieve poster Blob safely, retrying without remote CORS images if tainted.
   */
  const getPosterBlob = async (): Promise<{ blob: Blob; canvas: HTMLCanvasElement }> => {
    try {
      const canvas = await renderCanvasPoster(true);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 0.98));
      if (blob) return { blob, canvas };
      throw new Error('Canvas encoding produced null');
    } catch (err) {
      console.warn('CORS or canvas tainting encountered, generating vector-safe poster:', err);
      const fallbackCanvas = await renderCanvasPoster(false);
      const blob = await new Promise<Blob | null>((resolve) => fallbackCanvas.toBlob(resolve, 'image/png', 0.98));
      if (!blob) throw new Error('Failed to encode poster image.');
      return { blob, canvas: fallbackCanvas };
    }
  };

  /**
   * Download high-resolution PNG locally to the manager's device.
   */
  const handleDownload = async () => {
    setIsExporting(true);
    setFeedbackMsg(null);
    try {
      const { blob } = await getPosterBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `FocusCup_StartingXI_${currentTeam.name.replace(/\s+/g, '_')}_Round${match.round_number || 1}.png`;
      link.download = filename;
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setFeedbackMsg({ text: '✓ Lineup poster downloaded in high resolution (1080×1440)!', type: 'success' });
    } catch (err: any) {
      console.error(err);
      setFeedbackMsg({ text: 'Failed to generate poster: ' + (err.message || 'Unknown error'), type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Publish poster directly as an official tournament announcement,
   * uploading directly to Cloudinary and pinning to the public hero carousel.
   */
  const handlePublishAnnouncement = async () => {
    setIsPublishing(true);
    setFeedbackMsg(null);
    try {
      const { blob } = await getPosterBlob();

      // Direct upload to Cloudinary
      const uploadRes = await uploadToCloudinary(blob, 'focus_fellowship/lineups');
      const imageUrl = uploadRes.secure_url;

      // Construct high-impact announcement content
      const starterListText = starters
        .slice(0, 11)
        .map((p, i) => `${i + 1}. ${p.player_name} #${p.jersey_number || 'NA'}${p.is_captain ? ' (C)' : ''}`)
        .join(', ');

      const subsListText = substitutes.map((p) => `${p.player_name} #${p.jersey_number || 'NA'}`).join(', ');

      const announcementPayload = {
        title: `🔥 Official Starting XI: ${currentTeam.name} vs ${opponentTeam.name}`,
        category: 'MATCH_DAY',
        priority: 'IMPORTANT',
        content: `Official starting line-up confirmed for Round ${match.round_number || '1'} showdown! Match date: ${matchDateFormatted} at ${kickOffFormatted} (${match.venue || 'AASTU Football Field'}). Starters: ${starterListText}. Subs: ${subsListText || 'None'}. Playing for His Glory!`,
        image_url: imageUrl,
        is_pinned: true,
      };

      const created = await api.community.createAnnouncement(announcementPayload);
      setFeedbackMsg({
        text: '✓ Starting Lineup Poster published to homepage hero carousel and broadcasted to members!',
        type: 'success',
      });
      onPublished?.(created);
    } catch (err: any) {
      console.error(err);
      setFeedbackMsg({
        text: 'Publishing failed: ' + (err?.data?.error || err.message || 'Unknown error'),
        type: 'error',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-3xl bg-[#0B132B] border border-purple-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#161D36] border-b border-[#2C3960] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                Starting Lineup Poster Studio
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  AUTOMATED
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Matchday graphic generator with dynamic pitch formations and featured player spotlight
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          {/* Controls Column (Left, 5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Team Selector */}
            <div className="p-4 rounded-2xl bg-[#161D36] border border-[#2C3960] space-y-2">
              <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                Select Team Roster
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleTeamChange('home')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 justify-center cursor-pointer ${
                    teamSide === 'home'
                      ? 'bg-purple-600/30 border-purple-400 text-white shadow-md'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <TeamCrest team={match.home_team} size="xs" />
                  <span className="truncate">{match.home_team.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTeamChange('away')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 justify-center cursor-pointer ${
                    teamSide === 'away'
                      ? 'bg-purple-600/30 border-purple-400 text-white shadow-md'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <TeamCrest team={match.away_team} size="xs" />
                  <span className="truncate">{match.away_team.name}</span>
                </button>
              </div>
            </div>

            {/* Featured Player Selector */}
            <div className="p-4 rounded-2xl bg-[#161D36] border border-[#2C3960] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Spotlight Featured Player
                </label>
                <span className="text-[10px] text-slate-400">Photo on left hero panel</span>
              </div>
              <select
                value={featuredPlayerId}
                onChange={(e) => {
                  setFeaturedPlayerId(e.target.value);
                  setCustomHeroPhoto(null);
                }}
                className="w-full px-3 py-2 rounded-xl bg-[#0B132B] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-purple-400"
              >
                {currentSquad.map((p) => {
                  const pId = String(p.player_id || p.id);
                  const isStarter = p.is_starter ? ' (XI)' : ' (Sub)';
                  const cap = p.is_captain ? ' [C]' : '';
                  const num = p.jersey_number ? ` #${p.jersey_number}` : '';
                  return (
                    <option key={pId} value={pId}>
                      {p.player_name}
                      {num}
                      {cap}
                      {isStarter}
                    </option>
                  );
                })}
              </select>

              <div className="flex items-center justify-between pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleHeroImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer border border-[#2C3960] transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-purple-400" />
                  <span>Upload Action Photo</span>
                </button>
                {customHeroPhoto && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomHeroPhoto(null);
                      setFeedbackMsg({ text: 'Reverted to official player profile photo.', type: 'success' });
                    }}
                    className="text-[11px] font-semibold text-rose-400 hover:underline cursor-pointer"
                  >
                    Reset to Profile Photo
                  </button>
                )}
              </div>
            </div>

            {/* Poster Layout Style & Formation */}
            <div className="p-4 rounded-2xl bg-[#161D36] border border-[#2C3960] space-y-3">
              <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                Poster Style &amp; Formation
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPosterStyle('matchday')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                    posterStyle === 'matchday'
                      ? 'bg-purple-600/30 border-purple-400 text-white'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400'
                  }`}
                >
                  Matchday Card (Premier Style)
                </button>
                <button
                  type="button"
                  onClick={() => setPosterStyle('tactical')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                    posterStyle === 'tactical'
                      ? 'bg-purple-600/30 border-purple-400 text-white'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400'
                  }`}
                >
                  Tactical Pitch Board
                </button>
              </div>

              {posterStyle === 'tactical' && (
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Tactical System</label>
                  <select
                    value={formationKey}
                    onChange={(e) => setFormationKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B132B] border border-[#2C3960] text-xs text-white focus:outline-none"
                  >
                    {Object.keys(FORMATIONS).map((k) => (
                      <option key={k} value={k}>
                        {FORMATIONS[k].name} ({k})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Squad Summary Pill */}
            <div className="p-4 rounded-2xl bg-[#161D36]/60 border border-[#2C3960]/60 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300 font-semibold">
                <span>Starting XI Confirmed:</span>
                <span className="text-emerald-400 font-bold">{starters.length}/11 Players</span>
              </div>
              <div className="flex items-center justify-between text-slate-300 font-semibold">
                <span>Substitutes Bench:</span>
                <span className="text-purple-300 font-bold">{substitutes.length} Players</span>
              </div>
              {starters.length < 11 && (
                <p className="text-[11px] text-amber-300 font-medium">
                  ⚠️ Note: {starters.length} starters selected. Poster will display confirmed starters.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={isExporting || isPublishing}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Rendering High-Res 1080p PNG...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Download High-Quality PNG (1080×1440)
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePublishAnnouncement}
                disabled={isExporting || isPublishing}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Uploading &amp; Publishing to Homepage...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Publish Directly to Homepage Carousel
                  </>
                )}
              </button>
            </div>

            {feedbackMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold border ${
                  feedbackMsg.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                }`}
              >
                {feedbackMsg.text}
              </div>
            )}
          </div>

          {/* Live Preview Column (Right, 7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-[#070D1E] rounded-3xl p-4 sm:p-6 border border-[#2C3960]/60 relative">
            <span className="absolute top-3 left-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
              <Eye className="w-3 h-3" /> Live Poster Preview
            </span>

            {/* Poster Canvas / DOM Mock Container (Aspect 3:4) */}
            <div
              ref={previewRef}
              className="relative w-full max-w-[420px] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 select-none flex"
              style={{ backgroundColor: '#060B19' }}
            >
              {/* Left Side: Hero Player Section */}
              <div className="w-[52%] h-full relative overflow-hidden flex flex-col justify-between p-4 z-10">
                {/* Stadium floodlight background overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-[#060B19]/90 pointer-events-none" />

                {/* Top Badge: Focus Cup Round */}
                <div className="relative z-10 self-start">
                  <div className="px-3 py-1 rounded-full bg-white text-[#0B132B] font-black text-[11px] shadow-lg border border-slate-300 flex items-center gap-1">
                    <span>RD {match.round_number || 1}</span>
                  </div>
                </div>

                {/* Featured Player Image */}
                <div className="absolute inset-0 flex items-center justify-center z-0 pt-16">
                  {customHeroPhoto ||
                  featuredPlayer?.avatar_url ||
                  featuredPlayer?.profile_picture ||
                  featuredPlayer?.profile_picture_url ? (
                    <img
                      src={
                        customHeroPhoto ||
                        featuredPlayer?.avatar_url ||
                        featuredPlayer?.profile_picture ||
                        featuredPlayer?.profile_picture_url
                      }
                      alt={featuredPlayer?.player_name || 'Featured Player'}
                      className="w-full h-full object-cover object-top drop-shadow-2xl"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div
                        className="w-24 h-24 rounded-3xl border-2 flex items-center justify-center font-black text-3xl shadow-xl"
                        style={{ borderColor: teamColor, color: teamColor }}
                      >
                        #{featuredPlayer?.jersey_number || '10'}
                      </div>
                      <span className="text-[10px] font-bold text-white mt-2 uppercase tracking-wider">
                        {featuredPlayer?.player_name || 'Hero Player'}
                      </span>
                    </div>
                  )}
                  {/* Subtle fade to bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#060B19] to-transparent" />
                </div>

                {/* Bottom Left Sponsor Tag */}
                <div className="relative z-10">
                  <p className="text-[8px] uppercase tracking-widest text-slate-400 font-bold">PRESENTED BY</p>
                  <p className="text-[11px] font-black text-white leading-tight">FOCUS FOOTBALL CUP</p>
                  <p className="text-[8px] font-extrabold" style={{ color: teamColor }}>
                    AASTU FELLOWSHIP • CHRIST FIRST
                  </p>
                </div>
              </div>

              {/* Dynamic Curved Divider & Right Panel */}
              <div
                className="w-[48%] h-full relative p-3 flex flex-col justify-between z-10"
                style={{
                  background: `linear-gradient(135deg, ${teamColor} 0%, #0F172A 100%)`,
                  clipPath: 'polygon(12% 0, 100% 0, 100% 100%, 0% 100%)',
                }}
              >
                {/* Header: Crests & Match Info */}
                <div className="text-center space-y-1 pt-1 pl-2">
                  <div className="flex items-center justify-center gap-2">
                    <TeamCrest team={currentTeam} size="xs" />
                    <span className="text-[9px] font-black text-white">VS</span>
                    <TeamCrest team={opponentTeam} size="xs" />
                  </div>
                  <div className="inline-block px-2 py-0.5 rounded-full bg-black/40 text-white font-extrabold text-[8px] tracking-wide">
                    {matchDateFormatted.slice(0, 10)} • {kickOffFormatted}
                  </div>
                </div>

                {/* Content: Matchday Card Style vs Tactical Pitch */}
                {posterStyle === 'matchday' ? (
                  <div className="my-auto space-y-1 pl-3 text-right">
                    {starters.slice(0, 11).map((p, idx) => {
                      const formattedName = formatPlayerDisplayName(p.player_name, true);
                      const num = p.jersey_number || idx + 1;
                      return (
                        <div key={idx} className="flex items-center justify-end gap-1.5 leading-none">
                          <span className="text-white font-black text-[13px] tracking-tight truncate drop-shadow-md">
                            {p.is_captain && <span className="text-amber-300 mr-0.5">©</span>}
                            {p.is_goalkeeper && <span className="mr-0.5 text-[10px]">🧤</span>}
                            {formattedName}
                          </span>
                          <span className="text-white font-black text-[13px] w-5 text-left">{num}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Tactical Pitch Board Preview */
                  <div className="relative my-auto h-[55%] rounded-xl bg-emerald-900/60 border border-emerald-400/40 p-1 flex flex-col justify-between overflow-hidden">
                    {/* Pitch markings */}
                    <div className="absolute inset-x-0 top-1/2 h-[1px] bg-white/30" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-white/30" />

                    {/* Formations positions */}
                    {FORMATIONS[formationKey]?.positions.slice(0, starters.length).map((pos, i) => {
                      const p = starters[i];
                      if (!p) return null;
                      return (
                        <div
                          key={i}
                          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                        >
                          <div className="w-4 h-4 rounded-full bg-white text-slate-950 font-black text-[8px] flex items-center justify-center shadow">
                            {p.jersey_number || i + 1}
                          </div>
                          <span className="text-[7px] font-bold text-white bg-black/70 px-1 rounded truncate max-w-[50px]">
                            {formatPlayerDisplayName(p.player_name, true)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Substitutes Footer */}
                <div className="text-center pt-1 border-t border-white/20 pl-2">
                  <span className="text-[11px] font-serif italic font-bold text-white block">Subs</span>
                  <p className="text-[8px] font-bold text-white/90 line-clamp-2 uppercase">
                    {substitutes.map((s) => `${formatPlayerDisplayName(s.player_name, true)}${s.jersey_number ? ` ${s.jersey_number}` : ''}`).join(', ') || 'NONE REPORTED'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
