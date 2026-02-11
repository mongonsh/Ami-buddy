export type SegmentResult = {
  segmentedUri: string;
};

export async function segmentDrawing(imageUri: string): Promise<SegmentResult> {
  return { segmentedUri: imageUri };
}
