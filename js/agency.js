/*!
 * Start Bootstrap - Agnecy Bootstrap Theme (http://startbootstrap.com)
 * Code licensed under the Apache License v2.0.
 * For details, see http://www.apache.org/licenses/LICENSE-2.0.
 */

(function() {
    function clearModalHashIfPresent() {
        if (!/^#portfolioModal/i.test(window.location.hash || '')) return;
        if (window.history && window.history.replaceState) {
            window.history.replaceState(
                null,
                document.title,
                window.location.pathname + window.location.search
            );
        } else {
            window.location.hash = '';
        }
    }

    var links = Array.prototype.slice.call(document.querySelectorAll('.navbar-default .nav li:not(.hidden) a.page-scroll'));
    var nav = document.querySelector('.navbar-default');
    if (!links.length || !nav) return;
    var homeLink = links.find(function(link) { return link.getAttribute('href') === '#page-top'; }) || null;
    var sectionLinks = links.map(function(link) {
        var href = link.getAttribute('href');
        if (!href || href.charAt(0) !== '#' || href === '#page-top') return null;
        var section = document.querySelector(href);
        if (!section) return null;
        return { link: link, section: section };
    }).filter(Boolean);

    function navHeight() {
        return nav.getBoundingClientRect().height || 0;
    }

    var currentActiveLink = null;
    var clickLockUntil = 0;

    function setActive(link) {
        if (link === currentActiveLink) return;
        if (currentActiveLink) {
            currentActiveLink.classList.remove('is-active');
            if (currentActiveLink.parentElement) currentActiveLink.parentElement.classList.remove('active');
            currentActiveLink.style.backgroundColor = '';
            currentActiveLink.style.color = '';
            currentActiveLink.style.borderRadius = '';
        }
        currentActiveLink = link;
        if (!link) return;
        link.classList.add('is-active');
        if (link.parentElement) link.parentElement.classList.add('active');
        link.style.backgroundColor = '#252525';
        link.style.color = '#fff';
        link.style.borderRadius = '3px';
    }

    function overlapLength(rect, top, bottom) {
        return Math.max(0, Math.min(rect.bottom, bottom) - Math.max(rect.top, top));
    }

    var headerSection = document.querySelector('header');

    function getSectionForLink(link) {
        if (link === homeLink) return headerSection;
        var found = null;
        sectionLinks.forEach(function(item) { if (item.link === link) found = item.section; });
        return found;
    }

    function updateActiveNav() {
        if (Date.now() < clickLockUntil) return;
        if (window.pageYOffset < 50 && links[0]) {
            setActive(links[0]);
            return;
        }
        var nearBottom = window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 10;
        var bandTop = window.innerHeight * 0.3;
        var bandBottom = window.innerHeight * 0.7;
        var bestOverlap = -1;
        var bestLink = homeLink || links[0] || null;

        if (homeLink && headerSection) {
            var headerOverlap = overlapLength(headerSection.getBoundingClientRect(), bandTop, bandBottom);
            if (headerOverlap > bestOverlap) {
                bestOverlap = headerOverlap;
                bestLink = homeLink;
            }
        }

        sectionLinks.forEach(function(item) {
            var overlap = overlapLength(item.section.getBoundingClientRect(), bandTop, bandBottom);
            if (overlap >= bestOverlap) {
                bestOverlap = overlap;
                bestLink = item.link;
            }
        });

        if (nearBottom && sectionLinks.length) {
            setActive(sectionLinks[sectionLinks.length - 1].link);
            return;
        }

        if (bestLink !== currentActiveLink && currentActiveLink !== null) {
            var currentSection = getSectionForLink(currentActiveLink);
            var currentOverlap = currentSection ? overlapLength(currentSection.getBoundingClientRect(), bandTop, bandBottom) : 0;
            if (bestOverlap <= currentOverlap + 30) return;
        }

        setActive(bestLink);
    }

    links.forEach(function(link) {
        link.addEventListener('click', function(e) {
            var href = link.getAttribute('href');
            if (!href || href.charAt(0) !== '#') return;
            var target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            setActive(link);
            clickLockUntil = Date.now() + 900;
            var top = Math.max(0, target.getBoundingClientRect().top + window.pageYOffset - navHeight());
            if (window.__revealAllSections) window.__revealAllSections();
            if (window.jQuery && window.jQuery.fn && window.jQuery.fn.animate) {
                window.jQuery('html, body').stop(true).animate({ scrollTop: top }, 700, 'easeInOutCubic');
            } else {
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
            if (window.jQuery) {
                window.jQuery('.navbar-toggle:visible').click();
            }
            clearModalHashIfPresent();
        });
    });

    var brandLink = document.querySelector('.navbar-brand[href="#page-top"]');
    if (brandLink) {
        brandLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            history.replaceState(null, '', window.location.pathname);
        });
    }

    window.addEventListener('hashchange', clearModalHashIfPresent);
    window.addEventListener('scroll', updateActiveNav, { passive: true });
    window.addEventListener('resize', updateActiveNav);
    window.addEventListener('load', function() {
        clearModalHashIfPresent();
        updateActiveNav();
    });
    updateActiveNav();
})();

