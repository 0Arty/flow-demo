let APP = {};
let $document = $(document);

// WIDTH RESIZE HANDLER ========================================================================
/**
 * Викликає callback тільки при зміні ширини вікна
 * Ігнорує зміни висоти (наприклад, появу/зникнення панелі Safari)
 */
function onWidthChange(callback, debounceMs = 150) {
  let lastWidth = window.innerWidth;
  let timeoutId = null;

  function handleResize() {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      const currentWidth = window.innerWidth;

      if (currentWidth !== lastWidth) {
        lastWidth = currentWidth;
        callback(currentWidth);
      }
    }, debounceMs);
  }

  window.addEventListener("resize", handleResize);

  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    window.removeEventListener("resize", handleResize);
  };
}

// CLASSES ========================================================================
class ModalWindow {
  constructor(modalSelector, openHandlerSelector, closeHandlerSelector) {
    this.$modal = $(modalSelector);
    this.$modalContent = $(`${modalSelector}__content`);
    this.$openBtn = $(openHandlerSelector);
    this.$closeBtn = $(closeHandlerSelector);
    this.INTERACTIVE_ELEMENTS = `${modalSelector}__content, ${openHandlerSelector}`;
    this.init();
  }
  open() {
    this.$modal.fadeIn(400);
    this.$openBtn.addClass("open");
    $("body").addClass("no-scroll");
    this.openOptions();
  }
  openOptions() {}
  close() {
    this.$modal.fadeOut(400);
    this.$openBtn.removeClass("open");
    $("body").removeClass("no-scroll");
    this.closeOptions();
  }
  closeOptions() {}
  modalHandler() {
    if (this.$openBtn.hasClass("open")) {
      this.close();
    } else {
      this.open();
    }
  }
  init() {
    this.$modal.hide();
    this.$openBtn.on("click", () => this.modalHandler());
    this.$closeBtn.on("click", () => this.close());
    $(document).on("click", (e) => {
      if (!$(e.target).closest(this.INTERACTIVE_ELEMENTS).length) {
        this.close();
      }
    });
  }
}

