# ESML

ESML, which stands for `Event Storming Modeling Language`, aims to create a user-friendly grammar that accurately describes the components of Event Storming Models with a level of detail that enables precise rendering of diagrams.

## Grammar

- `comment` ::= "#" [^\\n]\* "\\n"
- `name` ::= [a-zA-Z] [a-zA-Z0-9]\*
- `names` ::= `name` {"," `name`}\*
- `actor` ::= "actor" `name` ["invokes" `names`]\*
- `aggregate` ::= "aggregate" `name` { ["handles" `names`] | ["emits" `names`] }\*
- `system` ::= "system" `name` { ["handles" `names`] | ["emits" `names`] }\*
- `policy` ::= "policy" `name` { ["handles" `names`] | ["invokes" `names`] }\*
- `process` ::= "process" `name` { ["handles" `names`] | ["invokes" `names`] }\*
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

<https://cdn.jsdelivr.net/npm/@rotorsoft/esml/dist/canvas.min.js>
<https://unpkg.com/@rotorsoft/esml/dist/canvas.js>

## Sample Model

```bash
actor Customer invokes BookRoom
actor HotelManager invokes OpenRoom

aggregate Room
  handles OpenRoom,   BookRoom, CleanRoom
  emits RoomOpened, RoomBooked,RoomCleaned

  projector Hotel

policy AVeryLongPolicyName
  handles RoomBooked
  invokes CleanRoom

projector

Hotel
  handles   RoomOpened,  RoomBooked



policy OrderPolicy
    handles RoomBooked
  invokes PlaceOrder

aggregate Order
   handles PlaceOrder
  emits   OrderPlaced

  context HotelService
  includes Customer,  HotelManager,Room,AVeryLongPolicyName, Hotel

context OrderService
  includes Order,, , OrderPolicy

context AThirdService includes AThirdPolicy

policy AThirdPolicy handles AThirdEvent,AnotherOne
```
