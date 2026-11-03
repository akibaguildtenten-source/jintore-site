(function initArchiveEditor() {
  if (!window.CMS) { setTimeout(initArchiveEditor, 150); return; }
  function newId(prefix) {
    if (window.crypto && window.crypto.randomUUID) return prefix + window.crypto.randomUUID();
    return prefix + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  }
  CMS.registerEventListener({
    name: 'preSave',
    handler: async function ({entry}) {
      const data = entry.get('data');
      const isContent = data.has('announcements');
      const key = isContent ? 'announcements' : (data.has('records') ? 'records' : null);
      if (!key) return data;
      const sourceList = data.get(key);
      const items = sourceList.toJS();
      const ids = new Set();
      items.forEach(function (item) {
        if (!item.id) item.id = newId(isContent ? 'notice-' : 'record-');
        if (ids.has(item.id)) {
          item.id = newId(isContent ? 'notice-' : 'record-');
          delete item.legacyIndex;
        }
        ids.add(item.id);
      });
      // 一覧の「削除」も、公開済みのお知らせは消失させずアーカイブとして残す。
      if (isContent) {
        const response = await fetch('/content.json', {cache:'no-store'});
        if (!response.ok) throw new Error('元のお知らせを確認できないため保存を中止しました。再度保存してください。');
        const previous = await response.json();
        (previous.announcements || []).forEach(function (item) {
          if (item.id && !ids.has(item.id)) {
            const status = ['hidden','private'].includes(item.status) ? item.status : 'archived';
            items.push(Object.assign({}, item, {status:status}));
            ids.add(item.id);
          }
        });
      }
      // 元データと同じImmutableの型に戻す（入れ子の画像・本文ブロックも保持）。
      const MapType = data.constructor;
      const ListType = sourceList.constructor;
      function immutable(value) {
        if (Array.isArray(value)) return ListType(value.map(immutable));
        if (value && typeof value === 'object') {
          const out = {};
          Object.keys(value).forEach(k => { out[k] = immutable(value[k]); });
          return MapType(out);
        }
        return value;
      }
      return data.set(key, immutable(items));
    }
  });
})();
