/** WebRTC video session manager for collaboration panel tiles. */
export class VideoSessionManager {
  private localStream: MediaStream | null = null;
  private cameraEnabled = false;
  private micEnabled = false;

  get isCameraEnabled(): boolean {
    return this.cameraEnabled;
  }

  get isMicEnabled(): boolean {
    return this.micEnabled;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  async toggleCamera(): Promise<boolean> {
    if (this.cameraEnabled) {
      this.stopCamera();
      return false;
    }
    await this.startCamera();
    return this.cameraEnabled;
  }

  async toggleMic(): Promise<boolean> {
    this.micEnabled = !this.micEnabled;
    this.localStream?.getAudioTracks().forEach((track) => {
      track.enabled = this.micEnabled;
    });
    return this.micEnabled;
  }

  attachToVideo(video: HTMLVideoElement): void {
    if (!this.localStream) {
      video.srcObject = null;
      return;
    }
    video.srcObject = this.localStream;
    void video.play().catch(() => undefined);
  }

  disconnect(): void {
    this.stopCamera();
    this.micEnabled = false;
  }

  private async startCamera(): Promise<void> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      this.cameraEnabled = false;
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 },
        audio: true,
      });
      this.localStream = stream;
      this.cameraEnabled = true;
      this.micEnabled = stream.getAudioTracks()[0]?.enabled ?? false;
    } catch {
      this.cameraEnabled = false;
      this.localStream = null;
    }
  }

  private stopCamera(): void {
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.localStream = null;
    this.cameraEnabled = false;
  }
}
