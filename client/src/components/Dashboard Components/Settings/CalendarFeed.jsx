import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  generateCalendarFeedToken,
  revokeFeedToken,
  getTokenStatus,
  getCalendarFeedUrl,
} from '../../../api/calendar.api';
import { copyCalendarFeedUrl } from '../../../utils/calendar.utils';
import Button from '../ui/Button';

function InlineNotice({ kind = 'neutral', children }) {
  const styles = {
    success: 'border-[#d3f2e3] bg-[#f4fff8] text-[#137a45]',
    error: 'border-[#f1c8d0] bg-[#fff6f8] text-[#b5374b]',
    info: 'border-[#d6e8f7] bg-[#f0f7ff] text-[#0063b1]',
    neutral: 'border-[#e2e8f5] bg-[#f8faff] text-[#5b6885]',
  };

  return (
    <div className={`rounded-[12px] border px-3 py-2 text-xs sm:text-[13px] ${styles[kind]}`}>
      {children}
    </div>
  );
}

function CalendarHelp({ platform, onClose }) {
  const guides = {
    google: {
      title: 'Subscribe in Google Calendar',
      steps: [
        'Open Google Calendar',
        'On the left, find "Other calendars"',
        'Click the plus icon (+)',
        'Select "Subscribe to calendar"',
        'Paste the feed URL',
        'Click "Subscribe"',
      ],
    },
    apple: {
      title: 'Subscribe in Apple Calendar',
      steps: [
        'Open Apple Calendar',
        'Go to File → New Calendar Subscription',
        'Paste the feed URL',
        'Click "Subscribe"',
        'Choose which calendar to save it to',
        'Your tasks will sync automatically',
      ],
    },
    outlook: {
      title: 'Subscribe in Outlook',
      steps: [
        'Open Outlook Calendar',
        'Go to Add calendar → Subscribe from web',
        'Paste the feed URL',
        'Click "Import"',
        'Your tasks will appear in a new calendar',
      ],
    },
  };

  const guide = guides[platform];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-[20px] bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#1f2a44]">{guide.title}</h3>
          <button
            onClick={onClose}
            className="text-[#9ca3af] hover:text-[#1f2a44]"
          >
            ✕
          </button>
        </div>

        <ol className="space-y-3">
          {guide.steps.map((step, idx) => (
            <li key={idx} className="flex gap-3">
              <span className="flex-shrink-0 rounded-full bg-[#0063b1] w-6 h-6 flex items-center justify-center text-white text-xs font-semibold">
                {idx + 1}
              </span>
              <span className="pt-0.5 text-[13px] text-[#4e5b79]">{step}</span>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} className="w-auto px-5">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CalendarFeed() {
  const [feedUrl, setFeedUrl] = useState('');
  const [message, setMessage] = useState(null);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [helpPlatform, setHelpPlatform] = useState(null);

  // Fetch token status on mount
  const tokenQuery = useQuery({
    queryKey: ['calendar-token-status'],
    queryFn: () => getTokenStatus().then((res) => res.data.data),
  });

  useEffect(() => {
    if (tokenQuery.data?.token) {
      setFeedUrl(getCalendarFeedUrl(tokenQuery.data.token));
    }
  }, [tokenQuery.data]);

  const generateMutation = useMutation({
    mutationFn: generateCalendarFeedToken,
    onSuccess: (res) => {
      const token = res.data.data.token;
      const url = getCalendarFeedUrl(token);
      setFeedUrl(url);
      setMessage({ kind: 'success', text: 'Feed URL generated!' });
      tokenQuery.refetch();
    },
    onError: (err) => {
      setMessage({
        kind: 'error',
        text: err.response?.data?.message || 'Failed to generate token',
      });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: revokeFeedToken,
    onSuccess: () => {
      setFeedUrl('');
      setMessage({ kind: 'success', text: 'Calendar feed revoked.' });
      tokenQuery.refetch();
    },
    onError: (err) => {
      setMessage({
        kind: 'error',
        text: err.response?.data?.message || 'Failed to revoke token',
      });
    },
  });

  const handleCopyUrl = async () => {
    const copied = await copyCalendarFeedUrl(feedUrl);
    if (copied) {
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    }
  };

  const handleRevoke = () => {
    if (window.confirm('Are you sure? This will stop your calendar sync.')) {
      revokeMutation.mutate();
    }
  };

  return (
    <div className="space-y-5">
      {/* Explanation card */}
      <div className="rounded-[16px] border border-[#d9e1f4] bg-white p-5">
        <h3 className="text-[16px] font-semibold text-[#1f2a44]">
          📅 Auto-updating Calendar Feed
        </h3>
        <p className="mt-2 text-[13px] text-[#6c7898]">
          Subscribe to your personal task calendar in Google Calendar, Apple Calendar, or Outlook.
          Your feed updates automatically as tasks are assigned and due dates change.
        </p>
      </div>

      {feedUrl ? (
        <div className="space-y-4 rounded-[16px] border border-[#d9e1f4] bg-white p-5">
          <div>
            <label className="text-[12px] font-semibold uppercase text-[#7a84a4]">
              Your Calendar Feed URL
            </label>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={feedUrl}
                disabled
                className="flex-1 rounded-[10px] border border-[#d9e1f4] bg-[#f8faff] px-3 py-2 text-[12px] text-[#6c7898] font-mono break-all"
              />
              <Button onClick={handleCopyUrl} className="w-auto px-4 whitespace-nowrap">
                {copiedMessage ? '✓ Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          <InlineNotice kind="info">
            Keep this URL secret — it's like a password for your calendar access.
            Never share it publicly.
          </InlineNotice>

          {/* Platform links */}
          <div>
            <p className="mb-3 text-[12px] font-semibold text-[#1f2a44]">
              Subscribe in your calendar app:
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setHelpPlatform('google')}
                className="w-auto px-4 text-sm"
                variant="outline"
              >
                Google Calendar
              </Button>
              <Button
                onClick={() => setHelpPlatform('apple')}
                className="w-auto px-4 text-sm"
                variant="outline"
              >
                Apple Calendar
              </Button>
              <Button
                onClick={() => setHelpPlatform('outlook')}
                className="w-auto px-4 text-sm"
                variant="outline"
              >
                Outlook
              </Button>
            </div>
          </div>

          {/* Revoke button */}
          <div className="pt-2 border-t border-[#d9e1f4]">
            <Button
              onClick={handleRevoke}
              loading={revokeMutation.isPending}
              className="w-auto px-5"
              variant="outline"
            >
              Revoke Feed
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-[16px] border border-[#d9e1f4] bg-white p-5">
          <InlineNotice>
            No feed URL yet. Generate one to get started.
          </InlineNotice>
          <div className="mt-4">
            <Button
              onClick={() => generateMutation.mutate()}
              loading={generateMutation.isPending}
              className="w-auto px-5"
            >
              Generate Feed URL
            </Button>
          </div>
        </div>
      )}

      {message && (
        <InlineNotice kind={message.kind}>{message.text}</InlineNotice>
      )}

      {helpPlatform && (
        <CalendarHelp
          platform={helpPlatform}
          onClose={() => setHelpPlatform(null)}
        />
      )}
    </div>
  );
}
