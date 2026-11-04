'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Download,
  Share2,
  Sparkles,
  X,
  RefreshCw,
  Eye,
  Camera,
  Layers,
  Flame,
  Award,
  Calendar,
  Clock,
  Shield,
  Upload,
  Copy,
  Check,
  Radio,
  Trophy,
} from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { api } from '@/lib/api';
import TeamCrest from '@/components/TeamCrest';
import { formatPlayerDisplayName } from '@/components/LineupPosterGenerator';

export interface MatchBroadcastData {
  id: number | string;
  round_number?: number | string;
  match_date: string;
  kick_off_time?: string;
  venue?: string;
  status: string; // 'SCHEDULED' | 'LIVE' | 'COMPLETED'
  home_score: number;
  away_score: number;
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
  potm_name?: string;
  player_of_the_match?: {
    id?: number | string;
    full_name: string;
    avatar_url?: string;
    profile_picture?: string;
    profile_picture_url?: string;
    batch?: string;
    personal_chant?: string;
  };
  events?: Array<{
    id?: number | string;
    event_type: string;
    minute: number;
    player_name?: string;
    team_id?: number | string;
    team_name?: string;
    player_photo?: string;
  }>;
}

export interface MatchBroadcastGraphicGeneratorProps {
  match: MatchBroadcastData;
  eligiblePlayers?: Array<{
    id: number | string;
    full_name: string;
    competing_batch?: string;
    avatar_url?: string;
    profile_picture?: string;
    profile_picture_url?: string;
    jersey_number?: number | string;
  }>;
  isOpen: boolean;
  onClose: () => void;
  onPublished?: (announcement: any) => void;
}

