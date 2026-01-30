'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { EditableWorkoutCard } from './editable-workout-card';
import { fetchMoreSessionHistory, type SessionHistoryItem } from '@/app/history/actions';
import { Loader2 } from 'lucide-react';

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return 'just now';
}

function formatDuration(minutes: number | null) {
  if (minutes === null) return null;
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

interface SessionHistoryListProps {
  workoutId: number;
  initialSessions: SessionHistoryItem[];
  initialHasMore: boolean;
}

export function SessionHistoryList({
  workoutId,
  initialSessions,
  initialHasMore,
}: SessionHistoryListProps) {
  const [sessions, setSessions] = useState(initialSessions);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const result = await fetchMoreSessionHistory(workoutId, sessions.length);
      setSessions((prev) => [...prev, ...result.sessions]);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error loading more sessions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [workoutId, sessions.length, isLoading, hasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, isLoading, loadMore]);

  useEffect(() => {
    setSessions(initialSessions);
    setHasMore(initialHasMore);
  }, [initialSessions, initialHasMore]);

  return (
    <div className="space-y-4">
      {sessions.map((session) => {
        const [year, month, day] = session.date.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const dateStr = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        const timeForRelative = session.firstLoggedAt
          ? new Date(session.firstLoggedAt)
          : date;
        const relativeTime = formatTimeAgo(timeForRelative);
        const durationStr = formatDuration(session.durationMinutes);

        return (
          <EditableWorkoutCard
            key={session.date}
            exercises={session.exercises}
            dateStr={dateStr}
            relativeTime={relativeTime}
            durationStr={durationStr}
          />
        );
      })}

      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {isLoading && <Loader2 className="size-6 animate-spin text-muted-foreground" />}
        </div>
      )}
    </div>
  );
}
