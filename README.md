# ESML

ESML, which stands for `Event Storming Modeling Language`, aims to create a user-friendly grammar that accurately describes the components of Event Storming Models with a level of detail that enables precise rendering of diagrams.

## ESML BNF Grammar

- <comment\> ::= "#" [^\\n]\* "\n"
- <verb\> ::= [A-Z] [a-zA-Z]+
- <past_tense_verb\> ::= <verb\> ["ed"]
- <noun\> ::= [A-Z] [a-zA-Z]+
- <adjective\> ::= [A-Z] [a-zA-Z]+
- <phrase\> ::= [<adjective\>] <noun\>
- <context\> ::= <phrase\> {<phrase\>}
- <command\> ::= <verb\> <noun\>
- <event\> ::= <noun\> <past_tense_verb\>
- <actor\> ::= <noun\>
- <system\> ::= <noun\>
- <aggregate\> ::= <noun\>
- <projector\> ::= <noun\>
- <policy\> ::= <verb\> <phrase\>
- <process\> ::= <policy\>
- <artifact\> ::= <aggregate\> | <system\> | <policy\> | <process\> | <projector\>
- <commands\> ::= <command\> {"," <command\>}
- <events\> ::= <event\> {"," <event\>}
- <projectors\> ::= <projector\> {"," <projector\>}
- <artifacts\> ::= <artifact\> {"," <artifact\>}
- <type\> ::= "string" | "number" | "boolean" | "uuid" | "date" | <noun\>
- <field\> ::= [a-z] [a-zA-Z0-9]+ { ":" <type\> }
- <fields\> ::= <field\> {"," <field\>}
- <actor_stmt\> ::= "actor" <actor\> { ("invokes" <commands\>) | ("reads" <projectors\>) }
- <aggregate_stmt\> ::= "aggregate" <aggregate\> { ("handles" <commands\>) | ("emits" <events\>) }
- <system_stmt\> ::= "system" <system\> { ("handles" <commands\>) | ("emits" <events\>) }
- <policy_stmt\> ::= "policy" <policy\> { ("handles" <events\>) | ("invokes" <commands\>) | ("reads" <projectors\>) }
- <process_stmt\> ::= "process" <process\> { ("handles" <events\>) | ("invokes" <commands\>) | ("reads" <projectors\>) }
- <projector_stmt\> ::= "projector" <projector\> { "handles" <events\> }
- <context_stmt\> ::= "context" <context\> { "includes" <artifacts\> }
- <schema_stmt\> ::= "schema" { <command\> | <event\> | <aggregate\> | <process\> | <projector\> } { ("requires" <fields\>) | ("optional" <fields\>) }
- <statement\> ::= <actor_stmt\> | <aggregate_stmt\> | <system_stmt\> | <policy_stmt\> | <process_stmt\> | <projector_stmt\> | <context_stmt\> | <schema_stmt\>
- <esml\> ::= { <comment\> | <statement\> }

## Instructions

1. Start by specifying the system or domain you want to model (e.g., banking system, e-commerce platform, healthcare system).
2. Identify the key entities or aggregates in the system. For each aggregate:
   - Specify the commands it can handle (e.g., CreateAccount, PlaceOrder).
   - Specify the events it can emit (e.g., AccountCreated, OrderPlaced).
3. Define the actors or users interacting with the system. For each actor:
   - Specify the commands they can invoke (e.g., RegisterCustomer, MakePayment).
   - Specify the projectors they can read for retrieving information (e.g., ViewAccountBalance, ViewOrderStatus).
4. Determine the contexts in the system. A context is a grouping of related aggregates, actors, and policies. Specify the artifacts included in each context.
5. Define the policies that govern the behavior of the system. For each policy:
   - Specify the events it can handle (e.g., HandleOrderCancelled, HandlePaymentReceived).
   - Specify the commands it can invoke (e.g., ProcessOrder, RefundPayment).
   - Specify the projectors it can read for retrieving information (e.g., ReadProductCatalog, ReadCustomerProfile).
6. Establish the associations between actors and artifacts:
   - Specify the commands actors can invoke on aggregates.
   - Specify the projectors actors can read to make decisions or retrieve information.
7. Arrange the statements in the ESML model, following the grammar provided, ensuring proper indentation and readability.
8. Optionally, include comments using the "#" symbol to provide additional explanations or context.
9. Save the generated ESML model as a text file or document for sharing and future reference.
10. Don't use parenthesis or keywords not defined in the grammar.
11. In ESML, associations are implicit, don't create association statements.
12. Make sure you include projector statements.
13. In ESML, projectors handle events, not aggregates.

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
