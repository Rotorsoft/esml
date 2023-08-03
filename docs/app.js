// WolfDesk Ticket Service
const wolfdesk = {
  TicketLifecycle: {
    Customer: {
      type: "actor",
      description: "A customer of the service",
      reads: ["Tickets"],
      invokes: ["OpenTicket", "AddMessage", "RequestTicketEscalation"],
    },
    Agent: {
      type: "actor",
      description: "A customer service agent",
      reads: ["Tickets"],
      invokes: ["AddMessage", "CloseTicket"],
    },
    Ticket: {
      type: "aggregate",
      description: "The main aggregate holding ticket core logic",
      handles: [
        "OpenTicket",
        "AssignTicket",
        "AddMessage",
        "CloseTicket",
        "RequestTicketEscalation",
        "EscalateTicket",
        "ReassignTicket",
        "MarkMessageDelivered",
        "AcknowledgeMessage",
      ],
      emits: [
        "TicketOpened",
        "TicketAssigned",
        "MessageAdded",
        "TicketClosed",
        "TicketEscalated",
        "TicketReassigned",
        "MessageDelivered",
        "MessageRead",
        "TicketEscalationRequested",
        "TicketResolved",
      ],
      schema: {
        requires: {
          name: "string",
          active: "boolean",
          user: "uuid",
          body: "Body",
        },
        optional: { close: "date", open: "date" },
      },
    },
    Tickets: {
      type: "projector",
      description: "A projection of ticket states",
      handles: [
        "TicketOpened",
        "TicketAssigned",
        "MessageAdded",
        "TicketClosed",
        "TicketEscalated",
        "TicketReassigned",
        "MessageDelivered",
        "MessageRead",
        "TicketEscalationRequested",
        "TicketResolved",
      ],
      schema: {
        requires: {
          id: "uuid",
          created: "date",
          active: "boolean",
        },
        optional: { address: "Address" },
      },
    },
    Assignment: {
      type: "policy",
      description: "Assigns tickets to agents after opening",
      handles: ["TicketOpened"],
      reads: ["Tickets", "Admin.Agents"],
      invokes: ["AssignTicket", "ReassignTicket"],
    },
    RequestEscalation: {
      type: "policy",
      description: "Handles ticket escalation requests",
      handles: ["TicketEscalationRequested"],
      reads: ["Tickets", "Admin.Agents"],
      invokes: ["EscalateTicket", "CloseTicket"],
    },
    Closing: {
      type: "policy",
      description: "Closes tickets upon resolution",
      handles: ["TicketResolved"],
      reads: ["Tickets"],
      invokes: ["CloseTicket"],
    },
    Body: {
      type: "schema",
      requires: { id: "number" },
      optional: { description: "string" },
    },
    Address: {
      type: "schema",
      requires: { street: "string" },
    },
    OpenTicket: {
      type: "schema",
      description: "Command to open a new ticket",
      requires: { title: "string" },
      optional: { user: "uuid", description: "string" },
    },
    TicketOpened: {
      type: "schema",
      description: "Event recording when a ticket was opened",
      requires: { title: "string", user: "uuid" },
    },
    AssignTicket: {
      type: "schema",
      requires: { id: "string", agentId: "string" },
      optional: { expires: "number" },
    },
  },
  Messaging: {
    Messaging: {
      type: "process",
      description: "Delivers messages to recipients",
      handles: ["TicketLifecycle.MessageAdded"],
      reads: ["TicketLifecycle.Tickets"],
      invokes: [
        "TicketLifecycle.MarkMessageDelivered",
        "TicketLifecycle.AcknowledgeMessage",
      ],
    },
  },
  Billing: {
    Billing: {
      type: "system",
      handles: ["BillTenant"],
      emits: ["TenantBilled"],
    },
    BillingPolicy: {
      type: "policy",
      handles: ["TicketLifecycle.TicketResolved"],
      reads: ["TicketLifecycle.Tickets", "Admin.Tenants"],
      invokes: ["BillTenant", "AddTenant"],
    },
  },
  Admin: {
    Tenant: {
      type: "aggregate",
      handles: ["AddTenant"],
      emits: ["TenantAdded"],
    },
    Agent: { type: "aggregate", handles: ["AddAgent"], emits: ["AgentAdded"] },
    Product: {
      type: "aggregate",
      handles: ["AddProduct"],
      emits: ["ProductAdded"],
    },
    Tenants: { type: "projector", handles: ["TenantAdded"] },
    Agents: { type: "projector", handles: ["AgentAdded"] },
    Products: { type: "projector", handles: ["ProductAdded"] },
  },
};

const SRC_KEY = "ESML-Cache";
const POS_KEY = "ESML_Position";

const Store = () => {
  let src = { code: JSON.stringify(wolfdesk, null, 2), font: "Inconsolata" },
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

  const editor = CodeMirror.fromTextArea(textarea, {
    mode: { name: "javascript", json: true },
    lineNumbers: true,
    tabSize: 2,
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
  const zoomBtn = document.getElementById("zoom");
  const zoomInBtn = document.getElementById("zoomIn");
  const zoomOutBtn = document.getElementById("zoomOut");
  const canvas = new esml.Canvas(document, container, {
    SCALE: 80,
    WIDTH: 80 * 100,
    HEIGHT: 80 * 100,
    coordsSpan,
    zoomBtn,
    zoomInBtn,
    zoomOutBtn,
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