APP.gsapRegisterPlugins = () => {
  gsap.registerPlugin(ScrollTrigger, SplitText);

  window.horizontalLoop = function horizontalLoop(items, config) {
    items = gsap.utils.toArray(items);
    config = config || {};

    let tl = gsap.timeline({
        repeat: config.repeat,
        paused: config.paused,
        defaults: { ease: "none" },
        onReverseComplete: () =>
          tl.totalTime(tl.rawTime() + tl.duration() * 100),
      }),
      length = items.length,
      startX = items[0].offsetLeft,
      times = [],
      widths = [],
      xPercents = [],
      curIndex = 0,
      pixelsPerSecond = (config.speed || 1) * 100,
      snap =
        config.snap === false ? (v) => v : gsap.utils.snap(config.snap || 1),
      totalWidth,
      curX,
      distanceToStart,
      distanceToLoop,
      item,
      i;

    gsap.set(items, {
      xPercent: (i, target, targets) => {
        let w = (widths[i] = parseFloat(
          gsap.getProperty(target, "width", "px")
        ));
        xPercents[i] = snap(
          (parseFloat(gsap.getProperty(target, "x", "px")) / w) * 100 +
            gsap.getProperty(target, "xPercent")
        );
        return xPercents[i];
      },
    });

    gsap.set(items, { x: 0 });

    totalWidth =
      items[length - 1].offsetLeft +
      (xPercents[length - 1] / 100) * widths[length - 1] -
      startX +
      items[length - 1].offsetWidth *
        gsap.getProperty(items[length - 1], "scaleX") +
      (parseFloat(config.paddingRight) || 0);

    for (i = 0; i < length; i++) {
      item = items[i];
      curX = (xPercents[i] / 100) * widths[i];
      distanceToStart = item.offsetLeft + curX - startX;
      distanceToLoop =
        distanceToStart + widths[i] * gsap.getProperty(item, "scaleX");

      tl.to(
        item,
        {
          xPercent: snap(((curX - distanceToLoop) / widths[i]) * 100),
          duration: distanceToLoop / pixelsPerSecond,
        },
        0
      )
        .fromTo(
          item,
          {
            xPercent: snap(
              ((curX - distanceToLoop + totalWidth) / widths[i]) * 100
            ),
          },
          {
            xPercent: xPercents[i],
            duration:
              (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond,
            immediateRender: false,
          },
          distanceToLoop / pixelsPerSecond
        )
        .add("label" + i, distanceToStart / pixelsPerSecond);

      times[i] = distanceToStart / pixelsPerSecond;
    }

    function toIndex(index, vars) {
      vars = vars || {};
      Math.abs(index - curIndex) > length / 2 &&
        (index += index > curIndex ? -length : length);
      let newIndex = gsap.utils.wrap(0, length, index),
        time = times[newIndex];
      if (time > tl.time() !== index > curIndex) {
        vars.modifiers = { time: gsap.utils.wrap(0, tl.duration()) };
        time += tl.duration() * (index > curIndex ? 1 : -1);
      }
      curIndex = newIndex;
      vars.overwrite = true;
      return tl.tweenTo(time, vars);
    }

    tl.next = (vars) => toIndex(curIndex + 1, vars);
    tl.previous = (vars) => toIndex(curIndex - 1, vars);
    tl.current = () => curIndex;
    tl.toIndex = (index, vars) => toIndex(index, vars);
    tl.times = times;
    tl.progress(1, true).progress(0, true);

    if (config.reversed) {
      tl.vars.onReverseComplete();
      tl.reverse();
    }

    return tl;
  };
};

APP.utils = {
  debounce: (func, delay) => {
    let timeoutId;
    return function (...args) {
      const context = this;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(context, args);
      }, delay);
    };
  },
  throttle: (func, delay) => {
    let lastCall = 0;
    return function (...args) {
      const context = this;
      const now = Date.now();
      if (now - lastCall >= delay) {
        func.apply(context, args);
        lastCall = now;
      }
    };
  },
};

// MAIN LOGIC =======================================================================
APP.site = {
  modals: () => {
    const mainModal = new ModalWindow(".modal", ".openModal", ".closeModal");
    mainModal.open();
    mainModal.closeOptions = () => {
      console.log("i changes close options:");
    };
    setTimeout(() => {
      mainModal.close();
    }, 5000);
  },
};

// INPUTS
APP.inputMasks = () => {
  $("input[data-input-type]").each(function () {
    const inputType = $(this).data("input-type");
    const originalPlaceholder = $(this).attr("placeholder");
    switch (inputType) {
      case "text":
        $(this).inputmask({
          mask: "*{1,50}",
          definitions: {
            "*": {
              validator: "[A-Za-zА-Яа-яЁё\\s]",
              cardinality: 1,
            },
          },
          placeholder: "",
          showMaskOnHover: false,
          clearIncomplete: true,
        });
        break;
      case "number":
        $(this).inputmask({
          mask: "9{1,10}",
          placeholder: "",
          showMaskOnHover: false,
          clearIncomplete: true,
        });
        break;
      case "email":
        $(this).inputmask({
          mask: "*{1,64}@*{1,64}.*{1,10}",
          greedy: false,
          definitions: {
            "*": {
              validator: "[0-9A-Za-z!#$%&'*+/=?^_`{|}~-]",
              cardinality: 1,
            },
          },
          placeholder: "",
          showMaskOnHover: false,
          clearIncomplete: true,
        });
        break;
      case "phone":
        $(this).inputmask({
          mask: "+48-999-999-999",
          placeholder: "X",
          showMaskOnHover: false,
          showMaskOnFocus: true,
          clearIncomplete: true,
        });
        break;
      case "nip":
        $(this).inputmask({
          mask: "999-999-99-99",
          placeholder: "X",
          showMaskOnHover: false,
          showMaskOnFocus: true,
          clearIncomplete: true,
        });
        break;
    }
    $(this).attr("placeholder", originalPlaceholder);
  });
};

