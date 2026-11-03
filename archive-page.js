(async function () {
  'use strict';
  const A = JintoreArchive;
  const $ = id => document.getElementById(id);
  const box = $('archive-records');
  try {
    const [oldData, data] = await Promise.all(['/archive.json','/content.json'].map(async url => {
      const r = await fetch(url, {cache:'no-store'});
      if (!r.ok) throw new Error('記事の読み込みに失敗しました');
      return r.json();
    }));
    const line = A.safeUrl(data.lineUrl);
    if (line) $('archive-line').href = line;
    const oldRecords = (oldData.records || []).filter(A.publicItem);
    const records = oldRecords.map(r => ({...r, category:'old', href:'/archive?id='+encodeURIComponent(r.id)}))
      .concat((data.announcements || []).filter(n => A.state(n)==='archived').map(n => ({...n,category:'announcements',href:A.announcementUrl(n)})));
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) {
      $('archive-heading').hidden = true;
      $('archive-filters').hidden = true;
      $('archive-back').hidden = false;
      const record = oldRecords.find(r => r.id === id);
      if (!record) {
        box.innerHTML = '<h1>記録が見つかりませんでした</h1><p>一覧から記事をお探しください。</p>';
        const meta = document.createElement('meta'); meta.name='robots'; meta.content='noindex'; document.head.appendChild(meta);
        return;
      }
      document.title = record.title + ' | 過去の記録 | 靭トレ協会';
      $('canonical').href = 'https://jintore-site.pages.dev/archive?id='+encodeURIComponent(record.id);
      const source = A.safeUrl(record.sourceUrl);
      box.innerHTML = `<div class="a-head"><span class="a-tag">旧ホームページの記録</span><span class="a-date">${record.date ? '当時の掲載日：'+A.esc(record.date) : '掲載日不明'}</span></div>
        <h1 class="a-title">${A.esc(record.title)}</h1>
        <p class="archive-status">旧ホームページから保存した当時の記録です。本文や画像内の日時・募集案内・連絡先は掲載当時の情報です。</p>
        ${A.blocksHtml(record.blocks)}
        ${source ? `<p class="source">掲載元：旧ホームページ<br><a href="${A.esc(source)}" target="_blank" rel="noopener">${A.esc(source)}</a></p>` : ''}
        <div class="a-foot"><a class="back" href="/archive">← アーカイブ一覧へ戻る</a></div>`;
      return;
    }
    // 公開時期を断定できない日付は、元の表記のまま表示する。
    records.sort((a,b) => {
      const key = r => {
        const m=String(r.date||'').match(/^(\d{4})[.\/-](\d{1,2})[.\/-](\d{1,2})/);
        return m ? m[1]+m[2].padStart(2,'0')+m[3].padStart(2,'0') : '00000000';
      };
      return key(b).localeCompare(key(a));
    });
    function show(category) {
      const items = records.filter(r => category==='all' || r.category===category);
      $('record-count').textContent = items.length+'件の記録';
      document.querySelectorAll('[data-category]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.category===category)));
      box.innerHTML = items.length ? items.map(r => {
        const image = A.safeUrl((r.images||[])[0] || r.image || ((r.blocks||[]).find(b=>b.image)||{}).image);
        const text = r.body || (r.blocks||[]).filter(b=>b.text).map(b=>b.text).join(' ');
        const excerpt = String(text||'').replace(/\s+/g,' ').slice(0,85);
        return `<a class="record-card${image ? '' : ' no-image'}" href="${A.esc(r.href)}"><div><div class="record-meta"><span class="record-tag">${r.category==='old' ? '旧ホームページの記録' : '過去のお知らせ'}</span><span class="record-date">${A.esc(r.date||'日付不明')}</span></div><h2>${A.esc(r.title)}</h2>${excerpt ? `<p>${A.esc(excerpt)}${excerpt.length===85 ? '…' : ''}</p>` : ''}</div>${image ? `<img src="${A.esc(image)}" alt="" loading="lazy">` : ''}</a>`;
      }).join('') : '<p class="notfound">この種類の記録はまだありません。</p>';
    }
    const start = ['old','announcements'].includes(params.get('category')) ? params.get('category') : 'all';
    show(start);
    document.querySelectorAll('[data-category]').forEach(b=>b.addEventListener('click',()=>{
      show(b.dataset.category);
      history.replaceState(null,'',b.dataset.category==='all' ? '/archive' : '/archive?category='+b.dataset.category);
    }));
  } catch (error) {
    console.error(error);
    box.innerHTML = '<p class="notfound">記録を読み込めませんでした。時間をおいて再読み込みしてください。</p>';
  }
})();