export default function MatchBroadcastGraphicGenerator({
  match,
  eligiblePlayers = [],
  isOpen,
  onClose,
  onPublished,
}: MatchBroadcastGraphicGeneratorProps) {
  // Operational Modes: 'LIVE' or 'FINAL'
  const isMatchCompleted = match.status === 'COMPLETED';
  const [operationalMode, setOperationalMode] = useState<'LIVE' | 'FINAL'>(
    isMatchCompleted ? 'FINAL' : 'LIVE'
  );

  // Match state controls
  const [liveMinute, setLiveMinute] = useState<number>(() => {
    if (isMatchCompleted) return 90;
    const goalMinutes = (match.events || [])
      .filter((e) => e.event_type === 'GOAL')
      .map((e) => e.minute);
    return goalMinutes.length > 0 ? Math.max(...goalMinutes) : 45;
  });

  const [homeScoreState, setHomeScoreState] = useState<number>(match.home_score || 0);
  const [awayScoreState, setAwayScoreState] = useState<number>(match.away_score || 0);

  // Extract goal scorers from match events
  const computedGoalScorers = useMemo(() => {
    const homeGoals: string[] = [];
    const awayGoals: string[] = [];

    const sortedEvents = [...(match.events || [])].sort((a, b) => a.minute - b.minute);

    sortedEvents.forEach((evt) => {
      if (evt.event_type === 'GOAL') {
        const pName = formatPlayerDisplayName(evt.player_name || 'Player', false);
        const formatted = `${pName} ${evt.minute}'`;
        if (Number(evt.team_id) === Number(match.home_team.id)) {
          homeGoals.push(formatted);
        } else {
          awayGoals.push(formatted);
        }
      } else if (evt.event_type === 'OWN_GOAL') {
        const pName = formatPlayerDisplayName(evt.player_name || 'Player', false);
        const formatted = `${pName} (OG) ${evt.minute}'`;
        // Own goal credits to opposing team
        if (Number(evt.team_id) === Number(match.home_team.id)) {
          awayGoals.push(formatted);
        } else {
          homeGoals.push(formatted);
        }
      }
    });

    return { home: homeGoals, away: awayGoals };
  }, [match.events, match.home_team.id]);

  const [customHomeGoalScorer, setCustomHomeGoalScorer] = useState<string>('');
  const [customAwayGoalScorer, setCustomAwayGoalScorer] = useState<string>('');
  const [homeScorersList, setHomeScorersList] = useState<string[]>(computedGoalScorers.home);
  const [awayScorersList, setAwayScorersList] = useState<string[]>(computedGoalScorers.away);

  // Sync scorers when match events change
  useEffect(() => {
    setHomeScorersList(computedGoalScorers.home);
    setAwayScorersList(computedGoalScorers.away);
  }, [computedGoalScorers]);

  // POTM selection
  const [selectedPotmId, setSelectedPotmId] = useState<string>(() => {
    if (match.player_of_the_match?.id) return String(match.player_of_the_match.id);
    return '';
  });
  const [customPotmPhoto, setCustomPotmPhoto] = useState<string | null>(null);
  const [showPromptDrawer, setShowPromptDrawer] = useState<boolean>(false);
  const [promptCopied, setPromptCopied] = useState<boolean>(false);

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Candidate POTM list
  const potmCandidate = useMemo(() => {
    if (selectedPotmId) {
      const found = eligiblePlayers.find((p) => String(p.id) === String(selectedPotmId));
      if (found) {
        const batchCode = found.competing_batch || '';
        const teamName =
          batchCode === match.home_team.batch_code
            ? match.home_team.name
            : batchCode === match.away_team.batch_code
            ? match.away_team.name
            : match.home_team.name;
        return {
          id: found.id,
          name: found.full_name,
          team: teamName,
          photo_url:
            customPotmPhoto ||
            found.avatar_url ||
            found.profile_picture ||
            found.profile_picture_url,
        };
      }
    }

    if (match.player_of_the_match) {
      return {
        id: match.player_of_the_match.id,
        name: match.player_of_the_match.full_name,
        team: match.player_of_the_match.batch || match.home_team.name,
        photo_url:
          customPotmPhoto ||
          match.player_of_the_match.avatar_url ||
          match.player_of_the_match.profile_picture ||
          match.player_of_the_match.profile_picture_url,
      };
    }

    return null;
  }, [selectedPotmId, eligiblePlayers, match, customPotmPhoto]);

  // Synchronized JSON State matching exact operational rules
  const currentJsonState = useMemo(() => {
    return {
      status: operationalMode === 'FINAL' ? 'FULL TIME' : 'LIVE',
      minute: liveMinute,
      teams: {
        home: match.home_team.name,
        away: match.away_team.name,
      },
      score: {
        home: homeScoreState,
        away: awayScoreState,
      },
      goal_scorers: {
        home: homeScorersList,
        away: awayScorersList,
      },
      potm: operationalMode === 'FINAL' ? potmCandidate : null,
    };
  }, [
    operationalMode,
    liveMinute,
    match.home_team.name,
    match.away_team.name,
    homeScoreState,
    awayScoreState,
    homeScorersList,
    awayScorersList,
    potmCandidate,
  ]);

  // Dynamic Prompt Instruction formatted per system specifications
  const generatedPromptInstruction = useMemo(() => {
    const homeGoalsStr = homeScorersList.length > 0 ? homeScorersList.join(', ') : 'None';
    const awayGoalsStr = awayScorersList.length > 0 ? awayScorersList.join(', ') : 'None';

    const potmSection =
      operationalMode === 'LIVE'
        ? 'If status is LIVE, keep this box empty/subdued.'
        : `If status is FULL TIME, insert the player photo for ${
            potmCandidate?.name || 'Player of the Match'
          }, with their name and team (${
            potmCandidate?.team || match.home_team.name
          }) clearly written underneath alongside a subtle trophy icon.`;

    const statusBanner = operationalMode === 'FINAL' ? "ensure the top banner reads 'FULL TIME'" : `ensure the top banner reads 'LIVE ${liveMinute}\\''`;

    return `Using image as the base background template, update the graphic with the following current match state:

- Tournament Header: Keep tournament name, date, and team logos (${match.home_team.name} vs ${match.away_team.name}) fixed in place.
- Scoreboard: Set the central score to ${homeScoreState} - ${awayScoreState}. ${statusBanner}.
- Goal Scorers Section: Display the current list chronologically under each team header. Home scorers: [${homeGoalsStr}]. Away scorers: [${awayGoalsStr}].
- Player of the Match Section: ${potmSection}
- Style: Maintain crisp typography, high contrast, and clean Premier League aesthetic spacing suitable for mobile screens.`;
  }, [
    operationalMode,
    liveMinute,
    match.home_team.name,
    match.away_team.name,
    homeScoreState,
    awayScoreState,
    homeScorersList,
    awayScorersList,
    potmCandidate,
  ]);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPromptInstruction);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  };

  /**
   * Helper to load an image with anonymous CORS
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
   * Canvas 2D Renderer for Premier League Match Broadcast Graphic
   * Composited cleanly on top of the base template layout reference (825 x 1024)
   */
  const renderCanvasGraphic = async (allowRemote = true): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    canvas.width = 825;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // 1. Draw base template image or deep stadium background
    const baseTemplate = await loadImage('/templates/broadcast_template.jpg');
    if (baseTemplate) {
      ctx.drawImage(baseTemplate, 0, 0, 825, 1024);
    } else {
      // High-end fallback stadium background
      const grad = ctx.createLinearGradient(0, 0, 0, 1024);
      grad.addColorStop(0, '#060B19');
      grad.addColorStop(0.6, '#0B132B');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 825, 1024);
    }

    // 2. TOURNAMENT HEADER (Top Bar)
    ctx.save();
    // Clean solid dark fill over top bar area (wiping out any previous text or Premier League logo)
    ctx.fillStyle = '#0E1522';
    ctx.fillRect(45, 40, 735, 55);
    ctx.strokeStyle = '#2A364F';
    ctx.lineWidth = 1;
    ctx.strokeRect(45, 40, 735, 55);

    // Subtle vertical dividers between sections
    ctx.beginPath();
    ctx.moveTo(265, 40);
    ctx.lineTo(265, 95);
    ctx.moveTo(565, 40);
    ctx.lineTo(565, 95);
    ctx.strokeStyle = 'rgba(42, 54, 79, 0.7)';
    ctx.stroke();

    // Top Left: Project Identity (NO Premier League lion!)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('✝ FOCUS CUP', 75, 72);

    // Top Center: Tournament Name
    ctx.font = '900 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FOCUS FOOTBALL CUP 2026', 415, 72);

    // Top Right: Date & Round
    ctx.font = '700 12px sans-serif';
    ctx.fillStyle = 'rgba(203, 213, 225, 0.9)';
    ctx.textAlign = 'center';
    const dateVenue = `${match.match_date || 'MATCHDAY'} | ROUND ${match.round_number || 1}`;
    ctx.fillText(dateVenue, 672, 72);
    ctx.restore();

    // 3. SCOREBOARD: TOP BANNER (FULL TIME vs LIVE [MINUTE]')
    ctx.save();
    const bannerX = 300;
    const bannerY = 125;
    const bannerW = 225;
    const bannerH = 40;

    if (operationalMode === 'FINAL') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(bannerX, bannerY, bannerW, bannerH);
      ctx.fillStyle = '#0F172A';
      ctx.font = '900 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FULL TIME', bannerX + bannerW / 2, bannerY + 26);
    } else {
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(bannerX, bannerY, bannerW, bannerH);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 17px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`🔴 LIVE • ${liveMinute}'`, bannerX + bannerW / 2, bannerY + 26);
    }

    // 4. SCOREBOARD: CENTRAL SCORE
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(bannerX, bannerY + bannerH, bannerW, 110);

    ctx.fillStyle = '#0F172A';
    ctx.font = '900 62px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(homeScoreState), 350, 245);
    ctx.fillStyle = '#64748B';
    ctx.fillText('-', 412, 242);
    ctx.fillStyle = '#0F172A';
    ctx.fillText(String(awayScoreState), 475, 245);
    ctx.restore();

    // 5. SCOREBOARD: TEAM CRESTS & TEAM NAMES
    const homeLogoUrl = match.home_team.photo_url || match.home_team.logo_url;
    const awayLogoUrl = match.away_team.photo_url || match.away_team.logo_url;
    let homeImg: HTMLImageElement | null = null;
    let awayImg: HTMLImageElement | null = null;

    if (allowRemote) {
      [homeImg, awayImg] = await Promise.all([
        loadImage(homeLogoUrl || ''),
        loadImage(awayLogoUrl || ''),
      ]);
    }

    // Home Crest (Circle at x:217, y:215, r:55)
    ctx.save();
    if (homeImg) {
      ctx.beginPath();
      ctx.arc(217, 215, 55, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(homeImg, 162, 160, 110, 110);
    } else {
      ctx.fillStyle = match.home_team.color_hex || '#F59E0B';
      ctx.beginPath();
      ctx.arc(217, 215, 55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0F172A';
      ctx.font = '900 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(match.home_team.batch_code?.slice(0, 3) || 'HME', 217, 215);
    }
    ctx.restore();

    // Away Crest (Shield at x:610, y:215)
    ctx.save();
    if (awayImg) {
      ctx.beginPath();
      ctx.arc(610, 215, 55, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(awayImg, 555, 160, 110, 110);
    } else {
      ctx.fillStyle = match.away_team.color_hex || '#8B5CF6';
      ctx.beginPath();
      ctx.arc(610, 215, 55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(match.away_team.batch_code?.slice(0, 3) || 'AWY', 610, 215);
    }
    ctx.restore();

    // Home and Away Team Name Bars (Clean solid white pills covering old text)
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(135, 278, 162, 32);
    ctx.fillRect(528, 278, 162, 32);

    ctx.fillStyle = '#0F172A';
    ctx.font = '900 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(match.home_team.name.toUpperCase(), 216, 294);
    ctx.fillText(match.away_team.name.toUpperCase(), 609, 294);
    ctx.restore();

    // 6. GOAL SCORERS SECTION
    ctx.save();
    // Header bar
    ctx.fillStyle = '#121B2E';
    ctx.fillRect(134, 340, 558, 33);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GOAL SCORERS', 413, 362);

    const rowsY = 373;
    const rowHeight = 32;
    const maxRows = 5;

    for (let i = 0; i < maxRows; i++) {
      const currentY = rowsY + i * rowHeight;
      const homeScorer = homeScorersList[i];
      const awayScorer = awayScorersList[i];

      // Clean white row background
      ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      ctx.fillRect(134, currentY, 558, rowHeight - 2);

      // Center divider
      ctx.fillStyle = '#CBD5E1';
      ctx.font = '700 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('||', 413, currentY + 20);

      // Home Scorer
      if (homeScorer) {
        ctx.fillStyle = '#0F172A';
        ctx.font = '800 13px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${homeScorer} ⚽`, 395, currentY + 20);
      }

      // Away Scorer
      if (awayScorer) {
        ctx.fillStyle = '#0F172A';
        ctx.font = '800 13px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`⚽ ${awayScorer}`, 430, currentY + 20);
      }
    }

    if (homeScorersList.length === 0 && awayScorersList.length === 0) {
      ctx.fillStyle = '#64748B';
      ctx.font = 'italic 600 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No goals scored at this point', 413, rowsY + 2 * rowHeight + 20);
    }
    ctx.restore();

    // 7. PLAYER OF THE MATCH SECTION
    ctx.save();
    // Header
    ctx.fillStyle = '#121B2E';
    ctx.fillRect(224, 560, 377, 35);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PLAYER OF THE MATCH', 412, 582);

    const potmBoxX = 224;
    const potmBoxY = 595;
    const potmBoxW = 377;
    const potmBoxH = 260;

    // Cleanly wipe card background
    ctx.fillStyle = '#0B1324';
    ctx.fillRect(potmBoxX, potmBoxY, potmBoxW, potmBoxH);
    ctx.strokeStyle = '#2A364F';
    ctx.lineWidth = 1;
    ctx.strokeRect(potmBoxX, potmBoxY, potmBoxW, potmBoxH);

    if (operationalMode === 'LIVE') {
      ctx.fillStyle = '#F59E0B';
      ctx.font = '900 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏆', 412, 695);

      ctx.fillStyle = '#CBD5E1';
      ctx.font = '900 16px sans-serif';
      ctx.fillText('DECIDED AT FULL TIME', 412, 745);

      ctx.font = '600 12px sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText('Live match in progress', 412, 775);
    } else {
      let potmImg: HTMLImageElement | null = null;
      if (potmCandidate?.photo_url && allowRemote) {
        potmImg = await loadImage(potmCandidate.photo_url);
      }

      if (potmImg) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(332, 615, 160, 155);
        ctx.clip();
        ctx.drawImage(potmImg, 332, 615, 160, 155);
        ctx.restore();
      } else {
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(332, 615, 160, 155);
        ctx.fillStyle = '#F59E0B';
        ctx.font = '900 44px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⭐', 412, 695);
      }

      // Player Name Bar (White)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(potmBoxX, 775, potmBoxW, 36);
      ctx.fillStyle = '#0F172A';
      ctx.font = '900 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`🏆 ${potmCandidate?.name?.toUpperCase() || 'PLAYER OF THE MATCH'}`, 412, 799);

      // Player Team Bar (Dark)
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(potmBoxX, 811, potmBoxW, 34);
      ctx.fillStyle = '#F59E0B';
      ctx.font = '800 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${potmCandidate?.team?.toUpperCase() || match.home_team.name.toUpperCase()} • MAN OF THE MATCH`,
        412,
        832
      );
    }
    ctx.restore();

    // 8. TOURNAMENT SLOGAN
    ctx.save();
    ctx.fillStyle = '#0D1523';
    ctx.fillRect(45, 898, 735, 52);
    ctx.strokeStyle = '#2A364F';
    ctx.lineWidth = 1;
    ctx.strokeRect(45, 898, 735, 52);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AASTU FOCUS FELLOWSHIP • CHRIST ABOVE ALL', 412, 930);
    ctx.restore();

    // 9. FOOTER (Clean dark bar - NO Premier League branding!)
    ctx.save();
    ctx.fillStyle = '#0A101C';
    ctx.fillRect(0, 955, 825, 69);

    ctx.font = '700 11px sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.textAlign = 'left';
    ctx.fillText('@AASTU_FocusCup', 55, 990);

    ctx.font = '600 11px sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.textAlign = 'center';
    ctx.fillText('Focus Fellowship Football Tournament 2026', 412, 990);

    ctx.font = '700 11px sans-serif';
    ctx.fillStyle = '#F59E0B';
    ctx.textAlign = 'right';
    ctx.fillText('Playing for His Glory!', 770, 990);
    ctx.restore();

    return canvas;
  };

  /**
   * Helper to encode canvas to Blob safely
   */
  const getGraphicBlob = async (): Promise<{ blob: Blob; canvas: HTMLCanvasElement }> => {
    try {
      const canvas = await renderCanvasGraphic(true);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png', 0.98)
      );
      if (blob) return { blob, canvas };
      throw new Error('Canvas encoding failed');
    } catch (err) {
      console.warn('Remote asset error, falling back to clean vector composite:', err);
      const fallbackCanvas = await renderCanvasGraphic(false);
      const blob = await new Promise<Blob | null>((resolve) =>
        fallbackCanvas.toBlob(resolve, 'image/png', 0.98)
      );
      if (!blob) throw new Error('Failed to encode graphic.');
      return { blob, canvas: fallbackCanvas };
    }
  };

  /**
   * One-click Download PNG
   */
  const handleDownload = async () => {
    setIsExporting(true);
    setFeedbackMsg(null);
    try {
      const { blob } = await getGraphicBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `FocusCup_Broadcast_${match.home_team.name.replace(/\s+/g, '_')}_vs_${match.away_team.name.replace(/\s+/g, '_')}_${operationalMode}.png`;
      link.download = filename;
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setFeedbackMsg({
        text: `✓ ${operationalMode === 'FINAL' ? 'Full Time' : 'Live Snapshot'} graphic downloaded!`,
        type: 'success',
      });
    } catch (err: any) {
      console.error(err);
      setFeedbackMsg({ text: 'Download failed: ' + err.message, type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Publish directly to public homepage carousel via Cloudinary upload
   */
  const handlePublishAnnouncement = async () => {
    setIsPublishing(true);
    setFeedbackMsg(null);
    try {
      const { blob } = await getGraphicBlob();
      const uploadRes = await uploadToCloudinary(blob, 'focus_fellowship/broadcasts');
      const imageUrl = uploadRes.secure_url;

      const title =
        operationalMode === 'FINAL'
          ? `🏆 FULL TIME RESULT: ${match.home_team.name} ${homeScoreState} - ${awayScoreState} ${match.away_team.name}`
          : `🔴 LIVE MATCH UPDATE (${liveMinute}'): ${match.home_team.name} ${homeScoreState} - ${awayScoreState} ${match.away_team.name}`;

      const potmText =
        operationalMode === 'FINAL' && potmCandidate
          ? ` Congratulations to Player of the Match: ${potmCandidate.name} (${potmCandidate.team})!`
          : '';

      const announcementPayload = {
        title,
        category: 'MATCH_DAY',
        priority: operationalMode === 'FINAL' ? 'URGENT' : 'IMPORTANT',
        content: `Official broadcast update from AASTU Focus Football Cup Round ${
          match.round_number || 1
        }! Current score: ${match.home_team.name} ${homeScoreState} - ${awayScoreState} ${
          match.away_team.name
        }.${potmText} Playing for His Glory!`,
        image_url: imageUrl,
        is_pinned: true,
      };

      const created = await api.community.createAnnouncement(announcementPayload);

      // Save permanently to the Manager Match Graphics Archive for historical records
      try {
        await api.matches.createGraphic({
          match_id: match.id,
          graphic_type: operationalMode === 'FINAL' ? 'BROADCAST_FINAL' : 'BROADCAST_LIVE',
          team_id: match.home_team.id,
          opponent_team_id: match.away_team.id,
          round_number: match.round_number || 1,
          title: `${match.home_team.name} ${homeScoreState} - ${awayScoreState} ${match.away_team.name} (${
            operationalMode === 'FINAL' ? 'Full Time' : 'Live Match'
          })`,
          image_url: imageUrl,
          data_snapshot: {
            mode: operationalMode,
            home_score: homeScoreState,
            away_score: awayScoreState,
            home_goals: computedGoalScorers.home,
            away_goals: computedGoalScorers.away,
            potm: potmCandidate,
            match_status: match.status,
          },
        });
      } catch (archiveErr) {
        console.warn('Could not save broadcast graphic to archive:', archiveErr);
      }

      setFeedbackMsg({
        text: '✓ Broadcast Graphic published to homepage carousel and saved to Graphics Archive!',
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

  const handleHeroImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCustomPotmPhoto(event.target.result as string);
        setFeedbackMsg({ text: '✓ Custom player photo loaded for POTM card!', type: 'success' });
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-3xl bg-[#0B132B] border border-emerald-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Studio Top Header */}
        <div className="px-6 py-4 bg-[#161D36] border-b border-[#2C3960] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                Premier Broadcast Graphic Studio
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  DYNAMIC
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Transforms live match events &amp; final results into official broadcast matchday graphics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Body */}
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          {/* Controls Column (Left, 5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Operational Mode Toggle */}
            <div className="p-4 rounded-2xl bg-[#161D36] border border-[#2C3960] space-y-2">
              <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                Operational Broadcast Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOperationalMode('LIVE')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    operationalMode === 'LIVE'
                      ? 'bg-rose-600/30 border-rose-500 text-rose-300 shadow-md'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>1. Live Update Mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOperationalMode('FINAL')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    operationalMode === 'FINAL'
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-md'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>2. Final Publication</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 italic">
                {operationalMode === 'LIVE'
                  ? 'Mid-game snapshot with active score and chronologically appended scorers. POTM remains subdued.'
                  : 'Final whistle graphic with confirmed score, complete goal scorers, and designated Player of the Match locked in.'}
              </p>
            </div>

            {/* Live Score & Minute Adjusters */}
            <div className="p-4 rounded-2xl bg-[#161D36] border border-[#2C3960] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                  Scoreboard Controls
                </label>
                {operationalMode === 'LIVE' && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-400 font-bold">
                    <span>Minute:</span>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={liveMinute}
                      onChange={(e) => setLiveMinute(Number(e.target.value))}
                      className="w-14 px-2 py-0.5 rounded bg-[#0B132B] border border-[#2C3960] text-white text-center text-xs"
                    />
                    <span>&apos;</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 rounded-xl bg-[#0B132B] border border-[#2C3960]">
                  <p className="text-[11px] font-bold text-indigo-300 truncate mb-1">
                    {match.home_team.name}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setHomeScoreState((s) => Math.max(0, s - 1))}
                      className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold text-xs hover:bg-slate-700"
                    >
                      -
                    </button>
                    <span className="text-2xl font-black text-white">{homeScoreState}</span>
                    <button
                      type="button"
                      onClick={() => setHomeScoreState((s) => s + 1)}
                      className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold text-xs hover:bg-slate-700"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#0B132B] border border-[#2C3960]">
                  <p className="text-[11px] font-bold text-purple-300 truncate mb-1">
                    {match.away_team.name}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAwayScoreState((s) => Math.max(0, s - 1))}
                      className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold text-xs hover:bg-slate-700"
                    >
                      -
                    </button>
                    <span className="text-2xl font-black text-white">{awayScoreState}</span>
                    <button
                      type="button"
                      onClick={() => setAwayScoreState((s) => s + 1)}
                      className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold text-xs hover:bg-slate-700"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Player of the Match Designation */}
            <div className="p-4 rounded-2xl bg-[#161D36] border border-[#2C3960] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Player of the Match (POTM)
                </label>
                <span className="text-[10px] text-slate-400">
                  {operationalMode === 'LIVE' ? 'Subdued in Live Mode' : 'Featured in Final'}
                </span>
              </div>

              <select
                value={selectedPotmId}
                onChange={(e) => {
                  setSelectedPotmId(e.target.value);
                  setCustomPotmPhoto(null);
                }}
                disabled={operationalMode === 'LIVE'}
                className="w-full px-3 py-2 rounded-xl bg-[#0B132B] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-emerald-400 disabled:opacity-40"
              >
                <option value="">Select official Player of the Match...</option>
                {eligiblePlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.competing_batch || 'Member'})
                  </option>
                ))}
              </select>

              {operationalMode === 'FINAL' && (
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
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer border border-[#2C3960]"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Upload Custom POTM Photo</span>
                  </button>
                  {customPotmPhoto && (
                    <button
                      type="button"
                      onClick={() => setCustomPotmPhoto(null)}
                      className="text-[11px] font-semibold text-rose-400 hover:underline cursor-pointer"
                    >
                      Reset Photo
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Prompt Generation Drawer Toggle */}
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/25">
              <button
                type="button"
                onClick={() => setShowPromptDrawer((prev) => !prev)}
                className="w-full flex items-center justify-between text-xs font-bold text-purple-300 hover:text-purple-200 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Dynamic AI Prompt Instruction
                </span>
                <span>{showPromptDrawer ? '▲ Hide' : '▼ View Prompt'}</span>
              </button>

              {showPromptDrawer && (
                <div className="mt-3 space-y-2">
                  <pre className="p-3 rounded-lg bg-black/60 text-[10px] text-slate-300 font-mono whitespace-pre-wrap leading-relaxed border border-purple-500/20 max-h-40 overflow-y-auto">
                    {generatedPromptInstruction}
                  </pre>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {promptCopied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                    <span>{promptCopied ? 'Copied to Clipboard!' : 'Copy Prompt'}</span>
                  </button>
                </div>
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
                    <RefreshCw className="w-4 h-4 animate-spin" /> Rendering High-Res Broadcast PNG...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Download Broadcast Graphic (PNG)
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
              <Eye className="w-3 h-3" /> Live Premier League Graphic Preview
            </span>

            {/* DOM Graphic Mockup matching Base Template Layout */}
            <div className="relative w-full max-w-[390px] aspect-[825/1024] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 select-none flex flex-col justify-between p-3.5 bg-gradient-to-b from-[#060B19] via-[#0B132B] to-[#020617] text-white">
              {/* Stadium Floodlights Background Accent */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />

              {/* 1. Header Bar */}
              <div className="relative z-10 flex items-center justify-between border-b border-white/20 pb-2">
                <span className="text-[10px] font-black tracking-wider text-white">
                  FOCUS CUP 2026
                </span>
                <span className="text-[9px] font-bold text-slate-300 tracking-wider">
                  {match.match_date || 'MATCHDAY'} | RD {match.round_number || 1}
                </span>
              </div>

              {/* 2. Scoreboard Box */}
              <div className="relative z-10 my-1">
                {/* Status banner */}
                <div
                  className={`py-1 text-center font-black text-[11px] tracking-wider rounded-t-lg ${
                    operationalMode === 'FINAL'
                      ? 'bg-white text-slate-950'
                      : 'bg-rose-600 text-white animate-pulse'
                  }`}
                >
                  {operationalMode === 'FINAL' ? 'FULL TIME' : `🔴 LIVE • ${liveMinute}'`}
                </div>

                {/* Score & Crests Box */}
                <div className="bg-slate-950/80 border border-white/20 rounded-b-lg p-2.5 flex items-center justify-between">
                  {/* Home */}
                  <div className="flex flex-col items-center w-28 text-center">
                    <TeamCrest team={match.home_team} size="md" />
                    <span className="text-[10px] font-black text-white mt-1 truncate max-w-full">
                      {match.home_team.name}
                    </span>
                  </div>

                  {/* Central Score */}
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black text-white">{homeScoreState}</span>
                    <span className="text-xl font-bold text-slate-400">-</span>
                    <span className="text-3xl font-black text-white">{awayScoreState}</span>
                  </div>

                  {/* Away */}
                  <div className="flex flex-col items-center w-28 text-center">
                    <TeamCrest team={match.away_team} size="md" />
                    <span className="text-[10px] font-black text-white mt-1 truncate max-w-full">
                      {match.away_team.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Goal Scorers Section */}
              <div className="relative z-10 rounded-xl overflow-hidden border border-white/20 bg-slate-950/70">
                <div className="bg-[#161D36] py-1 text-center font-bold text-[9px] text-slate-300 uppercase tracking-widest border-b border-white/10">
                  Goal Scorers Section
                </div>
                <div className="p-2 space-y-1 text-[10px]">
                  {homeScorersList.length === 0 && awayScorersList.length === 0 ? (
                    <p className="text-center text-[9px] text-slate-400 py-1">No goals recorded yet</p>
                  ) : (
                    Array.from({
                      length: Math.max(homeScorersList.length, awayScorersList.length),
                    }).map((_, idx) => (
                      <div key={idx} className="grid grid-cols-2 gap-2">
                        <span className="text-right text-indigo-300 font-bold truncate">
                          {homeScorersList[idx] ? `${homeScorersList[idx]} ⚽` : ''}
                        </span>
                        <span className="text-left text-purple-300 font-bold truncate">
                          {awayScorersList[idx] ? `⚽ ${awayScorersList[idx]}` : ''}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 4. Player of the Match Card */}
              <div className="relative z-10 rounded-xl overflow-hidden border border-white/20 bg-slate-950/80 my-1">
                <div className="bg-[#161D36] py-1 text-center font-bold text-[9px] text-slate-300 uppercase tracking-widest border-b border-white/10">
                  Player of the Match Section
                </div>
                {operationalMode === 'LIVE' ? (
                  <div className="p-4 text-center space-y-1">
                    <div className="text-xl">🏆</div>
                    <p className="text-[10px] font-black text-slate-300">
                      DECIDED AT FULL TIME
                    </p>
                    <p className="text-[8px] text-slate-500">Live match in progress</p>
                  </div>
                ) : (
                  <div className="p-2.5 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-amber-400 shrink-0 bg-slate-800 flex items-center justify-center">
                      {potmCandidate?.photo_url ? (
                        <img
                          src={potmCandidate.photo_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">⭐</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[8px] font-bold text-amber-400 uppercase tracking-widest block">
                        Official MOTM Award
                      </span>
                      <h4 className="text-xs font-black text-white truncate">
                        {potmCandidate?.name || 'Tournament Star'}
                      </h4>
                      <p className="text-[9px] text-slate-300 truncate">
                        {potmCandidate?.team || match.home_team.name}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Tournament Slogan & Footer */}
              <div className="relative z-10 text-center pt-1 border-t border-white/10">
                <p className="text-[9px] font-black tracking-wider text-amber-300">
                  AASTU FOCUS FELLOWSHIP • CHRIST ABOVE ALL
                </p>
                <div className="flex items-center justify-between text-[8px] text-slate-400 mt-0.5">
                  <span>@AASTU_FocusCup</span>
                  <span>@FocusFellowship</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

