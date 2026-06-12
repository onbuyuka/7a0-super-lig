import html2canvas from 'html2canvas';

export type SaveImageResult = 'saved' | 'failed';

/**
 * Render the result card element to a PNG and download it as a file.
 */
export async function saveCardImage(node: HTMLElement): Promise<SaveImageResult> {
  try {
    // Wait for web fonts so the card renders with the right typography.
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      await document.fonts.ready;
    }

    // html2canvas draws the DOM straight to a canvas (keeps the live fonts).
    const canvas = await html2canvas(node, {
      scale: 3,
      backgroundColor: '#f5f1e8',
      useCORS: true,
      logging: false,
    });
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png'),
    );
    if (!blob) return 'failed';

    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = '7a0-super-lig.png';
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
    return 'saved';
  } catch {
    return 'failed';
  }
}

