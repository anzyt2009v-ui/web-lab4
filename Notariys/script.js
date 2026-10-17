    (function () {
      const menuToggle = document.querySelector(".menu-toggle");
      const navLinks = document.querySelector(".nav-links");
      const modal = document.getElementById("contactModal");
      const modalClose = document.querySelector(".modal-close");
      const contactForm = document.getElementById("contactForm");
      const formResult = document.getElementById("formResult");
      const resultText = document.getElementById("resultText");
      const copyMessage = document.getElementById("copyMessage");
      const submitButton = contactForm ? contactForm.querySelector('[type="submit"]') : null;
      const nameField = document.getElementById("clientName");
      const phoneField = document.getElementById("clientPhone");
      const questionField = document.getElementById("clientQuestion");
      const questionCount = document.getElementById("questionCount");
      let preparedMessage = "";
      let lastFocusedElement = null;

      const year = document.getElementById("year");
      if (year) year.textContent = String(new Date().getFullYear());

      let readingProgress = document.querySelector(".reading-progress");
      let readingProgressBar = document.getElementById("readingProgressBar");
      if (!readingProgress) {
        readingProgress = document.createElement("div");
        readingProgress.className = "reading-progress";
        readingProgress.setAttribute("aria-hidden", "true");
        readingProgressBar = document.createElement("span");
        readingProgressBar.id = "readingProgressBar";
        readingProgress.appendChild(readingProgressBar);
        document.body.appendChild(readingProgress);
      }

      let backToTop = document.querySelector(".back-to-top");
      if (!backToTop) {
        backToTop = document.createElement("button");
        backToTop.className = "back-to-top";
        backToTop.type = "button";
        backToTop.setAttribute("aria-label", "Повернутися на початок сторінки");
        backToTop.title = "На початок сторінки";
        backToTop.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 14 6-6 6 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        document.body.appendChild(backToTop);
      }
      backToTop.addEventListener("click", () => window.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
      }));

      let scrollFrame = 0;
      function updateScrollChrome() {
        scrollFrame = 0;
        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollableHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollableHeight)) : 0;
        readingProgressBar.style.transform = "scaleX(" + progress + ")";
        backToTop.classList.toggle("is-visible", window.scrollY > 460);
      }

      window.addEventListener("scroll", () => {
        if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScrollChrome);
      }, { passive: true });
      window.addEventListener("resize", updateScrollChrome, { passive: true });
      updateScrollChrome();

      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries, currentObserver) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              currentObserver.unobserve(entry.target);
            }
          });
        }, { threshold: 0.12 });
        document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
      } else {
        document.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
      }

      const serviceSearch = document.getElementById("serviceSearch");
      const serviceResults = document.getElementById("serviceResults");
      if (serviceSearch && serviceResults) {
        const clearSearch = document.querySelector(".finder-clear");
        const searchShortcut = document.querySelector(".finder-shortcut");
        const serviceOptions = [
          {
            title: "Нерухомість і договори",
            url: "real-estate.html",
            description: "Продаж, дарування, купівля нерухомості та підготовка до правочину.",
            keywords: ["нерухом", "квартир", "будин", "земл", "прод", "куп", "дарув", "майн", "ділян", "продаж", "купівл"]
          },
          {
            title: "Спадщина",
            url: "inheritance.html",
            description: "Оформлення спадкових прав, заповіт і питання спадкової справи.",
            keywords: ["спадщ", "спадк", "запов", "помер", "померл", "спадкоєм", "родин", "свідоцтв"]
          },
          {
            title: "Довіреності та заяви",
            url: "powers-of-attorney.html",
            description: "Представництво за довіреністю, повноваження та нотаріальні заяви.",
            keywords: ["довір", "представ", "авто", "машин", "транспорт", "зая", "повноваж"]
          },
          {
            title: "Засвідчення документів",
            url: "certifications.html",
            description: "Засвідчення копій, підпису та документів для подання за місцем вимоги.",
            keywords: ["копі", "копію", "засвідч", "завір", "підпис", "переклад", "оригінал", "документ"]
          },
          {
            title: "Договори та правочини",
            url: "contracts.html",
            description: "Умови договору, нотаріальне посвідчення та консультація перед підписанням.",
            keywords: ["догов", "контракт", "підпис", "подруж", "шлюб", "угод", "домовлен"]
          },
          {
            title: "Інші нотаріальні дії",
            url: "other-services.html",
            description: "Допоможемо розібратися, чи належить ваше питання до компетенції нотаріуса.",
            keywords: ["нотар", "інш", "інше", "не знаю", "порад", "консультац", "заява", "депозит"]
          },
          {
            title: "Вартість послуг",
            url: "prices.html",
            description: "Дізнайтеся, що впливає на розрахунок і які загальні відомості допоможуть уточнити суму.",
            keywords: ["варт", "кошту", "ціна", "цін", "прайс", "тариф", "оплат", "скільки", "розрахунок"]
          }
        ];

        const normalizeSearch = (value) => value
          .toLocaleLowerCase("uk-UA")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[’'`]/g, "")
          .replace(/[^\p{L}\p{N}\s-]/gu, " ")
          .trim();

        function renderServiceSuggestions(rawQuery) {
          const query = normalizeSearch(rawQuery);
          serviceResults.replaceChildren();
          if (!query) {
            const placeholder = document.createElement("span");
            placeholder.className = "finder-placeholder";
            placeholder.textContent = "Почніть вводити запит або виберіть приклад вище.";
            serviceResults.appendChild(placeholder);
            return;
          }

          const tokens = query.split(/\s+/).filter((token) => token.length > 2);
          const matches = serviceOptions.map((service) => {
            const score = service.keywords.reduce((total, keyword) => {
              const normalizedKeyword = normalizeSearch(keyword);
              const phraseMatch = query.includes(normalizedKeyword);
              const tokenMatch = tokens.some((token) =>
                token.startsWith(normalizedKeyword) || normalizedKeyword.startsWith(token)
              );
              return total + (phraseMatch ? 3 : tokenMatch ? 1 : 0);
            }, 0);
            return { service, score };
          }).filter((match) => match.score > 0)
            .sort((left, right) => right.score - left.score);

          if (matches.length === 0) {
            const empty = document.createElement("div");
            empty.className = "finder-empty";
            const message = document.createElement("p");
            message.textContent = "За цим формулюванням не вдалося визначити напрям. Спробуйте коротший запит: «квартира», «спадщина», «довіреність», «копія» або «вартість».";
            const link = document.createElement("a");
            link.href = "other-services.html";
            link.textContent = "Переглянути інші нотаріальні дії ↗";
            const priceLink = document.createElement("a");
            priceLink.href = "prices.html";
            priceLink.textContent = "Переглянути інформацію про вартість ↗";
            empty.append(message, link);
            empty.appendChild(priceLink);
            serviceResults.appendChild(empty);
            return;
          }

          const bestScore = matches[0].score;
          const suggestions = matches.filter((match) => match.score >= Math.max(1, bestScore - 1)).slice(0, 3);
          const heading = document.createElement("span");
          heading.className = "finder-result-label";
          heading.textContent = suggestions.length === 1
            ? "Можливо, вам підійде цей напрям:"
            : "Можуть підійти кілька напрямів:";
          const list = document.createElement("div");
          list.className = "finder-result-list";

          suggestions.forEach(({ service }) => {
            const link = document.createElement("a");
            link.className = "finder-result";
            link.href = service.url;
            const copy = document.createElement("span");
            const title = document.createElement("strong");
            title.textContent = service.title;
            const description = document.createElement("span");
            description.textContent = service.description;
            copy.append(title, description);
            const arrow = document.createElement("span");
            arrow.className = "finder-result-arrow";
            arrow.setAttribute("aria-hidden", "true");
            arrow.textContent = "↗";
            link.append(copy, arrow);
            list.appendChild(link);
          });

          const note = document.createElement("p");
          note.className = "finder-disclaimer";
          note.textContent = "Це попередня підказка, а не юридичний висновок. Точний порядок дій залежить від обставин.";
          serviceResults.append(heading, list, note);
        }

        function updateServiceSearch() {
          renderServiceSuggestions(serviceSearch.value);
          if (clearSearch) clearSearch.hidden = !serviceSearch.value;
          if (searchShortcut) searchShortcut.hidden = Boolean(serviceSearch.value);
        }

        serviceSearch.addEventListener("input", updateServiceSearch);
        if (clearSearch) {
          clearSearch.addEventListener("click", () => {
            serviceSearch.value = "";
            updateServiceSearch();
            serviceSearch.focus();
          });
        }
        document.querySelectorAll("[data-service-example]").forEach((button) => {
          button.addEventListener("click", () => {
            serviceSearch.value = button.dataset.serviceExample;
            updateServiceSearch();
            serviceSearch.focus();
          });
        });
        document.addEventListener("keydown", (event) => {
          const target = event.target;
          const editing = target instanceof HTMLElement &&
            (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
          if (editing || event.altKey || event.shiftKey || modal && modal.classList.contains("is-open")) return;
          if (event.key === "/" && !event.ctrlKey && !event.metaKey ||
              event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            serviceSearch.focus();
          }
        });
      }

      const checklist = document.querySelector(".checklist-panel");
      if (checklist) {
        const checkboxes = Array.from(checklist.querySelectorAll('input[type="checkbox"]'));
        const progressLabel = document.getElementById("checklistProgress");
        const progressBar = document.getElementById("checklistMeter");
        const progressTrack = checklist.querySelector('[role="progressbar"]');
        const resetButton = checklist.querySelector(".checklist-reset");
        function updateChecklist() {
          const completed = checkboxes.filter((checkbox) => checkbox.checked).length;
          if (progressLabel) {
            progressLabel.textContent = completed === checkboxes.length
              ? "Усе готово"
              : completed + " із " + checkboxes.length + " готово";
          }
          if (progressBar) progressBar.style.width = (checkboxes.length ? completed / checkboxes.length * 100 : 0) + "%";
          if (progressTrack) progressTrack.setAttribute("aria-valuenow", String(completed));
        }
        checkboxes.forEach((checkbox) => checkbox.addEventListener("change", updateChecklist));
        if (resetButton) {
          resetButton.addEventListener("click", () => {
            checkboxes.forEach((checkbox) => { checkbox.checked = false; });
            updateChecklist();
            if (checkboxes.length) checkboxes[0].focus();
          });
        }
        updateChecklist();
      }

      const transitionMarkup = `
        <div class="page-transition__scene" aria-hidden="true">
          <svg class="transition-room" viewBox="0 0 800 440" fill="none">
            <defs>
              <linearGradient id="desk-gradient" x1="90" y1="320" x2="720" y2="380" gradientUnits="userSpaceOnUse"><stop stop-color="#8C6944"/><stop offset=".5" stop-color="#C49A62"/><stop offset="1" stop-color="#79583B"/></linearGradient>
              <radialGradient id="screen-glow" cx="0" cy="0" r="1" gradientTransform="matrix(120 0 0 100 530 178)" gradientUnits="userSpaceOnUse"><stop stop-color="#E4C99D" stop-opacity=".36"/><stop offset="1" stop-color="#E4C99D" stop-opacity="0"/></radialGradient>
              <linearGradient id="monitor-gradient" x1="470" y1="110" x2="660" y2="255" gradientUnits="userSpaceOnUse"><stop stop-color="#345C50"/><stop offset="1" stop-color="#102622"/></linearGradient>
            </defs>
            <path d="M0 344h800v96H0z" fill="#10231F"/>
            <path d="M0 344h800" stroke="#547066" stroke-opacity=".42"/>
            <path d="M488 131c0-7 6-13 13-13h172c7 0 13 6 13 13v117H488V131Z" fill="#172F2A" stroke="#B88D58" stroke-opacity=".8"/>
            <path d="M500 132h174v102H500z" fill="url(#monitor-gradient)"/>
            <path class="transition-screen" d="M500 132h174v102H500z" fill="url(#screen-glow)"/>
            <path d="M520 202h74M520 213h104M520 224h55" stroke="#E4C99D" stroke-opacity=".48" stroke-width="2" stroke-linecap="round"/>
            <path d="M569 248v35m-28 0h56" stroke="#B88D58" stroke-width="5" stroke-linecap="round"/>
            <path d="m545 284 26-25 27 25" fill="#182E29" stroke="#B88D58" stroke-width="1.4"/>
            <path d="M214 161v111" stroke="#8C6944" stroke-opacity=".5"/>
            <path d="M166 162h98M184 177h70M197 192h57" stroke="#E4C99D" stroke-opacity=".16" stroke-width="1"/>
            <circle cx="710" cy="94" r="28" stroke="#E4C99D" stroke-opacity=".16"/>
            <circle cx="710" cy="94" r="44" stroke="#E4C99D" stroke-opacity=".08"/>
            <path d="M110 321h584l-24 18H91l19-18Z" fill="url(#desk-gradient)"/>
            <path d="M91 339h603" stroke="#E7C99A" stroke-opacity=".5"/>
            <path d="M137 341v79m515-79v79" stroke="#79583B" stroke-width="7"/>
            <path d="m337 319 81-18 78 18-79 11-80-11Z" fill="#E4C99D" fill-opacity=".58" stroke="#E4C99D" stroke-opacity=".5"/>
            <path d="m357 316 61-13 57 13-58 8-60-8Z" stroke="#19352D" stroke-opacity=".7"/>
            <path d="M276 249v78m0-68h33v68" stroke="#C49A62" stroke-opacity=".68" stroke-width="5" stroke-linecap="round"/>
            <path d="M267 327h56" stroke="#C49A62" stroke-width="6" stroke-linecap="round"/>
            <path d="M277 255c0-13 10-23 23-23h14" stroke="#C49A62" stroke-width="6" stroke-linecap="round"/>
            <g class="transition-person">
              <path d="M342 259c2-32 25-54 57-54 24 0 41 11 53 31l11 27-27 16-35-19-37 21-22-22Z" fill="#D8B88A"/>
              <path d="M380 261h65l14 57h-87l8-57Z" fill="#29483D"/>
              <path d="M397 315 377 348l26 34 18-8-13-27 36-17" fill="#233B34"/>
              <path d="m438 333 41 22-8 18-48-11-17-18" fill="#233B34"/>
              <path d="m384 355-27 12 5 17 44-5-8-18" fill="#C49A62"/>
              <path d="m456 354 29 12-5 17-40-3 1-17" fill="#C49A62"/>
              <path d="M379 220c4-24 20-37 41-37 18 0 32 12 34 32-4 14-15 22-33 24-20-2-34-8-42-19Z" fill="#344A3D"/>
              <path d="M409 184c19-10 42 1 46 20-7 11-21 17-38 15-9-7-12-20-8-35Z" fill="#D8B88A"/>
              <path d="M399 182c7-16 26-23 42-14l13 12-15 5-21-3-19 9v-9Z" fill="#26372F"/>
              <path d="M437 244c20 2 37 15 48 30l31 4" stroke="#D8B88A" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="m445 261 39 17" stroke="#344A3D" stroke-width="8" stroke-linecap="round"/>
              <circle cx="518" cy="279" r="7" fill="#D8B88A"/>
              <path d="M338 425h72m52 0h59" stroke="#101C19" stroke-width="9" stroke-linecap="round"/>
            </g>
            <path d="m721 307 18-52 18 52h-36Z" fill="#B88D58"/>
            <path d="M728 306v-35m11 35v-35M714 310h49" stroke="#E4C99D" stroke-width="2" stroke-linecap="round"/>
            <path d="m712 250 27-35 27 35" fill="#E4C99D" fill-opacity=".16"/>
            <circle cx="740" cy="306" r="4" fill="#E4C99D"/>
          </svg>
          <span class="page-transition__desk-glow"></span>
          <div class="page-transition__caption">
            <span class="page-transition__overline">НОТАРІАЛЬНА ПРАКТИКА АНЦУТ</span>
            <strong>Влаштовуємося зручно.</strong>
            <span class="page-transition__status">Сідаємо за роботу над вашою справою…</span>
            <span class="page-transition__progress"><span></span></span>
          </div>
          <span class="page-transition__skip">ПЕРЕХІД НА СТОРІНКУ</span>
        </div>`;
      const pageTransition = document.createElement("div");
      pageTransition.className = "page-transition";
      pageTransition.setAttribute("aria-hidden", "true");
      pageTransition.innerHTML = transitionMarkup;
      document.body.appendChild(pageTransition);

      const transitionStorageKey = "notariys-page-transition";
      const lastTransitionKey = "notariys-last-transition";
      const transitionVariants = [
        { name: "desk", title: "Влаштовуємося зручно.", status: "Сідаємо за роботу над вашою справою…", duration: 1650 },
        { name: "curtain", title: "Відкриваємо потрібний розділ.", status: "Переходимо до потрібної інформації…", duration: 1250 },
        { name: "seal", title: "Печатка готова до справи.", status: "Готуємо сторінку до перегляду…", duration: 1350 },
        { name: "slide", title: "Наступна сторінка вже поруч.", status: "Перемикаємося на обраний напрям…", duration: 1200 }
      ];
      let lastTransitionVariant = "";
      try {
        const arrival = sessionStorage.getItem(transitionStorageKey);
        sessionStorage.removeItem(transitionStorageKey);
        if (arrival) {
          const [arrivalPath, arrivalTime, arrivalVariant] = arrival.split("|");
          const arrivalAge = Date.now() - Number(arrivalTime);
          const variant = transitionVariants.find((item) => item.name === arrivalVariant) || transitionVariants[0];
          if (arrivalPath === window.location.pathname &&
              Number.isFinite(Number(arrivalTime)) &&
              arrivalAge >= 0 && arrivalAge < 10000 &&
              !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            lastTransitionVariant = variant.name;
            pageTransition.classList.add("page-transition--" + variant.name);
            pageTransition.style.setProperty("--transition-duration", variant.duration + "ms");
            pageTransition.classList.add("is-active", "is-arriving");
            pageTransition.setAttribute("aria-hidden", "false");
            document.body.classList.add("page-transitioning");
            pageTransition.querySelector(".page-transition__caption strong").textContent = variant.title;
            pageTransition.querySelector(".page-transition__status").textContent = variant.status;
            window.setTimeout(() => {
              pageTransition.classList.remove("is-active", "is-arriving");
              pageTransition.classList.remove("page-transition--" + variant.name);
              pageTransition.setAttribute("aria-hidden", "true");
              document.body.classList.remove("page-transitioning");
            }, variant.name === "desk" ? 220 : 560);
          }
        }
      } catch (error) {
        // Storage may be disabled; outgoing transitions still work without the arrival fade.
      }
      let navigationPending = false;
      document.addEventListener("click", (event) => {
        const link = event.target.closest("a[href]");
        if (!link || event.defaultPrevented || event.button !== 0 ||
            event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
            link.hasAttribute("download") || (link.target && link.target !== "_self")) return;

        const destination = new URL(link.href, window.location.href);
        if (destination.origin !== window.location.origin ||
            !destination.pathname.endsWith(".html") ||
            destination.pathname === window.location.pathname) return;

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        event.preventDefault();
        if (navigationPending) return;
        navigationPending = true;
        let previousVariant = lastTransitionVariant;
        try {
          previousVariant = sessionStorage.getItem(lastTransitionKey) || previousVariant;
        } catch (error) {
          // Continue with an in-memory previous choice when browser storage is disabled.
        }
        const availableVariants = transitionVariants.filter((variant) => variant.name !== previousVariant);
        const variant = availableVariants[Math.floor(Math.random() * availableVariants.length)];
        lastTransitionVariant = variant.name;
        pageTransition.classList.add("page-transition--" + variant.name);
        pageTransition.style.setProperty("--transition-duration", variant.duration + "ms");
        pageTransition.querySelector(".page-transition__caption strong").textContent = variant.title;
        pageTransition.querySelector(".page-transition__status").textContent = variant.status;
        try {
          sessionStorage.setItem(lastTransitionKey, variant.name);
          sessionStorage.setItem(transitionStorageKey, destination.pathname + "|" + Date.now() + "|" + variant.name);
        } catch (error) {
          // Keep navigation available when browser storage is disabled.
        }
        pageTransition.classList.add("is-active");
        pageTransition.setAttribute("aria-hidden", "false");
        document.body.classList.add("page-transitioning");
        window.setTimeout(() => {
          window.location.assign(destination.href);
        }, variant.duration);
      });

      if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
          const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
          menuToggle.setAttribute("aria-expanded", String(!isOpen));
          menuToggle.setAttribute("aria-label", isOpen ? "Відкрити меню" : "Закрити меню");
          navLinks.classList.toggle("is-open", !isOpen);
          document.body.classList.toggle("menu-open", !isOpen);
        });

        navLinks.querySelectorAll("a").forEach((link) => {
          link.addEventListener("click", () => {
            navLinks.classList.remove("is-open");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Відкрити меню");
            document.body.classList.remove("menu-open");
          });
        });
      }
      document.querySelectorAll(".faq-question").forEach((button) => {
        button.addEventListener("click", () => {
          const item = button.closest(".faq-item");
          const shouldOpen = !item.classList.contains("is-open");
          document.querySelectorAll(".faq-item").forEach((faqItem) => {
            faqItem.classList.remove("is-open");
            faqItem.querySelector(".faq-question").setAttribute("aria-expanded", "false");
          });
          if (shouldOpen) {
            item.classList.add("is-open");
            button.setAttribute("aria-expanded", "true");
          }
        });
      });

      function openModal() {
        if (!modal) return;
        lastFocusedElement = document.activeElement;
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
        window.setTimeout(() => document.getElementById("clientName").focus(), 50);
      }

      function closeModal() {
        if (!modal) return;
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
        if (lastFocusedElement) lastFocusedElement.focus();
      }

      if (modal && modalClose) {
        document.querySelectorAll("[data-open-modal]").forEach((button) => button.addEventListener("click", openModal));
        modalClose.addEventListener("click", closeModal);
        modal.addEventListener("click", (event) => {
          if (event.target === modal) closeModal();
        });
        document.addEventListener("keydown", (event) => {
          if (!modal.classList.contains("is-open")) return;
          if (event.key === "Escape") {
            event.preventDefault();
            closeModal();
            return;
          }
          if (event.key !== "Tab") return;
          const focusable = Array.from(modal.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )).filter((element) => element.getClientRects().length > 0);
          if (!focusable.length) {
            event.preventDefault();
            modalClose.focus();
            return;
          }
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) {
            event.preventDefault();
            first.focus();
          }
        });
      }

      if (contactForm && formResult && resultText && copyMessage && submitButton) {
        function updateQuestionCount() {
          if (questionField && questionCount) {
            questionCount.textContent = questionField.value.length + " / " + questionField.maxLength;
          }
        }
        function validatePhone() {
          if (!phoneField) return;
          const phone = phoneField.value.trim();
          const digits = phone.replace(/\D/g, "");
          const acceptedCharacters = /^[+\d()\s.-]+$/.test(phone);
          phoneField.setCustomValidity(
            !phone || acceptedCharacters && digits.length >= 7
              ? ""
              : "Вкажіть номер щонайменше із 7 цифрами; використовуйте лише цифри, +, дужки, пробіли, крапки або дефіси."
          );
        }
        function validateTrimmedField(field, label) {
          if (field) {
            field.setCustomValidity(
              field.value.trim() ? "" : "Заповніть поле: " + label + "."
            );
          }
        }
        if (phoneField) phoneField.addEventListener("input", validatePhone);
        if (nameField) nameField.addEventListener("input", () => validateTrimmedField(nameField, "ім’я"));
        if (questionField) questionField.addEventListener("input", () => validateTrimmedField(questionField, "питання"));
        if (questionField) questionField.addEventListener("input", updateQuestionCount);
        updateQuestionCount();

        contactForm.addEventListener("input", () => {
          preparedMessage = "";
          formResult.classList.remove("is-visible");
          copyMessage.lastChild.textContent = "Скопіювати звернення";
        });

        contactForm.addEventListener("submit", (event) => {
          event.preventDefault();
          validateTrimmedField(nameField, "ім’я");
          validatePhone();
          validateTrimmedField(questionField, "питання");
          if (!contactForm.reportValidity()) return;
          const formData = new FormData(contactForm);
          const submission = {
            name: String(formData.get("name")).trim(),
            phone: String(formData.get("phone")).trim(),
            question: String(formData.get("question")).trim()
          };

          preparedMessage = [
            "Звернення до нотаріусів Людмили та Олександра Анцут",
            "",
            "Ім'я: " + submission.name,
            "Телефон: " + submission.phone,
            "Питання: " + submission.question
          ].join("\n");
          resultText.textContent = "Перевірку виконано у вашому браузері. Дані не надсилалися й не зберігалися. Текст звернення готовий — скопіюйте його та надішліть нотаріусам самостійно.";
          formResult.classList.add("is-visible");
        });

        copyMessage.addEventListener("click", async () => {
          if (!preparedMessage) return;
          try {
            await navigator.clipboard.writeText(preparedMessage);
            copyMessage.lastChild.textContent = "Скопійовано";
          } catch (error) {
            const temporary = document.createElement("textarea");
            temporary.value = preparedMessage;
            temporary.setAttribute("readonly", "");
            temporary.className = "clipboard-temporary";
            document.body.appendChild(temporary);
            temporary.select();
            const copied = document.execCommand("copy");
            temporary.remove();
            if (copied) {
              copyMessage.lastChild.textContent = "Скопійовано";
            } else {
              resultText.textContent = "Не вдалося скопіювати автоматично. Виділіть і скопіюйте підготовлений текст вручну.";
              const textBlock = document.createElement("pre");
              textBlock.textContent = preparedMessage;
              textBlock.className = "clipboard-fallback";
              formResult.appendChild(textBlock);
            }
          }
        });
      }
    }());
