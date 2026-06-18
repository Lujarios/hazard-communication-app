import { FeedbackScorecard } from "~/components/demo/FeedbackScorecard";
import type { SafetyTalkFeedback } from "~/types/feedback";

type FeedbackPreviewProps = {
  feedback: SafetyTalkFeedback | null;
  isLoading?: boolean;
  error?: string | null;
};

export function FeedbackPreview({
  feedback,
  isLoading = false,
  error = null,
}: FeedbackPreviewProps) {
  return (
    <FeedbackScorecard
      feedback={feedback}
      isLoading={isLoading}
      error={error}
    />
  );
}
