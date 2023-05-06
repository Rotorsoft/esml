const sample = `
aggregate Ticket
handles OpenTicket, AssignTicket, AddMessage,
	CloseTicket, RequestTicketEscalation,
    EscalateTicket, ReassignTicket,
    MarkMessageDelivered, AcknowledgeMessage
emits
	TicketOpened, TicketAssigned, MessageAdded,
    TicketClosed, TicketEscalated, TicketReassigned,
    MessageDelivered, MessageRead, TicketEscalationRequested,
    TicketResolved
    

policy Assignment handles TicketOpened 
invokes AssignTicket, ReassignTicket
reads Tickets

policy RequestEscalation
handles TicketEscalationRequested
invokes EscalateTicket, CloseTicket
reads Tickets

policy Closing handles TicketResolved invokes CloseTicket
reads Tickets

projector Tickets
handles 
	TicketOpened, TicketAssigned, MessageAdded,
    TicketClosed, TicketEscalated, TicketReassigned,
    MessageDelivered, MessageRead, TicketEscalationRequested,
    TicketResolved
    
actor Customer invokes OpenTicket, AddMessage, RequestTicketEscalation
actor Agent invokes AddMessage, CloseTicket

system Billing
handles BillTenant emits TenantBilled

policy BillingPolicy handles TicketResolved
invokes BillTenant,AddTenant
reads Tickets

aggregate Tenant handles AddTenant emits TenantAdded

context Admin includes Tenant

actor Phil invokes AddTenant

process ARandomProcessManager
reads Tickets, AnotherProjection

process Messaging
invokes MarkMessageDelivered, AcknowledgeMessage


context TicketLifecycle
includes Ticket, Tickets, Assignment, 
RequestEscalation, Closing,
Customer, Agent, Messaging
`;

const Store = () => {
  const KEY = "ESML-Cache";
  let _x, _y, _z;

  const load = () => {
    const cache = localStorage.getItem(KEY);
    if (cache) {
      const { code, x, y, zoom } = JSON.parse(cache);
      _x = x;
      _y = y;
      _z = zoom;
      return { code, x, y, zoom };
    }
    return { code: sample };
  };

  const save = esml.debounce(({ code, x, y, zoom }) => {
    if (!code) return;
    x = _x = x || _x;
    y = _y = y || _y;
    zoom = _z = zoom || _z;
    localStorage.setItem(KEY, JSON.stringify({ code, x, y, zoom }));
  }, 3000);

  return { load, save };
};

const Editor = (canvas, bus) => {
  const codemirror = document.getElementById("codemirror");
  const parse_err = document.getElementById("parse-error");
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

  const refresh = esml.debounce((code, x, y, zoom) => {
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
    bus.emit("refreshed", code);
  }, 500);

  editor.on("change", () => refresh(editor.getValue()));

  const show = () =>
    !codemirror.classList.contains("show") &&
    codemirror.classList.toggle("show");

  const hide = () =>
    codemirror.classList.contains("show") &&
    codemirror.classList.toggle("show");

  const resize = () => {
    codemirror.style.minWidth = Math.floor(window.innerWidth * 0.4);
    codemirror.style.maxWidth = Math.floor(window.innerWidth * 0.6);
  };

  codemirror.onclick = show;
  window.onresize = resize;
  resize();

  return {
    show,
    hide,
    code: () => editor.getValue(),
    load: ({ code, x, y, zoom }) => {
      editor.setValue(code);
      refresh(code, x, y, zoom);
    },
  };
};

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("container");
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

  const store = Store();
  const bus = new esml.EventEmitter();
  const editor = Editor(canvas, bus);

  const cache = store.load();
  editor.load(cache);

  setTimeout(() => {
    bus.on("refreshed", (code) => store.save({ code }));
    canvas.on("transformed", ({ x, y, zoom }) =>
      store.save({ code: editor.code(), x, y, zoom })
    );
  }, 1000);

  document.onmousemove = (e) => e.x < 100 && e.movementX < -10 && editor.show();
  container.onclick = () => editor.hide();
});
