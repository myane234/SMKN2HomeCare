import { useEffect, useRef } from 'react';
import Quill from 'quill';
import ImageDrop from 'quill-image-drop-and-paste';
import 'quill/dist/quill.snow.css';
import { URL } from '../utils/getUrl.js';
import { getAuthHeaders, handleUnauthorized } from '../utils/auth.js';

// Register drag & drop + paste image module once (module scope, not per-render).
Quill.register('modules/imageDrop', ImageDrop);

// ---------------------------------------------------------------------------
// Custom Image format / blot preserving inline styles (width/height) in Quill 2
// ---------------------------------------------------------------------------
const BaseImage = Quill.import('formats/image');

class CustomImage extends BaseImage {
  static create(value) {
    const node = super.create(value);
    if (typeof value === 'object' && value !== null) {
      if (value.url || value.src) node.setAttribute('src', value.url || value.src);
      if (value.style) node.setAttribute('style', value.style);
      if (value.width) node.setAttribute('width', value.width);
      if (value.height) node.setAttribute('height', value.height);
    } else if (typeof value === 'string') {
      node.setAttribute('src', value);
    }
    return node;
  }

  static formats(domNode) {
    const formats = super.formats(domNode) || {};
    if (domNode.hasAttribute('style')) {
      formats.style = domNode.getAttribute('style');
    }
    if (domNode.hasAttribute('width')) {
      formats.width = domNode.getAttribute('width');
    }
    if (domNode.hasAttribute('height')) {
      formats.height = domNode.getAttribute('height');
    }
    return formats;
  }

  format(name, value) {
    if (name === 'style') {
      if (value) {
        this.domNode.setAttribute('style', value);
      } else {
        this.domNode.removeAttribute('style');
      }
    } else if (name === 'width') {
      if (value) {
        this.domNode.setAttribute('width', value);
      } else {
        this.domNode.removeAttribute('width');
      }
    } else if (name === 'height') {
      if (value) {
        this.domNode.setAttribute('height', value);
      } else {
        this.domNode.removeAttribute('height');
      }
    } else {
      super.format(name, value);
    }
  }
}

Quill.register(CustomImage, true);

// ---------------------------------------------------------------------------
// Custom image-resize module (Quill 2 compatible).
// Shows an overlay with 4 corner handles when an image is clicked, and lets
// the user drag to resize while keeping the aspect ratio.
// (The npm packages quill-image-resize / quill-image-resize-module-react are
// built for Quill 1.x and bundle their own Quill copy, so they conflict with
// Quill 2. Hence this small native implementation.)
// ---------------------------------------------------------------------------
class ImageResize {
  constructor(quill, options = {}) {
    this.quill = quill;
    this.options = options;
    this.img = null;
    this.overlay = null;
    this.handles = [];
    this.minWidth = options.minWidth || 50;

    this.handleClick = this.handleClick.bind(this);
    this.handleMousedown = this.handleMousedown.bind(this);
    this.handleMousemove = this.handleMousemove.bind(this);
    this.handleMouseup = this.handleMouseup.bind(this);

    this.quill.root.addEventListener('click', this.handleClick);
  }

  handleClick(evt) {
    if (evt.target && evt.target.tagName === 'IMG') {
      this.show(evt.target);
    } else {
      this.hide();
    }
  }

  show(img) {
    this.hide();
    this.img = img;
    img.classList.add('ql-image-resize-selected');

    this.overlay = document.createElement('div');
    this.overlay.className = 'ql-image-resize-overlay';
    this.quill.root.parentNode.appendChild(this.overlay);

    const positions = ['nw', 'ne', 'se', 'sw'];
    positions.forEach((pos) => {
      const box = document.createElement('div');
      box.className = `ql-image-resize-handle ${pos}`;
      box.addEventListener('mousedown', (e) => this.handleMousedown(e, pos));
      this.overlay.appendChild(box);
      this.handles.push(box);
    });

    this.reposition();
  }

  reposition() {
    if (!this.overlay || !this.img) return;
    const parent = this.quill.root.parentNode;
    const imgRect = this.img.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    this.overlay.style.left = `${imgRect.left - parentRect.left + parent.scrollLeft}px`;
    this.overlay.style.top = `${imgRect.top - parentRect.top - parent.scrollTop}px`;
    this.overlay.style.width = `${imgRect.width}px`;
    this.overlay.style.height = `${imgRect.height}px`;
  }

