document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("container");
  const parse_err = document.getElementById("parse-error");
  const coordsSpan = document.getElementById("coords");
  const zoomSpan = document.getElementById("zoom");
  const fitBtn = document.getElementById("fit");

  const canvas = new esml.Canvas(document, container, {
    SCALE: 80,
    WIDTH: 80 * 100,
    HEIGHT: 80 * 100,
    coordsSpan,
    zoomSpan,
    fitBtn,
  });

  const textarea = document.getElementById("code");
  const keywords = new RegExp(`(?:${esml.Keywords.join("|")})`);
  CodeMirror.defineMode("esml", function () {
    return {
      startState: function () {
        return { inSymbol: false };
      },
      token: function (stream, state) {
        if (stream.sol()) stream.eatSpace();
        if (stream.eol()) return null;
        if (stream.match(keywords)) return "keyword";
        stream.next();
        return null;
      },
    };
  });
  const editor = CodeMirror.fromTextArea(textarea, {
    mode: "esml",
    lineNumbers: true,
    theme: "default",
  });
  const de_refresh = esml.debounce(refresh, 500);
  editor.on("change", () => de_refresh(editor.getValue()));
  const de_save = esml.debounce(save, 3000);
  canvas.on("transformed", (e) => de_save(e));

  const cm = document.getElementById("codemirror");
  let showing = false;
  document.onmousemove = (e) => {
    if (!showing && e.x < 100 && e.movementX < 0) {
      cm.classList.toggle("show");
      showing = true;
    }
  };
  container.onclick = () => {
    if (showing) {
      cm.classList.toggle("show");
      showing = false;
    }
  };

  const KEY = "ESML-Cache";
  let _x, _y, _zoom;
  function save(state) {
    if (state) {
      _x = state.x;
      _y = state.y;
      _zoom = state.zoom;
    }
    localStorage.setItem(
      KEY,
      JSON.stringify({ code: editor.getValue(), x: _x, y: _y, zoom: _zoom })
    );
  }

  function refresh(code, x, y, zoom) {
    editor.getAllMarks().forEach((mark) => mark.clear());
    const error = canvas.render({ code, x, y, zoom });
    if (error) {
      const { message, line, from, to } = error;
      if (line) {
        const _from = { line: line - 1, ch: from };
        const _to = { line: line - 1, ch: to };
        editor.markText(_from, _to, { className: "cm-error" });
      }
      parse_err.style.display = "flex";
      parse_err.innerText = message;
      return;
    }
    parse_err.style.display = "none";
    parse_err.innerText = "";
    save();
  }

  const cache = localStorage.getItem(KEY);
  if (cache) {
    const { code, x, y, zoom } = JSON.parse(cache);
    if (code) {
      _x = x;
      _y = y;
      _zoom = zoom;
      editor.setValue(code);
      refresh(code, x, y, zoom);
    }
  }
});
