let APP = {}
let $document = $(document)

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

    window.addEventListener('resize', handleResize);

    return () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        window.removeEventListener('resize', handleResize);
    };
}

// CLASSES ========================================================================
class ModalWindow {
    constructor(modalSelector, openHandlerSelector, closeHandlerSelector) {
        this.$modal = $(modalSelector)
        this.$modalContent = $(`${modalSelector}__content`)
        this.$openBtn = $(openHandlerSelector)
        this.$closeBtn = $(closeHandlerSelector)
        this.INTERACTIVE_ELEMENTS = `${modalSelector}__content, ${openHandlerSelector}`
        this.init()
    }
    open() {
        this.$modal.fadeIn(400)
        this.$openBtn.addClass('open')
        $('body').addClass('no-scroll')
        this.openOptions()
    }
    openOptions() { }
    close() {
        this.$modal.fadeOut(400)
        this.$openBtn.removeClass('open')
        $('body').removeClass('no-scroll')
        this.closeOptions()
    }
    closeOptions() { }
    modalHandler() {
        if (this.$openBtn.hasClass('open')) {
            this.close()
        } else {
            this.open()
        }
    }
    init() {
        this.$modal.hide()
        this.$openBtn.on('click', () => this.modalHandler())
        this.$closeBtn.on('click', () => this.close())
        $(document).on('click', (e) => {
            if (!$(e.target).closest(this.INTERACTIVE_ELEMENTS).length) {
                this.close()
            }
        })
    }
}

APP.gsapRegisterPlugins = () => {
    gsap.registerPlugin(ScrollTrigger, SplitText)
    ScrollTrigger.normalizeScroll(true);
}

APP.utils = {
    debounce: (func, delay) => {
        let timeoutId
        return function (...args) {
            const context = this
            clearTimeout(timeoutId)
            timeoutId = setTimeout(() => {
                func.apply(context, args)
            }, delay)
        }
    },
    throttle: (func, delay) => {
        let lastCall = 0
        return function (...args) {
            const context = this
            const now = Date.now()
            if (now - lastCall >= delay) {
                func.apply(context, args)
                lastCall = now
            }
        }
    }
}

// MAIN LOGIC =======================================================================
APP.site = {
    modals: () => {
        const mainModal = new ModalWindow(
            '.modal',
            '.openModal',
            '.closeModal'
        )
        mainModal.open()
        mainModal.closeOptions = () => {
            console.log('i changes close options:',)
        }
        setTimeout(() => {
            mainModal.close()
        }, 5000)
    }
}

// INPUTS
APP.inputMasks = () => {
    $('input[data-input-type]').each(function () {
        const inputType = $(this).data('input-type');
        const originalPlaceholder = $(this).attr('placeholder');
        switch (inputType) {
            case 'text':
                $(this).inputmask({
                    mask: '*{1,50}',
                    definitions: {
                        '*': {
                            validator: '[A-Za-zА-Яа-яЁё\\s]',
                            cardinality: 1
                        }
                    },
                    placeholder: '',
                    showMaskOnHover: false,
                    clearIncomplete: true
                });
                break;
            case 'number':
                $(this).inputmask({
                    mask: '9{1,10}',
                    placeholder: '',
                    showMaskOnHover: false,
                    clearIncomplete: true
                });
                break;
            case 'email':
                $(this).inputmask({
                    mask: '*{1,64}@*{1,64}.*{1,10}',
                    greedy: false,
                    definitions: {
                        '*': {
                            validator: '[0-9A-Za-z!#$%&\'*+/=?^_`{|}~-]',
                            cardinality: 1
                        }
                    },
                    placeholder: '',
                    showMaskOnHover: false,
                    clearIncomplete: true
                });
                break;
            case 'phone':
                $(this).inputmask({
                    mask: '+48-999-999-999',
                    placeholder: 'X',
                    showMaskOnHover: false,
                    showMaskOnFocus: true,
                    clearIncomplete: true
                });
                break;
            case 'nip':
                $(this).inputmask({
                    mask: '999-999-99-99',
                    placeholder: 'X',
                    showMaskOnHover: false,
                    showMaskOnFocus: true,
                    clearIncomplete: true
                });
                break;
        }
        $(this).attr('placeholder', originalPlaceholder);
    });
}

