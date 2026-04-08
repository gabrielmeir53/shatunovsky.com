'use strict';
(function () {
  var seq = [38,38,40,40,37,39,37,39,66,65];
  var pos = 0;

  document.addEventListener('keydown', function (e) {
    if (pos < seq.length && e.keyCode === seq[pos]) {
      pos++;
      if (pos === seq.length) { pos = 0; launch(); }
    } else {
      pos = e.keyCode === seq[0] ? 1 : 0;
    }
  });

  function launch() {
    if (document.getElementById('dk-overlay')) return;

    var overlay = document.createElement('div');
    overlay.id = 'dk-overlay';
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:9999;background:#000;display:flex;' +
      'align-items:center;justify-content:center;flex-direction:column;';

    var close = document.createElement('button');
    close.textContent = '\u2715';
    close.style.cssText =
      'position:absolute;top:12px;right:18px;font-size:28px;color:#fff;' +
      'background:none;border:none;cursor:pointer;z-index:10000;';
    close.addEventListener('click', teardown);

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
    document.addEventListener('keydown', escHandler);

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
      document.addEventListener('keydown', keyDown);
      document.addEventListener('keyup', keyUp);
      frame();
    }

    var animId;
    function frame() {
      if (!nes) return;
      nes.frame();
      animId = requestAnimationFrame(frame);
    }

    var map = {
      38: jsnes.Controller.BUTTON_UP,
      40: jsnes.Controller.BUTTON_DOWN,
      37: jsnes.Controller.BUTTON_LEFT,
      39: jsnes.Controller.BUTTON_RIGHT,
      90: jsnes.Controller.BUTTON_B,
      88: jsnes.Controller.BUTTON_A,
      13: jsnes.Controller.BUTTON_START,
      16: jsnes.Controller.BUTTON_SELECT
    };

    function keyDown(e) {
      if (map[e.keyCode] !== undefined) {
        nes.buttonDown(1, map[e.keyCode]);
        e.preventDefault();
      }
    }
    function keyUp(e) {
      if (map[e.keyCode] !== undefined) {
        nes.buttonUp(1, map[e.keyCode]);
        e.preventDefault();
      }
    }

    function escHandler(e) {
      if (e.keyCode === 27) teardown();
    }

    function teardown() {
      if (animId) cancelAnimationFrame(animId);
      nes = null;
      document.removeEventListener('keydown', keyDown);
      document.removeEventListener('keyup', keyUp);
      document.removeEventListener('keydown', escHandler);
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
