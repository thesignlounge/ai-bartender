
(() => {
  const intro = document.getElementById("cinematicIntro");
  if (!intro) return;

  document.body.classList.add("intro-active");
  let finished = false;
  let timer;

  const finishIntro = () => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    intro.classList.add("is-leaving");
    document.body.classList.remove("intro-active");

    window.setTimeout(() => {
      intro.remove();
    }, 1250);
  };

  intro.addEventListener("click", finishIntro, { once: true });
  intro.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " " || event.key === "Escape") {
      event.preventDefault();
      finishIntro();
    }
  });

  // About two seconds before the transition into the homepage.
  timer = window.setTimeout(finishIntro, 2000);
})();