APP.createSlider = (sliderSelector) => {
  let slider = null;
  const createSlider = () => {
    if (slider) return;
    slider = new Swiper(sliderSelector, {
      slidesPerView: "auto",
      spaceBetween: 12,
      slidesOffsetBefore: 20,
      slidesOffsetAfter: 20,
      pagination: {
        el: $(sliderSelector).parent().find(".custom-pagination")[0],
        clickable: true,
      },
    });
  };
  const destroySlider = () => {
    if (slider) {
      slider.destroy(true, true);
      slider = null;
    }
  };
  const checkWindowSize = () => {
    if (window.innerWidth < 768) {
      createSlider();
    } else {
      destroySlider();
    }
  };
  sliderSelector = sliderSelector;
  checkWindowSize();

  // ЗАМІНЕНО: використовуємо onWidthChange замість debounce + resize
  const cleanupResize = onWidthChange(checkWindowSize, 300);
};

APP.accordions = () => {
  const $items = $(".accrodion__item");
  const itemDuration = 6000;
  let currentIndex = 0;
  let progressInterval = null;
  let autoPlayEnabled = true;
  let startTime = null;
  let pausedProgress = 0;

  const initFirstAccordion = () => {
    $items.first().addClass("active");
    $items.first().find(".dropdown").show();
    startProgress(0);
  };

  const startProgress = (index) => {
    if (!autoPlayEnabled) return;
    const $item = $items.eq(index);
    startTime = Date.now() - pausedProgress;
    const animate = () => {
      if (!autoPlayEnabled) return;
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / itemDuration) * 100, 100);
      $item.css("--width", progress + "%");
      if (progress >= 100) {
        clearInterval(progressInterval);
        moveToNext();
      }
    };
    progressInterval = setInterval(animate, 16);
  };

  const stopProgress = () => {
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
      pausedProgress = Date.now() - startTime;
    }
  };

  const resetProgress = (index) => {
    pausedProgress = 0;
    startTime = null;
    $items.eq(index).css("--width", "0%");
  };

  const moveToNext = () => {
    const $current = $items.eq(currentIndex);
    $current.removeClass("active");
    $current.find(".dropdown").slideUp();
    resetProgress(currentIndex);
    currentIndex = (currentIndex + 1) % $items.length;
    const $next = $items.eq(currentIndex);
    $next.addClass("active");
    $next.find(".dropdown").slideDown();
    startProgress(currentIndex);
  };

  const openAccordion = (index) => {
    if (index === currentIndex) return;
    stopProgress();
    $items.eq(currentIndex).removeClass("active");
    $items.eq(currentIndex).find(".dropdown").slideUp();
    resetProgress(currentIndex);
    currentIndex = index;
    $items.eq(currentIndex).addClass("active");
    $items.eq(currentIndex).find(".dropdown").slideDown();
    if (autoPlayEnabled) {
      resetProgress(currentIndex);
      startProgress(currentIndex);
    }
  };

  $(".accrodion__item__header").click(function () {
    const index = $(this).closest(".accrodion__item").index();
    autoPlayEnabled = false;
    stopProgress();
    $items.css("--width", "0%");
    openAccordion(index);
  });

  $items.hover(
    function () {
      if (autoPlayEnabled) {
        stopProgress();
      }
    },
    function () {
      if (autoPlayEnabled) {
        startProgress(currentIndex);
      }
    }
  );

  initFirstAccordion();
};

