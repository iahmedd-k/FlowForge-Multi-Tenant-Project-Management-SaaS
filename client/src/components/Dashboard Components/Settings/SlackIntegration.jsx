import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  saveSlackWebhook,
  removeSlackWebhook,
  testSlackWebhook,
  getSlackStatus,
} from '../../../api/slack.api';
import Button from '../ui/Button';
import Input from '../ui/Input';

function InlineNotice({ kind = 'neutral', children }) {
  const styles = {
    success: 'border-[#d3f2e3] bg-[#f4fff8] text-[#137a45]',
    error: 'border-[#f1c8d0] bg-[#fff6f8] text-[#b5374b]',
    neutral: 'border-[#e2e8f5] bg-[#f8faff] text-[#5b6885]',
  };

  return (
    <div className={`rounded-[12px] border px-2 sm:px-3 py-2 text-xs sm:text-[13px] ${styles[kind]}`}>
      {children}
    </div>
  );
}

function SettingsCard({ title, description, children, tone = 'default' }) {
  const toneClass = tone === 'soft' ? 'bg-[#fbfcff]' : 'bg-white';

  return (
    <section className={`rounded-[18px] border border-[#d9e1f4] ${toneClass} p-3 sm:p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]`}>
      <div className="mb-4">
        <h2 className="text-base sm:text-[18px] font-semibold text-[#1f2a44]">{title}</h2>
        {description ? <p className="mt-1 text-xs sm:text-[13px] text-[#6c7898]">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default function SlackIntegration() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [message, setMessage] = useState(null);
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Fetch current Slack status
  const statusQuery = useQuery({
    queryKey: ['slack-status'],
    queryFn: () => getSlackStatus().then((res) => res.data.data),
  });

  const isConnected = statusQuery.data?.isConnected;
  const maskedUrl = statusQuery.data?.maskedUrl;

  useEffect(() => {
    if (statusQuery.data && statusQuery.data.maskedUrl) {
      setShowUrlInput(false);
    }
  }, [statusQuery.data]);

  const saveMutation = useMutation({
    mutationFn: saveSlackWebhook,
    onSuccess: () => {
      setMessage({ kind: 'success', text: 'Slack webhook saved successfully!' });
      setWebhookUrl('');
      setShowUrlInput(false);
      statusQuery.refetch();
    },
    onError: (err) => {
      setMessage({
        kind: 'error',
        text: err.response?.data?.message || 'Failed to save webhook URL',
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeSlackWebhook,
    onSuccess: () => {
      setMessage({ kind: 'success', text: 'Slack webhook removed.' });
      setWebhookUrl('');
      statusQuery.refetch();
    },
    onError: (err) => {
      setMessage({
        kind: 'error',
        text: err.response?.data?.message || 'Failed to remove webhook',
      });
    },
  });

  const testMutation = useMutation({
    mutationFn: testSlackWebhook,
    onSuccess: () => {
      setMessage({
        kind: 'success',
        text: 'Test notification sent! Check your Slack channel.',
      });
    },
    onError: (err) => {
      setMessage({
        kind: 'error',
        text: err.response?.data?.message || 'Failed to send test notification',
      });
    },
  });

  const handleSave = () => {
    if (!webhookUrl.trim()) {
      setMessage({ kind: 'error', text: 'Please enter a webhook URL' });
      return;
    }
    setMessage(null);
    saveMutation.mutate(webhookUrl);
  };

  const handleRemove = () => {
    if (window.confirm('Are you sure you want to remove this Slack integration?')) {
      setMessage(null);
      removeMutation.mutate();
    }
  };

  const handleTest = () => {
    setMessage(null);
    testMutation.mutate();
  };

  return (
    <SettingsCard
      title="Slack Integration"
      description="Send automatic notifications to your Slack channel when tasks are created, assigned, or status changes."
    >
      {isConnected ? (
        <div className="space-y-4">
          {/* Connected badge */}
          <div className="flex items-center gap-2 rounded-[12px] border border-[#d3f2e3] bg-[#f4fff8] px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-[#137a45]"></div>
            <span className="text-[13px] font-semibold text-[#137a45]">Connected</span>
          </div>

          {/* Masked URL display */}
          <div>
            <label className="text-[12px] font-semibold uppercase text-[#7a84a4]">
              Webhook URL
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="text"
                value={maskedUrl}
                disabled
                className="flex-1 rounded-[10px] border border-[#d9e1f4] bg-[#f8faff] px-3 py-2 text-[13px] text-[#6c7898]"
              />
              <Button
                onClick={() => setShowUrlInput(true)}
                className="whitespace-nowrap"
                variant="outline"
              >
                Change
              </Button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleTest}
              loading={testMutation.isPending}
              className="w-auto px-5"
            >
              Test Notification
            </Button>
            <Button
              onClick={handleRemove}
              loading={removeMutation.isPending}
              className="w-auto px-5"
              variant="outline"
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {!showUrlInput ? (
            <div>
              <InlineNotice>
                Not connected. Add your Slack webhook URL to enable notifications.
              </InlineNotice>
              <div className="mt-4">
                <Button
                  onClick={() => setShowUrlInput(true)}
                  className="w-auto px-5"
                >
                  Add Webhook URL
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <Input
                  label="Slack Webhook URL"
                  placeholder="https://hooks.slack.com/services/..."
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  type="password"
                />
              </div>

              <InlineNotice>
                Find your webhook URL in your Slack workspace. Go to "Apps & integrations" → "Manage" → "Custom integrations" → "Incoming Webhooks".
              </InlineNotice>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleSave}
                  loading={saveMutation.isPending}
                  className="w-auto px-5"
                >
                  Save Webhook
                </Button>
                <Button
                  onClick={() => {
                    setShowUrlInput(false);
                    setWebhookUrl('');
                    setMessage(null);
                  }}
                  className="w-auto px-5"
                  variant="outline"
                  disabled={saveMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {message && (
        <div className="mt-4">
          <InlineNotice kind={message.kind}>{message.text}</InlineNotice>
        </div>
      )}
    </SettingsCard>
  );
}