  handleMousedown(evt, pos) {
    evt.preventDefault();
    evt.stopPropagation();
    if (!this.img) return;
    const startX = evt.clientX;
    const startWidth = this.img.getBoundingClientRect().width;
    this.dragPos = pos;
    this.dragStartX = startX;
    this.dragStartWidth = startWidth;
    document.addEventListener('mousemove', this.handleMousemove);
    document.addEventListener('mouseup', this.handleMouseup);
  }

  handleMousemove(evt) {
    if (!this.img) return;
    const delta = evt.clientX - this.dragStartX;
    let newWidth = this.dragPos === 'nw' || this.dragPos === 'sw'
      ? this.dragStartWidth - delta
      : this.dragStartWidth + delta;
    newWidth = Math.max(this.minWidth, Math.round(newWidth));
    // Keep aspect ratio: set style width and height
    this.img.style.width = `${newWidth}px`;
    this.img.style.height = 'auto';
    this.img.setAttribute('width', `${newWidth}`);
    this.img.setAttribute('style', `width: ${newWidth}px; height: auto;`);
    this.reposition();
  }

  handleMouseup() {
    document.removeEventListener('mousemove', this.handleMousemove);
    document.removeEventListener('mouseup', this.handleMouseup);
    if (this.img) {
      const widthVal = this.img.style.width || `${this.img.getBoundingClientRect().width}px`;
      this.img.setAttribute('style', `width: ${widthVal}; height: auto;`);
      this.img.setAttribute('width', parseInt(widthVal, 10));

      this.quill.update('user');
      if (typeof this.options.onResize === 'function') {
        this.options.onResize();
      }
    }
  }

  hide() {
    if (this.img) {
      this.img.classList.remove('ql-image-resize-selected');
      this.img = null;
    }
    if (this.overlay) {
      this.overlay.parentNode?.removeChild(this.overlay);
      this.overlay = null;
    }
    this.handles.forEach((h) => h.removeEventListener('mousedown', this.handleMousedown));
    this.handles = [];
  }
}

// Register the custom resize module once (module scope, not per-render).
Quill.register('modules/imageResize', ImageResize);

// ---------------------------------------------------------------------------
// Custom numeric font-size options (like Microsoft Word), instead of the
// default 'small' / 'large' / 'huge' keyword sizes.
// ---------------------------------------------------------------------------
const SIZE_OPTIONS = [
  { value: '10px', label: '10' },
  { value: '12px', label: '12' },
  { value: '14px', label: '14' },
  { value: '16px', label: '16' },
  { value: '18px', label: '18' },
  { value: '20px', label: '20' },
  { value: '24px', label: '24' },
  { value: '28px', label: '28' },
  { value: '32px', label: '32' },
  { value: '36px', label: '36' },
  { value: '48px', label: '48' },
  { value: '72px', label: '72' },
];

// Register the custom size attributor once (module scope, not per-render).
const SizeStyle = Quill.import('attributors/style/size');
SizeStyle.whitelist = SIZE_OPTIONS.map((opt) => opt.value);
Quill.register(SizeStyle, true);

// Custom toolbar options
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  [{ size: [false, ...SIZE_OPTIONS.map((opt) => opt.value)] }],
  ['bold', 'italic', 'underline'],
  ['link', 'image'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['blockquote', 'clean'],
];

// Tooltip text (with keyboard shortcuts)
const TOOLTIP_MAP = {
  '.ql-header .ql-picker-label': 'Gaya Heading',
  '.ql-header .ql-picker-item[data-value="1"]': 'Heading 1 (Ctrl+Alt+1)',
  '.ql-header .ql-picker-item[data-value="2"]': 'Heading 2 (Ctrl+Alt+2)',
  '.ql-header .ql-picker-item[data-value="3"]': 'Heading 3 (Ctrl+Alt+3)',
  '.ql-header .ql-picker-item:not([data-value])': 'Normal (Ctrl+Alt+0)',
  '.ql-size .ql-picker-label': 'Ukuran Teks',
  '.ql-bold': 'Tebal (Ctrl+B)',
  '.ql-italic': 'Miring (Ctrl+I)',
  '.ql-underline': 'Garis Bawah (Ctrl+U)',
  '.ql-link': 'Sisipkan Tautan (Ctrl+K)',
  '.ql-list[value="ordered"]': 'Daftar Bernomor (Ctrl+Shift+7)',
  '.ql-list[value="bullet"]': 'Daftar Poin (Ctrl+Shift+8)',
  '.ql-blockquote': 'Kutipan (Ctrl+Shift+9)',
  '.ql-clean': 'Hapus Format (Ctrl+Spasi)',
};