APP.splitChars = () => {
  const headerHeight = $("header").innerHeight();
  const minOffset = headerHeight + 16;
  const aboutContainerHeight = $(".about__container").innerHeight();
  const availableSpace = window.innerHeight - minOffset;
  const shouldPin = aboutContainerHeight <= availableSpace;
  const speedMultiplier = window.innerWidth < 768 ? 10 : 7;
  const centerOffset = (window.innerHeight - aboutContainerHeight) / 2;
  const finalOffset = Math.max(centerOffset, minOffset);

  const timings = [
    [0.05, 0.15],
    [0.25, 0.35],
    [0.45, 0.55],
    [0.65, 0.75],
    [0.85, 0.95],
  ];

  const onUpdateScrollTrigger = (self) => {
    const progress = self.progress;
    photoBlocks.forEach((block, index) => {
      const [showAt, hideAt] = timings[index];
      if (progress >= showAt && progress <= hideAt) {
        gsap.to(block, { scale: 1, duration: 0.1, overwrite: true });
      } else {
        gsap.to(block, { scale: 0, duration: 0.1, overwrite: true });
      }
    });
  };

  if (!shouldPin) {
    $(".about__container h2").css({
      fontSize: "1.5rem",
    });
  }

  let split = new SplitText(".about__container h2", { type: "words,chars" });
  let textAnimation = null;
  let photoBlocks = document.querySelectorAll(
    ".about__container .absolute--block"
  );

  gsap.set(split.words, { whiteSpace: "nowrap" });
  gsap.set(photoBlocks, { scale: 0 });

  const createAnimation = () => {
    if (textAnimation) {
      textAnimation.scrollTrigger?.kill();
      textAnimation.kill();
    }
    textAnimation = gsap.fromTo(
      split.chars,
      { opacity: 0.08 },
      {
        force3D: true,
        opacity: 1,
        stagger: 0.012,
        duration: 0.0001,
        ease: "power2.out",
        immediateRender: true,
        scrollTrigger: {
          trigger: ".about",
          scrub: true,
          start: `top ${finalOffset}px`,
          end: `+=${split.chars.length * speedMultiplier}`,
          pin: true,
          pinSpacing: true,
          onUpdate: onUpdateScrollTrigger,
        },
      }
    );
  };

  createAnimation();

  const cleanupResize = onWidthChange(() => {
    split.split({ type: "words,chars" });
    gsap.set(split.words, { whiteSpace: "nowrap" });
    gsap.set(split.chars, { opacity: 0.08 });
    createAnimation();
    ScrollTrigger.refresh();
  }, 250);

  return () => {
    cleanupResize();
    if (textAnimation) {
      textAnimation.scrollTrigger?.kill();
      textAnimation.kill();
    }
    split.revert();
  };
};

APP.createGSAPAnimation = () => {
  if (window.innerWidth >= 768) {
    const garantiesBlocks = $(".garanties-swiper .content");
    garantiesBlocks.each(function () {
      const block = $(this);
      gsap.fromTo(
        block,
        {
          opacity: 0,
          scale: 0.3,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: block[0],
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });
    const opportunitiesBlocks = gsap.utils.toArray(
      ".opportunities-slider .content"
    );
    gsap.fromTo(
      opportunitiesBlocks,
      {
        y: 200,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: ".opportunities-slider",
          start: "top center",
          end: "top bottom-=25%",
          toggleActions: "play none none reverse",
          scrub: false,
        },
      }
    );
    const benefitsBlocks = gsap.utils.toArray(".benefit-slider .benefit-slide");
    gsap.fromTo(
      benefitsBlocks,
      {
        y: 200,
        opacity: 0,
        scale: 0.4,
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        scale: 1,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: ".benefit-slider",
          start: "top center+=20%",
          end: "top bottom-=25%",
          toggleActions: "play none none reverse",
          scrub: false,
        },
      }
    );

    const stepsBlocks = gsap.utils.toArray(
      ".platform__grid.steps .gsap-animated"
    );
    gsap.fromTo(
      stepsBlocks,
      {
        y: 200,
        opacity: 0,
        scale: 0.4,
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        scale: 1,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: ".platform__grid.steps",
          start: "top center+=20%",
          end: "top bottom-=25%",
          toggleActions: "play none none reverse",
          scrub: false,
        },
      }
    );
  }
};

APP.createSimpleBar = () => {
  $(".simple-bar-container").each(function (id, element) {
    new SimpleBar($(element)[0], { autoHide: false });
  });
};

