import { describe, expect, it, vi } from 'vitest';

import { drawSpriteFrame } from '../../src/adapters/browser/canvasRenderer';

function createCanvasHarness() {
  const context = {
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    imageSmoothingEnabled: true,
  } as unknown as CanvasRenderingContext2D;
  const canvas = {
    getContext: vi.fn(() => context),
  } as unknown as HTMLCanvasElement;

  return { canvas, context };
}

describe('drawSpriteFrame', () => {
  it('defaults to crisp rendering and enables smoothing when requested', () => {
    const image = {} as HTMLImageElement;
    const crisp = createCanvasHarness();
    const smooth = createCanvasHarness();

    drawSpriteFrame(crisp.canvas, image);
    drawSpriteFrame(smooth.canvas, image, undefined, {
      imageSmoothingEnabled: true,
    });

    expect(crisp.context.imageSmoothingEnabled).toBe(false);
    expect(smooth.context.imageSmoothingEnabled).toBe(true);
  });
});
