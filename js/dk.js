'use strict';
(function () {
  var konamiSeq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  var pos = 0;
  var active = false;

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
    if (document.getElementById('dk-overlay')) return;
    active = true;

    var overlay = document.createElement('div');
    overlay.id = 'dk-overlay';
    overlay.tabIndex = 0;
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:9999;background:#000;display:flex;' +
      'align-items:center;justify-content:center;flex-direction:column;outline:none;';

    var close = document.createElement('button');
    close.textContent = '\u2715';
    close.style.cssText =
      'position:absolute;top:12px;right:18px;font-size:28px;color:#fff;' +
      'background:none;border:none;cursor:pointer;z-index:10000;';
    close.addEventListener('click', teardown);
    close.addEventListener('mousedown', function (e) { e.preventDefault(); });

    var info = document.createElement('div');
    info.style.cssText = 'color:#555;font-size:12px;margin-top:8px;font-family:monospace;';
    info.textContent = 'arrows = d-pad \u2022 z = B \u2022 x = A \u2022 enter = start \u2022 shift = select \u2022 esc = quit';

    var canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 240;
    canvas.style.cssText = 'width:512px;height:480px;image-rendering:pixelated;';

    overlay.appendChild(close);
    overlay.appendChild(canvas);
    overlay.appendChild(info);
    document.body.appendChild(overlay);
    overlay.focus();

    // Re-focus overlay on any click inside it
    overlay.addEventListener('mousedown', function (e) {
      if (e.target !== close) { e.preventDefault(); overlay.focus(); }
    });

    var ctx = canvas.getContext('2d');
    var img = ctx.createImageData(256, 240);

    var script = document.createElement('script');
    script.src = 'https://unpkg.com/jsnes@1.2.1/dist/jsnes.min.js';
    script.onload = function () { loadRom(); };
    script.onerror = function () { showError('Failed to load emulator.'); };
    document.head.appendChild(script);

    var nes;

    function loadRom() {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'assets/dk.nes', true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function () {
        if (xhr.status !== 200) { showError('ROM not found \u2014 place dk.nes in assets/'); return; }
        var data = new Uint8Array(xhr.response);
        var romStr = '';
        for (var i = 0; i < data.length; i++) romStr += String.fromCharCode(data[i]);
        startEmulator(romStr);
      };
      xhr.onerror = function () { showError('ROM not found \u2014 place dk.nes in assets/'); };
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
      nes.loadROM(romData);
      overlay.addEventListener('keydown', gameKeyDown);
      overlay.addEventListener('keyup', gameKeyUp);
      overlay.focus();
      frame();
    }

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

    function gameKeyDown(e) {
      if (!nes) return;
      var btn = keyMap[e.key];
      if (btn !== undefined) {
        nes.buttonDown(1, btn);
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.key === 'Escape') teardown();
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

    var animId;
    function frame() {
      if (!nes) return;
      nes.frame();
      animId = requestAnimationFrame(frame);
    }

    function teardown() {
      active = false;
      if (animId) cancelAnimationFrame(animId);
      nes = null;
      overlay.removeEventListener('keydown', gameKeyDown);
      overlay.removeEventListener('keyup', gameKeyUp);
      var el = document.getElementById('dk-overlay');
      if (el) el.remove();
    }

    function showError(msg) {
      var p = document.createElement('div');
      p.style.cssText = 'color:#f44;font-family:monospace;font-size:16px;margin-top:16px;';
      p.textContent = msg;
      overlay.appendChild(p);
    }
  }
})();
