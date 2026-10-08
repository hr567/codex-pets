import { describe, expect, it, vi } from 'vitest';

import { drawSpriteFrame } from '../../src/lib/canvas';

function createCanvasHarness(scale = 1) {
  const context = {
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    imageSmoothingEnabled: true,
  };
  const canvas = {
    width: 192 * scale,
    height: 208 * scale,
    getContext: vi.fn(() => context),
  } as unknown as HTMLCanvasElement;

  return { canvas, context };
}

describe('drawSpriteFrame', () => {
  it('crops the selected atlas cell and draws it at the canvas scale', () => {
    const image = {} as HTMLImageElement;
    const { canvas, context } = createCanvasHarness(3);

    drawSpriteFrame(canvas, image, { column: 7, row: 10 });

    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 576, 624);
    expect(context.drawImage).toHaveBeenCalledWith(image, 1344, 2080, 192, 208, 0, 0, 576, 624);
  });

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
