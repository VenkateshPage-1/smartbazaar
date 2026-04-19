const css = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#FAFBFC;color:#1A1D23;-webkit-font-smoothing:antialiased}
a{text-decoration:none;color:inherit}
.container{max-width:480px;margin:0 auto;padding:0 16px;min-height:100vh}
.header{padding:16px 0;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #E4E7EB}
.logo{color:#0D9488;font-size:20px;font-weight:700}
.lang-btn{color:#6B7280;font-size:13px;padding:6px 12px;border:1px solid #E4E7EB;border-radius:8px;background:#fff;cursor:pointer}
.card{background:#fff;border-radius:10px;padding:14px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,0.04)}
.shop-header{padding:20px 0 16px}
.shop-name{font-size:22px;font-weight:700}
.shop-desc{color:#6B7280;margin-top:4px;font-size:14px}
.tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.tag{padding:3px 10px;border-radius:6px;font-size:11px;font-weight:600;background:#6B728014;color:#6B7280}
.tag-accent{background:#0D948814;color:#0D9488}
.wa-btn{display:flex;align-items:center;justify-content:center;gap:8px;background:#25D366;color:#fff;padding:14px;border-radius:10px;font-weight:600;font-size:15px;margin:16px 0;cursor:pointer;border:none;width:100%;text-align:center}
.wa-btn:hover{background:#1fba59}
.section-title{font-size:16px;font-weight:600;margin:20px 0 10px}
.item{display:flex;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.04);margin-bottom:8px;cursor:pointer;transition:opacity 0.15s}
.item:hover{opacity:0.9}
.item-img{width:88px;height:88px;background:#F0F2F5;flex-shrink:0;object-fit:cover}
.item-img-placeholder{width:88px;height:88px;background:#F0F2F5;display:flex;align-items:center;justify-content:center;color:#6B7280;font-size:22px;flex-shrink:0}
.item-info{padding:10px;display:flex;flex-direction:column;justify-content:center;flex:1;min-width:0}
.item-title{font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.item-price{color:#0D9488;font-weight:700;font-size:15px;margin-top:2px}
.item-meta{color:#6B7280;font-size:11px;margin-top:2px}
.empty{text-align:center;color:#6B7280;padding:40px 0}
.search{width:100%;padding:10px 14px;border:1px solid #E4E7EB;border-radius:10px;font-size:14px;background:#fff;margin:12px 0 8px;outline:none}
.search:focus{border-color:#0D9488}
.cats{display:flex;gap:6px;overflow-x:auto;padding:8px 0;-webkit-overflow-scrolling:touch}
.cats::-webkit-scrollbar{display:none}
.cat{padding:6px 12px;border-radius:20px;font-size:12px;font-weight:500;border:1px solid #E4E7EB;background:#fff;color:#6B7280;cursor:pointer;white-space:nowrap;flex-shrink:0}
.cat.active{background:#0D9488;color:#fff;border-color:#0D9488}
.listing-img{width:100%;aspect-ratio:1.4;object-fit:cover;background:#F0F2F5;border-radius:10px}
.listing-price{font-size:22px;font-weight:700;color:#0D9488;margin-top:8px}
.listing-title{font-size:20px;font-weight:700;margin-top:4px}
.listing-desc{color:#1A1D23;font-size:14px;line-height:22px;margin-top:12px}
.seller-card{display:flex;align-items:center;gap:10px;margin-top:14px}
.seller-avatar{width:40px;height:40px;border-radius:20px;background:#ECFDF5;display:flex;align-items:center;justify-content:center;color:#0D9488;font-weight:700;font-size:16px;flex-shrink:0}
.seller-name{font-weight:600;font-size:14px}
.seller-trust{color:#6B7280;font-size:12px}
.back{color:#0D9488;font-size:14px;font-weight:600;padding:8px 0;display:inline-block}
.store-list{display:flex;flex-direction:column;gap:10px;padding:16px 0}
.store-card{background:#fff;border-radius:10px;padding:14px;box-shadow:0 2px 8px rgba(0,0,0,0.04);cursor:pointer;transition:opacity 0.15s}
.store-card:hover{opacity:0.9}
.store-name{font-size:16px;font-weight:600}
.store-desc{color:#6B7280;font-size:13px;margin-top:4px}
.store-meta{display:flex;gap:12px;margin-top:8px;font-size:12px;color:#6B7280}
.store-items{color:#0D9488;font-weight:600}
.dist-badge{background:#ECFDF5;color:#0D9488;font-size:10px;font-weight:600;padding:2px 6px;border-radius:4px;margin-left:8px}
.hero{text-align:center;padding:40px 0 20px}
.hero-title{color:#0D9488;font-size:28px;font-weight:700}
.hero-sub{color:#6B7280;margin-top:6px;font-size:14px}
`;

export function html(title, ogTitle, ogDesc, ogImage, bodyContent, lang = 'en') {
  const ogUrl = '';
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>${esc(title)}</title>
<meta property="og:title" content="${esc(ogTitle)}">
<meta property="og:description" content="${esc(ogDesc)}">
${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">` : ''}
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(ogTitle)}">
<meta name="twitter:description" content="${esc(ogDesc)}">
${ogImage ? `<meta name="twitter:image" content="${esc(ogImage)}">` : ''}
<style>${css}</style>
</head>
<body>
<div class="container">
${bodyContent}
</div>
</body>
</html>`;
}

export function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function formatPrice(p) {
  return '₹' + Number(p).toLocaleString('en-IN');
}
