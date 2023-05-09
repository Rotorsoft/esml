const sample = `## WolfDesk Ticket Service

# Actors 
actor Customer invokes 
	OpenTicket, AddMessage, RequestTicketEscalation
    reads Tickets
actor AgentActor invokes 
	AddMessage, CloseTicket
    reads Tickets
    

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

const SRC_KEY = "ESML-Cache";
const POS_KEY = "ESML_Position";

const Store = () => {
  let src = { code: sample, font: "Inconsolata" },
    pos = { x: 0, y: 0, zoom: 1 };

  const load = () => {
    const src_cache = localStorage.getItem(SRC_KEY);
    src_cache && (src = JSON.parse(src_cache));
    const pos_cache = localStorage.getItem(POS_KEY);
    pos_cache && (pos = JSON.parse(pos_cache));
    return { ...src, ...pos };
  };

  const save = esml.debounce((state) => {
    if (state.code || state.font) {
      state.code && (src.code = state.code);
      state.font && (src.font = state.font);
      localStorage.setItem(SRC_KEY, JSON.stringify(src));
    }
    if (state.zoom) {
      pos.x = state.x;
      pos.y = state.y;
      pos.zoom = state.zoom;
      localStorage.setItem(POS_KEY, JSON.stringify(pos));
    }
  }, 1000);

  return { load, save };
};

const Controller = (canvas, bus) => {
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

  let lastFont;
  const refresh = esml.debounce((state) => {
    editor.getAllMarks().forEach((mark) => mark.clear());
    state.code = state.code || editor.getValue();
    state.font = lastFont = state.font || lastFont;
    const error = canvas.render(state);
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
    bus.emit("refreshed", state);
  }, 500);

  editor.on("change", () => refresh({}));

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
    load: (state) => {
      state.code && editor.setValue(state.code);
      refresh(state);
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
  const controller = Controller(canvas, bus);

  document.onmousemove = (e) =>
    e.x < 100 && e.movementX < -10 && controller.show();
  container.onclick = () => controller.hide();

  const fontSelector = document.getElementById("font-selector");
  const fontList = document.getElementById("font-list");
  const selectFont = (font, close = false) => {
    fontSelector.innerText = font;
    fontSelector.classList = `btn dropdown-toggle ${font}`;
    if (close) {
      fontSelector.click();
      store.save({ font });
      controller.load({ font });
    }
  };
  fontList
    .querySelectorAll("a")
    .forEach((n) => (n.onclick = () => selectFont(n.innerText, true)));

  const cache = store.load();
  controller.load(cache);
  selectFont(cache.font);

  setTimeout(() => {
    bus.on("refreshed", (state) => store.save(state));
    canvas.on("transformed", (state) => store.save(state));
  }, 1000);
});
