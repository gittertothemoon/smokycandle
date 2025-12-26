(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

  function formatEUR(value) {
    try { return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value); }
    catch { return `€${Number(value || 0).toFixed(2)}`; }
  }

  function safeJSONParse(str, fallback) {
    try { return JSON.parse(str); } catch { return fallback; }
  }

  function escapeHTML(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function uid() {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  /* =========================
   * ASSETS (public + src/public)
   * ========================= */
  const ASSET_BASES = ["src/public/", "public/"]; // prova prima public/, poi src/public/
  const ASSET_EXTS = [".webp", ".png", ".jpg", ".jpeg", ".svg"];

  function setAssetImg(imgEl, baseName) {
    if (!imgEl || !baseName) return;

    const candidates = [];
    for (const base of ASSET_BASES) {
      for (const ext of ASSET_EXTS) {
        candidates.push(`${base}${baseName}${ext}`);
      }
    }

    let i = 0;
    const tryNext = () => {
      if (i >= candidates.length) {
        imgEl.classList.add("is-missing");
        imgEl.removeAttribute("src");
        imgEl.onerror = null;
        return;
      }
      imgEl.classList.remove("is-missing");
      imgEl.src = candidates[i++];
    };

    imgEl.onerror = tryNext;
    tryNext();
  }

  function bindAssetImgs(root = document) {
    $$("img[data-asset]", root).forEach(img => {
      const name = img.getAttribute("data-asset");
      setAssetImg(img, name);
    });
  }

  /* =========================
   * DATA
   * ========================= */
  const PRODUCTS = [
    {
      id: "butter",
      name: "Butter",
      price: 24.0,
      family: "warm",
      size: "220g",
      burn: "circa 45 ore",
      notes: "vaniglia bourbon · fava tonka · legni chiari",
      desc: "Colata a mano in Italia con cera di soia. Vaniglia bourbon, tonka e legni chiari: un comfort pulito, mai stucchevole.",
      tag: "Collezione Signature · Calda",
      sku: "SC-BTR-220",
      images: ["butter_1", "butter_2", "butter_3"],
      pack: "pack",
    },
    {
      id: "berry",
      name: "Berry",
      price: 24.0,
      family: "cold",
      size: "220g",
      burn: "circa 45 ore",
      notes: "frutti neri · resina d’abete · finale minerale",
      desc: "Colata a mano in Italia con cera di soia. Frutti neri, resina d’abete e un finale minerale: presenza intensa, aria fredda.",
      tag: "Collezione Signature · Fredda",
      sku: "SC-BRY-220",
      images: ["berry_1", "berry_2", "berry_3"],
      pack: "pack",
    },
  ];

  const PRODUCT_MAP = new Map(PRODUCTS.map(p => [p.id, p]));

  const STORAGE_KEY = "sc_cart_v3";
  const ANNOUNCE_KEY = "sc_announce_closed_v1";
  const THEME_KEY = "sc_theme_v1";

  let cart = loadCart();
  const els = {
    year: $("[data-year]"),

    announceBar: $(".announce"),
    announceClose: $("[data-announce-close]"),

    header: $("[data-header]"),

    mobileOpen: $("[data-mobile-open]"),
    mobileNav: $("#mobileNav"),
    mobileCloseLinks: $$("[data-mobile-close]"),

    products: $("[data-products]"),

    overlay: $("[data-overlay]"),
    cartDrawer: $("[data-cart-drawer]"),
    cartOpenBtns: $$("[data-cart-open]"),
    cartClose: $("[data-cart-close]"),
    cartItems: $("[data-cart-items]"),
    cartCount: $("[data-cart-count]"),
    subtotal: $("[data-subtotal]"),
    shipping: $("[data-shipping]"),
    tax: $("[data-tax]"),
    total: $("[data-total]"),
    cartClear: $("[data-cart-clear]"),
    checkoutBtn: $("[data-checkout]"),
    cartHint: $("[data-cart-hint]"),

    freebarText: $("[data-freebar-text]"),
    freebarFill: $("[data-freebar-fill]"),

    crossWrap: $("[data-cross]"),
    crossImg: $("[data-cross-img]"),
    crossName: $("[data-cross-name]"),
    crossMeta: $("[data-cross-meta]"),
    crossPrice: $("[data-cross-price]"),
    crossAdd: $("[data-cross-add]"),

    productModal: $("[data-product-modal]"),
    productClose: $("[data-product-close]"),
    pTitle: $("[data-p-title]"),
    pTag: $("[data-p-tag]"),
    pDesc: $("[data-p-desc]"),
    pWeight: $("[data-p-weight]"),
    pBurn: $("[data-p-burn]"),
    pNotes: $("[data-p-notes]"),
    pPrice: $("[data-p-price]"),
    pImg: $("[data-p-img]"),
    pThumbs: $("[data-p-thumbs]"),
    pQty: $("[data-p-qty]"),
    pQtyDec: $("[data-p-qty-dec]"),
    pQtyInc: $("[data-p-qty-inc]"),
    pAdd: $("[data-p-add]"),

    checkoutModal: $("[data-checkout-modal]"),
    checkoutClose: $("[data-checkout-close]"),
    checkoutForm: $("[data-checkout-form]"),
    checkoutLines: $("[data-checkout-lines]"),
    coSubtotal: $("[data-co-subtotal]"),
    coShipping: $("[data-co-shipping]"),
    coTax: $("[data-co-tax]"),
    coTotal: $("[data-co-total]"),
    countrySelect: $("[data-country]"),

    guideModal: $("[data-guide-modal]"),
    guideClose: $("[data-guide-close]"),
    guideOpenBtns: $$("[data-open-guide]"),

    toast: $("[data-toast]"),

    themeToggle: $("[data-theme-toggle]"),

    finderOpenBtn: $("[data-open-finder]"),
    fMoodBtns: $$("[data-f-mood]"),
    fSpaceBtns: $$("[data-f-space]"),
    fPrefBtns: $$("[data-f-pref]"),
    fResultName: $("[data-f-result-name]"),
    fResultDesc: $("[data-f-result-desc]"),
    fImg: $("[data-f-img]"),
    fOpen: $("[data-f-open]"),
    fAdd: $("[data-f-add]"),
  };

  /* -----------------------------
   * Sticky offset sync (Announcement -> Header)
   * ----------------------------- */
  function syncAnnounceOffset() {
    const root = document.documentElement;
    const bar = els.announceBar;

    const announceHidden = !bar || bar.hasAttribute("hidden") || getComputedStyle(bar).display === "none";
    const announceH = announceHidden ? 0 : bar.getBoundingClientRect().height;
    root.style.setProperty("--announce-offset", `${Math.round(announceH)}px`);

    const headerEl = els.header;
    const headerHidden = !headerEl || headerEl.hasAttribute("hidden") || getComputedStyle(headerEl).display === "none";
    const headerH = headerHidden ? 0 : headerEl.getBoundingClientRect().height;
    root.style.setProperty("--header-h", `${Math.round(headerH)}px`);
  }

  function bindStickyOffsetSync() {
    let raf = 0;
    const onResize = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(syncAnnounceOffset);
    };
    window.addEventListener("resize", onResize, { passive: true });
  }

  function initHeaderScrollState() {
    const header = els.header;
    if (!header) return;

    const hero = document.querySelector(".hero--bg");
    let raf = 0;
    const update = () => {
      raf = 0;
      const announceH = (() => {
        const bar = els.announceBar;
        if (!bar) return 0;
        const hidden = bar.hasAttribute("hidden") || getComputedStyle(bar).display === "none";
        return hidden ? 0 : bar.getBoundingClientRect().height;
      })();

      const headerH = header.getBoundingClientRect().height;
      const threshold = announceH + headerH + 8;
      const scrolled = hero ? hero.getBoundingClientRect().bottom <= threshold : window.scrollY > 8;
      header.classList.toggle("is-scrolled", scrolled);
      els.announceBar?.classList.toggle("is-scrolled", scrolled);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
  }


  function init() {
    if (els.year) els.year.textContent = String(new Date().getFullYear());

    // Bind all images that have data-asset (logo, pack, hero, etc.)
    bindAssetImgs(document);

    // Announcement persistence
    if (els.announceBar && localStorage.getItem(ANNOUNCE_KEY) === "1") {
      els.announceBar.style.display = "none";
    }
    // Sync sticky offsets after initial visibility is resolved
    syncAnnounceOffset();
    bindStickyOffsetSync();

    els.announceClose?.addEventListener("click", () => {
      localStorage.setItem(ANNOUNCE_KEY, "1");
      if (els.announceBar) els.announceBar.style.display = "none";
      syncAnnounceOffset();
    });

    // Theme
    initTheme();
    initHeaderScrollState();

    // Smooth scroll
    $$("[data-scrollto]").forEach(a => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const id = a.getAttribute("data-scrollto");
        const t = id ? document.getElementById(id) : null;
        t?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    // Build products
    renderProducts();

    // Hero actions
    $$("[data-quick-add]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-quick-add");
        if (!id || !PRODUCT_MAP.has(id)) return;
        addToCart(id, 1);
        openCart();
        toast(`Aggiunto: ${PRODUCT_MAP.get(id).name}`);
      });
    });
    $$("[data-view]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-view");
        if (!id || !PRODUCT_MAP.has(id)) return;
        openProductModal(id);
      });
    });

    // Hero prices
    $$("[data-price]").forEach(el => {
      const id = el.getAttribute("data-price");
      const p = id ? PRODUCT_MAP.get(id) : null;
      if (p) el.textContent = formatEUR(p.price);
    });

    // Finder
    setupFinder();
    els.finderOpenBtn?.addEventListener("click", () => {
      document.getElementById("finder")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // Mobile nav
    els.mobileOpen?.addEventListener("click", toggleMobileNav);
    els.mobileCloseLinks.forEach(l => l.addEventListener("click", closeMobileNav));

    // Drawer / modals
    els.cartOpenBtns.forEach(b => b.addEventListener("click", openCart));
    els.cartClose?.addEventListener("click", closeCart);
    els.overlay?.addEventListener("click", () => {
      closeCart();
      closeProductModal();
      closeCheckout();
      closeGuide();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeCart();
        closeProductModal();
        closeCheckout();
        closeGuide();
        closeMobileNav();
      }
    });

    els.cartClear?.addEventListener("click", () => {
      cart.items = [];
      saveCart();
      renderCart();
      toast("Carrello svuotato.");
    });

    els.checkoutBtn?.addEventListener("click", () => {
      if (cart.items.length === 0) return toast("Il carrello è vuoto. Scegli Butter o Berry.");
      openCheckout();
    });

    els.productClose?.addEventListener("click", closeProductModal);
    els.pQtyDec?.addEventListener("click", () => setPdpQty((+els.pQty.value || 1) - 1));
    els.pQtyInc?.addEventListener("click", () => setPdpQty((+els.pQty.value || 1) + 1));
    els.pQty?.addEventListener("input", () => setPdpQty(+els.pQty.value || 1));
    els.pAdd?.addEventListener("click", () => {
      const id = els.pAdd.getAttribute("data-product-id");
      const qty = clamp(+els.pQty.value || 1, 1, 99);
      if (!id) return;
      addToCart(id, qty);
      toast(`Aggiunto: ${PRODUCT_MAP.get(id).name} ×${qty}`);
      closeProductModal();
      openCart();
    });

    els.checkoutClose?.addEventListener("click", closeCheckout);
    els.checkoutForm?.addEventListener("submit", onCheckoutSubmit);
    els.countrySelect?.addEventListener("change", () => renderCheckoutSummary());

    els.guideOpenBtns.forEach(b => b.addEventListener("click", openGuide));
    els.guideClose?.addEventListener("click", closeGuide);

    // Newsletter demo
    $("[data-nl]")?.addEventListener("submit", (e) => {
      e.preventDefault();
      toast("Grazie. Iscrizione ricevuta.");
      e.target.reset();
    });

    $("[data-legal]")?.addEventListener("click", (e) => {
      e.preventDefault();
      toast("Privacy e cookie: pagina da collegare.");
    });

    // Initial render
    renderCart();
    initHeroSlider();
    initReveal();
  }

  /* =========================
   * Products render (real images)
   * ========================= */
  function renderProducts() {
    if (!els.products) return;

    const visible = PRODUCTS;

	    els.products.innerHTML = visible.map(p => {
	      const coverImg = p.id === "butter" ? "butter_2" : p.images[0];
	      return `
	      <article class="card" data-product-card="${p.id}">
	        <div class="card__media media-stack" aria-hidden="true">
	          <img class="media-img" data-asset="${coverImg}" alt="">
	        </div>

	        <div class="card__body">
	          <div class="card__top">
	            <div>
              <h3 class="card__title">${escapeHTML(p.name)}</h3>
              <div class="card__meta">${escapeHTML(p.notes)}</div>
            </div>
            <span class="badge">${p.family === "warm" ? "Calda" : "Fredda"}</span>
          </div>

          <div class="card__top">
            <div class="card__price">${formatEUR(p.price)}</div>
            <div class="badge">${escapeHTML(p.size)} · ${escapeHTML(p.burn)}</div>
          </div>

          <div class="card__actions">
            <button class="btn btn--primary" type="button" data-add="${p.id}">Aggiungi</button>
            <button class="btn btn--ghost" type="button" data-view="${p.id}">Dettagli</button>
	          </div>
	        </div>
	      </article>
	    `;
	    }).join("");

    bindAssetImgs(els.products);

    $$("[data-add]", els.products).forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-add");
        if (!id) return;
        addToCart(id, 1);
        toast(`Aggiunto: ${PRODUCT_MAP.get(id).name}`);
      });
    });

    $$("[data-view]", els.products).forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-view");
        if (!id) return;
        openProductModal(id);
      });
    });
  }

  /* =========================
   * Cart persistence
   * ========================= */
  function loadCart() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? safeJSONParse(raw, null) : null;
    if (!parsed || !Array.isArray(parsed.items)) return { items: [] };
    const items = parsed.items
      .filter(it => it && typeof it.id === "string" && PRODUCT_MAP.has(it.id))
      .map(it => ({ id: it.id, qty: clamp(Number(it.qty) || 1, 1, 99) }));
    return { items };
  }

  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  function getCartCount() {
    return cart.items.reduce((acc, it) => acc + it.qty, 0);
  }

  function addToCart(id, qty) {
    if (!PRODUCT_MAP.has(id)) return;
    qty = clamp(Number(qty) || 1, 1, 99);

    const existing = cart.items.find(x => x.id === id);
    if (existing) existing.qty = clamp(existing.qty + qty, 1, 99);
    else cart.items.push({ id, qty });

    saveCart();
    renderCart();
  }

  function setQty(id, qty) {
    qty = clamp(Number(qty) || 1, 1, 99);
    const it = cart.items.find(x => x.id === id);
    if (!it) return;
    it.qty = qty;
    saveCart();
    renderCart();
  }

  function removeItem(id) {
    cart.items = cart.items.filter(x => x.id !== id);
    saveCart();
    renderCart();
  }

  function taxRateForCountry(code) {
    const m = { IT: 0.22, NL: 0.21, DE: 0.19, FR: 0.20, ES: 0.21, CH: 0.077 };
    return m[code] ?? 0.21;
  }

  function getCheckoutCountry() {
    return els.countrySelect?.value || "IT";
  }

  function calcTotals(countryCode) {
    const subtotal = round2(cart.items.reduce((sum, it) => {
      const p = PRODUCT_MAP.get(it.id);
      return sum + p.price * it.qty;
    }, 0));

    const shipping = subtotal >= 60 || subtotal === 0 ? 0 : 5.9;
    const rate = taxRateForCountry(countryCode || "IT");
    const tax = round2((subtotal + shipping) * rate);
    const total = round2(subtotal + shipping + tax);

    return { subtotal, shipping, tax, total };
  }

	  function renderCart() {
	    if (!els.cartItems) return;

    const count = getCartCount();
    if (els.cartCount) els.cartCount.textContent = String(count);

    if (cart.items.length === 0) {
      els.cartItems.innerHTML = `
        <div class="shipping-note" style="margin:0;">
          <div class="shipping-note__inner">
            <div class="shipping-note__title">Carrello vuoto</div>
            <div class="shipping-note__text">Aggiungi una candela per iniziare. Spedizione gratuita sopra €60.</div>
          </div>
        </div>
      `;
      setCrossSell(null);
      const t = calcTotals(getCheckoutCountry());
      updateTotalsUI(t);
      updateFreebar(t);
      updateCartHint(t);
      return;
    }

    els.cartItems.innerHTML = cart.items.map(it => {
      const p = PRODUCT_MAP.get(it.id);
      const line = round2(p.price * it.qty);
      return `
	        <div class="cart-item" data-cart-item="${it.id}">
	          <div class="cart-item__media media-stack" aria-hidden="true">
	            <img class="media-img" data-asset="${p.images[0]}" alt="">
	          </div>
	          <div>
            <div class="cart-item__top">
              <div>
                <div class="cart-item__name">${escapeHTML(p.name)}</div>
                <div class="cart-item__meta">${escapeHTML(p.size)} · ${escapeHTML(p.notes)}</div>
              </div>
              <div class="cart-item__price">${formatEUR(line)}</div>
            </div>

            <div class="cart-item__controls">
              <div class="qty" aria-label="Quantità ${escapeHTML(p.name)}">
                <button type="button" aria-label="Diminuisci" data-dec="${it.id}">−</button>
                <input type="number" min="1" max="99" value="${it.qty}" inputmode="numeric" aria-label="Quantità" data-qty="${it.id}">
                <button type="button" aria-label="Aumenta" data-inc="${it.id}">+</button>
              </div>
              <button class="link-btn" type="button" data-remove="${it.id}">Rimuovi</button>
            </div>
          </div>
        </div>
      `;
    }).join("");

    bindAssetImgs(els.cartItems);

    $$("[data-dec]", els.cartItems).forEach(b => b.addEventListener("click", () => {
      const id = b.getAttribute("data-dec");
      const it = cart.items.find(x => x.id === id);
      if (!it) return;
      setQty(id, it.qty - 1);
    }));
    $$("[data-inc]", els.cartItems).forEach(b => b.addEventListener("click", () => {
      const id = b.getAttribute("data-inc");
      const it = cart.items.find(x => x.id === id);
      if (!it) return;
      setQty(id, it.qty + 1);
    }));
    $$("[data-qty]", els.cartItems).forEach(inp => inp.addEventListener("input", () => {
      const id = inp.getAttribute("data-qty");
      setQty(id, Number(inp.value) || 1);
    }));
    $$("[data-remove]", els.cartItems).forEach(b => b.addEventListener("click", () => {
      const id = b.getAttribute("data-remove");
      if (!id) return;
      removeItem(id);
      toast("Rimosso dal carrello.");
    }));

    const t = calcTotals(getCheckoutCountry());
    updateTotalsUI(t);
    updateFreebar(t);
    updateCartHint(t);
    setCrossSell(pickCrossSell());
  }

  function updateTotalsUI({ subtotal, shipping, tax, total }) {
    if (els.subtotal) els.subtotal.textContent = formatEUR(subtotal);
    if (els.shipping) els.shipping.textContent = formatEUR(shipping);
    if (els.tax) els.tax.textContent = formatEUR(tax);
    if (els.total) els.total.textContent = formatEUR(total);
  }

  function updateCartHint({ subtotal }) {
    if (!els.cartHint) return;
    if (subtotal === 0) return (els.cartHint.textContent = "");
    if (subtotal >= 60) els.cartHint.textContent = "Spedizione gratuita attiva.";
    else els.cartHint.textContent = `Aggiungi ${formatEUR(round2(60 - subtotal))} per ottenere la spedizione gratuita.`;
  }

  function updateFreebar({ subtotal }) {
    const goal = 60;
    const pct = goal <= 0 ? 0 : clamp((subtotal / goal) * 100, 0, 100);
    if (els.freebarFill) els.freebarFill.style.width = `${pct}%`;
    if (!els.freebarText) return;

    if (subtotal <= 0) els.freebarText.textContent = `0%`;
    else if (subtotal >= goal) els.freebarText.textContent = `Attiva`;
    else els.freebarText.textContent = `${formatEUR(round2(goal - subtotal))} mancanti`;
  }

  function pickCrossSell() {
    const hasButter = cart.items.some(it => it.id === "butter");
    const hasBerry = cart.items.some(it => it.id === "berry");
    if (hasButter && !hasBerry) return "berry";
    if (hasBerry && !hasButter) return "butter";
    return null;
  }

  function setCrossSell(id) {
    if (!els.crossWrap) return;
    if (!id) {
      els.crossWrap.hidden = true;
      return;
    }
    const p = PRODUCT_MAP.get(id);
    if (!p) {
      els.crossWrap.hidden = true;
      return;
    }

    els.crossWrap.hidden = false;
    if (els.crossImg) els.crossImg.setAttribute("data-asset", p.images[0]);
    bindAssetImgs(els.crossWrap);

    if (els.crossName) els.crossName.textContent = p.name;
    if (els.crossMeta) els.crossMeta.textContent = `${p.size} · ${p.notes}`;
    if (els.crossPrice) els.crossPrice.textContent = formatEUR(p.price);

    els.crossAdd?.replaceWith(els.crossAdd.cloneNode(true));
    els.crossAdd = $("[data-cross-add]");

    els.crossAdd?.addEventListener("click", () => {
      addToCart(p.id, 1);
      toast(`Aggiunto: ${p.name}`);
      setCrossSell(pickCrossSell());
    });
  }

  /* =========================
   * Product modal gallery
   * ========================= */
  let currentPdpId = null;
  let currentPdpImg = null;

  function openProductModal(id) {
    const p = PRODUCT_MAP.get(id);
    if (!p || !els.productModal) return;

    currentPdpId = p.id;

    els.pTitle.textContent = p.name;
    els.pTag.textContent = p.tag;
    els.pDesc.textContent = p.desc;
    els.pWeight.textContent = p.size;
    els.pBurn.textContent = p.burn;
    els.pNotes.textContent = p.notes;
    els.pPrice.textContent = formatEUR(p.price);

    // main image default = image[0]
    currentPdpImg = p.images[0];
    els.pImg.setAttribute("data-asset", currentPdpImg);
    els.pImg.alt = `Candela ${p.name}`;

    // thumbs: 3 product images + pack
    els.pThumbs.innerHTML = [...p.images, p.pack].map((imgName, idx) => {
      const isActive = imgName === currentPdpImg;
      const label = imgName === p.pack ? "Pack" : `Foto ${idx + 1}`;
      return `
        <button class="thumb ${isActive ? "is-active" : ""}" type="button" data-thumb="${imgName}" aria-label="${label}">
          <img data-asset="${imgName}" alt="">
        </button>
      `;
    }).join("");

    bindAssetImgs(els.productModal);

    $$("[data-thumb]", els.pThumbs).forEach(btn => {
      btn.addEventListener("click", () => {
        const imgName = btn.getAttribute("data-thumb");
        if (!imgName) return;
        currentPdpImg = imgName;
        els.pImg.setAttribute("data-asset", imgName);
        setAssetImg(els.pImg, imgName);
        $$("[data-thumb]", els.pThumbs).forEach(b => b.classList.toggle("is-active", b === btn));
      });
    });

    els.pAdd.setAttribute("data-product-id", p.id);
    setPdpQty(1);

    setOverlay(true);
    els.productModal.hidden = false;
    trapFocus(els.productModal);
  }

  function closeProductModal() {
    if (!els.productModal) return;
    els.productModal.hidden = true;
    if (noModalOpen()) setOverlay(false);
    releaseFocusTrap();
  }

  function setPdpQty(v) {
    v = clamp(Number(v) || 1, 1, 99);
    if (els.pQty) els.pQty.value = String(v);
    if (els.pQtyDec) els.pQtyDec.disabled = v <= 1;
    if (els.pQtyInc) els.pQtyInc.disabled = v >= 99;
  }

  /* =========================
   * Checkout
   * ========================= */
  function renderCheckoutSummary() {
    if (!els.checkoutLines) return;

    els.checkoutLines.innerHTML = cart.items.map(it => {
      const p = PRODUCT_MAP.get(it.id);
      const line = round2(p.price * it.qty);
      return `
        <div class="sum-line">
          <div>
            <div class="sum-line__name">${escapeHTML(p.name)} ×${it.qty}</div>
            <div class="sum-line__meta">${escapeHTML(p.size)} · ${escapeHTML(p.notes)}</div>
          </div>
          <div class="sum-line__right">${formatEUR(line)}</div>
        </div>
      `;
    }).join("");

    const t = calcTotals(getCheckoutCountry());
    els.coSubtotal.textContent = formatEUR(t.subtotal);
    els.coShipping.textContent = formatEUR(t.shipping);
    els.coTax.textContent = formatEUR(t.tax);
    els.coTotal.textContent = formatEUR(t.total);

    updateTotalsUI(t);
    updateFreebar(t);
    updateCartHint(t);
  }

  function openCheckout() {
    if (!els.checkoutModal) return;
    renderCheckoutSummary();
    setOverlay(true);
    els.checkoutModal.hidden = false;
    trapFocus(els.checkoutModal);
  }

  function closeCheckout() {
    if (!els.checkoutModal) return;
    els.checkoutModal.hidden = true;
    if (noModalOpen()) setOverlay(false);
    releaseFocusTrap();
  }

  function onCheckoutSubmit(e) {
    e.preventDefault();

    if (cart.items.length === 0) {
      toast("Carrello vuoto: non puoi completare l’ordine.");
      closeCheckout();
      return;
    }

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    if (!data.email || !String(data.email).includes("@")) return toast("Email non valida.");
    if (!data.terms) return toast("Devi accettare i termini.");

    const orderId = `SC-${new Date().getFullYear()}-${uid().slice(0, 6).toUpperCase()}`;
    const totals = calcTotals(getCheckoutCountry());

    localStorage.setItem("sc_last_order_v1", JSON.stringify({
      orderId,
      createdAt: new Date().toISOString(),
      email: data.email,
      items: cart.items.map(it => ({ ...it })),
      totals,
    }));

    cart.items = [];
    saveCart();
    renderCart();
    closeCheckout();
    closeCart();

    toast(`Ordine registrato (simulazione). ID: ${orderId}. Totale: ${formatEUR(totals.total)}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    form.reset();
  }

  /* =========================
   * Drawer / overlay
   * ========================= */
  function setOverlay(on) {
    if (!els.overlay) return;
    els.overlay.hidden = !on;
  }

  function openCart() {
    if (!els.cartDrawer) return;
    setOverlay(true);
    els.cartDrawer.hidden = false;
    trapFocus(els.cartDrawer);
  }

  function closeCart() {
    if (!els.cartDrawer) return;
    els.cartDrawer.hidden = true;
    if (noModalOpen()) setOverlay(false);
    releaseFocusTrap();
  }

  function noModalOpen() {
    const a = els.cartDrawer && !els.cartDrawer.hidden;
    const b = els.productModal && !els.productModal.hidden;
    const c = els.checkoutModal && !els.checkoutModal.hidden;
    const d = els.guideModal && !els.guideModal.hidden;
    return !(a || b || c || d);
  }

  /* =========================
   * Guide modal
   * ========================= */
  function openGuide() {
    if (!els.guideModal) return;
    setOverlay(true);
    els.guideModal.hidden = false;
    trapFocus(els.guideModal);
  }

  function closeGuide() {
    if (!els.guideModal) return;
    els.guideModal.hidden = true;
    if (noModalOpen()) setOverlay(false);
    releaseFocusTrap();
  }

  /* =========================
   * Mobile nav
   * ========================= */
  function toggleMobileNav() {
    if (!els.mobileNav || !els.mobileOpen) return;
    const open = els.mobileNav.hidden;
    if (open) {
      els.mobileNav.hidden = false;
      els.mobileOpen.setAttribute("aria-expanded", "true");
    } else closeMobileNav();
  }

  function closeMobileNav() {
    if (!els.mobileNav || !els.mobileOpen) return;
    els.mobileNav.hidden = true;
    els.mobileOpen.setAttribute("aria-expanded", "false");
  }

  /* =========================
   * Toast
   * ========================= */
  let toastTimer = null;
  function toast(msg) {
    if (!els.toast) return;
    els.toast.textContent = msg;
    els.toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      els.toast.hidden = true;
      els.toast.textContent = "";
    }, 2400);
  }

  /* =========================
   * Focus trap
   * ========================= */
  let lastActive = null;
  let trapRoot = null;

  function trapFocus(root) {
    if (!root) return;
    lastActive = document.activeElement;
    trapRoot = root;

    const focusable = getFocusable(root);
    (focusable[0] || root).focus?.({ preventScroll: true });
    root.addEventListener("keydown", onTrapKeyDown);
  }

  function releaseFocusTrap() {
    if (!trapRoot) return;
    trapRoot.removeEventListener("keydown", onTrapKeyDown);
    trapRoot = null;
    lastActive?.focus?.({ preventScroll: true });
    lastActive = null;
  }

  function onTrapKeyDown(e) {
    if (e.key !== "Tab" || !trapRoot) return;

    const focusable = getFocusable(trapRoot);
    if (focusable.length === 0) return e.preventDefault();

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function getFocusable(root) {
    const sel = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ].join(",");
    return $$(sel, root).filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden";
    });
  }

  /* =========================
   * Theme
   * ========================= */
  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const initial =
      (saved === "light" || saved === "dark")
        ? saved
        : (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

    setTheme(initial);

    els.themeToggle?.addEventListener("click", () => {
      const cur = localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
      const next = cur === "dark" ? "light" : "dark";
      setTheme(next);
      toast(`Tema: ${next}`);
    });
  }


	  function setTheme(mode) {
	    const normalized = mode === "light" ? "light" : "dark";
	    localStorage.setItem(THEME_KEY, normalized);
	    const html = document.documentElement;
	    html.setAttribute("data-theme", normalized);
	    if (els.themeToggle) {
	      els.themeToggle.setAttribute("aria-pressed", normalized === "dark" ? "true" : "false");
	      els.themeToggle.setAttribute("aria-label", normalized === "dark" ? "Attiva tema chiaro" : "Attiva tema scuro");
	    }
	  }


  /* =========================
   * Finder
   * ========================= */
  const finderState = { mood: "calm", space: "home", pref: "warm" };

  function setupFinder() {
    if (!els.fMoodBtns.length || !els.fSpaceBtns.length || !els.fPrefBtns.length) return;

    bindSeg(els.fMoodBtns, "mood");
    bindSeg(els.fSpaceBtns, "space");
    bindSeg(els.fPrefBtns, "pref");

    els.fOpen?.addEventListener("click", () => {
      const id = pickFinderResult();
      openProductModal(id);
    });

    els.fAdd?.addEventListener("click", () => {
      const id = pickFinderResult();
      addToCart(id, 1);
      openCart();
      toast(`Aggiunto: ${PRODUCT_MAP.get(id).name}`);
    });

    updateFinderUI();
  }

  function bindSeg(btns, key) {
    btns.forEach(b => {
      b.addEventListener("click", () => {
        const val = b.getAttribute(`data-f-${key}`);
        if (!val) return;
        finderState[key] = val;
        btns.forEach(x => {
          const isActive = x.getAttribute(`data-f-${key}`) === val;
          x.classList.toggle("is-active", isActive);
          x.setAttribute("aria-pressed", String(isActive));
        });
        updateFinderUI();
      });
    });
  }

  function pickFinderResult() {
    if (finderState.pref === "cold") return "berry";
    if (finderState.space === "night") return "berry";
    if (finderState.mood === "bold") return "berry";
    return "butter";
  }

  function updateFinderUI() {
    const id = pickFinderResult();
    const p = PRODUCT_MAP.get(id);
    if (!p) return;

    els.fResultName.textContent = p.name;
    els.fResultDesc.textContent = p.desc;

    if (els.fImg) {
      els.fImg.setAttribute("data-asset", p.images[0]);
      setAssetImg(els.fImg, p.images[0]);
    }
  }

  /* =========================
   * Cross-sell wiring
   * ========================= */
  function setCrossSellIfNeeded() {
    setCrossSell(pickCrossSell());
  }

  /* =========================
   * Reveal
   * ========================= */
  

	  /* =========================
	   * Hero slider (hero_1..hero_7)
	   * ========================= */
  function initHeroSlider() {
    const wrap = document.querySelector("[data-hero]");
    if (!wrap) return;

    const slides = Array.from(wrap.querySelectorAll("[data-hero-slide]"));
    if (slides.length <= 1) return;

    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      slides.forEach((s, i) => s.classList.toggle("is-active", i === 0));
      return;
    }

    let idx = 0;
    const intervalMs = 3800; // ~3.8s: in range 3/4 secondi

    window.setInterval(() => {
      slides[idx].classList.remove("is-active");
      idx = (idx + 1) % slides.length;
      slides[idx].classList.add("is-active");
    }, intervalMs);
  }
function initReveal() {
    const nodes = $$("[data-reveal]");
    if (!("IntersectionObserver" in window) || nodes.length === 0) {
      nodes.forEach(n => n.classList.add("is-inview"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("is-inview");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    nodes.forEach(n => io.observe(n));
  }

  /* =========================
   * Boot
   * ========================= */
  init();
})();
