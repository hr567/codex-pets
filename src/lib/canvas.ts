import { FRAME_HEIGHT, FRAME_WIDTH } from './sprite';
import type { FrameSource } from './sprite';

export interface SpriteFrameRenderingOptions {
  readonly imageSmoothingEnabled?: boolean;
}

export function drawSpriteFrame(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement | null,
  source: FrameSource = { column: 0, row: 0 },
  options: SpriteFrameRenderingOptions = {},
): void {
  const context = canvas.getContext('2d');
  if (!context) return;

  context.clearRect(0, 0, canvas.width, canvas.height);
  if (!image) return;

  context.imageSmoothingEnabled = options.imageSmoothingEnabled ?? false;
  context.drawImage(
    image,
    source.column * FRAME_WIDTH,
    source.row * FRAME_HEIGHT,
    FRAME_WIDTH,
    FRAME_HEIGHT,
    0,
    0,
    canvas.width,
    canvas.height,
  );
}
