(function (root) {
  'use strict';
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl = value => {
    const s = String(value || '').trim();
    return /^(https?:\/\/|mailto:|\/(?!\/)|\.\/)/i.test(s) ? s : '';
  };
  const state = item => item.status || 'published';
  const publicItem = item => !['hidden', 'private'].includes(state(item));
  function resolveAnnouncement(list, search) {
    const p = new URLSearchParams(search);
    const id = p.get('id');
    if (id) return list.find(n => n.id === id) || null;
    const raw = p.get('i');
    if (raw == null || !/^\d+$/.test(raw)) return null;
    const i = Number(raw);
    return list.find(n => n.legacyIndex === i) || null;
  }
  const announcementUrl = n => '/oshirase?id=' + encodeURIComponent(n.id);
  function blocksHtml(blocks) {
    return (blocks || []).map(b => {
      const color = ['normal','navy','red'].includes(b.color) ? b.color : 'normal';
      const size = ['normal','large','small'].includes(b.size) ? b.size : 'normal';
      let out = b.text ? `<div class="blk blk-color-${color} blk-size-${size}">${esc(b.text)}</div>` : '';
      const image = safeUrl(b.image);
      if (image) out += `<img class="blk-img" src="${esc(image)}" alt="${esc(b.alt || '')}" loading="lazy">`;
      const url = safeUrl(b.videoUrl);
      if (url) {
        const match = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
        if (match) out += `<div class="media-embed"><iframe src="https://www.youtube.com/embed/${esc(match[1])}" title="${esc(b.linkLabel || '記録動画')}" loading="lazy" allowfullscreen></iframe></div>`;
        else out += `<p><a href="${esc(url)}" target="_blank" rel="noopener">動画を見る →</a></p>`;
      }
      const link = safeUrl(b.linkUrl);
      if (link) out += `<p><a href="${esc(link)}" target="_blank" rel="noopener">${esc(b.linkLabel || '関連リンク')} →</a></p>`;
      return out;
    }).join('');
  }
  root.JintoreArchive = {esc, safeUrl, state, publicItem, resolveAnnouncement, announcementUrl, blocksHtml};
})(typeof window === 'undefined' ? globalThis : window);
