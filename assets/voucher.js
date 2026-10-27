/* Shared voucher generator. Each studio page calls Voucher.start(brand) with its own
   config and draw() function, so a page never contains the other studio's data. */
(() => {
  "use strict";

  /* ---------------- Small helpers ---------------- */
  const $ = (id) => document.getElementById(id);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } }
  };
  const pad = (n, l = 2) => String(n).padStart(l, "0");
  const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const plDate = (iso) => { if (!iso) return ""; const [y, m, d] = iso.split("-"); return `${d}.${m}.${y}`; };
  function addMonths(iso, months) {
    const [y, m, d] = iso.split("-").map(Number);
    const target = new Date(y, m - 1 + months, 1);
    const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    target.setDate(Math.min(d, last));
    return isoDate(target);
  }
  function toast(msg) {
    const t = $("toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 3200);
  }
  function slug(s) {
    return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/Ł/g, "L")
      .replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  }

  function start(b) {
    const key = b.key;
    const year = new Date().getFullYear();

    function nextNumber() {
      const last = store.get(`bon.last.${key}.${year}`, 0);
      return `${b.prefix}-${year}-${pad(last + 1, 3)}`;
    }
    function rememberNumber(number) {
      const m = number.match(/-(\d{4})-(\d+)$/);
      if (!m || Number(m[1]) !== year) return;
      const k = `bon.last.${key}.${year}`;
      store.set(k, Math.max(store.get(k, 0), Number(m[2])));
    }

    const values = () => {
      // a bare number ("500") is an amount voucher - show it as "500 zł"
      let item = $("item").value.trim();
      if (/^\d[\d\s]*$/.test(item)) item += " zł";
      return {
        number: $("number").value.trim(),
        name: $("name").value.trim(),
        item,
        isAmount: /^\d[\d\s]*(zł|pln)$/i.test(item),
        issued: $("issued").value,
        valid: $("valid").value,
        validText: plDate($("valid").value)
      };
    };

    /* ---------------- Canvas drawing helpers ---------------- */
    const canvas = $("voucher");
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;

    // letter-spaced text, drawn glyph by glyph (ctx.letterSpacing is not universal yet)
    function spaced(text, x, y, spacing, align = "left") {
      const chars = [...text];
      const widths = chars.map((c) => ctx.measureText(c).width);
      const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
      let cx = align === "right" ? x - total : align === "center" ? x - total / 2 : x;
      const prev = ctx.textAlign; ctx.textAlign = "left";
      chars.forEach((c, i) => { ctx.fillText(c, cx, y); cx += widths[i] + spacing; });
      ctx.textAlign = prev;
      return total;
    }
    // largest font size (<= max) that keeps text within maxWidth
    function fit(text, fontFn, max, min, maxWidth) {
      let size = max;
      ctx.font = fontFn(size);
      while (size > min && ctx.measureText(text).width > maxWidth) { size -= 2; ctx.font = fontFn(size); }
      return size;
    }
    // wrap into at most `lines` lines, shrinking font until it fits
    function wrapFit(text, fontFn, max, min, maxWidth, lines) {
      for (let size = max; size >= min; size -= 2) {
        ctx.font = fontFn(size);
        const words = text.split(/\s+/); const out = []; let line = "";
        for (const w of words) {
          const test = line ? line + " " + w : w;
          if (ctx.measureText(test).width <= maxWidth || !line) line = test; else { out.push(line); line = w; }
        }
        if (line) out.push(line);
        if (out.length <= lines && out.every((l) => ctx.measureText(l).width <= maxWidth)) return { size, lines: out };
      }
      ctx.font = fontFn(min);
      return { size: min, lines: [text] };
    }
    function diagonalGradient(angleDeg, stops) {
      const a = (angleDeg - 90) * Math.PI / 180;
      const len = Math.abs(W * Math.cos(a)) + Math.abs(H * Math.sin(a));
      const cx = W / 2, cy = H / 2, dx = Math.cos(a) * len / 2, dy = Math.sin(a) * len / 2;
      const g = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
      stops.forEach(([p, c]) => g.addColorStop(p, c));
      return g;
    }
    function loadImage(src) {
      return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
    }

    const assets = {};
    const h = { ctx, W, H, spaced, fit, wrapFit, diagonalGradient, loadImage, assets };

    function render() {
      ctx.clearRect(0, 0, W, H);
      b.draw(values(), h);
    }

    /* ---------------- Export ---------------- */
    const toBlob = (type, q) => new Promise((res) => canvas.toBlob(res, type, q));
    function fileName() {
      const v = values();
      return `bon-${b.fileSlug}-${slug(v.number || "bez-numeru")}${v.name ? "-" + slug(v.name) : ""}.jpg`;
    }
    function validate() {
      const v = values();
      if (!v.number) { $("number").focus(); toast("Wpisz numer bonu."); return null; }
      if (!v.name) { $("name").focus(); toast("Wpisz imię i nazwisko osoby obdarowanej."); return null; }
      return v;
    }
    function logIssued(v) {
      rememberNumber(v.number);
      const list = store.get(`bon.history.${key}`, []).filter((x) => x.number !== v.number);
      list.unshift({ number: v.number, name: v.name, item: v.item, valid: v.validText });
      store.set(`bon.history.${key}`, list.slice(0, 50));
      renderHistory();
    }
    function renderHistory() {
      const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
      const list = store.get(`bon.history.${key}`, []);
      $("historyBody").innerHTML = list.length
        ? list.map((x) => `<tr><td>${esc(x.number)}</td><td>${esc(x.name)}</td><td>${esc(x.item)}</td><td>${esc(x.valid)}</td></tr>`).join("")
        : `<tr><td colspan="4" style="color:var(--muted)">Brak - bony pojawią się tu po pobraniu lub wysłaniu.</td></tr>`;
    }
    async function download(v) {
      const blob = await toBlob("image/jpeg", 0.93);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = fileName();
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      logIssued(v);
    }

    $("download").addEventListener("click", async () => {
      const v = validate(); if (!v) return;
      await download(v); toast("Bon pobrany jako JPEG.");
    });

    $("share").addEventListener("click", async () => {
      const v = validate(); if (!v) return;
      const blob = await toBlob("image/jpeg", 0.93);
      const file = new File([blob], fileName(), { type: "image/jpeg" });
      // Phones (and some desktops): native share sheet with the JPEG attached - WhatsApp, Messenger, Mail, Gmail…
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: b.subject(v), text: b.message(v) });
          logIssued(v); toast("Bon udostępniony.");
        } catch (e) { if (e.name !== "AbortError") toast("Nie udało się udostępnić - spróbuj pobrać JPEG."); }
        return;
      }
      // Desktop fallback: download the file, copy the image, open a pre-filled message
      await download(v);
      try {
        const png = await toBlob("image/png");
        await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
      } catch { /* clipboard images not supported here - the downloaded file still works */ }
      $("sendBox").hidden = false;
      $("sendBox").scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    $("mailBtn").addEventListener("click", () => {
      const v = values();
      location.href = `mailto:${encodeURIComponent($("email").value.trim())}?subject=${encodeURIComponent(b.subject(v))}&body=${encodeURIComponent(b.message(v))}`;
    });
    $("waBtn").addEventListener("click", () => {
      window.open(`https://wa.me/?text=${encodeURIComponent(b.message(values()))}`, "_blank", "noopener");
    });
    $("copyText").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(b.message(values())); toast("Treść wiadomości skopiowana."); }
      catch { toast("Nie udało się skopiować."); }
    });

    /* ---------------- Wiring ---------------- */
    $("nextNumber").addEventListener("click", () => { $("number").value = nextNumber(); render(); });
    ["number", "name", "item", "valid"].forEach((id) => $(id).addEventListener("input", render));
    $("issued").addEventListener("input", () => {
      if ($("issued").value) $("valid").value = addMonths($("issued").value, b.validityMonths);
      render();
    });

    (async function init() {
      $("itemLabel").textContent = b.itemLabel;
      $("itemList").innerHTML = b.items.map((i) => `<option value="${i.replace(/"/g, "&quot;")}">`).join("");
      $("validHint").textContent = `Ważność liczona automatycznie: ${b.validityMonths} miesięcy od daty zakupu. Możesz ją zmienić ręcznie.`;
      $("issued").value = isoDate(new Date());
      $("valid").value = addMonths($("issued").value, b.validityMonths);
      $("number").value = nextNumber();
      render();
      renderHistory();
      // wait for the brand fonts (incl. Polish glyphs) and decorative assets, then redraw
      const sample = "ĄąĆćĘęŁłŃńÓóŚśŹźŻż Aa";
      await Promise.allSettled([...b.fonts.map((f) => document.fonts.load(f, sample)), b.prepare(h)]);
      render();
    })();
  }

  window.Voucher = { start };
})();
