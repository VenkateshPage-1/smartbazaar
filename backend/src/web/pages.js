import { prisma } from '../db.js';
import { html, esc, formatPrice } from './template.js';

export default async function webRoutes(app) {

  // Home — list all shops
  app.get('/w', async (req, reply) => {
    const shops = await prisma.shop.findMany({
      where: { active: true },
      include: { _count: { select: { listings: { where: { status: 'active' } } } } },
      orderBy: { createdAt: 'desc' },
    });

    const body = `
      <div class="header">
        <span class="logo">SmartBazaar</span>
      </div>
      <div class="hero">
        <div class="hero-title">SmartBazaar</div>
        <div class="hero-sub">Your village store, city prices</div>
      </div>
      <div class="section-title">Stores</div>
      ${shops.length === 0 ? '<div class="empty">No stores yet.</div>' : ''}
      <div class="store-list">
        ${shops.map((s) => `
          <a href="/w/shop/${s.id}" class="store-card">
            <div class="store-name">${esc(s.name)}</div>
            ${s.description ? `<div class="store-desc">${esc(s.description)}</div>` : ''}
            <div class="store-meta">
              <span>${esc(s.category)}</span>
              ${s.city ? `<span>${esc(s.city)}</span>` : ''}
              <span class="store-items">${s._count.listings} items</span>
              ${s.deliveryKm > 0 ? `<span>Delivers ${s.deliveryKm} km</span>` : ''}
            </div>
          </a>
        `).join('')}
      </div>
    `;

    reply.type('text/html').send(html(
      'SmartBazaar — Village Store, City Prices',
      'SmartBazaar',
      'Browse shops near you. City prices in your village.',
      null,
      body
    ));
  });

  // Shop catalogue page
  app.get('/w/shop/:id', async (req, reply) => {
    const shop = await prisma.shop.findUnique({
      where: { id: req.params.id },
      include: { owner: { select: { name: true, trustScore: true, verified: true } } },
    });
    if (!shop) return reply.code(404).type('text/html').send(html('Not Found', 'Not Found', '', null, '<div class="empty">Shop not found.</div>'));

    const items = await prisma.listing.findMany({
      where: { shopId: shop.id, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
    const parsedItems = items.map((l) => ({ ...l, images: JSON.parse(l.images || '[]') }));

    const waPhone = shop.phone.startsWith('+') ? shop.phone.replace(/\D/g, '') : `91${shop.phone.replace(/\D/g, '')}`;
    const waMsg = encodeURIComponent(`Hi, I saw your shop "${shop.name}" on SmartBazaar. I'd like to order.`);

    const ogImage = parsedItems.find((i) => i.images.length > 0)?.images[0] || null;

    const body = `
      <div class="header">
        <a href="/w" class="logo">SmartBazaar</a>
      </div>
      <div class="shop-header">
        <div class="shop-name">${esc(shop.name)}</div>
        ${shop.description ? `<div class="shop-desc">${esc(shop.description)}</div>` : ''}
        <div class="tags">
          <span class="tag">${esc(shop.category)}</span>
          ${shop.city ? `<span class="tag">${esc(shop.city)}</span>` : ''}
          ${shop.deliveryKm > 0 ? `<span class="tag">Delivers ${shop.deliveryKm} km</span>` : ''}
          <span class="tag tag-accent">${parsedItems.length} items</span>
        </div>
        ${shop.address ? `<div style="color:#6B7280;margin-top:8px;font-size:13px">${esc(shop.address)}</div>` : ''}
        ${shop.deliveryNote ? `<div style="color:#0D9488;margin-top:4px;font-size:13px">${esc(shop.deliveryNote)}</div>` : ''}
        <a href="https://wa.me/${waPhone}?text=${waMsg}" class="wa-btn" target="_blank">Order on WhatsApp</a>
      </div>
      <div class="section-title">Catalogue</div>
      ${parsedItems.length === 0 ? '<div class="empty">No items in catalogue yet.</div>' : ''}
      ${parsedItems.map((item) => `
        <a href="/w/listing/${item.id}" class="item">
          ${item.images[0]
            ? `<img class="item-img" src="${esc(item.images[0])}" alt="${esc(item.title)}" loading="lazy">`
            : '<div class="item-img-placeholder">◱</div>'}
          <div class="item-info">
            <div class="item-title">${esc(item.title)}</div>
            <div class="item-price">${formatPrice(item.price)}</div>
            <div class="item-meta">${esc(item.category)}${item.stock != null ? ` · ${item.stock} in stock` : ''}</div>
          </div>
        </a>
      `).join('')}
    `;

    reply.type('text/html').send(html(
      `${shop.name} — SmartBazaar`,
      `${shop.name} on SmartBazaar`,
      shop.description || `Browse ${parsedItems.length} items from ${shop.name}. ${shop.city || ''}`,
      ogImage,
      body
    ));
  });

  // Listing detail page
  app.get('/w/listing/:id', async (req, reply) => {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: { seller: { select: { id: true, name: true, phone: true, trustScore: true, verified: true } } },
    });
    if (!listing) return reply.code(404).type('text/html').send(html('Not Found', 'Not Found', '', null, '<div class="empty">Listing not found.</div>'));

    const images = JSON.parse(listing.images || '[]');
    const sellerPhone = listing.seller?.phone || '';
    const waPhone = sellerPhone.startsWith('+') ? sellerPhone.replace(/\D/g, '') : `91${sellerPhone.replace(/\D/g, '')}`;
    const waMsg = encodeURIComponent(`Hi, I'm interested in "${listing.title}" listed at ₹${listing.price} on SmartBazaar.`);

    const shop = listing.shopId ? await prisma.shop.findUnique({ where: { id: listing.shopId } }) : null;

    const body = `
      <div class="header">
        <a href="/w" class="logo">SmartBazaar</a>
      </div>
      ${shop ? `<a href="/w/shop/${shop.id}" class="back">← ${esc(shop.name)}</a>` : '<a href="/w" class="back">← Back</a>'}
      <div style="padding:12px 0">
        ${images[0]
          ? `<img class="listing-img" src="${esc(images[0])}" alt="${esc(listing.title)}">`
          : ''}
        <div class="listing-price">${formatPrice(listing.price)}</div>
        <div class="listing-title">${esc(listing.title)}</div>
        <div class="tags" style="margin-top:10px">
          <span class="tag">${esc(listing.category)}</span>
          <span class="tag">${esc(listing.condition)}</span>
          ${listing.city ? `<span class="tag">${esc(listing.city)}</span>` : ''}
          ${listing.stock != null ? `<span class="tag tag-accent">${listing.stock > 0 ? listing.stock + ' in stock' : 'Out of stock'}</span>` : ''}
        </div>
        ${listing.description ? `<div class="listing-desc">${esc(listing.description)}</div>` : ''}
        <div class="card seller-card" style="margin-top:16px">
          <div class="seller-avatar">${(listing.seller?.name || 'S').charAt(0).toUpperCase()}</div>
          <div>
            <div class="seller-name">${esc(listing.seller?.name || 'Seller')}</div>
            <div class="seller-trust">Trust ${listing.seller?.trustScore || 50}/100${listing.seller?.verified ? ' · Verified' : ''}</div>
          </div>
        </div>
        <a href="https://wa.me/${waPhone}?text=${waMsg}" class="wa-btn" target="_blank">Chat on WhatsApp</a>
      </div>
    `;

    reply.type('text/html').send(html(
      `${listing.title} — ${formatPrice(listing.price)} — SmartBazaar`,
      `${listing.title} — ${formatPrice(listing.price)}`,
      listing.description || `${listing.category} · ${listing.condition}`,
      images[0] || null,
      body
    ));
  });
}
