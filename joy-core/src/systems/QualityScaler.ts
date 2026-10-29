import type { QualityTier } from '../core/types';

/**
 * Downgrades rendering quality when frame time stays high.
 * Designed to be renderer-agnostic for later React Native reuse.
 */
export class QualityScaler {
  private tier: QualityTier = 'high';
  private badFrames = 0;
  private goodFrames = 0;
  private readonly listeners = new Set<(tier: QualityTier) => void>();

  get current(): QualityTier {
    return this.tier;
  }

  onChange(listener: (tier: QualityTier) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  sample(frameMs: number): QualityTier {
    if (frameMs > 22) {
      this.badFrames += 1;
      this.goodFrames = 0;
    } else if (frameMs < 14) {
      this.goodFrames += 1;
      this.badFrames = 0;
    } else {
      this.badFrames = Math.max(0, this.badFrames - 1);
      this.goodFrames = Math.max(0, this.goodFrames - 1);
    }

    if (this.badFrames > 45) {
      this.setTier(this.tier === 'high' ? 'medium' : 'low');
      this.badFrames = 0;
    } else if (this.goodFrames > 180) {
      this.setTier(this.tier === 'low' ? 'medium' : 'high');
      this.goodFrames = 0;
    }

    return this.tier;
  }

  private setTier(next: QualityTier): void {
    if (next === this.tier) return;
    this.tier = next;
    for (const listener of this.listeners) listener(next);
  }
}
