// MPEG-1 Layer III, 128 kbps, 44.1 kHz stereo silence. Zero side information
// encodes zero spectral coefficients; no copyrighted recording or binary fixture.
export function silentMp3(frames = 40) {
  const frame = Buffer.alloc(417);
  frame.set([0xff, 0xfb, 0x90, 0x00]);
  return Buffer.concat(Array.from({ length: frames }, () => frame));
}
