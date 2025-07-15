(function ($) {
    'use strict';

    $.bsLayer = {
        defaults: {
            width: 50,       // Jeder neue Layer ist 85% so breit wie der vorherige
            animationDuration: 300,
            backdrop: true,
            parent: 'body'
        }
    };

    const namespace = '.bs.layer';

    const layers = [];
    // Offene Layer zählen
    var openCount = 0;

    // Plugin Initialisierung
    $.fn.bsLayer = function () {
        if ($(this).length === 0) return;
        if ($(this).length > 1) return $(this).each(function () {
            $(this).bsLayer();
        });

        const layerButton = $(this);

        const settingsBefore = layerButton.data('bsLayer') || layerButton.data() || {};
        const newSettings = $.extend(true, {}, $.bsLayer.defaults, settingsBefore);
        layerButton.data('bsLayer', newSettings);
        buildLayer(layerButton);
        return this;
    };

    function getSettings($btnLayer) {
        return $btnLayer.data('bsLayer')
    }

    function events() {
        // Öffnen
        $(document).on('click'+namespace, '[data-bs-toggle="layer"]', function (e) {
            e.preventDefault();
            const btn = $(e.currentTarget);
            btn.bsLayer();
        });

        // Schließen (immer nur das oberste)
        $(document).on('click'+namespace, '[data-bs-dismiss="layer"]', function (e) {
            e.preventDefault();
            closeTopMenu();
        });
        // Backdrop-Klick: nur wenn Option nicht 'static'
        $(document).on('click' + namespace, '#layerBackdrop', function (e) {
            e.preventDefault();

            // Prüfen, ob gerade eine Animation läuft
            if (isAnimating || $('.bs-layer.sliding').length) {
                return; // Noch in Animation, keine weitere Aktion ausführen
            }

            const backdropOpt = $.bsLayer.defaults.backdrop;
            if (backdropOpt === 'static') {
                return; // Keine Aktion bei statischem Backdrop
            }

            closeTopMenu(); // Sicherstellen, dass die Animation nur einmal ausgeführt wird
        });

        // ESC schließt nur das oberste Menü (optional: ESC auch ignorieren bei static)
        $(document).on('keydown'+namespace, function (e) {
            if (e.key === "Escape") {
                // ESC sperren, wenn backdrop 'static'
                const backdropOpt = $.bsLayer.defaults.backdrop;
                if (backdropOpt === 'static') return;
                if($('.bs-layer.sliding').length) {
                    return;
                }
                closeTopMenu();
            }
        });

    }

    function buildLayer($btnLayer) {
        const options = getSettings($btnLayer);
        var $menu = $('<div>').appendTo(options.parent);
        layers.push($menu);
        openMenu($btnLayer);
        return $menu;
    }

    function getCurrentWidth($btnLayer) {
        const settings = $.bsLayer.defaults;
        const countOpenLayers = layers.length;
        const winWidth = $(window).width();

        // Bootstrap sm breakpoint: 576px
        if (winWidth < 576) {
            // Volle Fensterbreite auf XS
            return winWidth;
        }

        // Erstes Menü: 80% der Fensterbreite (kannst du auch fest setzen, falls gewünscht)
        if (countOpenLayers === 1) {
            return Math.round(winWidth * 0.8);
        }

        const prevWidth = layers[layers.length - 2].width ? layers[layers.length - 2].width() : Math.round(winWidth * 0.8);
        return Math.max(prevWidth - settings.width, 576);
    }

    function getCurrentZIndex($btnLayer) {
        const settings = $.bsLayer.defaults;
        const countOpenLayers = layers.length;
        return 1050 + countOpenLayers;
    }

    function openMenu($btnLayer) {
        const options = getSettings($btnLayer);
        const $menu = layers[layers.length - 1];
        const width = getCurrentWidth($btnLayer);
        const zIndex = getCurrentZIndex($btnLayer);

        let target;
        if($btnLayer.is('a')) {
            target = $btnLayer.attr('href');
        } else if($btnLayer.is('button')) {
            target = $btnLayer.attr('data-bs-target');
        }

        $menu.addClass('position-fixed top-0 h-100 shadow bg-white rounded-start-5 bs-layer sliding')

            .css({
                width: width + 'px',
                right: '-' + width + 'px',
                zIndex: zIndex,
                opacity: .95,
                transition: 'right ' + options.animationDuration + 'ms',
                display: 'block',
                backdropFilter: 'blur(15px) saturate(170%)',
                WebkitBackdropFilter: 'blur(15px) saturate(170%)',
            })
            .attr('id', target)
            .attr('aria-modal', 'true')
            .attr('role', 'layer');

        $menu.append(
            $('<button type="button" class="btn-close position-absolute top-0 end-0 m-3" aria-label="Close" data-bs-dismiss="layer" style="filter: invert(1) grayscale(1) brightness(0.2);"></button>')
        );
        $menu.append(
            $('<a href="#" data-bs-toggle="layer" class="btn btn-primary mt-5 ms-4">Open another layer</a>')
        );

        // Reflow/Animation
        void $menu[0].offsetWidth;
        $menu.css('right', '0');

        for (var i = 0; i < layers.length - 1; i++) {
            layers[i].addClass('overflow-hidden');
        }
        $menu.removeClass('overflow-hidden');

        // BACKDROP LOGIK
        if (options.backdrop) {
            let $backdrop = $('#layerBackdrop');
            if ($backdrop.length === 0) {
                $backdrop = $('<div id="layerBackdrop" class="modal-backdrop fade show"></div>')
                    .appendTo('body');
            } else {
                $backdrop.appendTo('body');
            }
            const backdropZ = zIndex - 1;
            $backdrop.css({ zIndex: backdropZ });
        }

        // Body overflow nur fürs erste Layer
        if (openCount === 1) {
            $('body').addClass('overflow-hidden');
        }

        // Event vor dem Anzeigen auslösen
        $menu.trigger('show'+namespace, [$menu]);
        // Event nach komplettem Öffnen auslösen
        setTimeout(() => {
            $menu.removeClass('sliding');
            $menu.trigger('shown'+namespace , [$menu]);
        }, options.animationDuration);
    }
    let isAnimating = false;

    function closeTopMenu() {
        if (isAnimating) return; // Abbrechen, wenn eine Animation bereits läuft
        isAnimating = true;      // Flag setzen, um Animation zu blockieren

        const settings = $.bsLayer.defaults;
        var $topMenu = layers[layers.length - 1];
        var width = $topMenu && $topMenu.outerWidth ? $topMenu.outerWidth() : 0;

        // Event vor dem Schließen auslösen
        if ($topMenu) {
            $topMenu.trigger('hide'+namespace);
        }

        // --- BACKDROP zuerst verschieben ---
        if (settings.backdrop) {
            if (layers.length === 1) {
                $('#layerBackdrop').remove();
            } else if (layers.length > 1) {
                const $underLayer = layers[layers.length - 2];
                const zIndex = $underLayer && $underLayer.css
                    ? (parseInt($underLayer.css('z-index'), 10) || 1050)
                    : 1050;
                $('#layerBackdrop').css({ zIndex: zIndex - 1 });
            }
        }

        // Menü animiert schließen
        if ($topMenu && $topMenu.css) {
            $topMenu.css('right', '-' + width + 'px');
            $topMenu.addClass('sliding');

            setTimeout(function() {
                $topMenu.hide(function() {
                    $topMenu.trigger('hidden'+namespace); // Event nach vollständigem Schließen auslösen
                    $topMenu.remove(); // Layer aus DOM entfernen

                    layers.pop(); // Layer aus dem Stack entfernen
                    if (layers.length) {
                        layers[layers.length - 1].removeClass('overflow-hidden');
                    }

                    isAnimating = false; // Animation abgeschlossen
                });

                openCount--;
                if (openCount === 0) {
                    $('body').removeClass('overflow-hidden');
                }
            }, settings.animationDuration);
        } else {
            isAnimating = false;
        }
    }

    events();
})
(jQuery);
