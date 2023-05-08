const sample = `
## WolfDesk Ticket Service

# Actors 
actor Customer invokes 
	OpenTicket, AddMessage, RequestTicketEscalation
actor AgentActor invokes 
	AddMessage, CloseTicket

# Ticket is the main aggregate
aggregate Ticket
handles 
	OpenTicket, AssignTicket, AddMessage,
	CloseTicket, RequestTicketEscalation,
    EscalateTicket, ReassignTicket,
    MarkMessageDelivered, AcknowledgeMessage
emits
	TicketOpened, TicketAssigned, MessageAdded,
    TicketClosed, TicketEscalated, TicketReassigned,
    MessageDelivered, MessageRead, TicketEscalationRequested,
    TicketResolved

# Policies to handle new ticket assignment and escalation
policy Assignment handles TicketOpened 
invokes AssignTicket, ReassignTicket
reads Tickets, Agents

policy RequestEscalation handles TicketEscalationRequested
invokes EscalateTicket, CloseTicket
reads Tickets, Agents

# Automatically close tickets after resolution
policy Closing handles TicketResolved invokes CloseTicket
reads Tickets

# A projection of current ticket states is used to drive policies
projector Tickets
handles 
	TicketOpened, TicketAssigned, MessageAdded,
    TicketClosed, TicketEscalated, TicketReassigned,
    MessageDelivered, MessageRead, TicketEscalationRequested,
    TicketResolved

# Let's put all of the above in the same context
context TicketLifecycle includes
	Ticket, Tickets, Assignment, 
	RequestEscalation, Closing,
	Customer, AgentActor

# We will need a messaging subdomain
context MessagingSystem includes Messaging
process Messaging
	invokes MarkMessageDelivered, AcknowledgeMessage
    handles MessageAdded
	reads Tickets

# Billing context
system Billing
handles BillTenant emits TenantBilled

policy BillingPolicy handles TicketResolved
invokes BillTenant, AddTenant reads Tickets, Tenants

context BillingSystem includes Billing, BillingPolicy

# Admin context
aggregate Tenant handles AddTenant emits TenantAdded
aggregate Agent handles AddAgent emits AgentAdded
aggregate Product handles AddProduct emits ProductAdded

context Admin includes
	Tenant, Agent, Product
`;

const Store = () => {
  const KEY = "ESML-Cache";
  let _x, _y, _z, _f;

  const load = () => {
    const cache = localStorage.getItem(KEY);
    if (cache) {
      const { code, x, y, zoom, font } = JSON.parse(cache);
      _x = x;
      _y = y;
      _z = zoom;
      _f = font || "Inconsolata";
      return { code, x, y, zoom, font };
    }
    return { code: sample, font: "Inconsolata" };
  };

  const save = esml.debounce(({ code, x, y, zoom, font }) => {
    if (!code) return;
    x = _x = x || _x;
    y = _y = y || _y;
    zoom = _z = zoom || _z;
    font = _f = font || _f;
    localStorage.setItem(KEY, JSON.stringify({ code, x, y, zoom, font }));
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
      token: function (stream) {
        if (stream.sol()) stream.eatSpace();
        if (stream.eol()) return null;
        if (stream.match("#")) {
          stream.skipToEnd();
          return "comment";
        }
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

  const refresh = esml.debounce(({ code, x, y, zoom, font }) => {
    editor.getAllMarks().forEach((mark) => mark.clear());
    const error = canvas.render({ code, x, y, zoom, font });
    if (error) {
      const { message, source } = error;
      if (source) {
        const from = { line: source.from.line, ch: source.from.col };
        const to = { line: source.to.line, ch: source.to.col };
        editor.markText(from, to, { className: "cm-error" });
      }
      parse_err.style.display = "flex";
      parse_err.innerText = message;
      return;
    }
    parse_err.style.display = "none";
    parse_err.innerText = "";
    bus.emit("refreshed", { code, x, y, zoom, font });
  }, 500);

  editor.on("change", () => refresh({ code: editor.getValue() }));

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
    load: ({ code, x, y, zoom, font }) => {
      editor.setValue(code);
      refresh({ code, x, y, zoom, font });
    },
    refresh,
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
    bus.on("refreshed", (e) => store.save(e));
    canvas.on("transformed", ({ x, y, zoom }) =>
      store.save({ code: editor.code(), x, y, zoom })
    );
  }, 1000);

  document.onmousemove = (e) => e.x < 100 && e.movementX < -10 && editor.show();
  container.onclick = () => editor.hide();

  const fontSelector = document.getElementById("font-selector");
  const fontList = document.getElementById("font-list");
  const selectFont = (font, close = false) => {
    fontSelector.innerText = font;
    fontSelector.classList = `btn dropdown-toggle ${font}`;
    if (close) {
      fontSelector.click();
      editor.refresh({ code: editor.code(), font });
    }
  };
  fontList
    .querySelectorAll("a")
    .forEach((n) => (n.onclick = () => selectFont(n.innerText, true)));
  selectFont(cache.font);
});
