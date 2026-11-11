/**
 * Helper untuk kompresi file gambar menggunakan HTML5 Canvas.
 * Resize maksimal width/height 1024px dan kualitas 0.7.
 * Jika file bukan gambar (misal PDF), akan dikembalikan tanpa kompresi.
 *
 * @param {File} file - File input dari HTML File Input
 * @param {number} maxWidth - Maksimal lebar piksel (default: 1024)
 * @param {number} maxHeight - Maksimal tinggi piksel (default: 1024)
 * @param {number} quality - Kualitas kompresi 0 - 1.0 (default: 0.7)
 * @returns {Promise<File>} File/Blob hasil kompresi
 */
export async function compressImage(file, maxWidth = 1024, maxHeight = 1024, quality = 0.7) {
  if (!file || !file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: mimeType,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => resolve(file);
    };

    reader.onerror = () => resolve(file);
  });
}