// Inject the numeric-size labels + tooltip styling once per page.
function ensureEditorStylesInjected() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('rte-custom-styles')) return;

  const sizeLabelRules = SIZE_OPTIONS.map(
    ({ value, label }) => `
      .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="${value}"]::before,
      .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="${value}"]::before {
        content: "${label}";
      }
    `
  ).join('\n');

  const style = document.createElement('style');
  style.id = 'rte-custom-styles';
  style.textContent = `
    ${sizeLabelRules}

    .ql-toolbar.ql-snow .ql-picker.ql-size {
      width: 92px;
      min-width: 92px;
    }
    .ql-toolbar.ql-snow .ql-picker.ql-size .ql-picker-options {
      max-height: 260px;
      overflow-y: auto;
      min-width: 10rem;
    }
    .ql-snow .ql-picker {
      min-width: 5rem;
    }

    .rte-wrapper .ql-toolbar.ql-snow {
      border-top-left-radius: 0.5rem;
      border-top-right-radius: 0.5rem;
      position: relative;
      z-index: 1;
      background: #fff;
    }
    .rte-wrapper .ql-container.ql-snow {
      border-bottom-left-radius: 0.5rem;
      border-bottom-right-radius: 0.5rem;
      height: auto;
    }
    .rte-wrapper .ql-editor {
      min-height: 240px;
      max-height: 55vh;
      overflow-y: auto;
      word-break: break-word;
      white-space: pre-wrap;
    }
    @media (max-width: 640px) {
      .rte-wrapper .ql-editor {
        max-height: 40vh;
      }
    }
    .rte-wrapper .ql-tooltip {
      z-index: 30;
    }

    .ql-toolbar.ql-snow [data-tooltip] {
      position: relative;
    }
    .ql-toolbar.ql-snow [data-tooltip]:hover::after {
      content: attr(data-tooltip);
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      background: #1e293b;
      color: #fff;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 500;
      line-height: 1.3;
      white-space: nowrap;
      z-index: 60;
      pointer-events: none;
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    }
    .ql-toolbar.ql-snow [data-tooltip]:hover::before {
      content: '';
      position: absolute;
      bottom: calc(100% + 3px);
      left: 50%;
      transform: translateX(-50%);
      border: 5px solid transparent;
      border-top-color: #1e293b;
      z-index: 60;
      pointer-events: none;
    }
    .ql-toolbar.ql-snow .ql-picker-item[data-tooltip] {
      position: relative;
    }

    /* Image resize overlay + handles */
    .ql-image-resize-overlay {
      position: absolute;
      box-sizing: border-box;
      border: 2px solid #3b82f6;
      pointer-events: none;
      z-index: 20;
    }
    .ql-image-resize-handle {
      position: absolute;
      width: 10px;
      height: 10px;
      background: #fff;
      border: 2px solid #3b82f6;
      border-radius: 2px;
      pointer-events: all;
      box-sizing: border-box;
    }
    .ql-image-resize-handle.nw { top: -6px; left: -6px; cursor: nwse-resize; }
    .ql-image-resize-handle.ne { top: -6px; right: -6px; cursor: nesw-resize; }
    .ql-image-resize-handle.se { bottom: -6px; right: -6px; cursor: nwse-resize; }
    .ql-image-resize-handle.sw { bottom: -6px; left: -6px; cursor: nesw-resize; }
    .ql-image-resize-selected {
      outline: 2px solid rgba(59, 130, 246, 0.4);
    }
  `;
  document.head.appendChild(style);
}