APP.customMargquee = () => {
    function initMarquee() {
        const marqueeContainer = document.querySelector('.marquee__container');
        const marquee = document.querySelector('.marquee');
        if (!marquee || !marqueeContainer) return;
        const items = marquee.querySelectorAll('.marquee__item');
        if (items.length === 0) return;
        let isDragging = false;
        let startX = 0;
        let currentX = 0;
        let previousX = 0;
        let velocity = 0;
        let animationId = null;
        let autoScrollAnimation = null;
        let lastMoveTime = 0;

        const cloneItems = () => {
            const marqueeWidth = marquee.scrollWidth;
            const containerWidth = marqueeContainer.offsetWidth;
            const clones = marquee.querySelectorAll('.marquee__item--clone');
            clones.forEach(clone => clone.remove());
            const cloneCount = Math.ceil(containerWidth / marqueeWidth) + 2;
            for (let i = 0; i < cloneCount; i++) {
                items.forEach(item => {
                    const clone = item.cloneNode(true);
                    clone.classList.add('marquee__item--clone');
                    marquee.appendChild(clone);
                });
            }
        };
        cloneItems();

        const getItemsWidth = () => {
            let width = 0;
            items.forEach(item => {
                width += item.offsetWidth;
            });
            const gap = parseFloat(getComputedStyle(marquee).gap) || 12;
            width += gap * items.length;
            return width;
        };
        let itemsWidth = getItemsWidth();

        const normalizePosition = (x) => {
            while (x > 0) {
                x -= itemsWidth;
            }
            while (x < -itemsWidth) {
                x += itemsWidth;
            }
            return x;
        };

        const startAutoScroll = () => {
            if (autoScrollAnimation) autoScrollAnimation.kill();
            let currentXPos = gsap.getProperty(marquee, "x");
            currentXPos = normalizePosition(currentXPos);
            gsap.set(marquee, { x: currentXPos });
            autoScrollAnimation = gsap.to(marquee, {
                x: `-=${itemsWidth}`,
                duration: 20,
                ease: "none",
                repeat: -1,
                modifiers: {
                    x: (x) => {
                        const val = parseFloat(x);
                        return `${normalizePosition(val)}px`;
                    }
                }
            });
        };
        startAutoScroll();

        const handleDragStart = (e) => {
            isDragging = true;
            marqueeContainer.style.cursor = 'grabbing';
            if (autoScrollAnimation) {
                autoScrollAnimation.kill();
            }
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            startX = (e.type === 'mousedown' ? e.pageX : e.touches[0].pageX);
            previousX = startX;
            currentX = gsap.getProperty(marquee, "x");
            velocity = 0;
            lastMoveTime = Date.now();
        };

        const handleDragMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = (e.type === 'mousemove' ? e.pageX : e.touches[0].pageX);
            const deltaX = x - previousX;
            const currentTime = Date.now();
            const deltaTime = currentTime - lastMoveTime;
            if (deltaTime > 0) {
                velocity = deltaX / deltaTime * 16;
            }
            currentX += deltaX;
            currentX = normalizePosition(currentX);
            gsap.set(marquee, { x: currentX });
            previousX = x;
            lastMoveTime = currentTime;
        };

        const handleDragEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            marqueeContainer.style.cursor = 'grab';
            const decelerate = () => {
                velocity *= 0.92;
                if (Math.abs(velocity) > 0.1) {
                    currentX += velocity;
                    currentX = normalizePosition(currentX);
                    gsap.set(marquee, { x: currentX });
                    animationId = requestAnimationFrame(decelerate);
                } else {
                    startAutoScroll();
                }
            };
            decelerate();
        };

        const handleWheel = (e) => {
            e.preventDefault();
            if (autoScrollAnimation) {
                autoScrollAnimation.kill();
            }
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            const scrollDelta = e.deltaY * 0.9;
            velocity = -scrollDelta * 0.3;
            currentX = gsap.getProperty(marquee, "x");
            const scrollDecelerate = () => {
                velocity *= 0.90;
                if (Math.abs(velocity) > 0.1) {
                    currentX += velocity;
                    currentX = normalizePosition(currentX);
                    gsap.set(marquee, { x: currentX });
                    animationId = requestAnimationFrame(scrollDecelerate);
                } else {
                    setTimeout(() => {
                        startAutoScroll();
                    }, 500);
                }
            };
            scrollDecelerate();
        };

        marqueeContainer.addEventListener('mousedown', handleDragStart);
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
        marqueeContainer.addEventListener('touchstart', handleDragStart, { passive: false });
        document.addEventListener('touchmove', handleDragMove, { passive: false });
        document.addEventListener('touchend', handleDragEnd);
        marqueeContainer.addEventListener('wheel', handleWheel, { passive: false });
        marqueeContainer.style.cursor = 'grab';
        marqueeContainer.style.userSelect = 'none';

        // ЗАМІНЕНО: використовуємо onWidthChange замість resize
        const cleanupResize = onWidthChange(() => {
            if (autoScrollAnimation) autoScrollAnimation.kill();
            if (animationId) cancelAnimationFrame(animationId);
            cloneItems();
            const newItemsWidth = getItemsWidth();
            itemsWidth = newItemsWidth;
            startAutoScroll();
        }, 250);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMarquee);
    } else {
        initMarquee();
    }
}

