# ESML

ESML, which stands for `Event Storming Modeling Language`, aims to create a user-friendly grammar that accurately describes the components of Event Storming Models with a level of detail that enables precise rendering of diagrams.

## Grammar

- `comment` ::= "#" [^\\n]\* "\\n"
- `name` ::= [a-zA-Z] [a-zA-Z0-9]\*
- `names` ::= `name` {"," `name`}\*
- `actor` ::= "actor" `name` { ["invokes" `names`] | ["reads" `names`] }\*
- `aggregate` ::= "aggregate" `name` { ["handles" `names`] | ["emits" `names`] }\*
- `system` ::= "system" `name` { ["handles" `names`] | ["emits" `names`] }\*
- `policy` ::= "policy" `name` { ["handles" `names`] | ["invokes" `names`] | ["reads" `names`] }\*
- `process` ::= "process" `name` { ["handles" `names`] | ["invokes" `names`] | ["reads" `names`] }\*
- `projector` ::= "projector" `name` ["handles" `names`]\*
- `context` ::= "context" `name` ["includes" `names`]\*
- `statement` ::= `actor` | `aggregate` | `system` | `policy` | `process` | `projector` | `context`
- `esml` ::= { `comment` | `statement` }\*

## API

- To render the SVG model

  ```typescript
  export class ParseError extends Error {
      constructor(
          readonly expected: string,
          readonly actual: string,
          readonly line: number,
          readonly from: number,
          readonly to: number
      ) {
          super(
          `Parse error at ${line} [${from}:${to}]: Expected ${expected} but got ${actual}`
          );
      }
  }

  esml(code: string, scale: number) => { error?: ParseError; svg?: string; width?: number; height?: number };
  ```

- To embed the canvas in your HTML document

  ```typescript
  type Options = {
      SCALE: number;
      WIDTH: number;
      HEIGHT: number;
      coordsSpan?: HTMLSpanElement;
      zoomSpan?: HTMLSpanElement;
      fitBtn?: HTMLButtonElement;
  };

  type State = {
      code: string;
      x?: number;
      y?: number;
      zoom?: number;
  };

  const canvas = new Canvas(document: Document, container: HTMLDivElement, options?: Options);

  canvas.on("transformed", e => {
      console.log(e);
  });

  const error = canvas.render({ code, x, y, zoom });
  if(error) console.log(error);
  ```

## Playground

Enjoy playing with ESML at [Playground](https://rotorsoft.github.io/esml/)

## CDN

- <https://cdn.jsdelivr.net/npm/@rotorsoft/esml/docs/esml.min.js>
- <https://unpkg.com/@rotorsoft/esml/docs/esml.js>

## Sample Model

```bash
## WolfDesk Ticket Service

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
```
