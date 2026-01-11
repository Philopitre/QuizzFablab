// share.js
export function getShareUrl() {
  return window.location.href.split("#")[0];
}

export function copyLinkFeedback(btn) {
  const url = getShareUrl();

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      const original = btn.innerHTML;
      btn.innerHTML = "✅ Lien copié";
      btn.style.background = "var(--success)";
      setTimeout(() => {
        btn.innerHTML = original;
        btn.style.background = "var(--primary)";
      }, 1800);
    }).catch(() => {
      alert(`Copiez ce lien pour partager le quiz :\n\n${url}`);
    });
  } else {
    alert(`Copiez ce lien pour partager le quiz :\n\n${url}`);
  }
}

export async function shareOnFacebookOrFallback(copyBtn) {
  const url = getShareUrl();

  // 1) Web Share API (mobile)
  if (navigator.share) {
    try {
      await navigator.share({
        title: "Quiz FabLabs",
        text: "Vrai ou Faux : découvrez les FabLabs !",
        url
      });
      return;
    } catch {
      // annulé/refusé -> on continue
    }
  }

  // 2) Facebook sharer
  const fbShare = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const win = window.open(fbShare, "_blank", "noopener,noreferrer,width=600,height=520");

  // 3) Pop-up bloquée -> fallback copie
  if (!win) copyLinkFeedback(copyBtn);
}
