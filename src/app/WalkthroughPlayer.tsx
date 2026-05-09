"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Modal, Progress } from 'antd';
import {
  LoadingOutlined,
  PlayCircleFilled,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { HText, PText } from '@/components/MyText';
import { colorConfig } from '@/config/colors';
import { useMessage } from '@/utils/common';
import { STYLE_LABELS, type StyleKey } from '@/lib/styles';

type Phase = 'idle' | 'starting' | 'polling' | 'ready' | 'error';

interface WalkthroughPlayerProps {
  style: StyleKey;
  imageDataUrl: string;
  cachedVideoUrl?: string;
  onCached: (style: StyleKey, videoUrl: string) => void;
}

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 36; // 36 × 5s = 3 minutes

export default function WalkthroughPlayer({
  style,
  imageDataUrl,
  cachedVideoUrl,
  onCached,
}: WalkthroughPlayerProps) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>(cachedVideoUrl ? 'ready' : 'idle');
  const [videoUrl, setVideoUrl] = useState<string | null>(cachedVideoUrl ?? null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pollAttempts, setPollAttempts] = useState(0);
  const cancelRef = useRef(false);
  const { displayErrorMessage } = useMessage();

  // Reset internal state if the cached URL prop changes (e.g. parent updated cache).
  useEffect(() => {
    if (cachedVideoUrl && cachedVideoUrl !== videoUrl) {
      setVideoUrl(cachedVideoUrl);
      setPhase('ready');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cachedVideoUrl]);

  const reset = () => {
    cancelRef.current = true;
    setPollAttempts(0);
    setErrorMsg(null);
  };

  const fail = (message: string) => {
    setErrorMsg(message);
    setPhase('error');
  };

  const pollUntilDone = async (operationName: string) => {
    cancelRef.current = false;
    let attempts = 0;
    while (!cancelRef.current && attempts < MAX_POLL_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      if (cancelRef.current) return;
      attempts += 1;
      setPollAttempts(attempts);
      try {
        const res = await fetch(
          `/api/walkthrough/status?op=${encodeURIComponent(operationName)}`,
        );
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          fail(data.error ?? 'Status check failed');
          return;
        }
        const data = (await res.json()) as {
          done: boolean;
          videoUrl?: string;
          error?: string;
        };
        if (data.error) {
          fail(data.error);
          return;
        }
        if (data.done && data.videoUrl) {
          setVideoUrl(data.videoUrl);
          setPhase('ready');
          onCached(style, data.videoUrl);
          return;
        }
      } catch (err) {
        fail(err instanceof Error ? err.message : 'Status check failed');
        return;
      }
    }
    if (!cancelRef.current) {
      fail('Generation took too long. Try again later.');
    }
  };

  const startGeneration = async () => {
    reset();
    setPhase('starting');
    try {
      const res = await fetch('/api/walkthrough', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style, imageDataUrl }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Walkthrough request failed');
      }
      const data = (await res.json()) as {
        done: boolean;
        videoUrl?: string;
        operationName?: string;
        error?: string;
      };
      if (data.error) {
        fail(data.error);
        return;
      }
      if (data.done && data.videoUrl) {
        // Pre-rendered hit
        setVideoUrl(data.videoUrl);
        setPhase('ready');
        onCached(style, data.videoUrl);
        return;
      }
      if (!data.operationName) {
        fail('No operation name returned');
        return;
      }
      setPhase('polling');
      void pollUntilDone(data.operationName);
    } catch (err) {
      fail(err instanceof Error ? err.message : 'Walkthrough failed');
      displayErrorMessage(err, 'Could not start walkthrough');
    }
  };

  const handleOpen = () => {
    setOpen(true);
    if (phase === 'idle') void startGeneration();
  };

  const handleClose = () => {
    cancelRef.current = true;
    setOpen(false);
  };

  const handleRetry = () => {
    setPhase('idle');
    setErrorMsg(null);
    setVideoUrl(null);
    void startGeneration();
  };

  // Soft progress estimation while polling — Veo 3 typically finishes in 30–90s.
  const progressPercent =
    phase === 'starting'
      ? 5
      : phase === 'polling'
        ? Math.min(95, 10 + (pollAttempts / MAX_POLL_ATTEMPTS) * 90)
        : phase === 'ready'
          ? 100
          : 0;

  return (
    <>
      <Button
        type={videoUrl ? 'default' : 'primary'}
        icon={videoUrl ? <PlayCircleFilled /> : <VideoCameraOutlined />}
        onClick={handleOpen}
        size="middle"
      >
        {videoUrl ? 'Replay walkthrough' : 'Watch cinematic walkthrough'}
      </Button>

      <Modal
        title={
          <HText variant="h5" style={{ margin: 0 }}>
            {STYLE_LABELS[style]} walkthrough
          </HText>
        }
        open={open}
        onCancel={handleClose}
        footer={null}
        width={720}
        centered
        styles={{ body: { padding: '8px 0' } }}
      >
        {(phase === 'starting' || phase === 'polling') && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              padding: '32px 8px',
            }}
          >
            <LoadingOutlined
              style={{ fontSize: 40, color: colorConfig.brandAccent }}
            />
            <HText variant="h5" style={{ margin: 0 }}>
              Generating cinematic walkthrough…
            </HText>
            <PText
              variant="small"
              style={{ color: colorConfig.textSecondary, margin: 0, textAlign: 'center', maxWidth: 460 }}
            >
              Veo 3 is rendering an 8-second tour of your{' '}
              {STYLE_LABELS[style].toLowerCase()} space. This usually takes
              30–90 seconds.
            </PText>
            <Progress
              percent={Math.round(progressPercent)}
              showInfo={false}
              strokeColor={colorConfig.brandAccent}
              style={{ width: '100%', maxWidth: 480 }}
            />
          </div>
        )}

        {phase === 'ready' && videoUrl && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'black',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <video
              src={videoUrl}
              controls
              autoPlay
              playsInline
              style={{ width: '100%', display: 'block', maxHeight: '70vh' }}
            />
          </div>
        )}

        {phase === 'error' && (
          <div style={{ padding: '8px 0' }}>
            <Alert
              type="error"
              message="Couldn't generate the walkthrough"
              description={errorMsg}
              showIcon
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <Button onClick={handleRetry}>Try again</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
