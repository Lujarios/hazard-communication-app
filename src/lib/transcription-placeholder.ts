/**
 * Production transcription pipeline (not implemented in demo):
 *
 * 1. Browser records audio (MediaRecorder) and sends blob to server
 * 2. Server uploads audio to S3
 * 3. Server starts Amazon Transcribe batch job
 * 4. Server polls until job completes
 * 5. Server returns transcript to client
 * 6. Transcript is sent to AI evaluator for persona feedback and scorecard
 */

export type TranscriptionJobStatus = "pending" | "processing" | "completed" | "failed";

export type TranscriptionJobResult = {
  status: TranscriptionJobStatus;
  transcript?: string;
  error?: string;
};

/**
 * Placeholder for AWS Transcribe integration.
 * Credentials and SDK calls must live server-side only.
 */
export async function transcribeAudioViaAws(
  _audioBlob: Blob,
): Promise<string> {
  void _audioBlob;
  throw new Error(
    "AWS Transcribe is not implemented yet. The demo uses browser speech recognition.",
  );
}

/**
 * Placeholder for polling a Transcribe batch job by ID.
 */
export async function pollTranscriptionJob(
  _jobId: string,
): Promise<TranscriptionJobResult> {
  void _jobId;
  throw new Error("AWS Transcribe polling is not implemented yet.");
}
