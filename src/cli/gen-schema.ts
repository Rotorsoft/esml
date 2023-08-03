#!/usr/bin/env node

import { zodToJsonSchema } from "zod-to-json-schema";
import { Grammar } from "../schema";

const schema = zodToJsonSchema(Grammar, "esml");
console.log(JSON.stringify(schema, null, 2));