// Enforce portfolio card order across prebuilt pages that may contain stale HTML order.
(function() {
    var desiredOrder = ['17', '4', '3', '13', '18', '2', '6', '10', '5', '8', '9', '7', '1', '12', '16', '15', '14', '11'];
    window.__portfolioDesiredOrder = desiredOrder.slice();

    function getModalId(item) {
        var trigger = item.querySelector('.portfolio-link');
        if (!trigger) return null;
        var target = trigger.getAttribute('data-target') || trigger.getAttribute('href') || '';
        var match = target.match(/portfolioModal(\d+)/i);
        return match ? match[1] : null;
    }

    function applyPortfolioOrder() {
        var items = Array.prototype.slice.call(document.querySelectorAll('#portfolio .portfolio-item'));
        if (!items.length) return;

        var container = items[0].parentElement;
        if (!container) return;

        var idToItem = {};
        items.forEach(function(item) {
            var id = getModalId(item);
            if (!id) return;
            idToItem[id] = item;
        });

        var used = {};
        desiredOrder.forEach(function(id) {
            var item = idToItem[id];
            if (!item) return;
            used[id] = true;
            container.appendChild(item);
        });

        items.forEach(function(item) {
            var id = getModalId(item);
            if (id && used[id]) return;
            container.appendChild(item);
        });
    }

    document.addEventListener('DOMContentLoaded', applyPortfolioOrder);
    window.addEventListener('load', applyPortfolioOrder);
})();

// Force-enable contact form fields in case global styles/plugins lock interaction.
(function() {
    function unlockContactFields() {
        var fields = document.querySelectorAll('#contact input, #contact textarea, #contact select');
        if (!fields.length) return;
        fields.forEach(function(field) {
            field.removeAttribute('readonly');
            field.removeAttribute('disabled');
            field.style.pointerEvents = 'auto';
            field.style.caretColor = '#f0f0f0';
            field.style.userSelect = 'text';
            field.setAttribute('tabindex', '0');
        });
    }

    document.addEventListener('DOMContentLoaded', unlockContactFields);
    window.addEventListener('load', unlockContactFields);
})();

