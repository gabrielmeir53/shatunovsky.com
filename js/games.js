'use strict';
(function () {
  var konamiSeq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  var pos = 0;
  var active = false;

  var GAMES = [
    { title: 'Donkey Kong',         rom: 'assets/dk.nes' },
    { title: 'Super Mario Bros.',   rom: 'assets/smb.nes' },
    { title: 'Super Mario Bros. 3', rom: 'assets/smb3.nes' }
  ];

  var keyMap = {
    'ArrowUp':    4,  // BUTTON_UP
    'ArrowDown':  5,  // BUTTON_DOWN
    'ArrowLeft':  6,  // BUTTON_LEFT
    'ArrowRight': 7,  // BUTTON_RIGHT
    'z':          1,  // BUTTON_B
    'x':          0,  // BUTTON_A
    'Enter':      3,  // BUTTON_START
    'Shift':      2   // BUTTON_SELECT
  };

  document.addEventListener('keydown', function (e) {
    if (active) return;
    if (e.key === konamiSeq[pos]) {
      pos++;
      if (pos === konamiSeq.length) { pos = 0; launch(); }
    } else {
      pos = e.key === konamiSeq[0] ? 1 : 0;
    }
  });

  function launch() {
    if (document.getElementById('game-overlay')) return;
    active = true;

    var overlay = document.createElement('div');
    overlay.id = 'game-overlay';
    overlay.tabIndex = 0;
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:9999;background:#000;display:flex;' +
      'align-items:center;justify-content:center;flex-direction:column;outline:none;';

    var close = document.createElement('button');
    close.textContent = '✕';
    close.setAttribute('aria-label', 'Close');
    close.style.cssText =
      'position:absolute;top:12px;right:18px;font-size:28px;color:#fff;' +
      'background:none;border:none;cursor:pointer;z-index:10000;';
    close.addEventListener('click', teardown);
    close.addEventListener('mousedown', function (e) { e.preventDefault(); });

    // ----- menu view -----
    var menu = document.createElement('div');
    menu.style.cssText = 'display:flex;flex-direction:column;align-items:center;font-family:monospace;';

    var menuTitle = document.createElement('div');
    menuTitle.textContent = 'SELECT GAME';
    menuTitle.style.cssText = 'color:#fff;font-size:20px;letter-spacing:3px;margin-bottom:24px;';
    menu.appendChild(menuTitle);

    var items = GAMES.map(function (g, i) {
      var item = document.createElement('button');
      item.className = 'game-menu-item';
      item.textContent = g.title;
      item.style.cssText =
        'width:300px;margin:5px 0;padding:13px;font-family:monospace;font-size:16px;' +
        'color:#fff;background:#111;border:1px solid #333;cursor:pointer;outline:none;';
      item.addEventListener('mouseenter', function () { setSel(i); });
      item.addEventListener('click', function () { selectGame(i); });
      item.addEventListener('mousedown', function (e) { e.preventDefault(); });
      menu.appendChild(item);
      return item;
    });

    var menuHint = document.createElement('div');
    menuHint.style.cssText = 'color:#555;font-size:12px;margin-top:20px;';
    menuHint.textContent = 'arrows = move • enter = select • esc = quit';
    menu.appendChild(menuHint);

    // ----- game view -----
    var game = document.createElement('div');
    game.style.cssText = 'display:none;flex-direction:column;align-items:center;';

    var canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 240;
    canvas.style.cssText = 'width:512px;height:480px;image-rendering:pixelated;';

    var info = document.createElement('div');
    info.style.cssText = 'color:#555;font-size:12px;margin-top:8px;font-family:monospace;';
    info.textContent = 'arrows = d-pad • z = B • x = A • enter = start • shift = select • esc = menu';

    game.appendChild(canvas);
    game.appendChild(info);

    overlay.appendChild(close);
    overlay.appendChild(menu);
    overlay.appendChild(game);
    document.body.appendChild(overlay);
    overlay.focus();

    // Keep keyboard focus on the overlay for any click that is not a control.
    overlay.addEventListener('mousedown', function (e) {
      if (e.target !== close && !e.target.classList.contains('game-menu-item')) {
        e.preventDefault();
        overlay.focus();
      }
    });

    var ctx = canvas.getContext('2d');
    var img = ctx.createImageData(256, 240);

    var sel = 0;
    function setSel(i) {
      sel = i;
      items.forEach(function (it, j) {
        it.style.background = j === i ? '#782F40' : '#111';
        it.style.borderColor = j === i ? '#a8455c' : '#333';
      });
    }
    setSel(0);

    var nes = null, animId = null;

    function showMenu() {
      stopGame();
      var oldErr = game.querySelector('.game-error');
      if (oldErr) oldErr.remove();
      game.style.display = 'none';
      menu.style.display = 'flex';
      setSel(sel);
      overlay.focus();
    }

    function selectGame(i) {
      var oldErr = game.querySelector('.game-error');
      if (oldErr) oldErr.remove();
      menu.style.display = 'none';
      game.style.display = 'flex';
      overlay.focus();
      ensureJsnes(function (ok) {
        if (!ok) { showError('Failed to load emulator.'); return; }
        loadRom(GAMES[i].rom);
      });
    }

    function ensureJsnes(cb) {
      if (window.jsnes) { cb(true); return; }
      var existing = document.getElementById('jsnes-lib');
      if (existing) {
        existing.addEventListener('load', function () { cb(true); });
        existing.addEventListener('error', function () { cb(false); });
        return;
      }
      var script = document.createElement('script');
      script.id = 'jsnes-lib';
      script.src = 'https://unpkg.com/jsnes@1.2.1/dist/jsnes.min.js';
      script.onload = function () { cb(true); };
      script.onerror = function () { cb(false); };
      document.head.appendChild(script);
    }

    function loadRom(romPath) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', romPath, true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function () {
        if (xhr.status !== 200) { showError('ROM not found — place the file in assets/'); return; }
        var data = new Uint8Array(xhr.response);
        var romStr = '';
        for (var i = 0; i < data.length; i++) romStr += String.fromCharCode(data[i]);
        startEmulator(romStr);
      };
      xhr.onerror = function () { showError('ROM not found — place the file in assets/'); };
      xhr.send();
    }

    function startEmulator(romData) {
      nes = new jsnes.NES({
        onFrame: function (buf) {
          var d = img.data;
          for (var i = 0; i < buf.length; i++) {
            d[i * 4]     = (buf[i] >> 16) & 0xff;
            d[i * 4 + 1] = (buf[i] >> 8)  & 0xff;
            d[i * 4 + 2] =  buf[i]        & 0xff;
            d[i * 4 + 3] = 0xff;
          }
          ctx.putImageData(img, 0, 0);
        },
        onAudioSample: function () {}
      });
      try {
        nes.loadROM(romData);
      } catch (err) {
        nes = null;
        showError('This game could not be loaded.');
        return;
      }
      lastTime = 0;
      frameAcc = 0;
      animId = requestAnimationFrame(frame);
    }

    // The NES renders at a fixed ~60.1 fps. requestAnimationFrame fires at the
    // display's refresh rate (60, 120, 144 Hz...), so stepping the emulator once
    // per callback would tie game speed to the monitor. Instead we accumulate
    // real elapsed time and run a fixed number of emulator frames — identical
    // speed on every machine.
    var FRAME_MS = 1000 / 60.0988;
    var lastTime = 0, frameAcc = 0;

    function frame(now) {
      if (!nes) return;
      animId = requestAnimationFrame(frame);
      if (!lastTime) { lastTime = now; return; }
      var delta = now - lastTime;
      lastTime = now;
      if (delta > 250) delta = 250;   // cap catch-up after a stall or backgrounded tab
      frameAcc += delta;
      while (frameAcc >= FRAME_MS) {
        nes.frame();
        frameAcc -= FRAME_MS;
      }
    }

    function stopGame() {
      if (animId) { cancelAnimationFrame(animId); animId = null; }
      nes = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function showError(msg) {
      var p = document.createElement('div');
      p.className = 'game-error';
      p.style.cssText = 'color:#f44;font-family:monospace;font-size:15px;margin-top:14px;';
      p.textContent = msg + ' — press esc for the menu.';
      game.appendChild(p);
    }

    function gameKeyDown(e) {
      if (nes) {
        if (e.key === 'Escape') { e.preventDefault(); showMenu(); return; }
        var btn = keyMap[e.key];
        if (btn !== undefined) {
          nes.buttonDown(1, btn);
          e.preventDefault();
          e.stopPropagation();
        }
        return;
      }
      if (menu.style.display !== 'none') {
        if (e.key === 'ArrowUp')         { e.preventDefault(); setSel((sel - 1 + items.length) % items.length); }
        else if (e.key === 'ArrowDown')  { e.preventDefault(); setSel((sel + 1) % items.length); }
        else if (e.key === 'Enter')      { e.preventDefault(); selectGame(sel); }
        else if (e.key === 'Escape')     { e.preventDefault(); teardown(); }
      } else if (e.key === 'Escape') {
        // Game view while the ROM is still loading or failed: return to menu.
        e.preventDefault();
        showMenu();
      }
    }

    function gameKeyUp(e) {
      if (!nes) return;
      var btn = keyMap[e.key];
      if (btn !== undefined) {
        nes.buttonUp(1, btn);
        e.preventDefault();
        e.stopPropagation();
      }
    }

    overlay.addEventListener('keydown', gameKeyDown);
    overlay.addEventListener('keyup', gameKeyUp);

    function teardown() {
      active = false;
      stopGame();
      overlay.removeEventListener('keydown', gameKeyDown);
      overlay.removeEventListener('keyup', gameKeyUp);
      var el = document.getElementById('game-overlay');
      if (el) el.remove();
    }
  }
})();
