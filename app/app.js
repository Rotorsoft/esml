function debounce(func, delay) {
  let timeout;
  return function () {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this);
    }, delay);
  };
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("container");
  const svg_view = document.getElementById("svg");
  const parse_err = document.getElementById("parse-error");
  const coords = document.getElementById("coords");
  const zoomPct = document.getElementById("zoom");
  const fit = document.getElementById("fit");

  const SCALE = 80,
    MIN_X = 0,
    MIN_Y = 0,
    WIDTH = SCALE * 100,
    HEIGHT = SCALE * 100;
  svg_view.setAttribute("viewBox", `${MIN_X} ${MIN_Y} ${WIDTH} ${HEIGHT}`);
  svg_view.setAttribute("width", `${WIDTH}`);
  svg_view.setAttribute("height", `${HEIGHT}`);
  let zoom = 1,
    x = 0,
    y = 0,
    w = 0,
    h = 0;

  function fitZoom(z) {
    zoom = Math.round(Math.min(Math.max(0.1, z), 3) * 100) / 100;
  }

  fit.onclick = (e) => {
    x = 0;
    y = 0;
    const vw = container.clientWidth;
    const vh = container.clientHeight;
    fitZoom(Math.min(vw / w, vh / h));
    transform();
  };

  function transform(dx = 0, dy = 0) {
    const g = svg_view.children[0];
    if (g) {
      x = Math.floor(Math.min(Math.max(x - dx, MIN_X - w * zoom), WIDTH));
      y = Math.floor(Math.min(Math.max(y - dy, MIN_Y - h * zoom), HEIGHT));
      coords.innerText = `x:${x} y:${y} w:${w} h:${h}`;
      zoomPct.innerText = `${Math.floor(zoom * 100)}%`;
      g.setAttribute("transform", `translate(${x}, ${y}) scale(${zoom})`);
    }
  }

  // esml keywords
  const keywords =
    /\b(?:context|actor|aggregate|system|projector|policy|process|invokes|handles|emits|includes)\b/;
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

  const textarea = document.getElementById("code");
  const editor = CodeMirror.fromTextArea(textarea, {
    mode: "esml",
    lineNumbers: true,
    theme: "default",
  });

  function save() {
    localStorage.setItem(
      KEY,
      JSON.stringify({ code: editor.getValue(), zoom, x, y })
    );
  }

  function refresh(code) {
    editor.getAllMarks().forEach(function (mark) {
      mark.clear();
    });
    const { error, svg, width, height } = esml.esml(code, SCALE);
    if (error) {
      const { message, line, from, to } = error;
      const _from = { line: line - 1, ch: from };
      const _to = { line: line - 1, ch: to };
      editor.markText(_from, _to, { className: "cm-error" });
      parse_err.style.display = "flex";
      parse_err.innerText = message;
      return false;
    }
    parse_err.style.display = "none";
    parse_err.innerText = "";
    w = width;
    h = height;
    svg_view.innerHTML = svg;
    transform();
    return true;
  }

  const KEY = "ESML-Cache";
  const cache = localStorage.getItem(KEY);
  if (cache) {
    const data = JSON.parse(cache);
    if (data.code) {
      editor.setValue(data.code);
      refresh(data.code);
    }
    data.zoom && (zoom = data.zoom);
    data.x && (x = data.x);
    data.y && (y = data.y);
    transform();
  }

  editor.on(
    "change",
    debounce(() => {
      refresh(editor.getValue()) && save();
    }, 500)
  );

  container.addEventListener("wheel", handleWheel);
  const saveTransform = debounce(save, 3000);
  function handleWheel(event) {
    event.preventDefault();
    if (event.metaKey || event.ctrlKey) {
      fitZoom(zoom + event.deltaY * -0.01);
      transform();
    } else {
      transform(event.deltaX, event.deltaY);
    }
    saveTransform();
  }
});
