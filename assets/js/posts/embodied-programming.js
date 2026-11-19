/* Interactive figures for the post "Embodied Programming Through Vision".
   Plain ES5 on purpose: the site's minifier runs on every script. */
(function () {
  "use strict";

  var REDUCED = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  function $(sel, el) {
    return (el || document).querySelector(sel);
  }

  function $$(sel, el) {
    return Array.prototype.slice.call((el || document).querySelectorAll(sel));
  }

  function later(fn, ms, bag) {
    var id = window.setTimeout(fn, REDUCED ? Math.min(ms, 40) : ms);
    if (bag) bag.push(id);
    return id;
  }

  function clearAll(bag) {
    while (bag.length) window.clearTimeout(bag.pop());
  }

  function onVisible(el, enter, leave, threshold) {
    if (!("IntersectionObserver" in window)) {
      enter();
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) enter();
          else if (leave) leave();
        });
      },
      { threshold: threshold === undefined ? 0.4 : threshold }
    );
    io.observe(el);
  }

  function play(v, from) {
    if (!v) return;
    try {
      if (from !== undefined) v.currentTime = from;
    } catch (e) {
      /* not seekable yet */
    }
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }

  function press(buttons, active) {
    buttons.forEach(function (b) {
      b.setAttribute("aria-pressed", b === active ? "true" : "false");
    });
  }

  function cells(box, n) {
    box.innerHTML = "";
    var out = [];
    for (var i = 0; i < n; i++) {
      var c = document.createElement("i");
      box.appendChild(c);
      out.push(c);
    }
    return out;
  }

  /* ------------------------------------------------------------------ slide builds
     Click states of a slide, stacked. Plays once when it scrolls into view, then waits for clicks. */
  function initStepper(fig) {
    var caps = $$(".ep-captions > li", fig).map(function (li) {
      return li.innerHTML;
    });
    // layers: the stacked click-state images of a slide, or the tiles of a reveal gallery
    var imgs = $$(".ep-stack > img, .ep-reveal > .ep-tile", fig);
    var n = Math.max(caps.length, imgs.length);
    var dots = $(".ep-dots", fig);
    var prev = $(".ep-prev", fig);
    var next = $(".ep-next", fig);
    var playBtn = $(".ep-play", fig);
    var text = $(".ep-step__text", fig);
    var num = $(".ep-step__n", fig);
    var stage = $(".ep-stack, .ep-reveal", fig);
    var k = 0;
    var timers = [];
    var auto = !REDUCED; // rolls out by itself, on a loop, while it is on screen
    var visible = false;
    var dotEls = [];

    function show(i) {
      k = Math.max(0, Math.min(n - 1, i));
      imgs.forEach(function (im, j) {
        im.classList.toggle("is-on", j <= k);
        im.classList.toggle("is-cur", j === k);
      });
      dotEls.forEach(function (d, j) {
        d.classList.toggle("is-on", j === k);
        d.classList.toggle("is-done", j < k);
      });
      text.innerHTML = caps[k] || "";
      num.textContent = k + 1 + " / " + n;
      prev.disabled = k === 0;
      next.disabled = k === n - 1;
    }

    function setAuto(on) {
      auto = on;
      clearAll(timers);
      playBtn.textContent = on ? "❚❚" : "▶";
      playBtn.setAttribute("aria-label", on ? "Pause the animation" : "Play the animation");
      playBtn.setAttribute("aria-pressed", on ? "true" : "false");
      fig.classList.toggle("is-auto", on);
      if (on && visible) schedule();
    }

    function schedule() {
      clearAll(timers);
      if (!auto || !visible) return;
      var last = k >= n - 1;
      var ms = last ? 3600 : Math.max(1800, Math.min(4200, 1100 + 42 * (text.textContent || "").length));
      later(
        function () {
          if (!auto || !visible) return;
          show(last ? 0 : k + 1);
          schedule();
        },
        ms,
        timers
      );
    }

    // any manual step pauses the rollout; the play button resumes it
    function manual(i) {
      setAuto(false);
      show(i);
    }

    for (var i = 0; i < n; i++) {
      (function (i) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "ep-dot";
        b.setAttribute("aria-label", "Step " + (i + 1) + " of " + n);
        b.addEventListener("click", function (e) {
          e.stopPropagation();
          manual(i);
        });
        dots.appendChild(b);
        dotEls.push(b);
      })(i);
    }

    next.addEventListener("click", function (e) {
      e.stopPropagation();
      manual(k + 1);
    });
    prev.addEventListener("click", function (e) {
      e.stopPropagation();
      manual(k - 1);
    });
    playBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (!auto && k >= n - 1) show(0);
      setAuto(!auto);
    });
    stage.addEventListener("click", function () {
      manual(k >= n - 1 ? 0 : k + 1);
    });
    fig.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        manual(k + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        manual(k - 1);
      } else if (e.key === " " && e.target === fig) {
        e.preventDefault();
        setAuto(!auto);
      }
    });

    fig.classList.add("is-ready");
    show(REDUCED ? n - 1 : 0);
    setAuto(auto);
    onVisible(
      fig,
      function () {
        if (visible) return;
        visible = true;
        schedule();
      },
      function () {
        visible = false;
        clearAll(timers);
      },
      0.3
    );
  }

  /* ------------------------------------------------------------------ action slots vs. effects in the world */
  var BODIES = {
    arm: {
      name: "Articulated arm",
      cmd: "6 motor commands",
      n: 6,
      fill: [0, 1, 2, 3, 4, 5],
      verdict: "It fits: 6 arm-joint slots are used. The other 18 are padding.",
      out: "Its own body program outputs 6 motor commands.",
    },
    panda: {
      name: "Panda arm",
      cmd: "end-effector and gripper commands",
      n: 7,
      fill: [7, 10, 11, 12, 13, 14, 15],
      verdict: "It fits: 7 slots are used. The other 17 are padding.",
      out: "Its own body program outputs 7 end-effector and gripper commands.",
    },
    allegro: {
      name: "Allegro hand",
      cmd: "16 joint commands",
      n: 16,
      fill: null,
      stamp: "16 hand joints: no slot",
      verdict: "It does not fit: the placeholder has no slots for 16 hand joints.",
      out: "Its own body program outputs 16 joint commands.",
    },
    pneumatic: {
      name: "Pneumatic hand",
      cmd: "15 pressure commands",
      n: 15,
      fill: null,
      stamp: "15 pressure channels: no slot",
      verdict: "It does not fit: the placeholder has no slots for air pressures.",
      out: "Its own body program outputs 15 pressure commands.",
    },
  };
  var BODY_ORDER = ["arm", "panda", "allegro", "pneumatic"];

  function initSlots(fig) {
    var chips = $$(".ep-chip[data-body]", fig);
    var cards = $$(".ep-body[data-body]", fig);
    var slots = $$(".ep-slotrow i", fig);
    var row = $(".ep-slotrow", fig);
    var stamp = $(".ep-stamp", fig);
    var tryImg = $(".ep-try img", fig);
    var tryName = $(".ep-try__text b", fig);
    var tryCmd = $(".ep-try__text span", fig);
    var vecIn = $(".ep-try .ep-vector", fig);
    var vecOut = $(".ep-out .ep-vector", fig);
    var verdictL = $(".ep-col--std .ep-verdict", fig);
    var verdictR = $(".ep-col--ours .ep-verdict", fig);
    var frames = $$(".ep-plan img", fig);
    var autoBtn = $(".ep-auto", fig);
    var timers = [];
    var auto = !REDUCED;
    var current = null;
    var visible = false;

    function reset() {
      clearAll(timers);
      slots.forEach(function (s) {
        s.className = "";
      });
      row.classList.remove("is-bad", "is-shake");
      stamp.classList.remove("is-on");
      verdictL.classList.remove("is-on", "is-bad");
      verdictR.classList.remove("is-on");
      frames.forEach(function (f) {
        f.classList.remove("is-pulse");
      });
    }

    function select(key, byUser) {
      var b = BODIES[key];
      if (!b) return;
      if (byUser) setAuto(false);
      current = key;
      reset();
      fig.classList.add("has-pick");
      var chip = chips.filter(function (c) {
        return c.getAttribute("data-body") === key;
      })[0];
      press(chips, chip);
      cards.forEach(function (c) {
        c.classList.toggle("is-on", c.getAttribute("data-body") === key);
      });
      tryImg.src = $("img", chip).src;
      tryName.textContent = b.name;
      tryCmd.textContent = b.cmd;
      var inCells = cells(vecIn, b.n);
      var outCells = cells(vecOut, b.n);

      // 1. the body's own command vector appears
      inCells.forEach(function (c, i) {
        later(
          function () {
            c.classList.add("is-in");
          },
          80 + i * 28,
          timers
        );
      });

      // 2. try to fit it into the placeholder
      var t = 80 + b.n * 28 + 420;
      if (b.fill) {
        b.fill.forEach(function (idx, i) {
          later(
            function () {
              slots[idx].classList.add("is-fill");
              if (inCells[i]) inCells[i].classList.add("is-sent");
            },
            t + i * 60,
            timers
          );
        });
        t += b.fill.length * 60 + 200;
        later(
          function () {
            slots.forEach(function (s, idx) {
              if (b.fill.indexOf(idx) < 0) s.classList.add("is-pad");
            });
            verdictL.textContent = b.verdict;
            verdictL.classList.add("is-on");
          },
          t,
          timers
        );
      } else {
        later(
          function () {
            row.classList.add("is-bad", "is-shake");
            stamp.textContent = b.stamp;
            stamp.classList.add("is-on");
            verdictL.textContent = b.verdict;
            verdictL.classList.add("is-on", "is-bad");
          },
          t,
          timers
        );
      }

      // 3. the other way: a video plan, then this body's own program
      t += 750;
      frames.forEach(function (f, i) {
        later(
          function () {
            f.classList.add("is-pulse");
          },
          t + i * 170,
          timers
        );
        later(
          function () {
            f.classList.remove("is-pulse");
          },
          t + i * 170 + 320,
          timers
        );
      });
      t += frames.length * 170 + 300;
      outCells.forEach(function (c, i) {
        later(
          function () {
            c.classList.add("is-in");
          },
          t + i * 28,
          timers
        );
      });
      later(
        function () {
          verdictR.textContent = b.out;
          verdictR.classList.add("is-on");
        },
        t + b.n * 28 + 120,
        timers
      );

      if (auto) {
        later(
          function () {
            if (auto && visible) select(BODY_ORDER[(BODY_ORDER.indexOf(key) + 1) % BODY_ORDER.length], false);
          },
          t + b.n * 28 + 2900,
          timers
        );
      }
    }

    function setAuto(on) {
      auto = on;
      autoBtn.textContent = on ? "❚❚ Pause" : "▶ Auto";
      autoBtn.setAttribute("aria-pressed", on ? "true" : "false");
    }

    chips.concat(cards).forEach(function (el) {
      el.addEventListener("click", function () {
        select(el.getAttribute("data-body"), true);
      });
    });
    autoBtn.addEventListener("click", function () {
      setAuto(!auto);
      if (auto) select(current || BODY_ORDER[0], false);
    });

    fig.classList.add("is-ready");
    setAuto(auto);
    onVisible(
      fig,
      function () {
        visible = true;
        if (!current || auto) select(current || BODY_ORDER[0], false);
      },
      function () {
        visible = false;
      },
      0.3
    );
  }

  /* ------------------------------------------------------------------ the tool call */
  function initTool(fig) {
    var lines = $$(".ep-line", fig);
    var runBtn = $(".ep-run", fig);
    var wire = $(".ep-wire", fig);
    var box = $(".ep-toolbox", fig);
    var arg = $(".ep-arg", fig);
    var plan = $(".ep-mini--plan", fig);
    var pill = $(".ep-mini__pill", fig);
    var body = $(".ep-mini--body", fig);
    var planImgs = $$(".ep-mini--plan img", fig);
    var bodyImgs = $$(".ep-mini--body img", fig);
    var thesis = $(".ep-thesis", fig);
    var timers = [];
    var seen = false;

    function idle() {
      clearAll(timers);
      lines.forEach(function (l) {
        l.classList.remove("is-active");
      });
      wire.classList.remove("is-down", "is-up");
      box.classList.remove("is-running");
      [plan, body].forEach(function (m) {
        m.classList.remove("is-on");
      });
      pill.classList.remove("is-on");
      planImgs.concat(bodyImgs).forEach(function (im) {
        im.classList.remove("is-dim");
      });
      arg.textContent = "instruction";
    }

    function clearReturns() {
      $$(".ep-ret", fig).forEach(function (r) {
        r.classList.remove("is-on");
      });
    }

    // runs one line; calls done() when its result has come back
    function runLine(line, done) {
      var ret = $(".ep-ret", line);
      lines.forEach(function (l) {
        l.classList.toggle("is-active", l === line);
      });
      var call = line.getAttribute("data-call");
      if (!call) {
        later(done, 700, timers);
        return;
      }
      if (call === "look") {
        later(
          function () {
            if (ret) ret.classList.add("is-on");
          },
          550,
          timers
        );
        later(done, 1150, timers);
        return;
      }
      // act(...): the call goes down, the whole stack of this talk runs, the result comes back
      var t = 250;
      later(
        function () {
          wire.classList.remove("is-up");
          wire.classList.add("is-down");
        },
        t,
        timers
      );
      t += 520;
      later(
        function () {
          arg.textContent = '"' + line.getAttribute("data-arg") + '"';
          box.classList.add("is-running");
          planImgs.forEach(function (im) {
            im.classList.add("is-dim");
          });
          plan.classList.add("is-on");
        },
        t,
        timers
      );
      planImgs.forEach(function (im, i) {
        later(
          function () {
            im.classList.remove("is-dim");
          },
          t + 260 + i * 260,
          timers
        );
      });
      t += 260 + planImgs.length * 260 + 250;
      later(
        function () {
          plan.classList.remove("is-on");
          pill.classList.add("is-on");
        },
        t,
        timers
      );
      t += 650;
      later(
        function () {
          pill.classList.remove("is-on");
          body.classList.add("is-on");
          bodyImgs.forEach(function (im) {
            im.classList.add("is-dim");
          });
        },
        t,
        timers
      );
      bodyImgs.forEach(function (im, i) {
        later(
          function () {
            im.classList.remove("is-dim");
          },
          t + 220 + i * 200,
          timers
        );
      });
      t += 220 + bodyImgs.length * 200 + 350;
      later(
        function () {
          body.classList.remove("is-on");
          box.classList.remove("is-running");
          wire.classList.remove("is-down");
          wire.classList.add("is-up");
        },
        t,
        timers
      );
      t += 540;
      later(
        function () {
          wire.classList.remove("is-up");
          arg.textContent = "instruction";
          if (ret) ret.classList.add("is-on");
        },
        t,
        timers
      );
      later(done, t + 450, timers);
    }

    function runAll() {
      idle();
      clearReturns();
      thesis.style.opacity = "0.25";
      var i = 0;
      (function nextLine() {
        if (i >= lines.length) {
          lines.forEach(function (l) {
            l.classList.remove("is-active");
          });
          thesis.style.opacity = "1";
          runBtn.textContent = "↺ Run again";
          return;
        }
        runLine(lines[i++], nextLine);
      })();
    }

    runBtn.addEventListener("click", runAll);
    lines.forEach(function (line) {
      if (line.tagName !== "BUTTON") return;
      line.addEventListener("click", function () {
        idle();
        var ret = $(".ep-ret", line);
        if (ret) ret.classList.remove("is-on");
        thesis.style.opacity = "1";
        runLine(line, function () {
          line.classList.remove("is-active");
        });
      });
    });

    fig.classList.add("is-ready");
    if (REDUCED) return;
    onVisible(
      fig,
      function () {
        if (!seen) {
          seen = true;
          runAll();
        }
      },
      null,
      0.45
    );
  }

  /* ------------------------------------------------------------------ the video planner */
  var PLANNER_NOTE = [
    "The gripper moves to the cup.",
    "Same frames, new instruction: the gripper moves to the lego block.",
    "Same frames, new instruction: the gripper moves to the tennis ball.",
  ];

  function initPlanner(fig) {
    var chips = $$(".ep-chip[data-row]", fig);
    var crop = $(".ep-crop", fig);
    var video = $("video", crop);
    var bar = $(".ep-progress", fig);
    var note = $(".ep-out__note", fig);
    var echo = $(".ep-instr .ep-prompt", fig);
    var model = $(".ep-model", fig);
    var text = $(".ep-step__text", fig);
    var timers = [];
    var row = -1;
    var visible = false;

    function generate(r, chip) {
      clearAll(timers);
      row = r;
      press(chips, chip);
      echo.textContent = chip.textContent;
      video.pause();
      crop.classList.remove("is-clearing", "is-clear");
      bar.classList.remove("is-run");
      video.style.transform = "translateY(" + (-100 / 3) * r + "%)";
      note.textContent = "denoising the future frames…";
      model.classList.add("is-busy");
      try {
        video.currentTime = 1.5;
      } catch (e) {
        /* metadata not loaded yet */
      }
      void crop.offsetWidth; // restart the transitions
      later(
        function () {
          crop.classList.add("is-clearing");
          bar.classList.add("is-run");
        },
        60,
        timers
      );
      later(
        function () {
          crop.classList.remove("is-clearing");
          crop.classList.add("is-clear");
          model.classList.remove("is-busy");
          note.textContent = "a video plan, replayed from the observed frames";
          text.textContent = PLANNER_NOTE[r];
          if (visible) play(video, 0);
        },
        1650,
        timers
      );
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        generate(parseInt(chip.getAttribute("data-row"), 10), chip);
      });
    });

    fig.classList.add("is-ready");
    onVisible(
      fig,
      function () {
        visible = true;
        if (row < 0) generate(0, chips[0]);
        else if (crop.classList.contains("is-clear")) play(video);
      },
      function () {
        visible = false;
        video.pause();
      },
      0.35
    );
  }

  /* ------------------------------------------------------------------ the Jacobian head: one command channel at a time */
  var CHANNEL_NOTE = {
    "-1": "Each column is one command channel, each row one camera. Brighter pixels move more when that command changes; arrows show the direction.",
    0: "x-translation: how every pixel moves when the hand is commanded along x.",
    1: "y-translation: how every pixel moves when the hand is commanded along y.",
    2: "z-translation: in the wrist camera, the whole image expands or contracts.",
    3: "z-rotation: in the wrist camera, the image turns around its center.",
    4: "gripper: only the fingers move, so only the fingers light up.",
  };

  function initJac(fig) {
    var chips = $$(".ep-chip[data-col]", fig);
    var masks = $$(".ep-mask", fig);
    var panel = $(".ep-panel", fig);
    var text = $(".ep-step__text", fig);
    var picked = -1;

    function show(col) {
      panel.classList.toggle("has-col", col >= 0);
      masks.forEach(function (m) {
        m.classList.toggle("is-on", parseInt(m.getAttribute("data-col"), 10) === col);
      });
    }

    function pick(col) {
      picked = col;
      press(
        chips,
        chips.filter(function (c) {
          return parseInt(c.getAttribute("data-col"), 10) === col;
        })[0]
      );
      text.textContent = CHANNEL_NOTE[String(col)];
      show(col);
    }

    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        pick(parseInt(c.getAttribute("data-col"), 10));
      });
    });
    masks.forEach(function (m) {
      var col = parseInt(m.getAttribute("data-col"), 10);
      m.addEventListener("click", function () {
        pick(picked === col ? -1 : col);
      });
      m.addEventListener("mouseenter", function () {
        show(col);
      });
      m.addEventListener("mouseleave", function () {
        show(picked);
      });
    });

    fig.classList.add("is-ready");
    pick(-1);
  }

  /* ------------------------------------------------------------------ commands predict motion */
  var COMMAND_NOTE = {
    field: "The Jacobian field. Each color marks the part of the hand that one command moves.",
    index: "Command the index finger: the arrows are its predicted 3D motion.",
    middle: "Command the middle finger: only the middle finger is predicted to move.",
    ring: "Command the ring finger.",
    little: "Command the little finger.",
    thumb: "Command the thumb.",
  };

  function initCommands(fig) {
    var sliders = $$(".ep-slider", fig);
    var videos = $$(".ep-cmd__screen video", fig);
    var reset = $(".ep-cmd__reset", fig);
    var text = $(".ep-step__text", fig);
    var current = "field";
    var visible = false;

    function show(ch) {
      current = ch;
      sliders.forEach(function (s) {
        var on = s.getAttribute("data-ch") === ch;
        s.classList.toggle("is-on", on);
        s.setAttribute("aria-pressed", on ? "true" : "false");
      });
      videos.forEach(function (v) {
        var on = v.getAttribute("data-ch") === ch;
        v.classList.toggle("is-on", on);
        if (on) {
          if (!v.getAttribute("src")) v.setAttribute("src", v.getAttribute("data-src"));
          if (visible) play(v, 0);
        } else {
          v.pause();
        }
      });
      reset.disabled = ch === "field";
      text.textContent = COMMAND_NOTE[ch];
    }

    sliders.forEach(function (s) {
      s.addEventListener("click", function () {
        var ch = s.getAttribute("data-ch");
        show(current === ch ? "field" : ch);
      });
    });
    reset.addEventListener("click", function () {
      show("field");
    });

    fig.classList.add("is-ready");
    show("field");
    onVisible(
      fig,
      function () {
        visible = true;
        show(current);
      },
      function () {
        visible = false;
        videos.forEach(function (v) {
          v.pause();
        });
      },
      0.3
    );
  }

  /* ------------------------------------------------------------------ one prompt at a time */
  function initSwitch(fig) {
    var chips = $$(".ep-chip[data-i]", fig);
    var videos = $$(".ep-switch__screen video", fig);
    var current = 0;
    var visible = false;

    function show(i) {
      current = i;
      press(chips, chips[i]);
      videos.forEach(function (v, j) {
        v.classList.toggle("is-on", j === i);
        if (j === i) {
          if (!v.getAttribute("src")) v.setAttribute("src", v.getAttribute("data-src"));
          if (visible) play(v, 0);
        } else {
          v.pause();
        }
      });
    }

    chips.forEach(function (c, i) {
      c.addEventListener("click", function () {
        show(i);
      });
    });

    fig.classList.add("is-ready");
    show(0);
    onVisible(
      fig,
      function () {
        visible = true;
        show(current);
      },
      function () {
        visible = false;
        videos.forEach(function (v) {
          v.pause();
        });
      },
      0.3
    );
  }

  /* ------------------------------------------------------------------ tabs: pick a body, see its clips
     Cycles through the panels while on screen until the reader picks one. */
  function initTabs(fig) {
    var chips = $$(".ep-chip[data-i]", fig);
    var panels = $$(".ep-tabpanel", fig);
    var autoBtn = $(".ep-auto", fig);
    var current = 0;
    var visible = false;
    var auto = !REDUCED;
    var timers = [];

    function videos(panel) {
      return $$("video", panel);
    }

    function schedule() {
      clearAll(timers);
      if (!auto || !visible) return;
      var hold = parseInt(panels[current].getAttribute("data-hold"), 10) || 7000;
      later(
        function () {
          show(current + 1);
        },
        hold,
        timers
      );
    }

    function show(i) {
      current = (i + panels.length) % panels.length;
      press(chips, chips[current]);
      panels.forEach(function (p, j) {
        var on = j === current;
        p.classList.toggle("is-on", on);
        videos(p).forEach(function (v) {
          if (on) {
            if (!v.getAttribute("src") && v.getAttribute("data-src")) v.setAttribute("src", v.getAttribute("data-src"));
            if (visible) play(v, 0);
          } else {
            v.pause();
          }
        });
      });
      schedule();
    }

    function setAuto(on) {
      auto = on;
      if (autoBtn) {
        autoBtn.textContent = on ? "❚❚ Pause" : "▶ Auto";
        autoBtn.setAttribute("aria-pressed", on ? "true" : "false");
      }
      schedule();
    }

    chips.forEach(function (c, i) {
      c.addEventListener("click", function () {
        setAuto(false);
        show(i);
      });
    });
    if (autoBtn) {
      autoBtn.addEventListener("click", function () {
        setAuto(!auto);
      });
    }

    fig.classList.add("is-ready");
    setAuto(auto);
    show(0);
    onVisible(
      fig,
      function () {
        if (visible) return;
        visible = true;
        show(current);
      },
      function () {
        visible = false;
        clearAll(timers);
        panels.forEach(function (p) {
          videos(p).forEach(function (v) {
            v.pause();
          });
        });
      },
      0.3
    );
  }

  /* ------------------------------------------------------------------ copy the citation */
  function copyFallback(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (e) {
      ok = false;
    }
    ta.parentNode.removeChild(ta);
    return ok;
  }

  function initCite(fig) {
    $$(".ep-copy", fig).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var text = $(".ep-cite__text", btn.parentNode).textContent;
        function done(ok) {
          btn.textContent = ok ? "Copied" : "Select and copy";
          btn.classList.toggle("is-done", ok);
          window.setTimeout(function () {
            btn.textContent = "Copy";
            btn.classList.toggle("is-done", false);
          }, 1600);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(
            function () {
              done(true);
            },
            function () {
              done(copyFallback(text));
            }
          );
        } else {
          done(copyFallback(text));
        }
      });
    });
    fig.classList.add("is-ready");
  }

  /* ------------------------------------------------------------------ gallery clips
     They carry no autoplay attribute, so they are not all downloaded at page load: each plays while it is on screen. */
  function initClips() {
    var clips = $$("video[data-autoplay]");
    if (!clips.length) return;
    if (!("IntersectionObserver" in window)) {
      clips.forEach(function (v) {
        play(v);
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) play(e.target);
          else e.target.pause();
        });
      },
      { threshold: 0.25 }
    );
    clips.forEach(function (v) {
      io.observe(v);
    });
  }

  var INIT = {
    stepper: initStepper,
    slots: initSlots,
    tool: initTool,
    planner: initPlanner,
    jac: initJac,
    cmd: initCommands,
    switch: initSwitch,
    tabs: initTabs,
    cite: initCite,
  };

  function boot() {
    $$("[data-ep]").forEach(function (fig) {
      var init = INIT[fig.getAttribute("data-ep")];
      if (!init || fig.classList.contains("is-ready")) return;
      try {
        init(fig);
      } catch (err) {
        if (window.console) console.error("embodied-programming figure failed", fig, err);
      }
    });
    initClips();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