// Upload gambar drag & drop / paste ke server, lalu sisipkan URL yang
// dikembalikan. Dengan ini `isi_artikel` tidak menyimpan base64 raksasa,
// sehingga request POST /artikel tetap kecil dan terhindar dari error
// melebihi batas ukuran body serta gagal autentikasi.
async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${URL}/artikel/upload-images`, {
    method: 'POST',
    headers: getAuthHeaders({ Accept: 'application/json' }),
    body: formData,
  });

  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Sesi berakhir. Silakan login kembali.');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || 'Gagal mengunggah gambar');
  }

  const body = await res.json();
  const urls = body?.urls;
  if (Array.isArray(urls) && urls.length > 0) {
    const raw = urls[0];

    if (typeof raw === 'string') {
      const withoutHost = raw.replace(/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?/i, '');
      const path = withoutHost.includes('/storage/')
        ? withoutHost.substring(withoutHost.indexOf('/storage/'))
        : `/${withoutHost.replace(/^\/+/, '')}`;

      return path.startsWith('/storage/') ? path : `/storage/${path.replace(/^\/+/, '')}`;
    }

    return raw;
  }
  throw new Error('URL gambar tidak ditemukan');
}

export default function RichTextEditor({ value, onChange, placeholder, error }) {
  const containerRef = useRef(null);
  const quillRef = useRef(null);
  const isInternalChange = useRef(false);

  // Initialize Quill once
  useEffect(() => {
    if (quillRef.current) return;

    ensureEditorStylesInjected();

    const quill = new Quill(containerRef.current, {
      theme: 'snow',
      placeholder: placeholder || 'Tulis isi artikel di sini...',
      modules: {
        toolbar: TOOLBAR_OPTIONS,
        clipboard: {
          matchVisual: false,
        },
        history: {
          delay: 2000,
          maxStack: 500,
          userOnly: true,
        },
        imageDrop: {
          // handler terpanggil setiap kali gambar di-drop / di-paste.
          handler: async (dataUrl, type, imageData) => {
            const index = quill.getSelection(true)?.index ?? quill.getLength() - 1;
            try {
              const file = imageData.toFile ? imageData.toFile() : dataUrl;
              const url = await uploadImage(file);
              quill.insertEmbed(index, 'image', url, 'user');
              quill.setSelection(index + 1);
            } catch (err) {
              // Fallback: sisipkan base64 langsung agar artikel tetap bisa
              // disimpan, meskipun upload ke server gagal (mis. token login
              // sudah tidak valid / belum login ulang).
              console.warn('Upload ke server gagal, pakai base64:', err.message);
              quill.insertEmbed(index, 'image', dataUrl, 'user');
              quill.setSelection(index + 1);
            }
          },
        },
        imageResize: {
          onResize: () => {
            if (onChange && quillRef.current) {
              const html = quillRef.current.root?.innerHTML || '';
              const cleanHtml = html === '<p></p>' || html === '<p><br></p>' ? '' : html;
              onChange(cleanHtml);
            }
          },
        },
      },
      formats: [
        'header',
        'size',
        'bold',
        'italic',
        'underline',
        'link',
        'list',
        'blockquote',
        'image',
        'style',
        'width',
        'height',
      ],
    });

    quillRef.current = quill;

    // Load initial value on mount if available
    if (value) {
      quill.clipboard.dangerouslyPasteHTML(value);
    }

    // Attach shortcut tooltips
    const toolbarEl = quill.getModule('toolbar')?.container;
    if (toolbarEl) {
      Object.entries(TOOLTIP_MAP).forEach(([selector, text]) => {
        toolbarEl.querySelectorAll(selector).forEach((el) => {
          el.setAttribute('data-tooltip', text);
        });
      });
    }

    // Notify parent on user input
    quill.on('text-change', () => {
      if (!isInternalChange.current && onChange) {
        const html = quill.root?.innerHTML || '';
        const cleanHtml = html === '<p></p>' || html === '<p><br></p>' ? '' : html;
        onChange(cleanHtml);
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync value from parent -> editor when API/props change asynchronously
  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;

    const currentHtml = quill.root?.innerHTML || '';
    const incomingValue = value || '';

    // Only update if value from parent is different and not equal to empty editor default
    const isCurrentEmpty = currentHtml === '<p><br></p>' || currentHtml === '<p></p>';

    if (incomingValue !== currentHtml && !(incomingValue === '' && isCurrentEmpty)) {
      isInternalChange.current = true;
      quill.clipboard.dangerouslyPasteHTML(incomingValue);
      isInternalChange.current = false;
    }
  }, [value]);

  return (
    <div
      className={[
        'rte-wrapper rounded-lg border transition-colors',
        error ? 'border-red-400' : 'border-slate-200 focus-within:border-primary',
      ].join(' ')}
    >
      <div ref={containerRef} />
    </div>
  );
}
