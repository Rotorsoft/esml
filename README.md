# ESML

ESML, which stands for `Event Storming Modeling Language`, aims to create a user-friendly JSON schema that accurately describes the components of Event Storming Models with a level of detail that enables precise rendering of diagrams.

## Instructions

1. Start by specifying the system or domain you want to model (e.g., banking system, e-commerce platform, healthcare system).
2. Identify the key entities or aggregates in the system. For each aggregate:
   - Specify the commands it can handle (e.g., CreateAccount, PlaceOrder).
   - Specify the events it can emit (e.g., AccountCreated, OrderPlaced).
3. Define the actors or users interacting with the system. For each command:
   - Specify the actors
   - Specify the projectors they read for retrieving information (e.g., ViewAccountBalance, ViewOrderStatus).
4. Determine the contexts in the system. A context is a grouping of related aggregates, actors, and policies. Specify the artifacts included in each context.
5. Define the policies that govern the behavior of the system. For each policy:
   - Specify the events it can handle (e.g., HandleOrderCancelled, HandlePaymentReceived).
   - Specify the commands it can invoke (e.g., ProcessOrder, RefundPayment).

## API

- To render the SVG model

  ```typescript
  esml(code: string, scale: number) => { error?: Error; svg?: string; width?: number; height?: number };
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

[WorkDesk Ticket Service](./wolfdesk.json5)