if (window.jQuery) {
    function getModalIdFromTarget(target) {
        var match = (target || '').match(/portfolioModal(\d+)/i);
        return match ? match[1] : null;
    }

    var modalOriginUrl = null;
    var isModalSwitching = false;

    function getCurrentUrl() {
        return window.location.pathname + window.location.search + window.location.hash;
    }

    function captureModalOriginUrl() {
        if (modalOriginUrl !== null) return;
        modalOriginUrl = getCurrentUrl();
    }

    function updateUrlForModal(modal) {
        var modalEl = modal && modal.length ? modal : window.jQuery(modal);
        if (!modalEl || !modalEl.length) return;

        var postUrl = modalEl.attr('data-post-url');
        if (!postUrl || !window.history || !window.history.replaceState) return;
        window.history.replaceState(null, document.title, postUrl);
    }

    function restoreModalOriginUrl() {
        if (modalOriginUrl === null) return;
        if (window.history && window.history.replaceState) {
            window.history.replaceState(null, document.title, modalOriginUrl);
        }
        modalOriginUrl = null;
    }

    function reorderModalReels() {
        var desiredOrder = Array.isArray(window.__portfolioDesiredOrder) ? window.__portfolioDesiredOrder : [];
        if (!desiredOrder.length) return;

        var reels = Array.prototype.slice.call(document.querySelectorAll('.portfolio-modal .modal-reel'));
        reels.forEach(function(reel) {
            var buttons = Array.prototype.slice.call(reel.querySelectorAll('.modal-reel-btn'));
            if (!buttons.length) return;

            var idToButton = {};
            var leftovers = [];
            buttons.forEach(function(button) {
                var modalId = getModalIdFromTarget(button.getAttribute('data-target'));
                if (!modalId || idToButton[modalId]) {
                    leftovers.push(button);
                    return;
                }
                idToButton[modalId] = button;
            });

            var ordered = [];
            desiredOrder.forEach(function(id) {
                var button = idToButton[id];
                if (!button) return;
                reel.appendChild(button);
                ordered.push(button);
                delete idToButton[id];
            });

            Object.keys(idToButton).forEach(function(id) {
                var button = idToButton[id];
                reel.appendChild(button);
                ordered.push(button);
            });

            leftovers.forEach(function(button) {
                reel.appendChild(button);
                ordered.push(button);
            });
        });
    }

    function syncModalReelActive(modal) {
        var modalEl = modal && modal.length ? modal : window.jQuery(modal);
        if (!modalEl || !modalEl.length) return;

        var modalId = getModalIdFromTarget('#' + (modalEl.attr('id') || ''));
        if (!modalId) return;

        modalEl.find('.modal-reel-btn').each(function() {
            var button = window.jQuery(this);
            var buttonId = getModalIdFromTarget(button.attr('data-target'));
            button.toggleClass('is-active', buttonId === modalId);
        });
    }

    function clampReelScrollLeft(reel, left) {
        var maxLeft = Math.max(0, reel.scrollWidth - reel.clientWidth);
        return Math.max(0, Math.min(maxLeft, left));
    }

    function centerReelOnActiveButton(reel) {
        if (!reel || !reel.clientWidth) return;

        var activeBtn = reel.querySelector('.modal-reel-btn.is-active');
        if (!activeBtn) return;
        var buttons = Array.prototype.slice.call(reel.querySelectorAll('.modal-reel-btn'));
        var activeIndex = buttons.indexOf(activeBtn);
        var reelStyle = window.getComputedStyle ? window.getComputedStyle(reel) : null;
        var reelGap = 0;
        if (reelStyle) {
            reelGap = parseFloat(reelStyle.columnGap || reelStyle.gap || '0') || 0;
        }
        var measuredWidth = activeBtn.getBoundingClientRect().width;
        if (!measuredWidth && buttons.length) {
            measuredWidth = buttons[0].getBoundingClientRect().width;
        }
        if (!measuredWidth) {
            measuredWidth = 84;
        }

        if (typeof activeBtn.scrollIntoView === 'function') {
            try {
                activeBtn.scrollIntoView({
                    behavior: 'auto',
                    block: 'nearest',
                    inline: 'center'
                });
            } catch (e) {
                activeBtn.scrollIntoView(false);
            }
        }

        var targetLeft = activeBtn.offsetLeft + (activeBtn.offsetWidth / 2) - (reel.clientWidth / 2);
        if (activeIndex >= 0 && measuredWidth > 0) {
            var estimatedLeft = activeIndex * (measuredWidth + reelGap);
            targetLeft = estimatedLeft + (measuredWidth / 2) - (reel.clientWidth / 2);
        }
        reel.scrollLeft = clampReelScrollLeft(reel, targetLeft);

        var reelRect = reel.getBoundingClientRect();
        var btnRect = activeBtn.getBoundingClientRect();
        if (btnRect.left < reelRect.left || btnRect.right > reelRect.right) {
            var delta = 0;
            if (btnRect.left < reelRect.left) {
                delta = btnRect.left - reelRect.left - 8;
            } else if (btnRect.right > reelRect.right) {
                delta = btnRect.right - reelRect.right + 8;
            }
            reel.scrollLeft = clampReelScrollLeft(reel, reel.scrollLeft + delta);
        }
    }

    function isReelButtonVisible(reel, button) {
        if (!reel || !button) return false;
        var reelRect = reel.getBoundingClientRect();
        var btnRect = button.getBoundingClientRect();
        var leftPad = 6;
        var rightPad = 6;
        return btnRect.left >= reelRect.left + leftPad && btnRect.right <= reelRect.right - rightPad;
    }

    function keepCenteringUntilVisible(modal) {
        var modalEl = modal && modal.length ? modal : window.jQuery(modal);
        if (!modalEl || !modalEl.length) return;

        var attempts = 0;
        var maxAttempts = 36;

        function step() {
            attempts += 1;
            var reel = modalEl.find('.modal-reel').get(0);
            if (!reel || !reel.clientWidth) {
                if (attempts < maxAttempts) window.setTimeout(step, 50);
                return;
            }

            var activeBtn = reel.querySelector('.modal-reel-btn.is-active');
            if (!activeBtn) {
                if (attempts < maxAttempts) window.setTimeout(step, 50);
                return;
            }

            centerReelOnActiveButton(reel);
            if (!isReelButtonVisible(reel, activeBtn) && attempts < maxAttempts) {
                window.setTimeout(step, 50);
                return;
            }

            if (!isReelButtonVisible(reel, activeBtn)) {
                reel.scrollLeft = clampReelScrollLeft(reel, activeBtn.offsetLeft - 8);
            }
        }

        step();
    }

    function centerModalReelActive(modal) {
        var modalEl = modal && modal.length ? modal : window.jQuery(modal);
        if (!modalEl || !modalEl.length) return;

        var reel = modalEl.find('.modal-reel').get(0);
        centerReelOnActiveButton(reel);
    }

    function scheduleModalReelCenter(modal) {
        var modalEl = modal && modal.length ? modal : window.jQuery(modal);
        if (!modalEl || !modalEl.length) return;

        centerModalReelActive(modalEl);
        window.requestAnimationFrame(function() {
            centerModalReelActive(modalEl);
        });
        window.setTimeout(function() {
            centerModalReelActive(modalEl);
        }, 90);
        window.setTimeout(function() {
            centerModalReelActive(modalEl);
        }, 220);
        window.setTimeout(function() {
            centerModalReelActive(modalEl);
        }, 420);

        var activeImg = modalEl.find('.modal-reel-btn.is-active img').get(0);
        if (activeImg && !activeImg.complete) {
            activeImg.addEventListener('load', function() {
                centerModalReelActive(modalEl);
            }, { once: true });
        }

        keepCenteringUntilVisible(modalEl);
    }

    function clearModalHash() {
        if (!/^#portfolioModal/i.test(window.location.hash || '')) return;
        if (window.history && window.history.replaceState) {
            window.history.replaceState(
                null,
                document.title,
                window.location.pathname + window.location.search
            );
        } else {
            window.location.hash = '';
        }
    }

    // Compatibility shim for older cached pages that still use anchor modal triggers.
    window.jQuery(document).on('click', 'a.portfolio-link[href^="#portfolioModal"]', function(e) {
        var target = this.getAttribute('href');
        if (!/^#portfolioModal/i.test(target || '')) return;
        e.preventDefault();
        var modal = window.jQuery(target);
        if (!modal.length) return;
        captureModalOriginUrl();
        syncModalReelActive(modal);
        scheduleModalReelCenter(modal);
        modal.modal('show');
        window.setTimeout(function() { scheduleModalReelCenter(modal); }, 120);
        window.setTimeout(function() { scheduleModalReelCenter(modal); }, 320);
        clearModalHash();
    });

    // Keep reel emphasis correct when opening a modal from the portfolio grid buttons.
    window.jQuery(document).on('click', 'button.portfolio-link[data-target^="#portfolioModal"]', function() {
        var target = this.getAttribute('data-target');
        if (!/^#portfolioModal/i.test(target || '')) return;
        var modal = window.jQuery(target);
        if (!modal.length) return;
        captureModalOriginUrl();
        syncModalReelActive(modal);
        scheduleModalReelCenter(modal);
        window.setTimeout(function() { scheduleModalReelCenter(modal); }, 120);
        window.setTimeout(function() { scheduleModalReelCenter(modal); }, 320);
    });

    window.jQuery('div.modal').on('shown.bs.modal', function() {
        captureModalOriginUrl();
        clearModalHash();
        updateUrlForModal(window.jQuery(this));
        scheduleModalReelCenter(window.jQuery(this));
    });

    window.jQuery('div.modal').on('hidden.bs.modal', function() {
        clearModalHash();
        var anyModalOpen = window.jQuery('.portfolio-modal.in').length > 0;
        if (!isModalSwitching && !anyModalOpen) {
            restoreModalOriginUrl();
        }
    });

    window.jQuery(function() {
        reorderModalReels();

        // If the page is loaded with a modal hash, normalize to portfolio section.
        if (!/^#portfolioModal/i.test(window.location.hash || '')) return;
        var nav = document.querySelector('.navbar-default');
        var portfolio = document.querySelector('#portfolio');
        var offset = nav ? nav.getBoundingClientRect().height : 0;
        if (window.history && window.history.replaceState) {
            window.history.replaceState(
                null,
                document.title,
                window.location.pathname + window.location.search
            );
        } else {
            window.location.hash = '';
        }
        if (portfolio) {
            var top = Math.max(0, portfolio.getBoundingClientRect().top + window.pageYOffset - offset);
            window.scrollTo(0, top);
        }
    });

    window.jQuery(document).on('click', '.portfolio-modal .modal-reel-btn', function(e) {
        e.preventDefault();
        var button = window.jQuery(this);
        var currentModal = button.closest('.portfolio-modal');
        var targetSelector = button.data('target');
        if (!targetSelector || !currentModal.length || currentModal.is(targetSelector)) return;

        var targetModal = window.jQuery(targetSelector);
        if (!targetModal.length) return;

        isModalSwitching = true;
        var currentHadFade = currentModal.hasClass('fade');
        var targetHadFade = targetModal.hasClass('fade');
        if (currentHadFade) currentModal.removeClass('fade');
        if (targetHadFade) targetModal.removeClass('fade');

        currentModal.one('hidden.bs.modal.modalReel', function() {
            targetModal.one('shown.bs.modal.modalReel', function() {
                syncModalReelActive(targetModal);
                scheduleModalReelCenter(targetModal);
                if (currentHadFade) currentModal.addClass('fade');
                if (targetHadFade) targetModal.addClass('fade');
                clearModalHash();
                isModalSwitching = false;
            });
            targetModal.modal('show');
            window.jQuery('body').addClass('modal-open');
        });
        currentModal.modal('hide');
    });

    window.jQuery(document).on('keydown', function(e) {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        var openModal = window.jQuery('.portfolio-modal.in');
        if (!openModal.length) return;
        if (isModalSwitching) return;

        var desiredOrder = Array.isArray(window.__portfolioDesiredOrder) ? window.__portfolioDesiredOrder : [];
        if (!desiredOrder.length) return;

        var currentId = openModal.attr('id') ? openModal.attr('id').replace('portfolioModal', '') : null;
        if (!currentId) return;

        var idx = desiredOrder.indexOf(currentId);
        if (idx === -1) return;

        var nextIdx = e.key === 'ArrowRight' ? idx + 1 : idx - 1;
        if (nextIdx < 0 || nextIdx >= desiredOrder.length) return;

        var targetId = '#portfolioModal' + desiredOrder[nextIdx];
        var targetModal = window.jQuery(targetId);
        if (!targetModal.length) return;

        isModalSwitching = true;
        var currentHadFade = openModal.hasClass('fade');
        var targetHadFade = targetModal.hasClass('fade');
        if (currentHadFade) openModal.removeClass('fade');
        if (targetHadFade) targetModal.removeClass('fade');

        openModal.one('hidden.bs.modal.modalReel', function() {
            targetModal.one('shown.bs.modal.modalReel', function() {
                syncModalReelActive(targetModal);
                scheduleModalReelCenter(targetModal);
                if (currentHadFade) openModal.addClass('fade');
                if (targetHadFade) targetModal.addClass('fade');
                clearModalHash();
                isModalSwitching = false;
            });
            targetModal.modal('show');
            window.jQuery('body').addClass('modal-open');
        });
        openModal.modal('hide');
    });

    function bindModalReelEdgeScroll() {
        var reels = Array.prototype.slice.call(document.querySelectorAll('.portfolio-modal .modal-reel'));
        reels.forEach(function(reel) {
            if (!reel) return;
            var wrapper = reel.closest('.modal-reel-wrap');

            if (reel.dataset.edgeScrollBound === '1') {
                if (typeof reel.__centerActiveReelItem === 'function') {
                    reel.__centerActiveReelItem();
                }
                if (typeof reel.__updateEdgeState === 'function') {
                    reel.__updateEdgeState(null);
                }
                return;
            }
            reel.dataset.edgeScrollBound = '1';

            var direction = 0;
            var rafId = 0;
            var speed = 8;
            var lastMouseX = null;

            function centerActiveReelItem() {
                centerReelOnActiveButton(reel);
            }

            function getEdgeSize() {
                var firstThumb = reel.querySelector('.modal-reel-btn');
                return firstThumb ? firstThumb.getBoundingClientRect().width : 84;
            }

            function updateEdgeState(hoverX) {
                if (!wrapper) return;
                var canScrollLeft = reel.scrollLeft > 0;
                var canScrollRight = reel.scrollLeft + reel.clientWidth < reel.scrollWidth - 1;
                wrapper.classList.toggle('can-scroll-left', canScrollLeft);
                wrapper.classList.toggle('can-scroll-right', canScrollRight);

                var hasHover = typeof hoverX === 'number';
                var edgeSize = getEdgeSize();
                var hoverLeft = hasHover && hoverX <= edgeSize && canScrollLeft;
                var hoverRight = hasHover && hoverX >= reel.clientWidth - edgeSize && canScrollRight;
                wrapper.classList.toggle('edge-hover-left', hoverLeft);
                wrapper.classList.toggle('edge-hover-right', hoverRight);
            }

            reel.__updateEdgeState = updateEdgeState;
            reel.__centerActiveReelItem = centerActiveReelItem;

            function stopScroll() {
                direction = 0;
                if (rafId) {
                    window.cancelAnimationFrame(rafId);
                    rafId = 0;
                }
            }

            function tick() {
                if (!direction) {
                    rafId = 0;
                    return;
                }
                reel.scrollLeft += direction * speed;
                updateEdgeState(lastMouseX);
                rafId = window.requestAnimationFrame(tick);
            }

            function startScroll(nextDirection) {
                if (direction === nextDirection) return;
                direction = nextDirection;
                if (!direction) {
                    stopScroll();
                    return;
                }
                if (!rafId) {
                    rafId = window.requestAnimationFrame(tick);
                }
            }

            reel.addEventListener('mousemove', function(event) {
                if (window.matchMedia && window.matchMedia('(hover: none)').matches) {
                    stopScroll();
                    return;
                }

                var rect = reel.getBoundingClientRect();
                var edgeSize = getEdgeSize();
                var x = event.clientX - rect.left;
                lastMouseX = x;
                var canScrollLeft = reel.scrollLeft > 0;
                var canScrollRight = reel.scrollLeft + reel.clientWidth < reel.scrollWidth - 1;
                updateEdgeState(x);

                if (x <= edgeSize && canScrollLeft) {
                    startScroll(-1);
                    return;
                }
                if (x >= rect.width - edgeSize && canScrollRight) {
                    startScroll(1);
                    return;
                }
                startScroll(0);
            });

            reel.addEventListener('mouseleave', function() {
                lastMouseX = null;
                updateEdgeState(null);
                stopScroll();
            });
            reel.addEventListener('wheel', function() {
                updateEdgeState(lastMouseX);
                stopScroll();
            }, { passive: true });
            reel.addEventListener('click', function() {
                updateEdgeState(lastMouseX);
                stopScroll();
            });
            reel.addEventListener('touchstart', function() {
                lastMouseX = null;
                updateEdgeState(null);
                stopScroll();
            }, { passive: true });
            reel.addEventListener('scroll', function() {
                updateEdgeState(lastMouseX);
            }, { passive: true });
            window.addEventListener('resize', function() {
                centerActiveReelItem();
                updateEdgeState(lastMouseX);
            });

            centerActiveReelItem();
            updateEdgeState(null);
        });
    }

    window.jQuery(function() {
        reorderModalReels();
        bindModalReelEdgeScroll();
    });

    function updateModalNavButtons(modal) {
        var order = Array.isArray(window.__portfolioDesiredOrder) ? window.__portfolioDesiredOrder : [];
        var currentId = modal.attr('id') ? modal.attr('id').replace('portfolioModal', '') : null;
        if (!currentId || !order.length) return;
        var idx = order.indexOf(currentId);
        var prev = modal.find('.modal-nav-prev');
        var next = modal.find('.modal-nav-next');
        if (idx <= 0) prev.addClass('is-hidden'); else prev.removeClass('is-hidden');
        if (idx >= order.length - 1) next.addClass('is-hidden'); else next.removeClass('is-hidden');
    }

    window.jQuery(document).on('click', '.portfolio-modal .modal-nav-btn', function() {
        var btn = window.jQuery(this);
        var openModal = btn.closest('.portfolio-modal');
        if (!openModal.length || isModalSwitching) return;
        var order = Array.isArray(window.__portfolioDesiredOrder) ? window.__portfolioDesiredOrder : [];
        if (!order.length) return;
        var currentId = openModal.attr('id') ? openModal.attr('id').replace('portfolioModal', '') : null;
        if (!currentId) return;
        var idx = order.indexOf(currentId);
        if (idx === -1) return;
        var nextIdx = btn.hasClass('modal-nav-next') ? idx + 1 : idx - 1;
        if (nextIdx < 0 || nextIdx >= order.length) return;
        var targetModal = window.jQuery('#portfolioModal' + order[nextIdx]);
        if (!targetModal.length) return;
        isModalSwitching = true;
        var currentHadFade = openModal.hasClass('fade');
        var targetHadFade = targetModal.hasClass('fade');
        if (currentHadFade) openModal.removeClass('fade');
        if (targetHadFade) targetModal.removeClass('fade');
        openModal.one('hidden.bs.modal.modalReel', function() {
            targetModal.one('shown.bs.modal.modalReel', function() {
                syncModalReelActive(targetModal);
                scheduleModalReelCenter(targetModal);
                if (currentHadFade) openModal.addClass('fade');
                if (targetHadFade) targetModal.addClass('fade');
                clearModalHash();
                isModalSwitching = false;
            });
            targetModal.modal('show');
            window.jQuery('body').addClass('modal-open');
        });
        openModal.modal('hide');
    });

    window.jQuery('div.modal').on('shown.bs.modal', function() {
        syncModalReelActive(window.jQuery(this));
        reorderModalReels();
        bindModalReelEdgeScroll();
        scheduleModalReelCenter(window.jQuery(this));
        updateModalNavButtons(window.jQuery(this));
    });

    // Remove legacy middleware option row (A B C) if present in cached/generated pages
    window.jQuery(function() {
        window.jQuery('#services .col-md-4').filter(function() {
            return window.jQuery(this).find('h4.service-heading').first().text().trim() === 'Middleware Integration';
        }).each(function() {
            window.jQuery(this).find('.middleware-icon-options, .middleware-option').remove();
            window.jQuery(this).find('div, p, span').filter(function() {
                return window.jQuery(this).text().replace(/\s+/g, ' ').trim() === 'A B C';
            }).remove();
        });
    });
}




document.querySelectorAll('a.portfolio-link[href]').forEach(function(link) {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('You are about to visit an external page. Continue?')) {
            window.open(link.href, '_blank', 'noopener');
        }
    });
});

// Portfolio collapse toggle
(function() {
    if (window.innerWidth <= 767) return;
    var portfolioWrap = document.querySelector('.portfolio-collapse-wrap');
    var portfolioToggle = document.getElementById('portfolioToggle');
    var portfolioFade = document.getElementById('portfolioFade');
    if (!portfolioWrap || !portfolioToggle) return;

    var expanded = false;

    function getCollapsedHeight() {
        var items = portfolioWrap.querySelectorAll('.portfolio-item');
        if (items.length >= 6) {
            var wrapRect = portfolioWrap.getBoundingClientRect();
            var sixthRect = items[5].getBoundingClientRect();
            return sixthRect.bottom - wrapRect.top;
        }
        return 600;
    }

    var toggleIcon = portfolioToggle.querySelector('i');
    var DURATION = 700;

    function ease(t) { return -(Math.cos(Math.PI * t) - 1) / 2; } // sine ease-in-out: uniformly smooth, no sudden speed changes

    function animate(fromH, toH, onProgress, onDone) {
        var startTime = null;
        function step(ts) {
            if (!startTime) startTime = ts;
            var progress = Math.min((ts - startTime) / DURATION, 1);
            portfolioWrap.style.maxHeight = (fromH + (toH - fromH) * ease(progress)) + 'px';
            onProgress(progress);
            if (progress < 1) { requestAnimationFrame(step); } else { onDone(); }
        }
        requestAnimationFrame(step);
    }

    function collapse() {
        portfolioWrap.style.overflow = 'hidden';
        if (toggleIcon) toggleIcon.className = 'fa fa-chevron-down';
        expanded = false;
        animate(
            portfolioWrap.scrollHeight,
            getCollapsedHeight(),
            function(p) { if (portfolioFade) portfolioFade.style.opacity = p; },
            function() { if (portfolioFade) portfolioFade.style.opacity = '1'; }
        );
    }

    function expand() {
        if (portfolioFade) portfolioFade.style.opacity = '1';
        if (toggleIcon) toggleIcon.className = 'fa fa-chevron-up';
        expanded = true;
        animate(
            parseInt(portfolioWrap.style.maxHeight) || getCollapsedHeight(),
            portfolioWrap.scrollHeight,
            function(p) { if (portfolioFade) portfolioFade.style.opacity = 1 - p; },
            function() { if (portfolioFade) portfolioFade.style.opacity = '0'; }
        );
    }

    function initCollapse() {
        var h = getCollapsedHeight();
        portfolioWrap.style.transition = 'none';
        portfolioWrap.style.maxHeight = h + 'px';
        portfolioWrap.style.overflow = 'hidden';
        if (portfolioFade) portfolioFade.style.opacity = '1';
        requestAnimationFrame(function() { portfolioWrap.style.transition = ''; });
    }

    window.addEventListener('load', initCollapse);
    if (document.readyState === 'complete') initCollapse();

    window.addEventListener('resize', function() {
        if (!expanded) collapse();
    });

    portfolioToggle.addEventListener('click', function() {
        if (expanded) { collapse(); } else { expand(); }
    });
}());