APP.createSlider = (sliderSelector) => {
    let slider = null
    const createSlider = () => {
        if (slider) return
        slider = new Swiper(sliderSelector, {
            slidesPerView: 'auto',
            spaceBetween: 12,
            slidesOffsetBefore: 20,
            slidesOffsetAfter: 20,
            pagination: {
                el: $(sliderSelector).parent().find('.custom-pagination')[0],
                clickable: true,
            }
        })
    }
    const destroySlider = () => {
        if (slider) {
            slider.destroy(true, true)
            slider = null
        }
    }
    const checkWindowSize = () => {
        if (window.innerWidth < 768) {
            createSlider()
        } else {
            destroySlider()
        }
    }
    sliderSelector = sliderSelector
    checkWindowSize()

    // ЗАМІНЕНО: використовуємо onWidthChange замість debounce + resize
    const cleanupResize = onWidthChange(checkWindowSize, 300);
}

APP.accordions = () => {
    const $items = $('.accrodion__item');
    const itemDuration = 6000;
    let currentIndex = 0;
    let progressInterval = null;
    let autoPlayEnabled = true;
    let startTime = null;
    let pausedProgress = 0;

    const initFirstAccordion = () => {
        $items.first().addClass('active');
        $items.first().find('.dropdown').show();
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
            $item.css('--width', progress + '%');
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
        $items.eq(index).css('--width', '0%');
    };

    const moveToNext = () => {
        const $current = $items.eq(currentIndex);
        $current.removeClass('active');
        $current.find('.dropdown').slideUp();
        resetProgress(currentIndex);
        currentIndex = (currentIndex + 1) % $items.length;
        const $next = $items.eq(currentIndex);
        $next.addClass('active');
        $next.find('.dropdown').slideDown();
        startProgress(currentIndex);
    };

    const openAccordion = (index) => {
        if (index === currentIndex) return;
        stopProgress();
        $items.eq(currentIndex).removeClass('active');
        $items.eq(currentIndex).find('.dropdown').slideUp();
        resetProgress(currentIndex);
        currentIndex = index;
        $items.eq(currentIndex).addClass('active');
        $items.eq(currentIndex).find('.dropdown').slideDown();
        if (autoPlayEnabled) {
            resetProgress(currentIndex);
            startProgress(currentIndex);
        }
    };

    $('.accrodion__item__header').click(function () {
        const index = $(this).closest('.accrodion__item').index();
        autoPlayEnabled = false;
        stopProgress();
        $items.css('--width', '0%');
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
}

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
        [0.85, 0.95]
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
    }

    if (!shouldPin) {
        $('.about__container h2').css({
            fontSize: '1.5rem'
        })
    }

    let split = new SplitText(".about__container h2", { type: "words,chars" });
    let textAnimation = null;
    let photoBlocks = document.querySelectorAll(".about__container .absolute--block");

    gsap.set(split.words, { whiteSpace: "nowrap" });
    gsap.set(photoBlocks, { scale: 0 });


    const createAnimation = () => {
        if (textAnimation) {
            textAnimation.scrollTrigger?.kill();
            textAnimation.kill();
        }
        textAnimation = gsap.fromTo(split.chars,
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
}

APP.createGSAPAnimation = () => {
    if (window.innerWidth >= 768) {
        const garantiesBlocks = $('.garanties-swiper .content')
        garantiesBlocks.each(function () {
            const block = $(this);
            gsap.fromTo(
                block,
                {
                    opacity: 0,
                    scale: 0.3
                },
                {
                    opacity: 1,
                    scale: 1,
                    duration: 0.6,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: block[0],
                        start: 'top 80%',
                        toggleActions: 'play none none reverse',
                    }
                }
            );
        });
        const opportunitiesBlocks = gsap.utils.toArray('.opportunities-slider .content');
        gsap.fromTo(
            opportunitiesBlocks,
            {
                y: 200,
                opacity: 0
            },
            {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: 'power3.out',
                stagger: 0.1,
                scrollTrigger: {
                    trigger: '.opportunities-slider',
                    start: 'top center',
                    end: 'top bottom-=25%',
                    toggleActions: 'play none none reverse',
                    scrub: false,
                }
            }
        );
        const benefitsBlocks = gsap.utils.toArray('.benefit-slider .benefit-slide');
        gsap.fromTo(
            benefitsBlocks,
            {
                y: 200,
                opacity: 0,
                scale: 0.4
            },
            {
                y: 0,
                opacity: 1,
                duration: 0.8,
                scale: 1,
                ease: 'power3.out',
                stagger: 0.1,
                scrollTrigger: {
                    trigger: '.benefit-slider',
                    start: 'top center+=20%',
                    end: 'top bottom-=25%',
                    toggleActions: 'play none none reverse',
                    scrub: false,
                }
            }
        );

        const stepsBlocks = gsap.utils.toArray('.platform__grid.steps .gsap-animated');
        gsap.fromTo(
            stepsBlocks,
            {
                y: 200,
                opacity: 0,
                scale: 0.4
            },
            {
                y: 0,
                opacity: 1,
                duration: 0.8,
                scale: 1,
                ease: 'power3.out',
                stagger: 0.1,
                scrollTrigger: {
                    trigger: '.platform__grid.steps',
                    start: 'top center+=20%',
                    end: 'top bottom-=25%',
                    toggleActions: 'play none none reverse',
                    scrub: false,
                }
            }
        );


    }
}

APP.createSimpleBar = () => {
    $('.simple-bar-container').each(function (id, element) {
        new SimpleBar($(element)[0], { autoHide: false });
    })
}

APP.createTermsPopUp = () => {
    const openBtnSelector = ".open-terms-popup"
    const termsPopup = new ModalWindow(
        '.terms-modal',
        openBtnSelector,
        '.terms-modal-close'
    )
    termsPopup.INTERACTIVE_ELEMENTS = ".terms-modal__content .content, " + openBtnSelector
}

APP.createFormPopUp = () => {
    const openBtnSelector = ".open-contact-form"
    const termsPopup = new ModalWindow(
        '.form__modal',
        openBtnSelector,
        '.form-modal-close'
    )
    termsPopup.INTERACTIVE_ELEMENTS = ".form__modal__content .content, " + openBtnSelector
}

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
            "text_1": { required: true },
            "text_2": { required: true },
            "email": { required: true, email: true },
            "phone": { required: true, minlength: 9 },
            "company": {},
            "nip": { required: true, minlength: 10 }
        },
        messages: {
            "text_1": "Proszę podać imię.",
            "text_2": "Proszę podać nazwisko.",
            "email": {
                required: "Proszę podać adres e-mail.",
                email: "Proszę podać poprawny adres e-mail."
            },
            "phone": {
                required: "Proszę podać numer telefonu.",
                minlength: "Numer telefonu jest za krótki."
            },
            "nip": {
                required: "Proszę podać numer NIP.",
                minlength: "Numer NIP jest za krótki."
            }
        },
        submitHandler: function (form) {
            alert("Formularz został wysłany poprawnie!");
            form.submit();
        }
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
}

APP.smoothScroll = () => {
    $('.header__container .logo__container, .footer__grid .col__logo .link-to-main-site').on('click', function (e) {
        e.preventDefault();

        $('html, body').animate({
            scrollTop: $('#hero').offset().top
        }, 800);
    });
}

$document.ready(function () {
    APP.gsapRegisterPlugins()
    APP.inputMasks()
    APP.customMargquee()
    APP.createSlider('.garanties-swiper')
    APP.createSlider('.opportunities-slider')
    APP.createSlider('.benefit-slider')
    APP.accordions()
    APP.splitChars()
    APP.createGSAPAnimation()
    APP.createSimpleBar()
    APP.createTermsPopUp()
    APP.createFormPopUp()
    APP.formValidate()
    APP.smoothScroll()
})