APP.createTermsPopUp = () => {
  const openBtnSelector = ".open-terms-popup";
  const termsPopup = new ModalWindow(
    ".terms-modal",
    openBtnSelector,
    ".terms-modal-close"
  );
  termsPopup.INTERACTIVE_ELEMENTS =
    ".terms-modal__content .content, " + openBtnSelector;
};

APP.createFormPopUp = () => {
  const openBtnSelector = ".open-contact-form";
  const termsPopup = new ModalWindow(
    ".form__modal",
    openBtnSelector,
    ".form-modal-close"
  );
  termsPopup.INTERACTIVE_ELEMENTS =
    ".form__modal__content .content, " + openBtnSelector;
};

APP.formValidate = () => {
  const $form = $("#getContactForm");
  $form.validate({
    errorClass: "error",
    ignore: [],
    errorPlacement: function (error, element) {
      const $block = element.closest(".input--block");
      $block.find(".error-message").html($(error).text());
    },
    highlight: function (element) {
      $(element).closest(".input--block").addClass("error");
    },
    unhighlight: function (element) {
      $(element).closest(".input--block").removeClass("error");
      $(element).closest(".input--block").find(".error-message").empty();
    },
    rules: {
      text_1: { required: true },
      text_2: { required: true },
      email: { required: true, email: true },
      phone: { required: true, minlength: 9 },
      company: {},
      nip: { required: true, minlength: 10 },
    },
    messages: {
      text_1: "Proszę podać imię.",
      text_2: "Proszę podać nazwisko.",
      email: {
        required: "Proszę podać adres e-mail.",
        email: "Proszę podać poprawny adres e-mail.",
      },
      phone: {
        required: "Proszę podać numer telefonu.",
        minlength: "Numer telefonu jest za krótki.",
      },
      nip: {
        required: "Proszę podać numer NIP.",
        minlength: "Numer NIP jest za krótki.",
      },
    },
    submitHandler: function (form) {
      alert("Formularz został wysłany poprawnie!");
      form.submit();
    },
  });

  $form.find('input[data-input-type="text"]').each(function (index) {
    const placeholder = $(this).attr("placeholder").toLowerCase();
    if (placeholder.includes("imię")) $(this).attr("name", "text_1");
    else if (placeholder.includes("nazwisko")) $(this).attr("name", "text_2");
    else if (placeholder.includes("firma")) $(this).attr("name", "company");
    else if (placeholder.includes("nip")) $(this).attr("name", "nip");
  });
  $form.find('input[data-input-type="email"]').attr("name", "email");
  $form.find('input[data-input-type="phone"]').attr("name", "phone");
};

APP.smoothScroll = () => {
  $(
    ".header__container .logo__container, .footer__grid .col__logo .link-to-main-site"
  ).on("click", function (e) {
    e.preventDefault();

    $("html, body").animate(
      {
        scrollTop: $("#hero").offset().top,
      },
      800
    );
  });
};

APP.serviceWorker = () => {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/flow-demo/js/service-worker.js")
        .then((reg) => console.log("SW зареєстровано:", reg))
        .catch((err) => console.log("SW помилка:", err));
    });
  }
};

