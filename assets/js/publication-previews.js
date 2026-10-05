(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const videos = document.querySelectorAll(".selected-publication-video");

  videos.forEach((video) => {
    const button = video.closest(".publication-media").querySelector(".publication-video-toggle");
    const icon = button.querySelector("i");
    const previewStart = Number(video.dataset.previewStart) || 0;
    let manuallyPaused = false;

    const seekToDemonstration = () => {
      if (video.currentTime < previewStart && video.duration > previewStart) video.currentTime = previewStart;
    };
    video.addEventListener("loadedmetadata", seekToDemonstration);
    video.addEventListener("timeupdate", seekToDemonstration);
    if (video.readyState >= 1) seekToDemonstration();

    const updateButton = () => {
      const playing = !video.paused;
      const label = playing ? "Pause teaser" : "Play teaser";
      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
      button.setAttribute("aria-pressed", String(playing));
      icon.className = playing ? "fa-solid fa-pause" : "fa-solid fa-play";
    };

    button.hidden = false;
    video.addEventListener("play", updateButton);
    video.addEventListener("pause", updateButton);
    button.addEventListener("click", () => {
      manuallyPaused = !video.paused;
      if (video.paused) video.play().catch(updateButton);
      else video.pause();
    });

    // Play teasers only while visible, unless the viewer has requested less motion.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !reducedMotion.matches && !manuallyPaused) video.play().catch(updateButton);
        else video.pause();
      },
      { threshold: 0.25 }
    );
    observer.observe(video);
    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches) video.pause();
    });
    updateButton();
  });
})();
