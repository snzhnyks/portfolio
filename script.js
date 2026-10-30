document.getElementById("year").textContent = new Date().getFullYear();

// Web-optimised media retains each original frame while keeping the page and
// its lightbox responsive. Convert legacy extension references before images
// begin loading so all content views use the published JPEG assets.
const webMediaPath = (path) => path?.replace(/\.(?:png|jpe?g)(?=($|[?#]))/i, ".jpg");

document.querySelectorAll("img[src]").forEach((image) => {
  const source = image.getAttribute("src");
  if (source?.startsWith("assets/")) image.setAttribute("src", webMediaPath(source));
});

document.querySelectorAll("[data-fullsrc]").forEach((element) => {
  const fullSource = element.getAttribute("data-fullsrc");
  if (fullSource?.startsWith("assets/")) element.setAttribute("data-fullsrc", webMediaPath(fullSource));
});

const openSplitDeck = async (link) => {
  if (link.dataset.loading === "true") return;

  const deckWindow = window.open("", "_blank");
  if (deckWindow) deckWindow.opener = null;

  const originalMarkup = link.innerHTML;
  link.dataset.loading = "true";
  link.setAttribute("aria-busy", "true");
  link.textContent = "Opening strategy deck…";

  try {
    const partPaths = link.dataset.deckParts.split(",");
    const partBuffers = await Promise.all(
      partPaths.map(async (path) => {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Could not load ${path}`);
        return response.arrayBuffer();
      }),
    );

    const objectUrl = URL.createObjectURL(new Blob(partBuffers, { type: "application/pdf" }));
    if (deckWindow) {
      deckWindow.location.href = objectUrl;
    } else {
      window.location.assign(objectUrl);
    }
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120000);
  } catch (error) {
    if (deckWindow) deckWindow.close();
    link.textContent = "Deck unavailable — try again";
    window.setTimeout(() => {
      link.innerHTML = originalMarkup;
    }, 2600);
  } finally {
    link.dataset.loading = "false";
    link.removeAttribute("aria-busy");
    if (link.textContent === "Opening strategy deck…") link.innerHTML = originalMarkup;
  }
};

// The case explorer copies its content into a dialog at runtime. Event delegation
// keeps the reconstructed Mana and Suenyo PDFs available on every visible deck link.
document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target.closest("a[data-deck-parts]") : null;
  if (!target) return;
  event.preventDefault();
  openSplitDeck(target);
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reducedMotion) {
  document.documentElement.classList.add("js");

  const stagedTextSelector = ".eyebrow, h2, h3, p, li, .case-number, .service-step, .package-label, .package-price";

  document.querySelectorAll("[data-reveal]").forEach((section) => {
    const textItems = [...section.querySelectorAll(stagedTextSelector)].filter(
      (item) => item.closest("[data-reveal]") === section,
    );

    textItems.forEach((item, index) => {
      item.classList.add("reveal-copy");
      item.style.setProperty("--reveal-delay", `${Math.min(index * 65, 585)}ms`);
    });
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          entry.target.querySelectorAll(".reveal-copy").forEach((item) => {
            if (item.closest("[data-reveal]") === entry.target) {
              item.classList.add("is-visible");
            }
          });
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -12%" },
  );

  document.querySelectorAll("[data-reveal]").forEach((element) => revealObserver.observe(element));

  // A reveal must never make copy unavailable. This protects the content if a
  // browser restores a scroll position before IntersectionObserver has fired.
  window.setTimeout(() => {
    document.querySelectorAll(".reveal-copy:not(.is-visible)").forEach((item) => {
      item.classList.add("is-visible");
    });
  }, 1200);

  if (window.matchMedia("(pointer: fine)").matches) {
    const cursorAura = document.querySelector(".cursor-aura");
    const cursorRing = document.querySelector(".cursor-ring");
    const cursorDot = document.querySelector(".cursor-dot");
    const caseCursorAura = document.querySelector(".case-explorer-cursor-aura");
    const caseCursorRing = document.querySelector(".case-explorer-cursor-ring");
    const caseCursorDot = document.querySelector(".case-explorer-cursor-dot");
    const orbit = document.querySelector(".brand-orbit");
    const hero = document.querySelector(".hero");
    const contactPanel = document.querySelector(".contact-panel");
    const contactMonogram = document.querySelector(".contact-monogram");
    let frame;
    let contactFrame;

    document.documentElement.classList.add("has-custom-cursor");

    let targetX = -100;
    let targetY = -100;
    let ringX = -100;
    let ringY = -100;
    let cursorFrame;

    const renderCursor = () => {
      ringX += (targetX - ringX) * .16;
      ringY += (targetY - ringY) * .16;
      cursorDot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
      cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      cursorAura.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      caseCursorDot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
      caseCursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      caseCursorAura.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;

      if (Math.abs(targetX - ringX) > .1 || Math.abs(targetY - ringY) > .1) {
        cursorFrame = requestAnimationFrame(renderCursor);
      } else {
        cursorFrame = undefined;
      }
    };

    window.addEventListener("pointermove", (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (!cursorFrame) cursorFrame = requestAnimationFrame(renderCursor);
    });

    document.querySelectorAll("a, button").forEach((element) => {
      element.addEventListener("pointerenter", () => {
        cursorRing.classList.add("is-interactive");
        cursorAura.classList.add("is-interactive");
        caseCursorRing.classList.add("is-interactive");
        caseCursorAura.classList.add("is-interactive");
      });
      element.addEventListener("pointerleave", () => {
        cursorRing.classList.remove("is-interactive");
        cursorAura.classList.remove("is-interactive");
        caseCursorRing.classList.remove("is-interactive");
        caseCursorAura.classList.remove("is-interactive");
      });
    });

    if (hero && orbit) {
      hero.addEventListener("pointermove", (event) => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const x = (event.clientX / window.innerWidth - 0.5) * 16;
          const y = (event.clientY / window.innerHeight - 0.5) * 14;
          orbit.style.setProperty("--parallax-x", `${x}px`);
          orbit.style.setProperty("--parallax-y", `${y}px`);
        });
      });

      hero.addEventListener("pointerleave", () => {
        orbit.style.setProperty("--parallax-x", "0px");
        orbit.style.setProperty("--parallax-y", "0px");
      });
    }

    if (contactPanel && contactMonogram) {
      contactPanel.addEventListener("pointermove", (event) => {
        const bounds = contactPanel.getBoundingClientRect();
        const relativeX = (event.clientX - bounds.left) / bounds.width - .5;
        const relativeY = (event.clientY - bounds.top) / bounds.height - .5;

        cancelAnimationFrame(contactFrame);
        contactFrame = requestAnimationFrame(() => {
          contactMonogram.style.setProperty("--monogram-x", `${relativeX * 18}px`);
          contactMonogram.style.setProperty("--monogram-y", `${relativeY * 14}px`);
          contactMonogram.style.setProperty("--monogram-tilt", `${relativeX * 5}deg`);
          contactMonogram.style.setProperty("--monogram-orbit", `${relativeX * 20 + relativeY * 10}deg`);
        });
      });

      contactPanel.addEventListener("pointerleave", () => {
        contactMonogram.style.setProperty("--monogram-x", "0px");
        contactMonogram.style.setProperty("--monogram-y", "0px");
        contactMonogram.style.setProperty("--monogram-tilt", "0deg");
        contactMonogram.style.setProperty("--monogram-orbit", "0deg");
      });
    }
  }
}

const progressIndicator = document.querySelector(".scroll-progress span");

const updateScrollProgress = () => {
  if (!progressIndicator) return;
  const availableScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = availableScroll > 0 ? Math.min(window.scrollY / availableScroll, 1) : 0;
  progressIndicator.style.transform = `scaleX(${progress})`;
};

updateScrollProgress();
window.addEventListener("scroll", updateScrollProgress, { passive: true });
window.addEventListener("resize", updateScrollProgress);

const caseLinks = [...document.querySelectorAll("[data-case-nav]")];
const caseStudies = [...document.querySelectorAll("[data-case]")];
const caseImageSelector = ".case-profile-header img, .case-profile-grids img, .case-content-showcase img, .case-explorer-media img";

const makeCaseImageInteractive = (image) => {
  image.setAttribute("tabindex", "0");
  image.setAttribute("role", "button");
  image.setAttribute("aria-label", `Open enlarged image: ${image.alt || "Project image"}`);
};

if (caseLinks.length && caseStudies.length && "IntersectionObserver" in window) {
  const setActiveCase = (id) => {
    caseLinks.forEach((link) => {
      const active = link.dataset.caseNav === id;
      if (active) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  };

  const caseObserver = new IntersectionObserver(
    (entries) => {
      const activeEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (activeEntry) setActiveCase(activeEntry.target.dataset.case);
    },
    { rootMargin: "-22% 0px -58%", threshold: [0.01, 0.25, 0.55] },
  );

  caseStudies.forEach((study) => caseObserver.observe(study));
}

const caseExplorer = document.querySelector(".case-explorer");

const carouselCards = [...document.querySelectorAll(".case-carousel-card")];
const carouselHitAreas = [...document.querySelectorAll(".case-carousel-hit-areas button")];
const carouselStage = document.querySelector(".case-carousel-stage");

const setActiveCarouselCard = (index) => {
  carouselCards.forEach((card, cardIndex) => {
    card.classList.toggle("is-active", cardIndex === index);
  });
};

const getCarouselCardAtPoint = (clientX, clientY) => {
  const candidates = carouselCards
    .map((card, index) => {
      const rect = card.getBoundingClientRect();
      const padding = 18;
      const inside = clientX >= rect.left - padding && clientX <= rect.right + padding
        && clientY >= rect.top - padding && clientY <= rect.bottom + padding;
      const distance = Math.hypot(clientX - (rect.left + rect.width / 2), clientY - (rect.top + rect.height / 2));
      return { index, inside, distance };
    })
    .filter((candidate) => candidate.inside)
    .sort((a, b) => a.distance - b.distance);

  return candidates[0]?.index ?? -1;
};

if (carouselCards.length && carouselHitAreas.length) {
  carouselHitAreas.forEach((area, index) => {
    area.addEventListener("focus", () => setActiveCarouselCard(index));
    area.addEventListener("blur", () => setActiveCarouselCard(-1));
  });
}

if (carouselStage && carouselCards.length) {
  carouselStage.addEventListener("pointermove", (event) => {
    setActiveCarouselCard(getCarouselCardAtPoint(event.clientX, event.clientY));
  });

  carouselStage.addEventListener("pointerleave", () => setActiveCarouselCard(-1));
}

if (caseExplorer && caseStudies.length) {
  const explorerClose = caseExplorer.querySelector(".case-explorer-close");
  const explorerTitle = caseExplorer.querySelector("#case-explorer-title");
  const explorerNumber = caseExplorer.querySelector(".case-explorer-number");
  const explorerPosition = caseExplorer.querySelector(".case-explorer-position");
  const explorerType = caseExplorer.querySelector(".case-explorer-type");
  const explorerChallenge = caseExplorer.querySelector(".case-explorer-challenge > div");
  const explorerShift = caseExplorer.querySelector(".case-explorer-shift > div");
  const explorerLogic = caseExplorer.querySelector(".case-explorer-logic ol");
  const explorerImage = caseExplorer.querySelector(".case-explorer-media img");
  const explorerCaption = caseExplorer.querySelector(".case-explorer-media figcaption");
  const explorerDeck = caseExplorer.querySelector(".case-explorer-read");
  const explorerFull = caseExplorer.querySelector(".case-explorer-full");
  const explorerDirections = [...caseExplorer.querySelectorAll("[data-case-direction]")];
  const orbitCards = [...caseExplorer.querySelectorAll(".case-orbit-card")];
  const explorerThumbs = [...caseExplorer.querySelectorAll(".case-explorer-thumb")];
  let activeCaseIndex = 0;
  let activeTrigger;
  let explorerIntroTimer;

  const getCaseIndex = (caseId) => caseStudies.findIndex((study) => study.dataset.case === caseId);

  const showExplorerDialog = () => {
    if (caseExplorer.open) return;

    try {
      if (typeof caseExplorer.showModal === "function") caseExplorer.showModal();
      else caseExplorer.setAttribute("open", "");
    } catch (error) {
      // Retain a usable project window if a browser rejects the native dialog call.
      caseExplorer.setAttribute("open", "");
    }
  };

  const prepareOrbit = (activeIndex) => {
    orbitCards.forEach((card, index) => {
      const study = caseStudies[index];
      const proposedGrid = study?.querySelector(".case-profile-grids figure:last-child img");
      const orbitImage = card.querySelector("img");
      const orbitCaption = card.querySelector("figcaption");
      if (proposedGrid && orbitImage) {
        orbitImage.src = proposedGrid.currentSrc || proposedGrid.src;
        orbitImage.alt = "";
      }
      if (orbitCaption) orbitCaption.textContent = String(index + 1).padStart(2, "0");
    });

  };

  const fillParagraphs = (container, paragraphs) => {
    container.replaceChildren();
    paragraphs.forEach((copy) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = copy;
      container.append(paragraph);
    });
  };

  const setExplorerMedia = (source, alt, caption) => {
    if (!source) return;
    caseExplorer.classList.add("is-switching");
    explorerImage.src = source;
    explorerImage.alt = alt;
    explorerCaption.textContent = caption;
    window.setTimeout(() => caseExplorer.classList.remove("is-switching"), reducedMotion ? 0 : 160);
  };

  const resetExplorerScroll = () => {
    // Each selected project begins from its first screen, rather than inheriting
    // the reading position of the case shown immediately before it.
    caseExplorer.scrollTop = 0;
    caseExplorer.scrollLeft = 0;
  };

  const populateExplorer = (index) => {
    resetExplorerScroll();
    activeCaseIndex = (index + caseStudies.length) % caseStudies.length;
    const study = caseStudies[activeCaseIndex];
    const title = study.querySelector(".case-study-heading h3");
    const number = study.querySelector(".case-number")?.textContent.trim() || String(activeCaseIndex + 1).padStart(2, "0");
    const type = study.querySelector(".case-type")?.textContent.trim() || "Selected strategic review";
    const friction = [...study.querySelectorAll(".state-before p")].map((paragraph) => paragraph.textContent.trim());
    const shift = [...study.querySelectorAll(".state-after p")].map((paragraph) => paragraph.textContent.trim());
    const reelSteps = [...study.querySelectorAll(".case-reel-steps li")].map((step) => ({
      title: step.querySelector("strong")?.textContent.trim() || "Step",
      copy: step.querySelector("p")?.textContent.trim() || "",
    }));
    const deck = study.querySelector(".case-links a[href]");
    const proposedGrid = study.querySelector(".case-profile-grids figure:last-child img");
    const contentImages = [...study.querySelectorAll(".content-cover-grid img")];
    const fullSectionClasses = ["case-stage", "case-reel-path", "case-profile-comparison", "case-content-showcase", "case-rationale"];

    explorerNumber.textContent = number;
    explorerPosition.textContent = number;
    explorerType.textContent = type;
    explorerTitle.innerHTML = title ? title.innerHTML : "Case study";
    fillParagraphs(explorerChallenge, friction.length ? friction : ["A clear guest decision path starts with one specific truth."]);
    fillParagraphs(explorerShift, shift.length ? shift : ["A focused content system creates a clearer reason to enquire."]);
    explorerLogic.replaceChildren();
    reelSteps.forEach((step) => {
      const item = document.createElement("li");
      const label = document.createElement("strong");
      const copy = document.createElement("span");
      label.textContent = step.title;
      copy.textContent = step.copy;
      item.append(label, copy);
      explorerLogic.append(item);
    });
    explorerDeck.href = deck?.getAttribute("href") || "#";
    if (deck?.dataset.deckParts) {
      explorerDeck.dataset.deckParts = deck.dataset.deckParts;
    } else {
      delete explorerDeck.dataset.deckParts;
    }
    const gridSource = proposedGrid?.currentSrc || proposedGrid?.src;
    setExplorerMedia(gridSource, proposedGrid?.alt || `${explorerTitle.textContent.trim()} proposed content direction`, "Proposed content direction");
    makeCaseImageInteractive(explorerImage);

    explorerFull.replaceChildren();
    fullSectionClasses.forEach((className) => {
      const sourceSection = study.querySelector(`.${className}`);
      if (!sourceSection) return;
      const section = sourceSection.cloneNode(true);
      section.querySelectorAll(".case-explorer-trigger").forEach((trigger) => trigger.remove());
      section.querySelectorAll(".reveal-copy").forEach((item) => {
        item.classList.remove("reveal-copy", "is-visible");
        item.style.removeProperty("--reveal-delay");
      });
      section.querySelectorAll(caseImageSelector).forEach(makeCaseImageInteractive);
      explorerFull.append(section);
    });

    explorerThumbs.forEach((thumb, thumbnailIndex) => {
      const sourceImage = contentImages[thumbnailIndex];
      const thumbnailImage = thumb.querySelector("img");
      const source = sourceImage?.dataset.fullsrc || sourceImage?.currentSrc || sourceImage?.src || "";
      thumbnailImage.src = source;
      thumbnailImage.alt = sourceImage?.alt || "";
      thumb.dataset.source = source;
      thumb.dataset.alt = sourceImage?.alt || "";
      thumb.dataset.caption = sourceImage?.alt || "Selected content cover";
      thumb.hidden = !source;
    });
  };

  const openCaseExplorer = (caseId, trigger) => {
    const index = getCaseIndex(caseId);
    if (index < 0) return;
    activeTrigger = trigger || document.activeElement;
    window.clearTimeout(explorerIntroTimer);
    caseExplorer.classList.add("is-intro");
    caseExplorer.style.setProperty("--orbit-angle", `${index * -90 + 180}deg`);
    showExplorerDialog();

    try {
      populateExplorer(index);
      prepareOrbit(index);
    } catch (error) {
      console.error("Unable to populate the selected case.", error);
      caseExplorer.classList.remove("is-intro");
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        caseExplorer.style.setProperty("--orbit-angle", `${index * -90}deg`);
      });
    });
    explorerIntroTimer = window.setTimeout(() => {
      caseExplorer.classList.remove("is-intro");
      explorerClose.focus();
    }, reducedMotion ? 0 : 900);
  };

  caseLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openCaseExplorer(link.dataset.caseNav, link);
    });
  });

  // Bind directly to every case control. The first and last cards have a more
  // pronounced 3D transform, so relying on one delegated click target can make
  // their hit areas inconsistent in some browsers.
  document.querySelectorAll("[data-open-case]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openCaseExplorer(trigger.dataset.openCase, trigger);
    });
  });

  explorerDirections.forEach((button) => {
    button.addEventListener("click", () => {
      populateExplorer(activeCaseIndex + (button.dataset.caseDirection === "next" ? 1 : -1));
    });
  });

  explorerThumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      setExplorerMedia(thumb.dataset.source, thumb.dataset.alt, thumb.dataset.caption);
    });
  });

  explorerClose.addEventListener("click", () => caseExplorer.close());
  caseExplorer.addEventListener("click", (event) => {
    if (event.target === caseExplorer) caseExplorer.close();
  });
  caseExplorer.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") populateExplorer(activeCaseIndex + 1);
    if (event.key === "ArrowLeft") populateExplorer(activeCaseIndex - 1);
  });
  caseExplorer.addEventListener("close", () => {
    window.clearTimeout(explorerIntroTimer);
    caseExplorer.classList.remove("is-intro");
    if (activeTrigger && typeof activeTrigger.focus === "function") activeTrigger.focus();
  });
}

const contactForm = document.querySelector("[data-contact-form]");

if (contactForm) {
  const contactStatus = contactForm.querySelector(".contact-form-status");

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(contactForm);
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();
    const subject = "Hospitality Instagram enquiry";
    const body = `Email: ${email}\n\n${message}`;
    const mailto = `mailto:forpomelliwork@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    if (contactStatus) contactStatus.textContent = "Opening your email app with your brief…";
    window.location.href = mailto;
  });
}

const lightbox = document.querySelector(".image-lightbox");

if (lightbox) {
  const lightboxImage = lightbox.querySelector("img");
  const lightboxCaption = lightbox.querySelector("figcaption");
  const closeButton = lightbox.querySelector(".lightbox-close");
  let lightboxTrigger;

  document.querySelectorAll(caseImageSelector).forEach(makeCaseImageInteractive);

  const openLightbox = (image) => {
    lightboxTrigger = image;
    lightboxImage.src = image.dataset.fullsrc || image.currentSrc || image.src;
    lightboxImage.alt = image.alt;
    lightboxCaption.textContent = image.alt || "Project image";

    if (!lightbox.open) {
      if (typeof lightbox.showModal === "function") lightbox.showModal();
      else lightbox.setAttribute("open", "");
    }
    closeButton.focus();
  };

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const image = event.target.closest(caseImageSelector);
    if (!image) return;
    openLightbox(image);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (!(event.target instanceof Element) || !event.target.matches(caseImageSelector)) return;
    event.preventDefault();
    openLightbox(event.target);
  });

  closeButton.addEventListener("click", () => lightbox.close());
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener("close", () => {
    lightboxImage.removeAttribute("src");
    lightboxImage.alt = "";
    lightboxCaption.textContent = "";
    if (lightboxTrigger && typeof lightboxTrigger.focus === "function") lightboxTrigger.focus();
    lightboxTrigger = undefined;
  });
}