APP.gsapMarquee = () => {
  const track = document.querySelector(".marquee-track");
  const items = gsap.utils.toArray(".marquee__item");
  if (!items.length) return;

  // Налаштування
  const spacing = 12;
  const speed = 1;

  // 🔧 ВИПРАВЛЕННЯ: Форсуємо GPU acceleration для всіх елементів
  gsap.set(items, {
    force3D: true,
    z: 0.01, // Мікро-зсув по Z для стабільності
    backfaceVisibility: "hidden",
    perspective: 1000,
    willChange: "transform", // Підказка браузеру
  });

  // --- horizontalLoop ---
  const loop = horizontalLoop(items, {
    repeat: -1,
    speed: speed,
    paddingRight: spacing,
    paused: false,
    reversed: false,
  });

  // 🔧 ВИПРАВЛЕННЯ: Додаємо force3D в конфіг
  gsap.defaults({ force3D: true });

  // --- Відео контроль ---
  const getMaxPlaying = () => (window.innerWidth < 768 ? 2 : 5);
  const playingVideos = new Set();

  const playVideo = (video) => {
    if (!video) return;
    if (playingVideos.has(video)) return;
    if (playingVideos.size >= getMaxPlaying()) return;

    if (!video.src && video.dataset.src) {
      video.src = video.dataset.src;
    }

    // 🔧 ВИПРАВЛЕННЯ: Чекаємо на metadata перед play
    video.addEventListener(
      "loadedmetadata",
      () => {
        video
          .play()
          .then(() => {
            playingVideos.add(video);
          })
          .catch(() => {});
      },
      { once: true }
    );

    if (video.readyState >= 2) {
      video
        .play()
        .then(() => {
          playingVideos.add(video);
        })
        .catch(() => {});
    }
  };

  const pauseVideo = (video) => {
    if (!video) return;
    if (!video.paused) {
      video.pause();
      playingVideos.delete(video);
    }
  };

  const checkVisibleVideos = () => {
    const containerRect = track.parentElement.getBoundingClientRect();
    const visibleVideos = [];

    items.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const isVisible =
        rect.right > containerRect.left && rect.left < containerRect.right;
      const video = item.querySelector("video");

      if (video) {
        if (isVisible) {
          visibleVideos.push(video);
        } else {
          pauseVideo(video);
        }
      }
    });

    visibleVideos.forEach((video) => {
      playVideo(video);
    });
  };

  // 🔧 ВИПРАВЛЕННЯ: Throttle для ticker на мобільних
  let lastCheck = 0;
  const throttledCheck = () => {
    const now = Date.now();
    if (now - lastCheck > 100) {
      // Перевірка кожні 100мс
      checkVisibleVideos();
      lastCheck = now;
    }
  };

  gsap.ticker.add(throttledCheck);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target.querySelector("video");
        if (!video) return;

        if (entry.isIntersecting && entry.intersectionRatio > 0) {
          playVideo(video);
        } else {
          pauseVideo(video);
        }
      });
    },
    {
      threshold: [0, 0.1],
      root: track.parentElement,
      rootMargin: "50px", // 🔧 Додаємо запас для плавності
    }
  );

  items.forEach((item) => observer.observe(item));

  // --- Ресайз ---
  let resizeTimer;
  let currentLoop = loop;

  const handleResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      currentLoop.kill();

      // 🔧 Перед перезапуском скидаємо трансформації
      gsap.set(items, { clearProps: "x,xPercent" });
      gsap.set(items, {
        force3D: true,
        z: 0.01,
        backfaceVisibility: "hidden",
        perspective: 1000,
      });

      currentLoop = horizontalLoop(items, {
        repeat: -1,
        speed: speed,
        paddingRight: spacing,
        paused: false,
        reversed: false,
      });

      checkVisibleVideos();
    }, 300);
  };

  window.addEventListener("resize", handleResize);

  // Початковий запуск
  setTimeout(checkVisibleVideos, 100); // 🔧 Невелика затримка для стабільності

  // Cleanup
  return () => {
    gsap.ticker.remove(throttledCheck);
    currentLoop.kill();
    observer.disconnect();
    window.removeEventListener("resize", handleResize);
    clearTimeout(resizeTimer);
    playingVideos.clear();
  };
};

$(document).ready(() => {
  APP.serviceWorker();
  APP.gsapRegisterPlugins();
  APP.inputMasks();
  APP.createSlider(".garanties-swiper");
  APP.createSlider(".opportunities-slider");
  APP.createSlider(".benefit-slider");
  APP.accordions();
  APP.splitChars();
  APP.createGSAPAnimation();
  APP.createSimpleBar();
  APP.createTermsPopUp();
  APP.createFormPopUp();
  APP.formValidate();
  APP.smoothScroll();
  APP.gsapMarquee();
});
